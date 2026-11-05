#!/bin/bash
# Message 724 (b): what a two-stage Deep needs beyond its fixed cap. Dumps step LPs (DUMP_STOP=1, no solve) with the retime central's
# settings plus Deep's from chain_c7.sh's deep() line, at the chain's first cap (DEEP_CAP0 36.382; structure only, not a calibrated cap).
# Steps: 2026 (window 2026-2030, no year under the cap), 2031 (2031-2035), 2036 (2036-2040, 2035 before the step); earlier builds fixed from
# test 15's old central (out/ts2_central/fixed.json; structure only). Reports whether each step builds, the iatot row's terms and the
# co2cap rows, and whether HiGHS reads the LP.
D=/tmp/claude-0/-home-user-gridtwin-za/89044349-14ce-5480-b08a-321dc7b30183/scratchpad/deep_lp; cd /home/user/gtza-retime/harness || exit 2
source out/tsr_central/settings.env
DEEP=$(sed -n '/^deep()/,/^}/p' pathway/chain_c7.sh | grep -o 'GAS_CAP=[^$]*CO2CAP=[^ ]*'); export $DEEP
cap=36.382; export CO2CAP_YEARS="2035:$cap,2036:$cap,2037:$cap,2038:$cap,2039:$cap,2040:$cap"; unset HIGHS_OPTS
echo "Deep settings from chain_c7.sh: $DEEP CO2CAP_YEARS=$CO2CAP_YEARS" > $D/report.txt
for y in 2026 2031 2036; do h=$(( y + 4 > 2040 ? 2040 : y + 4 )); fix=""; [ $y -gt 2026 ] && fix="FIX_FROM=/home/user/gridtwin-za/harness/out/ts2_central/fixed.json FIX_TO=$((y - 1))"
  env $fix OPER_FROM=$y HORIZON=$h STAGE2_YEAR=$y REP_DAYS=25 REP_WEIGHTS=clustered STORAGE_LINK=1 STRESS_TARGET=1 MAXP=1 LPCACHE=$D/lpc OUT=$D/step_$y.json \
    DUMP_LP=$D/step$y DUMP_STOP=1 nice -n 10 node --max-old-space-size=12288 pathway/pathway_perfail.js > $D/step_$y.log 2>&1
  echo "step $y (to $h): rc=$? $(grep -m1 'dumped LP' $D/step_$y.log) $(grep -m1 -i 'error' $D/step_$y.log | cut -c1-300)" >> $D/report.txt
  L=$D/step${y}_pass1.lp
  if [ -s $L ]; then
    echo "  iatot: $(grep -m1 '^ iatot:' $L)" >> $D/report.txt
    python3 -I -c "import re,sys
for l in open(sys.argv[1]):
    if l.startswith(' co2cap'): print('  %s %d emission terms, slack %s, rhs %s' % (l.split(':')[0].strip(), len(re.findall(r'\\b(?:gc|gg|gd|go)_\\d', l)), 'co2sl_' in l, l.split('<=')[-1].strip()))" $L >> $D/report.txt
    python3 -I -c "import highspy,sys; h=highspy.Highs(); h.setOptionValue('output_flag', False); print('  HiGHS reads it:', h.readModel(sys.argv[1]) == highspy.HighsStatus.kOk)" $L >> $D/report.txt
    rm -f $L; fi
done
