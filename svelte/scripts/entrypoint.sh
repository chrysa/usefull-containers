#!/usr/bin/env bash

set -heu

if [ ! -z "$(ls -A ${APP_FOLDER})" ]; then
    cp /default-app "${APP_FOLDER}"
fi