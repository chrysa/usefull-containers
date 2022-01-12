FROM  python:3.9-alpine

WORKDIR  /app

COPY docker-cmd.sh /opt/docker-cmd.sh

ENV PATH=$PATH:/home/black/.local/bin

RUN set -x \
 && apk add --quiet --no-cache build-base bash \
 && rm -rf /var/cache/apk/* \
 && addgroup -S black \
 && adduser --system -u 1001 black black \
 && chown -R black:black /app \
 && chmod +x /opt/docker-cmd.sh

USER black

RUN set -x \
  && python -m pip install --quiet --no-cache-dir --no-cache-dir --upgrade pip \
  && pip install --quiet --no-cache-dir black==21.9b0

CMD ["/opt/docker-cmd.sh"]
