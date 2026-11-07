#!/bin/bash
# Queue 24 (7 Nov 2026, message 762 (b)): on the table of record from 762 (corridors_v3.json, area_map_v3.json, tdp_lines_v3.json), 2040 with the TDP's
# lines, weather 2025, fixed build: the cheapest fix for Gauteng's 58 GWh of unserved energy two ways, the LP's own lithium sited freely and corridors
# at R21,700 per MW-km (the run's 0.071), each in 3-hour blocks against a block base at the same length, and the corridor case hourly as well. Resumable.
S=/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad; R=$S/sc/run_net.sh; W=$S/wt-05f; P=engine_final
export CORR_FILE=$S/corridors_v3.json AREA_MAP=$S/area_map_v3.json TDP_FILE=$S/tdp_lines_v3.json
echo "queue24 pid $$ start $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
HSTEP=3 SUFFIX=_v3tdp_h3 bash $R $W $P "2040 2025 nm1tdp reea 0 0"
HSTEP=3 SUFFIX=_v3tdp_ext21k_h3 TX_EXT=21700 DISC=0.071 bash $R $W $P "2040 2025 nm1tdp reea 0 0"
HSTEP=3 SUFFIX=_v3tdp_battfree_h3 BATT_FREE=1 bash $R $W $P "2040 2025 nm1tdp reea 0 0"
SUFFIX=_v3tdp_ext21k TX_EXT=21700 DISC=0.071 bash $R $W $P "2040 2025 nm1tdp reea 0 0"
echo "queue24 done $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
