#!/bin/bash
# v2 check (6 Nov 2026): the one-way-pair script against the bidirectional one on 25-day cases; A the no-limits free mix 2035, B the extendable fixed build 2035.
S=/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad; W=$S/wt-05f; T=$S/v2test; PY=$S/pyenv/bin/python; D=$S/engine_final_2035_wy2025.json
echo "test_v2 pid $$ start $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
for v in v1 v2; do
  scr=$S/sc/pypsa_net.py; [ $v = v2 ] && scr=$S/sc/pypsa_net_v2.py
  DAYS=25 MIX=1 MIX_INTEG=1 $PY $scr $D $W nolimit reea $T/A_$v.json 0 1 > $T/A_$v.log 2>&1; echo "A $v rc=$?" >> $S/run_net_progress.txt
  DAYS=25 TX_EXT=10000 DISC=0.08 $PY $scr $D $W n1c reea $T/B_$v.json 0 0 > $T/B_$v.log 2>&1; echo "B $v rc=$?" >> $S/run_net_progress.txt
done
echo "test_v2 done $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
