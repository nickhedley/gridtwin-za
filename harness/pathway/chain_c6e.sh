#!/bin/bash
# Run from anywhere: bash harness/pathway/chain_c6e.sh. Outputs in harness/out (runs, checks) and harness/out/c6e (progress.txt,
# IRP pair, restart counts); set N to put the latter elsewhere. Needs node, python3 and harness/node_modules (npm install jsdom highs).
# c6e central run set (user, 28 Oct 2026, messages 468 and 469): c6c's settings and run set on build 2026-10-28a, where each technology
# carries its own cost of capital for state-backed procurement (bldCoc: solar and wind 5.5%, lithium and pumped storage 6.8%, gas 8.0%,
# nuclear 8.5%, network 7.1%), interest during construction where costs are quoted before financing, and solar on BW6's compliant
# construction cost. c6c (build 2026-10-27f, solar on BW7's tariffs, one rate) is the comparison and fallback. c6c's set (message 443):
# c6b's settings on build 2026-10-27f, coal minimum down time 24 h (FIXED.coalMinDownH); c6b (UC_FLEET's 4 h) a sensitivity. c6b's set (messages 406, 416, 423, 424 and 428 (b)): c6a's settings (env_c6a.sh), wind on BW6 bids and rooftop at R10,500 DC;
# its share of the year in service (harness/pathway/env_c6a.sh). Every run plans to NTCSA's 20 GWh unless it sets STD. s_gas2032 is
# replaced by s_gas2030 (gas from 2030, as c6 had; 391 (c)); the strict and NEM standards only for c6e, s_nogas and s_nogas_dsl (391 (d)).
# Order (message 428 (b)): c6e; the three IRP-schedule runs and c6e at IRP 2025's demand, then the IRP pair's build files and checks;
# the four cost-of-capital cases and the IRP pair at each (message 469);
# the wind cases and the IRP pair at each; the carbon cases and the IRP pair on each; the IRP pair at a high nuclear charge; the rest
# of the set, short solves first; solves over 30 minutes last; restart counts. Two solves at a time (15 GB). Resumable: a finished
# run or check is skipped; each run's LP cache is deleted once its check is written.
REPO=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd); H=$REPO/harness; N=${N:-$H/out/c6e}; P=$N/progress.txt
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
nuccheck(){ local f=$1 tag=$2 set=$3   # the IRP pair at nuclear's high capex (USD 12,000/kW) or 60-year life (messages 415 (a), 469 (d))
  for g in "a 2026,2027,2028,2029,2030" "b 2031,2032,2033,2034,2035" "c 2036,2037,2038,2039,2040"; do set -- $g
    [ -s $N/irp/pathcheck_${f}_${tag}_$1.json ] && continue
    env -i PATH="$PATH" HOME="$HOME" LNG=1 GRID=1 $set YEARS=$2 IN=$N/irp/pathway_$f.json OUTC=$N/irp/pathcheck_${f}_${tag}_$1.json nice -n 10 node --max-old-space-size=4096 pathcheck.js > $N/irp/pathcheck_${f}_${tag}_$1.log 2>&1 &
  done; wait; echo "$(date -u +%H:%M) IRP pair nuclear check $f, $tag ($set): $(ls $N/irp/pathcheck_${f}_${tag}_?.json 2>/dev/null | wc -l)/3 groups" >> $P; }
ret(){ local n=$1 in=$2; [ -s $N/ret/ret_$n.json ] && return 0
  env -i PATH="$PATH" HOME="$HOME" LNG=1 GRID=1 K=2 IN=$in OUTC=$N/ret/pc_$n.json OUTR=$N/ret/ret_$n.json nice -n 10 node --max-old-space-size=4096 pathcheck_ret.gen.js > $N/ret/ret_$n.log 2>&1
  echo "$(date -u +%H:%M) restart count $n exit $?" >> $P; }
