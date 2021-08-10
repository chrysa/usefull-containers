FROM  python:3.9-alpine

WORKDIR  /app

ENV PATH=$PATH:/home/black/.local/bin

RUN set -x \
 && apk add --quiet --no-cache build-base bash \
 && rm -rf /var/cache/apk/* \
 && addgroup -S black \
 && adduser -D --system --shell /usr/bin/bash black black \
 && chown -R black:black /app

USER black

RUN pip install --quiet --no-cache-dir black==20.8b1

CMD ["black",  "--help"]
