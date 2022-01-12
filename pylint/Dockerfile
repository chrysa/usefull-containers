FROM  python:3.9-alpine

COPY docker-cmd.sh /opt/docker-cmd.sh

ENV PYTHONPATH=/app \
    PATH=$PATH:/home/pylint/.local/bin

WORKDIR /app

RUN set -x \
 && apk add --quiet --no-cache build-base bash \
 && addgroup -S pylint \
 && adduser -D --system --shell /usr/bin/bash pylint pylint \
 && rm -rf /var/cache/apk/* \
 && chown -R pylint:pylint /app \
 && chmod +x /opt/docker-cmd.sh

USER pylint

RUN set -x \
 && python -m pip install --quiet --no-cache-dir --no-cache-dir --upgrade pip \
 && pip install --quiet --no-cache-dir pylint==2.12.2 \
 && pip install --quiet --no-cache-dir pylint-junit==0.3.2 \
 && pip install --quiet --no-cache-dir pylint-report==0.2.1

CMD ["/opt/docker-cmd.sh"]
