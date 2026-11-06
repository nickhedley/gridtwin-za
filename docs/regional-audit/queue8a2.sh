#!/bin/bash
# Eighth queue, runner A2 (6 Nov 2026): queue8a's shorter cases first (the capped control, the weather-2015 controls and
# extendable mixes), so a two-hour window is not spent on the long 2040 extendable mix, which runs alone in queue8d. Resumable.
S=/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad; R=$S/sc/run_net.sh; W=$S/wt-05f; P=engine_final
export HSTEP=3
echo "queue8a2 pid $$ start $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
SUFFIX=_mix_control_caps_h3 MIX=1 MIX_INTEG=1 MIX_CAP=wind:30000,pv:20000,batt:20000 bash $R $W $P "2035 2025 nolimit reea 0 1"
SUFFIX=_mix_control_h3 MIX=1 MIX_INTEG=1 bash $R $W $P "2035 2015 nolimit reea 0 1"
SUFFIX=_mix_control_h3 MIX=1 MIX_INTEG=1 bash $R $W $P "2040 2015 nolimit reea 0 1"
SUFFIX=_mix_ext10k_h3 MIX=1 MIX_INTEG=0 TX_EXT=10000 DISC=0.08 bash $R $W $P "2035 2015 n1c reea 0 1"
SUFFIX=_mix_ext10k_h3 MIX=1 MIX_INTEG=0 TX_EXT=10000 DISC=0.08 bash $R $W $P "2040 2015 n1c reea 0 1"
echo "queue8a2 done $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
