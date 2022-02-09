<<<<<<< HEAD
#!/bin/sh

cmd="pylint"
if [ -f "/app/setup.cfg" ]; then
    cmd="${cmd} --rcfile=/app/setup.cfg"
elif [ -f "/app/.pylintrc" ]; then
    cmd="${cmd} --rcfile=/app/.pylintrc"
fi
${cmd} /app/**/*.py
=======
#!/bin/sh

cmd="pylint"

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
    if [ -f "/app/setup.cfg" ]; then
        config="--rcfile=/app/setup.cfg"
    elif [ -f "/app/.pylintrc" ]; then
        config="--rcfile=/app/.pylintrc"
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
