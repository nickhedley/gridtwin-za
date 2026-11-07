#!/bin/bash
# Message 760 (a): the engine on one weather year, 100 draws on the same seeds (engine100.sh: the 100-draw gate's row, SEED_BASE 71830529),
# 2035 and 2040, for the fin pass build and the two-stage build: WEATHER=2025 (modelled 2025), metered (the LP's reference year, profiles.json)
# and metered_trk12 (metered with new tracking solar rescaled to its twelve-year mean; pathcheck's own variant for the tracker gain).
F=/tmp/claude-0/-home-user-gridtwin-za/89044349-14ce-5480-b08a-321dc7b30183/scratchpad/fin; W=/home/user/gtza-retime/harness/out/tsr_central
for wx in 2025 metered metered_trk12; do
  bash $F/engine100.sh fin_wx$wx $F/pathway_fin_05h.json "YEARS=2035,2040 WEATHER=$wx" &
  bash $F/engine100.sh ts_wx$wx $W/step_2040.json "YEARS=2035,2040 WEATHER=$wx"; wait
done
