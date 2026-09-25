# ARCHITECTURE — usefull-containers

> Generated as documentation-only. Tags: **FACT** (verified in-repo), **INFERENCE** (reasoned from evidence), **UNKNOWN** (not determinable from repo).

## 1. Purpose (FACT)

`usefull-containers` is a collection of ready-to-use Docker containers for Python
code quality, testing, and application runtime. Each tool is packaged as a
disposable container run against the current working directory (`${PWD}:/app`)
instead of being installed on the host. Evidence: `README.md`, `docker-compose.yaml`.

The repo splits into two groups (FACT, `README.md`):

- **Quality & tooling containers** — published to Docker Hub under `chrys4`, run
  one-shot against your code.
- **Application & runtime containers** — local build images for running apps.

## 2. Top-level layout (FACT)

```
usefull-containers/
├── docker-compose.yaml        # root aggregator: `extends` each service's compose
├── Makefile                   # aggregates every <name>/*.Makefile + makefiles/*.Makefile
├── makefiles/                 # docker / quality / quality-gate / project make fragments
├── <tool>/                    # one dir per container (Dockerfile, docker-compose.yaml, .Makefile, config)
├── live-platform/             # runtime app container (multi-stage, non-root)
├── standards/rules/*.md       # vendored chrysa canon (read-only, synced)
├── scripts/                   # quality_gate.py, gen_context_files.py
├── docs/reference/            # github-inspiration.md
└── .github/workflows/         # CI/CD
```

## 3. Compose aggregation model (FACT)

The root `docker-compose.yaml` declares one service per tool and uses Compose
`extends` to pull each service definition from its own subdirectory
(`<tool>/docker-compose.yaml`). A single named volume `sockets` is declared at
root. This keeps each container self-contained while allowing
`make build/up/status` to operate fleet-wide.

## 4. Container catalogue

### 4.1 Quality & tooling (published to `chrys4`) (FACT, `README.md`)

| Container | Base image | Docker Hub | Role |
|---|---|---|---|
| black | `pyfound/black:23.3.0` | `chrys4/black` | Formatter |
| flake8 | `python:3.11-alpine` | `chrys4/flake8` | PEP 8 + HTML/JUnit report |
| hadolint | `hadolint/hadolint:latest-debian` | `chrys4/hadolint` | Dockerfile linter |
| mypy | `python:3.11-alpine` | `chrys4/mypy` | Static type checker |
| pre-commit | `python:3.11-slim` | `chrys4/pre-commit` | Git hook manager (needs Docker socket) |
| pylint | `python:3.11-alpine` | `chrys4/pylint` | Static analyser + report |
| pytest | `python:3.11-alpine` | `chrys4/pytest` | Test runner + coverage |
| python-dev | `python:3.11-slim` | `chrys4/python-dev` | IPython + ipdb shell |
| reorder-python-imports | `python:3.11-alpine` | `chrys4/reorder-python-imports` | Import sorter |
| sphinx | `python:3.11-alpine` | `chrys4/sphinx` | Docs generator |
| ruff | `python:3.13-alpine` | `chrys4/ruff` | Fast linter/formatter |
| bandit | `python:3.13-alpine` | `chrys4/bandit` | Python security SAST |
| safety | `python:3.13-alpine` | `chrys4/safety` | Dependency vuln check |
| trivy | `aquasec/trivy:0.61.0` | `chrys4/trivy` | Container/FS vuln scanner (needs Docker socket) |
| actionlint | `rhysd/actionlint:latest` | `chrys4/actionlint` | GH Actions linter |
| yamllint | `python:3.13-alpine` | `chrys4/yamllint` | YAML linter |

### 4.2 Application & runtime (local build only) (FACT, `README.md`)

| Service | Base image | Purpose |
|---|---|---|
| django-drf | `python:3.14-alpine` | Django + DRF base (uWSGI, socket) |
| flask | `python:3.14-alpine` | Flask base (flask-restx, marshmallow, uWSGI :5000) |
| flask-db-migrations | `python:3.14-alpine` | Alembic/SQLAlchemy migration runner (PostgreSQL) |
| live-platform | `python:3.14-slim` | Real-time dashboard API + SSE (:7891) |

> Naming quirk (FACT, `README.md`): the django-drf built image is named
> `dango-drf` (typo preserved), matching the source and
> `DANGO_DRF_CONTAINER_VERSION`.

## 5. live-platform runtime (FACT, `live-platform/Dockerfile` + compose)

- Multi-stage build (`base` → `deps` → `runtime`), runs as non-root user `platform`.
- App files copied `--chmod=0555` (read-only).
- Exposes `7891`; `HEALTHCHECK` hits `/health`.
- Entrypoint `python3 main.py`.
- Aggregates data from **GitHub and Notion** (INFERENCE from env vars +
  `README.md`): env `GITHUB_TOKEN`, `GITHUB_ORGS` (default `chrysa`),
  `NOTION_TOKEN`, `PORT` (7891), `PROJECTS_ROOT` (/projects).
- Mounts the host projects root **read-only** (`${PROJECTS_ROOT}:/projects:ro`).

## 6. Build, version & publish flow (FACT)

- Per-container versions are pinned in `.env` / `.env.example`
  (`<TOOL>_CONTAINER_VERSION`), image repo via `DOCKER_REPO` (default `chrys4`;
  `local` for app images).
- CI computes semver via **GitVersion** (`GitHubFlow` mode, `GitVersion.yml`),
  builds, and pushes tooling images to Docker Hub (`build-and-publish.yml`).
- SonarCloud scans quality (`sonar.yml`). `analyse.yml` runs pre-commit +
  hadolint per service.

## 7. Governance / provenance (FACT)

- `standards/rules/*.md`, `.claude/` hooks/thresholds/skills, and the
  `chrysa:standards` block in `CLAUDE.md` are **vendored from
  `chrysa/shared-standards`** via `distribute-standards.sh` — read-only here.
- `handover.md`, `AGENTS.md`, `context-map.json` are **generated** by
  `scripts/gen_context_files.py` (ADR D-0012) — regenerate with
  `make gen-context-files`, do not hand-edit.
- `CHANGELOG.md` is auto-generated from conventional commits via `git cliff`.

## 8. Known contradiction (FACT)

The git `origin` remote points to `git@github.com:chrysa/satisfactory-factory-manager.git`,
but every in-repo reference (README badges, `.env` `VCS=`, CI, CLAUDE.md) names
`chrysa/usefull-containers`. See DECISIONS.md D-CONTRA-001 and REVIEW.md.
