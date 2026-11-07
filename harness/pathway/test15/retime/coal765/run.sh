#!/bin/bash
# Message 765 (a): which engine coal rule carries the dispatch gap. The fin build, 2035, the metered 2025 reference alone (WEATHER=metered),
# 20 draws on the gate's seeds; settings read from the 100-draw gate's README row (as engine100.sh), K overridden to 20; one coal setting
# changed at a time from the key's values (the fin pass's recorded coal: coalMinDownH 24, coalMslDesign [0.57, 0.52], weighing starts,
# ramp honoured, ssLiftForecast reservecoal). pathcheck_coal765.js is a test copy (ENGINE_STATE sets one engine setting; TESTROOT reads
# a test page copy, testroot765, whose only change is BLOCK_HOURS 1). Nothing in the key changes.
D=/tmp/claude-0/-home-user-gridtwin-za/89044349-14ce-5480-b08a-321dc7b30183/scratchpad/coal765; FIN=/tmp/claude-0/-home-user-gridtwin-za/89044349-14ce-5480-b08a-321dc7b30183/scratchpad/fin/pathway_fin_05h.json
cd /home/user/gtza-retime/harness || exit 2
ROW=$(git show origin/claude/c7-runs:harness/pathway/final/README.md | grep '^| engine_loop_base_05h_k100.json ')
KV=$(echo "$ROW" | grep -oE '\b[A-Z][A-Z0-9_]*=[^ )|]+' | sed 's/,$//' | grep -v '^K=')
run(){ local NM=$1; shift; echo "$(date -u +%FT%TZ) $NM: $*" >> $D/runs.txt
  env -i PATH="$PATH" HOME="$HOME" $KV K=20 YEARS=2035 WEATHER=metered IN=$FIN OUTC=$D/$NM.json "$@" nice -n 5 node --max-old-space-size=4096 pathcheck_coal765.js > $D/$NM.log 2>&1
  echo "$(date -u +%FT%TZ) $NM rc=$? $(python3 -I -c "import json,sys; r=json.load(open(sys.argv[1]))[0]; print('curt %.2f coal %.2f unserved %.2f (se %.2f) li %.2f diesel %.2f' % (r['curt'], r['coal'], r['mean'], r['seMean'], r['storeTWh']['li'], r['diesel']))" $D/$NM.json 2>&1)" >> $D/runs.txt; }
run v0_key &
run v1_mindown_null 'ENGINE_STATE={"coalMinDownH":null}'; wait
run v2_lift_reserve SS_FC=reserve &
run v3_coallift_0 'ENGINE_STATE={"ssCoalLift":0}'; wait
run v4_block_1h TESTROOT=testroot765 &
run v5_weighstarts_0 'ENGINE_STATE={"coalCommitWeighStarts":0}'; wait
run v6_ramphonour_0 'ENGINE_STATE={"coalRampHonour":0}' &
run v7_msl_ucfleet 'ENGINE_STATE={"coalMslDesign":null}'; wait
run v8_msl_040 'ENGINE_STATE={"coalMslDesign":[0.40,0.40]}' &
run v9_all TESTROOT=testroot765 'ENGINE_STATE={"coalMinDownH":null,"ssCoalLift":0,"coalCommitWeighStarts":0,"coalRampHonour":0,"coalMslDesign":[0.40,0.40]}'; wait
echo "$(date -u +%FT%TZ) done" >> $D/runs.txt
