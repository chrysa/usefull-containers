FROM  python:3.9-alpine

ENV PYTHONPATH=/app \
    PATH=$PATH:/home/pytest/.local/bin

WORKDIR /app

RUN set -x \
 && apk add --quiet --no-cache openssl-dev gcc libffi-dev python3-dev musl-dev build-base bash \
 && rm -rf /var/cache/apk/* \
 && pip install --quiet --no-cache-dir --upgrade pip

RUN set -x \
 && addgroup --system pytest \
 && adduser --disabled-password --system --shell /usr/bin/bash --ingroup pytest pytest \
 && chown -R pytest:pytest /app

USER pytest

RUN set -x \
 && pip install --quiet --no-cache-dir faker==5.6.5 \
 && pip install --quiet --no-cache-dir mock==4.0.3 \
 && pip install --quiet --no-cache-dir pytest==6.2.1 \
 && pip install --quiet --no-cache-dir pytest-benchmark==3.2.3 \
 && pip install --quiet --no-cache-dir pytest-cov==2.11.1 \
 && pip install --quiet --no-cache-dir pytest-depends==1.0.1 \
 && pip install --quiet --no-cache-dir pytest-func-cov==0.2.2 \
 && pip install --quiet --no-cache-dir pytest-html==3.1.1 \
 && pip install --quiet --no-cache-dir pytest-mock==3.5.1


CMD ["pytest", "--help"]
