#!/bin/bash
# Sixteenth queue (6 Nov 2026, message 739): (a) today's fleets (the 2025 and 2026 states, build 2026-11-04b dumps) on the rebuilt table, N-1 once
# and limits only, Koeberg on its calendar (a unit out on days 1:302 and 60:68, as 718 (a)); (c) corridors from today's network at R10,000 per MW-km
# limited to the km of 765 kV line the industry's rate allows (800 km a year from 2026 times the inter-area share of the planned lines' km), 2035 and 2040. Resumable.
S=/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad; R=$S/sc/run_net.sh; W=$S/wt-05f
export CORR_FILE=$S/corridors_v2.json
echo "queue16 pid $$ start $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
for P in engine_today_2025 engine_today_2026; do
  KOEBERG_OUT=1:302,60:68 SUFFIX=_v2_koeberg bash $R $W $P "$(echo $P | grep -o '20[0-9][0-9]') 2025 nm1 reea 0 0" "$(echo $P | grep -o '20[0-9][0-9]') 2025 thermal reea 0 0"
done
SHARE=$($S/pyenv/bin/python -c "import json; print(json.load(open('$S/tdp_km_share.json'))['share'])")
for y in 2035 2040; do
  KM=$($S/pyenv/bin/python -c "print(round(800*($y-2026)*$SHARE))")
  for KV in 765 400; do SUFFIX=_v2_ext10k_km${KM}_${KV}kv TX_EXT=10000 DISC=0.071 TX_KM_BUDGET=$KM TX_KM_KV=$KV bash $R $W engine_final "$y 2025 nm1 reea 0 0"; done
done
echo "queue16 done $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
