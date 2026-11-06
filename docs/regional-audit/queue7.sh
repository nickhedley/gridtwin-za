#!/bin/bash
# Seventh queue (6 Nov 2026): the free-mix cases of 718 (f) and 722 (a) on 3-hour blocks (HSTEP=3; the full year at 8,760 h did not
# converge in two hours of dual simplex), two runners. Resumable: a case whose JSON exists is skipped.
S=/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad; R=$S/sc/run_net.sh; W=$S/wt-05f; C7=$S/wt-c7base; P=engine_final; T=$S/tdp_lines_full.json
export HSTEP=3
echo "queue7 pid $$ start $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
( SUFFIX=_mix_control_h3 MIX=1 MIX_INTEG=1 bash $R $W $P "2035 2025 nolimit reea 0 1" "2040 2025 nolimit reea 0 1"
  SUFFIX=_mix_ext10k_h3 MIX=1 MIX_INTEG=0 TX_EXT=10000 DISC=0.08 bash $R $W $P "2035 2025 n1c reea 0 1" "2040 2025 n1c reea 0 1"
  SUFFIX=_mix_control_h3 MIX=1 MIX_INTEG=1 bash $R $W $P "2035 2015 nolimit reea 0 1" "2040 2015 nolimit reea 0 1"
  SUFFIX=_mix_ext10k_h3 MIX=1 MIX_INTEG=0 TX_EXT=10000 DISC=0.08 bash $R $W $P "2035 2015 n1c reea 0 1" "2040 2015 n1c reea 0 1"
  SUFFIX=_mix_control_caps_h3 MIX=1 MIX_INTEG=1 MIX_CAP=wind:30000,pv:20000,batt:20000 bash $R $W $P "2035 2025 nolimit reea 0 1"
  echo "queue7 runner A done $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt ) &
( SUFFIX=_mix_n1c_fixedcorr_h3 MIX=1 MIX_INTEG=1 bash $R $W $P "2035 2025 n1c reea 0 1" "2040 2025 n1c reea 0 1"
  SUFFIX=_tdpfull_mix_ext10k_h3 TDP_FILE=$T MIX=1 MIX_INTEG=0 TX_EXT=10000 DISC=0.08 bash $R $W $P "2035 2025 n1ctdp reea 0 1" "2040 2025 n1ctdp reea 0 1"
  SUFFIX=_tdpfull_mix_fixed_h3 TDP_FILE=$T MIX=1 MIX_INTEG=1 bash $R $W $P "2035 2025 n1ctdp reea 0 1"
  for tag in ff deep; do SUFFIX=_mix_ext10k_h3 MIX=1 MIX_INTEG=0 TX_EXT=10000 DISC=0.08 bash $R $C7 engine_$tag "2040 2025 n1c reea 0 1" "2035 2025 n1c reea 0 1"; done
  echo "queue7 runner B done $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt ) &
wait; echo "queue7 done $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
