#!/bin/sh

cmd="pylint"
<<<<<<< HEAD
if [ -f "/app/setup.cfg" ]; then
    cmd="${cmd} --rcfile=/app/setup.cfg"
elif [ -f "/app/.pylintrc" ]; then
    cmd="${cmd} --rcfile=/app/.pylintrc"
fi
${cmd} /app/**/*.py
=======
if [ -f "./setup.cfg" ]; then
    cmd="${cmd} --rcfile=./setup.cfg"
fi
cmd="${cmd} /app/**/*.py"

${cmd}
>>>>>>> a08bd37ec7c9e9fc8edc2ed06cea74144553b2c2
