#!/bin/bash
# Queue 20c (6 Nov 2026, 743 (a)): the bases in 3-hour blocks (today's corridors, the rebuilt table N-1 once, no addition) for 2035 and 2040, so the
# free-lithium block cases of queue20b are read against a base at the same block length. Two short cases. Resumable.
S=/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad; R=$S/sc/run_net.sh; W=$S/wt-05f; P=engine_final
export CORR_FILE=$S/corridors_v2.json HSTEP=3
echo "queue20c pid $$ start $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
for y in 2035 2040; do SUFFIX=_v2_h3 bash $R $W $P "$y 2025 nm1 reea 0 0"; done
echo "queue20c done $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
