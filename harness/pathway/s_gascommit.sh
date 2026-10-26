#!/bin/bash
# s_gascommit (user, 26 Oct 2026, message 386 (a)): c6 with a committed first gas round forced into the build, the rest of the
# build re-optimised around it, engine check (twelve weather years by ten outage draws a year), judged against NTCSA's 20 GWh.
# Settings, each with its default (IRP 2025 Table 1's 3,000 MW of IPP gas in 2030, plan p.31, until the Gas IPP Procurement
# Programme briefing gives figures):
#   GC_MW=3000     committed capacity, MW
#   GC_YEAR=2030   commissioning year (in service for the whole year, as every build in the model)
#   GC_TECH=ccgt   ccgt (combined cycle) or opencycle
#   GC_FUEL=lng    lng or diesel (combined cycle on diesel is not a technology in the model)
# c6 is rerun beside it on the same checkout, so the comparison is like for like whatever the build stamp. About an hour for both
# (c6 alone: 9 minutes to solve and 9 to check on 25 Oct). Resumable: a finished run or check is skipped. Outputs, the log and
# the comparison table go to out/gascommit/ (LP caches in out/gascommit/lpcache_<run>, deleted once the run's check is written).
# Usage, from harness/ with the testroot link and node_modules in place (CLAUDE.md):
#   GC_MW=3000 GC_YEAR=2030 GC_TECH=ccgt GC_FUEL=lng nohup bash pathway/s_gascommit.sh > /dev/null 2>&1 &
set -u
cd "$(dirname "$0")/.." || exit 1
source pathway/env_c6.sh
MW=${GC_MW:-3000} YR=${GC_YEAR:-2030} TECH=${GC_TECH:-ccgt} FUEL=${GC_FUEL:-lng}
case "$TECH:$FUEL" in
  ccgt:lng) T=ccgt;;
  opencycle:lng) T=ocgt;;
  opencycle:diesel) T=ocgd;;
  *) echo "s_gascommit: GC_TECH=$TECH with GC_FUEL=$FUEL is not a technology in the model (ccgt:lng, opencycle:lng, opencycle:diesel)"; exit 1;;
esac
[[ "$MW" =~ ^[0-9]+$ && "$YR" =~ ^20[2-4][0-9]$ ]] || { echo "s_gascommit: GC_MW must be whole MW and GC_YEAR a year 2026-2040"; exit 1; }
[ -e testroot/index.html ] || { echo "s_gascommit: no testroot link (ln -s .. harness/testroot)"; exit 1; }
NAME=s_gascommit_${T}_${YR}_${MW}; O=out/gascommit; P=$O/progress.txt; mkdir -p $O
check(){ local n=$1
  for g in "a 2026,2027,2028,2029,2030" "b 2031,2032,2033,2034,2035" "c 2036,2037,2038,2039,2040"; do set -- $g
    [ -s $O/pathcheck_${n}_$1.json ] && continue
    env -i PATH="$PATH" HOME="$HOME" LNG=1 GRID=1 YEARS=$2 IN=$O/pathway_$n.json OUTC=$O/pathcheck_${n}_$1.json nice -n 10 node --max-old-space-size=4096 pathcheck.js > $O/pathcheck_${n}_$1.log 2>&1 &
  done; wait
  if [ -s $O/pathcheck_${n}_a.json ] && [ -s $O/pathcheck_${n}_b.json ] && [ -s $O/pathcheck_${n}_c.json ]; then
    rm -rf $O/lpcache_$n; echo "$(date -u +%H:%M) check $n done" >> $P
  else echo "$(date -u +%H:%M) check $n INCOMPLETE (see $O/pathcheck_${n}_*.log)" >> $P; fi; }
one(){ local name=$1 chg=$2 maxp=$3
  if [ ! -s $O/pathway_$name.json ]; then
    echo "$(date -u +%H:%M) start $name ($chg) MAXP=$maxp; free $(df -h . | awk 'NR==2{print $4}')" >> $P
    env $chg LPCACHE=$O/lpcache_$name MAXP=$maxp OUT=$O/pathway_$name.json TL=7200 timeout 14400 nice -n 10 node --max-old-space-size=8192 pathway/pathway_perfail.js > $O/$name.log 2>&1
    local rc=$?; echo "$(date -u +%H:%M) end $name rc=$rc $(grep -o 'done [a-z ]*[0-9]*s' $O/$name.log | tail -1)$([ -s $O/pathway_$name.json ] || echo ' NO OUTPUT')" >> $P
  fi
  [ -s $O/pathway_$name.json ] && check $name; return 0; }
echo "$(date -u +%H:%M) s_gascommit on $(git log --oneline -1 | cut -c1-60): $NAME (GAS_COMMIT=$T:$YR:$MW)" >> $P
one c6 "" 6 & one $NAME "GAS_COMMIT=$T:$YR:$MW" 3 & wait
node pathway/gascommit_table.js $O c6 $NAME > $O/table_$NAME.md && echo "$(date -u +%H:%M) DONE: $O/table_$NAME.md" >> $P
