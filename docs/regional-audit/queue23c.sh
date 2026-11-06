#!/bin/bash
# Queue 23c (7 Nov 2026, message 756 (c)): the reruns on the corrected corridor table (corridors_v3.json: every substation's area by the fleet file's
# boundary set, rsa_supply_regions.gpkg; the TDP file remapped the same way, tdp_lines_v3.json; the approved-record siting by the same areas, AREA_MAP).
# 23a: 738 (b)'s main cases for 2035; 23b: the same for 2040; 23c: 743 (a)'s 2040 free lithium in 3-hour blocks, with and without corridors priced at
# R21,700, with its block base, and the Gamma to Kappa sensitivity (corridors_v3gk.json) as fixed builds. Resumable.
S=/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad; R=$S/sc/run_net.sh; W=$S/wt-05f; P=engine_final
export CORR_FILE=$S/corridors_v3.json AREA_MAP=$S/area_map_v3.json
echo "queue23c pid $$ start $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
for y in 2035 2040; do CORR_FILE=$S/corridors_v3gk.json SUFFIX=_v3gk bash $R $W $P "$y 2025 nm1 reea 0 0"; done
HSTEP=3 SUFFIX=_v3_h3 bash $R $W $P "2040 2025 nm1 reea 0 0"
HSTEP=3 SUFFIX=_v3_battfree_h3 BATT_FREE=1 bash $R $W $P "2040 2025 nm1 reea 0 0"
HSTEP=3 SUFFIX=_v3_battfree_ext21k_h3 BATT_FREE=1 TX_EXT=21700 DISC=0.071 bash $R $W $P "2040 2025 nm1 reea 0 0"
echo "queue23c done $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
