# satisfactory-factory-manager — GitHub Copilot Instructions

## Project Overview

Factory planning tool for Satisfactory (Coffee Stain Studios). Replaces spreadsheets for production chain optimization: resource flow visualization, factory layout planning, AI Q&A assistant. Full-stack monorepo with a FastAPI backend and a React 19 frontend.

## Stack

### Backend (`backend/`)

- **Language**: Python 3.12+
- **Framework**: FastAPI 0.115+
- **Schemas**: Pydantic v2
- **DB**: SQLite (local-first) → PostgreSQL for multi-user scenarios
- **Tests**: pytest 8 + pytest-asyncio + coverage ≥ 85%
- **Lint**: ruff (format + lint) + mypy strict
- **API prefix**: `/api/v1`
- **Health endpoint**: `GET /api/v1/health`

### Frontend (`frontend/`)

- **Language**: TypeScript strict
- **Framework**: React 19 + Vite
- **UI**: Tailwind CSS v4 + shadcn/ui
- **Graph**: ReactFlow (factory node visualization)
- **State**: Zustand / React Query
- **i18n**: supported
- **Tests**: Vitest + React Testing Library
- **E2E**: Playwright (`tests/e2e/`)

### AI Integration

- Routes through `chrysa/ai-aggregator` for consistent LLM access
- Local Ollama fallback for offline usage

## Project Structure

```
backend/
  app/
    constants.py       — APP_PREFIX, APP_TITLE, APP_VERSION (immutable)
    config.py          — Pydantic settings (env-based)
    main.py            — FastAPI app factory (lifespan pattern)
    routers/           — Route handlers (health, blueprints, recipes, factories)
frontend/
  src/
    components/        — Shared UI components
    features/          — Feature-scoped modules
    hooks/             — Custom React hooks
    domain/            — Domain types and entities
    api/               — API client layer
    i18n/              — Translation files
agent/
  pyproject.toml       — Agent CLI utilities
tests/e2e/             — Playwright E2E tests
```

## Standards

- All committed files: English only
- Constants must never be inlined — use `constants.py` / `config.ts`
- `/api/v1/health` endpoint mandatory (Kubernetes probes)
- Trust proxy headers: `forwarded_allow_ips="*"` for uvicorn
- Responsive/mobile-first: all components must work at 320px–1920px
- Pre-commit hooks must pass before every commit
- Tests: minimum 85% coverage on new code

## Development Commands

```bash
make install     # install backend + frontend deps
make dev         # start API + frontend
make test        # pytest + vitest
make lint        # ruff + eslint
make build       # production build
make docker-up   # start with Docker Compose
```
