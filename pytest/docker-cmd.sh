#!/bin/sh

cmd="pytest"
<<<<<<< HEAD
if [ -f "/app/setup.cfg" ]; then
    cmd="${cmd} --rcfile=/app/setup.cfg"
elif [ -f "/app/pytest.ini" ]; then
    cmd="${cmd} --rcfile=/app/pytest.ini"
elif [ -f "/app/pyproject.toml" ]; then
    cmd="${cmd} --rcfile=/app/pyproject.toml"
elif [ -f "/app/tox.ini" ]; then
    cmd="${cmd} --rcfile=/app/tox.ini"
=======
if [ -f "./setup.cfg" ]; then
    cmd="${cmd} --rcfile=./setup.cfg"
>>>>>>> a08bd37ec7c9e9fc8edc2ed06cea74144553b2c2
fi

${cmd}