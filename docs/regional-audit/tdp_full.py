"""Account for every TDP line (718 (c)): joining two areas, inside one area, endpoint missing. MAP holds the areas of substations
absent from nodal/substations_compact.json, from public documents (see the research note); fill it, then run to write the
full inter-area line list for pypsa_net.py's TDP_FILE. usage: tdp_full.py <worktree root> <out json>"""
import json, sys, collections
ROOT, OUT = sys.argv[1], sys.argv[2]
MAP = json.load(open(sys.argv[3])) if len(sys.argv) > 3 else {}   # {'Umtu': 'Northern Cape', ...}
KVMW = {400: 900, 765: 3000, 275: 600}
subs = {s['n']: s.get('area') for s in json.load(open(ROOT + '/nodal/substations_compact.json'))['subs']}
subs.update(MAP)
lines = [p for p in json.load(open(ROOT + '/nodal/tdp_projects.json'))['projects'] if p.get('kind') == 'line']
inter, intra, missing = [], [], []
for p in lines:
    ends = [(q['n'], subs.get(q['n'])) for q in p.get('pts', [])]
    areas = sorted(set(a for _, a in ends if a))
    rec = dict(name=p['name'], year=p.get('year'), kv=p.get('kv'), phase=p.get('phase'), prov=p.get('prov'), km=p.get('km'), ends=[n for n, _ in ends], areas=areas, mw=KVMW.get(p.get('kv'), 900))
    if any(a is None for _, a in ends): missing.append(rec)
    elif len(areas) == 2: inter.append(rec)
    else: intra.append(rec)
print(f'{len(lines)} lines: {len(inter)} join two areas, {len(intra)} inside one area, {len(missing)} with an endpoint still unmapped')
for r in missing: print('  unmapped:', r['name'], [n for n in r['ends'] if subs.get(n) is None])
by = collections.Counter(); byyear = collections.Counter()
for r in inter: by[tuple(r['areas'])] += r['mw']; byyear[r['year'] or 9999] += r['mw']
print('inter-area MW by pair:', dict(by)); print('by year:', dict(sorted(byyear.items())))
print('intra-area by area:', dict(collections.Counter(r['areas'][0] if r['areas'] else r['prov'] for r in intra)))
json.dump([dict(a=r['areas'][0], b=r['areas'][1], mw=r['mw'], year=r['year'], name=r['name'], kv=r['kv'], phase=r['phase']) for r in inter], open(OUT, 'w'), indent=1)
json.dump({'inter': inter, 'intra': intra, 'missing': missing}, open(OUT.replace('.json', '_all.json'), 'w'), indent=1)
