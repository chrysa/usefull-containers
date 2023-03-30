#!/bin/sh

cmd="mypy"

if [ -f "/app/setup.cfg" ]; then
    config="--config=/app/setup.cfg"
elif [ -f "/app/mypy.ini" ]; then
    config="--config=/app/mypy.ini"
elif [ -f "/app/.mypy.ini" ]; then
    config="--config=/app/.mypy.ini"
elif [ -f "/app/pyproject.toml" ]; then
    config="--config=/app/pyproject.toml"
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
