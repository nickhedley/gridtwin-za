"""
GridTwin ZA - modern-turbine wind profiles for NEW wind (user, 7 Oct 2026; TODO 14av).

WHY
New wind capex now comes from BW6 bids and recent projects built with modern machines: Impofu, Nordex N163 5.5 MW
on 120 m concrete towers; EDF's Koruson 1, 5.4 MW turbines. The model's wind profile is a Vestas V90 2 MW at 80 m,
bias-corrected to Eskom's observed (older) fleet. Modern-turbine prices on an old-turbine profile would understate
new wind, so capex and profile change together, as with solar tracking. Existing farms keep their current profile.

SOURCE
Renewables.ninja (MERRA-2; CC BY-NC 4.0), at the 98 REEA-located sites of profile_sites.json with their weights,
local_time=true, as the existing multi-site wind. Modern turbine: Vestas V162 5600 at 120 m (162 m rotor, about
272 W/m2), the closest Renewables.ninja model to Impofu's N163 5.5 MW (about 264 W/m2).

METHOD (request budget: one year per request, about 50 requests an hour)
For the sample year(s), both the V90 at 80 m and the V162 at 120 m are fetched at every site and combined with the
site weights into regional series. The fetched V90 is checked against the existing file for that year: a mismatch
stops the build. For each region an hourly mapping from V90 output to V162 output is fitted (mean V162 output in
each of 50 bins of V90 output), and applied to every year of the existing file after removing its bias correction;
the bias factor is then applied to the result, clipped at 1. Each year keeps its own weather; only the turbine
changes. Recorded in the output metadata.

USAGE (repo root; the Renewables.ninja credential is attached by the environment)
    python3 build_wind_modern.py            # writes nodal/profiles_wind_modern.json
"""
import json, os, time, urllib.request, urllib.parse, urllib.error

SITES = 'profile_sites.json'
SRC = 'nodal/profiles_regional_multiyear.json'
OUT = 'nodal/profiles_wind_modern.json'
CACHE = 'ninja_wind_cache.json'
YEARS = [int(y) for y in os.environ.get('SAMPLE_YEARS', '2019').split(',')]
OLD = ('Vestas V90 2000', 80)
NEW = ('Vestas V162 5600', 120)
BINS = 50
PACE = float(os.environ.get('PACE', '75'))   # seconds between requests

def fetch(lat, lon, year, turbine, height):
    q = dict(lat=lat, lon=lon, date_from=f'{year}-01-01', date_to=f'{year}-12-31', capacity=1, height=height,
             turbine=turbine, format='json', dataset='merra2', local_time='true')
    req = urllib.request.Request('https://www.renewables.ninja/api/data/wind?' + urllib.parse.urlencode(q))
    req.add_header('User-Agent', 'gridtwin-za/1.0 (research; github.com/nickhedley/gridtwin-za)')   # the default Python agent is refused
    # The API credential is attached by the environment for this host (user, 7 Oct 2026); no token is handled here.
    for attempt in range(8):
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                d = json.loads(r.read().decode())
            vals = [v['electricity'] for _, v in sorted(d['data'].items(), key=lambda kv: int(kv[0]))]
            return vals[:8760]
        except urllib.error.HTTPError as e:
            if e.code == 429: print('rate limited; waiting 30 min', flush=True); time.sleep(1800); continue
            raise
        except Exception as e:
            print(f'  retry {attempt+1} after {type(e).__name__}: {str(e)[:160]}', flush=True)
            time.sleep(60 * (attempt + 1))
    raise RuntimeError('fetch failed')

