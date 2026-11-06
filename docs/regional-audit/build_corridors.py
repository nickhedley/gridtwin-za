"""738 (a): rebuild the inter-area corridor table from the model's own line file (nodal/transmission_lines.geojson, NTCSA-derived, with
nodal/substations_compact.json for the areas) at voltage-specific ratings, N-1 applied once.
Per circuit: rating = min(thermal by voltage class, SIL by voltage x 53.736 x km^-0.65) (the St Clair loadability curve as PyPSA-RSA applies it,
SIL 602 MW at 400 kV and 2,280 MW at 765 kV; 275, 220 and 132 kV scaled by voltage squared from the 400 kV value, an assumption). Thermal by
class is the line file's own (nodal/corridor_electrical.json's MVA per class: 765 kV 3,000; 400 kV 1,400; 275 kV 400; 220 kV 250; 132 kV 100
assumed). Corridor: thermal-and-loadability sum (the 'thermal' sensitivity); N-1 once = the sum less the largest circuit when there are two or
more, 0.7 x the circuit when there is one (PyPSA-RSA's rule). Existing circuits only; planned ones are the TDP's. Cross-border lines excluded.
Substation placement overrides from public sources (738 (c)). usage: python3 build_corridors.py <root> [--eros-ec]"""
import json, os, math, re, sys, collections
ROOT = sys.argv[1]; EROS_EC = '--eros-ec' in sys.argv
S = '/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad/'
THERMAL = {765: 3000.0, 400: 1400.0, 275: 400.0, 220: 250.0, 132: 100.0}
SIL = {765: 2280.0, 400: 602.0, 275: 602.0 * (275 / 400) ** 2, 220: 602.0 * (220 / 400) ** 2, 132: 602.0 * (132 / 400) ** 2}
def rating(kv, km): return min(THERMAL[kv], SIL[kv] * 53.736 * max(km, 1.0) ** -0.65)
subs = json.load(open(ROOT + '/nodal/substations_compact.json'))['subs']
area = {s['n'].upper(): s['area'] for s in subs}
override = {} if EROS_EC else {'EROS': 'Kwazulu Natal'}   # Eros is at Harding, KwaZulu-Natal (Engineering News, 27 Jun 2014); the file places it in the Eastern Cape by hand
area.update(override)
AREA_MAP = os.environ.get('AREA_MAP', '')     # (756 b) one rule: every substation's area by point in polygon of the fleet file's boundary set (area_map_v3.json from area_assign.py); replaces the file's areas and the Eros override
if AREA_MAP:
    am = json.load(open(AREA_MAP))['subs']; area = {k.upper(): v['rule'] for k, v in am.items()}
EXTRA_LINES = os.environ.get('EXTRA_LINES', '')   # (756 b) a JSON list of existing circuits the line file lacks, [{label, kv, km, start, end, source}], added with a public source stated
OUT_NAME = os.environ.get('OUT_NAME', '')
g = json.load(open(ROOT + '/nodal/transmission_lines.geojson'))
def hav(a, b):
    R = 6371.0; la1, lo1 = math.radians(a[1]), math.radians(a[0]); la2, lo2 = math.radians(b[1]), math.radians(b[0])
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2; return 2 * R * math.asin(math.sqrt(h))
def length_km(geom):
    c = geom['coordinates']; lines = c if geom['type'] == 'MultiLineString' else [c]; return sum(hav(l[i], l[i + 1]) for l in lines for i in range(len(l) - 1))
corr = collections.defaultdict(list); excluded = []
for f in g['features']:
    p = f['properties']
    if p['status'] != 'existing': continue
    a = area.get((p.get('start') or '').upper()); b = area.get((p.get('end') or '').upper())
    if not a or not b: excluded.append(p['label']); continue
    if a == b: continue
    kv = int(p['voltage'])
    if kv not in THERMAL: excluded.append(p['label'] + f' ({kv} kV, HVDC)'); continue
    km = round(length_km(f['geometry']), 1); corr['|'.join(sorted((a, b)))].append({'label': p['label'], 'kv': kv, 'km': km, 'start': p['start'], 'end': p['end'], 'ratingMW': round(rating(kv, km), 1)})
