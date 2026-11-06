#!/bin/bash
# option check (6 Nov 2026): 732's solar credit in the free mix; 731's lithium at the exits and the corridor budget; 25 days, 2035, weather 2025.
S=/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad; W=$S/wt-05f; T=$S/v2test; PY=$S/pyenv/bin/python; D=$S/engine_final_2035_wy2025.json
echo "test_731_732 pid $$ start $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
DAYS=25 MIX=1 MIX_INTEG=1 PV_CREDIT_MW=14306 $PY $S/sc/pypsa_net.py $D $W nolimit reea $T/G_credit.json 0 1 > $T/G_credit.log 2>&1; echo "G credit rc=$?" >> $S/run_net_progress.txt
DAYS=25 BATT_ADD="North West:250,Northern Cape:250,Hydra Central:250,Eastern Cape:250" BATT_ADD_H=4 $PY $S/sc/pypsa_net.py $D $W n1c reea $T/G_battadd.json 0 0 > $T/G_battadd.log 2>&1; echo "G battadd rc=$?" >> $S/run_net_progress.txt
DAYS=25 TX_EXT=10000 DISC=0.08 TX_BUDGET=1395000000 $PY $S/sc/pypsa_net.py $D $W n1c reea $T/G_budget.json 0 0 > $T/G_budget.log 2>&1; echo "G budget rc=$?" >> $S/run_net_progress.txt
echo "test_731_732 done $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
