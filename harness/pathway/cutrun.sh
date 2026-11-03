#!/bin/bash
# Proportional build-cut test, engine check only (user, 3 Nov 2026, message 666 (a)-(d)). For each "base group [CO2MAX]" job:
# cut the base run's new builds by 5%, 10%, 15% ... (pathway/cuttest.py), engine-check each copy as the chain does (LNG=1 GRID=1
# SS_FC=reservecoal, groups a/b/c, the fixed seeds), summarise (pathway/cutsumm.js) into out/c7/cut/summary.jsonl, and stop the job at
# the first step that fails (reliability standard, open-cycle 6%, inertia floor, and CO2MAX for Deep). Resumable: steps already in
# the summary are skipped. Usage: bash pathway/cutrun.sh "s_ff2040novrfb_c7 all" "c7 re" "s_deep40nogas_c7 all 40.5" ...
cd "$(dirname "$0")/.."; D=out/c7/cut; mkdir -p $D; P=out/c7/progress.txt; MAXCUT=${MAXCUT:-60}
for job in "$@"; do set -- $job; B=$1; G=$2; CM=${3:-}
  for pct in $(seq 5 5 $MAXCUT); do n=${B}_${G}${pct}
    if [ -s $D/summary.jsonl ] && grep -q "\"pre\":\"$D/pathcheck_$n\"" $D/summary.jsonl; then
      grep "\"pre\":\"$D/pathcheck_$n\"" $D/summary.jsonl | grep -q '"pass":false' && break; continue; fi
    if [ "$(df --output=avail -B1G /home/user | tail -1 | tr -d ' ')" -lt 5 ]; then echo "$(date -u +%H:%M) cut $n not run: under 5 GB free" >> $P; exit 1; fi
    python3 -I pathway/cuttest.py out/pathway_$B.json $G $pct $D/pathway_$n.json || exit 1
    echo "$(date -u +%H:%M) cut start $n" >> $P
    for g in "a 2026,2027,2028,2029,2030" "b 2031,2032,2033,2034,2035" "c 2036,2037,2038,2039,2040"; do set -- $g
      [ -s $D/pathcheck_${n}_$1.json ] && continue
      env -i PATH="$PATH" HOME="$HOME" LNG=1 GRID=1 SS_FC=reservecoal YEARS=$2 IN=$D/pathway_$n.json OUTC=$D/pathcheck_${n}_$1.json nice -n 10 node --max-old-space-size=4096 pathcheck.js > $D/pathcheck_${n}_$1.log 2>&1 &
      [ -n "$PIDLOG" ] && echo "$(date -u +%FT%H:%MZ) cut $n group $1 pid $!" >> $PIDLOG
    done; wait
    s=$(CO2MAX=$CM node pathway/cutsumm.js $D/pathcheck_$n)
    if echo "$s" | grep -q '"missing"'; then echo "$(date -u +%H:%M) cut $n INCOMPLETE" >> $P; exit 1; fi
    echo "$s" >> $D/summary.jsonl; echo "$(date -u +%H:%M) cut end $n $(echo "$s" | cut -c1-200)" >> $P
    echo "$s" | grep -q '"pass":false' && break
  done
done
