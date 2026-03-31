FROM  python:3.14-alpine

COPY docker-entrypoint.sh /opt/docker-entrypoint.sh

ENV PYTHONPATH=/app \
    PATH=$PATH:/home/pytest/.local/bin

WORKDIR /app

RUN set -x \
    && apk add --quiet --no-cache openssl-dev gcc libffi-dev python3-dev musl-dev build-base bash \
    && addgroup -S pytest \
    && adduser -D --system --shell /usr/bin/bash pytest pytest \
    && rm -rf /var/cache/apk/* \
    && chown -R pytest:pytest /app \
    && chmod +x /opt/docker-entrypoint.sh

USER pytest

RUN set -x \
    && python -m pip install --quiet --no-cache-dir --upgrade pip \
    && pip install --quiet --no-cache-dir faker==18.4.0 \
    && pip install --quiet --no-cache-dir mock==5.0.1 \
    && pip install --quiet --no-cache-dir pytest==7.2.2 \
    && pip install --quiet --no-cache-dir pytest-benchmark==4.0.0 \
    && pip install --quiet --no-cache-dir pytest-cov==4.0.0 \
    && pip install --quiet --no-cache-dir pytest-depends==1.0.1 \
    && pip install --quiet --no-cache-dir pytest-func-cov==0.2.3 \
    && pip install --quiet --no-cache-dir pytest-html==3.2.0 \
    && pip install --quiet --no-cache-dir pytest-mock==3.10.0

ENTRYPOINT ["/opt/docker-entrypoint.sh"]
