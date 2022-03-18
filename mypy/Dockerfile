FROM  python:3.9-alpine

COPY docker-cmd.sh /opt/docker-cmd.sh
COPY setup-default.cfg /opt/setup-default.cfg

ENV PATH=$PATH:/home/mypy/.local/bin
ENV MYPYPATH=/app

WORKDIR  /app

RUN set -x \
 && apk add --quiet --no-cache build-base bash git \
 && rm -rf /var/cache/apk/* \
 && addgroup -S mypy \
 && adduser -D --system --shell /usr/bin/bash mypy mypy \
 && chown -R mypy:mypy /app \
 && chmod +x /opt/docker-cmd.sh

USER mypy

RUN set -x \
  && python -m pip install --quiet --no-cache-dir --upgrade pip \
  && pip install --quiet --no-cache-dir mypy==0.941 \
  && pip install --quiet --no-cache-dir junit-xml==1.9

WORKDIR  /app

CMD ["/opt/docker-cmd.sh",  "--git"]
