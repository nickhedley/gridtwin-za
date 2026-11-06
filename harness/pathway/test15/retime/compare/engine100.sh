#!/bin/bash
# Message 748: the common 100-draw check (RESULTS 'The common 100-draw gate on the 7 Nov loops'), settings read from claude/c7-runs'
# final/README.md row for engine_loop_base_05h_k100.json (not retyped; SEED_BASE is pathcheck's own 71830529, as that entry states), on the
# 05j worktree, clean environment. Usage: engine100.sh <name> <pathway json> YEARS=<y,..>
NM=${1:?name}; IN=${2:?pathway json}; YO=${3:?YEARS=...}; D=/tmp/claude-0/-home-user-gridtwin-za/89044349-14ce-5480-b08a-321dc7b30183/scratchpad/fin
cd /home/user/gtza-retime/harness || exit 2
ROW=$(git show origin/claude/c7-runs:harness/pathway/final/README.md | grep '^| engine_loop_base_05h_k100.json ')
KV=$(echo "$ROW" | grep -oE '\b[A-Z][A-Z0-9_]*=[^ )|]+' | sed 's/,$//')
echo "$KV" | grep -qx 'K=100' || { echo "$(date -u +%FT%TZ) engine100 $NM: the row has no K=100" >> $D/engine100.txt; exit 2; }
echo "$(date -u +%FT%TZ) engine100 $NM from $IN, settings from the row: $(echo $KV) then $YO" >> $D/engine100.txt
env -i PATH="$PATH" HOME="$HOME" $KV $YO IN=$IN OUTC=$D/engine100_$NM.json nice -n 5 node --max-old-space-size=4096 pathcheck.js > $D/engine100_$NM.log 2>&1
echo "$(date -u +%FT%TZ) engine100 $NM rc=$? $(python3 -I -c "import json,sys; print('; '.join('%d %.2f (se %.2f; worst %.1f; runs %d)' % (r['y'], r['mean'], r['seMean'], r['worst'], r['nRuns']) for r in json.load(open(sys.argv[1]))))" $D/engine100_$NM.json 2>&1)" >> $D/engine100.txt
