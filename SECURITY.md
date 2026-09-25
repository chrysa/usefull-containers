# SECURITY — usefull-containers

> Documentation-only review by an automated pass. No code was changed. Findings
> for the owner to action. Severity per finding.

## Secret scan result (FACT)

**No hardcoded secrets found** in tracked files.

- `.env` and `.env.example` contain only placeholders (`MAINTAINER_MAIL=your@email.com`,
  version pins, `DOCKER_REPO=chrys4`). No tokens/passwords.
- Compose files reference secrets **only via environment indirection**:
  `live-platform/docker-compose.yaml` uses `GITHUB_TOKEN: ${GITHUB_TOKEN:-}` and
  `NOTION_TOKEN: ${NOTION_TOKEN:-}` — values come from the host env, not the repo.
- CI secrets (`DOCKER_HUB_TOKEN`, `SONAR_TOKEN`) are GitHub Actions secrets,
  not in-repo.
- `.secrets.baseline` (detect-secrets) and a secret-scanning workflow
  (`.github/workflows/secret-scan.yml`) are present.

## Findings

### S-1 — Docker socket exposure (MEDIUM, FACT)

`pre-commit` and `trivy` containers mount `/var/run/docker.sock`
(`README.md`, respective compose files). Mounting the Docker socket grants
effective root on the host to anything in the container. This is inherent to
their function (running/scanning sibling containers) but should be run only on
trusted code. **Owner action:** document/accept the risk; avoid running these
against untrusted repos.

### S-2 — live-platform token handling (LOW/INFO, INFERENCE)

`live-platform` receives `GITHUB_TOKEN` / `NOTION_TOKEN` via env. Ensure the
GitHub token is least-privilege (read-only) since it reads org repos, and that
tokens are never logged. Not verified in `main.py` (not read in this pass).
**Owner action:** confirm no token logging; scope tokens minimally.

### S-3 — read-only host mount is correct (INFO, FACT)

`live-platform` mounts `${PROJECTS_ROOT}:/projects:ro` and runs as non-root
with `0555` app files — good posture, noted as a positive.

## No HIGH/CRITICAL findings from this documentation pass.

> This pass did not read application source (`live-platform/main.py`, etc.) or
> run SAST. For a real diff review, run `/security-review` or the
> `Senior SecOps Engineer` agent per the global security rule.
