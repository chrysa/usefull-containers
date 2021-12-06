FROM  python:3.9-slim

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONPATH=/app \
    PYTHONBREAKPOINT=ipdb.set_trace

WORKDIR /app

RUN set -x \
 && pip install --quiet --no-cache-dir --no-cache-dir --upgrade pip \
 && pip install --quiet --no-cache-dir ipython==7.30.0 \
 && pip install --quiet --no-cache-dir ipdb==0.13.9 \
 && pip install --quiet --no-cache-dir prompt-toolkit==3.0.23
