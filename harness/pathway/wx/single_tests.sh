#!/bin/bash
# Single-year tests on the fixed data (tests only; no default changes): c7's central, every build to y-1 fixed at c7's, year y's
# builds optimised (OPER_FROM=y HORIZON=y FIX_FROM=pathway_c7.json FIX_TO=y-1, pass 1, native HiGHS simplex), then the engine
# (pathcheck.js, YEARS=y) on c7's fleet with year y's builds replaced by the LP's, under the same test setting.
#   690: congestion curtailment in 2030 and 2035: a none (CONG_OFF=1); b the flat 1.3%, as now; c the same energy shaped by
#        technology (CONG_SHAPE=tech); d none, with pumped storage's pumping from a surplus at 09:00-16:59 capped at 469 MW
#        (CONG_OFF=1 PS_DAY_CAP=469, the rule that closes most of the 2026 gap; RESULTS, message 690 part 1).
#   688 (a): the coal practice floor in 2027, 2028 and 2029: as now (to 2029) and ended before year y (COAL_MSL_DESIGN_FROM=y).
# Resumable: a finished step is skipped. ONLY=<job name> runs that job alone (a smoke test). From harness/: bash pathway/wx/single_tests.sh <outdir>; then
#   python3 -I pathway/wx/single_an.py <outdir>
H=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd); O=${1:-$H/out/single}; mkdir -p $O; cd $H; P=$O/progress.txt
echo "$(date -u +%FT%H:%MZ) single_tests.sh, shell PID $$, $(git log --oneline -1 | cut -c1-40)" >> $P
source pathway/env_c6a.sh; export GAS_FIRST=2035
C7="SS=inertia SS_FC=reservecoal COC=blended BTM_STOCK=8 VPP=1 GY=1 COAL_FUEL_ESC=3 COAL_FOM_ESC=1.1 COMPLY=compromise COAL_CARBON_FLOOR=1"
F=/home/user/gridtwin-za/harness/pathway/c7/pathway_c7.json
job(){ local n=$1 y=$2; shift 2; local envs="$*"
  [ -n "${ONLY:-}" ] && [ "$ONLY" != "$n" ] && return 0
  if [ ! -s $O/${n}_sol.json ]; then
    echo "$(date -u +%FT%H:%MZ) $n dump ($envs)" >> $P
    eval "env $C7 $envs OPER_FROM=$y FIX_FROM=$F FIX_TO=$((y-1)) HORIZON=$y MAXP=1 DUMP=0 DUMP_LP=$O/$n DUMP_STOP=1 LPCACHE=$O/lpc_$n OUT=$O/$n.json TL=3000 nice -n 5 node --max-old-space-size=4096 pathway/pathway_perfail.js" > $O/$n.log 2>&1
    grep -h "dumped LP\|rror" $O/$n.log | head -2 | sed "s/^/  $n /" >> $P
    HIGHS_SOLVER=simplex nice -n 5 python3 highs_native.py $O/${n}_pass1.lp $O/${n}_sol.json 3000 > $O/${n}_solve.log 2>&1
    echo "$(date -u +%FT%H:%MZ) $n LP rc $? $(python3 -c "import json;S=json.load(open('$O/${n}_sol.json'));print(S.get('Status'),S.get('ObjectiveValue'))" 2>/dev/null)" >> $P
  fi
  [ -s $O/${n}_sol.json ] || return 0
  if [ ! -s $O/${n}_eng.json ]; then
    python3 -I - $F $O/${n}_sol.json $y $O/${n}_fleet.json >> $P 2>&1 <<'PY'
import json, re, sys
F, S, y, out = sys.argv[1], sys.argv[2], int(sys.argv[3]), sys.argv[4]
d = json.load(open(F)); cols = json.load(open(S))['Columns']
rx = re.compile(r'^(b_[a-z]+|eb_batt|rc|cc_[a-z]+)_%d$' % y); n = 0; kept = []
for k in list(d['build']):
    if rx.match(k):
        if k in cols: d['build'][k] = cols[k]['Primal']; n += 1
        else: kept.append(k)
d['singleYearFrom'] = {'lp': S, 'year': y, 'replaced': n, 'keptFromC7': kept}
json.dump(d, open(out, 'w')); print('  fleet', out, 'year', y, 'builds replaced', n, 'kept', kept)
PY
    eval "env -i PATH=\"$PATH\" HOME=\"$HOME\" LNG=1 GRID=1 SS_FC=reservecoal YEARS=$y IN=$O/${n}_fleet.json OUTC=$O/${n}_eng.json $envs nice -n 5 node --max-old-space-size=4096 pathcheck.js" > $O/${n}_eng.log 2>&1
    echo "$(date -u +%FT%H:%MZ) $n engine rc $?" >> $P
  fi; }
for y in 2030 2035; do
  job c690_a_$y $y "CONG_OFF=1"
  job c690_b_$y $y ""
  job c690_c_$y $y "CONG_SHAPE=tech"
  job c690_d_$y $y "CONG_OFF=1 PS_DAY_CAP=469"
done
for y in 2027 2028 2029; do
  job floor_now_$y $y ""
  job floor_end_$y $y "COAL_MSL_DESIGN_FROM=$y"
done
echo "$(date -u +%FT%H:%MZ) single_tests.sh done" >> $P
