#!/bin/bash
# 753 (b): reverse-geocode every substation in nodal/substations_compact.json (Nominatim, allowed host, 1 request a second) and record the province
# beside the file's area. Output: $S/geocheck.tsv (name, lat, lng, file area, nominatim state, district).
S=/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad
python3 -c "
import json; d=json.load(open('/home/user/gridtwin-za/nodal/substations_compact.json'))['subs']
for s in d: print('%s\t%s\t%s\t%s'%(s['n'],s['lat'],s['lng'],s['area']))" > $S/geocheck_in.tsv
: > $S/geocheck.tsv
while IFS=$'\t' read nm lat lng ar; do
  r=$(curl -sS --max-time 20 -A "gridtwin-za-check" "https://nominatim.openstreetmap.org/reverse?lat=$lat&lon=$lng&format=json&zoom=8" | python3 -c "import sys,json
try:
  j=json.load(sys.stdin); a=j.get('address',{}); print(a.get('state','?')+'\t'+a.get('county',a.get('municipality','?')))
except Exception as e: print('ERR\t'+str(e))")
  printf '%s\t%s\t%s\t%s\t%s\n' "$nm" "$lat" "$lng" "$ar" "$r" >> $S/geocheck.tsv; sleep 1.1
done < $S/geocheck_in.tsv
echo done >> $S/geocheck.tsv
