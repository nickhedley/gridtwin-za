#!/bin/bash
# Queue 20b (6 Nov 2026, message 743 (a)), replacing queue20's remainder: the free-lithium case at hourly resolution took 6,216 s for 2035 alone
# (6 GB peak) and its corridor-priced partner did not fit a two-hour window, so the remaining free-lithium cases run in 3-hour blocks, labelled
# (_h3), with a 2035 free-lithium block case beside the hourly one as the consistency check; the fixed 8-hour lithium steps stay hourly. Resumable.
S=/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad; R=$S/sc/run_net.sh; W=$S/wt-05f; P=engine_final
export CORR_FILE=$S/corridors_v2.json
echo "queue20b pid $$ start $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
for y in 2035 2040; do
  for mw in 2000 5000 10000; do q=$((mw/4)); SUFFIX=_v2_li$((mw/1000))g8h BATT_ADD="North West:$q,Northern Cape:$q,Hydra Central:$q,Eastern Cape:$q" BATT_ADD_H=8 bash $R $W $P "$y 2025 nm1 reea 0 0"; done
  HSTEP=3 SUFFIX=_v2_battfree_h3 BATT_FREE=1 bash $R $W $P "$y 2025 nm1 reea 0 0"
  HSTEP=3 SUFFIX=_v2_battfree_ext21k_h3 BATT_FREE=1 TX_EXT=21700 DISC=0.071 bash $R $W $P "$y 2025 nm1 reea 0 0"
done
echo "queue20b done $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
