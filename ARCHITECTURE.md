# Architecture — usefull-containers

> Grounded in the files in this repository (README.md, docker-compose.yaml, Makefile,
> pyproject.toml, per-service `*/Dockerfile` and `*/docker-compose.yaml`). Where the
> README and the manifests disagree, the manifests win; such cases are flagged inline.

## Purpose

A collection of ready-to-use Docker containers for Python code quality, testing, and
application runtime. Tools run one-shot against the current working directory
(`${PWD}:/app`) instead of being installed on the host. Two groups:

- **Quality & tooling containers** — published to Docker Hub under `chrys4`, run
  one-shot against your code (black, ruff, mypy, pytest, trivy, bandit, safety, …).
- **Application & runtime base images** — built locally (not published): Django/DRF,
  Flask, Alembic migrations (`flask-db-migrations`), and the `live-platform` dashboard API.

## Stack

- **Containers**: Docker + Docker Compose (>= 2.20). Root `docker-compose.yaml` aggregates
  each service via `extends` pointing at that service's own `<service>/docker-compose.yaml`.
- **Base images**: `python:3.11-slim` / `python:3.11-alpine` for tooling; `python:3.14-slim`
  (multi-stage) for `live-platform`.
- **Python tooling config**: `pyproject.toml` holds Ruff config only — it declares no
  `[project]` table on purpose; nothing here is an installable/published package.
- **CI/release**: GitHub Actions (`analyse.yml`, `build-and-publish.yml`), GitVersion
  (`GitVersion.yml`), git-cliff (`cliff.toml`), SonarCloud, pre-commit
  (`.pre-commit-config.yaml`), detect-secrets baseline (`.secrets.baseline`).

## Layout

- `docker-compose.yaml` — root aggregator wiring every service via `extends`.
- `Makefile` + `makefiles/` — developer loop (help, build, dev, test, lint, clean).
- One directory per container, each with its own `Dockerfile`, `docker-compose.yaml`,
  and often a `*.Makefile` and default config:
  - Tooling: `black/ ruff/ flake8/ pylint/ mypy/ bandit/ safety/ trivy/ pytest/`
    `pre-commit/ reorder-python-imports/ sphinx/ hadolint/ actionlint/ yamllint/ python-dev/`
  - Runtime base images: `django-drf/ flask/ flask-db-migrations/ live-platform/`
- `standards/ docs/ scripts/` — shared standards, documentation, helper scripts.
- Governance/meta at root: `README.md CLAUDE.md AGENTS.md CONTRIBUTING.md CHANGELOG.md`
  `context-map.json llms-full.txt handover.md .quality-gate.json sonar-project.properties`.

## Entrypoints

- **Make** (`make help`, `make build service=<name>`, `make dev`, `make test`,
  `make lint`, `make clean`). `make test` runs `docker compose config --quiet`
  (validates compose only). `install`/`install-dev` are intentional no-ops — containers
  are standalone and the commit gate is host-native (`pipx install pre-commit`).
- **Per tool**: `docker compose run --rm <tool>` against `${PWD}` (see README per-tool sections).
- **live-platform**: image runs `python3 main.py`, exposes `7891`, `/health` healthcheck,
  runs as non-root user `platform`, mounts `${PROJECTS_ROOT}:/projects:ro`.
  Note: the image's `CMD`/`COPY . /app` expect app source (`main.py`, `requirements.txt`);
  those application files are not present in this directory of the repo (only the
  Dockerfile, compose, and Makefile are).
- **django-drf**: image name built is `dango-drf` (matches source / `DANGO_DRF_CONTAINER_VERSION`),
  served by uWSGI over a Unix socket via `cmd.sh`; a `django-drf-dev` service runs the dev
  server on `8080`. **flask**: uWSGI on `5000`. **flask-db-migrations**: one-shot Alembic
  (`alembic -x data=true upgrade head`).

## Data & external dependencies

- **Docker Hub** (`chrys4`) — publish target for tooling images.
- **live-platform** external inputs via env: `GITHUB_TOKEN`, `GITHUB_ORGS` (default `chrysa`),
  `NOTION_TOKEN`, `PROJECTS_ROOT` (mounted read-only), `PORT`.
- **`.env`** — configuration (maintainer, `DOCKER_REPO`, per-container `*_CONTAINER_VERSION`).
  Copy from `.env.example`; secrets are never committed (a `.secrets.baseline` guards this).
  Discrepancy: root `docker-compose.yaml` references `LIVE_PLATFORM_CONTAINER_VERSION` (and
  `.env.example` lists `SVELTE_CONTAINER_VERSION`) but `.env.example` does not define a
  `LIVE_PLATFORM_CONTAINER_VERSION` key — set it in your `.env`.
- **pre-commit** container needs Docker socket access to run hooks that spin up containers.

## Build & test (real commands)

```bash
cp .env.example .env          # then edit values
make build                    # build all services  (make build service=<name> for one)
make dev                      # docker compose up (all services)
make test                     # docker compose config --quiet  (validates compose)
make lint                     # pre-commit run --all-files
make format-check             # pre-commit run --all-files (report drift, no writes)
docker compose config --quiet # direct compose validation
```

Publishing and versioning are driven by GitHub Actions + GitVersion on push to
`main`/`develop`; see `.github/workflows/` and `README.md`.
