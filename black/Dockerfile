FROM    pyfound/black:23.3.0

WORKDIR /app

ENV PATH=$PATH:/home/black/.local/bin GIT_DISCOVERY_ACROSS_FILESYSTEM=true

COPY docker-cmd.sh /opt/docker-cmd.sh

RUN set -x \
    && chmod +x /opt/docker-cmd.sh

COPY black-default.toml /opt/black-default.toml

SHELL ["/bin/bash"]

WORKDIR /app

CMD ["/opt/docker-cmd.sh"]
