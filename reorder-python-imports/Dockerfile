FROM  python:3.14-alpine

ENV PATH=$PATH:/home/reorder-python-imports/.local/bin GIT_DISCOVERY_ACROSS_FILESYSTEM=true


RUN set -x \
    && apk add --quiet --no-cache build-base bash git \
    && rm -rf /var/cache/apk/*

RUN set -x \
    && python -m pip install --quiet --no-cache-dir --upgrade pip \
    && pip install --quiet --no-cache-dir reorder-python-imports==3.9.0

COPY docker-entrypoint.sh /opt/docker-entrypoint.sh

RUN set -x \
    && chmod +x /opt/docker-entrypoint.sh

SHELL ["/bin/bash"]

WORKDIR /app

ENTRYPOINT ["/opt/docker-entrypoint.sh"]
