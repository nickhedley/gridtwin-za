#!/bin/bash
# Eighth queue, runner C (6 Nov 2026): the Fossil-free and Deep stand-ins' free-mix cases on 3-hour blocks (722 (a) point 2). Resumable.
# Launch after queue6 finishes (three solvers at once at most).
S=/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad; R=$S/sc/run_net.sh; C7=$S/wt-c7base
export HSTEP=3
echo "queue8c pid $$ start $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
SUFFIX=_mix_ext10k_h3 MIX=1 MIX_INTEG=0 TX_EXT=10000 DISC=0.08 bash $R $C7 engine_ff "2040 2025 n1c reea 0 1" "2035 2025 n1c reea 0 1"
SUFFIX=_mix_ext10k_h3 MIX=1 MIX_INTEG=0 TX_EXT=10000 DISC=0.08 bash $R $C7 engine_deep "2040 2025 n1c reea 0 1" "2035 2025 n1c reea 0 1"
echo "queue8c done $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
