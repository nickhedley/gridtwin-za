#!/bin/bash
# Message 748, the builds final now: two stages (step_2035.json: every build to 2035 fixed) 2030, 2034, 2035; the fin pass 2030, 2034-2036,
# 2040; the baseline 2030 and 2040 (its 2034-2036 are on c7-runs at 100 draws). Two at a time beside the central.
F=/tmp/claude-0/-home-user-gridtwin-za/89044349-14ce-5480-b08a-321dc7b30183/scratchpad/fin
bash $F/engine100.sh ts_a /home/user/gtza-retime/harness/out/tsr_central/step_2035.json YEARS=2030,2034,2035 &
bash $F/engine100.sh fin $F/pathway_fin_05h.json YEARS=2030,2034,2035,2036,2040; wait
bash $F/engine100.sh base $F/pathway_loop_base_05h.json YEARS=2030,2040
