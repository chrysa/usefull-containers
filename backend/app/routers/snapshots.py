from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import User
from app.db.session import get_session
from app.dependencies.auth import get_current_user
from app.models.snapshot import SnapshotCreate, SnapshotRead
from app.services import audit_service, snapshot_service

router = APIRouter(
    prefix="/snapshots",
    tags=["snapshots"],
    dependencies=[Depends(get_current_user)],
)


@router.post(
    "",
    response_model=SnapshotRead,
    status_code=status.HTTP_201_CREATED,
    summary="Persist a reduced .sav snapshot for the current user",
)
async def create_snapshot(
    payload: SnapshotCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> SnapshotRead:
    # Stage both the snapshot row and the audit event in a single unit of work
    # so a partial failure cannot leave a snapshot without an audit trail.
    snapshot = await snapshot_service.create(
        session, user_id=current_user.id, payload=payload, commit=False
    )
    await audit_service.record_event(
        session,
        user_id=current_user.id,
        action="create",
        resource_type="snapshot",
        resource_id=snapshot.id,
        commit=False,
    )
    await session.commit()
    await session.refresh(snapshot)
    return SnapshotRead.model_validate(snapshot)


@router.get(
    "",
    response_model=list[SnapshotRead],
    summary="List the current user's snapshots",
)
async def list_snapshots(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[SnapshotRead]:
    rows = await snapshot_service.list_for_user(session, current_user.id)
    return [SnapshotRead.model_validate(r) for r in rows]


@router.get(
    "/{snapshot_id}",
    response_model=SnapshotRead,
    summary="Get one of the current user's snapshots",
)
async def get_snapshot(
    snapshot_id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> SnapshotRead:
    snapshot = await snapshot_service.get(session, current_user.id, snapshot_id)
    if snapshot is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Snapshot not found")
    return SnapshotRead.model_validate(snapshot)


@router.delete(
    "/{snapshot_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete one of the current user's snapshots",
)
async def delete_snapshot(
    snapshot_id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> None:
    # Stage both the delete and audit event atomically before committing.
    removed = await snapshot_service.delete(
        session, current_user.id, snapshot_id, commit=False
    )
    if not removed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Snapshot not found")
    await audit_service.record_event(
        session,
        user_id=current_user.id,
        action="delete",
        resource_type="snapshot",
        resource_id=snapshot_id,
        commit=False,
    )
    await session.commit()
