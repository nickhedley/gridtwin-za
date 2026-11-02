#!/bin/bash
# The VPP's coordination gain against its coordination cost (user, 2 Nov 2026, messages 645-647; RESULTS 'VPP coordination gain against
# coordination cost'): one-year build tests at year Y with a pathway's builds fixed to Y-1, behind-the-meter stock 8 GWh, the VPP on
# under the resource cost basis, enrolment in year Y only (VPP_YEAR). Cases: off (no enrolment), zero (programme cost 0, wear on),
# central (the page's resource cost), and usd<x> (a programme cost of US$x/kW-yr). Then node ext/vpp_coordination.js reduces them.
# Usage, from harness/: bash ext/vpp_coordination.sh <Y> <case> [usd] ; FIX (default pathway/c6e/pathway_c6e.json), DIR (output folder).
# Each solve takes 2-5 minutes; run at most two at a time, nothing else heavy beside them; resumable (a finished case is skipped).
Y=$1; C=$2; FIX=${FIX:-pathway/c6e/pathway_c6e.json}; DIR=${DIR:-out/vppcoord}; mkdir -p $DIR
source pathway/env_c6a.sh; export GAS_FIRST=2035
case $C in off) X="VPP_YEAR=0";; zero) X="VPP_YEAR=$Y VPP_COST_USD=0";; central) X="VPP_YEAR=$Y";; usd) X="VPP_YEAR=$Y VPP_COST_USD=$3"; C=usd$3;;
  *) echo "case must be off, zero, central or usd <x>"; exit 1;; esac
n=y${Y}_$C
[ -s $DIR/p_$n.json ] || env $X HORIZON=$Y FIX_FROM=$FIX FIX_TO=$((Y-1)) MAXP=1 DUMP=0 LPCACHE=$DIR/lpc_$n OUT=$DIR/p_$n.json TL=1500 BTM_STOCK=8 VPP=1 VPP_COST_CASE=resource \
  nice -n 5 node --max-old-space-size=6144 pathway/pathway_perfail.js > $DIR/$n.log 2>&1
[ -s $DIR/p_$n.json ] && rm -rf $DIR/lpc_$n
