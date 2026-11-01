#!/bin/bash
# Message 588 (a): Deep decarbonisation 2035 without new gas, each run's optimiser 2035 cap set from its own engine check. Target T
# (engine CO2 in 2035, Mt); first cap T - 0.9; after each 2035 engine check (pathcheck.js YEARS=2035, 120 runs) cap += T - engine,
# until |engine - T| <= 0.5 (at most 5 rounds); then the full engine check (groups a, b, c) of the last round. Every other year's cap
# as in Deep (CO2CAP_YEARS 2036-40); all else as run_deepnogas.sh (580 (d)). Usage: run_deepnogas_cal.sh <tag> <target Mt>.
# Resumable: a round whose run file and 2035 check exist is read, not rerun. Log: out/opt/cal_<tag>.txt (round, cap, engine 2035).
cd /home/user/gtza-opt/harness; source pathway/env_c6a.sh; export GAS_FIRST=2035; unset WIND_CAP WIND_CAP_FROM
tag=$1; T=$2; L=out/opt/cal_$tag.txt; P=out/opt/progress.txt
cap=$(python3 -c "print(round($T-0.9,3))")
for r in 1 2 3 4 5; do
  n=s_hypo_deep2035nogas_${tag}_r${r}_c6e
  if [ ! -s out/pathway_$n.json ]; then
    echo "$(date -u +%Y-%m-%dT%H:%M)Z start $n (target $T, optimiser 2035 cap $cap), PID $$" >> $P
    env SOLVER=native GAS_CAP=0 OCGD=1 PACE=grid LI_CAP=4000 LI_EH=8 IA_TOTAL=5000 CO2_ELASTIC=50000 CO2CAP=22.809:2035 CO2CAP_YEARS=2035:$cap,2036:15.857,2037:13.255,2038:11.735,2039:13.519,2040:17.653 RESUME=1 JOB_DEADLINE=$(( $(date +%s) + 2400 )) LPCACHE=out/opt/lpcache_$n MAXP=6 OUT=out/pathway_$n.json TL=7200 timeout 3000 nice -n 10 node --max-old-space-size=8192 pathway/pathway_perfail.js > out/opt/$n.log 2>&1
    echo "$(date -u +%H:%M) end $n rc=$? $(grep -o '"verdict":"[^"]*"' out/pathway_$n.json 2>/dev/null)" >> $P
    [ -s out/pathway_$n.json ] || { echo "$(date -u +%H:%M) $n piece ended, resume by relaunching" >> $P; exit 0; }
  fi
  o=out/pathcheck_${n}_y2035.json
  [ -s $o ] || env -i PATH="$PATH" HOME="$HOME" LNG=1 GRID=1 YEARS=2035 IN=out/pathway_$n.json OUTC=$o nice -n 10 node --max-old-space-size=4096 pathcheck.js > out/opt/pathcheck_${n}_y2035.log 2>&1
  e=$(python3 -c "import json;print(round([x for x in json.load(open('$o')) if x['y']==2035][0]['co2'],3))")
  echo "round $r cap $cap engine2035 $e target $T" >> $L
  ok=$(python3 -c "print(1 if abs($e-$T)<=0.5 else 0)")
  if [ "$ok" = 1 ]; then
    for g in "a 2026,2027,2028,2029,2030" "b 2031,2032,2033,2034,2035" "c 2036,2037,2038,2039,2040"; do set -- $g
      env -i PATH="$PATH" HOME="$HOME" LNG=1 GRID=1 YEARS=$2 IN=out/pathway_$n.json OUTC=out/pathcheck_${n}_$1.json nice -n 10 node --max-old-space-size=4096 pathcheck.js > out/opt/pathcheck_${n}_$1.log 2>&1 &
    done; wait
    echo "final $n $(ls out/pathcheck_${n}_?.json | wc -l)/3" >> $L; echo "$(date -u +%H:%M) cal $tag done at round $r" >> $P; exit 0
  fi
  cap=$(python3 -c "print(round($cap+($T-$e),3))")
done
echo "not within 0.5 Mt after 5 rounds" >> $L
