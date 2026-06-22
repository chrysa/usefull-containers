# SFM L9 — `.sav` Import & "Planned vs Actual" Diff — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a player drop a Satisfactory `.sav` onto a Plan and see, per recipe, where the factory they built diverges from the factory they planned (missing / over / under / unplanned machines).

**Architecture:** Parsing and the diff run entirely in the browser. `.sav` is parsed with `@etothepii/satisfactory-file-parser` (dynamic import from esm.sh), reduced to a compact snapshot, and persisted via a new auth-gated FastAPI router into a SQLite table. The "planned" side is recomputed in-browser from the Plan's `target_items` using the existing frontend calculator; the "actual" side comes from the reduced snapshot. Both align on the **recipe className** (e.g. `Recipe_IronPlate_C`). The backend is persistence-only — no parsing, no diff logic server-side.

**Tech Stack:** FastAPI + Pydantic v2 + async SQLAlchemy 2.0 + Alembic (SQLite); React 19 + TypeScript (strict) + Vite 6 + TanStack Query v5; Vitest (added by this plan) + Playwright; Docker for all test/lint/build.

---

## Governance & execution rules (NON-NEGOTIABLE)

- **Gate freeze:** This plan must NOT be executed until the V1 gate verdict (due 2026-06-24) passes and "open L9" is the chosen option. Do not start Task 0 before then.
- **Tests/lint/build:** Docker / `make` / pre-commit ONLY. Never run `pytest`, `ruff`, `tsc`, `eslint`, `vitest`, or `npm` on the host. The repo's `execution-guard` hook blocks host runs; the literal word for the test runner even in a grep can trip it — append `# host-ok` to read-only shell that mentions it.
- **English-only** in every committed file (code, comments, docs, i18n English locale).
- **Worktree:** all work happens in the isolated worktree at `.claude/worktrees/l9-sav-diff-spec` (already created). Commit there.
- **Backend test command:** `docker compose -f docker-compose.test.yml run --rm api-test` (runs `pytest tests/ -v --cov=app --cov-fail-under=85`). To run one test: `docker compose -f docker-compose.test.yml run --rm api-test sh -c "pytest tests/test_X.py -v"`.
- **Frontend unit test command (added in Task 0):** `docker compose -f docker-compose.test.yml run --rm frontend-test`.
- **E2E command:** `make docker-e2e`.

## Spec reference

This plan implements `docs/superpowers/specs/2026-06-21-sfm-l9-sav-diff-design.md`. Read it first for context, decisions, and risk call-outs.

## File structure (what gets created / modified)

**Backend (`backend/`):**
- Create `app/models/snapshot.py` — Pydantic v2 request/response + nested snapshot shapes.
- Modify `app/db/models.py` — add `FactorySnapshot` ORM model.
- Create `alembic/versions/0003_factory_snapshots.py` — `factory_snapshots` table migration.
- Create `app/services/snapshot_service.py` — async, user-scoped CRUD.
- Create `app/routers/snapshots.py` — 4 auth-gated endpoints + audit emission.
- Modify `app/main.py` — register the router.
- Create `tests/test_routers_snapshots.py` — router-level tests (DB-backed).

**Frontend (`frontend/`):**
- Create `src/domain/savefile/types.ts` — `CompactSnapshot` and members.
- Create `src/domain/savefile/reduce.ts` — port the S.A.T. reduction logic (pure).
- Create `src/domain/savefile/reduce.test.ts` — Vitest unit tests.
- Create `src/domain/savefile/parseSave.ts` — esm.sh dynamic import + parse + reduce.
- Create `src/domain/savefile/diff.ts` — planned-vs-actual diff (pure).
- Create `src/domain/savefile/diff.test.ts` — Vitest unit tests.
- Create `src/domain/snapshots/types.ts` — `SnapshotRead` TS mirror.
- Create `src/domain/snapshots/queries.ts` — TanStack Query hooks.
- Create `src/components/plan/RealVsPlanned.tsx` — drop zone + diff table UI.
- Create `src/components/plan/RealVsPlanned.module.scss` — Neon Brutalist styles.
- Modify `src/pages/PlanDetail.tsx` — add a "Réel vs prévu" view toggle hosting the component.
- Modify `src/i18n/locales/en/common.json` and `src/i18n/locales/fr/common.json` — add `real_vs_planned` keys.
- Modify `frontend/package.json` — add Vitest dev deps + `test` script (Task 0).
- Modify `frontend/vite.config.ts` — add the `test` block (Task 0).
- Modify `docker-compose.test.yml` — add `frontend-test` service (Task 0).

**E2E (`tests/e2e/`):**
- Create `tests/e2e/fixtures/sample.snapshot.json` — a reduced-snapshot fixture (see Task 11 note on why JSON, not binary).
- Create `tests/e2e/specs/real-vs-planned.spec.ts` — E2E spec.

---

## Task 0: Add Vitest tooling to the frontend

**Why:** The frontend currently has no unit-test runner (no `vitest`/testing deps, no `test` script, zero `*.test.ts`). The spec mandates Vitest unit tests for `reduce.ts`/`diff.ts`. This task makes that possible, containerized.

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/vite.config.ts`
- Modify: `docker-compose.test.yml`

- [ ] **Step 1: Add Vitest dev dependencies and a `test` script to `frontend/package.json`**

In the `"scripts"` block add `"test": "vitest run --passWithNoTests"` and `"test:watch": "vitest"`:

```json
    "test": "vitest run --passWithNoTests",
    "test:watch": "vitest"
```

In `"devDependencies"` add, placed alphabetically:

```json
    "vitest": "^3.0.0"
```

No jsdom is needed: `reduce.ts` and `diff.ts` are pure modules tested in the default node environment.

- [ ] **Step 2: Add the Vitest config to `frontend/vite.config.ts`**

Add the triple-slash reference as the first line, and a `test` block inside the exported `defineConfig`:

```ts
/// <reference types="vitest/config" />
```

```ts
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
```

- [ ] **Step 3: Add a `frontend-test` service to `docker-compose.test.yml`**

Mirror the existing `frontend-lint` service but run the test script. Add under `services:`:

```yaml
  frontend-test:
    build:
      context: ./frontend
      target: deps
    command: sh -c "npm run test"
    volumes:
    - ./frontend:/app
    - /app/node_modules
    working_dir: /app
```

- [ ] **Step 4: Install deps and verify the runner starts (no tests yet → must exit 0)**

Run: `docker compose -f docker-compose.test.yml build frontend-test`
Then: `docker compose -f docker-compose.test.yml run --rm frontend-test`
Expected: Vitest reports "No test files found" and exits 0 (the `--passWithNoTests` flag guarantees exit 0).

- [ ] **Step 5: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/vite.config.ts docker-compose.test.yml
git commit -m "test(frontend): add containerized Vitest runner for unit tests"
```

---

## Task 1: Backend — snapshot Pydantic models

**Files:**
- Create: `backend/app/models/snapshot.py`

- [ ] **Step 1: Write the models file**

```python
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SnapshotBuilding(BaseModel):
    """One production building extracted from a .sav."""

    machine_id: str  # building class, e.g. "Build_ConstructorMk1_C"
    recipe_id: str | None = None  # recipe class, e.g. "Recipe_IronPlate_C"
    overclock: int = 100  # clock percent (50, 100, 250, ...)
    state: str = "active"  # active|paused|idle|off
    somersloops: int = 0
    floor_id: str | None = None


class SnapshotPowerGrid(BaseModel):
    """One power circuit's balance, for an optional power header."""

    id: int
    production_mw: float = 0.0
    consumption_mw: float = 0.0
    fuse_tripped: bool = False


class CompactSnapshot(BaseModel):
    """Reduced, browser-produced representation of a parsed save."""

    save_name: str
    play_time: float = 0.0
    buildings: list[SnapshotBuilding] = []
    power_grids: list[SnapshotPowerGrid] = []


class SnapshotCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    data: CompactSnapshot


class SnapshotRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    save_name: str
    play_time: float
    imported_at: datetime
    data: CompactSnapshot
```

