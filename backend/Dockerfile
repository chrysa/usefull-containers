# ── Stage 1 : deps ────────────────────────────────────────────────────────────
FROM python:3.12-slim AS deps

WORKDIR /app
RUN pip install --no-cache-dir "setuptools>=70" wheel

COPY pyproject.toml .
RUN pip install --no-cache-dir ".[dev]"

# ── Stage 2 : builder ─────────────────────────────────────────────────────────
FROM deps AS builder

COPY app/ app/

# ── Stage 3 : production ──────────────────────────────────────────────────────
FROM python:3.12-slim AS production

WORKDIR /app

RUN addgroup --system app && adduser --system --ingroup app app

COPY --from=deps /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=deps /usr/local/bin/uvicorn /usr/local/bin/uvicorn
COPY --from=builder /app/app ./app

RUN mkdir -p /data/blueprints && chown -R app:app /data /app

USER app

ENV BLUEPRINTS_DIR=/data/blueprints \
    PORT=8000

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/v1/health')" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
