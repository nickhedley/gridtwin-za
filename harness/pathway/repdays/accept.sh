#!/bin/bash
# Acceptance tests on the fixed data (message 689 (5); design note version 2, section 6; 683 (a), 684 (e)): single-year 2040 LPs for the
# central (fixed from c7) and Fossil-free (fixed from s_ff2040_c7, its own settings), on two references, each named with its wind series:
#   corr5  corrected modelled 2025 (REP_REF=2025, WX_WINDCORR=1: the five-constant table in nodal/wind_corr_table.json), provisional
#   met    metered 2025 (REP_REF=metered), the modelled years (tail, stress windows, twelve-year means) uncorrected (stored, fixed)
# Jobs in priority order: the free-fleet benchmark (test 16, 365 days); the 365-day benchmarks (test 1); test 1's variants (a)-(e) at 25
# days; test 6's counts (18, 30, 55, 105). Each job: the LP dumped by pathway_perfail.js (MAXP=1, DUMP_STOP), solved by highs_native.py
# (simplex). Resumable: a job with a solution is skipped. Pieces: stops starting jobs with under 25 minutes left (PIECE_S, default 6,600).
# The extreme days: EXT_CORR and EXT_MET (comma lists from extremes.py on the fixed data; message 684 (i)), else FIXED's.
#   bash pathway/repdays/accept.sh <outdir>      (from harness/)
H=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd); O=${1:-$H/out/accept}; mkdir -p $O; cd $H
P=$O/progress.txt; DEADLINE=$(( $(date +%s) + ${PIECE_S:-6600} )); left(){ echo $(( DEADLINE - $(date +%s) )); }
echo "$(date -u +%FT%H:%MZ) accept.sh piece, shell PID $$, $(git log --oneline -1 | cut -c1-40)" >> $P
source pathway/env_c6a.sh; export GAS_FIRST=2035
C7="SS=inertia SS_FC=reservecoal COC=blended BTM_STOCK=8 VPP=1 GY=1 COAL_FUEL_ESC=3 COAL_FOM_ESC=1.1 COMPLY=compromise COAL_CARBON_FLOOR=1"
FFX="SOLVER=native PACE=grid LI_CAP=4000 LI_EH=8 IA_TOTAL=5000 FOSSIL_END=2039"
C=/home/user/gridtwin-za/harness/pathway/c7
REFcorr5="REP_REF=2025 WX_WINDCORR=1${EXT_CORR:+ REP_EXTREMES=$EXT_CORR}"; REFmet="REP_REF=metered${EXT_MET:+ REP_EXTREMES=$EXT_MET}"
FIXcentral="FIX_FROM=$C/pathway_c7.json FIX_TO=2039"; FIXff="FIX_FROM=$C/pathway_s_ff2040_c7.json FIX_TO=2039 $FFX"
CL365="REP_WEIGHTS=clustered REP_DAYS=365 STORAGE_LINK=1"
job(){ local n=$1; shift; local envs="$*"
  [ -s $O/${n}_sol.json ] && return 0
  if [ "$(left)" -lt 1500 ]; then echo "$(date -u +%H:%M) $n left to the next piece" >> $P; return 1; fi
  if [ ! -s $O/${n}_pass1.lp ]; then
    echo "$(date -u +%FT%H:%MZ) $n dump ($envs)" >> $P
    eval "env $C7 $envs OPER_FROM=2040 HORIZON=2040 MAXP=1 DUMP=0 DUMP_LP=$O/$n DUMP_STOP=1 LPCACHE=$O/lpc_$n OUT=$O/$n.json TL=7200 nice -n 5 node --max-old-space-size=10240 pathway/pathway_perfail.js" > $O/$n.log 2>&1
    grep -h "dumped LP" $O/$n.log | tail -1 | sed "s/^/  $n /" >> $P
    [ -s $O/${n}_pass1.lp ] || { echo "  $n: no LP written (see $n.log)" >> $P; return 0; }
  fi
  local tl=$(( $(left) - 600 )); [ $tl -gt 7000 ] && tl=7000
  HIGHS_SOLVER=simplex nice -n 5 python3 highs_native.py $O/${n}_pass1.lp $O/${n}_sol.json $tl > $O/${n}_solve.log 2>&1 &
  local p=$!; echo "$(date -u +%FT%H:%MZ) $n solve pid $p, limit $tl s" >> $P; wait $p
  echo "$(date -u +%FT%H:%MZ) $n rc $? $(python3 -c "import json;S=json.load(open('$O/${n}_sol.json'));print(S.get('Status'),S.get('ObjectiveValue'))" 2>/dev/null)" >> $P
  python3 -c "import json;S=json.load(open('$O/${n}_sol.json'));exit(0 if S.get('Status')=='Optimal' else 1)" 2>/dev/null || { rm -f $O/${n}_sol.json; echo "  $n not optimal; the next piece retries" >> $P; }
  return 0; }
# 1. Free-fleet benchmark (test 16): no fleet fixed, limits lifted (LIFT=all), the central's demand and Fossil-free's rules, 365 days.
job ff_free_corr5_d365 "$FFX LIFT=all $REFcorr5 $CL365" || exit 0
# 2. The 365-day benchmarks (test 1).
for r in central ff; do for ref in corr5 met; do eval "fx=\$FIX$r; rf=\$REF$ref"; job ${r}_${ref}_d365 "$fx $rf $CL365" || exit 0; done; done
# 3. Test 1's variants at 25 days: (a) now (the 12 matched days, block chain); (b) clustered, block chain; (c) linking, equal weights;
#    (d) both; (e) both with the stress windows linked.
for r in central ff; do for ref in corr5 met; do eval "fx=\$FIX$r; rf=\$REF$ref"
  job ${r}_${ref}_a "$fx $rf" || exit 0
  job ${r}_${ref}_b_d25 "$fx $rf REP_WEIGHTS=clustered REP_DAYS=25 STORAGE_LINK=0" || exit 0
  job ${r}_${ref}_c_d25 "$fx $rf REP_WEIGHTS=equal REP_DAYS=25 STORAGE_LINK=1" || exit 0
  job ${r}_${ref}_d_d25 "$fx $rf REP_WEIGHTS=clustered REP_DAYS=25 STORAGE_LINK=1" || exit 0
  job ${r}_${ref}_e_d25 "$fx $rf REP_WEIGHTS=clustered REP_DAYS=25 STORAGE_LINK=1 WINDOW_LINK=1" || exit 0
done; done
# 4. Test 6's counts, both settings on.
for n in 18 30 55 105; do for r in central ff; do for ref in corr5 met; do eval "fx=\$FIX$r; rf=\$REF$ref"
  job ${r}_${ref}_d_d$n "$fx $rf REP_WEIGHTS=clustered REP_DAYS=$n STORAGE_LINK=1" || exit 0; done; done; done
# 5. The free fleet at 25 days, against its 365-day benchmark.
job ff_free_corr5_d25 "$FFX LIFT=all $REFcorr5 REP_WEIGHTS=clustered REP_DAYS=25 STORAGE_LINK=1" || exit 0
echo "$(date -u +%FT%H:%MZ) accept.sh: all jobs done" >> $P