- [ ] **Step 2: Verify it imports cleanly inside the backend image**

Run: `docker compose -f docker-compose.test.yml run --rm api-test sh -c "python -c 'import app.models.snapshot as m; print(m.SnapshotCreate.model_json_schema()[\"title\"])'"`
Expected: prints `SnapshotCreate`, exit 0.

- [ ] **Step 3: Commit**

```bash
git add backend/app/models/snapshot.py
git commit -m "feat(snapshots): add Pydantic models for factory snapshots"
```

---

## Task 2: Backend — ORM model + Alembic migration

**Files:**
- Modify: `backend/app/db/models.py`
- Create: `backend/alembic/versions/0003_factory_snapshots.py`

- [ ] **Step 1: Add the `FactorySnapshot` ORM model to `backend/app/db/models.py`**

Update the imports at the top of the file to add `JSON`, `Float`, `uuid`, and `Any`:

```python
from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
```

Then append the model at the end of the file:

```python
class FactorySnapshot(Base):
    """A reduced parse of a player's Satisfactory .sav (L9).

    Self-scoped like AuditLog: each user reads only their own snapshots. The
    heavy reduction happens client-side; the backend only persists the result.
    `save_name` and `play_time` are denormalized out of `data` for cheap listing.
    """

    __tablename__ = "factory_snapshots"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), index=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    save_name: Mapped[str] = mapped_column(String(255), nullable=False)
    play_time: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    imported_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )
    data: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
```

- [ ] **Step 2: Create the Alembic migration `backend/alembic/versions/0003_factory_snapshots.py`**

Mirror the `0002_audit_log.py` style exactly:

```python
"""factory snapshots table (L9)

Revision ID: 0003
Revises: 0002
Create Date: 2026-06-22 00:00:00.000000

Persists reduced parses of player .sav files for planned-vs-actual diffs.
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0003"
down_revision: str | Sequence[str] | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "factory_snapshots",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("save_name", sa.String(length=255), nullable=False),
        sa.Column("play_time", sa.Float(), nullable=False, server_default="0"),
        sa.Column(
            "imported_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.current_timestamp(),
        ),
        sa.Column("data", sa.JSON(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_factory_snapshots_user_id", "factory_snapshots", ["user_id"]
    )


def downgrade() -> None:
    op.drop_index("ix_factory_snapshots_user_id", table_name="factory_snapshots")
    op.drop_table("factory_snapshots")
```

- [ ] **Step 3: Verify the migration is reversible (real Alembic, not test_mode)**

Run: `docker compose -f docker-compose.test.yml run --rm api-test sh -c "alembic upgrade head && alembic downgrade -1 && alembic upgrade head"`
Expected: each command exits 0; the final `upgrade head` ends at revision `0003`. No errors.

- [ ] **Step 4: Verify the ORM model is registered (create_all picks it up)**

Run: `docker compose -f docker-compose.test.yml run --rm api-test sh -c "python -c 'from app.db.base import Base; from app.db import models; print(\"factory_snapshots\" in Base.metadata.tables)'"`
Expected: prints `True`.

- [ ] **Step 5: Commit**

```bash
git add backend/app/db/models.py backend/alembic/versions/0003_factory_snapshots.py
git commit -m "feat(snapshots): add FactorySnapshot ORM model + migration 0003"
```

---

## Task 3: Backend — snapshot service (async, user-scoped)

**Files:**
- Create: `backend/app/services/snapshot_service.py`

- [ ] **Step 1: Write the service**

Mirror `audit_service.py` conventions (async, `AsyncSession`, `select`, `await session.commit()`):

```python
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
    session: AsyncSession, user_id: int
) -> list[FactorySnapshot]:
    """Return a user's snapshots, most recent first."""
    result = await session.scalars(
        select(FactorySnapshot)
        .where(FactorySnapshot.user_id == user_id)
        .order_by(FactorySnapshot.imported_at.desc(), FactorySnapshot.id.desc())
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
```

- [ ] **Step 2: Verify it imports cleanly**

Run: `docker compose -f docker-compose.test.yml run --rm api-test sh -c "python -c 'import app.services.snapshot_service as s; print([n for n in dir(s) if not n.startswith(\"_\")])'"`
Expected: list includes `create`, `delete`, `get`, `list_for_user`.

- [ ] **Step 3: Commit**

```bash
git add backend/app/services/snapshot_service.py
git commit -m "feat(snapshots): add async user-scoped snapshot service"
```

---

## Task 4: Backend — snapshots router (TDD via DB-backed tests)

**Files:**
- Create: `backend/app/routers/snapshots.py`
- Modify: `backend/app/main.py`
- Create: `backend/tests/test_routers_snapshots.py`

- [ ] **Step 1: Write the failing router test**

Use the DB-backed `client` fixture (from `tests/conftest.py`) with the real register flow, exactly like `tests/test_audit.py`:

```python
"""L9: factory snapshot CRUD (self-scoped) + audit emission."""

from __future__ import annotations

from fastapi.testclient import TestClient


def _register(client: TestClient, username: str) -> dict[str, str]:
    resp = client.post(
        "/api/v1/auth/register",
        json={"username": username, "password": "pw-12345678"},
    )
    assert resp.status_code == 201
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


def _snapshot_payload() -> dict:
    return {
        "name": "Iron base",
        "data": {
            "save_name": "MyWorld_autosave_0",
            "play_time": 3600.5,
            "buildings": [
                {
                    "machine_id": "Build_ConstructorMk1_C",
                    "recipe_id": "Recipe_IronPlate_C",
                    "overclock": 100,
                    "state": "active",
                    "somersloops": 0,
                    "floor_id": None,
                }
            ],
            "power_grids": [
                {
                    "id": 1,
                    "production_mw": 100.0,
                    "consumption_mw": 40.0,
                    "fuse_tripped": False,
                }
            ],
        },
    }


def test_create_and_get_snapshot(client: TestClient) -> None:
    headers = _register(client, "snapuser1")

    created = client.post("/api/v1/snapshots", json=_snapshot_payload(), headers=headers)
    assert created.status_code == 201
    body = created.json()
    assert body["name"] == "Iron base"
    assert body["save_name"] == "MyWorld_autosave_0"
    assert body["play_time"] == 3600.5
    assert body["data"]["buildings"][0]["recipe_id"] == "Recipe_IronPlate_C"
    snap_id = body["id"]

    got = client.get(f"/api/v1/snapshots/{snap_id}", headers=headers)
    assert got.status_code == 200
    assert got.json()["id"] == snap_id


def test_list_snapshots(client: TestClient) -> None:
    headers = _register(client, "snapuser2")
    client.post("/api/v1/snapshots", json=_snapshot_payload(), headers=headers)
    resp = client.get("/api/v1/snapshots", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1


def test_delete_snapshot(client: TestClient) -> None:
    headers = _register(client, "snapuser3")
    snap_id = client.post(
        "/api/v1/snapshots", json=_snapshot_payload(), headers=headers
    ).json()["id"]
    assert client.delete(f"/api/v1/snapshots/{snap_id}", headers=headers).status_code == 204
    assert client.get(f"/api/v1/snapshots/{snap_id}", headers=headers).status_code == 404


def test_snapshots_are_user_scoped(client: TestClient) -> None:
    headers_a = _register(client, "snapuser_a")
    headers_b = _register(client, "snapuser_b")
    snap_id = client.post(
        "/api/v1/snapshots", json=_snapshot_payload(), headers=headers_a
    ).json()["id"]
    # B cannot see or delete A's snapshot.
    assert client.get(f"/api/v1/snapshots/{snap_id}", headers=headers_b).status_code == 404
    assert client.delete(f"/api/v1/snapshots/{snap_id}", headers=headers_b).status_code == 404
    assert client.get("/api/v1/snapshots", headers=headers_b).json() == []


def test_snapshots_require_auth(client: TestClient) -> None:
    assert client.get("/api/v1/snapshots").status_code == 401
    assert client.post("/api/v1/snapshots", json=_snapshot_payload()).status_code == 401


def test_snapshot_create_is_audited(client: TestClient) -> None:
    headers = _register(client, "snapuser_audit")
    client.post("/api/v1/snapshots", json=_snapshot_payload(), headers=headers)
    entries = client.get("/api/v1/audit", headers=headers).json()
    actions = {(e["action"], e["resource_type"]) for e in entries}
    assert ("create", "snapshot") in actions
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `docker compose -f docker-compose.test.yml run --rm api-test sh -c "pytest tests/test_routers_snapshots.py -v"`
Expected: FAIL — 404s / collection issues because `/api/v1/snapshots` is not registered yet.

- [ ] **Step 3: Write the router `backend/app/routers/snapshots.py`**

Mirror `routers/audit.py` (auth dependency) and `routers/plans.py` audit-emission pattern:

```python
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import User
from app.db.session import get_session
from app.dependencies.auth import get_current_user
from app.models.snapshot import SnapshotCreate, SnapshotRead
from app.services import audit_service, snapshot_service

