#!/usr/bin/env python3
"""
build_substation_bands.py - regenerate nodal/substation_bands.json

WHAT THIS PRODUCES, AND WHAT IT IS NOT
--------------------------------------
Eskom/NTCSA publish grid connection headroom by REGION only. There is no
published per-substation figure. This script disaggregates the published
regional number across substations using network topology, so that:

    the regional totals remain exactly Eskom's published figures;
    the split WITHIN a region is our own estimate.

The output is expressed as BANDS (strong / moderate / limited / none), never
as megawatts, because the method does not support that precision. A band is a
screening rank - "which substations near me are worth an enquiry first" - and
carries no commitment from Eskom, NTCSA or anyone else.

METHOD
------
    connected circuit capacity        (thermal rating inferred by voltage class)
  - largest single connected circuit  (N-1 planning criterion)
  - existing generation within 120 km (fleet register GPS coordinates)
  = spare capability score
Each region's published GCCA headroom is then shared out in proportion to that
score. Bands are cut on each substation's share of the NATIONAL total for the
technology, so a band means the same thing in every province rather than being
relative to its own region.

KNOWN LIMITATIONS (also written into the output file's meta block)
  * Not a load flow. Real headroom depends on contingency analysis, voltage
    stability and short-circuit levels; two substations with identical local
    topology can differ severalfold.
  * Circuit ratings are inferred from voltage class. Real ratings vary roughly
    twofold with conductor type and ambient conditions.
  * ~69% of line endpoints match the substation register, so some nodes appear
    less connected than they are.
  * Existing generation is matched by nearest substation within 120 km and is
    incomplete (about 52 of the fleet's station groups place successfully).
  * Solar and wind bands are often identical, because published GCCA headroom
    is equal for both in most regions and the topology score is technology
    neutral. Real headroom does differ by technology.

WHEN TO RERUN
-------------
Whenever nodal/headroom_summary.json changes (a new GCCA release), or when
substations_compact.json / transmission_lines.geojson / fleet_by_region_v2.csv
are updated. The bands are DERIVED - never hand-edit substation_bands.json,
for the same reason pvUtilityMW went wrong: a hand-set constant nobody can
reproduce eventually stops matching its own source.

USAGE
-----
    python3 build_substation_bands.py [ROOT]
ROOT defaults to the current directory and must contain nodal/.
"""
import json, csv, math, sys, os
from collections import defaultdict, Counter

ROOT = sys.argv[1] if len(sys.argv) > 1 else '.'
N = lambda *p: os.path.join(ROOT, 'nodal', *p)

# Indicative thermal rating per circuit by voltage class, MW. Blended typical
# values - real ratings vary with conductor, span and ambient temperature.
RATING = {765: 3000, 533: 1920, 400: 1300, 275: 600, 220: 400}
DEFAULT_RATING = 300
GEN_MATCH_KM = 120          # how far a power station may sit from "its" substation
BAND_STRONG = 0.030         # share of national total for that technology
BAND_MODERATE = 0.012

subs  = json.load(open(N('substations_compact.json')))['subs']
lines = json.load(open(N('transmission_lines.geojson')))['features']
head  = json.load(open(N('headroom_summary.json')))['headroom']
byname = {s['n'].upper(): s for s in subs}

# ---- 1. connectivity ---------------------------------------------------------
cap, ratings, deg = defaultdict(float), defaultdict(list), defaultdict(int)
matched = total = 0
for f in lines:
    p = f['properties']
    r = RATING.get(p.get('voltage') or 0, DEFAULT_RATING)
    for k in ('start', 'end'):
        n = str(p.get(k, '')).upper().strip()
        total += 1
        if n in byname:
            matched += 1
            cap[n] += r; ratings[n].append(r); deg[n] += 1

# N-1: the network must survive losing the largest single circuit.
n1 = {n: max(0.0, cap[n] - max(ratings[n])) for n in cap}

# ---- 2. existing generation already using that capacity ----------------------
def haversine_km(a, b, c, d):
    R = 6371.0; rad = math.radians
    return 2 * R * math.asin(math.sqrt(
        math.sin(rad(c - a) / 2) ** 2 +
        math.cos(rad(a)) * math.cos(rad(c)) * math.sin(rad(d - b) / 2) ** 2))

