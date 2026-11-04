#!/bin/bash
# Test 15, two stages (HANDOVER 'Message 691' (f), Brief A; design note version 2, 3.6 and 14.4; basis from message 693): one piece of
# pathway/two_stage.sh for one run, under the caller's 2-hour limit (CLAUDE.md 'Long runs'). From harness/:  bash pathway/test15.sh <run>
#   central      c7's settings with message 693's basis (REP_REF=metered, its REP_EXTREMES, WX_WINDCORR=1 with the six-constant table,
#                CONG_OFF=1), K=4 N=25 FIRST=2026, OUTDIR=out/ts2_central
#   ff           the central plus PACE=grid LI_CAP=4000 LI_EH=8 IA_TOTAL=5000 FOSSIL_END=2039, OUTDIR=out/ts2_ff
#   central_ann  the central plus ANNUITY_TO=2040 (the review's variant), OUTDIR=out/ts2_central_ann
#   central_yo   message 693 (5), one comparison: the central's step 2028 with LOOP_YEAR_ONLY=1 (the adequacy loop tests year 2028 only),
#                on a copy of out/ts2_central made after step 2027 (its step_2026.json and step_2027.json; two_stage.sh rebuilds fixed.json
#                from them), OUTDIR=out/ts2_central_yo; stops once step 2028 has output (LAST=2028)
# The first basis (REP_REF=2025 and its extremes, out/ts_*) stopped at step 2028 and is kept for the record, not continued (message 693 (1)).
# No WIN_FROM. MAXP is env_c6.sh's 6, which two_stage.sh passes on: the adequacy loop tests every year in the step's window, and a failing
# year adds its windows and the step solves again (message 693 (4), (5): kept, the conservative option under rule 366).
# Nothing here reads ESK19679 (message 693 (6)).
# Solver: parallel dual simplex on 2 threads (HIGHS_OPTS, highs_native.py; message 698 (c)), from the pieces launched after 13:45 UTC on
# 4 Nov 2026; the steps before ran HiGHS's default serial dual simplex. Each piece's first line in progress.txt records HIGHS_OPTS. The
# solver does not change the LP or its cache key.
# Pieces as chain_c7.sh's: each solve gets the time left less 15 minutes (pathway_perfail.js RESUME=1 JOB_DEADLINE, PIECE_S seconds from
# the start, default 6,600) and keeps a valid basis if it stops there; no new step starts with under MIN_LEFT seconds left (default
# 4,800; 2,700 before 12:38 UTC on 4 Nov 2026, when a step cut at the deadline kept no valid basis and lost 42 minutes): that step's node is stopped by its PID within seconds of starting and two_stage.sh exits, writing 'NO OUTPUT' for it after this script's
# 'stopped at the step boundary' line. Scheduling only: every LP and answer is two_stage.sh's. Writes to <OUTDIR>/progress.txt each step's
# node PID, each solve's wall time (the highs_native.py process, to the 15-second poll) and the step's peak memory (node and solver).
# Relaunch at each completion until progress.txt says 'test15 <run>: all 15 steps have output'.
cd "$(dirname "${BASH_SOURCE[0]}")/.." || exit 2
R=${1:?run: central, ff, central_ann or central_yo}
source pathway/env_c6a.sh
export GAS_FIRST=2035 SS=inertia SS_FC=reservecoal COC=blended BTM_STOCK=8 VPP=1 GY=1 COAL_FUEL_ESC=3 COAL_FOM_ESC=1.1 COMPLY=compromise \
  COAL_CARBON_FLOOR=1 SOLVER=native \
  REP_REF=metered REP_EXTREMES=20,161,162,163,187,188,194,195,196,214,218,358 WX_WINDCORR=1 WX_WINDCORR_TABLE=pathway/wx/wind_corr_table_calm6.json CONG_OFF=1
