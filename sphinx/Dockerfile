# syntax=docker/dockerfile:1.4

FROM python:3.14-alpine

ENV PYTHONPATH=/app

ENV PATH=$PATH:/home/sphinx/.local/bin

WORKDIR /app

RUN set -x \
    && apk add --quiet --no-cache openssl-dev gcc libffi-dev python3-dev musl-dev build-base bash \
    && addgroup -S sphinx \
    && adduser -D --system --shell /usr/bin/bash sphinx sphinx \
    && rm -rf /var/cache/apk/* \
    && chown -R sphinx:sphinx /app

USER sphinx

RUN set -x \
    && python -m pip install --quiet --no-cache-dir --upgrade pip \
    && pip install --quiet --no-cache-dir graphviz==0.20.1 \
    && pip install --quiet --no-cache-dir recommonmark==0.7.1 \
    && pip install --quiet --no-cache-dir sphinx==6.1.3 \
    && pip install --quiet --no-cache-dir sphinx-rtd-theme==1.2.0

CMD ["sphinx-build", "-b", "html", ".", "_build"]
