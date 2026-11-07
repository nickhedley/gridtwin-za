#!/bin/bash
# Message 767 (b): the 8 Nov key with the build LP's coal minimum down time and start-up lead time (claude/coal-mindown-lp 9e523ab,
# FIXED.bldCoalMinDownLP, COAL_STATE='{"bldCoalMinDownLP":1}'), against the key as it is (the switch off: the key's own pass-1 LP,
# c10bea45a9, byte for byte).
# Code: worktree WT (default /home/user/gtza-mdrun): claude/twin-retime 2d86faa + claude/c7-runs' key_on_twin-retime_2d86faa.patch +
# claude/coal-mindown-lp's index.html and pathway_perfail.js (checked 7 Nov: reversing the key patch gives the branch's files exactly),
# plus pathway/pathway_perfail_recost.js, a copy whose OPER_FROM guard accepts FIX_TO=Y (every build fixed, for the single-year LP).
# Settings read from claude/c7-runs' harness/pathway/final/key/solve_key.sh, not retyped: EXM, C7, BASE, case 'key', HIGHS_OPTS, env_c6a.sh,
# GAS_FIRST=2035; its engine check line (pathcheck K=20, 2030/2035/2040).
#   bash run_md.sh p1 <on|off>               the key's pass 1 (MAXP=1), one piece under 2 hours (RESUME, presolve off, basis kept; rerun
#                                            to resume), then the engine at 20 draws: <O>/p1_<on|off>.json, p1_<on|off>_eng.json
#   bash run_md.sh y365 <name> <build> <on|off>  year 2035 alone on its 365 days, every build fixed from <build> (STAGE2_YEAR=2035), the
#                                            switch as given; solved (2 threads, presolve on); curtailment, coal, lithium discharge, unserved
#   bash run_md.sh engm <name> <build>       the engine on the LP's own year alone (WEATHER=metered), 2035, 20 draws on the gate's seeds
# Progress, PIDs and results: <O>/progress.txt (O = <WT>/harness/out/md).
M=${1:?mode p1, y365 or engm}; WT=${WT:-/home/user/gtza-mdrun}; O=$WT/harness/out/md; P=$O/progress.txt; mkdir -p $O
ts(){ date -u +%FT%H:%M:%SZ; }
SK=$(cd /home/user/gridtwin-za && git show origin/claude/c7-runs:harness/pathway/final/key/solve_key.sh) || exit 2
eval "$(echo "$SK" | grep -E '^(EXM|C7|BASE)=')"
X=$(echo "$SK" | sed -n 's/^  key) *X="\(.*\)";;$/\1/p' | sed "s/\$EXM/$EXM/")
HO=$(echo "$SK" | grep -o "HIGHS_OPTS='{[^']*}'" | head -1 | sed 's/\\//g')
ENG=$(echo "$SK" | grep -o 'LNG=1 GRID=1 SS_FC=[a-z]* K=20 YEARS=[0-9,]*'); ENGX=$(echo "$SK" | grep -o 'CONG_OFF=1 WX_WINDCORR=1 nice' | sed 's/ nice//')
for v in EXM C7 BASE X HO ENG ENGX; do [ -n "${!v}" ] || { echo "$(ts) settings: $v not found in solve_key.sh" >> $P; exit 2; }; done
cd $WT/harness || exit 2; source pathway/env_c6a.sh >/dev/null 2>&1; export GAS_FIRST=2035
cs(){ [ "$1" = on ] && echo 'COAL_STATE={"bldCoalMinDownLP":1}' || echo 'COAL_STATE={"bldCoalMinDownLP":0}'; }
case $M in
p1)
  SW=${2:?on or off}; s=p1_$SW; T0=$(date +%s); DL=$(( T0 + ${PIECE_S:-6600} ))
  echo "$(ts) $s piece, shell PID $$, $(git log --oneline -1 | cut -c1-8) + $(git diff --stat | tail -1 | sed 's/^ *//'), $(cs $SW), deadline $(date -u -d @$DL +%H:%MZ), load $(cut -d' ' -f1-3 /proc/loadavg), memory free $(free -g | awk '/Mem/{print $7}')G" >> $P
  if [ ! -s $O/$s.json ]; then
    eval "env $C7 $BASE $X MAXP=1 '$(cs $SW)' SOLVER=native HIGHS_SOLVER=simplex $HO DUMP=0 LPCACHE=$O/lpc_$s OUT=$O/$s.json TL=7000 RESUME=1 JOB_DEADLINE=$DL nice -n 5 node --max-old-space-size=9000 pathway/pathway_perfail.js" >> $O/$s.log 2>&1 &
    N=$!; echo "$(ts) $s node PID $N" >> $P; wait $N; rc=$?
    echo "$(ts) $s pass 1 rc $rc $(grep -h 'LP key\|cache hit\|stopped at\|start from basis\|^done\|verdict\|objective' $O/$s.log | tail -3 | tr '\n' ' ' | cut -c1-300)" >> $P; fi
  if [ -s $O/$s.json ] && [ ! -s $O/${s}_eng.json ]; then
    env -i PATH="$PATH" HOME="$HOME" $ENG IN=$O/$s.json OUTC=$O/${s}_eng.json $ENGX nice -n 10 node --max-old-space-size=4096 pathcheck.js > $O/${s}_eng.log 2>&1 &
    N=$!; echo "$(ts) $s engine PID $N ($ENG $ENGX)" >> $P; wait $N; echo "$(ts) $s engine rc $?" >> $P; fi ;;
