<<<<<<< HEAD
#!/bin/sh

cmd="pytest"
if [ -f "/app/setup.cfg" ]; then
    cmd="${cmd} --rcfile=/app/setup.cfg"
elif [ -f "/app/pytest.ini" ]; then
    cmd="${cmd} --rcfile=/app/pytest.ini"
elif [ -f "/app/pyproject.toml" ]; then
    cmd="${cmd} --rcfile=/app/pyproject.toml"
elif [ -f "/app/tox.ini" ]; then
    cmd="${cmd} --rcfile=/app/tox.ini"
fi

${cmd}
=======
#!/bin/sh

cmd="pytest"

files=/app/**/*.py

if [ -f "/app/setup.cfg" ]; then
    config="--rcfile=/app/setup.cfg"
elif [ -f "/app/pytest.ini" ]; then
    config="--rcfile=/app/pytest.ini"
elif [ -f "/app/pyproject.toml" ]; then
    config="--rcfile=/app/pyproject.toml"
elif [ -f "/app/tox.ini" ]; then
    config="--rcfile=/app/tox.ini"
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
