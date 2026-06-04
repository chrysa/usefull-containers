from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import User
from app.db.session import get_session
from app.dependencies.auth import get_current_user
from app.models.plan import PlanCreate, PlanImport, PlanRead, PlanUpdate
from app.services import audit_service, plan_service
from app.services.user_storage import user_data_dir

router = APIRouter(
    prefix="/plans",
    tags=["plans"],
    dependencies=[Depends(get_current_user)],
)


@router.get("", response_model=list[PlanRead], summary="List all factory plans")
def list_plans(current_user: User = Depends(get_current_user)) -> list[PlanRead]:
    return plan_service.list_plans(user_data_dir(current_user.id))


@router.post(
    "",
    response_model=PlanRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create a plan",
)
async def create_plan(
    payload: PlanCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> PlanRead:
    plan = plan_service.create_plan(user_data_dir(current_user.id), payload)
    await audit_service.record_event(
        session, user_id=current_user.id, action="create", resource_type="plan", resource_id=plan.id
    )
    return plan


@router.post(
    "/import",
    response_model=PlanRead,
    status_code=status.HTTP_201_CREATED,
    summary="Import a plan from an exported JSON file",
)
async def import_plan(
    payload: PlanImport,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> PlanRead:
    plan = plan_service.import_plan(user_data_dir(current_user.id), payload)
    await audit_service.record_event(
        session, user_id=current_user.id, action="create", resource_type="plan", resource_id=plan.id
    )
    return plan


@router.get("/{plan_id}", response_model=PlanRead, summary="Get a plan by ID")
def get_plan(plan_id: str, current_user: User = Depends(get_current_user)) -> PlanRead:
    plan = plan_service.get_plan(user_data_dir(current_user.id), plan_id)
    if plan is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")
    return plan


@router.patch("/{plan_id}", response_model=PlanRead, summary="Update a plan")
async def update_plan(
    plan_id: str,
    payload: PlanUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> PlanRead:
    plan = plan_service.update_plan(user_data_dir(current_user.id), plan_id, payload)
    if plan is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")
    await audit_service.record_event(
        session, user_id=current_user.id, action="update", resource_type="plan", resource_id=plan_id
    )
    return plan


@router.post(
    "/{plan_id}/duplicate",
    response_model=PlanRead,
    status_code=status.HTTP_201_CREATED,
    summary="Duplicate a plan",
)
async def duplicate_plan(
    plan_id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> PlanRead:
    copy = plan_service.duplicate_plan(user_data_dir(current_user.id), plan_id)
    if copy is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")
    await audit_service.record_event(
        session, user_id=current_user.id, action="create", resource_type="plan", resource_id=copy.id
    )
    return copy


@router.delete("/{plan_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a plan")
async def delete_plan(
    plan_id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> None:
    deleted = plan_service.delete_plan(user_data_dir(current_user.id), plan_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")
    await audit_service.record_event(
        session, user_id=current_user.id, action="delete", resource_type="plan", resource_id=plan_id
    )
