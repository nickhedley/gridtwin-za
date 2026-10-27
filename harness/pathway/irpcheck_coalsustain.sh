#!/bin/bash
# The IRP 2025 build checked at s_coalsustain's coal sustaining capital (user, 27 Oct 2026, messages 429 and 439), as the chain
# checks it on each wind and carbon case: a copy of pathway_irp2025_$C.json carrying the coalFomAdd that s_coalsustain's own
# run file records, run through the engine check in the three year groups. Run after the chain (chain_c6b.sh or chain_c6c.sh) has finished, on the same commit,
# from anywhere: [CENTRAL=c6c] bash harness/pathway/irpcheck_coalsustain.sh [repository root] (CENTRAL defaults to c6b). Resumable: a finished year group is skipped.
# Outputs beside the IRP pair's: harness/out/$C/irp/pathway_irp2025_${C}_coalsustain.json and pathcheck_irp2025_${C}_coalsustain_{a,b,c}.json.
REPO=${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}; C=${CENTRAL:-c6b}; H=$REPO/harness; N=${N:-$H/out/$C}; P=$N/progress.txt
cd $H || exit 1
RUN=out/pathway_s_coalsustain_$C.json IRP=$N/irp/pathway_irp2025_$C.json OUT=$N/irp/pathway_irp2025_${C}_coalsustain.json
for f in $RUN $IRP; do [ -s $f ] || { echo "missing $f: run the chain first" >&2; exit 1; }; done
[ -s $OUT ] || python3 -I -c "
import json,sys; P=json.load(open(sys.argv[1])); R=json.load(open(sys.argv[3]))
add=R.get('coalFomAdd')
assert isinstance(add,(int,float)) and add>0, 'the s_coalsustain run file records no coalFomAdd: %r' % (add,)
assert not P.get('coalFomAdd'), 'the IRP build file already carries coalFomAdd'
P['coalFomAdd']=add
P['note439']='Copy of pathway_irp2025_$C.json with coalFomAdd %s R/kW-yr from s_coalsustain_$C (messages 429, 439).' % add
json.dump(P,open(sys.argv[2],'w'))" $IRP $OUT $RUN || exit 1
for g in "a 2026,2027,2028,2029,2030" "b 2031,2032,2033,2034,2035" "c 2036,2037,2038,2039,2040"; do set -- $g
  [ -s $N/irp/pathcheck_irp2025_${C}_coalsustain_$1.json ] && continue
  env -i PATH="$PATH" HOME="$HOME" LNG=1 GRID=1 YEARS=$2 IN=$OUT OUTC=$N/irp/pathcheck_irp2025_${C}_coalsustain_$1.json nice -n 10 node --max-old-space-size=4096 pathcheck.js > $N/irp/pathcheck_irp2025_${C}_coalsustain_$1.log 2>&1 &
done; wait
n=$(ls $N/irp/pathcheck_irp2025_${C}_coalsustain_?.json 2>/dev/null | wc -l)
echo "$(date -u +%H:%M) IRP pair check irp2025_${C}_coalsustain (coalFomAdd from s_coalsustain_$C): $n/3 groups" >> $P
grep -h "coal fixed cost add-on" $N/irp/pathcheck_irp2025_${C}_coalsustain_?.log | sort -u
[ "$n" = 3 ]
