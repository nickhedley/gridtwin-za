#!/bin/bash
# Pass-1 solve time by day count (message 674 (b); design note version 2, section 5). Dumps c7's central pass-1 LP at REP_DAYS=n with
# the current formulation (nothing new built) and solves it with native HiGHS simplex, recording rows, columns, nonzeros and seconds.
# Run from harness/: bash pathway/repdays/timing.sh <out dir> <n> [<n> ...]   (each n: about 2 minutes to dump, then the solve)
# At n=12 the LP is c7's own pass-1 LP (key c62ec3e615). Measurement only: the LPs and solutions are deleted after each solve.
T=$1; shift; mkdir -p $T
source pathway/env_c6a.sh; export GAS_FIRST=2035
C7="SS=inertia SS_FC=reservecoal COC=blended BTM_STOCK=8 VPP=1 GY=1 COAL_FUEL_ESC=3 COAL_FOM_ESC=1.1 COMPLY=compromise COAL_CARBON_FLOOR=1"
echo "$(date -u +%FT%H:%MZ) timing, shell PID $$, days $*, solver ${HIGHS_SOLVER:-simplex}" >> $T/progress.txt
for n in "$@"; do
  [ -s $T/c7_rd${n}_pass1.lp ] || env $C7 REP_DAYS=$n MAXP=1 DUMP=0 DUMP_LP=$T/c7_rd$n DUMP_STOP=1 LPCACHE=$T/lpc_rd$n OUT=$T/p_rd$n.json TL=7200 nice -n 5 node --max-old-space-size=6144 pathway/pathway_perfail.js > $T/rd$n.log 2>&1
  grep "dumped LP" $T/rd$n.log >> $T/progress.txt
  python3 -c "
import highspy,sys;h=highspy.Highs();h.setOptionValue('output_flag',False);h.readModel(sys.argv[1]);lp=h.getLp();print('rd$n rows',lp.num_row_,'cols',lp.num_col_,'nnz',len(lp.a_matrix_.index_))" $T/c7_rd${n}_pass1.lp >> $T/progress.txt 2>&1
  s=$(date +%s); HIGHS_SOLVER=${HIGHS_SOLVER:-simplex} nice -n 5 python3 highs_native.py $T/c7_rd${n}_pass1.lp $T/c7_rd${n}_sol.json ${TL_S:-6000} >> $T/rd$n.log 2>&1 &
  pid=$!; echo "$(date -u +%FT%H:%MZ) rd$n solve PID $pid" >> $T/progress.txt; wait $pid
  echo "$(date -u +%FT%H:%MZ) rd$n solved in $(( $(date +%s) - s )) s, status $(python3 -c "import json;d=json.load(open('$T/c7_rd${n}_sol.json'));print(d['Status'],d.get('ObjectiveValue'))" 2>&1)" >> $T/progress.txt
  rm -rf $T/c7_rd${n}_sol.json $T/c7_rd${n}_pass1.lp $T/lpc_rd$n
done
