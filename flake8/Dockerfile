FROM  python:3.8-alpine

WORKDIR  /app

RUN set -x \
 && addgroup -S flake8 \
 && adduser -D -S flake8 flake8 \
 && pip install -q flake8

USER flake8

CMD ["flake8", "--help"]
