# ── deps stage ─────────────────────────────────────────────────────────────
FROM python:3.14-slim AS deps

WORKDIR /app

COPY pyproject.toml .
RUN pip install --no-cache-dir -e ".[dev]"

COPY sfm_agent/ sfm_agent/
COPY tests/ tests/

# ── production stage ────────────────────────────────────────────────────────
FROM deps AS production

RUN pip install --no-cache-dir -e . --no-deps

RUN adduser --disabled-password --gecos "" appuser
USER appuser

ENTRYPOINT ["sfm-agent"]

# ── dev stage (test/lint tooling for docker-compose.test.yml) ─────────────────
# `deps` already carries the [dev] extras + source + tests; add the editable
# install so `sfm_agent` resolves without a baked USER. Compose runs it as the
# host UID, keeping bind-mounted artifacts host-owned.
FROM deps AS dev

RUN pip install --no-cache-dir -e . --no-deps
