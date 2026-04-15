# syntax=docker/dockerfile:1.4

FROM python:3.14-slim

COPY docker-entrypoint.sh /opt/docker-entrypoint.sh

ENV PYTHONPATH=/app \
    PATH=$PATH:/home/pre-commit/.local/bin

WORKDIR /app/

RUN set -x \
    && DEBIAN_FRONTEND=noninteractive apt-get update -qq \
    && DEBIAN_FRONTEND=noninteractive apt-get install -qq -o=Dpkg::Use-Pty=0 --no-install-recommends -y bash apt-transport-https ca-certificates curl gnupg2 software-properties-common python3-distutils \
    && useradd -ms /usr/bin/bash pre-commit \
    && apt-get update -qq \
    && apt-get install -qq -o=Dpkg::Use-Pty=0 --no-install-recommends -y git git-lfs jq curl vim \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* \
    && git lfs install

USER pre-commit

RUN set -x \
    && python -m pip install --quiet --no-cache-dir --upgrade pip \
    && pip install --quiet --no-cache-dir docker-compose pre-commit==3.2.2 \
    && git config --global core.filemode false

ENTRYPOINT ["/opt/docker-entrypoint.sh"]