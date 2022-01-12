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

files=/app/**/*.py

if [ -f "/app/setup.cfg" ]; then
    config="--config=/app/setup.cfg"
elif [ -f "/app/tox.ini" ]; then
    config="--config=/app/tox.ini"
elif [ -f "/app/.flake8" ]; then
    config="--config=/app/.flake8"
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