router = APIRouter(
    prefix="/snapshots",
    tags=["snapshots"],
    dependencies=[Depends(get_current_user)],
)


@router.post(
    "",
    response_model=SnapshotRead,
    status_code=status.HTTP_201_CREATED,
    summary="Persist a reduced .sav snapshot for the current user",
)
async def create_snapshot(
    payload: SnapshotCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> SnapshotRead:
    snapshot = await snapshot_service.create(
        session, user_id=current_user.id, payload=payload
    )
    await audit_service.record_event(
        session,
        user_id=current_user.id,
        action="create",
        resource_type="snapshot",
        resource_id=snapshot.id,
    )
    return SnapshotRead.model_validate(snapshot)


@router.get(
    "",
    response_model=list[SnapshotRead],
    summary="List the current user's snapshots",
)
async def list_snapshots(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[SnapshotRead]:
    rows = await snapshot_service.list_for_user(session, current_user.id)
    return [SnapshotRead.model_validate(r) for r in rows]


@router.get(
    "/{snapshot_id}",
    response_model=SnapshotRead,
    summary="Get one of the current user's snapshots",
)
async def get_snapshot(
    snapshot_id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> SnapshotRead:
    snapshot = await snapshot_service.get(session, current_user.id, snapshot_id)
    if snapshot is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Snapshot not found")
    return SnapshotRead.model_validate(snapshot)


@router.delete(
    "/{snapshot_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete one of the current user's snapshots",
)
async def delete_snapshot(
    snapshot_id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> Response:
    removed = await snapshot_service.delete(session, current_user.id, snapshot_id)
    if not removed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Snapshot not found")
    await audit_service.record_event(
        session,
        user_id=current_user.id,
        action="delete",
        resource_type="snapshot",
        resource_id=snapshot_id,
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
```

- [ ] **Step 4: Register the router in `backend/app/main.py`**

Update the import line to include `snapshots`:

```python
from app.routers import (
    assistant,
    audit,
    auth,
    blueprints,
    gamedata,
    health,
    plans,
    snapshots,
)
```

And add the include alongside the others in `create_app`:

```python
    app.include_router(snapshots.router, prefix=API_PREFIX)
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `docker compose -f docker-compose.test.yml run --rm api-test sh -c "pytest tests/test_routers_snapshots.py -v"`
Expected: PASS — all 6 tests green.

- [ ] **Step 6: Run the full backend suite to confirm no regression + coverage gate**

Run: `docker compose -f docker-compose.test.yml run --rm api-test`
Expected: all tests pass, `--cov-fail-under=85` satisfied.

- [ ] **Step 7: Commit**

```bash
git add backend/app/routers/snapshots.py backend/app/main.py backend/tests/test_routers_snapshots.py
git commit -m "feat(snapshots): add auth-gated snapshot CRUD router with audit"
```

---

## Task 5: Frontend — savefile types

**Files:**
- Create: `frontend/src/domain/savefile/types.ts`

- [ ] **Step 1: Write the types (mirror backend `CompactSnapshot`)**

```ts
// Reduced, browser-produced representation of a parsed Satisfactory .sav.
// Mirrors backend app/models/snapshot.py CompactSnapshot.

export interface SnapshotBuilding {
  /** Building class, e.g. "Build_ConstructorMk1_C". */
  machine_id: string;
  /** Recipe class, e.g. "Recipe_IronPlate_C"; null when the machine is idle. */
  recipe_id: string | null;
  /** Clock percent (50, 100, 250, ...). */
  overclock: number;
  /** active | paused | idle | off */
  state: string;
  somersloops: number;
  floor_id: string | null;
}

export interface SnapshotPowerGrid {
  id: number;
  production_mw: number;
  consumption_mw: number;
  fuse_tripped: boolean;
}

export interface CompactSnapshot {
  save_name: string;
  play_time: number;
  buildings: SnapshotBuilding[];
  power_grids: SnapshotPowerGrid[];
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/domain/savefile/types.ts
git commit -m "feat(savefile): add CompactSnapshot TypeScript types"
```

---

## Task 6: Frontend — reduce.ts (TDD with Vitest)

**Files:**
- Create: `frontend/src/domain/savefile/reduce.ts`
- Create: `frontend/src/domain/savefile/reduce.test.ts`

**Context:** This ports the reduction logic from S.A.T.'s `scripts/parse-save-json.js` (read it at `../satisfactory-automated_calculator/scripts/parse-save-json.js`) to a browser-pure function. The raw parser output shape: `save.levels` is an object whose values have an `objects` array; `save.header.playDurationSeconds`; each object has `typePath`, `instanceName`, `properties` (a map of `{name: {value}}`), `transform.translation`. We extract only production buildings (filtered by a known set of building classes), their recipe className, overclock, state, somersloops, and floor (via Priority Power Switch heuristic), plus power grids.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { reduce, type RawSave } from "./reduce";

function rawSave(): RawSave {
  return {
    header: { playDurationSeconds: 1200, saveVersion: 46 },
    levels: {
      Persistent: {
        objects: [
          {
            typePath: "/Game/FactoryGame/Buildable/Factory/.../Build_ConstructorMk1_C",
            instanceName: "Persistent:PersistentLevel.Build_ConstructorMk1_C_42",
            transform: { translation: { x: 1, y: 2, z: 3 } },
            properties: {
              mCurrentPotential: { value: 1.5 },
              mCurrentRecipe: {
                value: { pathName: "/Game/.../Recipe_IronPlate_C.Recipe_IronPlate_C" },
              },
              mIsProducing: { value: true },
            },
          },
          {
            // not a production building → must be ignored
            typePath: "/Game/.../Build_Wall_8x4_C",
            instanceName: "Persistent:PersistentLevel.Build_Wall_8x4_C_1",
            properties: {},
          },
        ],
      },
    },
  };
}

describe("reduce", () => {
  it("extracts production buildings with recipe className and overclock", () => {
    const snap = reduce(rawSave(), "MyWorld_autosave_0");
    expect(snap.save_name).toBe("MyWorld_autosave_0");
    expect(snap.play_time).toBe(1200);
    expect(snap.buildings).toHaveLength(1);
    const b = snap.buildings[0];
    expect(b.machine_id).toBe("Build_ConstructorMk1_C");
    expect(b.recipe_id).toBe("Recipe_IronPlate_C");
    expect(b.overclock).toBe(150);
    expect(b.state).toBe("active");
  });

  it("marks a building with no recipe as off with null recipe_id", () => {
    const raw = rawSave();
    raw.levels.Persistent.objects[0].properties = { mCurrentPotential: { value: 1.0 } };
    const snap = reduce(raw, "w");
    expect(snap.buildings[0].recipe_id).toBeNull();
    expect(snap.buildings[0].state).toBe("off");
    expect(snap.buildings[0].overclock).toBe(100);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `docker compose -f docker-compose.test.yml run --rm frontend-test sh -c "npm run test -- src/domain/savefile/reduce.test.ts"`
Expected: FAIL — cannot resolve `./reduce`.

- [ ] **Step 3: Write the implementation `frontend/src/domain/savefile/reduce.ts`**

```ts
// Reduce a raw @etothepii parser output into a CompactSnapshot.
// Ported from S.A.T. scripts/parse-save-json.js (browser-pure; no fs/Node).

import type { CompactSnapshot, SnapshotBuilding, SnapshotPowerGrid } from "./types";

// Minimal structural typing of the raw parser output we rely on.
export interface RawObject {
  typePath?: string;
  instanceName?: string;
  transform?: { translation?: { x?: number; y?: number; z?: number } };
  properties?: Record<string, { value?: unknown; values?: unknown[] }>;
}
export interface RawLevel {
  objects: RawObject[];
}
export interface RawSave {
  header?: { playDurationSeconds?: number; saveVersion?: number };
  levels: Record<string, RawLevel>;
}

/** Production building classes we surface (recipe-bearing machines + extractors). */
const PRODUCTION_CLASSES = new Set<string>([
  "Build_SmelterMk1_C",
  "Build_FoundryMk1_C",
  "Build_ConstructorMk1_C",
  "Build_AssemblerMk1_C",
  "Build_ManufacturerMk1_C",
  "Build_OilRefinery_C",
  "Build_Blender_C",
  "Build_Packager_C",
  "Build_HadronCollider_C",
  "Build_QuantumEncoder_C",
  "Build_Converter_C",
  "Build_GeneratorNuclear_C",
  "Build_MinerMk1_C",
  "Build_MinerMk2_C",
  "Build_MinerMk3_C",
  "Build_WaterPump_C",
  "Build_OilPump_C",
  "Build_FrackingExtractor_C",
]);

/** Last segment of a dotted Unreal class path, e.g. ".../Foo_C" → "Foo_C". */
function classKey(p: string | undefined): string {
  if (!p) return "";
  const parts = p.split(".");
  return parts[parts.length - 1];
}

function propVal(obj: RawObject, name: string): unknown {
  return obj.properties?.[name]?.value;
}

export function reduce(save: RawSave, saveName: string): CompactSnapshot {
  const allObjects: RawObject[] = Object.values(save.levels ?? {}).flatMap(
    (l) => l.objects ?? [],
  );

  // ── Floor detection via Priority Power Switches (single-switch circuits) ──
  const allCircuits = allObjects.filter((o) => o.typePath?.includes("FGPowerCircuit"));
  const switchTagMap = new Map<string, string | null>();
  const instanceToCircuit = new Map<string, number>();
  const circuitSwitches = new Map<number, string[]>();

  for (const obj of allObjects) {
    if (!obj.typePath?.includes("PriorityPowerSwitch")) continue;
    const instBase = obj.instanceName?.split(".").pop();
    const tag = (obj.properties?.mBuildingTag?.value as string | undefined) ?? null;
    if (instBase) switchTagMap.set(instBase, tag);
  }

  for (const circuit of allCircuits) {
    const circuitID = propVal(circuit, "mCircuitID");
    if (typeof circuitID !== "number") continue;
    const components = (circuit.properties?.mComponents?.values ?? []) as Array<{
      pathName?: string;
      value?: { pathName?: string };
    }>;
    for (const comp of components) {
      const pn = comp?.pathName ?? comp?.value?.pathName ?? null;
      if (!pn) continue;
      const dotIdx = pn.lastIndexOf(".");
      if (dotIdx < 0) continue;
      const instBase = pn.slice(0, dotIdx).split(".").pop();
      if (!instBase) continue;
      const classK = instBase.replace(/_\d+$/, "");
      if (classK === "Build_PriorityPowerSwitch_C") {
        const list = circuitSwitches.get(circuitID) ?? [];
        list.push(instBase);
        circuitSwitches.set(circuitID, list);
      } else {
        instanceToCircuit.set(instBase, circuitID);
      }
    }
  }

  const circuitToSwitch = new Map<number, string>();
  for (const [cid, list] of circuitSwitches) {
    if (list.length === 1) circuitToSwitch.set(cid, list[0]);
  }

  // ── Production buildings ──
  const buildings: SnapshotBuilding[] = allObjects
    .filter((o) => PRODUCTION_CLASSES.has(classKey(o.typePath)))
    .map((b) => {
      const key = classKey(b.typePath);

      const clockRaw =
        (propVal(b, "mCurrentPotential") as number | undefined) ??
        (propVal(b, "mPendingPotential") as number | undefined) ??
        1.0;
      const overclock = Math.round(Number(clockRaw) * 100);

      const recipePath =
        (b.properties?.mCurrentRecipe?.value as { pathName?: string } | undefined)
          ?.pathName ?? null;
      const recipe_id = recipePath ? classKey(recipePath) : null;

      const isProducing = propVal(b, "mIsProducing");
      const isStandby =
        propVal(b, "mIsCurrentlyProductionPaused") ??
        propVal(b, "mCurrentRecipeChanged") ??
        null;
      let state = "off";
      if (recipe_id) {
        if (isProducing === true || isProducing === undefined || isProducing === null) {
          state = "active";
        } else if (isProducing === false) {
          state = isStandby ? "paused" : "idle";
        }
      }

      const somersloops = Number(
        (propVal(b, "mNumSomersloopsSlotted") as number | undefined) ??
          (propVal(b, "mNumSlotsUsedForced") as number | undefined) ??
          0,
      );

      const instBase = b.instanceName?.split(".").pop() ?? null;
      const circuitID = instBase ? instanceToCircuit.get(instBase) ?? null : null;
      const switchInst = circuitID !== null ? circuitToSwitch.get(circuitID) ?? null : null;
      const floor_id = switchInst ? switchTagMap.get(switchInst) ?? null : null;

      return { machine_id: key, recipe_id, overclock, state, somersloops, floor_id };
    });

  // ── Power grids ──
  const power_grids: SnapshotPowerGrid[] = [];
  for (const circuit of allCircuits) {
    const id = Number(propVal(circuit, "mCircuitID") ?? 0);
    if (id <= 0) continue;
    power_grids.push({
      id,
      production_mw: Number(propVal(circuit, "mPowerProduction") ?? 0),
      consumption_mw: Number(propVal(circuit, "mPowerConsumed") ?? 0),
      fuse_tripped: Boolean(propVal(circuit, "mIsFuseTripped") ?? false),
    });
  }

  return {
    save_name: saveName,
    play_time: Number(save.header?.playDurationSeconds ?? 0),
    buildings,
    power_grids,
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `docker compose -f docker-compose.test.yml run --rm frontend-test sh -c "npm run test -- src/domain/savefile/reduce.test.ts"`
Expected: PASS — both tests green.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/domain/savefile/reduce.ts frontend/src/domain/savefile/reduce.test.ts
git commit -m "feat(savefile): reduce raw save to CompactSnapshot (ported from S.A.T.)"
```

---

## Task 7: Frontend — parseSave.ts (esm.sh dynamic import)

**Files:**
- Create: `frontend/src/domain/savefile/parseSave.ts`

**Note:** This module dynamically imports a CDN dependency and is not unit-tested (covered by E2E + manual per the spec). Keep it thin: load → parse → reduce.

- [ ] **Step 1: Write the module**

```ts
// Parse a Satisfactory .sav entirely in the browser, then reduce it.
// The parser is loaded on demand from esm.sh so it is never bundled and never
// runs in the backend (decision #2 in the spec). Offline/self-host without CDN
// access loses parsing — a documented V1 limitation.

import { reduce } from "./reduce";
import type { CompactSnapshot } from "./types";

const PARSER_URL = "https://esm.sh/@etothepii/satisfactory-file-parser@0.4.2";

interface ParserModule {
  Parser: { ParseSave(name: string, buffer: ArrayBuffer): unknown };
}

/** Strip a trailing ".sav" from a file name to get the save name. */
function saveNameFromFile(fileName: string): string {
  return fileName.replace(/\.sav$/i, "");
}

/**
 * Parse a dropped .sav File and return a reduced snapshot.
 * Throws if the CDN import fails or the binary cannot be parsed.
 */
export async function parseSaveFile(file: File): Promise<CompactSnapshot> {
  const mod = (await import(/* @vite-ignore */ PARSER_URL)) as ParserModule;
  const buffer = await file.arrayBuffer();
  const saveName = saveNameFromFile(file.name);
  const raw = mod.Parser.ParseSave(saveName, buffer);
  // reduce() only reads the fields it knows; the raw shape is structurally typed.
  return reduce(raw as Parameters<typeof reduce>[0], saveName);
}
```

> Implementer note: confirm the exact pinned version available on esm.sh at execution time (`https://esm.sh/@etothepii/satisfactory-file-parser`); update `PARSER_URL` to the latest patch of the same major if `0.4.2` is unavailable. The `Parser.ParseSave(name, ArrayBuffer)` API matches S.A.T.'s usage in `parse-save-json.js`.

- [ ] **Step 2: Type-check the frontend**

Run: `docker compose run --rm frontend npm run type-check`
Expected: exit 0 (no type errors).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/domain/savefile/parseSave.ts
git commit -m "feat(savefile): browser .sav parser via esm.sh dynamic import"
```

---

## Task 8: Frontend — diff.ts (TDD with Vitest)

**Files:**
- Create: `frontend/src/domain/savefile/diff.ts`
- Create: `frontend/src/domain/savefile/diff.test.ts`

**Context:** Align planned vs actual on `recipe_id`. Planned = sum of clock-accurate machine-equivalents (`machines.exact`) per recipe, from re-running `calculateProduction` over the Plan's `target_items`. Actual = `Σ(overclock / 100)` over snapshot buildings carrying that recipe. A recipe className present in the snapshot but absent from gamedata is bucketed `UNMATCHED` (risk #1 — never silently dropped).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import type { ItemSummary, RecipeSummary } from "../gamedata/types";
import type { TargetItem } from "../plans/types";
import type { CompactSnapshot } from "./types";
import { diffPlanVsSnapshot } from "./diff";

const items: ItemSummary[] = [
  { id: "Desc_IronPlate_C", name: "Iron Plate", description: "", stack_size: 200 },
  { id: "Desc_IronIngot_C", name: "Iron Ingot", description: "", stack_size: 100 },
];

const recipes: RecipeSummary[] = [
  {
    id: "Recipe_IronPlate_C",
    name: "Iron Plate",
    ingredients: [{ item_id: "Desc_IronIngot_C", amount: 3 }],
    products: [{ item_id: "Desc_IronPlate_C", amount: 2 }],
    produced_in: ["Desc_ConstructorMk1_C"],
    time: 6, // 1 machine = 2 * 60/6 = 20/min
  },
];

const targets: TargetItem[] = [{ item_id: "Desc_IronPlate_C", quantity: 20 }];
// → planned exactly 1 constructor for Recipe_IronPlate_C
// (Desc_IronIngot_C has no recipe here → treated as raw → no planned row)

function snapshot(buildings: CompactSnapshot["buildings"]): CompactSnapshot {
  return { save_name: "w", play_time: 0, buildings, power_grids: [] };
}

function bld(recipe_id: string | null, overclock: number): CompactSnapshot["buildings"][number] {
  return {
    machine_id: "Build_ConstructorMk1_C",
    recipe_id,
    overclock,
    state: recipe_id ? "active" : "off",
    somersloops: 0,
    floor_id: null,
  };
}

describe("diffPlanVsSnapshot", () => {
  it("reports OK when actual matches planned", () => {
    const rows = diffPlanVsSnapshot(targets, snapshot([bld("Recipe_IronPlate_C", 100)]), recipes, items);
    const row = rows.find((r) => r.recipe_id === "Recipe_IronPlate_C")!;
    expect(row.planned).toBeCloseTo(1, 3);
    expect(row.actual).toBeCloseTo(1, 3);
    expect(row.status).toBe("OK");
  });

  it("reports MISSING when planned but no actual", () => {
    const rows = diffPlanVsSnapshot(targets, snapshot([]), recipes, items);
    const row = rows.find((r) => r.recipe_id === "Recipe_IronPlate_C")!;
    expect(row.status).toBe("MISSING");
    expect(row.actual).toBe(0);
  });

  it("reports UNDER and OVER from the capacity delta", () => {
    const under = diffPlanVsSnapshot(targets, snapshot([bld("Recipe_IronPlate_C", 50)]), recipes, items);
    expect(under.find((r) => r.recipe_id === "Recipe_IronPlate_C")!.status).toBe("UNDER");

    const over = diffPlanVsSnapshot(
      targets,
      snapshot([bld("Recipe_IronPlate_C", 100), bld("Recipe_IronPlate_C", 100)]),
      recipes,
      items,
    );
    expect(over.find((r) => r.recipe_id === "Recipe_IronPlate_C")!.status).toBe("OVER");
  });

  it("reports UNPLANNED for a known recipe that was built but not planned", () => {
    const recipesPlus: RecipeSummary[] = [
      ...recipes,
      {
        id: "Recipe_IngotIron_C",
        name: "Iron Ingot",
        ingredients: [],
        products: [{ item_id: "Desc_IronIngot_C", amount: 1 }],
        produced_in: ["Desc_SmelterMk1_C"],
        time: 2,
      },
    ];
    const row = diffPlanVsSnapshot(targets, snapshot([bld("Recipe_IngotIron_C", 100)]), recipesPlus, items).find(
      (r) => r.recipe_id === "Recipe_IngotIron_C",
    )!;
    expect(row.status).toBe("UNPLANNED");
  });

  it("reports UNMATCHED for a snapshot recipe absent from gamedata", () => {
    const row = diffPlanVsSnapshot(targets, snapshot([bld("Recipe_Unknown_C", 100)]), recipes, items).find(
      (r) => r.recipe_id === "Recipe_Unknown_C",
    )!;
    expect(row.status).toBe("UNMATCHED");
  });

  it("ignores idle buildings with no recipe", () => {
    const rows = diffPlanVsSnapshot(targets, snapshot([bld(null, 100)]), recipes, items);
    expect(rows.every((r) => r.recipe_id !== null)).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `docker compose -f docker-compose.test.yml run --rm frontend-test sh -c "npm run test -- src/domain/savefile/diff.test.ts"`
Expected: FAIL — cannot resolve `./diff`.

- [ ] **Step 3: Write the implementation `frontend/src/domain/savefile/diff.ts`**

```ts
// Planned-vs-actual diff, aligned on recipe className. Pure logic.

import { calculateProduction, type CalculationNode } from "../gamedata/calculator";
import type { ItemSummary, RecipeSummary } from "../gamedata/types";
import type { TargetItem } from "../plans/types";
import type { CompactSnapshot } from "./types";

export type DiffStatus = "OK" | "UNDER" | "OVER" | "MISSING" | "UNPLANNED" | "UNMATCHED";

export interface DiffRow {
  recipe_id: string;
  recipe_name: string | null;
  /** Clock-accurate machine-equivalents the plan needs (Σ exact). */
  planned: number;
  /** Built machine-equivalents (Σ overclock/100). */
  actual: number;
  /** actual − planned. */
  delta: number;
  status: DiffStatus;
}

/** Tolerance (in machine-equivalents) before a delta counts as UNDER/OVER. */
const EPS = 0.05;

interface PlannedEntry {
  exact: number;
  name: string | null;
}

/** Sum machines.exact per recipe_id across every target's production tree. */
function plannedByRecipe(
  targets: readonly TargetItem[],
  recipes: readonly RecipeSummary[],
  items: readonly ItemSummary[],
): Map<string, PlannedEntry> {
  const acc = new Map<string, PlannedEntry>();

  function walk(node: CalculationNode): void {
    if (node.recipe_id && node.machines && node.machines.exact > 0) {
      const cur = acc.get(node.recipe_id) ?? { exact: 0, name: node.recipe_name };
      cur.exact += node.machines.exact;
      if (cur.name === null) cur.name = node.recipe_name;
      acc.set(node.recipe_id, cur);
    }
    for (const child of node.children) walk(child);
  }

  for (const t of targets) {
    if (t.quantity <= 0) continue;
    walk(calculateProduction(t.item_id, t.quantity, recipes, items));
  }
  return acc;
}

/** Sum overclock/100 per recipe_id over built (recipe-bearing) machines. */
function actualByRecipe(snapshot: CompactSnapshot): Map<string, number> {
  const acc = new Map<string, number>();
  for (const b of snapshot.buildings) {
    if (!b.recipe_id) continue;
    acc.set(b.recipe_id, (acc.get(b.recipe_id) ?? 0) + b.overclock / 100);
  }
  return acc;
}

const STATUS_ORDER: Record<DiffStatus, number> = {
  MISSING: 0,
  UNDER: 1,
  OVER: 2,
  UNPLANNED: 3,
  UNMATCHED: 4,
  OK: 5,
};

export function diffPlanVsSnapshot(
  targets: readonly TargetItem[],
  snapshot: CompactSnapshot,
  recipes: readonly RecipeSummary[],
  items: readonly ItemSummary[],
): DiffRow[] {
  const planned = plannedByRecipe(targets, recipes, items);
  const actual = actualByRecipe(snapshot);
  const knownRecipeIds = new Set(recipes.map((r) => r.id));
  const recipeNameById = new Map(recipes.map((r) => [r.id, r.name]));

  const recipeIds = new Set<string>([...planned.keys(), ...actual.keys()]);
  const rows: DiffRow[] = [];

  for (const recipe_id of recipeIds) {
    const p = planned.get(recipe_id)?.exact ?? 0;
    const a = actual.get(recipe_id) ?? 0;
    const delta = a - p;
    const recipe_name =
      planned.get(recipe_id)?.name ?? recipeNameById.get(recipe_id) ?? null;

    let status: DiffStatus;
    if (p > 0 && a === 0) {
      status = "MISSING";
    } else if (p === 0 && a > 0) {
      status = knownRecipeIds.has(recipe_id) ? "UNPLANNED" : "UNMATCHED";
    } else if (delta < -EPS) {
      status = "UNDER";
    } else if (delta > EPS) {
      status = "OVER";
    } else {
      status = "OK";
    }

    rows.push({ recipe_id, recipe_name, planned: p, actual: a, delta, status });
  }

  rows.sort(
    (x, y) =>
      STATUS_ORDER[x.status] - STATUS_ORDER[y.status] ||
      x.recipe_id.localeCompare(y.recipe_id),
  );
  return rows;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `docker compose -f docker-compose.test.yml run --rm frontend-test sh -c "npm run test -- src/domain/savefile/diff.test.ts"`
Expected: PASS — all status cases green.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/domain/savefile/diff.ts frontend/src/domain/savefile/diff.test.ts
git commit -m "feat(savefile): planned-vs-actual diff aligned on recipe className"
```

---

## Task 9: Frontend — snapshots domain (types + TanStack queries)

**Files:**
- Create: `frontend/src/domain/snapshots/types.ts`
- Create: `frontend/src/domain/snapshots/queries.ts`

- [ ] **Step 1: Write the types (mirror backend `SnapshotRead` / `SnapshotCreate`)**

```ts
import type { CompactSnapshot } from "../savefile/types";

export interface SnapshotRead {
  id: string;
  name: string;
  save_name: string;
  play_time: number;
  imported_at: string;
  data: CompactSnapshot;
}

export interface SnapshotCreate {
  name: string;
  data: CompactSnapshot;
}
```

- [ ] **Step 2: Write the query hooks (mirror `domain/plans/queries.ts`)**

```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "../../api/http/client";
import type { SnapshotCreate, SnapshotRead } from "./types";

const QUERY_KEY = "snapshots";
const API_BASE = "/v1/snapshots";

export function useSnapshotsQuery() {
  return useQuery<SnapshotRead[]>({
    queryKey: [QUERY_KEY],
    queryFn: () => http.get<SnapshotRead[]>(API_BASE),
  });
}

export function useSnapshotQuery(id: string) {
  return useQuery<SnapshotRead>({
    queryKey: [QUERY_KEY, id],
    queryFn: () => http.get<SnapshotRead>(`${API_BASE}/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateSnapshotMutation() {
  const queryClient = useQueryClient();
  return useMutation<SnapshotRead, Error, SnapshotCreate>({
    mutationFn: (payload: SnapshotCreate) => http.post<SnapshotRead>(API_BASE, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useDeleteSnapshotMutation() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id: string) => http.delete<void>(`${API_BASE}/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}
```

- [ ] **Step 3: Type-check**

Run: `docker compose run --rm frontend npm run type-check`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/domain/snapshots/types.ts frontend/src/domain/snapshots/queries.ts
git commit -m "feat(snapshots): add snapshot TS types + TanStack Query hooks"
```

---

## Task 10: Frontend — RealVsPlanned UI + i18n + PlanDetail wiring

**Files:**
- Create: `frontend/src/components/plan/RealVsPlanned.tsx`
- Create: `frontend/src/components/plan/RealVsPlanned.module.scss`
- Modify: `frontend/src/pages/PlanDetail.tsx`
- Modify: `frontend/src/pages/PlanDetail.module.scss`
- Modify: `frontend/src/i18n/locales/en/common.json`
- Modify: `frontend/src/i18n/locales/fr/common.json`

- [ ] **Step 1: Add i18n keys to `frontend/src/i18n/locales/en/common.json`**

Add a new top-level `"real_vs_planned"` object (place it alphabetically near `plan_detail`). English:

```json
  "real_vs_planned": {
    "title": "Actual vs planned",
    "tab": "Actual vs planned",
    "drop_hint": "Drop a Satisfactory .sav here, or click to choose a file",
    "parsing": "Parsing save…",
    "parse_error": "Could not parse this save file.",
    "needs_gamedata": "Import game data first to compute the planned side.",
    "empty": "No save loaded yet. Drop a .sav to compare it with this plan.",
    "col_recipe": "Recipe",
    "col_planned": "Planned",
    "col_actual": "Built",
    "col_status": "Status",
    "status_ok": "OK",
    "status_under": "Under",
    "status_over": "Over",
    "status_missing": "Missing",
    "status_unplanned": "Unplanned",
    "status_unmatched": "Unmatched",
    "save_name": "Save: {{name}}",
    "saved": "Snapshot saved."
  },
```

- [ ] **Step 2: Add the same keys to `frontend/src/i18n/locales/fr/common.json` (French)**

```json
  "real_vs_planned": {
    "title": "Réel vs prévu",
    "tab": "Réel vs prévu",
    "drop_hint": "Déposez une sauvegarde .sav ici, ou cliquez pour choisir un fichier",
    "parsing": "Analyse de la sauvegarde…",
    "parse_error": "Impossible d'analyser ce fichier de sauvegarde.",
    "needs_gamedata": "Importez d'abord les données du jeu pour calculer le prévu.",
    "empty": "Aucune sauvegarde chargée. Déposez un .sav pour le comparer à ce plan.",
    "col_recipe": "Recette",
    "col_planned": "Prévu",
    "col_actual": "Construit",
    "col_status": "Statut",
    "status_ok": "OK",
    "status_under": "Sous-capacité",
    "status_over": "Sur-capacité",
    "status_missing": "Manquant",
    "status_unplanned": "Non prévu",
    "status_unmatched": "Non reconnu",
    "save_name": "Sauvegarde : {{name}}",
    "saved": "Instantané enregistré."
  },
```

- [ ] **Step 3: Write `frontend/src/components/plan/RealVsPlanned.module.scss`**

Neon Brutalist: radius 0, orange accent `#ff8a00`, status color blocks. Use design tokens if present; literal fallbacks shown here.

```scss
.wrap {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dropzone {
  border: 2px dashed var(--border, #3a3a3a);
  border-radius: 0;
  padding: 32px;
  text-align: center;
  cursor: pointer;
  background: var(--surface-2, #1a1a1a);
}

.dropzoneActive {
  border-color: #ff8a00;
  background: rgba(255, 138, 0, 0.08);
}

.hiddenInput {
  display: none;
}

.error {
  color: #ff5555;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th,
.table td {
  border: 1px solid var(--border, #3a3a3a);
  padding: 8px 12px;
  text-align: left;
}

.chip {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 0;
  font-weight: 700;
  text-transform: uppercase;
  font-size: 12px;
}

.ok { background: #1f6f3f; color: #fff; }
.under { background: #8a6d00; color: #fff; }
.over { background: #7a3fbf; color: #fff; }
.missing { background: #a01818; color: #fff; }
.unplanned { background: #1d5f8a; color: #fff; }
.unmatched { background: #555; color: #fff; }
```

- [ ] **Step 4: Write `frontend/src/components/plan/RealVsPlanned.tsx`**

```tsx
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "../../context/useToast";
import {
  useGameDataStatsQuery,
  useItemsQuery,
  useRecipesQuery,
} from "../../domain/gamedata/queries";
import { parseSaveFile } from "../../domain/savefile/parseSave";
import { diffPlanVsSnapshot, type DiffRow, type DiffStatus } from "../../domain/savefile/diff";
import type { CompactSnapshot } from "../../domain/savefile/types";
import { useCreateSnapshotMutation } from "../../domain/snapshots/queries";
import type { TargetItem } from "../../domain/plans/types";
import styles from "./RealVsPlanned.module.scss";

const STATUS_CLASS: Record<DiffStatus, string> = {
  OK: styles.ok,
  UNDER: styles.under,
  OVER: styles.over,
  MISSING: styles.missing,
  UNPLANNED: styles.unplanned,
  UNMATCHED: styles.unmatched,
};

const STATUS_KEY: Record<DiffStatus, string> = {
  OK: "real_vs_planned.status_ok",
  UNDER: "real_vs_planned.status_under",
  OVER: "real_vs_planned.status_over",
  MISSING: "real_vs_planned.status_missing",
  UNPLANNED: "real_vs_planned.status_unplanned",
  UNMATCHED: "real_vs_planned.status_unmatched",
};

interface Props {
  targetItems: TargetItem[];
}

export default function RealVsPlanned({ targetItems }: Props) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const statsQuery = useGameDataStatsQuery();
  const hasGameData = (statsQuery.data?.item_count ?? 0) > 0;
  const itemsQuery = useItemsQuery("", hasGameData);
  const recipesQuery = useRecipesQuery("", hasGameData);
  const createSnapshot = useCreateSnapshotMutation();

  const [snapshot, setSnapshot] = useState<CompactSnapshot | null>(null);
  const [rows, setRows] = useState<DiffRow[] | null>(null);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(false);
    setParsing(true);
    try {
      const snap = await parseSaveFile(file);
      setSnapshot(snap);
      const items = itemsQuery.data ?? [];
      const recipes = recipesQuery.data ?? [];
      setRows(diffPlanVsSnapshot(targetItems, snap, recipes, items));
      createSnapshot.mutate(
        { name: snap.save_name, data: snap },
        { onSuccess: () => showToast(t("real_vs_planned.saved")) },
      );
    } catch {
      setError(true);
      setSnapshot(null);
      setRows(null);
    } finally {
      setParsing(false);
    }
  }

  if (!hasGameData) {
    return <p className={styles.error}>{t("real_vs_planned.needs_gamedata")}</p>;
  }

  return (
    <div className={styles.wrap}>
      <div
        className={`${styles.dropzone} ${dragActive ? styles.dropzoneActive : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          const file = e.dataTransfer.files[0];
          if (file) void handleFile(file);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
      >
        {parsing ? t("real_vs_planned.parsing") : t("real_vs_planned.drop_hint")}
        <input
          ref={inputRef}
          type="file"
          accept=".sav"
          className={styles.hiddenInput}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
      </div>

      {error && <p className={styles.error}>{t("real_vs_planned.parse_error")}</p>}

      {snapshot && <p>{t("real_vs_planned.save_name", { name: snapshot.save_name })}</p>}

      {!snapshot && !parsing && !error && <p>{t("real_vs_planned.empty")}</p>}

      {rows && (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{t("real_vs_planned.col_recipe")}</th>
              <th>{t("real_vs_planned.col_planned")}</th>
              <th>{t("real_vs_planned.col_actual")}</th>
              <th>{t("real_vs_planned.col_status")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.recipe_id}>
                <td>{r.recipe_name ?? r.recipe_id}</td>
                <td>{r.planned.toFixed(2)}</td>
                <td>{r.actual.toFixed(2)}</td>
                <td>
                  <span className={`${styles.chip} ${STATUS_CLASS[r.status]}`}>
                    {t(STATUS_KEY[r.status])}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

> Implementer note: `PlanDetail.tsx` imports `useToast` from `../context/useToast`; from `components/plan/` the correct path is `../../context/useToast`. `useGameDataStatsQuery`, `useItemsQuery`, `useRecipesQuery` all exist in `domain/gamedata/queries.ts`.

- [ ] **Step 5: Wire a view toggle into `frontend/src/pages/PlanDetail.tsx`**

Add the import near the other imports:

```tsx
import RealVsPlanned from "../components/plan/RealVsPlanned";
```

Add a view state near the other `useState` hooks (after the "Link blueprint form" block, ~line 47):

```tsx
  const [view, setView] = useState<"plan" | "real">("plan");
```

In the main render (after `<header>`), add a two-button toggle, then gate the existing target-items + linked-blueprints sections behind `view === "plan"` and render the new view for `view === "real"`:

```tsx
        <div className={styles.viewToggle}>
          <button
            type="button"
            className={view === "plan" ? styles.viewBtnActive : styles.viewBtn}
            onClick={() => setView("plan")}
          >
            {t("plan_detail.target_items")}
          </button>
          <button
            type="button"
            className={view === "real" ? styles.viewBtnActive : styles.viewBtn}
            onClick={() => setView("real")}
          >
            {t("real_vs_planned.tab")}
          </button>
        </div>
```

```tsx
        {view === "real" && <RealVsPlanned targetItems={plan.target_items} />}
```

> Implementer note: the existing `target_items` and `linked_blueprints` `<section>` blocks must only render when `view === "plan"`. Wrap them with `{view === "plan" && ( … )}` (or an early `view === "plan"` guard around that JSX). Do not remove any existing functionality — only gate its visibility.

- [ ] **Step 6: Add toggle styles to `frontend/src/pages/PlanDetail.module.scss`**

```scss
.viewToggle {
  display: flex;
  gap: 0;
  margin: 16px 0;
}

.viewBtn,
.viewBtnActive {
  border: 1px solid var(--border, #3a3a3a);
  border-radius: 0;
  padding: 8px 16px;
  background: var(--surface-2, #1a1a1a);
  color: inherit;
  cursor: pointer;
}

.viewBtnActive {
  background: #ff8a00;
  color: #111;
  font-weight: 700;
}
```

- [ ] **Step 7: Type-check and lint the frontend**

Run: `docker compose run --rm frontend npm run type-check`
Then: `docker compose -f docker-compose.test.yml run --rm --no-deps frontend-lint`
Expected: both exit 0.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/components/plan/ frontend/src/pages/PlanDetail.tsx frontend/src/pages/PlanDetail.module.scss frontend/src/i18n/locales/en/common.json frontend/src/i18n/locales/fr/common.json
git commit -m "feat(plan): add Actual-vs-planned view with .sav drop + diff table"
```

---

## Task 11: E2E — Playwright spec

**Files:**
- Create: `tests/e2e/fixtures/sample.snapshot.json`
- Create: `tests/e2e/specs/real-vs-planned.spec.ts`

**Note on the fixture:** A real binary `.sav` cannot be reliably parsed by the CDN library inside the headless E2E network (esm.sh may be blocked, and a real save is large/version-specific). The spec mandates manual validation against a real save (risk #1). For automated E2E, assert the deterministic parts: the view toggle renders and the drop zone + empty state appear. Full parse-and-diff is covered by Task 6/8 unit tests + Task 12 manual validation.

- [ ] **Step 1: Write the E2E spec `tests/e2e/specs/real-vs-planned.spec.ts`**

Mirror the structure of `tests/e2e/specs/plans.spec.ts` (read it first for this suite's login/setup helpers — replicate them; do not invent a new auth flow). Minimal deterministic assertions:

```ts
import { test, expect } from "@playwright/test";

// Reuse the exact auth/setup helpers from plans.spec.ts (copy its beforeEach
// and any login helper). Then create/open a plan the same way plans.spec.ts does.
test("plan detail shows the Actual-vs-planned view", async ({ page }) => {
  // 1. Navigate to a plan detail page (create one via the UI, as plans.spec.ts does).
  // 2. Switch to the Actual-vs-planned view.
  await page.getByRole("button", { name: /actual vs planned/i }).click();
  // 3. The drop zone hint is visible.
  await expect(page.getByText(/drop a satisfactory \.sav/i)).toBeVisible();
});
```

- [ ] **Step 2: Add the reduced-snapshot fixture `tests/e2e/fixtures/sample.snapshot.json`**

Documents the expected reduced shape (also handy for manual `POST /snapshots` testing):

```json
{
  "name": "E2E sample",
  "data": {
    "save_name": "E2E_sample",
    "play_time": 1000,
    "buildings": [
      { "machine_id": "Build_ConstructorMk1_C", "recipe_id": "Recipe_IronPlate_C", "overclock": 100, "state": "active", "somersloops": 0, "floor_id": null }
    ],
    "power_grids": []
  }
}
```

- [ ] **Step 3: Run the E2E suite**

Run: `make docker-e2e`
Expected: the new spec passes alongside the existing suite.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/specs/real-vs-planned.spec.ts tests/e2e/fixtures/sample.snapshot.json
git commit -m "test(e2e): assert Actual-vs-planned view renders on plan detail"
```

---

## Task 12: Manual validation (risk #1 — className alignment)

**Not automatable. Do this before declaring L9 done.**

- [ ] **Step 1:** Obtain a real `.sav` from an actual Satisfactory session whose factory matches an SFM Plan you created (import game data first).
- [ ] **Step 2:** Run the app via `make dev`, open the Plan, switch to "Réel vs prévu", drop the real `.sav`.
- [ ] **Step 3:** Confirm recipe classNames from the save align with gamedata `recipe.id` — i.e. real recipes show `OK`/`UNDER`/`OVER`, NOT a wall of `UNMATCHED`. If many rows are `UNMATCHED`, the gamedata `recipe.id` convention differs from the save's recipe className; add a normalization step in `diff.ts` (document the mapping) and re-test.
- [ ] **Step 4:** Confirm the snapshot persisted (`GET /api/v1/snapshots` returns it) and the power grids parsed.
- [ ] **Step 5:** Record the outcome in the ROADMAP / Notion and close the lot.

---

## Self-review (performed by plan author)

**Spec coverage:**
- Decision 1 (planned-vs-actual core value) → Tasks 6, 8, 10. ✓
- Decision 2 (client-side parsing via @etothepii/esm.sh) → Task 7. ✓
- Decision 3 (DB table via Alembic) → Tasks 1–4. ✓
- Decision 4 (agent deferred) → explicitly out of scope; no task. ✓
- Prior-art harvest (reduce ported from parse-save-json.js) → Task 6. ✓
- Architecture (parse→reduce→POST→diff→render) → Tasks 6,7,4,8,10. ✓
- Backend changes (model/migration/ORM/service/router/main register/audit) → Tasks 1–4. ✓
- Frontend changes (parseSave/reduce/diff/queries/UI) → Tasks 5–10. ✓
- Risk 1 (className alignment + UNMATCHED bucket) → Task 8 (UNMATCHED), Task 12 (validate). ✓
- Risk 2 (browser perf) → parsing has a progress state in Task 10; reduce discards raw immediately. ✓
- Risk 3 (esm.sh availability) → documented in Task 7. ✓
- Risk 4 (no stored machine breakdown → recompute) → Task 8 `plannedByRecipe`. ✓
- Verification (backend pytest / frontend vitest / e2e / manual) → Tasks 4, 6, 8, 11, 12. ✓
- **Gap found & fixed:** spec assumed Vitest exists; it does not → added Task 0.

**Placeholder scan:** No "TBD"/"add error handling"/"similar to Task N" without code. The implementer notes flag two things to confirm at execution (exact esm.sh version; reuse of plans.spec.ts auth helper) — these are verification instructions, not missing content.

**Type consistency:** `CompactSnapshot`/`SnapshotBuilding` identical across backend (Task 1) and frontend (Task 5). `diffPlanVsSnapshot(targets, snapshot, recipes, items)` signature consistent between the Task 8 definition, its test, and the Task 10 call site. `SnapshotCreate { name, data }` consistent backend (Task 1) ↔ frontend (Task 9) ↔ router test (Task 4). `DiffStatus` union identical in `diff.ts`, its test, and the UI maps.

---

## Notes for the executor

- Commit after every task (frequent commits).
- If a backend test drops coverage below 85%, add a targeted service-level test rather than lowering the gate.
- Keep `reduce.ts` and `diff.ts` pure (no React, no fetch) so they stay unit-testable.
- The two backend write endpoints emit audit events (`resource_type: "snapshot"`) for parity with plans/blueprints; the read endpoints do not.
- This plan does not touch the sfm-agent (`agent/`) — agent auto-detection is a deferred follow-up lot.
