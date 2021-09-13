FROM  python:3.9-alpine

ENV PYTHONPATH=/app\
    PATH=$PATH:/home/sphinx/.local/bin


WORKDIR /app

RUN set -x \
 && apk add --update --no-cache --virtual .build-deps g++ libxml2 libxml2-dev \
 && apk add libxslt-dev \
 && apk del .build-deps \
 && rm -rf /var/cache/apk/*

RUN set -x \
 && addgroup --system sphinx \
 && adduser --disabled-password --system --shell /usr/bin/bash --ingroup sphinx sphinx \
 && chown -R sphinx:sphinx /app

RUN pip install --quiet --no-cache-dir --upgrade pip

USER sphinx

RUN set -x \
 && pip install --quiet --no-cache-dir graphviz==0.16 \
 && pip install --quiet --no-cache-dir recommonmark==0.7.1 \
 && pip install --quiet --no-cache-dir sphinx==3.4.3 \
 && pip install --quiet --no-cache-dir sphinx-rtd-theme==0.5
