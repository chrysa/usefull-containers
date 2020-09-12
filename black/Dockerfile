FROM  python:3.8-alpine

WORKDIR  /app

RUN set -x \
 && addgroup -S black \
 && adduser -D -S black black \
 && chown -R black:black /app \
 && apk add --quiet --no-cache build-base \
 && pip install --quiet black

USER black

CMD ["black",  "--help"]
