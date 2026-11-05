#!/bin/bash
# Fifth queue (5 Nov 2026, 22:45 UTC, after the container restart): the cases still missing, in two runners. B1: a solver timing test
# (interior point against the dual simplex on one finished extendable case), then the extendable, free-siting and demand-split cases
# and the fixed-build leftovers; B2: the free-mix cases. Resumable.
S=/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad; R=$S/sc/run_net.sh; W=$S/wt-05f; C7=$S/wt-c7base; P=engine_final; T=$S/tdp_lines_full.json
echo "queue5 pid $$ start $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
( SUFFIX=_ext10k_ipmtest SOLVER=ipm TX_EXT=10000 DISC=0.08 bash $R $W $P "2035 2025 n1c reea 0 0"
  for tag in ff deep; do bash $R $C7 engine_$tag "2035 2015 n0 reea 0 0" "2040 2015 n0 reea 0 0"; done
  SUFFIX=_sitefree SITE_FREE=1 bash $R $W $P "2035 2025 n1c reea 0 0" "2035 2025 n1 reea 0 0" "2035 2025 n1tdp reea 0 0"
  SUFFIX=_tdpfull_sitefree TDP_FILE=$T SITE_FREE=1 bash $R $W $P "2035 2025 n1ctdp reea 0 0"
  SUFFIX=_bld DEMAND_SPLIT=bld bash $R $W $P "2035 2025 n1c reea 0 0" "2035 2025 nolimit reea 0 0" "2035 2025 n1 reea 0 0"
  SUFFIX=_ext21k TX_EXT=21700 DISC=0.08 bash $R $W $P "2035 2025 n1c reea 0 0" "2040 2025 n1c reea 0 0" "2035 2025 n1 reea 0 0" "2040 2025 n1 reea 0 0"
  SUFFIX=_tdpfull_ext10k TDP_FILE=$T TX_EXT=10000 DISC=0.08 bash $R $W $P "2035 2025 n1ctdp reea 0 0" "2040 2025 n1ctdp reea 0 0"
  SUFFIX=_sitefree_ext10k SITE_FREE=1 TX_EXT=10000 DISC=0.08 bash $R $W $P "2035 2025 n1c reea 0 0" "2035 2025 n1 reea 0 0"
  for tag in ff deep; do SUFFIX=_ext10k TX_EXT=10000 DISC=0.08 bash $R $C7 engine_$tag "2040 2025 n1c reea 0 0" "2035 2025 n1c reea 0 0" "2040 2015 n1c reea 0 0" "2035 2015 n1c reea 0 0"; done
  echo "queue5 runner B1 done $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt ) &
( SUFFIX=_mix_control MIX=1 MIX_INTEG=1 bash $R $W $P "2035 2025 nolimit reea 0 1" "2040 2025 nolimit reea 0 1"
  SUFFIX=_mix_ext10k MIX=1 MIX_INTEG=0 TX_EXT=10000 DISC=0.08 bash $R $W $P "2035 2025 n1c reea 0 1" "2040 2025 n1c reea 0 1"
  SUFFIX=_mix_n1c_fixedcorr MIX=1 MIX_INTEG=1 bash $R $W $P "2035 2025 n1c reea 0 1" "2040 2025 n1c reea 0 1"
  SUFFIX=_mix_control MIX=1 MIX_INTEG=1 bash $R $W $P "2035 2015 nolimit reea 0 1" "2040 2015 nolimit reea 0 1"
  SUFFIX=_mix_ext10k MIX=1 MIX_INTEG=0 TX_EXT=10000 DISC=0.08 bash $R $W $P "2035 2015 n1c reea 0 1" "2040 2015 n1c reea 0 1" "2035 2025 n1 reea 0 1" "2040 2025 n1 reea 0 1"
  SUFFIX=_tdpfull_mix_ext10k TDP_FILE=$T MIX=1 MIX_INTEG=0 TX_EXT=10000 DISC=0.08 bash $R $W $P "2035 2025 n1ctdp reea 0 1" "2040 2025 n1ctdp reea 0 1"
  SUFFIX=_tdpfull_mix_fixed TDP_FILE=$T MIX=1 MIX_INTEG=1 bash $R $W $P "2035 2025 n1ctdp reea 0 1"
  SUFFIX=_mix_control_caps MIX=1 MIX_INTEG=1 MIX_CAP=wind:30000,pv:20000,batt:20000 bash $R $W $P "2035 2025 nolimit reea 0 1"
  for tag in ff deep; do SUFFIX=_mix_ext10k MIX=1 MIX_INTEG=0 TX_EXT=10000 DISC=0.08 bash $R $C7 engine_$tag "2040 2025 n1c reea 0 1" "2035 2025 n1c reea 0 1"; done
  echo "queue5 runner B2 done $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt ) &
wait; echo "queue5 done $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
