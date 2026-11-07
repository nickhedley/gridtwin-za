#!/bin/bash
# Test 15 on the 8 Nov key (message 767 (a)): two stages (pathway/two_stage.sh, K=4 N=25 FIRST=2026, year y of each step on 365 days),
# one piece under the caller's 2-hour limit. Usage: bash pathway/test15_key.sh ff    (Deep follows once its cap is set: not yet a mode)
# Code: worktree WT (default /home/user/gtza-ff): claude/twin-retime 2d86faa (PR #162, the two-stage Deep and Fossil-free fix, merged)
# with claude/c7-runs f0d0c2a's harness/pathway/final/key/key_on_twin-retime_2d86faa.patch applied, uncommitted. Message 769: the key
# central's pass-1 LP from this worktree is the main session's, c10bea45a9, byte for byte (and the same on 10a98e2 with its patch).
# Settings, read from the branches, not retyped, snapshot once to <OUTDIR>/settings.env:
#   - the key: claude/c7-runs' harness/pathway/final/key/solve_key.sh, its EXM (the 13 frozen extremes), C7 and BASE lines and case
#     'key' (REP_REF=metered REP_EXTREMES=$EXM WIND_CORR=cf0.40), with env_c6a.sh, GAS_FIRST=2035, SOLVER=native HIGHS_SOLVER=simplex and
#     its HIGHS_OPTS (parallel dual simplex, 2 threads, presolve off);
#   - Fossil-free: pathway/chain_c7.sh's s_ff2040_c7 entry (PACE=grid LI_CAP=4000 LI_EH=8 IA_TOTAL=5000 FOSSIL_END=2039, MAXP 6).
# Two stages' own: REP_DAYS, REP_WEIGHTS, STORAGE_LINK and STRESS_TARGET set by two_stage.sh (N=25, clustered, 1, 1); MAXP 6 (the chain's);
# WARM=1 (each later pass from the previous pass's basis); VERDICT_CACHE on (with VERDICT_TOPUP and LPCACHE): a resumed piece replays the
# verdicts it has. Pieces: each solve gets the time left less 15 min (RESUME=1 JOB_DEADLINE, PIECE_S default 6,000 s) and keeps its basis
# if cut; no new step with under MIN_LEFT (1,500 s) left. Progress, PIDs, solve times, peak memory in <OUTDIR>/progress.txt.
R=${1:?run: ff}
WT=${WT:-/home/user/gtza-ff}
case $R in
  ff) OUTDIR=$WT/harness/out/tsk_ff; ENTRY='s_ff2040_c7' ;;
  *) echo "run must be ff" >&2; exit 2 ;;
esac
cd $WT/harness || exit 2
O=$OUTDIR; P=$O/progress.txt; S=$O/settings.env; mkdir -p $O
ts(){ date -u +%FT%H:%M:%SZ; }
if [ ! -s $S ]; then
  REF=$(cd /home/user/gridtwin-za && git rev-parse --short origin/claude/c7-runs)
  SK=$(cd /home/user/gridtwin-za && git show origin/claude/c7-runs:harness/pathway/final/key/solve_key.sh)
  EXM=$(echo "$SK" | sed -n 's/^EXM=\([0-9,]*\);.*/\1/p'); C7=$(echo "$SK" | sed -n 's/^C7="\(.*\)"$/\1/p'); BASE=$(echo "$SK" | sed -n 's/^BASE="\(.*\)"$/\1/p')
  X=$(echo "$SK" | sed -n 's/^  key) *X="\(.*\)";;$/\1/p' | sed "s/\$EXM/$EXM/")
  HO=$(echo "$SK" | grep -o "HIGHS_OPTS='{[^']*}'" | head -1 | sed "s/\\\\//g")
  FF=$(grep -o "\"$ENTRY|[^|\"]*|[0-9]*\"" pathway/chain_c7.sh | head -1 | tr -d '"'); FFKV=$(echo "$FF" | cut -d'|' -f2); FFMAXP=$(echo "$FF" | cut -d'|' -f3)
  for v in EXM C7 BASE X HO FFKV FFMAXP; do [ -n "${!v}" ] || { echo "$(ts) settings: $v not found" >> $P; exit 2; }; done
  { echo "# Read $(ts) from claude/c7-runs $REF harness/pathway/final/key/solve_key.sh (case key) and the worktree's pathway/chain_c7.sh ($ENTRY), worktree $(git rev-parse --short HEAD) + key patch"
    echo "source pathway/env_c6a.sh"
    echo "export GAS_FIRST=2035 $C7 $BASE $X"
    echo "export $FFKV MAXP=$FFMAXP"
    echo "export SOLVER=native HIGHS_SOLVER=simplex $HO"
    echo "export WARM=1 K=4 N=25 FIRST=2026 OUTDIR=$O"; } > $S
  echo "$(ts) settings snapshot written: $S" >> $P
