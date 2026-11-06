#!/bin/bash
# Eighteenth queue (6 Nov 2026, after 738): the Fossil-free and Deep stand-ins (build 2026-11-03a) through the network test on the rebuilt corridor
# table, N-1 once: today's corridors, limits only, the TDP's lines (tdp_lines_v2.json), corridors priced at R10,000 and R21,700 at 0.071; 2035 and 2040,
# weather 2025, fixed build, hourly, no commitment floor. Resumable.
S=/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad; R=$S/sc/run_net.sh; C7=$S/wt-c7base
export CORR_FILE=$S/corridors_v2.json
echo "queue18 pid $$ start $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
for tag in ff deep; do for y in 2035 2040; do
  SUFFIX=_v2 bash $R $C7 engine_$tag "$y 2025 nm1 reea 0 0" "$y 2025 thermal reea 0 0"
  TDP_FILE=$S/tdp_lines_v2.json SUFFIX=_v2tdp bash $R $C7 engine_$tag "$y 2025 nm1tdp reea 0 0"
  SUFFIX=_v2_ext10k TX_EXT=10000 DISC=0.071 bash $R $C7 engine_$tag "$y 2025 nm1 reea 0 0"
  SUFFIX=_v2_ext21k TX_EXT=21700 DISC=0.071 bash $R $C7 engine_$tag "$y 2025 nm1 reea 0 0"
done; done
echo "queue18 done $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
