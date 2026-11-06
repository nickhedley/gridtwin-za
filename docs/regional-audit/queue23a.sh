#!/bin/bash
# Queue 23a (7 Nov 2026, message 756 (c)): the reruns on the corrected corridor table (corridors_v3.json: every substation's area by the fleet file's
# boundary set, rsa_supply_regions.gpkg; the TDP file remapped the same way, tdp_lines_v3.json; the approved-record siting by the same areas, AREA_MAP).
# 23a: 738 (b)'s main cases for 2035; 23b: the same for 2040; 23c: 743 (a)'s 2040 free lithium in 3-hour blocks, with and without corridors priced at
# R21,700, with its block base, and the Gamma to Kappa sensitivity (corridors_v3gk.json) as fixed builds. Resumable.
S=/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad; R=$S/sc/run_net.sh; W=$S/wt-05f; P=engine_final
export CORR_FILE=$S/corridors_v3.json AREA_MAP=$S/area_map_v3.json
echo "queue23a pid $$ start $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
y=2035
SUFFIX=_v3 bash $R $W $P "$y 2025 nm1 reea 0 0" "$y 2025 thermal reea 0 0"
TDP_FILE=$S/tdp_lines_v3.json SUFFIX=_v3tdp bash $R $W $P "$y 2025 nm1tdp reea 0 0"
TDP_FILE=$S/tdp_lines_v3_with.json SUFFIX=_v3tdpwith bash $R $W $P "$y 2025 nm1tdp reea 0 0"
SUFFIX=_v3_ext10k TX_EXT=10000 DISC=0.071 bash $R $W $P "$y 2025 nm1 reea 0 0"
SUFFIX=_v3_ext21k TX_EXT=21700 DISC=0.071 bash $R $W $P "$y 2025 nm1 reea 0 0"
SUFFIX=_v3_sitefree SITE_FREE=1 bash $R $W $P "$y 2025 nm1 reea 0 0"
SUFFIX=_v3 bash $R $W $P "$y 2025 nm1 reea 0 1"
echo "queue23a done $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
