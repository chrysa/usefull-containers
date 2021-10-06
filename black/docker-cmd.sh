#!/bin/sh

cmd="black"
if [ -f "./black.toml" ]; then
    cmd="${cmd} --config=./black.toml"
fi
cmd="${cmd} /app/**/*.py"

${cmd}