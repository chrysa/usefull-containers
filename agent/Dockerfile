# ── deps stage ─────────────────────────────────────────────────────────────
FROM python:3.12-slim AS deps

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