def main():
    sites = json.load(open(SITES))['wind']
    d = json.load(open(SRC)); scale = d.get('scale', 1000)
    bias = float(d['meta'].get('bias_corrected', '').split('scaled by ')[1].split(' ')[0])
    cache = json.load(open(CACHE)) if os.path.exists(CACHE) else {}
    for y in YEARS:
        for region, R in sites.items():
            for i, s in enumerate(R['sites']):
                for name, h in (OLD, NEW):
                    k = f'{region}|{i}|{y}|{name}|{h}'
                    if k in cache: continue
                    cache[k] = fetch(s['lat'], s['lng'], y, name, h)
                    print(f'  {k} CF {sum(cache[k])/len(cache[k]):.3f} ({len(cache[k])} h)', flush=True)
                    json.dump(cache, open(CACHE, 'w'))
                    time.sleep(PACE)
            print(f'{region:15s} {y} fetched', flush=True)
    # Regional series for each turbine, site weights normalised, as the existing multi-site wind.
    def regional(region, y, turbine):
        R = sites[region]['sites']; W = sum(s['w'] for s in R); out = [0.0] * 8760
        for i, s in enumerate(R):
            ser = cache[f'{region}|{i}|{y}|{turbine[0]}|{turbine[1]}']
            for h in range(8760): out[h] += ser[h] * s['w'] / W
        return out
    worst = 0
    for region in sites:
        for y in YEARS:
            old = regional(region, y, OLD); file = [v / scale / bias for v in d['wind_pu'][region][str(y)]]
            a, b = sum(old) / 8760, sum(min(1.0 / bias, v) for v in file) / 8760
            worst = max(worst, abs(a - b) / b)
    print(f'V90 basis check: worst annual-mean difference against the file {worst*100:.2f}%')
    if worst > 0.02: raise SystemExit('the fetched V90 does not reproduce the file; the mapping would be on another basis')
    out, note = {}, {}
    for region in sites:
        num, den = [0.0] * BINS, [0] * BINS
        for y in YEARS:
            old, new = regional(region, y, OLD), regional(region, y, NEW)
            for h in range(8760):
                b = min(BINS - 1, int(old[h] * BINS)); num[b] += new[h]; den[b] += 1
        # Empty bins take the nearest filled bin's ratio, so the mapping stays defined and monotone in practice.
        f = [num[b] / den[b] if den[b] else None for b in range(BINS)]
        for b in range(BINS):
            if f[b] is None:
                near = min((abs(b - c), c) for c in range(BINS) if den[c])[1]
                f[b] = f[near] * ((b + 0.5) / (near + 0.5))
        out[region] = {}
        for y, ser in d['wind_pu'][region].items():
            raw = [v / scale / bias for v in ser]
            out[region][y] = [min(scale, round(min(1.0, f[min(BINS - 1, int(min(1.0, r) * BINS))] * bias) * scale)) for r in raw]
        cf_old = sum(sum(v) for v in d['wind_pu'][region].values()) / scale / (8760 * len(d['wind_pu'][region]))
        cf_new = sum(sum(v) for v in out[region].values()) / scale / (8760 * len(out[region]))
        note[region] = [round(cf_old * 100, 1), round(cf_new * 100, 1)]
        print(f'{region:15s} CF current {cf_old*100:.1f}% -> modern {cf_new*100:.1f}%')
    json.dump({'meta': {
        'source': f'Renewables.ninja MERRA-2 (CC BY-NC 4.0), {NEW[0]} at {NEW[1]} m against {OLD[0]} at {OLD[1]} m, at the 98 sites of profile_sites.json with their weights, local_time=true; sample years {YEARS}.',
        'method': 'Per region, mean modern-turbine output in 50 bins of current-turbine output, fitted on the sample years and applied to every year of profiles_regional_multiyear.json after removing its bias factor; the bias factor is reapplied, clipped at 1. Each year keeps its own weather.',
        'use': 'New wind only. Existing farms keep profiles_regional_multiyear.json.',
        'bias_factor': bias, 'cf_current_vs_modern_pct': note, 'built_by': 'build_wind_modern.py, 7 Oct 2026',
        'licence': d['meta'].get('licence'), 'copyright': d['meta'].get('copyright'), 'years': d['meta']['years']},
        'scale': scale, 'wind_modern_pu': out}, open(OUT, 'w'), separators=(',', ':'))
    print('wrote', OUT)

if __name__ == '__main__':
    main()
