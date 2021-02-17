FROM  python:3.9-alpine

ENV PYTHONPATH=/app \
    PYTHONBREAKPOINT=ipdb.set_trace

WORKDIR /app

RUN set -x \
 && apt-get update -qq \
 && apt-get install -qq -o=Dpkg::Use-Pty=0 --no-install-recommends -y ipython \
 && pip install --quiet --upgrade pip

RUN set -x \
 && ip install --quiet --no-cache-dir ipdb==0.13.4 \
 && pip install --quiet --no-cache-dir prompt-toolkit==3.0.14

