FROM python:3.8-slim

ARG git_user
ARG git_mail

ENV PYTHONPATH=/app

SHELL ["/bin/bash", "-c"]

WORKDIR /app/

RUN set -x \
 && DEBIAN_FRONTEND=noninteractive apt-get update -qq \
 && DEBIAN_FRONTEND=noninteractive apt-get install -qq -o=Dpkg::Use-Pty=0 --no-install-recommends -y apt-transport-https ca-certificates curl gnupg2 software-properties-common \
 && curl -fsSL "https://download.docker.com/linux/$(lsb_release -is | tr '[A-Z]' '[a-z]')/gpg" | apt-key add - \
 && echo "deb [arch=amd64] https://download.docker.com/linux/$(lsb_release -is | tr '[A-Z]' '[a-z]') $(lsb_release -cs) stable" > /etc/apt/sources.list.d/docker.list \
 && DEBIAN_FRONTEND=noninteractive apt-get update -qq \
 && DEBIAN_FRONTEND=noninteractive apt-get install -qq -o=Dpkg::Use-Pty=0 --no-install-recommends -y build-essential docker-ce git git-lfs jq curl vim \
 && DEBIAN_FRONTEND=noninteractive apt-get clean \
 && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN set -x \
 && git lfs install \
 && pip install --quiet --no-cache-dir --upgrade pip \
 && pip install --quiet --no-cache-dir docker-compose pre-commit \
 && git config --global user.name ${git_user} \
 && git config --global user.email ${git_mail} \
 && git config --global core.filemode false

ENTRYPOINT ["pre-commit", "install", "&&", "pre-commit", "install-hooks"]

CMD ["pre-commit", "--help"]
