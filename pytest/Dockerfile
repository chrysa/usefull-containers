ARG optionnal_requirement
FROM  python:3.8-alpine

ENV PYTHONPATH=/app

WORKDIR /app

RUN set -x \
 && apk add --quiet --no-cache openssl-dev gcc libffi-dev python3-dev musl-dev \
 && pip install -q pytest

CMD ["pytest", "--help"]
