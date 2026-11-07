# GLOSSARY — usefull-containers

| Term | Meaning |
|---|---|
| Quality/tooling container | Disposable image (black, ruff, mypy, …) run one-shot against `${PWD}:/app`; published to Docker Hub `chrys4`. |
| Application/runtime container | Local build base image for running apps (django-drf, flask, flask-db-migrations, live-platform); not published. |
| `chrys4` | Docker Hub namespace for published tooling images. |
| `DOCKER_REPO` | `.env` var choosing image namespace; `chrys4` for tools, `local` default for app images. |
| `<TOOL>_CONTAINER_VERSION` | Per-container semver pin in `.env` / `.env.example`. |
| `extends` | Docker Compose mechanism the root `docker-compose.yaml` uses to pull each service from its subdir compose file. |
| GitVersion | Tool computing semver from git history; configured in `GitVersion.yml` (`GitHubFlow` mode). |
| live-platform | Real-time dashboard backend (REST + SSE, :7891) aggregating GitHub + Notion data. |
| `dango-drf` | Actual built image name for the django-drf service (typo preserved in source). |
| shared-standards | Canonical `chrysa/shared-standards` repo; `standards/` and `.claude/` assets here are vendored copies. |
| `distribute-standards.sh` | Idempotent script that syncs shared standards into this repo. |
| Generated context files | `handover.md`, `AGENTS.md`, `context-map.json` produced by `scripts/gen_context_files.py` (ADR D-0012). |
| SSE | Server-Sent Events — one-way streaming channel used by live-platform. |
