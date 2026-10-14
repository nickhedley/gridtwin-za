#!/usr/bin/env python3
"""Connection distances for the optimiser grid cost (TODO 14ar, 7 Oct 2026). Run from the repo root:

  python3 -I harness/ext/grid_distances.py [beyondKm=18]

Prints BLD_GRID.km and BLD_GRID.kmBeyond for index.html; paste them, never edit them by hand.
- wind, pv: MW-weighted mean great-circle distance to the nearest transmission substation over the
  approved DFFE REEA projects (nodal/reea_projects.json, 'subkm'). Straight line: a built route is longer.
- phes: GWh-weighted mean of the class medians (km275, nearest substation of 275 kV or more) over the
  AAA and AA classes of the ANU shortlist (nodal/phes_sites_region.json). Medians, so approximate.
- ccgt: mean distance from the two port sites named for gas (Richards Bay, Coega; coordinates are
  approximate points in each port zone) to the nearest 400 kV substation in
  public_data/transmission_substations.csv.
"""
import json, csv, math, sys
B = float(sys.argv[1]) if len(sys.argv) > 1 else 18.0
out = {'km': {}, 'kmBeyond': {}, 'beyondKm': B}
P = [p for p in json.load(open('nodal/reea_projects.json'))['projects']
     if p.get('status') == 'Approved' and p.get('subkm') is not None and p.get('mw')]
for key, tech in (('wind', 'Wind'), ('pv', 'Solar PV')):
    q = [p for p in P if p['tech'] == tech]; W = sum(p['mw'] for p in q)
    out['km'][key] = round(sum(p['subkm'] * p['mw'] for p in q) / W, 1)
    out['kmBeyond'][key] = round(sum(max(0, p['subkm'] - B) * p['mw'] for p in q) / W, 1)
    out.setdefault('n', {})[key] = len(q)
R = json.load(open('nodal/phes_sites_region.json'))['regions']
cells = [v for cl in R.values() for c, v in cl.items() if c in ('AAA', 'AA')]
G = sum(v['GWh'] for v in cells)
out['km']['phes'] = round(sum(v['km275'] * v['GWh'] for v in cells) / G, 1)
out['kmBeyond']['phes'] = round(sum(max(0, v['km275'] - B) * v['GWh'] for v in cells) / G, 1)
S = list(csv.DictReader(l for l in open('public_data/transmission_substations.csv') if not l.startswith('#')))
def hav(a, b, c, d):
    p = math.radians; x = math.sin(p(c-a)/2)**2 + math.cos(p(a))*math.cos(p(c))*math.sin(p(d-b)/2)**2
    return 2 * 6371 * math.asin(math.sqrt(x))
def kv(s):
    try: return max(float(x) for x in s['kv'].replace('/', ' ').split())
    except ValueError: return 0
sites = {'Richards Bay': (-28.80, 32.04), 'Coega': (-33.77, 25.68)}
near = {n: min((hav(a, b, float(s['lat']), float(s['lng'])), s['name']) for s in S if kv(s) >= 400) for n, (a, b) in sites.items()}
out['km']['ccgt'] = round(sum(d for d, _ in near.values()) / len(near), 1)
out['kmBeyond']['ccgt'] = round(sum(max(0, d - B) for d, _ in near.values()) / len(near), 1)
out['gasSites'] = {n: [round(d, 1), s] for n, (d, s) in near.items()}
print(json.dumps(out))
