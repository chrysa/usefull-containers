FROM  python:3.9-alpine

WORKDIR  /app

ENV PATH=$PATH:/home/black/.local/bin

RUN set -x \
 && apk add --quiet --no-cache build-base bash \
 && rm -rf /var/cache/apk/* \
 && pip install --quiet --no-cache-dir --upgrade pip

RUN set -x \
 && addgroup --system black \
 && adduser --disabled-password --system --shell /usr/bin/bash --ingroup black black \
 && chown -R black:black /app

USER black

RUN set -x \
 && pip install --quiet --no-cache-dir black==20.8b1


CMD ["black",  "--help"]
