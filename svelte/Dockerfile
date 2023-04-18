ARG APP_FOLDER="/app"
ARG NODE_VERSION="19-alpine3.17"
ARG TZ="Europe/Paris"

FROM node:${NODE_VERSION}
LABEL node-version="${NODE_VERSION}"

ARG APP_FOLDER
ARG TZ
ENV APP_FOLDER=$APP_FOLDER \
    NODE_ENV=production \
    PATH=${APP_FOLDER}/node_modules/.bin:$PATH \
    TZ=${TZ}

COPY --chown=node:root default-code/ /default-app
COPY ./scripts/ /scripts/

RUN set -ex \
    && apk add --quiet --update --no-cache bash

SHELL ["/bin/bash",  "-c"]

WORKDIR /default-app

RUN set -heoux pipefail \
    && set +x \
    && echo -e "=====================================\n========== configure Folders ========\n=====================================" \
    && set -x \
    && apk add --quiet --update --no-cache shadow \
    && mkdir -p ${APP_FOLDER} \
    && chown node:node -R ${APP_FOLDER} \
    && chmod 755 -R ${APP_FOLDER} \
    && set +x \
    && echo -e "=====================================\n========== install Production packages ==========\n=====================================" \
    && set -x \
    && npm install --omit=dev\
    && set +x \
    && echo -e "===========================================\n========== configure SCRIPTS ==========\n===========================================" \
    && set -x \
    && find /scripts -name "*.sh" -print -exec chmod +x {} \; \
    && set +x \
    && echo -e "===========================================\n========== configure HEALTHCHECK ==========\n===========================================" \
    && set -x \
    && apk add --quiet --update --no-cache curl

WORKDIR ${APP_FOLDER} 

EXPOSE 3000

ENTRYPOINT ["/scripts/entrypoint.sh"]
CMD ["npm", "start"]

USER node

HEALTHCHECK --interval=1m --timeout=30s --retries=3 --start-period=10s \
    CMD curl -f http://0.0.0.0:3000/ || exit 1
