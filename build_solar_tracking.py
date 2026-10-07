"""
GridTwin ZA - single-axis tracking solar profiles for NEW utility solar (TODO 14aw, user, 7 Oct 2026).

WHY
New utility solar in South Africa is single-axis tracking (every BW6 PV project, IPP Office REIPPPP note,
7 Nov 2025, capacity factor about 30%), while the model's solar profile is fixed tilt (about 22%). Tracker
capex with a fixed-tilt profile would understate new solar; the user's decision is to switch new-build solar
to a tracking profile and BW6 tracker capex together. Existing solar keeps its fixed-tilt profile.

SOURCE
PVGIS (EC JRC) v5_3, PVGIS-SARAH3, at the SAME ten regional points rebuild_solar_pvgis.py uses for the
fixed-tilt profiles, 10% system loss, trackingtype=1 (single horizontal axis, north-south). The user asked
for Renewables.ninja's tracking option; it is not reachable from the cloud environment, so PVGIS is used
(the user's fallback, 7 Oct 2026). This is the same source as the existing fixed-tilt solar, so only the
mounting changes.

YEARS
SARAH3 covers 2005-2023. 2014-2023 are fetched directly. 2024 and 2025 are outside coverage: each keeps its
own hourly series from the fixed-tilt file, multiplied by PVGIS's tracking/fixed ratio for that region,
month and hour of day, averaged over 2014-2023. Recorded in the output metadata; not measured weather.

CHECK
The fixed-tilt series is fetched too and compared with the existing file for 2014-2023; a mismatch stops
the build, because the tracking series would then not be on the same basis.

TIME
PVGIS returns UTC; the fixed-tilt file is shifted +2 h to SAST (8 Sep 2026). The same shift is applied.

USAGE (from the repo root)
    python3 build_solar_tracking.py               # writes nodal/profiles_solar_tracking.json
"""
import json, os, time, urllib.request
from rebuild_solar_pvgis import COORDS

API, DB, LOSS = 'v5_3', 'PVGIS-SARAH3', 10
SRC = 'nodal/profiles_regional_multiyear.json'
OUT = 'nodal/profiles_solar_tracking.json'
CACHE = 'pvgis_tracking_cache.json'
SHIFT = 2   # hours, UTC to SAST

def fetch(lat, lon, year, tracking):
    mount = '&trackingtype=1' if tracking else f'&angle={abs(lat):.0f}&aspect=180'
    url = (f'https://re.jrc.ec.europa.eu/api/{API}/seriescalc?lat={lat}&lon={lon}&startyear={year}&endyear={year}'
           f'&pvcalculation=1&peakpower=1&loss={LOSS}{mount}&outputformat=json&raddatabase={DB}')
    for attempt in range(4):
        try:
            with urllib.request.urlopen(url, timeout=120) as r:
                h = json.loads(r.read().decode())['outputs']['hourly']
            return [min(1.0, max(0.0, x['P'] / 1000.0)) for x in h][:8760]
        except Exception as e:
            if attempt == 3: raise
            time.sleep(2 ** (attempt + 1))

def shift(ser):
    return ser[-SHIFT:] + ser[:-SHIFT]

def main():
    d = json.load(open(SRC)); scale = d.get('scale', 1000)
    years = [str(y) for y in d['meta']['years']]
    cache = json.load(open(CACHE)) if os.path.exists(CACHE) else {}
    direct = [y for y in years if int(y) <= 2023]
    for region, (lat, lon) in COORDS.items():
        for y in direct:
            for trk in (0, 1):
                k = f'{region}|{y}|{trk}'
                if k in cache: continue
                cache[k] = shift(fetch(lat, lon, int(y), trk))
                json.dump(cache, open(CACHE, 'w'))
                time.sleep(1)
        print(f'{region:15s} fetched', flush=True)
    # Basis check: fixed tilt from this fetch against the file, 2014-2023.
    worst = 0
    for region in COORDS:
        for y in direct:
            old = d['solar_pu'][region][y]; new = cache[f'{region}|{y}|0']
            a, b = sum(old) / scale / len(old), sum(new) / len(new)
            worst = max(worst, abs(a - b) / a)
    print(f'fixed-tilt basis check: worst annual-mean difference {worst*100:.2f}%')
    if worst > 0.01: raise SystemExit('fixed-tilt fetch does not reproduce the file; tracking would be on another basis')
    out = {}; ratio_note = {}
    for region in COORDS:
        out[region] = {}
        num = [[0.0]*24 for _ in range(12)]; den = [[0.0]*24 for _ in range(12)]
        for y in direct:
            f, t = cache[f'{region}|{y}|0'], cache[f'{region}|{y}|1']
            for h in range(8760):
                m = month_of(h); num[m][h % 24] += t[h]; den[m][h % 24] += f[h]
            out[region][y] = [round(v * scale) for v in t]
        G = [[(num[m][hh] / den[m][hh]) if den[m][hh] > 1e-6 else 1.0 for hh in range(24)] for m in range(12)]
        for y in years:
            if y in out[region]: continue
            old = d['solar_pu'][region][y]
            out[region][y] = [min(scale, round(old[h] * G[month_of(h)][h % 24])) for h in range(8760)]
        cf = {y: round(sum(v) / scale / 87.6, 1) for y, v in out[region].items()}
        ratio_note[region] = cf
        print(f'{region:15s} tracking CF by year {cf}')
    json.dump({'meta': {
        'source': f'PVGIS (EC JRC) {API}, {DB}, single horizontal axis north-south (trackingtype=1), {LOSS}% system loss, at the ten regional points of rebuild_solar_pvgis.py. Renewables.ninja tracking was asked for and is not reachable from the cloud environment; PVGIS is the same source as the fixed-tilt solar.',
        'years': [int(y) for y in years], 'scale': scale,
        'borrowed_years': '2024 and 2025 are outside SARAH3 coverage: each is its own fixed-tilt hourly series times the PVGIS tracking/fixed ratio by region, month and hour, averaged over 2014-2023. Not measured weather.',
        'timezone': 'Shifted +2 h from UTC to SAST, as the fixed-tilt file.',
        'use': 'New utility solar only, when the tracking option is on. Existing solar keeps the fixed-tilt profile.',
        'built_by': 'build_solar_tracking.py, 7 Oct 2026',
        'licence': d['meta'].get('licence'), 'copyright': d['meta'].get('copyright'),
        'cf_by_region_year': ratio_note},
        'scale': scale, 'solar_trk_pu': out}, open(OUT, 'w'), separators=(',', ':'))
    print('wrote', OUT)

_MD = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
_MSTART = [sum(_MD[:i]) * 24 for i in range(12)]
def month_of(h):
    for m in range(11, -1, -1):
        if h >= _MSTART[m]: return m

if __name__ == '__main__':
    main()
