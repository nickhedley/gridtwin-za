#!/bin/bash
# Not to run (user, 28 Oct 2026, message 462): the solar central stays on BW7's awarded tariffs and c6c stays the headline set.
# Kept unused. It assumes FIXED.bldPvCase 'bw6' as the page default, which main does not have.
# Run from anywhere: bash harness/pathway/chain_c6d.sh. Outputs in harness/out (runs, checks) and harness/out/c6d (progress.txt,
# IRP pair, restart counts); set N to put the latter elsewhere. Needs node, python3 and harness/node_modules (npm install jsdom highs).
# c6d central run set (user, 28 Oct 2026, message 458): c6c's settings and run set on build 2026-10-27g, where new utility solar is
# costed from BW6's compliant tracker bids (FIXED.bldPvCase 'bw6', R16,786/kW), as wind is from BW6's; c6c (solar at BW7's
# tariff-implied R10,998/kW) becomes the low-solar-cost sensitivity. c6c's set (message 443): c6b's settings on build 2026-10-27f,
# where the coal minimum down time is 24 h (FIXED.coalMinDownH) and the practice floor 0.715; c6b (UC_FLEET's 4 h) is a sensitivity.
# c6b's set (messages 406, 416, 423, 424 and 428 (b)): c6a's settings (env_c6a.sh), wind on BW6 bids and rooftop at R10,500 DC;
# its share of the year in service (harness/pathway/env_c6a.sh). Every run plans to NTCSA's 20 GWh unless it sets STD. s_gas2032 is
# replaced by s_gas2030 (gas from 2030, as c6 had; 391 (c)); the strict and NEM standards only for c6d, s_nogas and s_nogas_dsl (391 (d)).
# Order (message 428 (b)): c6d; the three IRP-schedule runs and c6d at IRP 2025's demand, then the IRP pair's build files and checks;
# s_disc5 at 5% real and the IRP build at the same rate (message 461);
# the wind cases and the IRP pair at each; the carbon cases and the IRP pair on each; the IRP pair at a high nuclear charge; the rest
# of the set, short solves first; solves over 30 minutes last; restart counts. Two solves at a time (15 GB). Resumable: a finished
# run or check is skipped; each run's LP cache is deleted once its check is written.
REPO=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd); H=$REPO/harness; N=${N:-$H/out/c6d}; P=$N/progress.txt
cd $H; source pathway/env_c6a.sh; mkdir -p out $N/irp $N/ret
echo "$(date -u +%Y-%m-%dT%H:%M)Z chain start, PID $$, on $(git -C $REPO log --oneline -1 | cut -c1-70), $(grep -o "BUILD_STAMP = .[0-9a-z-]*" $REPO/index.html)" >> $P
check(){ local n=$1 extra=$2
  for g in "a 2026,2027,2028,2029,2030" "b 2031,2032,2033,2034,2035" "c 2036,2037,2038,2039,2040"; do set -- $g
    [ -s out/pathcheck_${n}_$1.json ] && continue
    eval "env -i PATH=\"\$PATH\" HOME=\"\$HOME\" LNG=1 GRID=1 $extra YEARS=$2 IN=out/pathway_$n.json OUTC=out/pathcheck_${n}_$1.json nice -n 10 node --max-old-space-size=4096 pathcheck.js" > out/pathcheck_${n}_$1.log 2>&1 &
  done; wait
  if [ -s out/pathcheck_${n}_a.json ] && [ -s out/pathcheck_${n}_b.json ] && [ -s out/pathcheck_${n}_c.json ]; then
    rm -rf lpcache_$n; echo "$(date -u +%H:%M) check $n done; free $(df -h /home/user | awk 'NR==2{print $4}')" >> $P
  else echo "$(date -u +%H:%M) check $n INCOMPLETE (see out/pathcheck_${n}_*.log)" >> $P; fi; }
