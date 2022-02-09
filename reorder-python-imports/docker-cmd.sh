#!/bin/sh

cmd="reorder-python-imports"

while [[ $# -gt 0 ]]; do
    case "$1" in
        --config)
            config="--config=$1"
            shift 2
        ;;
        --file)
            files="$1"
            shift 2
        ;;
        --git)
            files=` git status | grep -E "modified" | grep ".py$" | sort -u | args`
            shift 2
        ;;
    esac
done

if [ -z ${config} ]; then
    if [ -f "/app/setup.cfg" ]; then
        config="--config=/app/setup.cfg"
    else
        config="--py39-plus --application-directories=."
    fi
fi

if [ -z ${files} ]; then
    files=/app/**/*.py
else
    files=`echo $files | cut -d ' '`
fi

${cmd} ${config} ${files}
