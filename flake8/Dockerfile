FROM python:3.11-alpine

WORKDIR /app

COPY docker-cmd.sh /opt/docker-cmd.sh

ENV PATH=$PATH:/home/flake8/.local/bin

RUN set -x \
    && apk add --quiet --no-cache build-base bash git \
    && rm -rf /var/cache/apk/* \
    && addgroup -S flake8 \
    && adduser -D --system --shell /usr/bin/bash flake8 flake8 \
    && chown -R flake8:flake8 /app \
    && chmod +x /opt/docker-cmd.sh

USER flake8

RUN set -x \
    && python -m pip install --quiet --no-cache-dir --upgrade pip \
    && pip install --quiet --no-cache-dir flake8==6.0.0 \
    && pip install --quiet --no-cache-dir flake8-black==0.3.6 \
    && pip install --quiet --no-cache-dir flake8-html==0.4.3 \
    && pip install --quiet --no-cache-dir flake8-junit-report==2.1.0 \
    && pip install --quiet --no-cache-dir flake8-mypy==17.8.0

CMD ["/opt/docker-cmd.sh",    "--git"]
