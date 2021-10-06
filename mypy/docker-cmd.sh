#!/bin/sh

<<<<<<< HEAD
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
set -x 
ls -la 

cmd="mypy"
if [ -f "./setup.cfg" ]; then
    cmd="${cmd} --config=./setup.cfg"
fi
cmd="${cmd} /app/**/*.py"

${cmd}
>>>>>>> a08bd37ec7c9e9fc8edc2ed06cea74144553b2c2
