# CONSTRAINTS — usefull-containers

> Documentation-only. Each constraint tagged HARD (enforced/blocking) or
> SOFT (convention). Evidence pointers included.

## Runtime / tooling (HARD, FACT — `README.md`)

- Docker >= 24, Docker Compose >= 2.20, GNU Make >= 4.3, Python >= 3.13
  (pre-commit local execution).
- The `Makefile` errors out if not run under GNU Make (FACT, `Makefile`).

## Container model (HARD, FACT)

- Tools run one-shot against `${PWD}:/app`; state is not persisted in the tool
  containers.
- `pre-commit` and `trivy` require Docker socket access
  (`/var/run/docker.sock`) to spin up / scan containers (FACT, `README.md`).

## Security posture (HARD, FACT)

- `live-platform` runs as **non-root** (`platform` user), app files `0555`
  (`live-platform/Dockerfile`).
- `live-platform` mounts the host projects root **read-only**
  (`:/projects:ro`).
- Secrets are supplied only via environment indirection (`${GITHUB_TOKEN:-}`,
  `${NOTION_TOKEN:-}`); none are committed (FACT — see SECURITY.md).

## Versioning & publish (HARD, FACT)

- Semver via GitVersion `GitHubFlow` mode (`GitVersion.yml`).
- Per-container versions pinned in `.env` (`<TOOL>_CONTAINER_VERSION`).
- Publish to Docker Hub gated on push to `main`/`develop` with
  `DOCKER_HUB_TOKEN` + `DOCKER_HUB_USERNAME` (FACT, `README.md`, CI).

## Governance (HARD, FACT)

- `standards/`, `.claude/` shared assets, and the `chrysa:standards` /
  `gitnexus` blocks in `CLAUDE.md` are vendored from `chrysa/shared-standards`
  and must not be hand-edited here.
- `handover.md`, `AGENTS.md`, `context-map.json` are generated
  (`gen_context_files.py`, ADR D-0012); `CHANGELOG.md` via `git cliff`.

## Conventions (SOFT, FACT)

- English-only for all code, comments, docs, config (`CLAUDE.md`).
- Conventional Commits; feature-branch workflow (CI enforces via
  `enforce-feature-branch.yml`, `enforce-shortcut-link.yml`).
