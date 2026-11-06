#!/bin/bash
# v2 full-year check on an extendable case (6 Nov 2026): the 2035 fixed build, one circuit dropped, corridors extendable at R10,000 per MW-km,
# hourly, on the corrected script; to be compared with the bidirectional-link result net_final_2035_wy2025_n1c_reea_l0_c0_ext10k.json (26,485 MW, R49.97bn).
S=/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad; W=$S/wt-05f; PY=$S/pyenv/bin/python; D=$S/engine_final_2035_wy2025.json; T=$S/v2test
echo "check_v2_ext pid $$ start $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
TX_EXT=10000 DISC=0.08 $PY $S/sc/pypsa_net.py $D $W n1c reea $T/E_v2.json 0 0 > $T/E_v2.log 2>&1; echo "E v2 rc=$?" >> $S/run_net_progress.txt
echo "check_v2_ext done $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
