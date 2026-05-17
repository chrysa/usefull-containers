#!/bin/bash

set -e
echo "====>> run ruff"

if [[ -z "$1" ]]; then
    cmd="ruff check"
    files=$(find /app -name "*.py" -not -path "*/.git/*")
    set -x
    ${cmd} ${files}
    ruff format --check ${files}
else
    set -x
    ruff "$@"
fi
