FROM python:3.8-slim

ENV PYTHONPATH=/app \
    PATH=$PATH:/home/pre-commit/.local/bin

WORKDIR /app/

RUN set -x \
 && apt-get update -qq \
 && apt-get install -qq -o=Dpkg::Use-Pty=0 --no-install-recommends -y bash apt-transport-https ca-certificates curl gnupg2 software-properties-common \
 && curl -fsSL "https://download.docker.com/linux/$(lsb_release -is | tr '[A-Z]' '[a-z]')/gpg" | apt-key add - \
 && echo "deb [arch=amd64] https://download.docker.com/linux/$(lsb_release -is | tr '[A-Z]' '[a-z]') $(lsb_release -cs) stable" > /etc/apt/sources.list.d/docker.list \
 && apt-get update -qq \
 && apt-get install -qq -o=Dpkg::Use-Pty=0 --no-install-recommends -y build-essential docker-ce git git-lfs jq curl vim \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* \
 && git lfs install \
 && pip install --quiet --no-cache-dir  --upgrade pip

RUN addgroup --system pre-commit
RUN adduser --disabled-password --system --shell /usr/bin/bash --ingroup pre-commit pre-commit
RUN chown -R pre-commit:pre-commit /app

USER pre-commit

RUN set -x \
 && pip install --quiet --no-cache-dir  docker-compose pre-commit==2.9.3 \
 && git config --global core.filemode false

CMD ["pre-commit", "run", "--all-files", "--hook-stage=manual"]