gen = defaultdict(float); placed = 0
for row in csv.DictReader(open(N('fleet_by_region_v2.csv'))):
    if row.get('Scenario') != 'BASE':
        continue
    try:
        lat = float(row['GPS Latitude']); lng = float(row['GPS Longitude'])
        mw  = float(row['Capacity (MW)'])
    except (ValueError, KeyError):
        continue
    best, best_km = None, 1e9
    for s in subs:
        d = haversine_km(lat, lng, s['lat'], s['lng'])
        if d < best_km:
            best_km, best = d, s
    if best and best_km < GEN_MATCH_KM:
        gen[best['n'].upper()] += mw; placed += 1

spare = {n: max(0.0, n1.get(n, 0.0) - gen.get(n, 0.0)) for n in byname}

# ---- 3. distribute each region's PUBLISHED headroom by that share ------------
alloc = {}
for region, h in head.items():
    members = [s['n'].upper() for s in subs if s['area'] == region]
    tot = sum(spare.get(m, 0.0) for m in members)
    for m in members:
        share = (spare.get(m, 0.0) / tot) if tot > 0 else 0.0
        alloc[m] = {'solar': h['solar_mw'] * share, 'wind': h['wind_mw'] * share}

national = {t: sum(v[t] for v in alloc.values()) for t in ('solar', 'wind')}

def band(mw, tech):
    if mw <= 1:
        return 'none'
    p = mw / national[tech] if national[tech] > 0 else 0.0
    if p >= BAND_STRONG:   return 'strong'
    if p >= BAND_MODERATE: return 'moderate'
    return 'limited'

bands = {}
for upper, s in byname.items():
    a = alloc.get(upper, {'solar': 0.0, 'wind': 0.0})
    bands[s['n']] = {
        'solar': band(a['solar'], 'solar'),
        'wind':  band(a['wind'],  'wind'),
        'circuits': deg.get(upper, 0),
        'kv': s['kv'],
        'area': s['area'],
    }

doc = {
  'meta': {
    'title': 'INDICATIVE connection-capability bands - GridTwin ZA estimate, NOT an Eskom figure',
    'generated_by': 'build_substation_bands.py',
    'estimate_warning': (
      'These bands are OUR OWN ESTIMATE, produced by GridTwin ZA. Eskom and NTCSA '
      'publish connection headroom by REGION only; no per-substation figure is '
      'published. We disaggregate the published regional number using network '
      "topology, so the regional totals remain exactly Eskom's while the split "
      'within a region is ours.'),
    'method': ('connected circuit capacity by voltage class, minus the largest single '
               'circuit (N-1), minus existing generation within %d km; regional GCCA '
               'headroom then shared out in that proportion.' % GEN_MATCH_KM),
    'limitations': [
      'Not a load flow. Real headroom depends on contingency analysis, voltage stability and short-circuit levels.',
      'Circuit ratings inferred from voltage class; real ratings vary roughly twofold with conductor and conditions.',
      'About %d%% of line endpoints match the substation register, so some nodes appear less connected than they are.' % round(100 * matched / max(1, total)),
      'Existing generation is matched by nearest-substation within %d km and is incomplete.' % GEN_MATCH_KM,
      'Bands are a screening ranking. They are not a connection allowance and carry no commitment from any party.',
    ],
    'use': 'Rank substations worth an enquiry first. Always confirm with a GCCA study and an NTCSA connection application.',
    'regional_source': 'GCCA 2025 + Oct 2025 update (Eskom/NTCSA published, by region)',
    'band_thresholds': {'strong': BAND_STRONG, 'moderate': BAND_MODERATE,
                        'basis': 'share of national headroom for that technology'},
  },
  'bands': bands,
}

out_path = N('substation_bands.json')
json.dump(doc, open(out_path, 'w'), indent=1)

print(f'line endpoints matched to a substation : {matched}/{total} ({100*matched/max(1,total):.0f}%)')
print(f'power stations placed within {GEN_MATCH_KM} km      : {placed}')
print(f'substations banded                     : {len(bands)}')
for t in ('solar', 'wind'):
    c = Counter(v[t] for v in bands.values())
    print(f'  {t:5s} bands: ' + ', '.join(f'{k} {c[k]}' for k in ('strong','moderate','limited','none')))
print(f'written: {out_path}')
