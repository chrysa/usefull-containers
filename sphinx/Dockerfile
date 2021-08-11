FROM  python:3.9-alpine

ENV PYTHONPATH=/app\
    PATH=$PATH:/home/sphinx/.local/bin


WORKDIR /app

RUN set -x \
 && apk add --quiet --no-cache openssl-dev gcc libffi-dev python3-dev musl-dev build-base bash \
 && addgroup -S mypy \
 && adduser -D --system --shell /usr/bin/bash mypy mypy \
 && rm -rf /var/cache/apk/* \
 && chown -R sphinx:sphinx /app

USER sphinx

RUN set -x \
 && pip install --quiet --no-cache-dir graphviz==0.16 \
 && pip install --quiet --no-cache-dir recommonmark==0.7.1 \
 && pip install --quiet --no-cache-dir sphinx==3.4.3 \
 && pip install --quiet --no-cache-dir sphinx-rtd-theme==0.5
