#!/bin/bash
# Message 691 (c): the references unconfounded. Single-year 2040 LPs at 365 days (clustered, linked), the central (fixed from c7) and
# Fossil-free (fixed from s_ff2040_c7), on a 2 x 2: wind means stored or six-constant (WX_WINDCORR=1 with WX_WINDCORR_TABLE) x the
# reference series metered 2025 or modelled 2025; each cell with its own extremes (extract.js, extremes.py). Each LP run through
# pathway_perfail.js to its output (SOLVER=native; the LP dumped; the solution from its cache), then the engine (pathcheck.js YEARS=2040)
# on each build, on the stored and on the six-constant weather. Resumable. One queue per run: bash refs2x2.sh <outdir> central|ff
H=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd); O=${1:-$H/out/refs2x2}; R=${2:-central}; mkdir -p $O; cd $H; P=$O/progress_$R.txt
T6=${T6:-/tmp/claude-0/-home-user-gridtwin-za/cd2ebea5-fdee-51da-b34b-eb3574ed8e65/scratchpad/wind_corr_table_calm6.json}
echo "$(date -u +%FT%H:%MZ) refs2x2 $R, shell PID $$, $(git log --oneline -1 | cut -c1-40)" >> $P
source pathway/env_c6a.sh; export GAS_FIRST=2035
C7="SS=inertia SS_FC=reservecoal COC=blended BTM_STOCK=8 VPP=1 GY=1 COAL_FUEL_ESC=3 COAL_FOM_ESC=1.1 COMPLY=compromise COAL_CARBON_FLOOR=1"
FFX="SOLVER=native PACE=grid LI_CAP=4000 LI_EH=8 IA_TOTAL=5000 FOSSIL_END=2039"
C=/home/user/gridtwin-za/harness/pathway/c7; X=$O/extremes; mkdir -p $X
SRC="$C/pathway_c7.json $C/pathway_s_deep40nogas_c7.json $C/pathway_s_ff2040_c7.json"; SHA=$(git log --format=%h -1)
# Extremes, once (the first queue to arrive writes them; a lock keeps the second out until they exist)
if mkdir $X/.lock 2>/dev/null; then
  [ -s $X/series_st.json ] || NODE_PATH=node_modules node pathway/repdays/extract.js $X/series_st.json >> $P 2>&1
  [ -s $X/series_c6.json ] || WX_WINDCORR=1 WX_WINDCORR_TABLE=$T6 NODE_PATH=node_modules node pathway/repdays/extract.js $X/series_c6.json >> $P 2>&1
  for c in "met_st metered series_st" "y25_st 2025 series_st" "met_c6 metered series_c6" "y25_c6 2025 series_c6"; do set -- $c
    [ -s $X/ext_$1.json ] || REF=$2 BUILD=2026-11-03d COMMIT="$SHA (claude/weather-fixes; $1)" python3 -I pathway/repdays/extremes.py $X/$3.json $X/ext_$1.json $SRC >> $P 2>&1; done
  touch $X/.done
else until [ -e $X/.done ]; do sleep 20; done; fi
ext(){ python3 -c "import json;print(','.join(map(str,json.load(open('$X/ext_$1.json'))['days'])))"; }
[ $R = central ] && FX="FIX_FROM=$C/pathway_c7.json FIX_TO=2039" || FX="FIX_FROM=$C/pathway_s_ff2040_c7.json FIX_TO=2039 $FFX"
for c in ${CELLS:-met_st y25_st met_c6 y25_c6}; do n=${R}_$c
  case $c in met_st) RF="REP_REF=metered";; y25_st) RF="REP_REF=2025";; met_c6) RF="REP_REF=metered WX_WINDCORR=1 WX_WINDCORR_TABLE=$T6";; y25_c6) RF="REP_REF=2025 WX_WINDCORR=1 WX_WINDCORR_TABLE=$T6";; esac
  RF="$RF REP_EXTREMES=$(ext $c)"
  if [ ! -s $O/${n}_path.json ]; then
    echo "$(date -u +%FT%H:%MZ) $n LP ($RF)" >> $P
    eval "env $C7 $FX $RF SOLVER=native REP_WEIGHTS=clustered REP_DAYS=365 STORAGE_LINK=1 OPER_FROM=2040 HORIZON=2040 MAXP=1 DUMP=0 DUMP_LP=$O/$n LPCACHE=$O/lpc_$n OUT=$O/${n}_path.json TL=7000 nice -n 5 node --max-old-space-size=9000 pathway/pathway_perfail.js" > $O/$n.log 2>&1
    echo "$(date -u +%FT%H:%MZ) $n LP rc $? $(grep -h 'dumped LP' $O/$n.log | tail -1)" >> $P
  fi
  [ -s $O/${n}_path.json ] || continue
  [ -s $O/${n}_sol.json ] || cp "$(ls -t $O/lpc_$n/*.json | grep -v basis | head -1)" $O/${n}_sol.json
  for wx in st c6; do e=$O/${n}_eng_$wx.json; [ -s $e ] && continue
    W=""; [ $wx = c6 ] && W="WX_WINDCORR=1 WX_WINDCORR_TABLE=$T6"
    eval "env -i PATH=\"$PATH\" HOME=\"$HOME\" LNG=1 GRID=1 SS_FC=reservecoal YEARS=2040 IN=$O/${n}_path.json OUTC=$e $W nice -n 5 node --max-old-space-size=4096 pathcheck.js" > $O/${n}_eng_$wx.log 2>&1
    echo "$(date -u +%FT%H:%MZ) $n engine on $wx rc $?" >> $P; done
done
echo "$(date -u +%FT%H:%MZ) refs2x2 $R done" >> $P
