FROM  python:3.9-alpine

WORKDIR  /app

ENV PATH=$PATH:/home/black/.local/bin

RUN set -x \
 && apk add --quiet --no-cache build-base bash \
 && addgroup -S black \
 && adduser -D --system --shell /usr/bin/bash black black \
 && rm -rf /var/cache/apk/* \
 && chown -R black:black /app \
 && pip install --quiet --upgrade pip

USER black

RUN set -x \
 && pip install --quiet black==20.8b1


CMD ["black",  "--help"]
