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

<!-- chrysa:standards-copilot:start · generated · DO NOT EDIT -->
## chrysa standards (generated)

> The same rules as `CLAUDE.md`, for GitHub Copilot. Detail loads on demand from `standards/rules/<domain>.md`; the canon is `standards/STANDARDS.chrysa.md`.

### Governance, language & compliance · `standards/rules/governance.md`
- Normative annexes
- Language
- Compliance targets
- Governance — strategic pillars & ADR format

### Cross-cutting stack · `standards/rules/stack.md`
- Cross-cutting stack (settled ADRs — do not relitigate)

### SCM — branches, commits & pull requests · `standards/rules/scm.md`
- Commits
- Branches
- Branch model — `main` is production, `develop` is the workspace
- Merge
- One PR per issue
- Issues and PRs are type-driven

### Architecture, decoupling & portability · `standards/rules/architecture.md`
- Repo provenance — every code repo depends on `project-init`
- Every repo declares its profile and DDD level
- Projects talk through versioned contracts only
- Everything is machine-agnostic and portable — no rule, repo, or script is bound to one machine
- Every external server the service talks to is addressed through the environment — never hardcoded
- Every tracked file and folder must earn its place — a repo holds only what is useful to it now
- The repository architecture is legible to an agent — optimised for Claude, not only for humans
- Deferred work is a governed job, not a fire-and-forget

### Testing · `standards/rules/testing.md`
- Tests: pytest only
- Frontend tests: Vitest + Testing Library + MSW — from the scaffold, not later

### Frontend & web semantics · `standards/rules/frontend.md`
- TypeScript is strict by contract
- The JS/TS package manager is `pnpm` — `npm` and `yarn` are forbidden
- React is a presentation layer, not the domain
- The frontend says when the backend is unreachable or unstable
- The frontend is reactive and real-time by default
- UI state survives reload & focus
- Everything is semantic — the markup, the data, and the URLs
- URL-addressable frontend navigation — mandatory

### APIs, contracts & real-time · `standards/rules/api.md`
- A real-time backend has channel contracts and never blocks
- APIs, SDKs & public contracts follow the `STD-API-001` contract

### Accessibility · `standards/rules/accessibility.md`
- Dark mode
- Every site is usable by the majority of disabilities — not only the screen-reader case

### Documentation & session state · `standards/rules/docs.md`
- Notion logging
- Documentation and Notion are maintained in lockstep with the code — a change that leaves them stale is unfinished
- Session lifecycle (primer + memory + hindsight)

### AI agents & features · `standards/rules/agents.md`
- Agent actions are governed
- An AI feature is evaluated, not just shipped
- An agent writes only where the owner owns

### Security, identity & sessions · `standards/rules/security.md`
- Per-person data implies a user account — no exceptions dressed up as simplicity
- Identity goes through the cluster SSO first
- A session is secured and it expires
- Every form is a hostile input surface — validate on the server, always
- Security scanning is a gate, not an afterthought — it runs in pre-commit and in CI

### Code quality & anti-patterns · `standards/rules/code-quality.md`
- No hardcoded constants
- No literal HTTP status codes — use the constants the framework already ships
- No code duplication — the second occurrence is an extraction order
- Raised errors are typed
- Failures are contained, and observable
- Prefer a lookup table to a state machine
- Decompose into small, independently unit-testable methods
- Code is read far more often than it is written — optimise for the reader, and standardise the form
- Avoid lambdas and anonymous constructs — a named function is the default
- Basic optimisations and known anti-patterns are caught in review and in CI
- A cache is a correctness contract, not a sprinkle of speed
- Quality gates
- Error handling pattern (all automations)

### Backend Python · `standards/rules/backend-python.md`
- Python packaging — `pyproject.toml` is the single source of truth
- Python is written object-oriented, one class per file
- Import the item, not the module — `from x import y; y()`
- Functions and methods are called with named arguments — positional call sites are the exception, not the rule

### Data, persistence & migrations · `standards/rules/data.md`
- Data, persistence & migrations follow the `STD-DATA-001` contract

### Observability & operations · `standards/rules/observability.md`
- Observability & production readiness follow the `STD-OPS-001` contract
- The container is versioned separately from the application it hosts, and an admin can see what is actually deployed
- Observability — error-tracking → GitHub issues (norm)

### Containers & compose · `standards/rules/containers.md`
- Everything runs in a container — the only exception is the slice of a repo genuinely bound to the host OS
- External dependencies are installed in containers, never on the host
- No virtualenv in a repo — ever
- Tool caches & deps never touch the project tree
- Dockerfiles are multi-stage, with a `production` and a `dev` stage — mandatory
- App containers ship the app only — the platform layer is the owner's responsibility
- Only a publicly useful port is published — everything else stays on the container network
- A compose file is minimal — declare only what the stack needs, default the rest
- Dev stage must hot-reload
- Local dev runs the code in-container, live, in debug mode — never the production server
- Default to dev mode when starting an app locally — any other mode only when explicitly asked
- `.dockerignore` mandatory & exhaustive
- Container-runtime policy

### Product surfaces · `standards/rules/product.md`
- Setup wizard & config panel
- A game is DRM-free and fully playable solo offline
- Every product that is operated ships a management backoffice
- If a user can supply a file, the product accepts an upload
- A floating assistant where it earns its place — never as decoration

### Design system · `standards/rules/design.md`
- Design system

### Developer loop & tooling · `standards/rules/dev-loop.md`
- Makefile targets
- Shared skills (load on demand from shared-standards/.claude/skills/)

### CI/CD, pre-commit & release · `standards/rules/ci-cd.md`
- Release & changelog config (canonical)
- GitHub Actions (reuse first · custom actions centralised · thin workflows)
- Pre-commit & git hooks (native, via pre-commit.com — never wrapped in make)
<!-- chrysa:standards-copilot:end -->
