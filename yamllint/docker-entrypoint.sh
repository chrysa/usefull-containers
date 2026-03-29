#!/bin/sh

cmd="yamllint"

if [ -f "/app/.yamllint.yaml" ]; then
    config="-c /app/.yamllint.yaml"
elif [ -f "/app/.yamllint.yml" ]; then
    config="-c /app/.yamllint.yml"
elif [ -f "/app/.yamllint" ]; then
    config="-c /app/.yamllint"
else
    config="-c /opt/yamllint-default.yaml"
fi

if [ -z "$*" ]; then
    files=$(find /app -name "*.yaml" -o -name "*.yml")
else
    files="$*"
fi

set -x
${cmd} ${config} ${files}
