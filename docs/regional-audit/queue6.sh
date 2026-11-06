#!/bin/bash
# Sixth queue (6 Nov 2026, 00:50 UTC): runner B1's leftovers from queue5 (the free-siting and stand-in cases with extendable corridors). Resumable.
S=/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad; R=$S/sc/run_net.sh; W=$S/wt-05f; C7=$S/wt-c7base; P=engine_final
echo "queue6 pid $$ start $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
SUFFIX=_sitefree_ext10k SITE_FREE=1 TX_EXT=10000 DISC=0.08 bash $R $W $P "2035 2025 n1c reea 0 0" "2035 2025 n1 reea 0 0"
for tag in ff deep; do SUFFIX=_ext10k TX_EXT=10000 DISC=0.08 bash $R $C7 engine_$tag "2040 2025 n1c reea 0 0" "2035 2025 n1c reea 0 0" "2040 2015 n1c reea 0 0" "2035 2015 n1c reea 0 0"; done
echo "queue6 done $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
