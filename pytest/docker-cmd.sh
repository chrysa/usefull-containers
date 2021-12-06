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
