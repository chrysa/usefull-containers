FROM  python:3.9-alpine

WORKDIR  /app

COPY docker-cmd.sh /opt/docker-cmd.sh

ENV PATH=$PATH:/home/reorder-python-imports/.local/bin

RUN set -x \
 && apk add --quiet --no-cache build-base bash \
 && rm -rf /var/cache/apk/* \
 && addgroup -S reorder-python-imports \
 && adduser --system -u 1001 reorder-python-imports reorder-python-imports \
 && chown -R reorder-python-imports:reorder-python-imports /app \
 && chmod +x /opt/docker-cmd.sh

USER reorder-python-imports

RUN set -x \
  && python -m pip install --quiet --no-cache-dir --no-cache-dir --upgrade pip \
  && pip install --quiet --no-cache-dir reorder-python-imports==2.6.0

CMD ["/opt/docker-cmd.sh"]
