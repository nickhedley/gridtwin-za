#!/bin/bash
# Message 761: the 8 Nov key on gtza-key (fin basis 10a98e2 with k8 battery proposals 1-3, f3d, the same-area cap and new wind at 40%), the loop to its verdict, nice 5. A copy of solve_k8.sh.
# Finding 3 (review of 6 Nov): the baseline with the metered tracking twin rescaled by month to the engine twelve-year means, on gtza-f3, one pass (P1=1), nice 13. A copy of solve_rpcap.sh.
# Message 720 (b): full loops on the fin basis (claude/twin-retime 10a98e2, build 2026-11-05h: every 707 and 710 change, curtailment price 0,
# coal's part-load factor, the verdict rule VERDICT_TOPUP from env_c6.sh) for 704 (c)'s candidates, with run (6)'s settings otherwise (c7's
# settings, env_c6a.sh, GAS_FIRST=2035, 25 clustered days, linking, CONG_OFF=1, WX_WINDCORR=1), the loop to MAXP=6 (env_c6.sh), each case
# on extreme days recomputed on this build for its own reference (scratchpad loops/ext_*.json; extract.js + extremes.py, sources c7, Deep,
# Fossil-free). Cases: base (metered 2025, new wind 42.0%); w3724 (base with WIND_CORR=bw6); mix (REP_REF=wind:metered,solar:2025); m24
# (metered 2024, PROFILES_LOCAL, local only). One piece per job, under 2 hours (RESUME, presolve off, valid basis kept; passes already
# solved replay from the LP cache); rerun to resume. Then the engine check (pathcheck.js on the same worktree, K=20, 2030/2035/2040).
# P1=1 (message 721 (b)): pass 1 alone (MAXP=1), replayed from the loop's LP cache once the loop has solved it, written as <case>_p1, with
# the same engine check: each loop's pass 1 as it lands, and the baseline's against the fin pass (the day list alone).
#   bash solve_loop.sh <base|w3724|mix|m24>      P1=1 bash solve_loop.sh <case>
S=/tmp/claude-0/-home-user-gridtwin-za/cd2ebea5-fdee-51da-b34b-eb3574ed8e65/scratchpad; O=$S/loops; P=$O/progress.txt; c=$1
if [ "$P1" = 1 ]; then s=${c}_p1; XP="MAXP=1"; else s=$c; XP=""; fi
EXM=20,159,161,162,163,187,194,195,196,218,358,359,360; EXX=20,159,161,162,163,187,194,195,196,214,218,358,359; EX24=0,40,42,43,44,175,176,177,201,202,203,346
case $c in
  base)  X="REP_REF=metered REP_EXTREMES=$EXM";;
  w3724) X="REP_REF=metered REP_EXTREMES=$EXM WIND_CORR=bw6";;
  keychk) X="REP_REF=metered REP_EXTREMES=$EXM";;
  key)    X="REP_REF=metered REP_EXTREMES=$EXM WIND_CORR=cf0.40";;
  mix)   X="REP_REF=wind:metered,solar:2025 REP_EXTREMES=$EXX";;
  m24)   X="REP_REF=metered REP_EXTREMES=$EX24 PROFILES_LOCAL=$S/ref2024/profiles_2024_local.json";;
  *) echo "case: base, w3724, mix or m24" >&2; exit 2;;
esac
H=/home/user/gtza-key/harness; cd $H; T0=$(date +%s)
until [ $(awk '/MemAvailable/{print int($2/1048576)}' /proc/meminfo) -ge 6 ]; do sleep 60; [ $(( $(date +%s) - T0 )) -gt 3000 ] && { echo "$(date -u +%FT%H:%MZ) $s gave up waiting for memory" >> $P; exit 0; }; done
DL=$(( T0 + ${PIECE_S:-6600} ))
echo "$(date -u +%FT%H:%MZ) $s loop piece, shell PID $$, $(git log --oneline -1 | cut -c1-8) ($X), load $(cut -d' ' -f1-3 /proc/loadavg)" >> $P
source pathway/env_c6a.sh; export GAS_FIRST=2035
C7="SS=inertia SS_FC=reservecoal COC=blended BTM_STOCK=8 VPP=1 GY=1 COAL_FUEL_ESC=3 COAL_FOM_ESC=1.1 COMPLY=compromise COAL_CARBON_FLOOR=1"
BASE="REP_WEIGHTS=clustered REP_DAYS=25 STORAGE_LINK=1 WX_WINDCORR=1 CONG_OFF=1"
if [ ! -s $O/$s.json ]; then
  eval "env $C7 $BASE $X $XP SOLVER=native HIGHS_SOLVER=simplex HIGHS_OPTS='{\"simplex_strategy\": 2, \"threads\": 2, \"presolve\": \"off\"}' DUMP=0 LPCACHE=$O/lpc_$c OUT=$O/$s.json TL=7000 RESUME=1 JOB_DEADLINE=$DL nice -n 5 node --max-old-space-size=9000 pathway/pathway_perfail.js" >> $O/$s.log 2>&1
  echo "$(date -u +%FT%H:%MZ) $s loop rc $? $(grep -h 'pass [0-9]\|stopped at\|cache hit\|start from basis\|^done\|verdict' $O/$s.log | tail -3 | tr '\n' ' ' | cut -c1-300)" >> $P; fi
if [ -s $O/$s.json ] && [ ! -s $O/${s}_eng.json ]; then
  env -i PATH="$PATH" HOME="$HOME" LNG=1 GRID=1 SS_FC=reservecoal K=20 YEARS=2030,2035,2040 IN=$O/$s.json OUTC=$O/${s}_eng.json CONG_OFF=1 WX_WINDCORR=1 nice -n 10 node --max-old-space-size=4096 pathcheck.js > $O/${s}_eng.log 2>&1
  echo "$(date -u +%FT%H:%MZ) $s engine rc $?" >> $P; fi
