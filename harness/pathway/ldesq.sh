#!/bin/bash
# 665 (b), (c): for each run that builds long-duration storage, dump its final-pass LP, solve it, split every storage build column's
# value by row family (decompcol.py), then delete the LP and solution (disk). Resumable: a run with its decomposition is skipped.
SP=${LDES_SP:-$(cd "$(dirname "$0")" && pwd)}; L=${LDES_DIR:-$SP/ldes}
M_EAF="2027:66,2028:67,2029:68,2030:69,2031:70,2032:70,2033:70,2034:70,2035:70,2036:70,2037:70,2038:70,2039:70,2040:70"
M_RE="2033:375/325/50,2034:375/325/50,2035:375/325/50,2036:375/325/50"
run(){ local n=$1 extra=$2 k=$3
  [ -s $L/${n}_store_decomp.json ] && return 0
  [ "$(df --output=avail -B1G /home/user | tail -1 | tr -d ' ')" -ge 5 ] || { echo "$(date -u +%H:%M) $n not run: under 5 GB free" >> $L/progress.txt; return 1; }
  LDES_DIR=$L bash $SP/ldesdump.sh $n "$extra" $k
  if [ -s $L/${n}_sol.json ]; then python3 -I $SP/decompcol.py $L/${n}_pass$k.lp $L/${n}_sol.json '(e?b_batt|b_vrfb|b_ironair|b_phes|b_phel)_20[0-9]{2}' $L/${n}_store_decomp.json >> $L/$n.log 2>&1
    rm -f $L/${n}_pass$k.lp $L/${n}_sol.json; rm -rf $L/lpc_$n; echo "$(date -u +%H:%M) $n decomposed" >> $L/progress.txt; fi; }
run s_ff2040novrfb_c7 "SOLVER=native PACE=grid LI_CAP=4000 LI_EH=8 IA_TOTAL=5000 FOSSIL_END=2039 VRFB_OFF=1" 1
run s_be6_c7 "STOR_CUM=2026:144,2027:294,2028:909,2029:3524,2030:3724,2031:3924,2032:4124,2033:4324,2034:4524,2035:4724,2036:5224,2037:5724,2038:6224,2039:6724,2040:7224" 1
run s_nogas_dsl_c7 "GAS_CAP=0 OCGD=1" 1
run s_gfm1891_c7 "GFM_H=thermal" 1
run s_mtsao_hi_nogas_c7 "DEMAND=rate:3.30 GAS_CAP=0 OCGD=1" 1
run s_mtsao_ref_nogas_c7 "DEMAND=rate:3.30 COAL_EAF_PATH=$M_EAF AVDED_OFF_AFTER=2030 REIPPP_RETIRE=$M_RE GAS_CAP=0 OCGD=1" 1
run s_irpgas_c7 "GAS_FIRST=2032 GAS_FORCE=2029:3000,2030:3000 GAS_MIN=2032-2034:1250,2035:1000,2036:1250,2037:1500,2038-2040:1250 GAS_LIFT=1 GASFLOOR=1 GASFLOOR_VINT=2029-2030 TCAP_YR=2029:4000,2030:4000" 1
export HS=ipm; run s_nogas_c7 "GAS_CAP=0 OCGD=0 HIGHS_SOLVER=ipm" 3
