#!/bin/bash
# 738 option check: the rebuilt table's cases, the floor by design minimum and the run's-accounting options, 25 days, 2035, weather 2025.
S=/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad; W=$S/wt-05f; T=$S/v2test; PY=$S/pyenv/bin/python; D=$S/engine_final_2035_wy2025.json
export CORR_FILE=$S/corridors_v2.json
echo "test_738 pid $$ start $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
DAYS=25 $PY $S/sc/pypsa_net.py $D $W nm1 reea $T/H_nm1.json 0 0 > $T/H_nm1.log 2>&1; echo "H nm1 rc=$?" >> $S/run_net_progress.txt
DAYS=25 $PY $S/sc/pypsa_net.py $D $W thermal reea $T/H_thermal.json 0 0 > $T/H_thermal.log 2>&1; echo "H thermal rc=$?" >> $S/run_net_progress.txt
DAYS=25 TDP_FILE=$S/tdp_lines_v2.json $PY $S/sc/pypsa_net.py $D $W nm1tdp reea $T/H_nm1tdp.json 0 0 > $T/H_nm1tdp.log 2>&1; echo "H nm1tdp rc=$?" >> $S/run_net_progress.txt
DAYS=25 TX_EXT=10000 DISC=0.071 $PY $S/sc/pypsa_net.py $D $W nm1 reea $T/H_ext.json 0 0 > $T/H_ext.log 2>&1; echo "H ext rc=$?" >> $S/run_net_progress.txt
DAYS=25 SITE_FREE=1 $PY $S/sc/pypsa_net.py $D $W nm1 reea $T/H_sitefree.json 0 0 > $T/H_sitefree.log 2>&1; echo "H sitefree rc=$?" >> $S/run_net_progress.txt
DAYS=25 $PY $S/sc/pypsa_net.py $D $W nm1 reea $T/H_floor.json 0 1 > $T/H_floor.log 2>&1; echo "H floor rc=$?" >> $S/run_net_progress.txt
DAYS=25 MIX=1 MIX_INTEG=1 GAS_INTEG=1 WIND_CAPE_MW=1580 PV_CREDIT_MW=14306 $PY $S/sc/pypsa_net.py $D $W nolimit reea $T/H_runacct.json 0 1 > $T/H_runacct.log 2>&1; echo "H runacct rc=$?" >> $S/run_net_progress.txt
unset CORR_FILE; DAYS=25 $PY $S/sc/pypsa_net.py $D $W n1c reea $T/H_n1c_old.json 0 0 > $T/H_n1c_old.log 2>&1; echo "H n1c_old rc=$?" >> $S/run_net_progress.txt
echo "test_738 done $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
