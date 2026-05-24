# Tests — satisfactory-factory-manager

## Structure

- `tests/backend/` — FastAPI unit and integration tests (mirrors `backend/app/`)
- `tests/e2e/` — Playwright E2E tests (critical flows: navigation, plans CRUD, blueprints, home dashboard)

## Running tests

### Unit / integration tests (backend)

```bash
make test        # runs pytest via Docker (with coverage)
make agent-test  # runs sfm-agent module tests
```

### E2E tests (Playwright)

```bash
make docker-e2e  # builds all services + runs Playwright in Docker
```

The E2E suite starts a full stack (backend + frontend) using `docker-compose.e2e.yml` with a
fresh in-memory SQLite database, then runs Playwright in the official
`mcr.microsoft.com/playwright:v1.52.0-noble` container.

**Specs:**

| File | Covers |
|---|---|
| `navigation.spec.ts` | All page routes load correctly, 404 handling |
| `home.spec.ts` | Dashboard stats, hub status, quick access links |
| `blueprints.spec.ts` | Blueprint Sync page elements and empty state |
| `plans.spec.ts` | Factory Plans page elements + full CRUD flow (create, search, open, duplicate, delete) |

**Reports** (written to `tests/e2e/playwright-report/` — gitignored):

```bash
# After a local run inside Docker, copy the report out and open it:
npx playwright show-report tests/e2e/playwright-report
```
