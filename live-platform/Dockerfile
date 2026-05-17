# syntax=docker/dockerfile:1.4

FROM python:3.13-slim AS base

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONPATH=/app \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=7891

WORKDIR /app

RUN set -x \
    && python -m pip install --only-binary :all: --quiet --no-cache-dir --upgrade pip \
    && addgroup --system platform \
    && adduser --system --shell /bin/sh --ingroup platform platform \
    && chown -R platform:platform /app

# ── deps ──────────────────────────────────────────────────────────────────────

FROM base AS deps

COPY requirements.txt /tmp/requirements.txt

RUN pip install --only-binary :all: --quiet --no-cache-dir -r /tmp/requirements.txt

# ── runtime ───────────────────────────────────────────────────────────────────

FROM deps AS runtime

COPY --chown=platform:platform --chmod=0555 . /app

USER platform

EXPOSE 7891

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
    CMD python3 -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:${PORT}/health')"

CMD ["python3", "main.py"]
