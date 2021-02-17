FROM  python:3.9-alpine

ENV PYTHONPATH=/app \
    PATH=$PATH:/home/pytest/.local/bin

WORKDIR /app

RUN set -x \
 && apk add --quiet --no-cache openssl-dev gcc libffi-dev python3-dev musl-dev build-base bash \
 && addgroup -S mypy \
 && adduser -D --system --shell /usr/bin/bash mypy mypy \
 && rm -rf /var/cache/apk/* \
 && chown -R pytest:pytest /app \
 && pip install --quiet --upgrade pip

USER pytest

RUN set -x \
 && pip install -q faker==5.6.5 \
 && pip install -q mock==4.0.3 \
 && pip install -q pytest==6.2.1 \
 && pip install -q pytest-benchmark==3.2.3 \
 && pip install -q pytest-cov==2.11.1 \
 && pip install -q pytest-depends==1.0.1 \
 && pip install -q pytest-func-cov==0.2.2 \
 && pip install -q pytest-html==3.1.1 \
 && pip install -q pytest-mock==3.5.1


CMD ["pytest", "--help"]
