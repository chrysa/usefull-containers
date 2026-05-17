from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class TargetItem(BaseModel):
    item_id: str
    quantity: float = Field(gt=0, description="Items per minute")


class PlanCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str = ""
    target_items: list[TargetItem] = []
    linked_blueprints: list[str] = []


class PlanRead(BaseModel):
    id: str
    name: str
    description: str
    target_items: list[TargetItem]
    linked_blueprints: list[str]
    created_at: datetime
    updated_at: datetime


class PlanUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    target_items: list[TargetItem] | None = None
    linked_blueprints: list[str] | None = None
