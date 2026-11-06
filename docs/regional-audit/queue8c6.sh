#!/bin/bash
# Eighth queue, runner C6 (6 Nov 2026, 08:05 SAST): the Fossil-free and Deep free-mix cases with corridors extendable, on 6-hour blocks,
# after the 3-hour-block form of Fossil-free 2040 ran 7,180 s of dual simplex without finishing in queue8c's two-hour window. Resumable.
S=/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad; R=$S/sc/run_net.sh; C7=$S/wt-c7base
export HSTEP=6
echo "queue8c6 pid $$ start $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
for tag in ff deep; do
  SUFFIX=_mix_ext10k_h6 MIX=1 MIX_INTEG=0 TX_EXT=10000 DISC=0.08 bash $R $C7 engine_$tag "2040 2025 n1c reea 0 1" "2035 2025 n1c reea 0 1"
done
echo "queue8c6 done $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
