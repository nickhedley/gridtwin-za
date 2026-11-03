#!/bin/bash
# 665 (b), (c): dump each run's final-pass LP and solve it for the chained-day split of long-duration storage's value. Resumable.
# Usage: ldesdump.sh name "<extra env>" <passes>
SP=${LDES_DIR:-$(cd "$(dirname "$0")" && pwd)/ldes}; mkdir -p $SP
cd /home/user/gtza-c7run/harness; source pathway/env_c6a.sh; export GAS_FIRST=2035
C7="SS=inertia SS_FC=reservecoal COC=blended BTM_STOCK=8 VPP=1 GY=1 COAL_FUEL_ESC=3 COAL_FOM_ESC=1.1 COMPLY=compromise COAL_CARBON_FLOOR=1"
n=$1; extra=$2; k=$3
[ -s $SP/${n}_pass$k.lp ] || eval "env $C7 $extra MAXP=$k DUMP=0 DUMP_LP=$SP/$n DUMP_STOP=$k LPCACHE=$SP/lpc_$n OUT=$SP/p_$n.json TL=3000 nice -n 5 node --max-old-space-size=8192 pathway/pathway_perfail.js" > $SP/$n.log 2>&1
for i in $(seq 1 $((k-1))); do rm -f $SP/${n}_pass$i.lp; done
[ -s $SP/${n}_sol.json ] || HIGHS_SOLVER=${HS:-simplex} nice -n 5 python3 highs_native.py $SP/${n}_pass$k.lp $SP/${n}_sol.json 7000 >> $SP/$n.log 2>&1
echo "$(date -u +%H:%M) $n pass $k $(python3 -c "import json;print(json.load(open('$SP/${n}_sol.json'))['Status'])" 2>/dev/null)" >> $SP/progress.txt
