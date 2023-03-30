#!/bin/sh

cmd="flake8"

if [ -f "/app/setup.cfg" ]; then
    config="--config=/app/setup.cfg"
elif [ -f "/app/tox.ini" ]; then
    config="--config=/app/tox.ini"
elif [ -f "/app/.flake8" ]; then
    config="--config=/app/.flake8"
else
    config="--config=/opt/setup-default.cfg"
fi


if [ -z "$@" ]; then
    files=$(find /app -name "*.py")
else 
    files="$@"
fi

set -x
${cmd} ${config} ${files}
