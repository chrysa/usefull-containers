# Architecture — satisfactory-factory-manager

> Grounded in the repository's manifests, entrypoints, and source layout as of this writing.
> Where docs and manifests disagreed, the manifests were trusted.

## Purpose

Factory planning tool for the game *Satisfactory*: replaces spreadsheets with an
interactive production-chain optimizer, a resource-flow (node graph) visualizer, and an
AI-powered assistant. Includes a local sync agent that watches a blueprint folder and
syncs it with the hub.

## Stack

- **Backend**: FastAPI + Python 3.12 (async), Pydantic v2 / pydantic-settings, SQLAlchemy
  2.0 (asyncio), Alembic, SQLite via aiosqlite (local-first). Auth via python-jose (JWT)
  + bcrypt. HTTP via httpx. (`backend/pyproject.toml`)
- **Frontend**: React 19 + TypeScript 5 + Vite 6, Tailwind CSS + shadcn/ui, TanStack
  Query v5, React Router 7, ReactFlow (`@xyflow/react`) + dagre for the graph, i18next,
  and `@etothepii/satisfactory-file-parser`. (`frontend/package.json`)
- **Agent**: Python package `sfm_agent` — a CLI file-watcher/syncer. (`agent/pyproject.toml`)
- **Container**: Docker multi-stage (per service), Docker Compose, Traefik reverse proxy (per README).
- **CI**: GitHub Actions (chrysa reusable workflows).

## Layout

- `backend/` — FastAPI service.
  - `app/main.py` — app factory + lifespan (DB init, legacy-store migration).
  - `app/config.py`, `app/constants.py`, `app/fixtures.py` (demo-mode data).
  - `app/routers/` — `auth`, `blueprints`, `plans`, `gamedata`, `assistant`, `snapshots`,
    `audit`, `health`.
  - `app/services/` — business logic: `blueprint_service`, `plan_generator`,
    `plan_service`, `gamedata_service`, `assistant_service`, `ai_client`, `auth_service`,
    `snapshot_service`, `audit_service`, `steam_service`, `storage_migration`,
    `user_storage`.
  - `app/{db,dependencies,domain,models}/`, `alembic/` (migrations), `tests/`.
- `frontend/` — Vite React app (`src/{api,components,context,domain,features,hooks,i18n,lib,pages,styles,utils}`,
  `App.tsx`, `main.tsx`). See `frontend/DESIGN.md`.
- `agent/sfm_agent/` — `cli.py`, `watcher.py`, `syncer.py`, `state.py`, `config.py`.
- `docs/`, `standards/`, `scripts/`, `tests/` (repo-level), `.github/`.

## Entrypoints

- Backend: `app.main:create_app` (FastAPI); Docker runs uvicorn on port 8000 (published
  as 9009 in `docker-compose.yml`).
- Frontend: `frontend/src/main.tsx`; dev via `vite` (5173), preview/production on 4173
  (published as 9109).
- Agent: `sfm_agent/cli.py` (console CLI; see `agent/README.md`).

## Data & External Dependencies

- **Database**: SQLite (aiosqlite), managed with SQLAlchemy async + Alembic. README notes
  a Postgres path if multi-user.
- **Blueprints**: served from `BLUEPRINTS_DIR` (`/data/blueprints`, a Docker volume).
- **AI assistant**: optional chrysa `ai-aggregator` gateway via `AI_AGGREGATOR_URL` /
  `AI_AGGREGATOR_API_KEY`; empty disables the LLM and falls back to a deterministic,
  offline rule-based assistant (`ASSISTANT_MODEL`, `ASSISTANT_MAX_TOKENS`, etc.).
- **Steam**: `steam_service.py` (excluded from coverage).
- **Demo mode**: `DEMO_MODE` / `VITE_DEMO_MODE` serve fixtures with no real DB/credentials.
- **CORS**: configured via `CORS_ORIGINS`. No secrets are committed in `.env.example`.

## Build & Test

Real commands (from `Makefile`; tests run via Docker):

```bash
make install       # Install backend dev dependencies
make dev           # (= make up) start all services via Docker Compose
make build         # Build Docker images
make test          # Run all tests via Docker
make agent-test    # Run sfm-agent tests in Docker
make lint          # ruff (ESLint parked — see DECISIONS.md D-0012)
make format        # ruff format via Docker
make typecheck     # mypy + tsc via Docker
make quality-gate-verify   # lint + format-check + typecheck + test (mirrors CI via `make ci`)
```

Frontend scripts (`frontend/package.json`): `dev`, `build` (`tsc -b && vite build`),
`preview`, `lint` (eslint), `test` (`vitest run`). Backend/agent enforce `--cov-fail-under=85`.
