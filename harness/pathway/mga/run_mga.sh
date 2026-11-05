#!/bin/bash
# Test 13, near-optimal ranges on the central (HANDOVER 'Message 691', brief B; design note version 2, test 13), on message 693's basis:
# c7's settings with REP_REF=metered, the 12 metered extremes, the six-constant wind table (WX_WINDCORR_TABLE) and CONG_OFF=1, at 25
# clustered linked days, pass 1 only. The base first (out/mga2/base.json; its objective is MGA_FSTAR if it passes the standard, else see run_loop.sh and 'final' below),
# then the 40 MGA solves
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
# Warm mode (method chosen by the user, 5 Nov 2026, after test 13's method tests: docs/test13-results.md, 'Method tests'), set with
# MGA_WARM=1: the base keeps its optimal basis (WARM=1: lpc/<key>.basis.json), and each MGA solve starts from it on primal simplex,
# one thread (MGA_OPTS, default {"simplex_strategy":4,"threads":1}; the launch's HIGHS_OPTS then applies to the base only), resuming
# from its own kept basis at each piece end; HiGHS's log goes to <run>.highs.<UTC stamp>.log. MGA_OUT=<folder> (default out/mga2)
# for a fresh folder on a new LP key. START_DELAY=<seconds> staggers runners launched together; a runner starts no new solve while
# less than MIN_AVAIL_MB (default 3000) of memory is available. Four runners, one per background task, e.g.:
#   MGA_WARM=1 MGA_OUT=out/mga3 PIECE_MIN=117 EST_MIN=20 START_DELAY=0 HIGHS_OPTS='{"simplex_strategy":2,"threads":2}' bash pathway/mga/run_mga.sh
# (the base first, in one runner; after it, the same launch with START_DELAY 0, 120, 240 and 360 in four runners each piece.) Do not set
# HIGHS_BASIS_IN in the launch: the base would start from it; the runner sets it for each MGA solve.
H=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd); cd "$H" || exit 1
sleep ${START_DELAY:-0}
O=${MGA_OUT:-out/mga2}; P=$O/progress.txt; C=$O/claim; mkdir -p $C
source pathway/mga/env_693.sh
export MAXP=1 DUMP=0 LPCACHE=$O/lpc
EST=$(( ${EST_MIN:-80} * 60 )); T0=$(date +%s); END=$(( T0 + ${PIECE_MIN:-117} * 60 ))
# DL_MIN (default PIECE_MIN): the solve deadline, minutes from the start; a solve gets the time to it less 15 minutes. Set past the piece's
# end it gives a long solve more time: an optimal solution is cached as soon as it is found, so if the piece ends during the engine check
# the next runner replays it and redoes only the check.
export JOB_DEADLINE=$(( T0 + ${DL_MIN:-${PIECE_MIN:-117}} * 60 ))
alive(){ [ -n "$1" ] && kill -0 "$1" 2>/dev/null; }
# Clear claims whose runner has gone (a claim without a PID file is cleared once it is over 2 minutes old).
for d in $C/*/ $C/.sampler/; do [ -d "$d" ] || continue; q=$(cat $d/pid 2>/dev/null)
  if [ -n "$q" ]; then alive $q || rm -rf "$d"; elif [ -n "$(find "$d" -maxdepth 0 -mmin +2)" ]; then rm -rf "$d"; fi; done
claim(){ mkdir $C/$1 2>/dev/null || return 1; echo $$ > $C/$1/pid; }
echo "$(date -u +%FT%H:%MZ) runner, shell PID $$, EST_MIN=$((EST/60)) solver ${HIGHS_SOLVER:-simplex} opts ${HIGHS_OPTS:-none} piece end $(date -u -d @$END +%H:%MZ) solve deadline $(date -u -d @$JOB_DEADLINE +%H:%MZ), on $(git log --oneline -1 | cut -c1-50)" >> $P
MEMPID=""
if claim .sampler; then
  ( while sleep 60; do echo "$(date -u +%H:%MZ) $(free -m | awk '/Mem:/{print "used "$3" avail "$7" MB"}') | $(ps -o pid=,rss=,etime=,comm= -C node,python3 | awk '{printf "%s %s %dMB %s; ", $1, $4, $2/1024, $3}')" >> $O/mem.txt; done ) &
  MEMPID=$!; echo "$(date -u +%H:%MZ) memory sampler PID $MEMPID (runner $$)" >> $P; fi
stop(){ [ -n "$MEMPID" ] && { kill $MEMPID; rm -rf $C/.sampler; }; exit $1; }
run1(){ local name=$1; shift; local out=$O/$name.json t0=$(date +%s)
  env "$@" OUT=$out bash -c "echo \$\$ > $O/$name.pid; exec nice -n 5 node --max-old-space-size=9000 pathway/pathway_perfail.js" 2>&1 | while IFS= read -r l; do printf "%s %s\n" "$(date -u +%T)" "$l"; done >> $O/$name.log
  local rc=${PIPESTATUS[0]}; echo "$(date -u +%FT%H:%MZ) $name rc=$rc pid $(cat $O/$name.pid) $(( ($(date +%s) - t0) / 60 )) min $([ -s $out ] && echo done || echo 'not done')" >> $P
  # A solve stopped at its deadline (no valid basis with parallel dual simplex) is marked <run>.timeout and not retried by a runner.
  [ $rc = 75 ] && grep -q "no valid basis" $O/$name.log && date -u +%FT%H:%MZ >> $O/$name.timeout
  rm -rf $C/$name; }
# The base (DUMP_LP keeps its LP, for reading which limits bind; it changes nothing in the LP).
if [ ! -s $O/base.json ]; then
  claim base || { echo "$(date -u +%FT%H:%MZ) runner $$: the base is running in another runner; nothing to do until it ends" >> $P; stop 75; }
  echo "$(date -u +%FT%H:%MZ) base start (runner $$)" >> $P; run1 base DUMP_LP=$O/base ${MGA_WARM:+WARM=1}; fi
[ -s $O/base.json ] || stop 75
# Amendment to message 693's step 5: the ranges are measured on a plan that passes the standard. If the base passes, MGA_FSTAR is its
# objective. If not, run_loop.sh runs the adequacy loop to a passing plan (loop.json, its windows loop_lp2040.json); 'final' is then the
# loop's final LP rebuilt from those windows (WIN_FROM, MAXP=1; the same LP, so a cache hit), and the MGA runs use the same windows.
passes(){ python3 -I -c "import json,sys;R=json.load(open(sys.argv[1]));sys.exit(0 if R['status']=='Optimal' and not [q for q in R['log'][-1]['years'] if q['mean']>q['limit']] else 1)" $1; }
WIN=""; REF=$O/base.json
if ! passes $O/base.json; then
  [ -s $O/loop.json ] || { echo "$(date -u +%FT%H:%MZ) runner $$: the base fails the standard and the loop has not finished; no MGA runs" >> $P; stop 75; }
  passes $O/loop.json || { echo "$(date -u +%FT%H:%MZ) runner $$: the loop ended without a passing plan; no MGA runs" >> $P; stop 1; }
  WIN=$O/loop_lp2040.json; REF=$O/final.json
  if [ ! -s $O/final.json ]; then
    claim final || { echo "$(date -u +%FT%H:%MZ) runner $$: 'final' is running in another runner" >> $P; stop 75; }
    echo "$(date -u +%FT%H:%MZ) final start (runner $$)" >> $P; run1 final WIN_FROM=$WIN ${MGA_WARM:+WARM=1}; fi
  [ -s $O/final.json ] || stop 75
  python3 -I -c "import json,sys;F=json.load(open(sys.argv[1]));L=json.load(open(sys.argv[2]));assert len(F['passLog'])==1 and F['passLog'][0]['key']==L['passLog'][-1]['key'], 'final LP is not the loop final pass LP'" $O/final.json $O/loop.json \
    || { echo "$(date -u +%FT%H:%MZ) runner $$: final.json's LP differs from the loop's final pass; no MGA runs" >> $P; stop 1; }
  passes $O/final.json || { echo "$(date -u +%FT%H:%MZ) runner $$: final.json fails the standard; no MGA runs" >> $P; stop 1; }
fi
FSTAR=$(python3 -I -c "import json,sys;B=json.load(open(sys.argv[1]));assert B['status']=='Optimal' and len(B['passLog'])==1 and B['mga'] is None;print(repr(B['objective']))" $REF) || { echo "$REF unreadable" >> $P; stop 1; }
# Warm mode: the reference LP's saved optimal basis (kept by WARM=1 beside its cached solution).
if [ -n "$MGA_WARM" ]; then
  K=$(python3 -I -c "import json,sys;print(json.load(open(sys.argv[1]))['passLog'][0]['key'])" $REF)
  BB=$(ls $O/lpc/$K*.basis.json 2>/dev/null | grep -v partial | head -1)
  [ -s "$BB" ] || { echo "$(date -u +%FT%H:%MZ) runner $$: warm mode, but no saved basis for $REF (key $K); no MGA runs" >> $P; stop 1; }
  DEF='{"simplex_strategy":4,"threads":1}'
  mopts(){ python3 -I -c 'import json,sys;o=json.loads(sys.argv[1]);o.update(output_flag=True,log_to_console=False,log_file=sys.argv[2]);print(json.dumps(o,separators=(",",":")))' "${MGA_OPTS:-$DEF}" "$O/$1.highs.$(date -u +%m%dT%H%M).log"; }
fi
memok(){ local a; a=$(awk '/MemAvailable/{print int($2/1024)}' /proc/meminfo); [ "$a" -ge ${MIN_AVAIL_MB:-3000} ] || { echo "$(date -u +%FT%H:%MZ) runner $$: $a MB available, under ${MIN_AVAIL_MB:-3000}; no new solve" >> $P; return 1; }; }
Q=(); for s in 0.01 0.02; do for y in 2040 2030; do for g in wind solar lithium ldes coal; do for d in min max; do Q+=("${g}_${y}_${d}_${s}"); done; done; done; done
while :; do pick=""
  memok || break
  for n in "${Q[@]}"; do [ -s $O/$n.json ] || [ -e $O/$n.timeout ] && continue; claim $n && { pick=$n; break; }; done
  [ -z "$pick" ] && break
  if [ $(( END - $(date +%s) )) -lt $EST ]; then rm -rf $C/$pick; break; fi
  IFS=_ read g y d s <<< "$pick"; echo "$(date -u +%FT%H:%MZ) $pick start (runner $$)" >> $P
  W=(); [ -n "$MGA_WARM" ] && W=(HIGHS_BASIS_IN=$BB "HIGHS_OPTS=$(mopts $pick)")
  run1 $pick MGA=$g:$y:$d:$s MGA_FSTAR=$FSTAR ${WIN:+WIN_FROM=$WIN} "${W[@]}"; done
left=0; for n in "${Q[@]}"; do [ -s $O/$n.json ] || left=$((left+1)); done
echo "$(date -u +%FT%H:%MZ) runner $$ end, $left of ${#Q[@]} MGA runs left" >> $P; stop 0
