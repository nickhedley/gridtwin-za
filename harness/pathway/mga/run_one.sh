#!/bin/bash
# run_one.sh <dir> <name> [KEY=VALUE ...]: one pathway run on message 693's basis (env_693.sh), for test 13's method tests (warm start,
# 18 days, presolve off; the user's message after 698). MAXP=1 DUMP=0 and LPCACHE=<dir>/lpc (each test its own cache, so no test replays
# another's solution) unless the arguments say otherwise. RESUME=1 with JOB_DEADLINE DL_MIN minutes from the start (default 127): a solve
# gets the time to it less 15 minutes; one stopped there with a valid basis resumes when the same command runs again. HIGHS_OPTS and
# HIGHS_BASIS_IN come from the launch. Output <dir>/<name>.json, log <dir>/<name>.log (each line stamped UTC), lines in out/mga2/progress.txt.
# From harness/, with the Bash tool's run_in_background (never nohup or &).
H=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd); cd "$H" || exit 1
D=$1; N=$2; shift 2; P=out/mga2/progress.txt; mkdir -p $D
source pathway/mga/env_693.sh
export MAXP=1 DUMP=0 LPCACHE=$D/lpc
T0=$(date +%s); export JOB_DEADLINE=$(( T0 + ${DL_MIN:-127} * 60 ))
[ -s $D/$N.json ] && { echo "$(date -u +%FT%H:%MZ) test $D/$N already done" >> $P; exit 0; }
echo "$(date -u +%FT%H:%MZ) test $D/$N start, shell PID $$, $* opts ${HIGHS_OPTS:-none} basis-in ${HIGHS_BASIS_IN:-none} solve deadline $(date -u -d @$JOB_DEADLINE +%H:%MZ), on $(git log --oneline -1 | cut -c1-40)" >> $P
env "$@" OUT=$D/$N.json bash -c "echo \$\$ > $D/$N.pid; exec nice -n 5 node --max-old-space-size=9000 pathway/pathway_perfail.js" 2>&1 | while IFS= read -r l; do printf "%s %s\n" "$(date -u +%T)" "$l"; done >> $D/$N.log
rc=${PIPESTATUS[0]}; echo "$(date -u +%FT%H:%MZ) test $D/$N rc=$rc pid $(cat $D/$N.pid) $(( ($(date +%s) - T0) / 60 )) min $([ -s $D/$N.json ] && echo done || echo 'not done')" >> $P
exit $rc
