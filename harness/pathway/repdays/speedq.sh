#!/bin/bash
# Runs speed.py configurations one after another (message 675 (b)); a configuration whose result exists is skipped, so a cut-off piece
# resumes. Usage: bash speedq.sh <lp> <out dir> <config>[:<basis>] ...   (from anywhere; speed.py beside this script)
D=$(cd "$(dirname "$0")" && pwd); LP=$1; O=$2; shift 2; mkdir -p $O
echo "$(date -u +%FT%H:%MZ) speedq shell PID $$ on $(basename $LP): $*" >> $O/progress.txt
for c in "$@"; do n=${c%%:*}; b=${c#*:}; [ "$b" = "$c" ] && b=
  [ -s $O/$n.json ] && continue
  nice -n 5 python3 -I $D/speed.py $LP $n $O $b >> $O/progress.txt 2>&1 &
  echo "$(date -u +%FT%H:%MZ) $n PID $!" >> $O/progress.txt; wait $!
done
