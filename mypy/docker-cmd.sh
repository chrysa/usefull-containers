#!/bin/sh

set -x 
ls -la 

cmd="mypy"
if [ -f "./setup.cfg" ]; then
    cmd="${cmd} --config=./setup.cfg"
fi
cmd="${cmd} /app/**/*.py"

${cmd}