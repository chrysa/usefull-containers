# syntax=docker/dockerfile:1.4

FROM python:3.14-alpine

WORKDIR /app

COPY docker-entrypoint.sh /opt/docker-entrypoint.sh
COPY setup-default.cfg /opt/setup-default.cfg

ENV PATH=$PATH:/home/flake8/.local/bin

RUN set -x \
    && apk add --quiet --no-cache build-base bash \
    && rm -rf /var/cache/apk/* \
    && addgroup -S flake8 \
    && adduser -D --system --shell /usr/bin/bash flake8 flake8 \
    && chown -R flake8:flake8 /app \
    && chmod +x /opt/docker-entrypoint.sh

USER flake8

RUN set -x \
    && python -m pip install --only-binary :all: --quiet --no-cache-dir --upgrade pip \
    && pip install --only-binary :all: --quiet --no-cache-dir flake8==6.0.0 \
    && pip install --only-binary :all: --quiet --no-cache-dir black==23.3.0 \
    && pip install --only-binary :all: --quiet --no-cache-dir flake8-black==0.3.6 \
    && pip install --only-binary :all: --quiet --no-cache-dir flake8-html==0.4.3 \
    && pip install --only-binary :all: --quiet --no-cache-dir flake8-junit-report==2.1.0 \
    && pip install --only-binary :all: --quiet --no-cache-dir flake8-mypy==17.8.0

ENTRYPOINT ["/opt/docker-entrypoint.sh"]
