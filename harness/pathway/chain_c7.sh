#!/bin/bash
# c7 run set (user, 2 Nov 2026, messages 642-659; HANDOVER 'c7 launch plan', approved, message 656 (d)). Run from anywhere:
#   bash harness/pathway/chain_c7.sh <phase> [name ...]    phase 1: the central; later phases are added as they are reached.
# Outputs in harness/out (runs, checks) and harness/out/c7/progress.txt. Resumable, in pieces under 2 hours (the caller's
# run_in_background timeout): a finished pathway or check group is skipped, an interrupted pathway replays its finished passes from its
# LP cache (lpcache_<name>), and a run with no output after four pieces is reported as not run. Each run's LP cache is deleted once
# its check is written. At most two solves at a time; at least 5 GB free before each piece (message 646). PIDs to the session log.
REPO=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd); H=$REPO/harness; N=${N:-$H/out/c7}; P=$N/progress.txt
PIDLOG=${PIDLOG:-/dev/null}
cd $H; source pathway/env_c6a.sh; mkdir -p out $N
export GAS_FIRST=2035
# c7's common settings (HANDOVER 'c7 launch plan'): system strength, cost of capital blended, behind-the-meter stock, VPP, geyser
# control, coal costs and coal's carbon floor to 2030. Every run below takes them; a run's own change is added after them.
C7="SS=inertia SS_FC=reservecoal COC=blended BTM_STOCK=8 VPP=1 GY=1 COAL_FUEL_ESC=3 COAL_FOM_ESC=1.1 COMPLY=compromise COAL_CARBON_FLOOR=1"
# Each piece has a deadline (PIECE_S seconds, default 6,600, under the caller's 2-hour limit): a solve gets the time left less 15 minutes
# (pathway_perfail.js RESUME=1 JOB_DEADLINE), keeps its basis if it stops there, and the next piece resumes it; no new run starts with
# under 20 minutes left. Sensitivities take 3 passes and the central 6, as c6e's chain did.
DEADLINE=$(( $(date +%s) + ${PIECE_S:-6600} ))
left(){ echo $(( DEADLINE - $(date +%s) )); }
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
one(){ local name=$1 chg=$2 maxp=${3:-3} tl=${4:-7200}
  if [ ! -s out/pathway_$name.json ]; then
    if [ "$(left)" -lt 1200 ]; then echo "$(date -u +%H:%M) $name left to the next piece (under 20 minutes left)" >> $P; return 0; fi
    local att=$N/attempts_$name k; k=$(cat $att 2>/dev/null || echo 0)
    if [ "$k" -ge 4 ]; then echo "$(date -u +%H:%M) NOT RUN $name: no output after $k pieces" >> $P; return 0; fi
    echo $((k+1)) > $att
    echo "$(date -u +%H:%M) start $name ($C7 $chg) MAXP=$maxp TL=$tl; free $(free_gb) GB" >> $P
    eval "env $C7 $chg RESUME=1 JOB_DEADLINE=$DEADLINE LPCACHE=lpcache_$name MAXP=$maxp OUT=out/pathway_$name.json TL=$tl nice -n 10 node --max-old-space-size=8192 pathway/pathway_perfail.js" > out/$name.log 2>&1 &
    local pid=$!; echo "$(date -u +%FT%H:%MZ) c7 pathway $name pid $pid" >> $PIDLOG; wait $pid; local rc=$?
    echo "$(date -u +%H:%M) end $name rc=$rc$([ -s out/pathway_$name.json ] || echo ' NO OUTPUT (resumes from its LP cache next piece)')" >> $P
  fi
  [ -s out/pathway_$name.json ] && check $name; return 0; }
pair(){ one "$1" "$2" & one "$3" "$4" & wait; }
# A two-slot queue (phase 2 on): each entry "name|change|maxp"; the next starts when a slot frees, so a long solve does not hold the
# other slot idle; entries already done are skipped by one(); none starts with under 20 minutes left.
queue(){ local e; for e in "$@"; do IFS='|' read -r qn qc qm <<< "$e"
    while [ "$(jobs -rp | wc -l)" -ge 2 ]; do wait -n; done
    [ "$(left)" -lt 1200 ] && { echo "$(date -u +%H:%M) queue: $qn and later left to the next piece" >> $P; break; }
    one "$qn" "$qc" "${qm:-3}" &
  done; wait; }
