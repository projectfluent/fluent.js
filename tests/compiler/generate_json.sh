#!/bin/bash

HERE=$(cd `dirname $0`; pwd)
LOLS=$HERE/lol
L20N=$HOME/moz/code/l20n

source $L20N/@l20n/bin/activate

DUMP=$L20N/l20n/python/tools/dump_lol.py
OPTS="-t json"

for LOL in $(ls -1 $LOLS/*.lol);
do
    NAME=$(basename $LOL .lol);
    python $DUMP $OPTS $LOL > $LOLS/${NAME}.json
done
