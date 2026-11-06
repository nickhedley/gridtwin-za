#!/bin/bash
# Twentieth queue (6 Nov 2026, message 743 (a)): on the rebuilt table, N-1 once, 2035 and 2040, weather 2025, fixed build, hourly: the LP choosing
# battery sites and sizes (lithium extendable by area at the build's lithium costs) on today's corridors; the same with corridors extendable at
# R21,700 too, so the LP chooses between them; and the 8-hour steps of 2, 5 and 10 GW at the four exits (the key cases of 737's first cut). Resumable.
S=/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad; R=$S/sc/run_net.sh; W=$S/wt-05f; P=engine_final
export CORR_FILE=$S/corridors_v2.json
echo "queue20 pid $$ start $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
for y in 2035 2040; do
  SUFFIX=_v2_battfree BATT_FREE=1 bash $R $W $P "$y 2025 nm1 reea 0 0"
  SUFFIX=_v2_battfree_ext21k BATT_FREE=1 TX_EXT=21700 DISC=0.071 bash $R $W $P "$y 2025 nm1 reea 0 0"
  for mw in 2000 5000 10000; do q=$((mw/4)); SUFFIX=_v2_li$((mw/1000))g8h BATT_ADD="North West:$q,Northern Cape:$q,Hydra Central:$q,Eastern Cape:$q" BATT_ADD_H=8 bash $R $W $P "$y 2025 nm1 reea 0 0"; done
done
echo "queue20 done $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
