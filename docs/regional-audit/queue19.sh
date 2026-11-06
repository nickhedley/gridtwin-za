#!/bin/bash
# Nineteenth queue (6 Nov 2026, message 727 (c) on the rebuilt table per 738 (f)): the free mix with corridors beyond the full TDP at R21,700 per MW-km
# (the plan's lines first, tdp_lines_v2.json, N-1 once, corridors at 0.071, the integration charge removed), 3-hour blocks, 2035 and 2040, weather 2025;
# then the Fossil-free 2040 free mix posed for that build (no open cycle, lithium held at the run's 56,017 MW / 480 GWh, siting free), 6-hour blocks. Resumable.
S=/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad; R=$S/sc/run_net.sh; W=$S/wt-05f; C7=$S/wt-c7base
export CORR_FILE=$S/corridors_v2.json
echo "queue19 pid $$ start $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
HSTEP=3 TDP_FILE=$S/tdp_lines_v2.json SUFFIX=_v2tdp_mix_ext21k_h3 MIX=1 MIX_INTEG=0 TX_EXT=21700 DISC=0.071 bash $R $W engine_final "2035 2025 nm1tdp reea 0 1" "2040 2025 nm1tdp reea 0 1"
HSTEP=6 SUFFIX=_v2_mix_ext10k_nogas_liheld_h6 MIX=1 MIX_INTEG=0 TX_EXT=10000 DISC=0.071 MIX_CAP=ocgt:0 MIX_MIN=batt:56017,battE:480000 bash $R $C7 engine_ff "2040 2025 nm1 reea 0 1"
echo "queue19 done $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
