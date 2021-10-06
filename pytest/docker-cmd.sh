#!/bin/sh

cmd="pytest"
if [ -f "./setup.cfg" ]; then
    cmd="${cmd} --rcfile=./setup.cfg"
fi

${cmd}