#!/bin/sh

cmd="pytest"

if [ -f "/app/setup.cfg" ]; then
    config="--rcfile=/app/setup.cfg"
elif [ -f "/app/pytest.ini" ]; then
    config="--rcfile=/app/pytest.ini"
elif [ -f "/app/pyproject.toml" ]; then
    config="--rcfile=/app/pyproject.toml"
elif [ -f "/app/tox.ini" ]; then
    config="--rcfile=/app/tox.ini"
fi

if [ -z "$@" ]; then
    files=$(find /app -name "*.py")
else 
    files="$@"
fi

set -x
${cmd} ${config} ${files}
