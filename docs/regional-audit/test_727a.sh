#!/bin/bash
# 727 (a) option check (6 Nov 2026): caps lifted, one bus on the national series, wind forced to the run's MW; 25 days, 2035, weather 2025.
S=/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad; W=$S/wt-05f; T=$S/v2test; PY=$S/pyenv/bin/python; D=$S/engine_final_2035_wy2025.json
echo "test_727a pid $$ start $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
DAYS=25 MIX=1 MIX_INTEG=1 MIX_NOCAP=1 $PY $S/sc/pypsa_net.py $D $W nolimit reea $T/F_nocap.json 0 1 > $T/F_nocap.log 2>&1; echo "F nocap rc=$?" >> $S/run_net_progress.txt
DAYS=25 MIX=1 MIX_INTEG=1 MIX_NAT=1 MIX_NOCAP=1 $PY $S/sc/pypsa_net.py $D $W nolimit reea $T/F_onebus.json 0 1 > $T/F_onebus.log 2>&1; echo "F onebus rc=$?" >> $S/run_net_progress.txt
DAYS=25 MIX=1 MIX_INTEG=1 MIX_MIN=wind:27246 $PY $S/sc/pypsa_net.py $D $W nolimit reea $T/F_runwind.json 0 1 > $T/F_runwind.log 2>&1; echo "F runwind rc=$?" >> $S/run_net_progress.txt
echo "test_727a done $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
