from __future__ import annotations

import logging
import shutil
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.constants import (
    BLUEPRINT_CFG_EXT,
    BLUEPRINT_FILE_EXT,
    BLUEPRINT_META_EXT,
    PLANS_FILENAME,
)
from app.db.models import User
from app.services.user_storage import user_blueprints_dir, user_data_dir

logger = logging.getLogger(__name__)

_BLUEPRINT_EXTS = {BLUEPRINT_FILE_EXT, BLUEPRINT_CFG_EXT, BLUEPRINT_META_EXT}


async def _owner_id(session: AsyncSession) -> int | None:
    """Return the lowest-id active user — the V1 owner — or None if no user exists."""
    owner_id: int | None = await session.scalar(
        select(User.id).where(User.is_active.is_(True)).order_by(User.id).limit(1)
    )
    return owner_id


def _migrate_plans(owner_id: int) -> bool:
    """Move the legacy global ``{data_dir}/plans.json`` into the owner's dir.

    Returns True if a file was moved. No-op if the legacy file is absent or the
    owner already has a per-user plans file (never overwrite).
    """
    legacy = Path(settings.data_dir) / PLANS_FILENAME
    if not legacy.is_file():
        return False
    target_dir = Path(user_data_dir(owner_id))
    target = target_dir / PLANS_FILENAME
    if target.exists():
        logger.warning("A-04b migration: %s already exists, leaving legacy %s", target, legacy)
        return False
    target_dir.mkdir(parents=True, exist_ok=True)
    shutil.move(str(legacy), str(target))
    logger.info("A-04b migration: moved legacy plans %s -> %s", legacy, target)
    return True


def _migrate_blueprints(owner_id: int) -> int:
    """Move legacy root-level blueprint files into the owner's per-user dir.

    Only files directly under ``{blueprints_dir}`` with a blueprint extension are
    moved; per-user subdirectories are left untouched. Returns the count moved.
    Existing target files are never overwritten.
    """
    root = Path(settings.blueprints_dir)
    if not root.is_dir():
        return 0
    target_dir = Path(user_blueprints_dir(owner_id))
    moved = 0
    for entry in sorted(root.iterdir()):
        if not entry.is_file():
            continue
        # ``.meta.json`` is a compound suffix; Path.suffix only sees ``.json``.
        is_blueprint = entry.suffix in _BLUEPRINT_EXTS or entry.name.endswith(BLUEPRINT_META_EXT)
        if not is_blueprint:
            continue
        target = target_dir / entry.name
        if target.exists():
            logger.warning("A-04b migration: %s already exists, skipping", target)
            continue
        target_dir.mkdir(parents=True, exist_ok=True)
        shutil.move(str(entry), str(target))
        moved += 1
    if moved:
        logger.info("A-04b migration: moved %d legacy blueprint file(s) to %s", moved, target_dir)
    return moved


async def migrate_legacy_global_store(session: AsyncSession) -> None:
    """One-shot migration of the pre-A-04b global store into the owner's dir.

    Before A-04b, plans and blueprints lived in a single global store shared by
    every authenticated user. This moves that legacy data into the lowest-id
    active user's per-user directory so the V1 owner keeps their data after the
    upgrade. It is idempotent (no-op once the legacy files are gone) and never
    overwrites existing per-user files. Failures are logged, never raised, so a
    migration problem cannot block application startup.
    """
    try:
        owner_id = await _owner_id(session)
        if owner_id is None:
            return  # No user yet to own the legacy data; retry on a later startup.
        _migrate_plans(owner_id)
        _migrate_blueprints(owner_id)
    except Exception:
        logger.exception("A-04b legacy-store migration failed; continuing startup")
