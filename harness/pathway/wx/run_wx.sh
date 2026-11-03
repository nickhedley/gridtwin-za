#!/bin/bash
# 683 (c): the engine check (pathcheck.js, adaptive draws, as the recorded checks) on c7's central (2026, 2030, 2035, 2040) and
# Fossil-free on c7's settings (2040), on three weather references: WEATHER=metered, WEATHER=2025 and the twelve modelled years (unset).
# The corrected modelled series is added when its settings exist (WX_FIX, after message 683 (b) is measured). One check at a time.
# Resumable: an output that exists is skipped. From anywhere: bash harness/pathway/wx/run_wx.sh <outdir>
H=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd); O=${1:-$H/out/wx683}; mkdir -p $O; cd $H
C=/home/user/gridtwin-za/harness/pathway/c7
echo "$(date -u +%FT%H:%MZ) run_wx, shell PID $$, $(git log --oneline -1 | cut -c1-50)" >> $O/progress.txt
node -e "require('child_process').execSync('node pathway/wx/eskom2025.js $O/eskom2025.json 10', {stdio:'inherit', env:{...process.env, NODE_PATH:'node_modules'}})" > $O/eskom2025.log 2>&1
echo "$(date -u +%FT%H:%MZ) eskom2025 rc $?" >> $O/progress.txt
for spec in "c7 $C/pathway_c7.json 2026,2030,2035,2040" "ff $C/pathway_s_ff2040_c7.json 2040"; do set -- $spec
  for wx in metered 2025 modelled; do n=$1_$wx; [ -s $O/$n.json ] && continue
    env -i PATH="$PATH" HOME="$HOME" LNG=1 GRID=1 SS_FC=reservecoal YEARS=$3 IN=$2 OUTC=$O/$n.json $([ $wx != modelled ] && echo WEATHER=$wx) nice -n 5 node --max-old-space-size=4096 pathcheck.js > $O/$n.log 2>&1 &
    p=$!; echo "$(date -u +%FT%H:%MZ) $n pid $p" >> $O/progress.txt; wait $p; echo "$(date -u +%FT%H:%MZ) $n rc $?" >> $O/progress.txt
  done; done
# The single-weather-year references again at 40 draws each (K=40), for a tail on as many runs as the adaptive rule gives the twelve years
# their first batches; the adaptive runs above stop at 10 draws when the mean is far under the target.
for spec in "c7 $C/pathway_c7.json 2026,2030,2035,2040" "ff $C/pathway_s_ff2040_c7.json 2040"; do set -- $spec
  for wx in metered 2025; do n=$1_${wx}_k40; [ -s $O/$n.json ] && continue
    env -i PATH="$PATH" HOME="$HOME" LNG=1 GRID=1 SS_FC=reservecoal YEARS=$3 IN=$2 OUTC=$O/$n.json WEATHER=$wx K=40 nice -n 5 node --max-old-space-size=4096 pathcheck.js > $O/$n.log 2>&1 &
    p=$!; echo "$(date -u +%FT%H:%MZ) $n pid $p" >> $O/progress.txt; wait $p; echo "$(date -u +%FT%H:%MZ) $n rc $?" >> $O/progress.txt
  done; done
# Metered with new tracking solar at its twelve-year level (WEATHER=metered_trk12; the plain metered profile's tracking twin applies the
# tracker gain twice), adaptive and at 40 draws.
for spec in "c7 $C/pathway_c7.json 2026,2030,2035,2040" "ff $C/pathway_s_ff2040_c7.json 2040"; do set -- $spec
  for kk in "" 40; do n=$1_metered_trk12${kk:+_k$kk}; [ -s $O/$n.json ] && continue
    env -i PATH="$PATH" HOME="$HOME" LNG=1 GRID=1 SS_FC=reservecoal YEARS=$3 IN=$2 OUTC=$O/$n.json WEATHER=metered_trk12 ${kk:+K=$kk} nice -n 5 node --max-old-space-size=4096 pathcheck.js > $O/$n.log 2>&1 &
    p=$!; echo "$(date -u +%FT%H:%MZ) $n pid $p" >> $O/progress.txt; wait $p; echo "$(date -u +%FT%H:%MZ) $n rc $?" >> $O/progress.txt
  done; done
