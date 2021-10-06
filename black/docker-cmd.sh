#!/bin/sh

cmd="black"
<<<<<<< HEAD
if [ -f "/app/black.toml" ]; then
    cmd="${cmd} --config=/app/black.toml"
elif [ -f "/app/pyproject.toml" ]; then
    cmd="${cmd} --config=/app/pyproject.toml"
fi

${cmd} /app/**/*.py
=======
if [ -f "./black.toml" ]; then
    cmd="${cmd} --config=./black.toml"
fi
cmd="${cmd} /app/**/*.py"

${cmd}
>>>>>>> a08bd37ec7c9e9fc8edc2ed06cea74144553b2c2
