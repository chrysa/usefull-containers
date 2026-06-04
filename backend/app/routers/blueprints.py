from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.constants import BLUEPRINTS_ZIP_FILENAME, MAX_BLUEPRINT_SIZE_BYTES
from app.db.models import User
from app.db.session import get_session
from app.dependencies.auth import get_current_user
from app.models.blueprint import (
    BatchUploadResult,
    BlueprintDescriptionUpdate,
    BlueprintList,
    BlueprintRead,
    BlueprintTagsUpdate,
    BlueprintUploadResult,
)
from app.services import audit_service
from app.services.blueprint_service import (
    BlueprintDirectoryError,
    BlueprintNotFoundError,
    InvalidZipError,
    build_blueprints_zip,
    delete_blueprint,
    extract_zip_to_batch,
    get_blueprint,
    get_cfg_path,
    get_sbp_path,
    list_blueprints,
    save_blueprint,
    save_blueprint_batch,
    set_tags,
    update_description,
)
from app.services.user_storage import user_blueprints_dir

router = APIRouter(
    prefix="/blueprints",
    tags=["blueprints"],
    dependencies=[Depends(get_current_user)],
)


@router.get("", response_model=BlueprintList, status_code=200)
async def list_all_blueprints(
    current_user: User = Depends(get_current_user),
) -> BlueprintList:
    """List all blueprints owned by the current user."""
    try:
        blueprints = list_blueprints(user_blueprints_dir(current_user.id))
    except BlueprintDirectoryError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return BlueprintList(blueprints=blueprints, total=len(blueprints))


@router.get("/download-all", status_code=200)
async def download_all_blueprints(
    current_user: User = Depends(get_current_user),
) -> Response:
    """
    Download all of the current user's blueprints as a single ZIP archive.
    Useful for syncing an entire blueprint collection to a new device
    (e.g. Steam Deck ↔ Windows PC).
    """
    try:
        zip_bytes = build_blueprints_zip(user_blueprints_dir(current_user.id))
    except BlueprintDirectoryError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return Response(
        content=zip_bytes,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{BLUEPRINTS_ZIP_FILENAME}"'},
    )


@router.get("/{name}", response_model=BlueprintRead, status_code=200)
async def get_blueprint_detail(
    name: str, current_user: User = Depends(get_current_user)
) -> BlueprintRead:
    """Return metadata for a single blueprint."""
    try:
        return get_blueprint(user_blueprints_dir(current_user.id), name)
    except BlueprintNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except BlueprintDirectoryError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/{name}/download", status_code=200)
async def download_blueprint(
    name: str, current_user: User = Depends(get_current_user)
) -> FileResponse:
    """Download the .sbp binary file for a blueprint."""
    try:
        path = get_sbp_path(user_blueprints_dir(current_user.id), name)
    except BlueprintNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return FileResponse(
        path=str(path),
        media_type="application/octet-stream",
        filename=path.name,
    )


@router.get("/{name}/download-cfg", status_code=200)
async def download_blueprint_cfg(
    name: str, current_user: User = Depends(get_current_user)
) -> FileResponse:
    """Download the .sbpcfg binary file for a blueprint."""
    try:
        path = get_cfg_path(user_blueprints_dir(current_user.id), name)
    except BlueprintNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return FileResponse(
        path=str(path),
        media_type="application/octet-stream",
        filename=path.name,
    )


@router.post("/upload-batch", response_model=BatchUploadResult, status_code=207)
async def upload_blueprint_batch(
    files: Annotated[list[UploadFile] | None, File()] = None,
    current_user: User = Depends(get_current_user),
) -> BatchUploadResult:
    """
    Upload multiple blueprints at once (multi-file form upload).
    Accepts any mix of .sbp and .sbpcfg files; pairs are matched by stem.
    Files with other extensions are ignored.
    Returns HTTP 207 with per-name created/updated/failed lists.
    """
    if files is None:
        files = []
    batch: dict[str, bytes] = {}
    for upload in files:
        if upload.filename is None:
            continue
        data = await upload.read()
        if len(data) > MAX_BLUEPRINT_SIZE_BYTES:
            continue  # silently skip oversized files
        batch[upload.filename] = data

    try:
        result = save_blueprint_batch(user_blueprints_dir(current_user.id), batch)
    except BlueprintDirectoryError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return result


