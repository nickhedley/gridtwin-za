#!/bin/bash
# Thirteenth queue (6 Nov 2026, message 732): the free mix with the integration charge kept, with the freed-coal connection credit on the pathway rule
# (new solar up to the run's pool, 14,306 MW in 2035 and 22,333 MW in 2040, pays no integration charge; wind barred), 3-hour blocks, weather 2025.
# The control without the credit is net_final_<y>_wy2025_nolimit_reea_l0_c1_mix_control_h3.json. Resumable.
S=/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad; R=$S/sc/run_net.sh; W=$S/wt-05f; P=engine_final
export HSTEP=3
echo "queue13 pid $$ start $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
SUFFIX=_mix_control_credit_h3 MIX=1 MIX_INTEG=1 PV_CREDIT_MW=14306 bash $R $W $P "2035 2025 nolimit reea 0 1"
SUFFIX=_mix_control_credit_h3 MIX=1 MIX_INTEG=1 PV_CREDIT_MW=22333 bash $R $W $P "2040 2025 nolimit reea 0 1"
echo "queue13 done $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
