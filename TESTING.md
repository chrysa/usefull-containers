# TESTING — usefull-containers

> Documentation-only. Commands below are transcribed from repo files; they were
> NOT executed in this pass. Verify locally before relying on them.

## What exists (FACT)

This repo ships *tooling* rather than an application, so its "tests" are the
quality gates it runs on itself, plus the tools it provides to consumers.

### Self-checks (CI, FACT — `README.md`, `.github/workflows/`)

- `analyse.yml` — pre-commit hooks + hadolint per service (push / PR).
- `sonar.yml` — SonarCloud quality scan (push `main` / weekly).
- `quality-gate-check.yml` + `scripts/quality_gate.py` + `.quality-gate.json`
  — quality-gate enforcement.
- `action-check.yml`, `detect-conflicts.yml`, `pull-request-size.yml`, etc.

### Local commands (FACT — `README.md`, `Makefile`)

```bash
make help                 # list all targets
make build                # build all services
make status               # container statuses
make hadolint-analyse     # lint all Dockerfiles
make pre-commit           # run pre-commit on all files
make packages-version     # list outdated packages per service
```

### live-platform runtime check (FACT)

- Container `HEALTHCHECK` GETs `http://127.0.0.1:${PORT}/health`
  (`live-platform/Dockerfile`).
- `make live-platform-up` then check `/health` on :7891.

## Gaps (UNKNOWN / INFERENCE)

- No dedicated test suite verifying each built image (e.g. "black actually
  formats", "pytest image runs") was found. Image behaviour is validated
  implicitly via CI build + hadolint, not functional tests.
- `pytest` is provided as a *consumer* tool; the repo itself has no `tests/`
  directory at root.

**Owner action:** if functional image tests are desired, document/add them.
