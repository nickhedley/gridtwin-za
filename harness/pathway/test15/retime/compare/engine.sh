#!/bin/bash
# Message 724 (c): the engine check on the 05j worktree with the fin pass's engine settings, read from claude/c7-runs' final/README.md row
# for engine_fin_05h.json (not retyped), in a clean environment as chain_c7.sh runs pathcheck. Usage: engine.sh <name> <pathway json>
NM=${1:?name}; IN=${2:?pathway json}; D=/tmp/claude-0/-home-user-gridtwin-za/89044349-14ce-5480-b08a-321dc7b30183/scratchpad/fin
cd /home/user/gtza-retime/harness || exit 2
ROW=$(git show origin/claude/c7-runs:harness/pathway/final/README.md | grep '^| engine_fin_05h.json ')
KV=$(echo "$ROW" | grep -oE '\b[A-Z][A-Z0-9_]*=[^ )|]+' | sed 's/,$//')
echo "$(date -u +%FT%TZ) engine $NM from $IN, settings from the row: $KV" >> $D/engine.txt
env -i PATH="$PATH" HOME="$HOME" $KV IN=$IN OUTC=$D/engine_$NM.json nice -n 5 node --max-old-space-size=4096 pathcheck.js > $D/engine_$NM.log 2>&1
echo "$(date -u +%FT%TZ) engine $NM rc=$? $(python3 -I -c "import json,sys; print('; '.join('%d %.2f (se %.2f)' % (r['y'], r['mean'], r['seMean']) for r in json.load(open(sys.argv[1]))))" $D/engine_$NM.json 2>&1)" >> $D/engine.txt
