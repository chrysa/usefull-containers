from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import FactorySnapshot
from app.models.snapshot import SnapshotCreate


async def create(
    session: AsyncSession,
    *,
    user_id: int,
    payload: SnapshotCreate,
    commit: bool = True,
) -> FactorySnapshot:
    """Stage (and optionally commit) a reduced snapshot for a user.

    Pass ``commit=False`` when the caller needs to stage additional work in the
    same unit of work before committing (e.g. an audit event).  The caller is
    then responsible for calling ``await session.commit()`` and
    ``await session.refresh(snapshot)`` itself.
    """
    snapshot = FactorySnapshot(
        user_id=user_id,
        name=payload.name,
        save_name=payload.data.save_name,
        play_time=payload.data.play_time,
        data=payload.data.model_dump(mode="json"),
    )
    session.add(snapshot)
    if commit:
        await session.commit()
        await session.refresh(snapshot)
    return snapshot


async def list_for_user(
    session: AsyncSession, user_id: int, limit: int = 100
) -> list[FactorySnapshot]:
    """Return a user's snapshots, most recent first."""
    result = await session.scalars(
        select(FactorySnapshot)
        .where(FactorySnapshot.user_id == user_id)
        .order_by(FactorySnapshot.imported_at.desc(), FactorySnapshot.id.desc())
        .limit(limit)
    )
    return list(result)


async def get(session: AsyncSession, user_id: int, snapshot_id: str) -> FactorySnapshot | None:
    """Return one snapshot owned by the user, or None."""
    result = await session.scalars(
        select(FactorySnapshot).where(
            FactorySnapshot.id == snapshot_id,
            FactorySnapshot.user_id == user_id,
        )
    )
    return result.one_or_none()


async def delete(
    session: AsyncSession,
    user_id: int,
    snapshot_id: str,
    commit: bool = True,
) -> bool:
    """Stage (and optionally commit) deletion of a snapshot owned by the user.

    Returns True if a row was found and staged for removal.
    Pass ``commit=False`` when the caller stages additional work (e.g. an audit
    event) and will commit everything in a single unit of work.
    """
    snapshot = await get(session, user_id, snapshot_id)
    if snapshot is None:
        return False
    await session.delete(snapshot)
    if commit:
        await session.commit()
    return True
