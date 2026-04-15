# syntax=docker/dockerfile:1.4

FROM python:3.14-alpine

ENV PATH=$PATH:/root/.local/bin \
    GIT_DISCOVERY_ACROSS_FILESYSTEM=true

WORKDIR /app

RUN set -x \
    && apk add --quiet --no-cache build-base bash git \
    && rm -rf /var/cache/apk/* \
    && python -m pip install --quiet --no-cache-dir --upgrade pip \
    && pip install --quiet --no-cache-dir ruff==0.9.10

COPY docker-entrypoint.sh /opt/docker-entrypoint.sh

RUN set -x \
    && chmod +x /opt/docker-entrypoint.sh

SHELL ["/bin/bash", "-c"]

ENTRYPOINT ["/opt/docker-entrypoint.sh"]