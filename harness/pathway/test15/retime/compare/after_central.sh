#!/bin/bash
# Messages 724 (c), 748, 750: everything that waits for the two-stage central's last step. Two at a time beside nothing else.
S=/tmp/claude-0/-home-user-gridtwin-za/89044349-14ce-5480-b08a-321dc7b30183/scratchpad; F=$S/fin; D=$S/y365; W=/home/user/gtza-retime/harness/out/tsr_central
[ -s $W/step_2040.json ] || { echo "no step_2040.json" >> $S/after_central.txt; exit 2; }
echo "$(date -u +%FT%TZ) after_central start; fixed.json entries $(python3 -I -c "import json; print(len(json.load(open('$W/fixed.json'))['build']))")" >> $S/after_central.txt
bash $F/engine100.sh ts_2040 $W/step_2040.json YEARS=2040 &
bash $F/recost.sh ts $W/fixed.json; wait
bash $D/recost_year.sh ts2040_25 $W/fixed.json 2040 25
bash $D/recost_year.sh ts2040_365 $W/fixed.json 2040 365
python3 -I $D/season.py $D 2040 > $D/season_2040.json; for n in ts fin; do python3 -I $D/rep_gap.py $D 2040 $n > $D/rep_gap_2040_$n.json; done
echo "$(date -u +%FT%TZ) after_central done" >> $S/after_central.txt
