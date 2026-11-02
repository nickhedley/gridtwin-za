#!/bin/bash
# c7 run set (user, 2 Nov 2026, messages 642-659; HANDOVER 'c7 launch plan', approved, message 656 (d)). Run from anywhere:
#   bash harness/pathway/chain_c7.sh <phase> [name ...]    phase 1: the central; later phases are added as they are reached.
# Outputs in harness/out (runs, checks) and harness/out/c7/progress.txt. Resumable, in pieces under 2 hours (the caller's
# run_in_background timeout): a finished pathway or check group is skipped, an interrupted pathway replays its finished passes from its
# LP cache (lpcache_<name>), and a run with no output after two attempts is reported as not run. Each run's LP cache is deleted once
# its check is written. At most two solves at a time; at least 5 GB free before each piece (message 646). PIDs to the session log.
REPO=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd); H=$REPO/harness; N=${N:-$H/out/c7}; P=$N/progress.txt
PIDLOG=${PIDLOG:-/dev/null}
cd $H; source pathway/env_c6a.sh; mkdir -p out $N
export GAS_FIRST=2035
# c7's common settings (HANDOVER 'c7 launch plan'): system strength, cost of capital blended, behind-the-meter stock, VPP, geyser
# control, coal costs and coal's carbon floor to 2030. Every run below takes them; a run's own change is added after them.
C7="SS=inertia SS_FC=reservecoal COC=blended BTM_STOCK=8 VPP=1 GY=1 COAL_FUEL_ESC=3 COAL_FOM_ESC=1.1 COMPLY=compromise COAL_CARBON_FLOOR=1"
free_gb(){ df -BG / | awk 'NR==2{gsub("G","",$4); print $4}'; }
[ "$(free_gb)" -ge 5 ] || { echo "$(date -u +%H:%M) STOP: under 5 GB free ($(free_gb) GB)" >> $P; exit 1; }
echo "$(date -u +%Y-%m-%dT%H:%MZ) chain_c7 piece, PID $$, on $(git -C $REPO log --oneline -1 | cut -c1-60), $(grep -o "BUILD_STAMP = .[0-9a-z-]*" $REPO/index.html)" >> $P
check(){ local n=$1
  for g in "a 2026,2027,2028,2029,2030" "b 2031,2032,2033,2034,2035" "c 2036,2037,2038,2039,2040"; do set -- $g
    [ -s out/pathcheck_${n}_$1.json ] && continue
    env -i PATH="$PATH" HOME="$HOME" LNG=1 GRID=1 SS_FC=reservecoal YEARS=$2 IN=out/pathway_$n.json OUTC=out/pathcheck_${n}_$1.json nice -n 10 node --max-old-space-size=4096 pathcheck.js > out/pathcheck_${n}_$1.log 2>&1 &
    echo "$(date -u +%FT%H:%MZ) c7 check $n $1 pid $!" >> $PIDLOG
  done; wait
  if [ -s out/pathcheck_${n}_a.json ] && [ -s out/pathcheck_${n}_b.json ] && [ -s out/pathcheck_${n}_c.json ]; then
    rm -rf lpcache_$n; echo "$(date -u +%H:%M) check $n done; free $(free_gb) GB" >> $P
  else echo "$(date -u +%H:%M) check $n INCOMPLETE (see out/pathcheck_${n}_*.log)" >> $P; fi; }
one(){ local name=$1 chg=$2 maxp=${3:-6} tl=${4:-7200}
  if [ ! -s out/pathway_$name.json ]; then
    local att=$N/attempts_$name k; k=$(cat $att 2>/dev/null || echo 0)
    if [ "$k" -ge 2 ]; then echo "$(date -u +%H:%M) NOT RUN $name: no output after $k attempts" >> $P; return 0; fi
    echo $((k+1)) > $att
    echo "$(date -u +%H:%M) start $name ($C7 $chg) MAXP=$maxp TL=$tl; free $(free_gb) GB" >> $P
    eval "env $C7 $chg LPCACHE=lpcache_$name MAXP=$maxp OUT=out/pathway_$name.json TL=$tl nice -n 10 node --max-old-space-size=8192 pathway/pathway_perfail.js" > out/$name.log 2>&1 &
    local pid=$!; echo "$(date -u +%FT%H:%MZ) c7 pathway $name pid $pid" >> $PIDLOG; wait $pid; local rc=$?
    echo "$(date -u +%H:%M) end $name rc=$rc$([ -s out/pathway_$name.json ] || echo ' NO OUTPUT (resumes from its LP cache next piece)')" >> $P
    # an interrupted piece is not an attempt that failed: it resumes from the cache
    [ -s out/pathway_$name.json ] || [ $rc -ne 0 ] || true
  fi
  [ -s out/pathway_$name.json ] && check $name; return 0; }
case "${1:-1}" in
  1) one c7 "" ;;
  *) echo "phase $1 not yet in this script" >> $P ;;
esac
echo "$(date -u +%H:%M) piece end" >> $P
