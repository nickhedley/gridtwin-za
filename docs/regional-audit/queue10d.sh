#!/bin/bash
# After queue10c (6 Nov 2026, 727 (a)): the run's own fixed build for 2040 on weather 2015 in 6-hour blocks, so the 6-hour-block split has its gap to
# the run measured at the same block length. One short case. Resumable.
S=/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad; R=$S/sc/run_net.sh; W=$S/wt-05f; P=engine_final
echo "queue10d pid $$ start $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
HSTEP=6 SUFFIX=_h6 bash $R $W $P "2040 2015 nolimit reea 0 1"
echo "queue10d done $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
