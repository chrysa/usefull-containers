FROM  python:3.9-alpine

WORKDIR  /app

ENV PATH=$PATH:/home/black/.local/bin

RUN set -x \
 && apk add --quiet --no-cache build-base bash \
 && rm -rf /var/cache/apk/* \
<<<<<<< HEAD
 && addgroup -S black \
 && adduser -D --system --shell /usr/bin/bash black black \
=======
 && pip install --quiet --no-cache-dir --upgrade pip

RUN set -x \
 && addgroup --system black \
 && adduser --disabled-password --system --shell /usr/bin/bash --ingroup black black \
>>>>>>> 792b7c3 (some fix)
 && chown -R black:black /app

USER black

<<<<<<< HEAD
RUN pip install --quiet --no-cache-dir black==20.8b1
=======
RUN set -x \
 && pip install --quiet --no-cache-dir black==20.8b1

>>>>>>> 792b7c3 (some fix)

CMD ["black",  "--help"]
