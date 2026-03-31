FROM python:3.11-alpine

WORKDIR /app

COPY setup.cfg /conf/setup.cfg

ENV PATH=$PATH:/home/flask/.local/bin

RUN set -x \
    && apk add --quiet --no-cache build-base bash \
    && rm -rf /var/cache/apk/* \
    && addgroup -S flask \
    && adduser -D --system --shell /usr/bin/bash flask flask \
    && chown -R flask:flask /app

USER flask

RUN set -x \
    && python -m pip install --quiet --no-cache-dir --upgrade pip \
    && pip install --quiet --no-cache-dir flask-marshmallow==0.14.0 \
    && pip install --quiet --no-cache-dir flask-restx==0.5.0 \
    && pip install --quiet --no-cache-dir Flask-WTF==0.15.1 \
    && pip install --quiet --no-cache-dir marshmallow-sqlalchemy==0.26.1 \
    && pip install --quiet --no-cache-dir PyYAML==5.4.1 \
    && pip install --quiet --no-cache-dir requests==2.26.0 \
    && pip install --quiet --no-cache-dir uwsgi==2.0.19.1 \
    && pip install --quiet --no-cache-dir wtforms==2.3.3

WORKDIR /app

EXPOSE 5000

CMD ["uwsgi","--ini","/conf/setup.cfg"]

