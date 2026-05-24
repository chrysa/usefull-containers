# satisfactory-factory-manager

[![CI](https://github.com/chrysa/satisfactory-factory-manager/actions/workflows/ci.yml/badge.svg)](https://github.com/chrysa/satisfactory-factory-manager/actions/workflows/ci.yml)

Factory planning tool for [Satisfactory](https://www.satisfactorygame.com/) — replaces spreadsheets with an interactive production chain optimizer, resource flow visualizer, and AI-powered assistant.

![Preview](docs/screenshots/preview.png)

## Stack

| Layer     | Tech                                                          |
|-----------|---------------------------------------------------------------|
| Backend   | FastAPI + Python 3.12 (async)                                |
| Frontend  | React 19 + TypeScript 5 (strict) + Vite 6                   |
| Styling   | Tailwind CSS v4 + shadcn/ui                                  |
| Graph viz | ReactFlow (factory node graph)                                |
| AI        | ai-aggregator (chrysa) — local Ollama fallback               |
| Database  | SQLite (local-first) → Postgres if multi-user                |
| Container | Docker (multi-stage), Traefik reverse proxy                  |
| CI        | GitHub Actions (chrysa/github-actions reusable workflows)    |

## Status

**V1 feature-complete — gate validation in progress until 2026-06-24.**
See [`docs/gate-v1-validation.md`](docs/gate-v1-validation.md). No new features land
before the gate verdict.

| Sprint | Features |
|--------|----------|
| SFM-1→5 | Scaffold, CI/CD, blueprints list + search, tag system |
| SFM-6→9 | Blueprint tags, tag filter, local sync agent (file watcher) *(SFM-7 deferred)* |
| SFM-10→13 | Home dashboard + stats, calculator, factory plans CRUD, ReactFlow production graph |
| SFM-14→17 | Plan detail + target items, save calc result to plan, search/filter plans, home stats |
| SFM-18→20 | Floating AI assistant widget, plan duplicate + export, toast notification system |
| SFM-21 | Playwright E2E test suite (24 tests, CI quality gate) |

## Quickstart

```bash
make install       # Install dependencies
make dev           # Start backend + frontend
make test          # Run tests (via Docker)
```

## License

MIT
