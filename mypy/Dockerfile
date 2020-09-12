FROM  python:3.8-alpine

RUN set -x \
 && apk add --quiet --no-cache build-base \
 && rm -rf /var/cache/apk/* \
 && addgroup -S mypy \
 && adduser -D -S mypy mypy \
 && pip install -q mypy

USER mypy

WORKDIR  /app

CMD ["mypy", "--help"]
