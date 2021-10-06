#!/bin/sh

cmd="pylint"
if [ -f "./setup.cfg" ]; then
    cmd="${cmd} --rcfile=./setup.cfg"
fi
cmd="${cmd} /app/**/*.py"

${cmd}