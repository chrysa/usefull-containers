FROM  python:3.9-alpine

COPY docker-cmd.sh /opt/docker-cmd.sh

ENV PYTHONPATH=/app \
    PATH=$PATH:/home/pytest/.local/bin

WORKDIR /app

RUN set -x \
 && apk add --quiet --no-cache openssl-dev gcc libffi-dev python3-dev musl-dev build-base bash \
 && addgroup -S pytest \
 && adduser -D --system --shell /usr/bin/bash pytest pytest \
 && rm -rf /var/cache/apk/* \
 && chown -R pytest:pytest /app \
 && chmod +x /opt/docker-cmd.sh

USER pytest

RUN set -x \
 && pip install --quiet --no-cache-dir --no-cache-dir --upgrade pip \
 && pip install --quiet --no-cache-dir faker==9.8.4 \
 && pip install --quiet --no-cache-dir mock==4.0.3 \
 && pip install --quiet --no-cache-dir pytest==6.2.5 \
 && pip install --quiet --no-cache-dir pytest-benchmark==3.4.1 \
 && pip install --quiet --no-cache-dir pytest-cov==3.0.0 \
 && pip install --quiet --no-cache-dir pytest-depends==1.0.1 \
 && pip install --quiet --no-cache-dir pytest-func-cov==0.2.3 \
 && pip install --quiet --no-cache-dir pytest-html==3.1.1 \
 && pip install --quiet --no-cache-dir pytest-mock==3.6.1

CMD ["/opt/docker-cmd.sh"]
