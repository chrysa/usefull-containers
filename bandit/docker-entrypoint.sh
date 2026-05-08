#!/bin/sh

cmd="bandit"

if [ -f "/app/.bandit" ]; then
    config="--configfile /app/.bandit"
elif [ -f "/app/setup.cfg" ] && grep -q "\[bandit\]" /app/setup.cfg 2>/dev/null; then
    config="--configfile /app/setup.cfg"
elif [ -f "/app/pyproject.toml" ] && grep -q "\[tool.bandit\]" /app/pyproject.toml 2>/dev/null; then
    config="--configfile /app/pyproject.toml"
else
    config="--level LOW --confidence LOW"
fi

if [ -z "$@" ]; then
    files=$(find /app -name "*.py" -not -path "*/.git/*")
else
    files="$@"
fi

set -x
${cmd} --recursive ${config} ${files}
