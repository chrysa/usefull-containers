#!/bin/bash

set -e
echo "====>> run black"
cmd="black"

if [ -f "/app/black.toml" ]; then
    config="--config=/app/black.toml"
elif [ -f "/app/pyproject.toml" ]; then
    config="--config=/app/pyproject.toml"
else
    config="--config=/opt/black-default.toml"
fi

if [ -z "$@" ]; then
    files=$(find /app -name "*.py")
else 
    files="$@"
fi

set -x
${cmd} ${config} ${files}
