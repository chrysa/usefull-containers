<<<<<<< HEAD
FROM  python:3.9-alpine

ENV PYTHONPATH=/app\
    PATH=$PATH:/home/sphinx/.local/bin


WORKDIR /app

RUN set -x \
 && apk add --quiet --no-cache openssl-dev gcc libffi-dev python3-dev musl-dev build-base bash \
 && addgroup -S sphinx \
 && adduser -D --system --shell /usr/bin/bash sphinx sphinx \
 && rm -rf /var/cache/apk/* \
 && chown -R sphinx:sphinx /app

USER sphinx

RUN set -x  \
 && pip install --quiet --no-cache-dir --no-cache-dir --upgrade pip \
 && pip install --quiet --no-cache-dir graphviz==0.19 \
 && pip install --quiet --no-cache-dir recommonmark==0.7.1 \
 && pip install --quiet --no-cache-dir sphinx==4.3.1 \
 && pip install --quiet --no-cache-dir sphinx-rtd-theme==1.0.0
=======
FROM  python:3.9-alpine

ENV PYTHONPATH=/app\
    PATH=$PATH:/home/sphinx/.local/bin


WORKDIR /app

RUN set -x \
 && apk add --quiet --no-cache openssl-dev gcc libffi-dev python3-dev musl-dev build-base bash \
 && addgroup -S sphinx \
 && adduser -D --system --shell /usr/bin/bash sphinx sphinx \
 && rm -rf /var/cache/apk/* \
 && chown -R sphinx:sphinx /app

USER sphinx

RUN set -x  \
 && python -m pip install --quiet --no-cache-dir --upgrade pip \
 && pip install --quiet --no-cache-dir graphviz==0.19.1 \
 && pip install --quiet --no-cache-dir recommonmark==0.7.1 \
 && pip install --quiet --no-cache-dir sphinx==4.4.0 \
 && pip install --quiet --no-cache-dir sphinx-rtd-theme==1.0.0
>>>>>>> d98b6dc (test update)
