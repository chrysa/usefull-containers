from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import User
from app.db.session import get_session
from app.dependencies.auth import get_current_user
from app.models.audit import AuditLogRead
from app.services import audit_service

router = APIRouter(
    prefix="/audit",
    tags=["audit"],
    dependencies=[Depends(get_current_user)],
)


@router.get(
    "",
    response_model=list[AuditLogRead],
    summary="List the current user's recent plan/blueprint mutations",
)
async def list_audit(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[AuditLogRead]:
    rows = await audit_service.list_for_user(session, current_user.id)
    return [AuditLogRead.model_validate(r) for r in rows]
