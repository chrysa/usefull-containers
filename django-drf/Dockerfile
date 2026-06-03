# syntax=docker/dockerfile:1.4

FROM python:3.14-alpine

ARG TARGET_FOLDER=/app

COPY cmd.sh /scripts/cmd.sh
COPY setup.cfg /conf/setup.cfg

ENV PATH=${PATH}:/usr/bin/python:${TARGET_FOLDER} \
    PYTHONBREAKPOINT=ipdb.set_trace

WORKDIR ${TARGET_FOLDER}

RUN set -exo pipefail \
    && apk add --quiet --update --no-cache build-base linux-headers \
    && pip install --only-binary :all: --quiet --upgrade --no-cache-dir pip \
    && pip install --only-binary :all: --quiet --no-cache-dir django==4.1.7 \
    && pip install --only-binary :all: --quiet --no-cache-dir djangorestframework==3.14.0 \
    && pip install --only-binary :all: --quiet --no-cache-dir requests==2.28.2 \
    && pip install --only-binary :all: --quiet --no-cache-dir uWSGI==2.0.21 \
    && mkdir -p /var/log/uwsgi /socket \
    && find /scripts -name "*.sh" -exec chmod +x {} \;

EXPOSE 8000

CMD ["/scripts/cmd.sh"]

HEALTHCHECK --interval=30s --timeout=30s --retries=10 --start-period=10s \
    CMD [ -f /socket/drf-app.socket ] || exit 1
