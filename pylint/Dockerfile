FROM  python:3.11-alpine

COPY docker-entrypoint.sh /opt/docker-entrypoint.sh

ENV PYTHONPATH=/app \
    PATH=$PATH:/home/pylint/.local/bin

WORKDIR /app

RUN set -x \
    && apk add --quiet --no-cache build-base bash git \
    && addgroup -S pylint \
    && adduser -D --system --shell /usr/bin/bash pylint pylint \
    && rm -rf /var/cache/apk/* \
    && chown -R pylint:pylint /app \
    && chmod +x /opt/docker-entrypoint.sh

USER pylint

RUN set -x \
    && python -m pip install --prefer-binary --quiet --no-cache-dir --upgrade pip \
    && pip install --prefer-binary --quiet --no-cache-dir pylint==2.17.1 \
    && pip install --prefer-binary --quiet --no-cache-dir pylint-junit==0.3.2 \
    && pip install --prefer-binary --quiet --no-cache-dir pylint-report==2.4.0

ENTRYPOINT ["/opt/docker-entrypoint.sh"]
