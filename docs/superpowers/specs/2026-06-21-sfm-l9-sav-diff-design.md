# SFM L9 — `.sav` Import & "Planned vs Actual" Diff

> **Status:** Design approved (2026-06-21). **Implementation frozen** behind the V1 gate verdict (due 2026-06-24). Do not start coding until the gate passes and "open L9" is the chosen option.

## Context

`satisfactory-factory-manager` (SFM) is a V1-feature-complete factory planner: FastAPI + Python 3.12 backend, React 19 + TypeScript + Vite 6 frontend, ReactFlow graph, SQLite local-first. Lot **L9 (`.sav` parser)** is the frozen unfreeze-candidate.

**The need.** SFM lets a player *plan* a factory — a `Plan` is a set of target items with a desired throughput (items/min). Nothing in SFM tells the player whether the factory they actually *built* matches that plan. The sibling project **S.A.T.** can analyze a `.sav` (KPIs, bottlenecks) but has no planning side, so it cannot answer "did I build what I planned?".

**The unique value.** Comparing the plan (intended) against the real save (built) is something only SFM can do, because only SFM owns the planning side. That **planned-vs-actual diff is L9's reason to exist** in SFM rather than reusing S.A.T. as-is.

**Outcome.** A player opens a Plan, drops their Satisfactory `.sav`, and sees per recipe: machines missing, over/under capacity, and recipes built that were not planned.

## Decisions

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 1 | Core value | **Planned vs actual** diff | Unique to SFM; standalone analysis duplicates S.A.T. |
| 2 | Where parsing runs | **Client-side (browser)** — `@etothepii/satisfactory-file-parser` via esm.sh | Backend stays pure Python; large `.sav` never uploaded; matches S.A.T.'s proven browser path |
| 3 | Snapshot storage | **DB table via Alembic** (`factory_snapshots`, migration `0003`) | Queryable, consistent with existing DB tables (`users`, `audit_log`) |
| 4 | Agent auto-pickup | **Deferred** to a follow-up lot | Keeps this lot focused; browser drag-drop is enough for V1 |

## Prior art to harvest (sibling S.A.T.)

From `satisfactory-automated_calculator/.claude/worktrees/wire/`:

- `scripts/parse-save-json.js` — reduces the raw parser output into a WorldState JSON (buildings, power grids, floor detection via Priority Power Switches). **Port the reduction logic to a browser module.**
- Machine / recipe / purity maps (~lines 59–202) — used for friendly names (FR/EN). Note: the diff **alignment key is the recipe className**, not the friendly name.
- `backend/src/sat_backend/models.py` — WorldState / Building Pydantic shapes; reference for the TS types and the reduced snapshot schema.

Not reused (YAGNI for the diff): S.A.T.'s Postgres schema, Node-subprocess backend, event-diff and KPI endpoints.

## Architecture

```
Browser — Plan detail page, new "Réel vs prévu" tab
  ├─ drop .sav
  ├─ parse via @etothepii (esm.sh dynamic import)          [new: domain/savefile/parseSave.ts]
  ├─ reduce → CompactSnapshot {                            [new: domain/savefile/reduce.ts]
  │     save_name, play_time,                                   (ports parse-save-json.js)
  │     buildings: [{machine_id, recipe_id, overclock,
  │                  state, somersloops, floor_id}],
  │     power_grids: [{production_mw, consumption_mw, fuse_tripped}] }
  ├─ POST /api/v1/snapshots → persisted, returns id        [new backend router]
  ├─ planned side = calculateProduction(target_items)      [REUSE domain/gamedata/calculator.ts]
  │                 → per-recipe planned machine counts
  └─ diff(planned, snapshot) by recipe_id → render table   [new: domain/savefile/diff.ts]
```

The backend's role is **persistence only** — no parsing, no diff logic server-side. The diff is pure client-side TypeScript.

**Why the alignment works.** A `Plan` stores only `target_items` (item + qty/min) plus `linked_blueprints` — it has no saved machine breakdown (the calculator is frontend-only, `domain/gamedata/calculator.ts`). The planned machine breakdown is therefore recomputed from `target_items` on each diff. The calculator's `CalculationNode` carries `recipe_id` and `machines.count`; the parsed `.sav` buildings carry their recipe className and overclock. Both sides key on the recipe className.

## Backend changes (pure Python, minimal)

