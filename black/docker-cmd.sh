#!/bin/sh

cmd="black"
if [ -f "/app/black.toml" ]; then
    cmd="${cmd} --config=/app/black.toml"
elif [ -f "/app/pyproject.toml" ]; then
    cmd="${cmd} --config=/app/pyproject.toml"
fi

${cmd} /app/**/*.py
