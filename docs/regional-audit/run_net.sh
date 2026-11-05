#!/bin/bash
# Resumable runner for the PyPSA network cases (message 717 (c)). usage: bash run_net.sh <worktree root> <dump prefix> "<y> <wy> <case> <siting> <losses> <coalmin>" ...
# Skips a job whose output JSON exists. Each job: <dump prefix>_<y>_wy<wy>.json -> net_<y>_wy<wy>_<case>_<siting>_l<losses>_c<coalmin>.json
S=/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad; ROOT=$1; PFX=$2; shift 2
echo "runner pid $$ start $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
for job in "$@"; do set -- $job; y=$1; wy=$2; case=$3; site=$4; L=$5; C=$6
  out=$S/net${PFX#engine}_${y}_wy${wy}_${case}_${site}_l${L}_c${C}${SUFFIX}.json
  if [ -s $out ]; then echo "skip $out" >> $S/run_net_progress.txt; continue; fi
  echo "$(date -u +%H:%M) start $y wy$wy $case $site l$L c$C" >> $S/run_net_progress.txt
  $S/pyenv/bin/python $S/sc/pypsa_net.py $S/${PFX}_${y}_wy${wy}.json $ROOT $case $site $out $L $C > ${out%.json}.log 2>&1
  echo "$(date -u +%H:%M) end rc=$? $(grep -m1 -E "objective" ${out%.json}.log | cut -c1-120)" >> $S/run_net_progress.txt
done
echo "runner pid $$ done $(date -u +%FT%H:%MZ)" >> $S/run_net_progress.txt
