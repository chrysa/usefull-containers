#!/bin/sh

cmd="flake8"
<<<<<<< HEAD
if [ -f "/app/setup.cfg" ]; then
    cmd="${cmd} --config=/app/setup.cfg"
elif [ -f "/app/tox.ini" ]; then
    cmd="${cmd} --config=/app/tox.ini"
elif [ -f "/app/.flake8" ]; then
    cmd="${cmd} --config=/app/.flake8"
fi
${cmd} /app/**/*.py
=======
if [ -f "./setup.cfg" ]; then
    cmd="${cmd} --config=./setup.cfg"
fi
cmd="${cmd} /app/**/*.py"

${cmd}
>>>>>>> a08bd37ec7c9e9fc8edc2ed06cea74144553b2c2
