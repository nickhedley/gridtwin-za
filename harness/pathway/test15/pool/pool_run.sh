#!/bin/bash
# Message 767 (c), option B: the 8 Nov key's pass 1 with its representative days drawn from the twelve modelled weather years (2014-2025;
# metered 2025 out). Code: worktree WT (default /home/user/gtza-pool): claude/twin-retime 2d86faa + claude/c7-runs' key patch, with this
# folder's pool_days.js copied to harness/pathway/ and pool_hook.diff's three lines in pathway_perfail.js (REP_POOL). Settings: the key's,
# read from claude/c7-runs' solve_key.sh (EXM, C7, BASE, case 'key', HIGHS_OPTS; env_c6a.sh; GAS_FIRST=2035), with REP_POOL=1, the pool's
# extremes (pool_ext.json from pool_extremes.py: today's fleet and the fin pass's) and the linking chronology 2025 (the modelled year of
# the key's reference year). REP_REF and REP_EXTREMES stay set and are not read (the pooled days replace the clustered rule).
#   bash pool_run.sh p1      pass 1 (MAXP=1), one piece under 2 hours (RESUME, presolve off, basis kept; rerun to resume); then the
#                            engine at 20 draws, 2030/2035/2040 (solve_key.sh's engine line)
#   bash pool_run.sh gate    the 100-draw gate on pass 1's build: 2034-2036 and 2040 (the README row's settings, K=100)
# Progress, PIDs and results: <O>/progress.txt (O = <WT>/harness/out/pool).
M=${1:?mode p1 or gate}; WT=${WT:-/home/user/gtza-pool}; O=$WT/harness/out/pool; P=$O/progress.txt; mkdir -p $O
D=$(cd "$(dirname "$0")" && pwd)
ts(){ date -u +%FT%H:%M:%SZ; }
SK=$(cd /home/user/gridtwin-za && git show origin/claude/c7-runs:harness/pathway/final/key/solve_key.sh) || exit 2
eval "$(echo "$SK" | grep -E '^(EXM|C7|BASE)=')"
X=$(echo "$SK" | sed -n 's/^  key) *X="\(.*\)";;$/\1/p' | sed "s/\$EXM/$EXM/")
HO=$(echo "$SK" | grep -o "HIGHS_OPTS='{[^']*}'" | head -1 | sed 's/\\//g')
ENG=$(echo "$SK" | grep -o 'LNG=1 GRID=1 SS_FC=[a-z]* K=20 YEARS=[0-9,]*'); ENGX=$(echo "$SK" | grep -o 'CONG_OFF=1 WX_WINDCORR=1 nice' | sed 's/ nice//')
EXT=$(python3 -I -c "import json,sys; print(','.join(json.load(open(sys.argv[1]))['days']))" $D/pool_ext.json)
for v in EXM C7 BASE X HO ENG ENGX EXT; do [ -n "${!v}" ] || { echo "$(ts) settings: $v not found" >> $P; exit 2; }; done
cd $WT/harness || exit 2
cmp -s $D/pool_days.js pathway/pool_days.js || { echo "$(ts) pathway/pool_days.js differs from $D/pool_days.js" >> $P; exit 2; }
grep -q "process.env.REP_POOL" pathway/pathway_perfail.js || { echo "$(ts) pathway_perfail.js has no REP_POOL hook" >> $P; exit 2; }
source pathway/env_c6a.sh >/dev/null 2>&1; export GAS_FIRST=2035
POOL="REP_POOL=1 REP_POOL_EXTREMES=$EXT REP_POOL_CHRON=2025"
case $M in
p1)
  s=pool_p1; T0=$(date +%s); DL=$(( T0 + ${PIECE_S:-6600} ))
  echo "$(ts) $s piece, shell PID $$, $(git log --oneline -1 | cut -c1-8) + $(git diff --stat | tail -1 | sed 's/^ *//'), $POOL, deadline $(date -u -d @$DL +%H:%MZ), load $(cut -d' ' -f1-3 /proc/loadavg), memory free $(free -g | awk '/Mem/{print $7}')G" >> $P
  if [ ! -s $O/$s.json ]; then
    eval "env $C7 $BASE $X MAXP=1 $POOL SOLVER=native HIGHS_SOLVER=simplex $HO DUMP=0 LPCACHE=$O/lpc_$s OUT=$O/$s.json TL=7000 RESUME=1 JOB_DEADLINE=$DL nice -n 5 node --max-old-space-size=9000 pathway/pathway_perfail.js" >> $O/$s.log 2>&1 &
    N=$!; echo "$(ts) $s node PID $N" >> $P; wait $N; rc=$?
    echo "$(ts) $s pass 1 rc $rc $(grep -h 'REP_POOL days\|cache hit\|stopped at\|start from basis\|^done\|verdict\|objective' $O/$s.log | tail -3 | tr '\n' ' ' | cut -c1-300)" >> $P; fi
  if [ -s $O/$s.json ] && [ ! -s $O/${s}_eng.json ]; then
    env -i PATH="$PATH" HOME="$HOME" $ENG IN=$O/$s.json OUTC=$O/${s}_eng.json $ENGX nice -n 10 node --max-old-space-size=4096 pathcheck.js > $O/${s}_eng.log 2>&1 &
    N=$!; echo "$(ts) $s engine PID $N ($ENG $ENGX)" >> $P; wait $N; echo "$(ts) $s engine rc $?" >> $P; fi ;;
gate)
  s=pool_p1; [ -s $O/$s.json ] || { echo "$(ts) gate: no $s.json yet" >> $P; exit 0; }
  ROW=$(cd /home/user/gridtwin-za && git show origin/claude/c7-runs:harness/pathway/final/README.md | grep '^| engine_loop_base_05h_k100.json ')
  KV=$(echo "$ROW" | grep -oE '\b[A-Z][A-Z0-9_]*=[^ )|]+' | sed 's/,$//' | grep -v '^K=\|^YEARS=')
  for G in 2034,2035,2036 2040; do f=$O/${s}_k100_$(echo $G | tr ',' '_').json; [ -s $f ] && continue
    env -i PATH="$PATH" HOME="$HOME" $KV K=100 YEARS=$G IN=$O/$s.json OUTC=$f nice -n 10 node --max-old-space-size=4096 pathcheck.js > ${f%.json}.log 2>&1 &
    N=$!; echo "$(ts) gate $G PID $N ($KV K=100)" >> $P; wait $N; echo "$(ts) gate $G rc $?" >> $P; done ;;
*) echo "mode: p1 or gate" >&2; exit 2 ;;
esac
exit 0
