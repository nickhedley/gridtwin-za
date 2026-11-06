#!/bin/bash
# Message 750 (c): one build on year Y's single-year LP (365 days or 25 days), every build fixed: write the LP (dump.sh), solve it with
# highs_native.py (parallel dual simplex, 2 threads, presolve on: no piece cut expected at this size), slice year Y's cost (slice.py).
# Usage: recost_year.sh <name> <build json> <Y> <365|25>
NM=${1:?}; IN=${2:?}; Y=${3:?}; DD=${4:?}; D=/tmp/claude-0/-home-user-gridtwin-za/89044349-14ce-5480-b08a-321dc7b30183/scratchpad/y365
[ -s $D/${NM}_pass1.lp ] || bash $D/dump.sh $NM $IN $Y $DD
cd /home/user/gtza-retime/harness || exit 2
t0=$(date +%s); HIGHS_OPTS='{"simplex_strategy": 2, "threads": 2}' nice -n 5 python3 highs_native.py $D/${NM}_pass1.lp $D/${NM}_sol.json 6000; t1=$(date +%s)
echo "$(date -u +%FT%TZ) recost_year $NM ($Y, $DD days, $IN): solve $((t1 - t0)) s $(python3 -I $D/slice.py $D/${NM}_pass1.lp $D/${NM}_sol.json $Y)" >> $D/recost_year.txt
