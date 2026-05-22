from __future__ import annotations

import json
import uuid
from datetime import UTC, datetime
from pathlib import Path

from app.constants import PLANS_FILENAME
from app.models.plan import PlanCreate, PlanImport, PlanRead, PlanUpdate


def _plans_path(data_dir: str) -> Path:
    path = Path(data_dir)
    path.mkdir(parents=True, exist_ok=True)
    return path / PLANS_FILENAME


def _load_plans(data_dir: str) -> list[dict]:  # type: ignore[type-arg]
    p = _plans_path(data_dir)
    if not p.exists():
        return []
    with p.open(encoding="utf-8") as f:
        return json.load(f)  # type: ignore[no-any-return]


def _save_plans(data_dir: str, plans: list[dict]) -> None:  # type: ignore[type-arg]
    p = _plans_path(data_dir)
    with p.open("w", encoding="utf-8") as f:
        json.dump(plans, f, indent=2, default=str)


def list_plans(data_dir: str) -> list[PlanRead]:
    raw = _load_plans(data_dir)
    return [PlanRead.model_validate(r) for r in raw]


def get_plan(data_dir: str, plan_id: str) -> PlanRead | None:
    raw = _load_plans(data_dir)
    for r in raw:
        if r["id"] == plan_id:
            return PlanRead.model_validate(r)
    return None


def create_plan(data_dir: str, payload: PlanCreate) -> PlanRead:
    now = datetime.now(UTC)
    plan = PlanRead(
        id=str(uuid.uuid4()),
        name=payload.name,
        description=payload.description,
        target_items=payload.target_items,
        linked_blueprints=payload.linked_blueprints,
        created_at=now,
        updated_at=now,
    )
    raw = _load_plans(data_dir)
    raw.append(plan.model_dump(mode="json"))
    _save_plans(data_dir, raw)
    return plan


def update_plan(data_dir: str, plan_id: str, payload: PlanUpdate) -> PlanRead | None:
    raw = _load_plans(data_dir)
    for i, r in enumerate(raw):
        if r["id"] == plan_id:
            if payload.name is not None:
                r["name"] = payload.name
            if payload.description is not None:
                r["description"] = payload.description
            if payload.target_items is not None:
                r["target_items"] = [ti.model_dump(mode="json") for ti in payload.target_items]
            if payload.linked_blueprints is not None:
                r["linked_blueprints"] = payload.linked_blueprints
            r["updated_at"] = datetime.now(UTC).isoformat()
            raw[i] = r
            _save_plans(data_dir, raw)
            return PlanRead.model_validate(r)
    return None


def duplicate_plan(data_dir: str, plan_id: str) -> PlanRead | None:
    original = get_plan(data_dir, plan_id)
    if original is None:
        return None
    now = datetime.now(UTC)
    copy = PlanRead(
        id=str(uuid.uuid4()),
        name=f"{original.name} (copy)",
        description=original.description,
        target_items=original.target_items,
        linked_blueprints=original.linked_blueprints,
        created_at=now,
        updated_at=now,
    )
    raw = _load_plans(data_dir)
    raw.append(copy.model_dump(mode="json"))
    _save_plans(data_dir, raw)
    return copy


def delete_plan(data_dir: str, plan_id: str) -> bool:
    raw = _load_plans(data_dir)
    filtered = [r for r in raw if r["id"] != plan_id]
    if len(filtered) == len(raw):
        return False
    _save_plans(data_dir, filtered)
    return True


def import_plan(data_dir: str, payload: PlanImport) -> PlanRead:
    create_payload = PlanCreate(
        name=payload.name,
        description=payload.description,
        target_items=payload.target_items,
        linked_blueprints=payload.linked_blueprints,
    )
    return create_plan(data_dir, create_payload)
