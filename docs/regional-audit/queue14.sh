#!/bin/bash
# Fourteenth queue (6 Nov 2026, message 738 (b)): the main cases on the rebuilt corridor table (corridors_v2.json: voltage-specific St Clair ratings
# from the model's own line file, N-1 applied once), 2035 and 2040, weather 2025, fixed build, hourly, no commitment floor: today's corridors N-1 once
# (the central), thermal and loadability limits only (the sensitivity), the TDP's lines N-1 once (tdp_lines_v2.json: Gamma to Grassridge as two
# circuits, Eros at Harding in KwaZulu-Natal so its lines are not inter-area, Mercury to Umtu left out) and the with-Eros-and-Umtu range, corridors
# priced at R10,000 and R21,700 per MW-km at the run's transmission cost of capital (DISC 0.071), and free siting. Resumable.
S=/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad; R=$S/sc/run_net.sh; W=$S/wt-05f; P=engine_final
export CORR_FILE=$S/corridors_v2.json
echo "queue14 pid $$ start $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
for y in 2035 2040; do
  SUFFIX=_v2 bash $R $W $P "$y 2025 nm1 reea 0 0" "$y 2025 thermal reea 0 0"
  TDP_FILE=$S/tdp_lines_v2.json SUFFIX=_v2tdp bash $R $W $P "$y 2025 nm1tdp reea 0 0"
  TDP_FILE=$S/tdp_lines_v2_with.json SUFFIX=_v2tdpwith bash $R $W $P "$y 2025 nm1tdp reea 0 0"
  SUFFIX=_v2_ext10k TX_EXT=10000 DISC=0.071 bash $R $W $P "$y 2025 nm1 reea 0 0"
  SUFFIX=_v2_ext21k TX_EXT=21700 DISC=0.071 bash $R $W $P "$y 2025 nm1 reea 0 0"
  SUFFIX=_v2_sitefree SITE_FREE=1 bash $R $W $P "$y 2025 nm1 reea 0 0"
  SUFFIX=_v2 bash $R $W $P "$y 2025 nm1 reea 0 1"
done
echo "queue14 done $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
