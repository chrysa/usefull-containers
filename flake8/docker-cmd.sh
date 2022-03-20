<<<<<<< HEAD
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
=======
#!/bin/sh

cmd="flake8"

if [ -f "/app/setup.cfg" ]; then
    config="--config=/app/setup.cfg"
elif [ -f "/app/tox.ini" ]; then
    config="--config=/app/tox.ini"
elif [ -f "/app/.flake8" ]; then
    config="--config=/app/.flake8"
else
    config="--config=/opt/setup-default.cfg"
fi

files=/app/**/*.py

opts=$(getopt \
    --longoptions "config,file,git,help" \
    --name "$(basename "$0")" \
    --options "c,f,g,h" \
    -- "$@"
)

eval set -- $opts

while [[ $# -gt 0 ]]; do
    case "$1" in
        -c|--config)
            config="${config} $2"
            shift 2
        ;;
        -f|--file)
            echo "files $2"
            files="$2"
            shift 2
        ;;
        -g|--git)
            echo "get files from git status"
            files=$(git status | grep -v "deleted" | grep ".py$" | cut -d ":" -f2 | sort -u | xargs)
            shift 2
        ;;
        --)
            shift;
            break
            ;;
        -h)
            echo "Usage reorder python import :
                [ -c | --config] define config flags
                [ -f | --file] relative file(s) path to format
                [ -g | --git] detect file from git status
                [ -h | --help]"
            exit 2
        ;;
    esac
done

set -x
${cmd} ${config} ${files}

