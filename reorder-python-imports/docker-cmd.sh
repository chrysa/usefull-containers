#!/bin/bash

set -e 
cmd="reorder-python-imports"

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
        --config)
            config="${config} $1"
            shift 2
        ;;
        --file)
            files="$1"
            shift 2
        ;;
        --git)
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

if [[ -z ${files} ]]; then
    files=/app/**/*.py
fi

set -x
${cmd} ${config} ${files}
