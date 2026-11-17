# REQUIREMENTS — usefull-containers

> Reconstructed from repo evidence (documentation-only). "IMPLEMENTED" is used
> only where verifiable in-repo; otherwise INFERRED/UNKNOWN.

## Functional

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| REQ-TOOL-001 | Provide 16 disposable Python quality/tooling containers, each runnable against `${PWD}:/app` | IMPLEMENTED | per-tool `Dockerfile` + `docker-compose.yaml`; `README.md` table |
| REQ-TOOL-002 | Publish tooling images to Docker Hub under `chrys4` | IMPLEMENTED (pipeline present) | `build-and-publish.yml`, `README.md` |
| REQ-APP-001 | Provide Django+DRF base image (uWSGI socket + dev server :8080) | IMPLEMENTED | `django-drf/` (Dockerfile, cmd.sh, compose) |
| REQ-APP-002 | Provide Flask base image (uWSGI :5000) | IMPLEMENTED | `flask/` |
| REQ-APP-003 | Provide Alembic/SQLAlchemy migration runner for PostgreSQL | IMPLEMENTED | `flask-db-migrations/` |
| REQ-APP-004 | Provide live-platform dashboard API + SSE (:7891, `/health`) aggregating GitHub+Notion | IMPLEMENTED (build) | `live-platform/Dockerfile` + compose; runtime behaviour not source-verified |
| REQ-BUILD-001 | Single Make interface to build/run/status/publish all services | IMPLEMENTED | `Makefile`, `makefiles/*.Makefile` |
| REQ-BUILD-002 | Per-container semantic versioning via GitVersion | IMPLEMENTED | `GitVersion.yml`, `.env` version pins |

## Non-functional

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| REQ-NFR-001 | live-platform runs non-root, read-only app + read-only host mount | IMPLEMENTED | `live-platform/Dockerfile`, compose |
| REQ-NFR-002 | No secrets committed; env-indirection only | IMPLEMENTED | `.env*`, compose (see SECURITY.md) |
| REQ-NFR-003 | English-only, Conventional Commits, feature-branch flow | ENFORCED (CI) | `CLAUDE.md`, `enforce-*` workflows |
| REQ-NFR-004 | Quality gates: pre-commit, hadolint, SonarCloud, Sonar quality gate | IMPLEMENTED | `analyse.yml`, `sonar.yml`, `.quality-gate.json`, `scripts/quality_gate.py` |

## Gaps / UNKNOWN

- No automated test suite for the container images themselves was found (see TESTING.md).
- `SVELTE_CONTAINER_VERSION` present but empty — planned, not implemented.