one(){ local name=$1 chg=$2 maxp=${3:-3} tl=${4:-7200}
  if [ ! -s out/pathway_$name.json ]; then
    # A run that has started twice without output (each container restart kills it) is reported as not run (message 428 (b)).
    local att=$N/attempts_$name k; k=$(cat $att 2>/dev/null || echo 0)
    if [ "$k" -ge 2 ]; then echo "$(date -u +%H:%M) NOT RUN $name: no output after $k attempts (container restarts or the time limit)" >> $P; return 0; fi
    echo $((k+1)) > $att
    echo "$(date -u +%H:%M) start $name ($chg) MAXP=$maxp TL=$tl; free $(df -h /home/user | awk 'NR==2{print $4}')" >> $P
    eval "env $chg LPCACHE=lpcache_$name MAXP=$maxp OUT=out/pathway_$name.json TL=$tl timeout $((tl*2)) nice -n 10 node --max-old-space-size=8192 pathway/pathway_perfail.js" > out/$name.log 2>&1
    local rc=$?; echo "$(date -u +%H:%M) end $name rc=$rc $(grep -o 'done [a-z ]*[0-9]*s\|stall stop[^\n]*\|pass limit[^\n]*' out/$name.log | tail -1)$([ -s out/pathway_$name.json ] || echo ' NO OUTPUT')" >> $P
  fi
  local extra=""; case "$chg" in *GAS_CAPEX=*) extra="GAS_CAPEX=${chg#*GAS_CAPEX=}"; extra="${extra%% *}";; esac
  [ -s out/pathway_$name.json ] && check $name "$extra"; return 0; }
pair(){ one "$1" "$2" & one "$3" "$4" & wait; }
irpcheck(){ local f=$1
  for g in "a 2026,2027,2028,2029,2030" "b 2031,2032,2033,2034,2035" "c 2036,2037,2038,2039,2040"; do set -- $g
    [ -s $N/irp/pathcheck_${f}_$1.json ] && continue
    env -i PATH="$PATH" HOME="$HOME" LNG=1 GRID=1 YEARS=$2 IN=$N/irp/pathway_$f.json OUTC=$N/irp/pathcheck_${f}_$1.json nice -n 10 node --max-old-space-size=4096 pathcheck.js > $N/irp/pathcheck_${f}_$1.log 2>&1 &
  done; wait; echo "$(date -u +%H:%M) IRP pair check $f: $(ls $N/irp/pathcheck_${f}_?.json 2>/dev/null | wc -l)/3 groups" >> $P; }
nuccheck(){ local f=$1 acap=$2   # the IRP pair at a high nuclear capital charge (message 415 (a)): engine check only
  for g in "a 2026,2027,2028,2029,2030" "b 2031,2032,2033,2034,2035" "c 2036,2037,2038,2039,2040"; do set -- $g
    [ -s $N/irp/pathcheck_${f}_nuc${acap}_$1.json ] && continue
    env -i PATH="$PATH" HOME="$HOME" LNG=1 GRID=1 NUC_ACAP=$acap YEARS=$2 IN=$N/irp/pathway_$f.json OUTC=$N/irp/pathcheck_${f}_nuc${acap}_$1.json nice -n 10 node --max-old-space-size=4096 pathcheck.js > $N/irp/pathcheck_${f}_nuc${acap}_$1.log 2>&1 &
  done; wait; echo "$(date -u +%H:%M) IRP pair nuclear check $f at R$acap/kW-yr: $(ls $N/irp/pathcheck_${f}_nuc${acap}_?.json 2>/dev/null | wc -l)/3 groups" >> $P; }
ret(){ local n=$1 in=$2; [ -s $N/ret/ret_$n.json ] && return 0
  env -i PATH="$PATH" HOME="$HOME" LNG=1 GRID=1 K=2 IN=$in OUTC=$N/ret/pc_$n.json OUTR=$N/ret/ret_$n.json nice -n 10 node --max-old-space-size=4096 pathcheck_ret.gen.js > $N/ret/ret_$n.log 2>&1
  echo "$(date -u +%H:%M) restart count $n exit $?" >> $P; }