echo "$(date -u +%H:%M) c6e chain (re)start on $(git -C $REPO log --oneline -1 | cut -c1-60)" >> $P
one c6e "" 6
pair s_irpgas_c6e "GAS_FORCE=2029:3000,2030:3000 GAS_MIN=2032-2034:1250,2035:1000,2036:1250,2037:1500,2038-2040:1250 GAS_LIFT=1 GASFLOOR=1 GASFLOOR_VINT=2029-2030 TCAP_YR=2029:4000,2030:4000" s_be6_c6e "STOR_CUM=2026:144,2027:294,2028:909,2029:3524,2030:3724,2031:3924,2032:4124,2033:4324,2034:4524,2035:4724,2036:5224,2037:5724,2038:6224,2039:6724,2040:7224"
pair s_be7_c6e "NUC_FORCE=2036:1250,2037:1250,2038:1350,2039:1350" c6e_irpdem "DEMAND=index:$REPO/harness/pathway/irp2025/index_irp2025fig2_c6.json"
[ -s $N/irp/pathway_irp2025_c6e.json ] || (OUTDIR=$H/out CENTRAL=c6e IRPDEM=c6e_irpdem BASEGAP=0 python3 -I pathway/irp2025/build_irp_c6.py $N/irp/pathway_irp2025_c6e.json >> $P 2>&1)
irpcheck irp2025_c6e & irpcheck irp2025_c6e_irpdem & wait
echo "$(date -u +%H:%M) IRP PAIR CHECKS DONE" >> $P
# Message 469: the cost-of-capital cases, each with the IRP build checked at the same rates (its cocCase copied from the run):
# planning (one rate for all, 8%, the IRP convention), high (the same gaps on the IEA's 9.0% for solar), low (central less one
# point), private (private and merchant finance for wind, solar and lithium; its premium an assumption until CEPA's Table 5.22 is read).
pair s_cocplan_c6e "COC=planning" s_cochigh_c6e "COC=high"
pair s_coclow_c6e "COC=low" s_cocprivate_c6e "COC=private"
for k in plan:planning high:high low:low private:private; do c=${k%%:*}; v=${k#*:}; [ -s $N/irp/pathway_irp2025_c6e_coc$c.json ] || [ ! -s out/pathway_s_coc${c}_c6e.json ] || python3 -I -c "
import json,sys; P=json.load(open(sys.argv[1])); R=json.load(open(sys.argv[4])); assert R.get('cocCase')==sys.argv[3], R.get('cocCase'); P['cocCase']=sys.argv[3]
P['note469']='Copy of pathway_irp2025_c6e.json at cost-of-capital case '+sys.argv[3]+' (message 469).'
json.dump(P,open(sys.argv[2],'w'))" $N/irp/pathway_irp2025_c6e.json $N/irp/pathway_irp2025_c6e_coc$c.json $v out/pathway_s_coc${c}_c6e.json; done
irpcheck irp2025_c6e_cocplan & irpcheck irp2025_c6e_cochigh & wait
irpcheck irp2025_c6e_coclow & irpcheck irp2025_c6e_cocprivate & wait
echo "$(date -u +%H:%M) COST OF CAPITAL CASES DONE" >> $P
# Message 469: s_windlow is dropped from c6e. Its capex is backed out of BW5's tariff at 8%; charged at wind's cost of capital it would
# count wind's finance twice (as message 466 found for solar), and BW5's prices do not hold (validate_bids.js). s_windhigh stays.
one s_windhigh_c6e "WIND_CASE=high"   # message 416 (d): the IRP gap at the high wind cost case
[ -s $N/irp/pathway_irp2025_c6e_windhigh.json ] || [ ! -s out/pathway_s_windhigh_c6e.json ] || python3 -I -c "
import json,sys; P=json.load(open(sys.argv[1])); R=json.load(open(sys.argv[3])); assert R.get('windCase')=='high'; P['windCase']='high'; P['capex2026']=R['capex2026']
P['note416']='Copy of pathway_irp2025_c6e.json with windCase high and capex2026 from the wind run of that case (message 416 (d)).'
json.dump(P,open(sys.argv[2],'w'))" $N/irp/pathway_irp2025_c6e.json $N/irp/pathway_irp2025_c6e_windhigh.json out/pathway_s_windhigh_c6e.json
irpcheck irp2025_c6e_windhigh
echo "$(date -u +%H:%M) WIND CASES DONE" >> $P
# Message 423 (c): s_carbontreasury, our assumption built on Treasury's stated aim (allowances cut in equal steps to none from
# 2031, then a straight line to US$120/t nominal in 2050, about R1,231/t in 2026 rands); message 424 (c): s_carbonhold, the same
# to 2030, then the 2030 rate in law held (R410.5/t). Each with the IRP build checked on the same carbon path.
pair s_carbontreasury_c6e "CARBON_PATH=treasury" s_carbonhold_c6e "CARBON_PATH=law2031"
for c in treasury:treasury hold:law2031; do k=${c%%:*}; v=${c#*:}; [ -s $N/irp/pathway_irp2025_c6e_carbon$k.json ] || [ ! -s out/pathway_s_carbon${k}_c6e.json ] || python3 -I -c "
import json,sys; P=json.load(open(sys.argv[1])); R=json.load(open(sys.argv[4])); assert R.get('carbonPath')==sys.argv[3]; P['carbonPath']=sys.argv[3]
P['note423']='Copy of pathway_irp2025_c6e.json on carbon path '+sys.argv[3]+' (messages 423 (c), 424 (c)).'
json.dump(P,open(sys.argv[2],'w'))" $N/irp/pathway_irp2025_c6e.json $N/irp/pathway_irp2025_c6e_carbon$k.json $v out/pathway_s_carbon${k}_c6e.json; done
irpcheck irp2025_c6e_carbontreasury & irpcheck irp2025_c6e_carbonhold & wait
echo "$(date -u +%H:%M) CARBON CASES DONE" >> $P
# Message 415 (a): the IRP pair at nuclear's high capex, USD 12,000/kW (its capital charge derived as the central's, with interest
# during construction at nuclear's cost of capital); message 469 (d): and at a 60-year nuclear life.
nuccheck irp2025_c6e nuc12000 NUC_CAPEX_USD=12000 & nuccheck irp2025_c6e_irpdem nuc12000 NUC_CAPEX_USD=12000 & wait
nuccheck irp2025_c6e nuclife60 NUC_LIFE=60 & nuccheck irp2025_c6e_irpdem nuclife60 NUC_LIFE=60 & wait
# Message 428 (b): the 20 GWh set and the standard runs, short solves first; solves over 30 minutes last.
pair null_c6e "" s_gascapex25_c6e "GAS_CAPEX=43706"
pair s_gas2030_c6e "GAS_FIRST=2030" s_imp_c6e "IMP_END=2040"
pair s_demlowflat_c6e "DEMAND=rate:0" s_demlowm1_c6e "DEMAND=rate:-1"
# s_mindn24 is dropped: 24 h is c6e's central (message 443); the c6b set (UC_FLEET's 4 h) is the down-time sensitivity.
one s_coalpractice_c6e "COAL_STATE='{\"coalMslDesignFromYear\":2041}'"
pair s_rate48_c6e "COAL_STATE='{\"bldCoalCommitHours\":48}'" s_spotoil_c6e "COAL_STATE='{\"coalStartFuel\":\"spot\"}'"
pair s_wearp75_c6e "COAL_STATE='{\"coalStartWear\":\"p75\"}'" s_koeberg_winter_c6e "NUC_SHAPE='[1.4859869721690109,1.3233883976907597,1.0703906157535057,0.8662924051076811,0.6634941830646963,0.6625941909550381,0.6646941725442406,0.6101946503482708,0.7746932081691338,0.7827931371560578,1.544486459296795,1.5773861708609676]'"
pair s_ntcsa_both_c6e "OC_CF_MAX=0.06" s_nogas_dsl_c6e "GAS_CAP=0 OCGD=1"
pair s_std_strict_c6e "STD=strict" s_std_nem_c6e "STD=nem"
# Messages 426 and 429: s_coalsustain, R500/kW-yr of sustaining capital on existing coal (top of the working range R350-500).
one s_coalsustain_c6e "COAL_FOM_ADD=500"
echo "$(date -u +%H:%M) SHORT RUNS DONE" >> $P
# Solves over 30 minutes on c6a, last: s_nogas (38 min), s_std_strict_nogas_dsl (34 min); s_std_nem_nogas_dsl (not timed on c6a).
# Not run (message 416 (f)): s_std_strict_nogas_c6e and s_std_nem_nogas_c6e, whose solves exceed the time between container restarts.
pair s_nogas_c6e "GAS_CAP=0 OCGD=0" s_std_strict_nogas_dsl_c6e "STD=strict GAS_CAP=0 OCGD=1"
one s_std_nem_nogas_dsl_c6e "STD=nem GAS_CAP=0 OCGD=1"
echo "$(date -u +%H:%M) STANDARDS DONE" >> $P
python3 -I pathway/make_ret.py pathway/ret_counter.js pathcheck.js pathcheck_ret.gen.js >> $P 2>&1   # restart counts on this commit's own check
for n in c6e null_c6e s_nogas_c6e s_gascapex25_c6e s_gas2030_c6e s_imp_c6e s_demlowflat_c6e s_demlowm1_c6e c6e_irpdem s_coalpractice_c6e s_rate48_c6e s_spotoil_c6e s_wearp75_c6e s_be6_c6e s_be7_c6e s_irpgas_c6e s_koeberg_winter_c6e s_ntcsa_both_c6e s_nogas_dsl_c6e s_std_strict_c6e s_std_strict_nogas_c6e s_std_strict_nogas_dsl_c6e s_std_nem_c6e s_std_nem_nogas_c6e s_std_nem_nogas_dsl_c6e s_carbontreasury_c6e s_carbonhold_c6e s_coalsustain_c6e; do
  [ -s out/pathway_$n.json ] && ret $n out/pathway_$n.json; done
ret irp2025_c6e $N/irp/pathway_irp2025_c6e.json; ret irp2025_c6e_irpdem $N/irp/pathway_irp2025_c6e_irpdem.json
echo "$(date -u +%H:%M) C6E SET DONE" >> $P
