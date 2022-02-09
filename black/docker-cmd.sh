<<<<<<< HEAD
#!/bin/sh

cmd="black"
if [ -f "/app/black.toml" ]; then
    cmd="${cmd} --config=/app/black.toml"
elif [ -f "/app/pyproject.toml" ]; then
    cmd="${cmd} --config=/app/pyproject.toml"
fi

${cmd} /app/**/*.py
=======
#!/bin/sh

cmd="black"

opts=$(getopt \
    --longoptions "config,file,git" \
    --name "$(basename "$0")" \
    --options "c,f,g" \
    -- "$@"
)

eval set --$opts

while [[ $# -gt 0 ]]; do
    case "$1" in
        -c|--config)
            config="--config=$1"
            shift 2
        ;;
        -f|--file)
            files="$1"
            shift 2
        ;;
        -g|--git)
            files=`git status | grep -E "modified" | grep ".py$" | sort -u | xargs`
            shift 2
        ;;
    esac
done

if [ -z ${config} ]; then
    if [ -f "/app/black.toml" ]; then
        config="--config=/app/black.toml"
    elif [ -f "/app/pyproject.toml" ]; then
        config="--config=/app/pyproject.toml"
    else
        config="--config=/opt/setup-default.cfg"
    fi
fi

if [ -z ${files} ]; then
    files=/app/**/*.py
else
    files=`echo $files | cut -d ' '`
fi

${cmd} ${config} ${files}
