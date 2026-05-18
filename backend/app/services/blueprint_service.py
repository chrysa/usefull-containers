from __future__ import annotations

import io
import json
import zipfile
from datetime import datetime
from pathlib import Path

from app.constants import BLUEPRINT_CFG_EXT, BLUEPRINT_FILE_EXT, BLUEPRINT_META_EXT
from app.models.blueprint import BatchUploadResult, BlueprintColor, BlueprintRead


class BlueprintNotFoundError(Exception):
    pass


class BlueprintDirectoryError(Exception):
    pass


def _parse_cfg(cfg_path: Path) -> tuple[str, int, BlueprintColor | None, dict]:
    """Parse a .sbpcfg JSON file. Returns (description, icon_id, color, raw)."""
    try:
        raw: dict = json.loads(cfg_path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return "", 0, None, {}

    description: str = raw.get("description", "")
    icon_id: int = int(raw.get("iconID", 0))
    color_data = raw.get("color")
    color: BlueprintColor | None = None
    if isinstance(color_data, dict):
        color = BlueprintColor(
            r=float(color_data.get("R", 0.0)),
            g=float(color_data.get("G", 0.0)),
            b=float(color_data.get("B", 0.0)),
            a=float(color_data.get("A", 1.0)),
        )
    return description, icon_id, color, raw


def _read_tags(directory: Path, name: str) -> list[str]:
    """Return tags from the .meta.json sidecar, or empty list if absent."""
    meta_path = directory / f"{name}{BLUEPRINT_META_EXT}"
    if not meta_path.exists():
        return []
    try:
        data = json.loads(meta_path.read_text(encoding="utf-8"))
        raw_tags = data.get("tags", [])
        return [str(t) for t in raw_tags if isinstance(t, str)]
    except (json.JSONDecodeError, OSError):
        return []


def list_blueprints(blueprints_dir: str) -> list[BlueprintRead]:
    """Scan blueprints_dir and return all blueprint metadata."""
    directory = Path(blueprints_dir)
    if not directory.exists():
        return []
    if not directory.is_dir():
        raise BlueprintDirectoryError(f"{blueprints_dir} is not a directory")

    # Collect all blueprint names (stems present as .sbp or .sbpcfg)
    names: set[str] = set()
    for f in directory.iterdir():
        if f.suffix in (BLUEPRINT_FILE_EXT, BLUEPRINT_CFG_EXT):
            names.add(f.stem)

    results: list[BlueprintRead] = []
    for name in sorted(names):
        sbp_path = directory / f"{name}{BLUEPRINT_FILE_EXT}"
        cfg_path = directory / f"{name}{BLUEPRINT_CFG_EXT}"

        has_sbp = sbp_path.exists()
        has_cfg = cfg_path.exists()

        description, icon_id, color, cfg_raw = (
            _parse_cfg(cfg_path) if has_cfg else ("", 0, None, None)
        )

        size_bytes = sbp_path.stat().st_size if has_sbp else 0
        modified_at: datetime | None = None
        if has_sbp:
            modified_at = datetime.fromtimestamp(sbp_path.stat().st_mtime)

        results.append(
            BlueprintRead(
                name=name,
                description=description,
                icon_id=icon_id,
                color=color,
                has_sbp=has_sbp,
                has_cfg=has_cfg,
                size_bytes=size_bytes,
                modified_at=modified_at,
                cfg_raw=cfg_raw,
                tags=_read_tags(directory, name),
            )
        )
    return results


def get_blueprint(blueprints_dir: str, name: str) -> BlueprintRead:
    """Return metadata for a single blueprint by name."""
    all_blueprints = list_blueprints(blueprints_dir)
    for bp in all_blueprints:
        if bp.name == name:
            return bp
    raise BlueprintNotFoundError(f"Blueprint '{name}' not found")


def get_sbp_path(blueprints_dir: str, name: str) -> Path:
    """Return Path to the .sbp file, raising BlueprintNotFoundError if absent."""
    path = Path(blueprints_dir) / f"{name}{BLUEPRINT_FILE_EXT}"
    if not path.exists():
        raise BlueprintNotFoundError(f"Blueprint .sbp file '{name}' not found")
    return path


def get_cfg_path(blueprints_dir: str, name: str) -> Path:
    """Return Path to the .sbpcfg file, raising BlueprintNotFoundError if absent."""
    path = Path(blueprints_dir) / f"{name}{BLUEPRINT_CFG_EXT}"
    if not path.exists():
        raise BlueprintNotFoundError(f"Blueprint .sbpcfg file '{name}' not found")
    return path


def save_blueprint(blueprints_dir: str, name: str, sbp_data: bytes, cfg_data: bytes | None) -> bool:
    """
    Write a blueprint to disk. Returns True if created (new), False if overwritten.
    Raises BlueprintDirectoryError if the directory cannot be created.
    """
    directory = Path(blueprints_dir)
    try:
        directory.mkdir(parents=True, exist_ok=True)
    except OSError as exc:
        raise BlueprintDirectoryError(f"Cannot create blueprints directory: {exc}") from exc

    sbp_path = directory / f"{name}{BLUEPRINT_FILE_EXT}"
    is_new = not sbp_path.exists()

    sbp_path.write_bytes(sbp_data)
    if cfg_data is not None:
        cfg_path = directory / f"{name}{BLUEPRINT_CFG_EXT}"
        cfg_path.write_bytes(cfg_data)

    return is_new


def delete_blueprint(blueprints_dir: str, name: str) -> None:
    """Remove a blueprint's .sbp and .sbpcfg files. Raises BlueprintNotFoundError if absent."""
    directory = Path(blueprints_dir)
    sbp_path = directory / f"{name}{BLUEPRINT_FILE_EXT}"
    cfg_path = directory / f"{name}{BLUEPRINT_CFG_EXT}"

    if not sbp_path.exists() and not cfg_path.exists():
        raise BlueprintNotFoundError(f"Blueprint '{name}' not found")

    if sbp_path.exists():
        sbp_path.unlink()
    if cfg_path.exists():
        cfg_path.unlink()
    meta_path = directory / f"{name}{BLUEPRINT_META_EXT}"
    if meta_path.exists():
        meta_path.unlink()


def build_blueprints_zip(blueprints_dir: str) -> bytes:
    """
    Pack all .sbp and .sbpcfg files from blueprints_dir into a ZIP archive.
    Returns the raw ZIP bytes. Returns an empty ZIP when the directory is empty.
    Raises BlueprintDirectoryError if blueprints_dir is not a directory.
    """
    directory = Path(blueprints_dir)
    if directory.exists() and not directory.is_dir():
        raise BlueprintDirectoryError(f"{blueprints_dir} is not a directory")

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
        if directory.exists():
            for file in sorted(directory.iterdir()):
                if file.suffix in {BLUEPRINT_FILE_EXT, BLUEPRINT_CFG_EXT}:
                    zf.write(file, arcname=file.name)
    return buf.getvalue()


def save_blueprint_batch(
    blueprints_dir: str,
    files: dict[str, bytes],
) -> BatchUploadResult:
    """
    Save multiple blueprints at once.

    ``files`` maps filenames (e.g. ``"iron-smelter.sbp"``) to their raw bytes.
    The function pairs each ``.sbp`` with its optional ``.sbpcfg`` by stem.
    Files with an unexpected extension are silently ignored.

    Returns a :class:`BatchUploadResult` summarising created/updated/failed names.
    """
    from pathlib import Path as _Path

    # Group by stem: collect sbp + optional cfg
    sbp_map: dict[str, bytes] = {}
    cfg_map: dict[str, bytes] = {}

    for filename, data in files.items():
        p = _Path(filename)
        if p.suffix == BLUEPRINT_FILE_EXT:
            sbp_map[p.stem] = data
        elif p.suffix == BLUEPRINT_CFG_EXT:
            cfg_map[p.stem] = data

    created: list[str] = []
    updated: list[str] = []
    failed: list[str] = []

    for name, sbp_data in sbp_map.items():
        try:
            is_new = save_blueprint(blueprints_dir, name, sbp_data, cfg_map.get(name))
            (created if is_new else updated).append(name)
        except BlueprintDirectoryError:
            failed.append(name)

    total = len(created) + len(updated) + len(failed)
    return BatchUploadResult(created=created, updated=updated, failed=failed, total=total)


class InvalidZipError(Exception):
    pass


def extract_zip_to_batch(zip_data: bytes, max_file_size: int) -> dict[str, bytes]:
    """
    Extract blueprint files from a ZIP archive in memory.

    Returns a ``{filename: bytes}`` mapping containing only ``.sbp`` and
    ``.sbpcfg`` files. Files larger than *max_file_size* bytes are silently
    skipped.  Nested directories are flattened (basename only).

    Raises :exc:`InvalidZipError` when *zip_data* is not a valid ZIP archive.
    """
    try:
        zf = zipfile.ZipFile(io.BytesIO(zip_data))
    except zipfile.BadZipFile as exc:
        raise InvalidZipError("Uploaded file is not a valid ZIP archive") from exc

    result: dict[str, bytes] = {}
    for entry in zf.infolist():
        if entry.is_dir():
            continue
        name = Path(entry.filename).name  # strip directory components
        if Path(name).suffix not in {BLUEPRINT_FILE_EXT, BLUEPRINT_CFG_EXT}:
            continue
        if entry.file_size > max_file_size:
            continue
        result[name] = zf.read(entry.filename)
    return result


def set_tags(blueprints_dir: str, name: str, tags: list[str]) -> BlueprintRead:
    """
    Persist *tags* for a blueprint in its .meta.json sidecar, then return
    the updated :class:`BlueprintRead`.

    Raises :exc:`BlueprintNotFoundError` when no .sbp or .sbpcfg file exists
    for *name*.
    """
    directory = Path(blueprints_dir)
    sbp_path = directory / f"{name}{BLUEPRINT_FILE_EXT}"
    cfg_path = directory / f"{name}{BLUEPRINT_CFG_EXT}"

    if not sbp_path.exists() and not cfg_path.exists():
        raise BlueprintNotFoundError(f"Blueprint '{name}' not found")

    meta_path = directory / f"{name}{BLUEPRINT_META_EXT}"
    # Read existing sidecar to preserve future fields, then update tags
    try:
        existing: dict = (
            json.loads(meta_path.read_text(encoding="utf-8")) if meta_path.exists() else {}
        )
    except (json.JSONDecodeError, OSError):
        existing = {}
    existing["tags"] = tags
    meta_path.write_text(json.dumps(existing, ensure_ascii=False), encoding="utf-8")

    return get_blueprint(blueprints_dir, name)


def update_description(blueprints_dir: str, name: str, description: str) -> BlueprintRead:
    """
    Update the description field in the .sbpcfg JSON file for *name*.

    If no .sbpcfg exists, a minimal one is created.  Raises
    :exc:`BlueprintNotFoundError` when neither .sbp nor .sbpcfg are present.
    """
    directory = Path(blueprints_dir)
    sbp_path = directory / f"{name}{BLUEPRINT_FILE_EXT}"
    cfg_path = directory / f"{name}{BLUEPRINT_CFG_EXT}"

    if not sbp_path.exists() and not cfg_path.exists():
        raise BlueprintNotFoundError(f"Blueprint '{name}' not found")

    try:
        existing: dict = (
            json.loads(cfg_path.read_text(encoding="utf-8")) if cfg_path.exists() else {}
        )
    except (json.JSONDecodeError, OSError):
        existing = {}

    existing["description"] = description
    cfg_path.write_text(json.dumps(existing, ensure_ascii=False), encoding="utf-8")

    return get_blueprint(blueprints_dir, name)
