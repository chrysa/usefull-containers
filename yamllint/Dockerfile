# syntax=docker/dockerfile:1.4

FROM python:3.14-alpine

COPY docker-entrypoint.sh /opt/docker-entrypoint.sh
COPY yamllint-default.yaml /opt/yamllint-default.yaml

ENV PYTHONPATH=/app \
    PATH=$PATH:/home/yamllint/.local/bin

WORKDIR /app

RUN set -x \
    && apk add --quiet --no-cache bash \
    && addgroup -S yamllint \
    && adduser -D --system --shell /usr/bin/bash yamllint yamllint \
    && rm -rf /var/cache/apk/* \
    && chown -R yamllint:yamllint /app \
    && chmod +x /opt/docker-entrypoint.sh

USER yamllint

RUN set -x \
    && python -m pip install --prefer-binary --quiet --no-cache-dir --upgrade pip \
    && pip install --prefer-binary --quiet --no-cache-dir yamllint==1.35.1

ENTRYPOINT ["/opt/docker-entrypoint.sh"]
