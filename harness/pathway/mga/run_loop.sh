#!/bin/bash
# Test 13, amendment to message 693's step 5: the base (MAXP=1) failed the standard, so the adequacy loop runs to a passing plan on the
# same basis (MAXP=6, env_c6.sh's; STALL as env_c6.sh), one solve per piece (RESUME=1, JOB_PASSES=1, JOB_DEADLINE): each piece replays the
# passes already solved from the cache (pass 1 is the base's) and solves the next. DUMP on, so the run writes its final stress windows
# (loop_lp2040.json) for the MGA runs' WIN_FROM. From harness/, with the Bash tool's run_in_background (never nohup or &):
#   PIECE_MIN=<minutes, under 120> HIGHS_OPTS='...' bash pathway/mga/run_loop.sh      (exit 75: another piece needed; 0: done)
H=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd); cd "$H" || exit 1
O=out/mga2; P=$O/progress.txt
source pathway/mga/env_693.sh
unset DUMP; export JOB_PASSES=1   # MAXP stays at env_c6.sh's
END=$(( $(date +%s) + ${PIECE_MIN:-117} * 60 )); export JOB_DEADLINE=$END
[ -s $O/loop.json ] && { echo "$(date -u +%FT%H:%MZ) loop already done" >> $P; exit 0; }
echo "$(date -u +%FT%H:%MZ) loop piece, shell PID $$, MAXP=$MAXP STALL=$STALL STALL_FROM=$STALL_FROM solver ${HIGHS_SOLVER:-simplex} opts ${HIGHS_OPTS:-none} deadline $(date -u -d @$END +%H:%MZ), on $(git log --oneline -1 | cut -c1-50)" >> $P
t0=$(date +%s)
OUT=$O/loop.json bash -c "echo \$\$ > $O/loop.pid; exec nice -n 5 node --max-old-space-size=9000 pathway/pathway_perfail.js" 2>&1 | while IFS= read -r l; do printf "%s %s\n" "$(date -u +%T)" "$l"; done >> $O/loop.log
rc=${PIPESTATUS[0]}; echo "$(date -u +%FT%H:%MZ) loop piece rc=$rc pid $(cat $O/loop.pid) $(( ($(date +%s) - t0) / 60 )) min $([ -s $O/loop.json ] && echo 'loop done' || echo 'not done')" >> $P
exit $rc