export K=4 N=25 FIRST=2026
export HIGHS_OPTS=${HIGHS_OPTS-'{"simplex_strategy": 2, "threads": 2}'}
case $R in
  central)     export OUTDIR=out/ts2_central ;;
  ff)          export PACE=grid LI_CAP=4000 LI_EH=8 IA_TOTAL=5000 FOSSIL_END=2039 OUTDIR=out/ts2_ff ;;
  central_ann) export ANNUITY_TO=2040 OUTDIR=out/ts2_central_ann ;;
  central_yo)  export LOOP_YEAR_ONLY=1 OUTDIR=out/ts2_central_yo LAST=2028
               if [ ! -s out/ts2_central_yo/step_2027.json ]; then for y in 2026 2027; do [ -s out/ts2_central/step_$y.json ] || { echo "central_yo: out/ts2_central has no step $y yet" >&2; exit 2; }; done
                 mkdir -p out/ts2_central_yo; for y in 2026 2027; do cp out/ts2_central/step_$y.json out/ts2_central/step_$y.log out/ts2_central_yo/; done
                 echo "$(date -u +%FT%H:%M:%SZ) copied step_2026.json and step_2027.json from out/ts2_central (message 693 (5)); fixed.json rebuilt by two_stage.sh" >> out/ts2_central_yo/progress.txt; fi ;;
  *) echo "run must be central, ff, central_ann or central_yo" >&2; exit 2 ;;
esac
O=$OUTDIR; P=$O/progress.txt; mkdir -p $O
ts(){ date -u +%FT%H:%M:%SZ; }
ndone(){ ls $O/step_20[0-9][0-9].json 2>/dev/null | wc -l; }
steps(){ grep -c 'rc=[0-9]* done$' $P; }
rss(){ local v; v=$(ps -o rss= -p $1 2>/dev/null | tr -d ' '); echo ${v:-0}; }
if [ "$(ndone)" -ge 15 ]; then echo "$(ts) test15 $R: all 15 steps have output" >> $P; exit 0; fi
if [ -n "$LAST" ] && [ -s $O/step_$LAST.json ]; then echo "$(ts) test15 $R: step $LAST has output, the last this run takes" >> $P; exit 0; fi
export RESUME=1 JOB_DEADLINE=$(( $(date +%s) + ${PIECE_S:-6600} ))
echo "$(ts) test15 $R piece, PID $$, on $(git log --oneline -1 | cut -c1-50), $(grep -o "BUILD_STAMP = .[0-9a-z-]*" ../index.html), deadline $(date -u -d @$JOB_DEADLINE +%H:%MZ), MIN_LEFT ${MIN_LEFT:-4800}s, HIGHS_OPTS ${HIGHS_OPTS:-none}, disk free $(df -BG / | awk 'NR==2{print $4}'), memory free $(free -g | awk '/Mem/{print $7}')G" >> $P
bash pathway/two_stage.sh & T=$!
echo "$(ts) two_stage.sh PID $T" >> $P
nd=$(steps); stop=0; node=""; peak=0; py=""; pyt=0
while kill -0 $T 2>/dev/null; do
  sleep 15
  n=$(steps)
  if [ $n -gt $nd ]; then nd=$n; left=$(( JOB_DEADLINE - $(date +%s) )); [ $left -lt ${MIN_LEFT:-4800} ] && stop=1; [ -n "$LAST" ] && [ -s $O/step_$LAST.json ] && stop=2; fi
  c=$(ps -o pid= --ppid $T 2>/dev/null | tr -d ' ' | head -1)
  if [ -n "$py" ] && ! kill -0 $py 2>/dev/null; then echo "$(ts) solve (highs_native.py $py) ended after about ${pyt}s" >> $P; py=""; pyt=0; fi
  if [ -n "$node" ] && [ "$c" != "$node" ]; then echo "$(ts) node $node ended, peak memory $(awk -v k=$peak 'BEGIN{printf "%.1f", k/1048576}') GB" >> $P; node=""; peak=0; fi
  if [ -n "$c" ] && [ "$(cat /proc/$c/comm 2>/dev/null)" = node ]; then
    if [ "$c" != "$node" ]; then node=$c; echo "$(ts) step node PID $c" >> $P; fi
    if [ $stop != 0 ]; then echo "$(ts) $([ $stop = 2 ] && echo "step $LAST done, the last this run takes" || echo "under ${MIN_LEFT:-4800}s left"): stopped at the step boundary (node $c, just started)" >> $P
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
echo "$(ts) test15 $R piece ends: two_stage.sh rc=$rc, $(ndone) of 15 steps done" >> $P
[ "$(ndone)" -ge 15 ] && echo "$(ts) test15 $R: all 15 steps have output" >> $P
[ -n "$LAST" ] && [ -s $O/step_$LAST.json ] && echo "$(ts) test15 $R: step $LAST has output, the last this run takes" >> $P
exit 0
