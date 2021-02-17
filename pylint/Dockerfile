FROM  python:3.9-alpine

ENV PYTHONPATH=/app \
    PATH=$PATH:/home/pylint/.local/bin

WORKDIR /app

RUN set -x \
 && apk add --quiet --no-cache build-base bash \
 && addgroup -S pylint \
 && adduser -D --system --shell /usr/bin/bash pylint pylint \
 && rm -rf /var/cache/apk/* \
 && chown -R pylint:pylint /app \
 && pip install --quiet --upgrade pip

USER pylint

RUN set -x \
 && pip install --quiet pylint==2.6.0 \
 && pip install --quiet pylint-junit==0.3.2 \
 && pip install --quiet pylint-report==0.1.0


CMD ["pylint", "--help"]
