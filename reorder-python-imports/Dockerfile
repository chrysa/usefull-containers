FROM  python:3.9-alpine

ENV PATH=$PATH:/home/reorder-python-imports/.local/bin GIT_DISCOVERY_ACROSS_FILESYSTEM=true


RUN set -x \
  && apk add --quiet --no-cache build-base bash git \
  && rm -rf /var/cache/apk/*

RUN set -x \
  && python -m pip install --quiet --no-cache-dir --upgrade pip \
  && pip install --quiet --no-cache-dir reorder-python-imports==2.7.1

COPY docker-cmd.sh /opt/docker-cmd.sh

RUN set -x \
  && chmod +x /opt/docker-cmd.sh

SHELL ["/bin/bash"]

WORKDIR /app

ENTRYPOINT ["/opt/docker-cmd.sh"]

CMD ["--git"]

RUN set -x \
  && chmod +x /opt/docker-cmd.sh

SHELL ["/bin/bash"]

WORKDIR /app

ENTRYPOINT ["/opt/docker-cmd.sh"]

CMD ["--git"]
