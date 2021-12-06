#!/bin/sh

cmd="mypy"
if [ -f "/app/setup.cfg" ]; then
    cmd="${cmd} --config=/app/setup.cfg"
elif [ -f "/app/mypy.ini" ]; then
    cmd="${cmd} --config=/app/mypy.ini"
elif [ -f "/app/.mypy.ini" ]; then
    cmd="${cmd} --config=/app/.mypy.ini"
elif [ -f "/app/pyproject.toml" ]; then
    cmd="${cmd} --config=/app/pyproject.toml"
fi
${cmd} /app/**/*.py
