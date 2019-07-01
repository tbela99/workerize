#!/bin/sh 
#
DIR=$(cd -P -- "$(dirname -- "$0")" && pwd -P)
cd $DIR
#
#
if [ ! -f ./node_modules/rollup/bin/rollup ]; then
    echo "Please run 'npm install' and try again"
    exit 1
fi
set -x
#
#
./node_modules/rollup/bin/rollup -f umd -n workerize -- ./src/index.js
./node_modules/rollup/bin/rollup -f umd -n workerize -- test/index.es6 > test/index.js  