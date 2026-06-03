# syntax=docker/dockerfile:1.4

FROM    pyfound/black:26.5.1

WORKDIR /app

ENV PATH=$PATH:/home/black/.local/bin \
    GIT_DISCOVERY_ACROSS_FILESYSTEM=true

COPY docker-cmd.sh /opt/docker-cmd.sh

RUN set -x \
    && chmod +x /opt/docker-cmd.sh

COPY black-default.toml /opt/black-default.toml

SHELL ["/bin/bash"]

WORKDIR /app

CMD ["/opt/docker-cmd.sh"]
