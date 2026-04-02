FROM python:3.14-alpine

COPY docker-entrypoint.sh /opt/docker-entrypoint.sh

ENV PATH=$PATH:/home/bandit/.local/bin \
    PYTHONPATH=/app

WORKDIR /app

RUN set -x \
    && apk add --quiet --no-cache build-base bash git \
    && addgroup -S bandit \
    && adduser -D --system --shell /usr/bin/bash bandit bandit \
    && rm -rf /var/cache/apk/* \
    && chown -R bandit:bandit /app \
    && chmod +x /opt/docker-entrypoint.sh

USER bandit

RUN set -x \
    && python -m pip install --prefer-binary --quiet --no-cache-dir --upgrade pip \
    && pip install --prefer-binary --quiet --no-cache-dir bandit==1.8.3 \
    && pip install --prefer-binary --quiet --no-cache-dir bandit-junit==0.0.6

ENTRYPOINT ["/opt/docker-entrypoint.sh"]
