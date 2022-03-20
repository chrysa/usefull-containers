#!/usr/bin/env sh
if [ ! -f "/app/.pre-commit-config.yaml" ]; then
    mv /sample/.pre-commit-config.yaml /app/.pre-commit-config.yaml
fi
pre-commit install
pre-commit install-hooks
pre-commit autoupdate --bleeding-edge
pre-commit run --all-files --hook-stage manual
exec "$@"