fi
source $S
ndone(){ ls $O/step_20[0-9][0-9].json 2>/dev/null | wc -l; }
steps(){ grep -c 'rc=[0-9]* done$' $P; }
rss(){ local v; v=$(ps -o rss= -p $1 2>/dev/null | tr -d ' '); echo ${v:-0}; }
if [ "$(ndone)" -ge 15 ]; then echo "$(ts) key $R: all 15 steps have output" >> $P; exit 0; fi
export RESUME=1 JOB_DEADLINE=$(( $(date +%s) + ${PIECE_S:-6000} ))
echo "$(ts) key $R piece, PID $$, on $(git log --oneline -1 | cut -c1-8) + $(git diff --stat | tail -1 | sed 's/^ *//'), $(grep -o "BUILD_STAMP = .[0-9a-z-]*" ../index.html), deadline $(date -u -d @$JOB_DEADLINE +%H:%MZ), MIN_LEFT ${MIN_LEFT:-1500}s, MAXP $MAXP, WARM $WARM, HIGHS_OPTS $HIGHS_OPTS, disk free $(df -BG / | awk 'NR==2{print $4}'), memory free $(free -g | awk '/Mem/{print $7}')G" >> $P
bash pathway/two_stage.sh & T=$!
echo "$(ts) two_stage.sh PID $T" >> $P
nd=$(steps); stop=0; node=""; peak=0; py=""; pyt=0
while kill -0 $T 2>/dev/null; do
  sleep 15
  n=$(steps)
  if [ $n -gt $nd ]; then nd=$n; left=$(( JOB_DEADLINE - $(date +%s) )); [ $left -lt ${MIN_LEFT:-1500} ] && stop=1; fi
  c=$(ps -o pid= --ppid $T 2>/dev/null | tr -d ' ' | head -1)
  if [ -n "$py" ] && ! kill -0 $py 2>/dev/null; then echo "$(ts) solve (highs_native.py $py) ended after about ${pyt}s" >> $P; py=""; pyt=0; fi
  if [ -n "$node" ] && [ "$c" != "$node" ]; then echo "$(ts) node $node ended, peak memory $(awk -v k=$peak 'BEGIN{printf "%.1f", k/1048576}') GB" >> $P; node=""; peak=0; fi
  if [ -n "$c" ] && [ "$(cat /proc/$c/comm 2>/dev/null)" = node ]; then
    if [ "$c" != "$node" ]; then node=$c; echo "$(ts) step node PID $c" >> $P; fi
    if [ $stop != 0 ]; then echo "$(ts) under ${MIN_LEFT:-1500}s left: stopped at the step boundary (node $c, just started)" >> $P
      for g in $(ps -o pid= --ppid $c); do kill $g 2>/dev/null; done; kill $c 2>/dev/null; continue; fi
    g=$(ps -o pid= --ppid $c | tr -d ' ' | head -1)
    r=$(rss $c); [ -n "$g" ] && r=$(( r + $(rss $g) ))
    [ $r -gt $peak ] && peak=$r
    if [ -n "$g" ] && [ "$(cat /proc/$g/comm 2>/dev/null)" = python3 ]; then
      [ "$g" != "$py" ] && { py=$g; echo "$(ts) solve started (highs_native.py $g)" >> $P; }; t=$(ps -o etimes= -p $g 2>/dev/null | tr -d ' '); pyt=${t:-$pyt}; fi
  fi
done
wait $T; rc=$?
[ -n "$py" ] && echo "$(ts) solve (highs_native.py $py) ended after about ${pyt}s" >> $P
[ -n "$node" ] && echo "$(ts) node $node ended, peak memory $(awk -v k=$peak 'BEGIN{printf "%.1f", k/1048576}') GB" >> $P
echo "$(ts) key $R piece ends: two_stage.sh rc=$rc, $(ndone) of 15 steps done" >> $P
[ "$(ndone)" -ge 15 ] && echo "$(ts) key $R: all 15 steps have output" >> $P
exit 0
