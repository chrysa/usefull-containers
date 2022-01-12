<<<<<<< HEAD
#!/bin/sh

cmd="mypy"
if [ -f "/app/setup.cfg" ]; then
    cmd="${cmd} --config=/app/setup.cfg"
elif [ -f "/app/mypy.ini" ]; then
    cmd="${cmd} --config=/app/mypy.ini"
elif [ -f "/app/.mypy.ini" ]; then
    cmd="${cmd} --config=/app/.mypy.ini"
elif [ -f "/app/pyproject.toml" ]; then
    cmd="${cmd} --config=/app/pyproject.toml"
fi
${cmd} /app/**/*.py
=======
#!/bin/sh

cmd="mypy"

files=/app/**/*.py

if [ -f "/app/setup.cfg" ]; then
    config="--config=/app/setup.cfg"
elif [ -f "/app/mypy.ini" ]; then
    config="--config=/app/mypy.ini"
elif [ -f "/app/.mypy.ini" ]; then
    config="--config=/app/.mypy.ini"
elif [ -f "/app/pyproject.toml" ]; then
    config="--config=/app/pyproject.toml"
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
