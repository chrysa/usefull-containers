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

if [ -f "/app/setup.cfg" ]; then
    config="--rcfile=/app/setup.cfg"
elif [ -f "/app/pytest.ini" ]; then
    config="--rcfile=/app/pytest.ini"
elif [ -f "/app/pyproject.toml" ]; then
    config="--rcfile=/app/pyproject.toml"
elif [ -f "/app/tox.ini" ]; then
    config="--rcfile=/app/tox.ini"
fi

if [ -z ${files} ]; then
    files=/app/**/*.py
else
    files=`echo $files | cut -d ' '`
fi

${cmd} ${config} $files
>>>>>>> d98b6dc (test update)