if EXTRA_LINES:
    for q in json.load(open(EXTRA_LINES)):
        a = area.get(q['start'].upper()); b = area.get(q['end'].upper())
        if not a or not b or a == b: excluded.append(q['label'] + ' (extra line, not inter-area)'); continue
        corr['|'.join(sorted((a, b)))].append({'label': q['label'], 'kv': int(q['kv']), 'km': float(q['km']), 'start': q['start'], 'end': q['end'], 'ratingMW': round(rating(int(q['kv']), float(q['km'])), 1), 'source': q.get('source', '')})
old = {('|'.join(sorted((a, b)))): (float(mw), float(km)) for a, b, mw, km in re.findall(r"\['([^']+)','([^']+)',\s*(\d+),\s*(\d+)\]", re.search(r"const CORRIDORS = \[(.*?)\];", open(ROOT + '/nodal/nodal_engine.js').read(), re.S).group(1))}
out = {}
for k, cs in corr.items():
    cs.sort(key=lambda c: -c['ratingMW']); tot = sum(c['ratingMW'] for c in cs); n1 = (tot - cs[0]['ratingMW']) if len(cs) > 1 else 0.7 * tot
    a, b = k.split('|'); out[k] = {'a': a, 'b': b, 'circuits': cs, 'thermalMW': round(tot, 1), 'n1MW': round(n1, 1), 'kmMean': round(sum(c['km'] for c in cs) / len(cs), 1), 'kmMax': max(c['km'] for c in cs)}
meta = {'method': __doc__, 'thermalByKv': THERMAL, 'silByKv': {k: round(v, 1) for k, v in SIL.items()}, 'erosPlacement': 'Eastern Cape (the file)' if EROS_EC else 'KwaZulu-Natal (Harding; public record)', 'excludedCrossBorderOrUnplaced': excluded,
        'droppedFromOldTable': [k for k in old if k not in out], 'source': 'nodal/transmission_lines.geojson (NTCSA-derived, existing status) and nodal/substations_compact.json at build 2026-11-05f'}
if AREA_MAP: meta['areaRule'] = '756 (b): every substation, generator and line end takes its area from the fleet file\'s boundary set (rsa_supply_regions.gpkg, PyPSA-RSA, point in polygon; area_map_v3.json)'; meta['erosPlacement'] = 'by the polygon rule'
if EXTRA_LINES: meta['extraLines'] = json.load(open(EXTRA_LINES))
json.dump({'meta': meta, 'corridors': out}, open(S + (OUT_NAME or ('corridors_v2_eros_ec.json' if EROS_EC else 'corridors_v2.json')), 'w'), indent=1)
print('| corridor | old MW (N-1 at 400 kV ratings; the table) | old km | circuits now (existing, by voltage) | km (mean of circuits) | thermal and loadability sum MW | N-1 once MW | ratio new N-1 to old |')
print('|---|---|---|---|---|---|---|---|')
for k in sorted(set(old) | set(out), key=lambda k: -(out[k]['n1MW'] if k in out else 0)):
    o = old.get(k); n = out.get(k)
    circ = ', '.join(f"{c['kv']} kV {c['km']:.0f} km {c['ratingMW']:.0f} MW ({c['label']})" for c in n['circuits']) if n else 'none in the line file'
    print(f"| {k.replace('|', ' to ').replace('Kwazulu Natal', 'KwaZulu-Natal')} | {o[0]:,.0f} | {o[1]:,.0f} | {circ} | {n['kmMean'] if n else '-'} | {n['thermalMW'] if n else 0:,.0f} | {n['n1MW'] if n else 0:,.0f} | {(n['n1MW'] / o[0]) if (n and o) else 0:.2f} |" if o else f"| {k.replace('|', ' to ')} | (not in the old table) | - | {circ} | {n['kmMean']} | {n['thermalMW']:,.0f} | {n['n1MW']:,.0f} | - |")
print('\nExcluded (cross-border, unplaced or HVDC):', excluded)
print('Dropped from the old table (no existing line in the file):', meta['droppedFromOldTable'])
print('Totals: old', round(sum(v[0] for v in old.values())), 'MW; new N-1', round(sum(v['n1MW'] for v in out.values())), 'MW; new thermal sum', round(sum(v['thermalMW'] for v in out.values())), 'MW')
