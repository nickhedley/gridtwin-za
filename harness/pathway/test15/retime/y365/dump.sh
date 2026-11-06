#!/bin/bash
# Message 750 (a), (c): a single-year LP of year Y written out, not solved (DUMP_STOP=1), with (a)'s settings; every build to Y fixed from IN.
# Runs pathway_perfail_recost.js, a copy whose OPER_FROM guard also accepts FIX_TO=Y (every build fixed; the running central reads the original).
# DAYS=365: year Y on all 365 days (STAGE2_YEAR=Y); DAYS=25: on the 25 clustered days. Usage: dump.sh <name> <pathway or fixed json> <Y> <365|25>
NM=${1:?}; IN=${2:?}; Y=${3:?}; DD=${4:?}; FT=${5:-$Y}; D=/tmp/claude-0/-home-user-gridtwin-za/89044349-14ce-5480-b08a-321dc7b30183/scratchpad/y365
cd /home/user/gtza-retime/harness || exit 2; source out/tsr_central/settings.env; unset HIGHS_OPTS
S2=""; [ "$DD" = 365 ] && S2="STAGE2_YEAR=$Y"
env FIX_FROM=$IN FIX_TO=$FT OPER_FROM=$Y HORIZON=$Y $S2 REP_DAYS=25 REP_WEIGHTS=clustered STORAGE_LINK=1 MAXP=1 LPCACHE=$D/lpc_$NM OUT=$D/$NM.json \
  DUMP_LP=$D/$NM DUMP_STOP=1 nice -n 5 node --max-old-space-size=12288 pathway/pathway_perfail_recost.js > $D/$NM.log 2>&1
echo "$(date -u +%FT%TZ) dump $NM ($IN, $Y, $DD days) rc=$? $(grep -m1 'dumped LP' $D/$NM.log) $(grep -m1 -i 'error' $D/$NM.log | cut -c1-200)" >> $D/dump.txt
