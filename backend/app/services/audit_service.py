from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import AuditLog


async def record_event(
    session: AsyncSession,
    *,
    user_id: int,
    action: str,
    resource_type: str,
    resource_id: str,
    commit: bool = True,
) -> None:
    """Stage (and optionally commit) an audit entry for a user mutation (A-07).

    Pass ``commit=False`` when the caller batches multiple operations in a
    single unit of work and will call ``await session.commit()`` itself.
    """
    session.add(
        AuditLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=str(resource_id),
        )
    )
    if commit:
        await session.commit()


async def list_for_user(session: AsyncSession, user_id: int, limit: int = 200) -> list[AuditLog]:
    """Return a user's own audit entries, most recent first."""
    result = await session.scalars(
        select(AuditLog)
        .where(AuditLog.user_id == user_id)
        .order_by(AuditLog.created_at.desc(), AuditLog.id.desc())
        .limit(limit)
    )
    return list(result)