irpcheck(){ local f=$1
  for g in "a 2026,2027,2028,2029,2030" "b 2031,2032,2033,2034,2035" "c 2036,2037,2038,2039,2040"; do set -- $g
    [ -s $N/irp/pathcheck_${f}_$1.json ] && continue
    env -i PATH="$PATH" HOME="$HOME" LNG=1 GRID=1 SS_FC=reservecoal YEARS=$2 IN=$N/irp/pathway_$f.json OUTC=$N/irp/pathcheck_${f}_$1.json nice -n 10 node --max-old-space-size=4096 pathcheck.js > $N/irp/pathcheck_${f}_$1.log 2>&1 &
  done; wait; echo "$(date -u +%H:%M) IRP check $f: $(ls $N/irp/pathcheck_${f}_?.json 2>/dev/null | wc -l)/3 groups" >> $P; }
# Deep decarbonisation without gas at 40 Mt on c7's settings (phase 2): calibrated on the engine's 2035 CO2 as run_deep_cal.sh UNIFORM=1
# (every year 2035-40 at one optimiser cap; cap += 40 - engine 2035 until within 0.5 Mt, at most 5 rounds), from c6e's final cap 36.382;
# the final round is copied to s_deep40nogas_c7 for the reviewer pack. Log: $N/cal_deep40.txt.
# deep [base name] [extra env] [first cap]: Deep at 40 Mt, calibrated as above; base name s_deep40nogas (the pack's) by default; the
# senior contact's costs as s_deep40nogas_contact (message 654 (a)), from c7 Deep's final cap.
deep(){ local B=${1:-s_deep40nogas} X=${2:-} T=40 cap=${3:-${DEEP_CAP0:-36.382}} L=$N/cal_${1:-s_deep40nogas}.txt
  [ "$B" = s_deep40nogas ] && L=$N/cal_deep40.txt
  [ -s out/pathcheck_${B}_c7_c.json ] && return 0
  for r in 1 2 3 4 5; do local n=${B}_r${r}_c7 o; o=out/pathcheck_${B}_r${r}_c7_y2035.json
    if [ -s $o ]; then local e; e=$(python3 -c "import json;print(round([x for x in json.load(open('$o')) if x['y']==2035][0]['co2'],3))")
      if python3 -c "import sys; sys.exit(0 if abs($e-$T)<=0.5 else 1)"; then
        cp out/pathway_$n.json out/pathway_${B}_c7.json; echo "final round $r" >> $L; check ${B}_c7; return 0; fi
      cap=$(python3 -c "print(round($cap+($T-$e),3))"); continue; fi
    local Y="2035:$cap,2036:$cap,2037:$cap,2038:$cap,2039:$cap,2040:$cap"
    if [ ! -s out/pathway_$n.json ]; then
      echo "$(date -u +%H:%M) start $n (target $T, cap $cap)" >> $P
      if [ "$(left)" -lt 1200 ]; then echo "$(date -u +%H:%M) $n left to the next piece" >> $P; return 0; fi
      eval "env $C7 $X RESUME=1 JOB_DEADLINE=$DEADLINE SOLVER=native GAS_CAP=0 OCGD=1 PACE=grid LI_CAP=4000 LI_EH=8 IA_TOTAL=5000 CO2_ELASTIC=50000 CO2CAP=22.809:2035 CO2CAP_YEARS=$Y LPCACHE=lpcache_$n MAXP=6 OUT=out/pathway_$n.json TL=7200 nice -n 10 node --max-old-space-size=8192 pathway/pathway_perfail.js" > out/$n.log 2>&1 &
      local pid=$!; echo "$(date -u +%FT%H:%MZ) c7 pathway $n pid $pid" >> $PIDLOG; wait $pid
      echo "$(date -u +%H:%M) end $n$([ -s out/pathway_$n.json ] || echo ' NO OUTPUT (resumes next piece)')" >> $P
      [ -s out/pathway_$n.json ] || return 0
    fi
    env -i PATH="$PATH" HOME="$HOME" LNG=1 GRID=1 SS_FC=reservecoal YEARS=2035 IN=out/pathway_$n.json OUTC=$o nice -n 10 node --max-old-space-size=4096 pathcheck.js > out/pathcheck_${n}_y2035.log 2>&1
    local e; e=$(python3 -c "import json;print(round([x for x in json.load(open('$o')) if x['y']==2035][0]['co2'],3))"); echo "round $r cap $cap engine2035 $e target $T" >> $L
    if python3 -c "import sys; sys.exit(0 if abs($e-$T)<=0.5 else 1)"; then
      cp out/pathway_$n.json out/pathway_${B}_c7.json; echo "final round $r" >> $L; check ${B}_c7; return 0; fi
    cap=$(python3 -c "print(round($cap+($T-$e),3))")
  done; echo "not within 0.5 Mt after 5 rounds" >> $L; }
