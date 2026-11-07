#!/bin/bash
# Queue 25 (7 Nov 2026, message 779): today's fleets (the 2025 and 2026 states, build 2026-11-04b, Koeberg on its calendar) on the table of record
# (corridors_v3.json, area_map_v3.json), N-1 once and limits only, so the draft's sentence on today's fleet holds on the table of record. Resumable.
S=/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad; R=$S/sc/run_net.sh; W=$S/wt-05f
export CORR_FILE=$S/corridors_v3.json AREA_MAP=$S/area_map_v3.json
echo "queue25 pid $$ start $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
for y in 2025 2026; do P=engine_today
  KOEBERG_OUT=1:302,60:68 SUFFIX=_v3_koeberg bash $R $W $P "$y 2025 nm1 reea 0 0" "$y 2025 thermal reea 0 0"
done
echo "queue25 done $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
