from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from app.db.models import User
from app.dependencies.auth import get_current_user
from app.models.plan import PlanCreate, PlanImport, PlanRead, PlanUpdate
from app.services import plan_service
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
def create_plan(payload: PlanCreate, current_user: User = Depends(get_current_user)) -> PlanRead:
    return plan_service.create_plan(user_data_dir(current_user.id), payload)


@router.post(
    "/import",
    response_model=PlanRead,
    status_code=status.HTTP_201_CREATED,
    summary="Import a plan from an exported JSON file",
)
def import_plan(payload: PlanImport, current_user: User = Depends(get_current_user)) -> PlanRead:
    return plan_service.import_plan(user_data_dir(current_user.id), payload)


@router.get("/{plan_id}", response_model=PlanRead, summary="Get a plan by ID")
def get_plan(plan_id: str, current_user: User = Depends(get_current_user)) -> PlanRead:
    plan = plan_service.get_plan(user_data_dir(current_user.id), plan_id)
    if plan is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")
    return plan


@router.patch("/{plan_id}", response_model=PlanRead, summary="Update a plan")
def update_plan(
    plan_id: str, payload: PlanUpdate, current_user: User = Depends(get_current_user)
) -> PlanRead:
    plan = plan_service.update_plan(user_data_dir(current_user.id), plan_id, payload)
    if plan is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")
    return plan


@router.post(
    "/{plan_id}/duplicate",
    response_model=PlanRead,
    status_code=status.HTTP_201_CREATED,
    summary="Duplicate a plan",
)
def duplicate_plan(plan_id: str, current_user: User = Depends(get_current_user)) -> PlanRead:
    copy = plan_service.duplicate_plan(user_data_dir(current_user.id), plan_id)
    if copy is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")
    return copy


@router.delete("/{plan_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a plan")
def delete_plan(plan_id: str, current_user: User = Depends(get_current_user)) -> None:
    deleted = plan_service.delete_plan(user_data_dir(current_user.id), plan_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")
