from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import FactorySnapshot
from app.models.snapshot import SnapshotCreate


async def create(
    session: AsyncSession, *, user_id: int, payload: SnapshotCreate
) -> FactorySnapshot:
    """Persist a reduced snapshot for a user."""
    snapshot = FactorySnapshot(
        user_id=user_id,
        name=payload.name,
        save_name=payload.data.save_name,
        play_time=payload.data.play_time,
        data=payload.data.model_dump(mode="json"),
    )
    session.add(snapshot)
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


async def get(
    session: AsyncSession, user_id: int, snapshot_id: str
) -> FactorySnapshot | None:
    """Return one snapshot owned by the user, or None."""
    result = await session.scalars(
        select(FactorySnapshot).where(
            FactorySnapshot.id == snapshot_id,
            FactorySnapshot.user_id == user_id,
        )
    )
    return result.one_or_none()


async def delete(
    session: AsyncSession, user_id: int, snapshot_id: str
) -> bool:
    """Delete one snapshot owned by the user. Returns True if a row was removed."""
    snapshot = await get(session, user_id, snapshot_id)
    if snapshot is None:
        return False
    await session.delete(snapshot)
    await session.commit()
    return True
