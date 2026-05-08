#!/bin/bash

set -e
echo "====>> run reorder python imports"
cmd="reorder-python-imports"

config="--py3-plus --application-directories=."


if [ -z "$@" ]; then
    files=$(find /app -name "*.py")
else
    files="$@"
fi

set -x
${cmd} ${config} ${files}
