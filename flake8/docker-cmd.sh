#!/bin/sh

cmd="flake8"
if [ -f "/app/setup.cfg" ]; then
    cmd="${cmd} --config=/app/setup.cfg"
elif [ -f "/app/tox.ini" ]; then
    cmd="${cmd} --config=/app/tox.ini"
elif [ -f "/app/.flake8" ]; then
    cmd="${cmd} --config=/app/.flake8"
fi
${cmd} /app/**/*.py