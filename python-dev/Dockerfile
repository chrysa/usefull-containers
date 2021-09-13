FROM  python:3.9-slim

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONPATH=/app \
    PYTHONBREAKPOINT=ipdb.set_trace

WORKDIR /app

RUN set -x \
 && apk add --quiet --no-cache build-base ipython \
 && rm -rf /var/cache/apk/* \
 && pip install --quiet --no-cache-dir --upgrade pip

RUN set -x \
 && pip install --quiet --no-cache-dir ipdb==0.13.4 \
 && pip install --quiet --no-cache-dir prompt-toolkit==3.0.14
