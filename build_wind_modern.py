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
For the sample year(s), the V162 at 120 m is fetched at every site and combined with the site weights into regional
series, and paired with the file's own V90 series for that year (bias factor removed). The V90 is also fetched in two
regions (CHECK) and compared with the file: a mismatch stops the build. For each region an hourly mapping from V90 output to V162 output is fitted (mean V162 output in
each of 50 bins of V90 output), and applied to every year of the existing file after removing its bias correction;
clipped at 1. Each year keeps its own weather; only the turbine changes. The file is UNCORRECTED: the correction for new
wind (chosen from the farm comparison, check_wind_farms.py) is applied in index.html (WIND_NEW_CORR), so its cases share
one file. Recorded in the output metadata.

The national mapping the page uses for its default single-year profile (WIND_MOD_MAP: mean modern/current ratio in 50
bins of capacity-weighted national current-turbine output, all years) is computed here from the written series, exactly
as the page's bldBuildWindModMap does, and written to MAP_OUT so the page has it at start-up without the 9 MB multi-year
file. The page recomputes it when the full files load and stops if the two disagree.

USAGE (repo root; the Renewables.ninja credential is attached by the environment)
    python3 build_wind_modern.py            # writes nodal/profiles_wind_modern.json
"""
import json, os, time, urllib.request, urllib.parse, urllib.error

SITES = 'profile_sites.json'
SRC = 'nodal/profiles_regional_multiyear.json'
OUT = 'nodal/profiles_wind_modern.json'
MAP_OUT = 'nodal/profiles_wind_modern_map.json'
CAP = 'nodal/regional_renewable_capacity.json'   # the page's capacity weights (bldWxWeights.wind)
CACHE = 'ninja_wind_cache.json'
YEARS = [int(y) for y in os.environ.get('SAMPLE_YEARS', '2019').split(',')]
OLD = ('Vestas V90 2000', 80)
NEW = ('Vestas V162 5600', 120)
BINS = 50
PACE = float(os.environ.get('PACE', '75'))   # seconds between requests
# The current turbine is fetched only in these regions, to check that a fresh fetch reproduces the file; the mapping
# pairs the modern turbine with the file's own current-turbine series (bias factor removed), which halves the requests.
CHECK = ('Free State', 'Kwazulu Natal')

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
            if e.code < 500: raise
            print(f'  retry {attempt+1} after HTTP {e.code}', flush=True)   # server-side errors are temporary
            time.sleep(60 * (attempt + 1))
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
                for name, h in ((OLD, NEW) if region in CHECK else (NEW,)):
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
    for region in CHECK:
        for y in YEARS:
            old = regional(region, y, OLD); file = [v / scale / bias for v in d['wind_pu'][region][str(y)]]
            a, b = sum(old) / 8760, sum(min(1.0 / bias, v) for v in file) / 8760
            worst = max(worst, abs(a - b) / b)
    print(f'V90 basis check: worst annual-mean difference against the file {worst*100:.2f}%')
    if worst > 0.02: raise SystemExit('the fetched V90 does not reproduce the file; the mapping would be on another basis')
    # The correction for NEW wind is a decision, not inherited (user, 7 Oct 2026): the fleet factor was fitted to a
    # V90-at-80 m proxy against Eskom's older fleet and may be correcting the turbine proxy, not the weather. It is
    # applied in index.html (WIND_NEW_CORR, from check_wind_farms.py), not here.
    out, note = {}, {}
    for region in sites:
        num, den = [0.0] * BINS, [0] * BINS
        for y in YEARS:
            old, new = [min(1.0, v / scale / bias) for v in d['wind_pu'][region][str(y)]], regional(region, y, NEW)
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
            out[region][y] = [min(scale, round(min(1.0, f[min(BINS - 1, int(min(1.0, r) * BINS))]) * scale)) for r in raw]
        cf_old = sum(sum(v) for v in d['wind_pu'][region].values()) / scale / (8760 * len(d['wind_pu'][region]))
        cf_new = sum(sum(v) for v in out[region].values()) / scale / (8760 * len(out[region]))
        note[region] = [round(cf_old * 100, 1), round(cf_new * 100, 1)]
        print(f'{region:15s} CF current {cf_old*100:.1f}% -> modern {cf_new*100:.1f}%')
    json.dump({'meta': {
        'source': f'Renewables.ninja MERRA-2 (CC BY-NC 4.0), {NEW[0]} at {NEW[1]} m against the existing file series ({OLD[0]} at {OLD[1]} m; fresh-fetch check in {list(CHECK)}), at the 98 sites of profile_sites.json with their weights, local_time=true; sample years {YEARS}.',
        'method': 'Per region, mean modern-turbine output in 50 bins of current-turbine output, fitted on the sample years and applied to every year of profiles_regional_multiyear.json after removing its fleet bias factor; clipped at 1. Each year keeps its own weather. Uncorrected: the correction for new wind is applied in index.html (WIND_NEW_CORR).',
        'use': 'New wind only. Existing farms keep profiles_regional_multiyear.json.',
        'fleet_bias_factor_removed_from_inputs': bias, 'new_wind_correction': 'none in this file; index.html WIND_NEW_CORR',
        'cf_current_vs_modern_pct': note, 'built_by': 'build_wind_modern.py, 7 Oct 2026',
        'licence': d['meta'].get('licence'), 'copyright': d['meta'].get('copyright'), 'years': d['meta']['years']},
        'scale': scale, 'wind_modern_pu': out}, open(OUT, 'w'), separators=(',', ':'))
    print('wrote', OUT)
    # National mapping for the page's default profile, as bldBuildWindModMap: weights normalised over all regions in CAP,
    # regions lacking either series skipped, ratio of sums per bin of national current-turbine output.
    cap = json.load(open(CAP))['wind_mw']; T = sum(cap.values()); W = {r: v / T for r, v in cap.items()}
    num, den = [0.0] * BINS, [0.0] * BINS
    for y in d['meta']['years']:
        o, m = [0.0] * 8760, [0.0] * 8760
        for r, w in W.items():
            F, M = d['wind_pu'].get(r, {}).get(str(y)), out.get(r, {}).get(str(y))
            if not w or not F or not M: continue
            for h in range(8760): o[h] += w * F[h] / scale; m[h] += w * M[h] / scale
        for h in range(8760):
            b = min(BINS - 1, int(o[h] * BINS)); num[b] += m[h]; den[b] += o[h]
    nmap = [num[b] / den[b] if den[b] > 1e-9 else 1 for b in range(BINS)]
    json.dump({'meta': {'what': 'WIND_MOD_MAP: modern/current wind output ratio in 50 bins of national current-turbine output, capacity-weighted (' + CAP + '), all years; uncorrected.',
                        'built_by': 'build_wind_modern.py from ' + OUT, 'years': d['meta']['years'],
                        'licence': d['meta'].get('licence'), 'copyright': d['meta'].get('copyright')}, 'map': nmap}, open(MAP_OUT, 'w'), separators=(',', ':'))
    print('wrote', MAP_OUT)

if __name__ == '__main__':
    main()
