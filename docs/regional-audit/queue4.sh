#!/bin/bash
# Fourth queue (5 Nov 2026, 21:10 UTC): everything still missing after the memory kills, in TWO runners only (the earlier queues ran up to
# five solvers at once and the 16 GB cgroup killed about fifty of them). Runner A: fixed-build cases (about 4 GB each). Runner B: the
# extendable, free-siting, demand-split and free-mix cases (up to about 6 GB). Resumable: each runner skips a case whose JSON exists.
S=/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad; R=$S/sc/run_net.sh; W=$S/wt-05f; C7=$S/wt-c7base; P=engine_final; T=$S/tdp_lines_full.json
echo "queue4 pid $$ start $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
( # runner A: fixed builds
  bash $R /home/user/gridtwin-za engine_today "2026 2025 n1c reea 0 0" "2025 2025 n1c reea 0 0"
  SUFFIX=_koeberg KOEBERG_OUT="1:302,60:68" bash $R /home/user/gridtwin-za engine_today "2025 2025 nolimit reea 0 0" "2025 2025 n0 reea 0 0" "2025 2025 f085 reea 0 0" "2025 2025 n1 reea 0 0" "2025 2025 n1c reea 0 0"
  SUFFIX=_koeberg KOEBERG_OUT="116:320,239:243,289:295" bash $R /home/user/gridtwin-za engine_today "2026 2025 nolimit reea 0 0" "2026 2025 n0 reea 0 0" "2026 2025 f085 reea 0 0" "2026 2025 n1 reea 0 0" "2026 2025 n1c reea 0 0"
  bash $R $W $P "2035 2025 nolimit reea 0 0" "2035 2025 n0 reea 0 0" "2035 2025 f085 reea 0 0" "2035 2025 n1 reea 0 0" "2035 2025 n1c reea 0 0" "2040 2025 nolimit reea 0 0" "2040 2025 n0 reea 0 0" "2040 2025 f085 reea 0 0" "2040 2025 n1 reea 0 0" "2040 2025 n1c reea 0 0" "2035 2015 nolimit reea 0 0" "2035 2015 n0 reea 0 0" "2035 2015 f085 reea 0 0" "2035 2015 n1 reea 0 0" "2035 2015 n1c reea 0 0" "2040 2015 nolimit reea 0 0" "2040 2015 n0 reea 0 0" "2040 2015 n1 reea 0 0" "2040 2015 n1c reea 0 0"
  bash $R $W $P "2035 2025 n0tdp reea 0 0" "2035 2025 f085tdp reea 0 0" "2035 2025 n1tdp reea 0 0" "2035 2025 n1ctdp reea 0 0" "2040 2025 n0tdp reea 0 0" "2040 2025 f085tdp reea 0 0" "2040 2025 n1tdp reea 0 0" "2040 2025 n1ctdp reea 0 0" "2035 2015 n1tdp reea 0 0" "2040 2015 n1tdp reea 0 0" "2035 2015 n1ctdp reea 0 0" "2040 2015 n1ctdp reea 0 0"
  SUFFIX=_tdpfull TDP_FILE=$T bash $R $W $P "2035 2025 n0tdp reea 0 0" "2035 2025 f085tdp reea 0 0" "2035 2025 n1tdp reea 0 0" "2035 2025 n1ctdp reea 0 0" "2040 2025 n0tdp reea 0 0" "2040 2025 f085tdp reea 0 0" "2040 2025 n1tdp reea 0 0" "2040 2025 n1ctdp reea 0 0" "2035 2015 n1tdp reea 0 0" "2035 2015 n1ctdp reea 0 0" "2040 2015 n1tdp reea 0 0" "2040 2015 n1ctdp reea 0 0"
  bash $R $W $P "2035 2025 n1 fleet 0 0" "2035 2025 n1c fleet 0 0" "2035 2025 n1 reea 1 0" "2035 2025 n1c reea 1 0" "2040 2025 n1c reea 1 0"
  bash $R $W $P "2035 2025 nolimit reea 0 1" "2035 2025 nolimit reea 0 2" "2040 2025 nolimit reea 0 1" "2040 2025 nolimit reea 0 2" "2035 2015 nolimit reea 0 1" "2035 2015 nolimit reea 0 2" "2040 2015 nolimit reea 0 1" "2040 2015 nolimit reea 0 2" "2035 2025 n1 reea 0 1" "2040 2025 n1 reea 0 1" "2035 2025 n1c reea 0 1" "2040 2025 n1c reea 0 1" "2035 2015 n1c reea 0 1" "2040 2015 n1c reea 0 1"
  for tag in ff deep; do
    bash $R $C7 engine_$tag "2035 2025 nolimit reea 0 0" "2035 2025 n0 reea 0 0" "2035 2025 n1c reea 0 0" "2040 2025 nolimit reea 0 0" "2040 2025 n0 reea 0 0" "2040 2025 n1c reea 0 0" "2040 2025 n1 reea 0 0" "2035 2015 nolimit reea 0 0" "2035 2015 n1c reea 0 0" "2040 2015 nolimit reea 0 0" "2040 2015 n1c reea 0 0" "2035 2015 n0 reea 0 0" "2040 2015 n0 reea 0 0"
    SUFFIX=_tdpfull TDP_FILE=$T bash $R $C7 engine_$tag "2035 2025 n1ctdp reea 0 0" "2040 2025 n1ctdp reea 0 0" "2035 2015 n1ctdp reea 0 0" "2040 2015 n1ctdp reea 0 0"
  done
  echo "queue4 runner A done $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt ) &
( # runner B: extendable corridors, free siting, demand split, the free mix
  SUFFIX=_ext10k TX_EXT=10000 DISC=0.08 bash $R $W $P "2035 2025 n1c reea 0 0" "2040 2025 n1c reea 0 0" "2035 2025 n1 reea 0 0" "2040 2025 n1 reea 0 0" "2035 2015 n1c reea 0 0" "2040 2015 n1c reea 0 0" "2035 2015 n1 reea 0 0" "2040 2015 n1 reea 0 0"
  SUFFIX=_ext21k TX_EXT=21700 DISC=0.08 bash $R $W $P "2035 2025 n1c reea 0 0" "2040 2025 n1c reea 0 0" "2035 2025 n1 reea 0 0" "2040 2025 n1 reea 0 0"
  SUFFIX=_tdpfull_ext10k TDP_FILE=$T TX_EXT=10000 DISC=0.08 bash $R $W $P "2035 2025 n1ctdp reea 0 0" "2040 2025 n1ctdp reea 0 0"
  SUFFIX=_sitefree SITE_FREE=1 bash $R $W $P "2035 2025 n0 reea 0 0" "2035 2025 n1 reea 0 0" "2035 2025 n1c reea 0 0" "2035 2025 n1tdp reea 0 0" "2040 2025 n1c reea 0 0"
  SUFFIX=_sitefree_ext10k SITE_FREE=1 TX_EXT=10000 DISC=0.08 bash $R $W $P "2035 2025 n1 reea 0 0" "2035 2025 n1c reea 0 0"
  SUFFIX=_tdpfull_sitefree TDP_FILE=$T SITE_FREE=1 bash $R $W $P "2035 2025 n1ctdp reea 0 0"
  SUFFIX=_bld DEMAND_SPLIT=bld bash $R $W $P "2035 2025 n1 reea 0 0" "2035 2025 nolimit reea 0 0" "2035 2025 n1c reea 0 0"
  SUFFIX=_mix_control MIX=1 MIX_INTEG=1 bash $R $W $P "2035 2025 nolimit reea 0 1" "2040 2025 nolimit reea 0 1" "2035 2015 nolimit reea 0 1" "2040 2015 nolimit reea 0 1"
  SUFFIX=_mix_ext10k MIX=1 MIX_INTEG=0 TX_EXT=10000 DISC=0.08 bash $R $W $P "2035 2025 n1c reea 0 1" "2040 2025 n1c reea 0 1" "2035 2015 n1c reea 0 1" "2040 2015 n1c reea 0 1" "2035 2025 n1 reea 0 1" "2040 2025 n1 reea 0 1"
  SUFFIX=_mix_n1c_fixedcorr MIX=1 MIX_INTEG=1 bash $R $W $P "2035 2025 n1c reea 0 1" "2040 2025 n1c reea 0 1"
  SUFFIX=_tdpfull_mix_ext10k TDP_FILE=$T MIX=1 MIX_INTEG=0 TX_EXT=10000 DISC=0.08 bash $R $W $P "2035 2025 n1ctdp reea 0 1" "2040 2025 n1ctdp reea 0 1"
  SUFFIX=_tdpfull_mix_fixed TDP_FILE=$T MIX=1 MIX_INTEG=1 bash $R $W $P "2035 2025 n1ctdp reea 0 1"
  SUFFIX=_mix_control_caps MIX=1 MIX_INTEG=1 MIX_CAP=wind:30000,pv:20000,batt:20000 bash $R $W $P "2035 2025 nolimit reea 0 1"
  for tag in ff deep; do
    SUFFIX=_ext10k TX_EXT=10000 DISC=0.08 bash $R $C7 engine_$tag "2035 2025 n1c reea 0 0" "2040 2025 n1c reea 0 0" "2040 2015 n1c reea 0 0" "2035 2015 n1c reea 0 0"
    SUFFIX=_mix_ext10k MIX=1 MIX_INTEG=0 TX_EXT=10000 DISC=0.08 bash $R $C7 engine_$tag "2035 2025 n1c reea 0 1" "2040 2025 n1c reea 0 1"
  done
  echo "queue4 runner B done $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt ) &
wait; echo "queue4 done $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
