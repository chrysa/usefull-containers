# syntax=docker/dockerfile:1.4

FROM python:3.14-slim

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONPATH=/app \
    PYTHONBREAKPOINT=ipdb.set_trace

WORKDIR /app

RUN set -x \
    && python -m pip install --only-binary :all: --quiet --no-cache-dir --upgrade pip \
    && pip install --only-binary :all: --quiet --no-cache-dir ipython==8.12.0 \
    && pip install --only-binary :all: --quiet --no-cache-dir ipdb==0.13.13 \
    && pip install --only-binary :all: --quiet --no-cache-dir prompt-toolkit==3.0.38

CMD ["ipython"]