# The non-solve items the pack reads (phase 2): the IRP 2025 pair from c7, c7_irpdem, s_be6_c7, s_irpgas_c7 and s_be7_c7; the gas floor
# alone on c7's build (gasFloor.engine=1, 51% on up to 6,000 MW of CCGT, 2030-40, as c6e's); c7's build with design minimums from 2028
# (YEARS 2027-29); the 2025 replay and validate_external on this commit.
extras(){ mkdir -p $N/irp
  if [ -s out/pathway_c7_irpdem.json ] && [ -s out/pathway_s_be6_c7.json ] && [ -s out/pathway_s_irpgas_c7.json ] && [ -s out/pathway_s_be7_c7.json ]; then
    [ -s $N/irp/pathway_irp2025_c7.json ] || (OUTDIR=$H/out CENTRAL=c7 IRPDEM=c7_irpdem BASEGAP=0 python3 -I pathway/irp2025/build_irp_c6.py $N/irp/pathway_irp2025_c7.json >> $P 2>&1)
    # The IRP 2025 build has no VPP or geyser enrolment (build decisions of the optimiser, not in the plan): zero in every year; the
    # behind-the-meter stock, an input, stays.
    for f in $N/irp/pathway_irp2025_c7.json $N/irp/pathway_irp2025_c7_irpdem.json; do [ -s $f ] && python3 -c "import json,sys;f=sys.argv[1];P=json.load(open(f));[s.update({'vppGWh':s.get('vppGWh',0) if 'vppGWh' in s else 0,'gyMW':s.get('gyMW',0) if 'gyMW' in s else 0}) for s in P['sched'].values()];json.dump(P,open(f,'w'),indent=1)" $f; done
    irpcheck irp2025_c7 & irpcheck irp2025_c7_irpdem & wait; fi
  [ -s out/pathway_s_gasfloor_c7.json ] || python3 -c "import json;P=json.load(open('out/pathway_c7.json'));P['gasFloor']={'on':0,'engine':1,'pct':51,'mw':6000,'from':2030,'to':2040};P['note']='c7 build with the 51% gas minimum alone (gasFloor.engine=1), the optimiser not run';json.dump(P,open('out/pathway_s_gasfloor_c7.json','w'))"
  [ "$(left)" -ge 1500 ] && check s_gasfloor_c7
  if [ ! -s $N/pathcheck_c7_dmin2028.json ] && [ "$(left)" -ge 1200 ]; then
    python3 -c "import json;P=json.load(open('out/pathway_c7.json'));P['coal']['coalMslDesignFromYear']=2028;P['note']='c7 build with coal design minimums from 2028';json.dump(P,open('$N/pathway_c7_dmin2028.json','w'))"
    env -i PATH="$PATH" HOME="$HOME" LNG=1 GRID=1 SS_FC=reservecoal YEARS=2027,2028,2029 IN=$N/pathway_c7_dmin2028.json OUTC=$N/pathcheck_c7_dmin2028.json nice -n 10 node --max-old-space-size=4096 pathcheck.js > $N/pathcheck_c7_dmin2028.log 2>&1; fi
  [ -s $N/replay2025_c7.txt ] || node pathway/c6e/replay2025_29b.js testroot > $N/replay2025_c7.txt 2>&1
  [ -s $N/validate_external_c7.txt ] || node validate_external.js testroot > $N/validate_external_c7.txt 2>&1
  echo "$(date -u +%H:%M) extras: irp $(ls $N/irp/pathcheck_irp2025_c7*_?.json 2>/dev/null | wc -l)/6, dmin2028 $([ -s $N/pathcheck_c7_dmin2028.json ] && echo done), replay $([ -s $N/replay2025_c7.txt ] && echo done), external $([ -s $N/validate_external_c7.txt ] && echo done)" >> $P; }
