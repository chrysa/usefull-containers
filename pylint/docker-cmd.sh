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
            files=`git status | grep -E "modified" | grep ".py$" | cut -d":" -f2 | xargs`
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
