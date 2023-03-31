FROM    python:3.11-alpine

COPY docker-entrypoint.sh /opt/docker-entrypoint.sh
COPY setup-default.cfg /opt/setup-default.cfg

ENV PATH=$PATH:/home/mypy/.local/bin
ENV MYPYPATH=/app

WORKDIR /app

RUN set -x \
    && apk add --quiet --no-cache build-base bash \
    && rm -rf /var/cache/apk/* \
    && addgroup -S mypy \
    && adduser -D --system --shell /usr/bin/bash mypy mypy \
    && chown -R mypy:mypy /app \
    && chmod +x /opt/docker-entrypoint.sh

USER mypy

RUN set -x \
    && python -m pip install --quiet --no-cache-dir --upgrade pip \
    && pip install --quiet --no-cache-dir mypy==1.1.1 \
    && pip install --quiet --no-cache-dir junit-xml==1.9

WORKDIR /app

ENTRYPOINT ["/opt/docker-entrypoint.sh"]
