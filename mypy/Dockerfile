FROM  python:3.9-alpine

ENV PATH=$PATH:/home/mypy/.local/bin

WORKDIR  /app

RUN set -x \
 && apk add --quiet --no-cache build-base bash \
 && rm -rf /var/cache/apk/* \
 && pip install --quiet --no-cache-dir --upgrade pip

RUN set -x \
 && addgroup --system mypy \
 && adduser --disabled-password --system --shell /usr/bin/bash --ingroup mypy mypy \
 && chown -R mypy:mypy /app

USER mypy

RUN set -x \
 && pip install --quiet --no-cache-dir mypy==0.800 \
 && pip install --quiet --no-cache-dir junit-xml==1.9

WORKDIR  /app

CMD ["mypy", "--help"]
