FROM    pyfound/black:23.3.0

WORKDIR /app

ENV PATH=$PATH:/home/black/.local/bin GIT_DISCOVERY_ACROSS_FILESYSTEM=true

COPY docker-entypoint.sh /opt/docker-entypoint.sh

RUN set -x \
    && chmod +x /opt/docker-entypoint.sh

COPY black-default.toml /opt/black-default.toml

SHELL ["/bin/bash"]

WORKDIR /app

ENTRYPOINT ["/opt/docker-entypoint.sh"]
