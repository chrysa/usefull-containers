FROM  python:3.9-alpine

WORKDIR  /app

ENV PATH=$PATH:/home/flake8/.local/bin

RUN set -x \
 && apk add --quiet --no-cache build-base bash \
 && rm -rf /var/cache/apk/* \
 && addgroup -S flake8 \
 && adduser -D --system --shell /usr/bin/bash flake8 flake8 \
 && chown -R flake8:flake8 /app \
 && pip install --quiet --upgrade pip

USER flake8

RUN set -x \
 && pip install -q flake8==3.8.4 \
 && pip install -q flake8-black==0.2.1 \
 && pip install -q flake8-html==0.4.1 \
 && pip install -q flake8-junit-report==2.1.0 \
 && pip install -q flake8-mypy==17.8.0

CMD ["flake8", "--help"]
