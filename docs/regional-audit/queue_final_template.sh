#!/bin/bash
# Final-build queue template (7 Nov 2026, messages 762 (c) and 770 (c)). usage: bash queue_final_template.sh <dump prefix> <suffix tag>
#   e.g. bash queue_final_template.sh engine_lc _lc   (after the chain's dump has written <prefix>_2035_wy2025.json and <prefix>_2040_wy2025.json)
# On the table of record (corridors_v3.json, area_map_v3.json, tdp_lines_v3.json), weather 2025, fixed build: the 738 (b) main cases (N-1 once, limits
# only, the TDP's lines, corridors priced at R10,000 and R21,700, free siting, the commitment floor), then 762 (b)'s two fixes with the TDP's lines
# (the LP's own lithium sited freely, and corridors at R21,700) for 2035 and 2040 in 3-hour blocks against a block base, the corridor fix hourly too.
# Resumable. One build per call; run the three builds as three jobs, at most three solvers at a time (user, message 744).
S=/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad; R=$S/sc/run_net.sh; W=$S/wt-05f; P=${1:?dump prefix}; T=${2:?suffix tag}
export CORR_FILE=$S/corridors_v3.json AREA_MAP=$S/area_map_v3.json
echo "queue_final $P pid $$ start $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
for y in 2035 2040; do
  [ -s $S/${P}_${y}_wy2025.json ] || { echo "queue_final: no dump ${P}_${y}_wy2025.json" >> $S/run_net_progress.txt; continue; }
  bash $R $W $P "$y 2025 nolimit reea 0 0"
  SUFFIX=${T}_v3 bash $R $W $P "$y 2025 nm1 reea 0 0" "$y 2025 thermal reea 0 0"
  TDP_FILE=$S/tdp_lines_v3.json SUFFIX=${T}_v3tdp bash $R $W $P "$y 2025 nm1tdp reea 0 0"
  SUFFIX=${T}_v3_ext10k TX_EXT=10000 DISC=0.071 bash $R $W $P "$y 2025 nm1 reea 0 0"
  SUFFIX=${T}_v3_ext21k TX_EXT=21700 DISC=0.071 bash $R $W $P "$y 2025 nm1 reea 0 0"
  SUFFIX=${T}_v3_sitefree SITE_FREE=1 bash $R $W $P "$y 2025 nm1 reea 0 0"
  SUFFIX=${T}_v3 bash $R $W $P "$y 2025 nm1 reea 0 1"
  # 762 (b): the two fixes with the TDP's lines
  TDP_FILE=$S/tdp_lines_v3.json HSTEP=3 SUFFIX=${T}_v3tdp_h3 bash $R $W $P "$y 2025 nm1tdp reea 0 0"
  TDP_FILE=$S/tdp_lines_v3.json HSTEP=3 SUFFIX=${T}_v3tdp_battfree_h3 BATT_FREE=1 bash $R $W $P "$y 2025 nm1tdp reea 0 0"
  TDP_FILE=$S/tdp_lines_v3.json HSTEP=3 SUFFIX=${T}_v3tdp_ext21k_h3 TX_EXT=21700 DISC=0.071 bash $R $W $P "$y 2025 nm1tdp reea 0 0"
  TDP_FILE=$S/tdp_lines_v3.json SUFFIX=${T}_v3tdp_ext21k TX_EXT=21700 DISC=0.071 bash $R $W $P "$y 2025 nm1tdp reea 0 0"
done
echo "queue_final $P done $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
