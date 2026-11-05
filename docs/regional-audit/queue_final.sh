#!/bin/bash
# The 718 case set on the every-change pass (engine_final dumps at build 2026-11-05f). Three runners in parallel; each resumable.
S=/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad; R=$S/sc/run_net.sh; W=$S/wt-05f; P=engine_final
( bash $R $W $P "2035 2025 nolimit reea 0 0" "2035 2025 n0 reea 0 0" "2035 2025 f085 reea 0 0" "2035 2025 n1 reea 0 0" "2035 2025 n1c reea 0 0" "2040 2025 nolimit reea 0 0" "2040 2025 n0 reea 0 0" "2040 2025 f085 reea 0 0" "2040 2025 n1 reea 0 0" "2040 2025 n1c reea 0 0" "2035 2015 nolimit reea 0 0" "2035 2015 n0 reea 0 0" "2035 2015 f085 reea 0 0" "2035 2015 n1 reea 0 0" "2035 2015 n1c reea 0 0" "2040 2015 nolimit reea 0 0" "2040 2015 n0 reea 0 0" "2040 2015 f085 reea 0 0" "2040 2015 n1 reea 0 0" "2040 2015 n1c reea 0 0" "2035 2025 nolimit reea 0 1" "2035 2025 nolimit reea 0 2" "2040 2025 nolimit reea 0 1" "2040 2025 nolimit reea 0 2" "2035 2015 nolimit reea 0 2" "2040 2015 nolimit reea 0 2" "2035 2025 n1 reea 0 1" "2040 2025 n1 reea 0 1" "2035 2025 n1c reea 0 1" ) &
( bash $R $W $P "2035 2025 n0tdp reea 0 0" "2035 2025 f085tdp reea 0 0" "2035 2025 n1tdp reea 0 0" "2035 2025 n1ctdp reea 0 0" "2040 2025 n0tdp reea 0 0" "2040 2025 f085tdp reea 0 0" "2040 2025 n1tdp reea 0 0" "2040 2025 n1ctdp reea 0 0" "2035 2015 n1tdp reea 0 0" "2040 2015 n1tdp reea 0 0" "2035 2025 n1 fleet 0 0" "2035 2025 n1 reea 1 0";
  SUFFIX=_ext10k TX_EXT=10000 DISC=0.08 bash $R $W $P "2035 2025 n1 reea 0 0" "2040 2025 n1 reea 0 0" "2035 2015 n1 reea 0 0" "2040 2015 n1 reea 0 0" "2035 2025 n1c reea 0 0" "2040 2025 n1c reea 0 0";
  SUFFIX=_ext21k TX_EXT=21700 DISC=0.08 bash $R $W $P "2035 2025 n1 reea 0 0" "2040 2025 n1 reea 0 0" "2035 2015 n1 reea 0 0" "2040 2015 n1 reea 0 0";
  SUFFIX=_bld DEMAND_SPLIT=bld bash $R $W $P "2035 2025 n1 reea 0 0" "2035 2025 nolimit reea 0 0" "2035 2025 n1c reea 0 0" ) &
( SUFFIX=_sitefree SITE_FREE=1 bash $R $W $P "2035 2025 n0 reea 0 0" "2035 2025 n1 reea 0 0" "2035 2025 n1c reea 0 0" "2035 2025 n1tdp reea 0 0" "2040 2025 n1c reea 0 0";
  SUFFIX=_sitefree_ext10k SITE_FREE=1 TX_EXT=10000 DISC=0.08 bash $R $W $P "2035 2025 n1 reea 0 0" "2035 2025 n1c reea 0 0";
  SUFFIX=_mix_control MIX=1 MIX_INTEG=1 bash $R $W $P "2035 2025 nolimit reea 0 1" "2040 2025 nolimit reea 0 1" "2035 2015 nolimit reea 0 1" "2040 2015 nolimit reea 0 1";
  SUFFIX=_mix_ext10k MIX=1 MIX_INTEG=0 TX_EXT=10000 DISC=0.08 bash $R $W $P "2035 2025 n1c reea 0 1" "2040 2025 n1c reea 0 1" "2035 2015 n1c reea 0 1" "2040 2015 n1c reea 0 1" "2035 2025 n1 reea 0 1" "2040 2025 n1 reea 0 1";
  SUFFIX=_mix_n1c_fixedcorr MIX=1 MIX_INTEG=1 bash $R $W $P "2035 2025 n1c reea 0 1" "2040 2025 n1c reea 0 1";
  SUFFIX=_mix_control_caps MIX=1 MIX_INTEG=1 MIX_CAP=wind:30000,pv:20000,batt:20000 bash $R $W $P "2035 2025 nolimit reea 0 1" ) &
wait; echo "queue_final done $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
