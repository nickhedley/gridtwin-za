"""756 (b): one rule for every substation, generator and line end: the area is the supply region of PyPSA-RSA's rsa_supply_regions.gpkg (the
10-region GCCA boundaries the fleet file's regions come from), by point in polygon. usage: python area_assign.py <gpkg> [layer]
Writes area_map_v3.json (substation name -> area, with the file's area and the change) and prints the changes."""
import json, sys, geopandas as gpd
from shapely.geometry import Point
S = '/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad/'
gpkg = sys.argv[1]; layer = sys.argv[2] if len(sys.argv) > 2 else None
import pyogrio; print('layers:', pyogrio.list_layers(gpkg))
g = gpd.read_file(gpkg, layer=layer) if layer else gpd.read_file(gpkg)
print(g.columns.tolist(), len(g)); namecol = [c for c in g.columns if c.lower() in ('name', 'region', 'supply_region', 'supplyregion', 'supply', 'id')][0]
g = g.to_crs(4326); print(g[namecol].tolist())
NORM = {'KwaZulu-Natal': 'Kwazulu Natal', 'KwaZulu Natal': 'Kwazulu Natal', 'Hydra': 'Hydra Central', 'Hydra_Central': 'Hydra Central', 'North_West': 'North West', 'Free_State': 'Free State', 'Northern_Cape': 'Northern Cape', 'Western_Cape': 'Western Cape', 'Eastern_Cape': 'Eastern Cape'}
subs = json.load(open('/home/user/gridtwin-za/nodal/substations_compact.json'))['subs']
out = {}; changes = []
for s in subs:
    pt = Point(s['lng'], s['lat']); hit = g[g.contains(pt)]
    if len(hit) == 0:
        d = g.distance(pt); hit = g.loc[[d.idxmin()]]; note = f'outside every polygon; nearest at {d.min() * 111:.1f} km'
    else: note = ''
    a = NORM.get(str(hit.iloc[0][namecol]), str(hit.iloc[0][namecol]))
    out[s['n']] = {'file': s['area'], 'rule': a, 'changed': a != s['area'], 'note': note}
    if a != s['area']: changes.append((s['n'], s['area'], a, note))
json.dump({'meta': {'rule': '756 (b): area by point in polygon of rsa_supply_regions.gpkg (PyPSA-RSA; the fleet file\'s boundary set)', 'gpkg': gpkg, 'layer': layer, 'names': g[namecol].tolist()}, 'subs': out}, open(S + 'area_map_v3.json', 'w'), indent=1)
print(len(subs), 'substations;', len(changes), 'changed:'); [print('  ', c) for c in changes]