y365)
  NM=${2:?}; IN=${3:?}; SW=${4:?on or off}; Y=2035
  if [ ! -s $O/${NM}_pass1.lp ]; then
    eval "env $C7 $BASE $X '$(cs $SW)' FIX_FROM=$IN FIX_TO=$Y OPER_FROM=$Y HORIZON=$Y STAGE2_YEAR=$Y MAXP=1 LPCACHE=$O/lpc_$NM OUT=$O/$NM.json DUMP_LP=$O/$NM DUMP_STOP=1 nice -n 5 node --max-old-space-size=12288 pathway/pathway_perfail_recost.js" > $O/$NM.log 2>&1
    echo "$(ts) y365 $NM ($IN, $(cs $SW)) dump rc=$? $(grep -m1 'dumped LP' $O/$NM.log) $(grep -m1 -i 'error' $O/$NM.log | cut -c1-200)" >> $P; fi
  t0=$(date +%s); HIGHS_OPTS='{"simplex_strategy": 2, "threads": 2}' nice -n 5 python3 highs_native.py $O/${NM}_pass1.lp $O/${NM}_sol.json 6000 > $O/${NM}_solve.log 2>&1
  echo "$(ts) y365 $NM solve $(( $(date +%s) - t0 )) s $(python3 -I - $O/${NM}_sol.json $Y <<'EOF'
import json, sys
S = json.load(open(sys.argv[1])); Y = sys.argv[2]; t = {'crt': 0.0, 'gc': 0.0, 'bdis': 0.0, 'u': 0.0, 'sd': 0.0}
for k, v in S['Columns'].items():
    p = k.split('_')
    if len(p) == 4 and p[1] == Y and p[0] in t and int(p[2]) < 1000: t[p[0]] += v['Primal']
print('%s; calendar days: curtailment %.2f TWh, coal %.2f TWh, lithium discharge %.2f TWh, unserved %.3f GWh, coal taken off %.1f TWh-h' % (S['Status'], t['crt'] / 1e6, t['gc'] / 1e6, t['bdis'] / 1e6, t['u'] / 1e3, t['sd'] / 1e6))
EOF
)" >> $P ;;
engm)
  NM=${2:?}; IN=${3:?}
  env -i PATH="$PATH" HOME="$HOME" $(echo $ENG | sed 's/YEARS=[0-9,]*/YEARS=2035/') WEATHER=metered IN=$IN OUTC=$O/${NM}_engm.json $ENGX nice -n 10 node --max-old-space-size=4096 pathcheck.js > $O/${NM}_engm.log 2>&1 &
  N=$!; echo "$(ts) engm $NM engine PID $N (WEATHER=metered, 2035, K=20)" >> $P; wait $N
  echo "$(ts) engm $NM rc $? $(python3 -I -c "import json,sys; r=json.load(open(sys.argv[1]))[0]; print('curt %.2f TWh, coal %.2f TWh, unserved %.2f GWh (se %.2f), li %.2f TWh' % (r['curt'], r['coal'], r['mean'], r['seMean'], r['storeTWh']['li']))" $O/${NM}_engm.json 2>&1)" >> $P ;;
*) echo "mode: p1, y365 or engm" >&2; exit 2 ;;
esac
exit 0
