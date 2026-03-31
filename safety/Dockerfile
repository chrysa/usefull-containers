FROM python:3.14-alpine

COPY docker-entrypoint.sh /opt/docker-entrypoint.sh

ENV PATH=$PATH:/home/safety/.local/bin \
    PYTHONPATH=/app

WORKDIR /app

RUN set -x \
    && apk add --quiet --no-cache build-base bash git \
    && addgroup -S safety \
    && adduser -D --system --shell /usr/bin/bash safety safety \
    && rm -rf /var/cache/apk/* \
    && chown -R safety:safety /app \
    && chmod +x /opt/docker-entrypoint.sh

USER safety

RUN set -x \
    && python -m pip install --prefer-binary --quiet --no-cache-dir --upgrade pip \
    && pip install --prefer-binary --quiet --no-cache-dir safety==3.3.1

ENTRYPOINT ["/opt/docker-entrypoint.sh"]
