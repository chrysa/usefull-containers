FROM python:3.11-alpine

WORKDIR /app

ENV PATH=$PATH:/home/flask-db-migration/.local/bin

RUN set -x \
    && apk add --quiet --no-cache build-base bash \
    && rm -rf /var/cache/apk/* \
    && addgroup -S flask-db-migration \
    && adduser -D --system --shell /usr/bin/bash flask-db-migration flask-db-migration \
    && chown -R flask-db-migration:flask-db-migration /app

USER flask-db-migration

RUN set -x \
    && python -m pip install --quiet --no-cache-dir --upgrade pip \
    && pip install --quiet --no-cache-dir alembic==1.6.5 \
    && pip install --quiet --no-cache-dir psycopg2==2.9.1 \
    && pip install --quiet --no-cache-dir PyYAML==6.0.2 \
    && pip install --quiet --no-cache-dir SQLAlchemy==1.4.22

CMD ["alembic","-x","data=true","upgrade","head"]