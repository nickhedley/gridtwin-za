#!/bin/bash
# Test 13, near-optimal ranges on the central (HANDOVER 'Message 691', brief B; design note version 2, test 13). One piece: the base
# at 25 clustered linked days (c7's settings, pass 1 only), then the 40 MGA solves (MGA=<group>:<year>:<min|max>:<slack>, MGA_FSTAR the
# base's pass-1 objective), 1% for 2040 and 2030 first, then 2%. Resumable: a run with its output is skipped; a solve cut at the piece's
# deadline resumes from its basis where HiGHS kept a valid one (RESUME=1, JOB_DEADLINE). A new solve starts only if EST_MIN minutes
# remain. From harness/, with the Bash tool's run_in_background (never nohup or &):
#   J=<parallel solves> PIECE_MIN=<minutes, under 120> EST_MIN=<minutes> bash pathway/mga/run_mga.sh
# Outputs in out/mga: <run>.json (pathway output), <run>.log (each line stamped UTC), progress.txt (starts, PIDs, ends), mem.txt (memory every minute).
H=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd); cd "$H" || exit 1
O=out/mga; P=$O/progress.txt; mkdir -p $O/claim
source pathway/env_c6a.sh
export GAS_FIRST=2035 SS=inertia SS_FC=reservecoal COC=blended BTM_STOCK=8 VPP=1 GY=1 COAL_FUEL_ESC=3 COAL_FOM_ESC=1.1 COMPLY=compromise \
  COAL_CARBON_FLOOR=1 SOLVER=native REP_REF=2025 REP_EXTREMES=113,114,115,141,161,162,163,187,188,214,217,218,219,257,273,359
export REP_WEIGHTS=clustered REP_DAYS=25 STORAGE_LINK=1 MAXP=1 DUMP=0 LPCACHE=$O/lpc RESUME=1
J=${J:-1}; EST=$(( ${EST_MIN:-75} * 60 )); END=$(( $(date +%s) + ${PIECE_MIN:-112} * 60 )); export JOB_DEADLINE=$END
rm -rf $O/claim/*   # one piece at a time: claims left by a stopped piece are stale
echo "$(date -u +%FT%H:%MZ) piece, shell PID $$, J=$J EST_MIN=$((EST/60)) deadline $(date -u -d @$END +%H:%MZ), on $(git log --oneline -1 | cut -c1-50)" >> $P
( while sleep 60; do echo "$(date -u +%H:%MZ) $(free -m | awk '/Mem:/{print "used "$3" avail "$7" MB"}') | $(ps -o pid=,rss=,etime=,comm= -C node,python3 | awk '{printf "%s %s %dMB %s; ", $1, $4, $2/1024, $3}')" >> $O/mem.txt; done ) &
MEMPID=$!; echo "$(date -u +%H:%MZ) memory sampler PID $MEMPID" >> $P
run1(){ local name=$1; shift; local out=$O/$name.json t0=$(date +%s)
  env "$@" OUT=$out bash -c "echo \$\$ > $O/$name.pid; exec nice -n 5 node --max-old-space-size=9000 pathway/pathway_perfail.js" 2>&1 | while IFS= read -r l; do printf "%s %s\n" "$(date -u +%T)" "$l"; done >> $O/$name.log
  local rc=${PIPESTATUS[0]}; echo "$(date -u +%FT%H:%MZ) $name rc=$rc pid $(cat $O/$name.pid) $(( ($(date +%s) - t0) / 60 )) min $([ -s $out ] && echo done || echo 'not done')" >> $P
  [ -s $out ] || rmdir $O/claim/$name 2>/dev/null; }
# The base (DUMP_LP keeps its LP, for reading which limits bind; it changes nothing in the LP).
if [ ! -s $O/base.json ]; then mkdir $O/claim/base; echo "$(date -u +%FT%H:%MZ) base start" >> $P; run1 base DUMP_LP=$O/base; fi
[ -s $O/base.json ] || { kill $MEMPID; exit 75; }
FSTAR=$(python3 -I -c "import json,sys;B=json.load(open(sys.argv[1]));assert B['status']=='Optimal' and len(B['passLog'])==1 and B['mga'] is None;print(repr(B['objective']))" $O/base.json) || { echo "base unreadable" >> $P; kill $MEMPID; exit 1; }
Q=(); for s in 0.01 0.02; do for y in 2040 2030; do for g in wind solar lithium ldes coal; do for d in min max; do Q+=("${g}_${y}_${d}_${s}"); done; done; done; done
worker(){ while :; do local pick=""
    for n in "${Q[@]}"; do [ -s $O/$n.json ] && continue; mkdir $O/claim/$n 2>/dev/null && { pick=$n; break; }; done
    [ -z "$pick" ] && return 0
    if [ $(( END - $(date +%s) )) -lt $EST ]; then rmdir $O/claim/$pick; return 0; fi
    IFS=_ read g y d s <<< "$pick"; echo "$(date -u +%FT%H:%MZ) $pick start (slot $1)" >> $P
    run1 $pick MGA=$g:$y:$d:$s MGA_FSTAR=$FSTAR; done; }
for k in $(seq 1 $J); do worker $k & sleep 20; done; wait $(jobs -p | grep -v "^$MEMPID$")
kill $MEMPID; left=0; for n in "${Q[@]}"; do [ -s $O/$n.json ] || left=$((left+1)); done
echo "$(date -u +%FT%H:%MZ) piece end, $left of ${#Q[@]} MGA runs left" >> $P
