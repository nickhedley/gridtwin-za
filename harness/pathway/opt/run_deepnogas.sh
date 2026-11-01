#!/bin/bash
# Message 580 (d): Deep decarbonisation 2035 with no new gas: s_hypo_deep2035r_c6e's settings (the same caps, CO2CAP_YEARS included, grid pace, 5 GW iron-air cap, elastic at R50,000/t) plus the no-gas plan's GAS_CAP=0 OCGD=1 (new diesel peakers allowed as backup; their CO2 counts against the cap rows, gd_). Run once.
# each year's cap tightened by its gap (CO2CAP_YEARS), still elastic at R50,000/t. Run once.
# Message 555: Deep decarbonisation 2035, hypothetical: CO2 at most 22.809 Mt a year from 2035 (elastic). c6e's settings (env_c6a.sh, GAS_FIRST=2035, MAXP=6, TL=7200) with the build-rate limits relaxed to
# BLD_PACE.grid (the highest existing pace case below 'none'; wind 4,300, solar 4,000 growing as the page's solar cap grows,
# lithium 4,000 MW a year, vanadium 500, gas 2,000; c6's WIND_CAP=3500 unset so the pace's 4,300 applies; LI_CAP=4000 to match),
# lithium energy LI_EH=8 hours of the power cap (twice the default 4: 32,000 MWh a year), iron-air up to 5 GW in total
# (IA_TOTAL=5000), the 2035-40 caps elastic at R50,000/t (CO2_ELASTIC; co2sl_<y> reported per pass). Native HiGHS (simplex unless
# HIGHS_SOLVER is set; the method is recorded per pass). Resumable pieces under 2 hours; then the engine check as the set.
cd /home/user/gtza-opt/harness; source pathway/env_c6a.sh; export GAS_FIRST=2035; unset WIND_CAP WIND_CAP_FROM
P=out/opt/progress.txt; n=s_hypo_deep2035nogas_c6e
echo "$(date -u +%Y-%m-%dT%H:%M)Z start $n, PID $$, on $(git log --oneline -1 | cut -c1-60), $(grep -o "BUILD_STAMP = .[0-9a-z-]*" ../index.html), HIGHS_SOLVER=${HIGHS_SOLVER:-simplex}" >> $P
env SOLVER=native GAS_CAP=0 OCGD=1 PACE=grid LI_CAP=4000 LI_EH=8 IA_TOTAL=5000 CO2_ELASTIC=50000 CO2CAP=22.809:2035 CO2CAP_YEARS=2035:17.509,2036:15.857,2037:13.255,2038:11.735,2039:13.519,2040:17.653 RESUME=1 JOB_DEADLINE=$(( $(date +%s) + 6300 )) LPCACHE=out/opt/lpcache_$n MAXP=6 OUT=out/pathway_$n.json TL=7200 timeout 14400 nice -n 10 node --max-old-space-size=8192 pathway/pathway_perfail.js > out/opt/$n.log 2>&1
rc=$?; echo "$(date -u +%H:%M) end $n rc=$rc $(grep -o '"verdict":"[^"]*"' out/pathway_$n.json 2>/dev/null)" >> $P
if [ ! -s out/pathway_$n.json ]; then echo "$(date -u +%H:%M) piece ended (rc=$rc), resume by relaunching" >> $P; exit 0; fi
for g in "a 2026,2027,2028,2029,2030" "b 2031,2032,2033,2034,2035" "c 2036,2037,2038,2039,2040"; do set -- $g
  env -i PATH="$PATH" HOME="$HOME" LNG=1 GRID=1 YEARS=$2 IN=out/pathway_$n.json OUTC=out/pathcheck_${n}_$1.json nice -n 10 node --max-old-space-size=4096 pathcheck.js > out/opt/pathcheck_${n}_$1.log 2>&1 &
done; wait
echo "$(date -u +%H:%M) check $n $(ls out/pathcheck_${n}_?.json 2>/dev/null | wc -l)/3 groups" >> $P
