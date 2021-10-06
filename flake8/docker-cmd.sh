#!/bin/sh

cmd="flake8"
if [ -f "./setup.cfg" ]; then
    cmd="${cmd} --config=./setup.cfg"
fi
cmd="${cmd} /app/**/*.py"

${cmd}