@router.post("/import-zip", response_model=BatchUploadResult, status_code=207)
async def import_blueprints_from_zip(
    zip_file: UploadFile, current_user: User = Depends(get_current_user)
) -> BatchUploadResult:
    """
    Import blueprints from a ZIP archive (e.g. a file previously downloaded via
    the ``/download-all`` endpoint).  All ``.sbp`` and ``.sbpcfg`` entries are
    extracted and saved; other file types inside the ZIP are ignored.
    Returns HTTP 207 with per-name created/updated/failed lists.
    """
    data = await zip_file.read()
    try:
        batch = extract_zip_to_batch(data, MAX_BLUEPRINT_SIZE_BYTES)
    except InvalidZipError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    try:
        result = save_blueprint_batch(user_blueprints_dir(current_user.id), batch)
    except BlueprintDirectoryError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return result


@router.post("", response_model=BlueprintUploadResult, status_code=201)
async def upload_blueprint(
    sbp_file: UploadFile,
    cfg_file: UploadFile | None = None,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> BlueprintUploadResult:
    """
    Upload a blueprint (.sbp required, .sbpcfg optional).
    The blueprint name is derived from the uploaded filename (stem).
    """
    if sbp_file.filename is None:
        raise HTTPException(status_code=422, detail="sbp_file must have a filename")

    from pathlib import Path as _Path

    name = _Path(sbp_file.filename).stem
    if not name:
        raise HTTPException(status_code=422, detail="Blueprint name cannot be empty")

    sbp_data = await sbp_file.read()
    if len(sbp_data) > MAX_BLUEPRINT_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"Blueprint file exceeds maximum size of {MAX_BLUEPRINT_SIZE_BYTES} bytes",
        )

    cfg_data: bytes | None = None
    if cfg_file is not None:
        cfg_data = await cfg_file.read()

    try:
        is_new = save_blueprint(user_blueprints_dir(current_user.id), name, sbp_data, cfg_data)
    except BlueprintDirectoryError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    await audit_service.record_event(
        session,
        user_id=current_user.id,
        action="create" if is_new else "update",
        resource_type="blueprint",
        resource_id=name,
    )
    return BlueprintUploadResult(name=name, created=is_new)


@router.delete("/{name}", status_code=204)
async def remove_blueprint(
    name: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> None:
    """Delete a blueprint's .sbp and .sbpcfg files."""
    try:
        delete_blueprint(user_blueprints_dir(current_user.id), name)
    except BlueprintNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except BlueprintDirectoryError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    await audit_service.record_event(
        session,
        user_id=current_user.id,
        action="delete",
        resource_type="blueprint",
        resource_id=name,
    )


@router.patch("/{name}", response_model=BlueprintRead, status_code=200)
async def update_blueprint_description(
    name: str,
    body: BlueprintDescriptionUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> BlueprintRead:
    """Update the description of a blueprint (writes into the .sbpcfg sidecar)."""
    try:
        result = update_description(user_blueprints_dir(current_user.id), name, body.description)
    except BlueprintNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except BlueprintDirectoryError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    await audit_service.record_event(
        session,
        user_id=current_user.id,
        action="update",
        resource_type="blueprint",
        resource_id=name,
    )
    return result


@router.patch("/{name}/tags", response_model=BlueprintRead, status_code=200)
async def update_blueprint_tags(
    name: str,
    body: BlueprintTagsUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> BlueprintRead:
    """Replace the tag list for a blueprint. Creates or overwrites the .meta.json sidecar."""
    try:
        result = set_tags(user_blueprints_dir(current_user.id), name, body.tags)
    except BlueprintNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    await audit_service.record_event(
        session,
        user_id=current_user.id,
        action="update",
        resource_type="blueprint",
        resource_id=name,
    )
    return result
