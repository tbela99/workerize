#!/bin/sh 
#
DIR=$(cd -P -- "$(dirname -- "$0")" && pwd -P)
cd $DIR
#
#
if [ ! -f ./node_modules/webpack-cli/bin/cli.js ]; then
    echo "Please run 'npm install' and try again"
    exit 1
fi
set -x
#
#
#webpack index=./src/index.js --mode development --output-library-target umd --output-path='./dist' --output-filename='workerize.js'
webpack index=./test/index.es6 --mode development --output-library-target umd --output-path='./test' --output-filename='[name].js'
  