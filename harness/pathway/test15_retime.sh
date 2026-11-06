#!/bin/bash
# Test 15 on claude/twin-retime (message 724 (a)): the two-stage central (pathway/two_stage.sh, K=4 N=25 FIRST=2026, year y of each step on
# 365 days) on the main session's fin pass settings, one piece under the caller's 2-hour limit. Usage: bash pathway/test15_retime.sh central
# Code: the worktree WT (default /home/user/gtza-retime), claude/twin-retime at build 2026-11-05j (dea3623), index.html unchanged; harness
# change only: 5b98fd3's basis-file fix applied to pathway_perfail.js (each solve's basis under its own LP key), uncommitted there and
# recorded on this branch (pathway/test15/retime/harness.patch).
# Settings, read from the branches, not retyped (724 (a)), snapshot once to <OUTDIR>/settings.env so every piece runs the same:
#   - run (6)'s settings as claude/c7-runs records them for the pass with every change (harness/pathway/final/README.md, the row of
#     pathway_every_change_05f.json; the fin pass is that pass plus coal's part-load factor and the verdict rule, message 713): every
#     KEY=VALUE in the row, with env_c6a.sh (named in the row) sourced first from the worktree, so the verdict rule (VERDICT_TOPUP,
#     env_c6.sh) is in; coal's part-load (FIXED.bldCoalPartLoad) and the curtailment price 0 (FIXED.lpCurtailCostR) are the build's
#     defaults. c7's settings in the row are checked against chain_c7.sh's C7 line. The old extreme-day list is the row's REP_EXTREMES.
#   - the row's solver words, 'parallel dual simplex, presolve off', as HIGHS_OPTS {"simplex_strategy": 2, "threads": 2, "presolve":
#     "off"} (2 threads as run (6)); SOLVER=native. Presolve off lets a solve stopped at a piece's deadline keep a valid basis and resume.
#   - two stages' own: the row's MAXP=1 (a single pass) is not taken: each step loops to the standard with env_c6.sh's MAXP=6, as test 15
#     ran (message 693 (4), (5)); REP_DAYS, REP_WEIGHTS, STORAGE_LINK and STRESS_TARGET are set by two_stage.sh (N=25, clustered, 1, 1).
# Pieces as test15.sh's: each solve gets the time left less 15 minutes (RESUME=1 JOB_DEADLINE, PIECE_S, default 6,600 s) and keeps its
# basis if it stops there; no new step starts with under MIN_LEFT seconds left (default 1,500: a cut solve now resumes). Progress, PIDs,
# solve wall times and peak memory in <OUTDIR>/progress.txt. Relaunch at each completion until it says all 15 steps have output.
R=${1:?run: central}
WT=${WT:-/home/user/gtza-retime}
case $R in
  central) OUTDIR=$WT/harness/out/tsr_central ;;
  *) echo "run must be central" >&2; exit 2 ;;
esac
cd $WT/harness || exit 2
O=$OUTDIR; P=$O/progress.txt; S=$O/settings.env; mkdir -p $O
ts(){ date -u +%FT%H:%M:%SZ; }
if [ ! -s $S ]; then
  REF=$(git rev-parse --short origin/claude/c7-runs)
  ROW=$(git show origin/claude/c7-runs:harness/pathway/final/README.md | grep '^| pathway_every_change_05f.json ')
  [ -n "$ROW" ] || { echo "$(ts) settings: the every-change row not found on claude/c7-runs $REF" >> $P; exit 2; }
  KV=$(echo "$ROW" | grep -oE '\b[A-Z][A-Z0-9_]*=[^ )|]+' | sed 's/,$//' | grep -vE '^(MAXP|REP_DAYS|REP_WEIGHTS|STORAGE_LINK)=')
  C7=$(sed -n 's/^C7="\(.*\)"$/\1/p' pathway/chain_c7.sh)
  for kv in $C7; do echo "$KV" | grep -qx -- "$kv" || { echo "$(ts) settings: c7's $kv (chain_c7.sh) not in the row" >> $P; exit 2; }; done
  echo "$ROW" | grep -q 'env_c6a.sh' && echo "$ROW" | grep -q 'parallel dual simplex, presolve off' || { echo "$(ts) settings: row lacks env_c6a.sh or the solver words" >> $P; exit 2; }
  { echo "# Read $(ts) from claude/c7-runs $REF harness/pathway/final/README.md (row pathway_every_change_05f.json) and the worktree $(git rev-parse --short HEAD)"
    echo "source pathway/env_c6a.sh"
    echo "export $(echo $KV)"
    echo "export SOLVER=native HIGHS_OPTS='{\"simplex_strategy\": 2, \"threads\": 2, \"presolve\": \"off\"}'"
    echo "export K=4 N=25 FIRST=2026 OUTDIR=$O"; } > $S
  echo "$(ts) settings snapshot written: $S" >> $P
fi
source $S
ndone(){ ls $O/step_20[0-9][0-9].json 2>/dev/null | wc -l; }
steps(){ grep -c 'rc=[0-9]* done$' $P; }
rss(){ local v; v=$(ps -o rss= -p $1 2>/dev/null | tr -d ' '); echo ${v:-0}; }
if [ "$(ndone)" -ge 15 ]; then echo "$(ts) retime $R: all 15 steps have output" >> $P; exit 0; fi
export RESUME=1 JOB_DEADLINE=$(( $(date +%s) + ${PIECE_S:-6600} ))
echo "$(ts) retime $R piece, PID $$, on $(git log --oneline -1 | cut -c1-40) + $(git diff --stat | tail -1 | sed 's/^ *//'), $(grep -o "BUILD_STAMP = .[0-9a-z-]*" ../index.html), deadline $(date -u -d @$JOB_DEADLINE +%H:%MZ), MIN_LEFT ${MIN_LEFT:-1500}s, MAXP $MAXP, WARM ${WARM:-0}, VERDICT_TOPUP $VERDICT_TOPUP, HIGHS_OPTS $HIGHS_OPTS, disk free $(df -BG / | awk 'NR==2{print $4}'), memory free $(free -g | awk '/Mem/{print $7}')G" >> $P
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
echo "$(ts) retime $R piece ends: two_stage.sh rc=$rc, $(ndone) of 15 steps done" >> $P
[ "$(ndone)" -ge 15 ] && echo "$(ts) retime $R: all 15 steps have output" >> $P
exit 0
