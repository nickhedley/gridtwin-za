#!/bin/bash
# 667 (e): the engine check of a run with the storage look-ahead shortened (pathcheck.js LA_H, LDES_LA_H): "day" 24 h for both tiers
# (a day-ahead window, still a perfect forecast within it), "none" 0 h for the short stores and 1 h for the long (the rules before the
# look-aheads). Same seeds, weather years and settings as the chain's checks. Resumable. Usage: bash pathway/larun.sh <run name>
cd "$(dirname "$0")/.."; D=out/c7/la; mkdir -p $D; P=out/c7/progress.txt; B=$1
for v in "day 24 24" "none 0 1"; do set -- $v; n=${B}_la$1; la=$2; lda=$3
  echo "$(date -u +%H:%M) la start $n (LA_H=$la LDES_LA_H=$lda)" >> $P
  for g in "a 2026,2027,2028,2029,2030" "b 2031,2032,2033,2034,2035" "c 2036,2037,2038,2039,2040"; do set -- $g
    [ -s $D/pathcheck_${n}_$1.json ] && continue
    env -i PATH="$PATH" HOME="$HOME" LNG=1 GRID=1 SS_FC=reservecoal LA_H=$la LDES_LA_H=$lda YEARS=$2 IN=out/pathway_$B.json OUTC=$D/pathcheck_${n}_$1.json nice -n 10 node --max-old-space-size=4096 pathcheck.js > $D/pathcheck_${n}_$1.log 2>&1 &
    [ -n "$PIDLOG" ] && echo "$(date -u +%FT%H:%MZ) la $n group $1 pid $!" >> $PIDLOG
  done; wait
  echo "$(date -u +%H:%M) la end $n $(node pathway/cutsumm.js $D/pathcheck_$n | cut -c1-220)" >> $P
done