- **Model** `backend/app/models/snapshot.py`: `SnapshotCreate` / `SnapshotRead` (Pydantic v2). Fields: `id`, `name`, `save_name`, `play_time`, `imported_at`, `data` (the CompactSnapshot, validated by a nested model).
- **Migration** `backend/alembic/versions/0003_factory_snapshots.py`: table `factory_snapshots` (`id` str PK, `user_id` FK→users.id, `name`, `save_name`, `play_time` int, `imported_at` datetime, `data` JSON). Follow the `0002_audit_log.py` style.
- **ORM** add `FactorySnapshot` to `backend/app/db/models.py` (alongside `User`, `AuditLog`).
- **Service** `backend/app/services/snapshot_service.py`: `create` / `list` / `get` / `delete`, async SQLAlchemy 2.0, user-scoped by `user_id` (mirror `audit_service.py`).
- **Router** `backend/app/routers/snapshots.py`: `POST /api/v1/snapshots`, `GET /api/v1/snapshots`, `GET /api/v1/snapshots/{id}`, `DELETE /api/v1/snapshots/{id}`. Auth required (reuse the current auth dependency). Register in `main.py`. Emit `audit_log` entries (resource_type `snapshot`) for parity with plans/blueprints.

## Frontend changes

- **Parser** `frontend/src/domain/savefile/parseSave.ts` — dynamic `import()` of `@etothepii/satisfactory-file-parser` from esm.sh (no bundled dependency; matches the S.A.T. CDN pattern). Returns the raw WorldState.
- **Reducer** `frontend/src/domain/savefile/reduce.ts` — port `parse-save-json.js`: extract buildings (machine class, recipe class, overclock %, state, somersloops), power grids, and floor detection via Priority Power Switches. Output a `CompactSnapshot`.
- **Diff** `frontend/src/domain/savefile/diff.ts` — align by `recipe_id`:
  - planned per recipe: walk the `CalculationNode` tree (reuse `calculator.ts`), sum `machines.count` per `recipe_id`.
  - actual per recipe: group snapshot buildings by `recipe_id`, `effective = Σ(overclock / 100)`.
  - row status: `MISSING` (planned, zero actual) · `UNPLANNED` (actual, not planned) · `UNDER` / `OVER` / `OK` (capacity delta = actual_effective − planned) · `UNMATCHED` (className not found in gamedata — see risk 1).
- **API queries** `frontend/src/domain/snapshots/` (TanStack Query v5) — mutation to POST a snapshot, queries to list/get.
- **UI** new tab in `frontend/src/pages/PlanDetail.tsx` ("Réel vs prévu"): drop zone → parse (progress + error states) → diff table with status chips, sortable, i18n FR/EN, Neon Brutalist tokens (radius 0), and an empty state before a save is dropped.

## Risks and call-outs

1. **className alignment (primary risk).** The `.sav` building recipe className must match SFM's gamedata `recipe.id`. Both are Unreal classNames and the community-wiki gamedata uses the same convention, but mismatches must not silently drop rows — route them to an `UNMATCHED` bucket so they surface. Validate early against a real save.
2. **Browser performance** on very large saves (50–200 MB). Parse in a dedicated step with progress UI, then reduce immediately to discard the heavy WorldState. Acceptable for a local-first single-user tool.
3. **esm.sh availability.** A dynamic CDN import means offline/self-host loses parsing. Acceptable for V1; documented limitation (the library can be vendored later).
4. **Plan has no saved machine breakdown.** The planned side is recomputed from `target_items` via `calculator.ts` on each diff. This requires gamedata to be imported — already a precondition for the calculator.
5. **Gate precondition.** Do not start implementation until the 2026-06-24 verdict passes and "open L9" is the chosen option.

## Scope boundary (explicitly out)

- Agent `.sav` auto-detection / upload (follow-up lot).
- Standalone KPI / bottleneck dashboard (that is S.A.T.; only a small power-balance header may be surfaced if cheap).
- Event-diff / historical snapshot timeline.
- Any backend-side parsing or diff.

## Verification

- **Backend** — pytest via Docker (api-test compose service; never on host): snapshot CRUD, user scoping, auth-required, audit emission, and migration up/down.
- **Frontend** — vitest in a node:22 container: `reduce.ts` against a fixture raw-parser JSON; `diff.ts` unit tests covering missing / unplanned / under / over / ok / unmatched.
- **E2E** — Playwright: open a plan, drop a fixture `.sav`, assert the expected diff rows render. Add the fixture under `tests/e2e/fixtures/`.
- **Manual** — a real `.sav` from an actual session to confirm className alignment (risk 1) before calling the lot done.
