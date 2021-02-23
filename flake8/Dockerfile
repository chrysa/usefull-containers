FROM  python:3.9-alpine

WORKDIR  /app

ENV PATH=$PATH:/home/flake8/.local/bin

RUN set -x \
 && apk add --quiet --no-cache build-base bash \
 && rm -rf /var/cache/apk/* \
<<<<<<< HEAD
 && addgroup -S flake8 \
 && adduser -D --system --shell /usr/bin/bash flake8 flake8 \
=======
 && pip install --quiet --no-cache-dir --upgrade pip

RUN set -x \
 && addgroup --system flake8 \
 && adduser --disabled-password --system --shell /usr/bin/bash --ingroup flake8 flake8 \
>>>>>>> 792b7c3 (some fix)
 && chown -R flake8:flake8 /app

USER flake8

RUN set -x \
<<<<<<< HEAD
 && pip install --quiet --no-cache-dir flake8==3.9.2 \
 && pip install --quiet --no-cache-dir flake8-black==0.2.3 \
=======
 && pip install --quiet --no-cache-dir flake8==3.8.4 \
 && pip install --quiet --no-cache-dir flake8-black==0.2.1 \
>>>>>>> 792b7c3 (some fix)
 && pip install --quiet --no-cache-dir flake8-html==0.4.1 \
 && pip install --quiet --no-cache-dir flake8-junit-report==2.1.0 \
 && pip install --quiet --no-cache-dir flake8-mypy==17.8.0

CMD ["flake8", "--help"]
