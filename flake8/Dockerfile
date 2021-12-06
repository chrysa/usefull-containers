FROM  python:3.9-alpine

WORKDIR  /app

COPY docker-cmd.sh /opt/docker-cmd.sh

ENV PATH=$PATH:/home/flake8/.local/bin

RUN set -x \
 && apk add --quiet --no-cache build-base bash \
 && rm -rf /var/cache/apk/* \
 && addgroup -S flake8 \
 && adduser -D --system --shell /usr/bin/bash flake8 flake8 \
 && chown -R flake8:flake8 /app \
 && chmod +x /opt/docker-cmd.sh

USER flake8

RUN set -x \
  && pip install --upgrade pip \
  && pip install --quiet --no-cache-dir flake8==4.0.1 \
  && pip install --quiet --no-cache-dir flake8-black==0.2.3 \
  && pip install --quiet --no-cache-dir flake8-html==0.4.1 \
  && pip install --quiet --no-cache-dir flake8-junit-report==2.1.0 \
  && pip install --quiet --no-cache-dir flake8-mypy==17.8.0

CMD ["/opt/docker-cmd.sh"]
