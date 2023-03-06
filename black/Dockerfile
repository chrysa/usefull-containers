FROM    pyfound/black:23.1.0

WORKDIR    /app

ENV PATH=$PATH:/home/black/.local/bin GIT_DISCOVERY_ACROSS_FILESYSTEM=true

RUN set -x \
    && apt-get update \
    && apt-get install -qq --no-install-recommends git    \
    && apt-get autoremove --purge -qq -y \
    && apt-get clean -qq -y \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

COPY docker-cmd.sh /opt/docker-cmd.sh

RUN set -x \
    && chmod +x /opt/docker-cmd.sh

COPY black-default.toml /opt/black-default.toml

SHELL ["/bin/bash"]

WORKDIR /app

ENTRYPOINT ["/opt/docker-cmd.sh", "--git"]
