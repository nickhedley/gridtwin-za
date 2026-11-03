#!/bin/bash
# Two stages, stage 2 (design note version 2, 3.6 and test 15; messages 677 (b), 679 (b)): from <first> to 2040, year y on all 365 days and
# the k look-ahead years at the run's day count, the builds before y fixed from the earlier steps, year y's and the look-ahead years' builds
# free within their limits; then year y's builds and retirements are fixed and the window moves on. Annuities within each step's window
# (the LP's own horizon), or to 2040 with ANNUITY_TO=2040 (the review's variant). No stage-1 floors: stage 1 supplies the stress windows
# only (WIN_FROM, its <run>_lp2040.json). Resumable: a step with its output is skipped. From harness/, with the run's settings exported:
#   K=4 N=30 FIRST=2026 WIN_FROM=<stage 1 lp2040.json> OUTDIR=<dir> bash pathway/two_stage.sh
# Writes <OUTDIR>/step_<y>.json (each step's pathway output) and <OUTDIR>/fixed.json (the builds fixed so far).
K=${K:-4}; N=${N:-30}; FIRST=${FIRST:-2026}; O=${OUTDIR:?OUTDIR}; mkdir -p $O; [ -s $O/fixed.json ] || echo '{"build":{}}' > $O/fixed.json
echo "$(date -u +%FT%H:%MZ) two_stage K=$K N=$N FIRST=$FIRST, shell PID $$" >> $O/progress.txt
for y in $(seq $FIRST 2040); do
  h=$(( y + K > 2040 ? 2040 : y + K )); out=$O/step_$y.json
  if [ ! -s $out ]; then
    fix=""; [ $y -gt 2026 ] && fix="FIX_FROM=$O/fixed.json FIX_TO=$((y - 1))"
    env $fix OPER_FROM=$y HORIZON=$h STAGE2_YEAR=$y REP_DAYS=$N REP_WEIGHTS=clustered STORAGE_LINK=1 STRESS_TARGET=1 MAXP=${MAXP:-1} \
      LPCACHE=$O/lpc OUT=$out nice -n 5 node --max-old-space-size=12288 pathway/pathway_perfail.js > $O/step_$y.log 2>&1
    echo "$(date -u +%FT%H:%MZ) step $y (horizon $h) rc=$? $([ -s $out ] && echo done || echo 'NO OUTPUT')" >> $O/progress.txt
    [ -s $out ] || exit 1
  fi
  python3 -I - $out $O/fixed.json $y <<'PY'
import json, re, sys
out, fx, y = sys.argv[1], sys.argv[2], sys.argv[3]
b = json.load(open(out))['build']; F = json.load(open(fx))
F['build'].update({n: v for n, v in b.items() if re.search(r'_' + y + '$', n)})
json.dump(F, open(fx, 'w'))
PY
done
