#!/bin/bash
# Test 13, near-optimal ranges on the central (HANDOVER 'Message 691', brief B; design note version 2, test 13), on message 693's basis:
# c7's settings with REP_REF=metered, the 12 metered extremes, the six-constant wind table (WX_WINDCORR_TABLE) and CONG_OFF=1, at 25
# clustered linked days, pass 1 only. The base first (out/mga2/base.json; its objective is MGA_FSTAR), then the 40 MGA solves
# (MGA=<group>:<year>:<min|max>:<slack>), 1% for 2040 and 2030 first, then 2%. The earlier runs on message 691's basis are in out/mga
# (base only; stopped at message 693).
# Solver (message 693 (1)): parallel dual simplex on 2 threads, HIGHS_OPTS='{"simplex_strategy":2,"threads":2}', the fastest of the
# solver tests on 691's base (64 min) and the only one to finish inside a 2-hour piece; set it in the launch.
# Each launch is one runner: it solves the next unclaimed run, and another while EST_MIN minutes remain before its deadline. Several
# runners may run side by side (one per background task): a claim holds its runner's PID, and claims whose runner has gone are cleared.
# A solve cut at the deadline resumes from its basis where HiGHS kept a valid one (RESUME=1, JOB_DEADLINE). From harness/, with the Bash
# tool's run_in_background (never nohup or &):
#   PIECE_MIN=<minutes, under 120> EST_MIN=<minutes> HIGHS_OPTS='...' bash pathway/mga/run_mga.sh
# Outputs in out/mga2: <run>.json (pathway output), <run>.log (each line stamped UTC), progress.txt (starts, PIDs, minutes, ends),
# mem.txt (memory every minute, from one runner at a time).
H=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd); cd "$H" || exit 1
O=out/mga2; P=$O/progress.txt; C=$O/claim; mkdir -p $C
source pathway/env_c6a.sh
export GAS_FIRST=2035 SS=inertia SS_FC=reservecoal COC=blended BTM_STOCK=8 VPP=1 GY=1 COAL_FUEL_ESC=3 COAL_FOM_ESC=1.1 COMPLY=compromise \
  COAL_CARBON_FLOOR=1 SOLVER=native
export REP_REF=metered REP_EXTREMES=20,161,162,163,187,188,194,195,196,214,218,358 WX_WINDCORR=1 \
  WX_WINDCORR_TABLE=pathway/wx/wind_corr_table_calm6.json CONG_OFF=1
export REP_WEIGHTS=clustered REP_DAYS=25 STORAGE_LINK=1 MAXP=1 DUMP=0 LPCACHE=$O/lpc RESUME=1
EST=$(( ${EST_MIN:-80} * 60 )); END=$(( $(date +%s) + ${PIECE_MIN:-117} * 60 )); export JOB_DEADLINE=$END
alive(){ [ -n "$1" ] && kill -0 "$1" 2>/dev/null; }
# Clear claims whose runner has gone (a claim without a PID file is cleared once it is over 2 minutes old).
for d in $C/*/ $C/.sampler/; do [ -d "$d" ] || continue; q=$(cat $d/pid 2>/dev/null)
  if [ -n "$q" ]; then alive $q || rm -rf "$d"; elif [ -n "$(find "$d" -maxdepth 0 -mmin +2)" ]; then rm -rf "$d"; fi; done
claim(){ mkdir $C/$1 2>/dev/null || return 1; echo $$ > $C/$1/pid; }
echo "$(date -u +%FT%H:%MZ) runner, shell PID $$, EST_MIN=$((EST/60)) solver ${HIGHS_SOLVER:-simplex} opts ${HIGHS_OPTS:-none} deadline $(date -u -d @$END +%H:%MZ), on $(git log --oneline -1 | cut -c1-50)" >> $P
MEMPID=""
if claim .sampler; then
  ( while sleep 60; do echo "$(date -u +%H:%MZ) $(free -m | awk '/Mem:/{print "used "$3" avail "$7" MB"}') | $(ps -o pid=,rss=,etime=,comm= -C node,python3 | awk '{printf "%s %s %dMB %s; ", $1, $4, $2/1024, $3}')" >> $O/mem.txt; done ) &
  MEMPID=$!; echo "$(date -u +%H:%MZ) memory sampler PID $MEMPID (runner $$)" >> $P; fi
stop(){ [ -n "$MEMPID" ] && { kill $MEMPID; rm -rf $C/.sampler; }; exit $1; }
run1(){ local name=$1; shift; local out=$O/$name.json t0=$(date +%s)
  env "$@" OUT=$out bash -c "echo \$\$ > $O/$name.pid; exec nice -n 5 node --max-old-space-size=9000 pathway/pathway_perfail.js" 2>&1 | while IFS= read -r l; do printf "%s %s\n" "$(date -u +%T)" "$l"; done >> $O/$name.log
  local rc=${PIPESTATUS[0]}; echo "$(date -u +%FT%H:%MZ) $name rc=$rc pid $(cat $O/$name.pid) $(( ($(date +%s) - t0) / 60 )) min $([ -s $out ] && echo done || echo 'not done')" >> $P
  rm -rf $C/$name; }
# The base (DUMP_LP keeps its LP, for reading which limits bind; it changes nothing in the LP).
if [ ! -s $O/base.json ]; then
  claim base || { echo "$(date -u +%FT%H:%MZ) runner $$: the base is running in another runner; nothing to do until it ends" >> $P; stop 75; }
  echo "$(date -u +%FT%H:%MZ) base start (runner $$)" >> $P; run1 base DUMP_LP=$O/base; fi
[ -s $O/base.json ] || stop 75
FSTAR=$(python3 -I -c "import json,sys;B=json.load(open(sys.argv[1]));assert B['status']=='Optimal' and len(B['passLog'])==1 and B['mga'] is None;print(repr(B['objective']))" $O/base.json) || { echo "base unreadable" >> $P; stop 1; }
Q=(); for s in 0.01 0.02; do for y in 2040 2030; do for g in wind solar lithium ldes coal; do for d in min max; do Q+=("${g}_${y}_${d}_${s}"); done; done; done; done
while :; do pick=""
  for n in "${Q[@]}"; do [ -s $O/$n.json ] && continue; claim $n && { pick=$n; break; }; done
  [ -z "$pick" ] && break
  if [ $(( END - $(date +%s) )) -lt $EST ]; then rm -rf $C/$pick; break; fi
  IFS=_ read g y d s <<< "$pick"; echo "$(date -u +%FT%H:%MZ) $pick start (runner $$)" >> $P
  run1 $pick MGA=$g:$y:$d:$s MGA_FSTAR=$FSTAR; done
left=0; for n in "${Q[@]}"; do [ -s $O/$n.json ] || left=$((left+1)); done
echo "$(date -u +%FT%H:%MZ) runner $$ end, $left of ${#Q[@]} MGA runs left" >> $P; stop 0
