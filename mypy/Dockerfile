FROM  python:3.9-alpine

ENV PATH=$PATH:/home/mypy/.local/bin

WORKDIR  /app

RUN set -x \
 && apk add --quiet --no-cache build-base bash \
 && rm -rf /var/cache/apk/* \
<<<<<<< HEAD
 && addgroup -S mypy \
 && adduser -D --system --shell /usr/bin/bash mypy mypy \
=======
 && pip install --quiet --no-cache-dir --upgrade pip

RUN set -x \
 && addgroup --system mypy \
 && adduser --disabled-password --system --shell /usr/bin/bash --ingroup mypy mypy \
>>>>>>> 792b7c3 (some fix)
 && chown -R mypy:mypy /app

USER mypy

RUN set -x \
<<<<<<< HEAD
 && pip install --quiet --no-cache-dir mypy==0.910 \
=======
 && pip install --quiet --no-cache-dir mypy==0.800 \
>>>>>>> 792b7c3 (some fix)
 && pip install --quiet --no-cache-dir junit-xml==1.9

WORKDIR  /app

CMD ["mypy", "--help"]
