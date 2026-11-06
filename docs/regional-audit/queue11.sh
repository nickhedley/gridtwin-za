#!/bin/bash
# Eleventh queue (6 Nov 2026, message 727 (c)): corridors beyond the full TDP at R21,700 per MW-km (the free mix, 3-hour blocks, 2035 and 2040), and the
# Fossil-free 2040 free mix posed for that build: no open cycle, the lithium held at the run's 56,017 MW / 480 GWh with its siting free, 6-hour blocks. Resumable.
S=/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad; R=$S/sc/run_net.sh; W=$S/wt-05f; C7=$S/wt-c7base; T=$S/tdp_lines_full.json
echo "queue11 pid $$ start $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
HSTEP=6 SUFFIX=_mix_ext10k_nogas_liheld_h6 MIX=1 MIX_INTEG=0 TX_EXT=10000 DISC=0.08 MIX_CAP=ocgt:0 MIX_MIN=batt:56017,battE:480000 bash $R $C7 engine_ff "2040 2025 n1c reea 0 1"
HSTEP=3 SUFFIX=_tdpfull_mix_ext21k_h3 TDP_FILE=$T MIX=1 MIX_INTEG=0 TX_EXT=21700 DISC=0.08 bash $R $W engine_final "2035 2025 n1ctdp reea 0 1" "2040 2025 n1ctdp reea 0 1"
echo "queue11 done $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
