#!/bin/sh

cmd="pylint"

if [ -f "/app/setup.cfg" ]; then
    config="--rcfile=/app/setup.cfg"
elif [ -f "/app/.pylintrc" ]; then
    config="--rcfile=/app/.pylintrc"
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
