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

files=/app/**/*.py

if [ -f "/app/setup.cfg" ]; then
    config="--rcfile=/app/setup.cfg"
elif [ -f "/app/.pylintrc" ]; then
    config="--rcfile=/app/.pylintrc"
fi

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

${cmd} ${config} $files
>>>>>>> d98b6dc (test update)
