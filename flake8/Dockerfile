FROM  python:3.9-alpine

WORKDIR  /app

ENV PATH=$PATH:/home/flake8/.local/bin

RUN set -x \
 && apk add --quiet --no-cache build-base bash \
 && rm -rf /var/cache/apk/* \
 && pip install --quiet --no-cache-dir --upgrade pip

RUN set -x \
 && addgroup --system flake8 \
 && adduser --disabled-password --system --shell /usr/bin/bash --ingroup flake8 flake8 \
 && chown -R flake8:flake8 /app

USER flake8

RUN set -x \
 && pip install --quiet --no-cache-dir flake8==3.8.4 \
 && pip install --quiet --no-cache-dir flake8-black==0.2.1 \
 && pip install --quiet --no-cache-dir flake8-html==0.4.1 \
 && pip install --quiet --no-cache-dir flake8-junit-report==2.1.0 \
 && pip install --quiet --no-cache-dir flake8-mypy==17.8.0

CMD ["flake8", "--help"]
