#!/bin/bash
# Message 724 (c): a build re-costed in one LP. The one-stage pathway LP at 25 clustered days on claude/twin-retime build 05j with (a)'s
# settings (run (6)'s, the fin pass's), pass 1 (MAXP=1), every build fixed from IN (FIX_FROM, FIX_TO=2040): the fin pass's build and the
# two-stage central's build go through the same LP, so the objective gap is the builds' alone. Usage: recost.sh <name> <pathway json>
NM=${1:?name}; IN=${2:?pathway json}; D=/tmp/claude-0/-home-user-gridtwin-za/89044349-14ce-5480-b08a-321dc7b30183/scratchpad/fin
cd /home/user/gtza-retime/harness || exit 2; source out/tsr_central/settings.env
export HIGHS_OPTS='{"simplex_strategy": 2, "threads": 2}' TL=6900
echo "$(date -u +%FT%TZ) recost $NM from $IN, HIGHS_OPTS $HIGHS_OPTS" >> $D/recost.txt
env FIX_FROM=$IN FIX_TO=2040 REP_DAYS=25 REP_WEIGHTS=clustered STORAGE_LINK=1 MAXP=1 LPCACHE=$D/lpc_$NM OUT=$D/recost_$NM.json \
  nice -n 5 node --max-old-space-size=12288 pathway/pathway_perfail.js > $D/recost_$NM.log 2>&1
echo "$(date -u +%FT%TZ) recost $NM rc=$? $(python3 -I -c "import json,sys; d=json.load(open(sys.argv[1])); print('objective %.6f, verdict %s, key %s' % (d['objective'], d['verdict'], d['passLog'][0]['key']))" $D/recost_$NM.json 2>&1)" >> $D/recost.txt
