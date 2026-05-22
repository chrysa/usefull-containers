from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field, model_validator


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


class PlanImport(BaseModel):
    """Accepts the JSON produced by the Export JSON button.

    The ``id``, ``created_at`` and ``updated_at`` fields are optional and
    ignored so that re-importing an export always creates a fresh copy.
    """

    name: str = Field(min_length=1, max_length=200)
    description: str = ""
    target_items: list[TargetItem] = []
    linked_blueprints: list[str] = []
    # Optional fields from the exported Plan shape — silently ignored
    id: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    @model_validator(mode="before")
    @classmethod
    def _strip_readonly_fields(cls, values: object) -> object:
        if isinstance(values, dict):
            values.pop("id", None)
            values.pop("created_at", None)
            values.pop("updated_at", None)
        return values