echo "$(date -u +%H:%M) c6d chain (re)start on $(git -C $REPO log --oneline -1 | cut -c1-60)" >> $P
one c6d "" 6
pair s_irpgas_c6d "GAS_FORCE=2029:3000,2030:3000 GAS_MIN=2032-2034:1250,2035:1000,2036:1250,2037:1500,2038-2040:1250 GAS_LIFT=1 GASFLOOR=1 GASFLOOR_VINT=2029-2030 TCAP_YR=2029:4000,2030:4000" s_be6_c6d "STOR_CUM=2026:144,2027:294,2028:909,2029:3524,2030:3724,2031:3924,2032:4124,2033:4324,2034:4524,2035:4724,2036:5224,2037:5724,2038:6224,2039:6724,2040:7224"
pair s_be7_c6d "NUC_FORCE=2036:1250,2037:1250,2038:1350,2039:1350" c6d_irpdem "DEMAND=index:$REPO/harness/pathway/irp2025/index_irp2025fig2_c6.json"
[ -s $N/irp/pathway_irp2025_c6d.json ] || (OUTDIR=$H/out CENTRAL=c6d IRPDEM=c6d_irpdem BASEGAP=0 python3 -I pathway/irp2025/build_irp_c6.py $N/irp/pathway_irp2025_c6d.json >> $P 2>&1)
irpcheck irp2025_c6d & irpcheck irp2025_c6d_irpdem & wait
echo "$(date -u +%H:%M) IRP PAIR CHECKS DONE" >> $P
# Message 461: s_disc5, c6d at a 5% real discount rate for every technology (DISC=0.05 sets BLD_DISC, which is both the annuity
# rate of every capital charge, new plant and existing coal's station capital, and the optimiser's weight on each year; pathcheck.js
# applies the run file's disc to the engine check's capital charges; the tables weight the engine's annual costs at 8% as for every
# run). Lives unchanged (BLD_LIFE: wind and solar 25 years; a 30-year life is a page constant, not a harness setting, so it waits
# for after the note). The IRP build checked at the same rate. Placed here so it lands early.
one s_disc5_c6d "DISC=0.05"
[ -s $N/irp/pathway_irp2025_c6d_disc5.json ] || [ ! -s out/pathway_s_disc5_c6d.json ] || python3 -I -c "
import json,sys; P=json.load(open(sys.argv[1])); R=json.load(open(sys.argv[3])); assert abs(R.get('disc',0)-0.05)<1e-9, R.get('disc')
assert P.get('disc') in (None,0.08), P.get('disc'); P['disc']=R['disc']
P['note461']='Copy of pathway_irp2025_c6d.json at the 5% real discount rate of s_disc5_c6d (message 461).'
json.dump(P,open(sys.argv[2],'w'))" $N/irp/pathway_irp2025_c6d.json $N/irp/pathway_irp2025_c6d_disc5.json out/pathway_s_disc5_c6d.json
[ -s $N/irp/pathway_irp2025_c6d_disc5.json ] && irpcheck irp2025_c6d_disc5
echo "$(date -u +%H:%M) DISCOUNT CASE DONE" >> $P
pair s_windlow_c6d "WIND_CASE=central" s_windhigh_c6d "WIND_CASE=high"   # message 416 (d): the IRP gap at both wind cost cases
for c in low high; do k=$( [ $c = low ] && echo central || echo high ); [ -s $N/irp/pathway_irp2025_c6d_wind$c.json ] || [ ! -s out/pathway_s_wind${c}_c6d.json ] || python3 -I -c "
import json,sys; P=json.load(open(sys.argv[1])); R=json.load(open(sys.argv[4])); assert R.get('windCase')==sys.argv[3]; P['windCase']=sys.argv[3]; P['capex2026']=R['capex2026']
P['note416']='Copy of pathway_irp2025_c6d.json with windCase '+sys.argv[3]+' and capex2026 from the wind run of that case (message 416 (d)).'
json.dump(P,open(sys.argv[2],'w'))" $N/irp/pathway_irp2025_c6d.json $N/irp/pathway_irp2025_c6d_wind$c.json $k out/pathway_s_wind${c}_c6d.json; done
irpcheck irp2025_c6d_windlow & irpcheck irp2025_c6d_windhigh & wait
echo "$(date -u +%H:%M) WIND CASES DONE" >> $P
# Message 423 (c): s_carbontreasury, our assumption built on Treasury's stated aim (allowances cut in equal steps to none from
# 2031, then a straight line to US$120/t nominal in 2050, about R1,231/t in 2026 rands); message 424 (c): s_carbonhold, the same
# to 2030, then the 2030 rate in law held (R410.5/t). Each with the IRP build checked on the same carbon path.
pair s_carbontreasury_c6d "CARBON_PATH=treasury" s_carbonhold_c6d "CARBON_PATH=law2031"
for c in treasury:treasury hold:law2031; do k=${c%%:*}; v=${c#*:}; [ -s $N/irp/pathway_irp2025_c6d_carbon$k.json ] || [ ! -s out/pathway_s_carbon${k}_c6d.json ] || python3 -I -c "
import json,sys; P=json.load(open(sys.argv[1])); R=json.load(open(sys.argv[4])); assert R.get('carbonPath')==sys.argv[3]; P['carbonPath']=sys.argv[3]
P['note423']='Copy of pathway_irp2025_c6d.json on carbon path '+sys.argv[3]+' (messages 423 (c), 424 (c)).'
json.dump(P,open(sys.argv[2],'w'))" $N/irp/pathway_irp2025_c6d.json $N/irp/pathway_irp2025_c6d_carbon$k.json $v out/pathway_s_carbon${k}_c6d.json; done
irpcheck irp2025_c6d_carbontreasury & irpcheck irp2025_c6d_carbonhold & wait
echo "$(date -u +%H:%M) CARBON CASES DONE" >> $P
# Message 415 (a): the IRP pair checked at a high nuclear capital charge, R16,800/kW-yr (USD 12,000/kW on acapNuclear's basis; the
# value waits on the nuclear reconciliation, message 417 (b), and stays out of the pack until confirmed).
nuccheck irp2025_c6d 16800 & nuccheck irp2025_c6d_irpdem 16800 & wait
# Message 428 (b): the 20 GWh set and the standard runs, short solves first; solves over 30 minutes last.
pair null_c6d "" s_gascapex25_c6d "GAS_CAPEX=43706"
pair s_gas2030_c6d "GAS_FIRST=2030" s_imp_c6d "IMP_END=2040"
pair s_demlowflat_c6d "DEMAND=rate:0" s_demlowm1_c6d "DEMAND=rate:-1"
# s_mindn24 is dropped: 24 h is the central from c6c (message 443); the c6b set (UC_FLEET's 4 h) is the down-time sensitivity.
one s_coalpractice_c6d "COAL_STATE='{\"coalMslDesignFromYear\":2041}'"
pair s_rate48_c6d "COAL_STATE='{\"bldCoalCommitHours\":48}'" s_spotoil_c6d "COAL_STATE='{\"coalStartFuel\":\"spot\"}'"
pair s_wearp75_c6d "COAL_STATE='{\"coalStartWear\":\"p75\"}'" s_koeberg_winter_c6d "NUC_SHAPE='[1.4859869721690109,1.3233883976907597,1.0703906157535057,0.8662924051076811,0.6634941830646963,0.6625941909550381,0.6646941725442406,0.6101946503482708,0.7746932081691338,0.7827931371560578,1.544486459296795,1.5773861708609676]'"
pair s_ntcsa_both_c6d "OC_CF_MAX=0.06" s_nogas_dsl_c6d "GAS_CAP=0 OCGD=1"
pair s_std_strict_c6d "STD=strict" s_std_nem_c6d "STD=nem"
# Messages 426 and 429: s_coalsustain, R500/kW-yr of sustaining capital on existing coal (top of the working range R350-500).
one s_coalsustain_c6d "COAL_FOM_ADD=500"
echo "$(date -u +%H:%M) SHORT RUNS DONE" >> $P
# Solves over 30 minutes on c6a, last: s_nogas (38 min), s_std_strict_nogas_dsl (34 min); s_std_nem_nogas_dsl (not timed on c6a).
# Not run (message 416 (f)): s_std_strict_nogas_c6d and s_std_nem_nogas_c6d, whose solves exceed the time between container restarts.
pair s_nogas_c6d "GAS_CAP=0 OCGD=0" s_std_strict_nogas_dsl_c6d "STD=strict GAS_CAP=0 OCGD=1"
one s_std_nem_nogas_dsl_c6d "STD=nem GAS_CAP=0 OCGD=1"
echo "$(date -u +%H:%M) STANDARDS DONE" >> $P
python3 -I pathway/make_ret.py pathway/ret_counter.js pathcheck.js pathcheck_ret.gen.js >> $P 2>&1   # restart counts on this commit's own check
for n in c6d s_disc5_c6d null_c6d s_nogas_c6d s_gascapex25_c6d s_gas2030_c6d s_imp_c6d s_demlowflat_c6d s_demlowm1_c6d c6d_irpdem s_coalpractice_c6d s_rate48_c6d s_spotoil_c6d s_wearp75_c6d s_be6_c6d s_be7_c6d s_irpgas_c6d s_koeberg_winter_c6d s_ntcsa_both_c6d s_nogas_dsl_c6d s_std_strict_c6d s_std_strict_nogas_c6d s_std_strict_nogas_dsl_c6d s_std_nem_c6d s_std_nem_nogas_c6d s_std_nem_nogas_dsl_c6d s_carbontreasury_c6d s_carbonhold_c6d s_coalsustain_c6d; do
  [ -s out/pathway_$n.json ] && ret $n out/pathway_$n.json; done
ret irp2025_c6d $N/irp/pathway_irp2025_c6d.json; ret irp2025_c6d_irpdem $N/irp/pathway_irp2025_c6d_irpdem.json
echo "$(date -u +%H:%M) C6D SET DONE" >> $P
