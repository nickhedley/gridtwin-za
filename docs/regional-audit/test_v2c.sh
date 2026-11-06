#!/bin/bash
# v2 check C (6 Nov 2026): the free mix with corridors extendable (the create-model path with both the lithium and the corridor-pair constraints), 25 days, v1 against v2.
S=/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad; W=$S/wt-05f; T=$S/v2test; PY=$S/pyenv/bin/python; D=$S/engine_final_2035_wy2025.json
echo "test_v2c pid $$ start $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
for v in v1 v2; do
  scr=$S/sc/pypsa_net.py; [ $v = v2 ] && scr=$S/sc/pypsa_net_v2.py
  DAYS=25 MIX=1 MIX_INTEG=0 TX_EXT=10000 DISC=0.08 $PY $scr $D $W n1c reea $T/C_$v.json 0 1 > $T/C_$v.log 2>&1; echo "C $v rc=$?" >> $S/run_net_progress.txt
done
echo "test_v2c done $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
