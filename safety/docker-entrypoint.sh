#!/bin/sh

set -e
echo "====>> run safety"

if [ -z "$@" ]; then
    set -x
    safety scan --detailed-output
else
    set -x
    safety "$@"
fi
