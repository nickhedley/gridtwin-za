"""
GridTwin ZA - choose the coordinates that fetch_real_regional_profiles.py will sample.

WHY THIS EXISTS
The existing profiles use ONE capacity-weighted centroid per region. Measured against
Eskom's ESK19679 (Apr 2022 - Aug 2026), the national wind aggregate sits below 2% output
for 93 hours a year against an observed 7. Thirteen times too often, and concentrated in
exactly the hours that decide adequacy. A single coordinate behaves like a single wind
farm; a fleet spread over 500 km does not.

The fix is to sample several points per region and average. This script picks the points.

WHY REEA AND NOT THE PyPSA-RSA PLANT LIST
The centroids were computed from PyPSA-RSA's reipppp_wind_data.csv. That file is not on
disk and is not in the public repo - it ships in a data bundle on a host we cannot reach.
More importantly, checking its surviving capacities against the awards-based file the
27 Aug rebuild rejected shows the SAME lineage: North West solar 719 MW against that file's
722, and Northern Cape and Free State inverted the same way. Using it would reintroduce the
geography that rebuild removed.

REEA is environmental authorisations, not commissioning, so it CANNOT be used for capacity.
It is used here only for LOCATION - where in a province wind and solar are developable.
Permits cluster where the resource is, which is what a sample should reflect. Regional
capacity totals continue to come from regional_renewable_capacity.json.

WEIGHTING
Sites within a region are weighted by permitted MW, which is a proxy for where developers
found the best resource. That is a weaker claim than built capacity and it is the right
one for a location sample: it says "sample harder where more capacity wants to go".

OUTPUT
profile_sites.json, consumed by the multi-site fetch. Inspect it before spending API calls -
the free tier is 50 requests an hour and this is the cheap step.
"""
import json, math, argparse
from collections import defaultdict

REEA = 'nodal/reea_projects.json'
CAP = 'nodal/regional_renewable_capacity.json'
OUT = 'profile_sites.json'

# GridTwin regions. Hydra Central is a supply area spanning the Karoo across the Northern
# Cape / Eastern Cape boundary, so it has no REEA province of its own - sites are assigned
# to it by bounding box, matching how the capacity file treats it.
HYDRA_BOX = {'lat': (-32.6, -30.0), 'lng': (22.5, 25.5)}


def region_of(site):
    """REEA gives a province. Hydra Central is a supply area, so it is carved out by box."""
    la, lo = site['lat'], site['lng']
    if HYDRA_BOX['lat'][0] <= la <= HYDRA_BOX['lat'][1] and HYDRA_BOX['lng'][0] <= lo <= HYDRA_BOX['lng'][1]:
        return 'Hydra Central'
    return site.get('province')


def spread_km(sites):
    if len(sites) < 2:
        return 0.0
    la = [s['lat'] for s in sites]
    lo = [s['lng'] for s in sites]
    mid = sum(la) / len(la)
    return max((max(la) - min(la)) * 111.0,
               (max(lo) - min(lo)) * 111.0 * math.cos(math.radians(mid)))


def pick(sites, n):
    """
    Choose n sites that SPREAD, not just the n largest.

    Taking the largest permits alone clusters: the biggest projects sit in the same few
    wind corridors, which is the problem being fixed. So this takes the largest first,
    then repeatedly adds whichever remaining site is furthest from everything already
    chosen - a max-min dispersion pick. Capacity still weights the average afterwards.
    """
    if len(sites) <= n:
        return sites
    chosen = [max(sites, key=lambda s: s.get('mw') or 0)]
    rest = [s for s in sites if s is not chosen[0]]
    while len(chosen) < n and rest:
        def mindist(s):
            return min(math.hypot((s['lat'] - c['lat']) * 111.0,
                                  (s['lng'] - c['lng']) * 111.0 *
                                  math.cos(math.radians(s['lat']))) for c in chosen)
        nxt = max(rest, key=mindist)
        chosen.append(nxt)
        rest.remove(nxt)
    return chosen


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--sites', type=int, default=12,
                    help='sites per region per technology. 12 x 2 tech x ~7 regions is '
                         'about 170 API calls at 50/hour.')
    ap.add_argument('--min-mw', type=float, default=10.0,
                    help='ignore permits below this size; they add calls, not diversity.')
    args = ap.parse_args()

    reea = json.load(open(REEA))
    items = reea if isinstance(reea, list) else reea.get('projects', [])
    cap = json.load(open(CAP))

    out = {'meta': {
        'purpose': 'Multi-site coordinates for the regional profile rebuild. Replaces one '
                   'capacity-weighted centroid per region, which sat below 2% output for '
                   '93 hours a year against Eskom-observed 7.',
        'locations_from': 'DFFE REEA environmental authorisations - LOCATION ONLY. REEA is '
                          'permits, not commissioning, and is not used for capacity.',
        'capacity_from': 'regional_renewable_capacity.json, unchanged.',
        'not_from': 'PyPSA-RSA reipppp_*.csv - its surviving capacities match the '
                    'awards-based file rejected on 27 Aug (North West solar 719 vs 722), '
                    'so its geography was not reused.',
        'sites_per_region': args.sites,
    }, 'wind': {}, 'solar': {}}

    for key, match in [('wind', lambda t: t == 'Wind'),
                       ('solar', lambda t: t == 'Solar PV')]:
        pool = defaultdict(list)
        for x in items:
            if not match((x.get('tech') or '').strip()):
                continue
            if (x.get('status') or '') != 'Approved':
                continue
            if not (x.get('lat') and x.get('lng')):
                continue
            if (x.get('mw') or 0) < args.min_mw:
                continue
            r = region_of(x)
            if r:
                pool[r].append({'lat': round(x['lat'], 4), 'lng': round(x['lng'], 4),
                                'mw': x['mw'], 'name': (x.get('name') or '')[:60]})

        capkey = 'wind_mw' if key == 'wind' else 'solar_mw'
        built = {}
        for src in cap.get('by_source', {}).values():
            for r, v in (src.get(capkey) or {}).items():
                built[r] = built.get(r, 0) + (v or 0)

        for r, sites in sorted(pool.items()):
            # A region with no built capacity does not need a sampled profile: nothing is
            # weighted onto it. Keep one site so the series exists for scenario builds.
            n = args.sites if built.get(r, 0) > 0 else 1
            sel = pick(sites, n)
            tot = sum(s['mw'] for s in sel) or 1
            out[key][r] = {
                'built_mw': round(built.get(r, 0), 1),
                'permits_available': len(sites),
                'spread_km': round(spread_km(sel)),
                'sites': [{'lat': s['lat'], 'lng': s['lng'],
                           'w': round(s['mw'] / tot, 4), 'name': s['name']} for s in sel],
            }

    json.dump(out, open(OUT, 'w'), indent=1)

    print(f'Wrote {OUT}\n')
    total = 0
    for key in ('wind', 'solar'):
        print(f'{key.upper()}')
        print(f"  {'region':<16}{'built MW':>10}{'permits':>9}{'sampled':>9}{'spread':>9}")
        for r, v in sorted(out[key].items(), key=lambda z: -z[1]['built_mw']):
            total += len(v['sites'])
            print(f"  {r:<16}{v['built_mw']:>10,.0f}{v['permits_available']:>9}"
                  f"{len(v['sites']):>9}{v['spread_km']:>8}km")
        print()
    print(f'{total} API calls at one per site-year. Free tier is 50/hour.')
    print('Check the spread column before fetching: a region under ~150 km has not '
          'bought much diversity and its site count can be cut.')


if __name__ == '__main__':
    main()
