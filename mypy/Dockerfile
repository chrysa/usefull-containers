FROM  python:3.9-alpine

COPY docker-cmd.sh /opt/docker-cmd.sh

ENV PATH=$PATH:/home/mypy/.local/bin
ENV MYPYPATH=/app

WORKDIR  /app

RUN set -x \
 && apk add --quiet --no-cache build-base bash \
 && rm -rf /var/cache/apk/* \
 && addgroup -S mypy \
 && adduser -D --system --shell /usr/bin/bash mypy mypy \
 && chown -R mypy:mypy /app \
 && chmod +x /opt/docker-cmd.sh

USER mypy

RUN set -x \
  && pip install --upgrade pip \
  && pip install --quiet --no-cache-dir mypy==0.910 \
  && pip install --quiet --no-cache-dir junit-xml==1.9

WORKDIR  /app

CMD ["/opt/docker-cmd.sh"]
