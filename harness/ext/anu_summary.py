# ANU PHES shortlist: assign to model supply areas (nearest substation), summarise. 7 Oct 2026.
# Run: python3 -I harness/ext/anu_summary.py <anu_phes_shortlist_za.csv> nodal/substations_compact.json <out.json> <out.csv>
# The shortlist itself is not in the repository until its licence is confirmed (SOURCES).
import csv, json, sys, math, collections
rows = list(csv.DictReader(open(sys.argv[1])))
subs = json.load(open(sys.argv[2]))['subs']
def hav(a, b, c, d):
    r = math.radians; dl = r(c - a); dn = r(d - b)
    x = math.sin(dl/2)**2 + math.cos(r(a))*math.cos(r(c))*math.sin(dn/2)**2
    return 6371 * 2 * math.asin(math.sqrt(x))
for r in rows:
    la, lo = float(r['Latitude']), float(r['Longitude'])
    best = min(subs, key=lambda s: hav(la, lo, s['lat'], s['lng']))
    big = min((s for s in subs if s['kv'] >= 275), key=lambda s: hav(la, lo, s['lat'], s['lng']))
    r['area'] = best['area']; r['sub'] = best['n']; r['subKm'] = hav(la, lo, best['lat'], best['lng'])
    r['sub275'] = big['n']; r['sub275Km'] = hav(la, lo, big['lat'], big['lng'])
    r['E'] = float(r['Energy Capacity [GWh]']); r['H'] = float(r['Storage Duration [h]']); r['GW'] = r['E'] / r['H']
    r['FoM'] = float(r['Figure of Merit']); r['res'] = r['Pair Identifier'].split(' & ')
# Non-overlapping set: best figure of merit first, each reservoir used once.
used = set(); keep = []
for r in sorted(rows, key=lambda r: r['FoM']):
    if any(x in used for x in r['res']): continue
    used.update(r['res']); keep.append(r)
for r in rows: r['nonOverlap'] = r in keep
AREAS = ['Eastern Cape','Kwazulu Natal','Mpumalanga','Limpopo','Western Cape','Northern Cape','Hydra Central','Free State','Gauteng','North West']
CL = ['AAA','AA','A','B']
def agg(sel):
    return dict(n=len(sel), GWh=sum(r['E'] for r in sel), GW=sum(r['GW'] for r in sel))
out = {'gross': {}, 'nonOverlap': {}}
for key, sel in (('gross', rows), ('nonOverlap', keep)):
    for a in AREAS:
        out[key][a] = {c: agg([r for r in sel if r['area']==a and r['Class']==c]) for c in CL}
        out[key][a]['all'] = agg([r for r in sel if r['area']==a])
print('total gross', agg(rows), 'non-overlapping', agg(keep))
print('area agreement with region_approx (first word):', sum(1 for r in rows if r['area'].split()[0].lower()[:5] in r['region_approx'].lower().replace('-','').replace(' ','')[:30]) , 'of', len(rows))
fmt = lambda d: f"{d['n']:5d} {d['GWh']/1e3:7.1f} TWh {d['GW']:7.0f} GW"
print('\nNON-OVERLAPPING by area (sites, TWh, GW) | AAA+AA sites, TWh | best FoM | median km to substation (>=275 kV)')
for a in AREAS:
    sel = [r for r in keep if r['area']==a]
    if not sel: print(f'{a:15s} none'); continue
    top = [r for r in sel if r['Class'] in ('AAA','AA')]
    km = sorted(r['sub275Km'] for r in sel)
    print(f"{a:15s} {fmt(agg(sel))} | {len(top):4d} {sum(r['E'] for r in top)/1e3:6.1f} TWh | {min(r['FoM'] for r in sel):6.0f} | {km[len(km)//2]:5.0f} km")
print('\nGROSS by area and class (sites):')
for a in AREAS: print(f"{a:15s}", {c: out['gross'][a][c]['n'] for c in CL}, 'all', out['gross'][a]['all']['n'])
print('\nNON-OVERLAPPING by size (sites, TWh):', {s: (sum(1 for r in keep if r['System Size']==s), round(sum(r['E'] for r in keep if r['System Size']==s)/1e3,1)) for s in sorted(set(r['System Size'] for r in keep), key=lambda s: float(s.split('GWh')[0]))})
# Eastern Cape near the wind: distance from each EC site to the wind-cluster substations.
wind_subs = [s for s in subs if s['n'] in ('Poseidon','Grassridge','Dedisa','Delphi','Vuyani','Pembroke','Neptune','Droerivier','Gamma','Kappa')]
print('\nwind-area substations found:', [(s['n'], s['area']) for s in wind_subs])
for lim in (50, 100):
    sel = [r for r in keep if r['area']=='Eastern Cape' and min(hav(float(r['Latitude']),float(r['Longitude']),s['lat'],s['lng']) for s in wind_subs if s['area']=='Eastern Cape') <= lim]
    print(f'EC non-overlapping sites within {lim} km of Poseidon/Grassridge/Dedisa/Delphi:', fmt(agg(sel)), {c: sum(1 for r in sel if r['Class']==c) for c in CL})
json.dump(out, open(sys.argv[3], 'w'), indent=1)
w = csv.writer(open(sys.argv[4], 'w', newline=''))
w.writerow(['area','class','set','sites','energy_GWh','power_GW'])
for key in ('gross','nonOverlap'):
    for a in AREAS:
        for c in CL + ['all']:
            d = out[key][a][c]; w.writerow([a, c, key, d['n'], round(d['GWh']), round(d['GW'], 1)])