case "${1:-1}" in
  1) one c7 "" 6 ;;
  2) # every run the reviewer pack reads, on c7's settings (HANDOVER 'c7 launch plan', phase 2), two at a time
     queue "c7_irpdem|DEMAND=index:$REPO/harness/pathway/irp2025/index_irp2025fig2_c6.json" "s_nogas_c7|GAS_CAP=0 OCGD=0" \
       "s_nogas_dsl_c7|GAS_CAP=0 OCGD=1" \
       "s_irpgas_c7|GAS_FIRST=2032 GAS_FORCE=2029:3000,2030:3000 GAS_MIN=2032-2034:1250,2035:1000,2036:1250,2037:1500,2038-2040:1250 GAS_LIFT=1 GASFLOOR=1 GASFLOOR_VINT=2029-2030 TCAP_YR=2029:4000,2030:4000" \
       "s_be6_c7|STOR_CUM=2026:144,2027:294,2028:909,2029:3524,2030:3724,2031:3924,2032:4124,2033:4324,2034:4524,2035:4724,2036:5224,2037:5724,2038:6224,2039:6724,2040:7224" \
       "s_be7_c7|NUC_FORCE=2036:1250,2037:1250,2038:1350,2039:1350" "s_gas2032_c7|GAS_FIRST=2032" "s_cocplan_c7|COC=planning" \
       "s_cocprivate_c7|COC=private" "s_coalsustain_c7|COAL_FOM_ADD=500" "s_cocunblended_c7|COC=central" "s_allbids_c7|COC=allbids" \
       "s_blendedhigh_c7|COC=blendedhigh" "s_ff2040_c7|SOLVER=native PACE=grid LI_CAP=4000 LI_EH=8 IA_TOTAL=5000 FOSSIL_END=2039|6"
     [ "$(left)" -ge 1800 ] && extras
     [ "$(left)" -ge 1200 ] && deep ;;
  # Phase 2 split in two jobs (3 Nov 2026): 2n the no-gas run alone, 2x the extras then Deep, so neither waits on the other.
  # s_nogas_c7 resumed from its saved basis fails in native HiGHS ('Solve error', twice): the partial basis is removed and the run
  # solved by interior point with crossover (HIGHS_SOLVER=ipm), which reaches the same optimum faster on this LP; recorded as its Method.
  2n) rm -f lpcache_s_nogas_c7/*.partial.basis.json; one s_nogas_c7 "GAS_CAP=0 OCGD=0 HIGHS_SOLVER=ipm" ;;
  2x) [ "$(left)" -ge 1800 ] && extras; [ "$(left)" -ge 1200 ] && deep ;;
  # Phase 3 (HANDOVER 'c7 launch plan'): the new c7 sensitivities. 3: those not on the age curve; 3age: the age curve's runs, after
  # Medupi, Kusile and Komati's commissioning years are verified (message 656 (c)).
  3) queue "s_gfm1891_c7|GFM_H=thermal" "s_rocof05_c7|ROCOF=0.5" "s_rocof15_c7|ROCOF=1.5" \
       "s_vpppart_c7|VPP_COST_CASE=participant" "s_gyrot_c7|GY_MODE=rotation" \
       "s_coalfuel0_c7|COAL_FUEL_ESC=0" "s_coalfuel5_c7|COAL_FUEL_ESC=5" "s_comply_full_c7|COMPLY=full" \
       "s_carbongross_c7|COAL_CARBON_FLOOR=0" "s_carbontreasury_c7|COAL_CARBON_FLOOR=0 CARBON_PATH=treasury" \
       "s_ff2040novrfb_c7|SOLVER=native PACE=grid LI_CAP=4000 LI_EH=8 IA_TOTAL=5000 FOSSIL_END=2039 VRFB_OFF=1|6" ;;
  # The senior contact's stack first (message 663 (c)), then his Deep, then the other age-curve runs.
  3age) CONTACT="COAL_FUEL_ESC=5 COAL_AGE=1 COAL_FOM_ADD=500 COMPLY=full COAL_CARBON_FLOOR=0 CARBON_PATH=treasury"
     one s_contact_c7 "$CONTACT" & deep s_deep40nogas_contact "$CONTACT" 37.538 & wait
     queue "s_coalage_c7|COAL_AGE=1" "s_ageingcoal_c7|COAL_FUEL_ESC=5 COAL_AGE=1 COAL_FOM_ADD=500 COMPLY=full" \
       "s_ff2040_contact_c7|SOLVER=native PACE=grid LI_CAP=4000 LI_EH=8 IA_TOTAL=5000 FOSSIL_END=2039 COAL_FUEL_ESC=5 COAL_AGE=1 COAL_FOM_ADD=500 COMPLY=full COAL_CARBON_FLOOR=0 CARBON_PATH=treasury|6" ;;
  # Phase 4 (messages 618-620; SOURCES, our choices for the runs on the outlook's inputs): the outlook's High demand, 3.30% a year from
  # the model's own 2026 level to 2040 (DEMAND=rate:3.30); (ii) adds coal availability 66% in 2027 to 70% from 2031, Avon and Dedisa
  # out after 2030 and 0.75 GW a year of REIPPPP retired in 2033-36 (summed: 3 GW). 'No new gas' as the pack's no-gas line: GAS_CAP=0
  # with diesel peakers allowed (OCGD=1).
  4) M_EAF="2027:66,2028:67,2029:68,2030:69,2031:70,2032:70,2033:70,2034:70,2035:70,2036:70,2037:70,2038:70,2039:70,2040:70"
     M_RE="2033:375/325/50,2034:375/325/50,2035:375/325/50,2036:375/325/50"
     queue "s_mtsao_hi_nogas_c7|DEMAND=rate:3.30 GAS_CAP=0 OCGD=1" "s_mtsao_hi_c7|DEMAND=rate:3.30" \
       "s_mtsao_ref_nogas_c7|DEMAND=rate:3.30 COAL_EAF_PATH=$M_EAF AVDED_OFF_AFTER=2030 REIPPP_RETIRE=$M_RE GAS_CAP=0 OCGD=1" \
       "s_mtsao_ref_c7|DEMAND=rate:3.30 COAL_EAF_PATH=$M_EAF AVDED_OFF_AFTER=2030 REIPPP_RETIRE=$M_RE" \
       "s_mtsao_refkeep_nogas_c7|DEMAND=rate:3.30 COAL_EAF_PATH=$M_EAF AVDED_OFF_AFTER=2030 GAS_CAP=0 OCGD=1" \
       "s_mtsao_refkeep_c7|DEMAND=rate:3.30 COAL_EAF_PATH=$M_EAF AVDED_OFF_AFTER=2030" ;;
  # 665 (b): Fossil-free without vanadium and without new iron-air (IA_OFF, so no IA_TOTAL).
  ffnolds) queue "s_ff2040nolds_c7|SOLVER=native PACE=grid LI_CAP=4000 LI_EH=8 FOSSIL_END=2039 VRFB_OFF=1 IA_OFF=1|6" ;;
  *) echo "phase $1 not yet in this script" >> $P ;;
esac
echo "$(date -u +%H:%M) piece end" >> $P
