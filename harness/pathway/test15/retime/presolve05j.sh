#!/bin/bash
# Message 724 (b): what presolve off costs on build 2026-11-05j. Step 2026's LP dumped with the retime central's settings (settings.env,
# two_stage.sh's step 2026 env), then solved by highs_native.py with parallel dual simplex on 2 threads, presolve on, then off, one after
# the other, each beside the central's own solve (two at a time, as the runs).
D=/tmp/claude-0/-home-user-gridtwin-za/89044349-14ce-5480-b08a-321dc7b30183/scratchpad/presolve05j; cd /home/user/gtza-retime/harness || exit 2
source out/tsr_central/settings.env; unset HIGHS_OPTS
env OPER_FROM=2026 HORIZON=2030 STAGE2_YEAR=2026 REP_DAYS=25 REP_WEIGHTS=clustered STORAGE_LINK=1 STRESS_TARGET=1 MAXP=1 LPCACHE=$D/lpc OUT=$D/step_2026.json \
  DUMP_LP=$D/step2026 DUMP_STOP=1 nice -n 5 node --max-old-space-size=12288 pathway/pathway_perfail.js > $D/dump.log 2>&1
echo "dump rc=$? $(grep 'dumped LP' $D/dump.log); the run's step 2026 key: $(python3 -I -c "import json; print(json.load(open('out/tsr_central/step_2026.json'))['passLog'][0]['key'])")" > $D/timing.txt
for p in on off; do export HIGHS_OPTS="{\"simplex_strategy\": 2, \"threads\": 2, \"presolve\": \"$p\"}"
  echo "$(date -u +%FT%TZ) presolve $p start, load $(cut -d' ' -f1-3 /proc/loadavg)" >> $D/timing.txt; t0=$(date +%s.%N)
  nice -n 5 python3 highs_native.py $D/step2026_pass1.lp $D/$p.json 7200; t1=$(date +%s.%N)
  python3 -I -c "import json,sys; d=json.load(open(sys.argv[1])); print('presolve %s: %s, objective %.6f, wall %.1f s' % (sys.argv[2], d['Status'], d['ObjectiveValue'], float(sys.argv[4])-float(sys.argv[3])))" $D/$p.json $p $t0 $t1 >> $D/timing.txt
done
python3 -I -c "
import json,sys; a,b=(json.load(open(x)) for x in sys.argv[1:3]); B=json.load(open(sys.argv[3]))['build']
print('objective relative difference %.2e; largest build difference %.3g MW over %d build columns' % (abs(a['ObjectiveValue']-b['ObjectiveValue'])/abs(a['ObjectiveValue']), max(abs(a['Columns'][n]['Primal']-b['Columns'][n]['Primal']) for n in B if n in a['Columns']), len(B)))" $D/on.json $D/off.json out/tsr_central/step_2026.json >> $D/timing.txt
rm -f $D/step2026_pass1.lp $D/on.json $D/off.json
