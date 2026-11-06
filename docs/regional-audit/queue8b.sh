#!/bin/bash
# Eighth queue, runner B (6 Nov 2026, 02:58 UTC): queue7's remaining fixed-corridor and TDP free-mix cases on 3-hour blocks. Resumable.
S=/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad; R=$S/sc/run_net.sh; W=$S/wt-05f; P=engine_final; T=$S/tdp_lines_full.json
export HSTEP=3
echo "queue8b pid $$ start $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
SUFFIX=_mix_n1c_fixedcorr_h3 MIX=1 MIX_INTEG=1 bash $R $W $P "2040 2025 n1c reea 0 1"
SUFFIX=_tdpfull_mix_ext10k_h3 TDP_FILE=$T MIX=1 MIX_INTEG=0 TX_EXT=10000 DISC=0.08 bash $R $W $P "2035 2025 n1ctdp reea 0 1"
SUFFIX=_tdpfull_mix_fixed_h3 TDP_FILE=$T MIX=1 MIX_INTEG=1 bash $R $W $P "2035 2025 n1ctdp reea 0 1"
SUFFIX=_tdpfull_mix_ext10k_h3 TDP_FILE=$T MIX=1 MIX_INTEG=0 TX_EXT=10000 DISC=0.08 bash $R $W $P "2040 2025 n1ctdp reea 0 1"
echo "queue8b done $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
