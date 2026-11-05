#!/bin/bash
# Third queue (5 Nov 2026, messages 722 (a) and the 718 reruns). Waits until queue2 has started and every runner recorded in the progress
# file has finished; then (1) dumps the Fossil-free and Deep stand-ins (pathway_s_ff2040_c7, pathway_s_deep40nogas_c7 at build
# 2026-11-03a) for weather years 2025 and 2015; (2) reruns queue_final.sh and queue2.sh, which skip finished cases and so fill the
# drop-one-circuit gaps (the S_COUNTS fault) and redo the 2040 cases set aside for the diesel double count; (3) runs the case set on
# the two stand-ins. Resumable: rerun it and it skips what exists.
S=/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad; R=$S/sc/run_net.sh; W=$S/wt-c7base; L=$S/run_net_progress.txt
echo "queue3 pid $$ start $(date -u +%FT%H:%MZ)" >> $L
until grep -q "queue2 start" $L; do sleep 30; done; sleep 90
waitrunners(){ while :; do alive=0; for pid in $(grep -o "runner pid [0-9]* start" $L | awk '{print $3}' | sort -u); do grep -q "runner pid $pid done" $L || { kill -0 $pid 2>/dev/null && alive=1; }; done; [ $alive -eq 0 ] && break; sleep 30; done; }
waitrunners; echo "queue3 runners clear $(date -u +%FT%H:%MZ)" >> $L
# (1) the dumps, two at a time (node, up to 4 GB each)
cd $W/harness
for wy in 2025 2015; do
  for nm in ff:pathway_s_ff2040_c7 deep:pathway_s_deep40nogas_c7; do tag=${nm%%:*}; pf=${nm#*:}
    [ -s $S/engine_${tag}_2040_wy${wy}.json ] && continue
    env -i PATH="$PATH" HOME="$HOME" LNG=1 GRID=1 SS_FC=reservecoal YEARS=2035,2040 IN=$S/$pf.json OUTC=$S/pathcheck_${tag}_${wy}.json DUMP_WY=$wy DUMP_K=0 DUMP_PAGE=$S/sc/engine_dump_page.js DUMP_OUT=$S/engine_${tag} node --max-old-space-size=4096 pathcheck_dump.js > $S/pathcheck_${tag}_${wy}.log 2>&1 &
  done; wait
  echo "queue3 dumps wy$wy done $(date -u +%FT%H:%MZ): $(ls $S/engine_ff_*_wy${wy}.json $S/engine_deep_*_wy${wy}.json 2>/dev/null | wc -l)/4 files" >> $L
done
# (2) the reruns (each skips finished cases)
bash $S/sc/queue_final.sh; bash $S/sc/queue2.sh
echo "queue3 reruns done $(date -u +%FT%H:%MZ)" >> $L
# (3) the case set on the Fossil-free and Deep stand-ins
for tag in ff deep; do P=engine_$tag
  ( bash $R $W $P "2035 2025 nolimit reea 0 0" "2035 2025 n0 reea 0 0" "2035 2025 n1c reea 0 0" "2040 2025 nolimit reea 0 0" "2040 2025 n0 reea 0 0" "2040 2025 n1c reea 0 0" "2035 2015 nolimit reea 0 0" "2035 2015 n1c reea 0 0" "2040 2015 nolimit reea 0 0" "2040 2015 n1c reea 0 0" "2040 2025 n1 reea 0 0";
    SUFFIX=_tdpfull TDP_FILE=$S/tdp_lines_full.json bash $R $W $P "2035 2025 n1ctdp reea 0 0" "2040 2025 n1ctdp reea 0 0" "2040 2015 n1ctdp reea 0 0";
    SUFFIX=_ext10k TX_EXT=10000 DISC=0.08 bash $R $W $P "2035 2025 n1c reea 0 0" "2040 2025 n1c reea 0 0" "2040 2015 n1c reea 0 0";
    SUFFIX=_mix_ext10k MIX=1 MIX_INTEG=0 TX_EXT=10000 DISC=0.08 bash $R $W $P "2035 2025 n1c reea 0 1" "2040 2025 n1c reea 0 1" ) &
done; wait
echo "queue3 done $(date -u +%FT%H:%MZ)" >> $L
