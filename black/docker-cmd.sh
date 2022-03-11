#!/bin/bash

set -e 
cmd="black"

if [ -f "/app/black.toml" ]; then
    config="--config=/app/black.toml"
elif [ -f "/app/pyproject.toml" ]; then
    config="--config=/app/pyproject.toml"
else
    config="--config=/opt/black-default.toml"
fi

opts=$(getopt \
    --longoptions "config,file,git,help" \
    --name "$(basename "$0")" \
    --options "c,f,g,h" \
    -- "$@"
)

eval set --$opts

while [[ $# -gt 0 ]]; do
    echo $1
    case "$1" in
        -c|--config)
            config="${config} $1"
            shift 2
        ;;
        -f|--file)
            files="$1"
            shift 2
        ;;
        -g|--git)
            echo "get files from git status"
            files=`git status | grep -v "deleted" | grep ".py$" | cut -d ":" -f2 | sort -u | xargs`
            shift 2
        ;;
        --)
            shift;
            break
            ;;
        *)
            echo "Usage:
                [ -c | --config] relative config path
                [ -f | --file] relative file(s) path to format
                [ -g | --git] detect file from git status
                [ -h | --help]"
            exit 2
        ;;
    esac
done

if [ -z ${config} ]; then
    if [ -f "/app/black.toml" ]; then
        config="--config=/app/black.toml"
    elif [ -f "/app/pyproject.toml" ]; then
        config="--config=/app/pyproject.toml"
    else
        config="--config=/opt/black-default.toml"
    fi
fi

if [[ -z ${files} ]]; then
    files=/app/**/*.py
fi

set -x
env 
ls -la /app
${cmd} ${config} ${files}
