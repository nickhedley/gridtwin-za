#!/bin/bash
# Second queue for 718: Koeberg calendars on today's fleet (a), the full TDP mapping (c), and its extendable, free-siting and mix variants. Waits for the earlier runners (by PID) first.
S=/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad; R=$S/sc/run_net.sh
for pid in $(grep -o "runner pid [0-9]*" $S/run_net_progress.txt | awk '{print $3}' | sort -u); do while kill -0 $pid 2>/dev/null; do sleep 20; done; done
echo "queue2 start $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
( SUFFIX=_koeberg KOEBERG_OUT="1:302,60:68" bash $R /home/user/gridtwin-za engine_today "2025 2025 nolimit reea 0 0" "2025 2025 n0 reea 0 0" "2025 2025 f085 reea 0 0" "2025 2025 n1 reea 0 0" "2025 2025 n1c reea 0 0";
  SUFFIX=_koeberg KOEBERG_OUT="116:320,239:243,289:295" bash $R /home/user/gridtwin-za engine_today "2026 2025 nolimit reea 0 0" "2026 2025 n0 reea 0 0" "2026 2025 f085 reea 0 0" "2026 2025 n1 reea 0 0" "2026 2025 n1c reea 0 0" ) &
( SUFFIX=_tdpfull TDP_FILE=$S/tdp_lines_full.json bash $R $S/wt-05f engine_final "2035 2025 n0tdp reea 0 0" "2035 2025 f085tdp reea 0 0" "2035 2025 n1tdp reea 0 0" "2035 2025 n1ctdp reea 0 0" "2040 2025 n0tdp reea 0 0" "2040 2025 f085tdp reea 0 0" "2040 2025 n1tdp reea 0 0" "2040 2025 n1ctdp reea 0 0" "2035 2015 n1tdp reea 0 0" "2035 2015 n1ctdp reea 0 0" "2040 2015 n1tdp reea 0 0" "2040 2015 n1ctdp reea 0 0" ) &
( SUFFIX=_tdpfull_ext10k TDP_FILE=$S/tdp_lines_full.json TX_EXT=10000 DISC=0.08 bash $R $S/wt-05f engine_final "2035 2025 n1ctdp reea 0 0" "2040 2025 n1ctdp reea 0 0";
  SUFFIX=_tdpfull_sitefree TDP_FILE=$S/tdp_lines_full.json SITE_FREE=1 bash $R $S/wt-05f engine_final "2035 2025 n1ctdp reea 0 0";
  SUFFIX=_tdpfull_mix_ext10k TDP_FILE=$S/tdp_lines_full.json MIX=1 MIX_INTEG=0 TX_EXT=10000 DISC=0.08 bash $R $S/wt-05f engine_final "2035 2025 n1ctdp reea 0 1" "2040 2025 n1ctdp reea 0 1";
  SUFFIX=_tdpfull_mix_fixed TDP_FILE=$S/tdp_lines_full.json MIX=1 MIX_INTEG=1 bash $R $S/wt-05f engine_final "2035 2025 n1ctdp reea 0 1" ) &
wait; echo "queue2 done $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
