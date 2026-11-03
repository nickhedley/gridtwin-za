#!/bin/bash
# The suite in pieces (CLAUDE.md 'Running the suite'), resumable: a validator whose log ends with its summary is skipped. From harness/:
#   bash run_suite.sh <out dir> quick|long|all
# quick: every validator but the four long ones, audit.py and eng5.js; long: validate_pathway_presets, validate_links,
# validate_stored_panels, validate_worker. Each log is <out dir>/<name>.log; <out dir>/summary.txt has one line each: the last
# 'N/M' line of its output. Without ESK19679.csv, validate_weather adds one failure and validate_benchmarks skips three (CLAUDE.md).
O=$1; P=${2:-all}; mkdir -p $O
QUICK="lint structure geo capacity inputs findings invariants response weather lp consistency benchmarks external solve outputs public_text bids"
LONG="pathway_presets links stored_panels worker"
run(){ local n=$1 cmd=$2
  if [ -s $O/$n.log ] && grep -q "^=== done" $O/$n.log; then return; fi
  echo "=== $n start $(date -u +%FT%H:%MZ)" > $O/$n.log
  eval "timeout 3000 nice -n 5 $cmd" >> $O/$n.log 2>&1; echo "=== done rc=$? $(date -u +%FT%H:%MZ)" >> $O/$n.log
  echo "$n: $(grep -E '[0-9]+/[0-9]+' $O/$n.log | grep -v '^===' | tail -1)" >> $O/summary.txt; }
if [ "$P" != long ]; then
  for v in $QUICK; do run $v "node validate_$v.js testroot"; done
  run audit "python3 audit.py testroot/index.html"; run eng5 "node eng5.js"
fi
if [ "$P" != quick ]; then for v in $LONG; do run $v "node validate_$v.js testroot"; done; fi
