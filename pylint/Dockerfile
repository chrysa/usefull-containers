FROM  python:3.9-alpine

ENV PYTHONPATH=/app \
    PATH=$PATH:/home/pylint/.local/bin

WORKDIR /app

RUN set -x \
 && apk add --quiet --no-cache build-base bash \
<<<<<<< HEAD
 && addgroup -S pylint \
 && adduser -D --system --shell /usr/bin/bash pylint pylint \
 && rm -rf /var/cache/apk/* \
=======
 && pip install --quiet --no-cache-dir --upgrade pip \
 && rm -rf /var/cache/apk/*

RUN set -x \
 && addgroup --system pylint \
 && adduser --disabled-password --system --shell /usr/bin/bash --ingroup pylint pylint \
>>>>>>> 792b7c3 (some fix)
 && chown -R pylint:pylint /app

USER pylint

RUN set -x \
<<<<<<< HEAD
 && pip install --quiet --no-cache-dir pylint==2.10.2 \
 && pip install --quiet --no-cache-dir pylint-junit==0.3.2 \
 && pip install --quiet --no-cache-dir pylint-report==0.1.8

=======
 && pip install --quiet --no-cache-dir pylint==2.6.0 \
 && pip install --quiet --no-cache-dir pylint-junit==0.3.2 \
 && pip install --quiet --no-cache-dir pylint-report==0.1.0
>>>>>>> 792b7c3 (some fix)

CMD ["pylint", "--help"]
