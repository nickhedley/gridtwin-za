"""
GridTwin ZA - modern-turbine wind profile against developer-stated output of recent farms (user, 7 Oct 2026).

Vestas V162 5600 at 120 m (the modern-turbine profile's machine), Renewables.ninja MERRA-2, local_time=true, at each
farm's REEA-authorised location, for SAMPLE years; times the existing wind file's bias factor (fleet calibration to
Eskom's observed output, so it already allows for wakes, availability and electrical losses at fleet level).
Compared with developer-stated annual output, which is net energy (P50) by convention.
Stated: Impofu 330 MW, 1,260 GWh/yr (Enel, via Wikipedia); San Kraal 140 MW, 616 GWh/yr (EDF); Koruson 1 420 MW,
579,000 households at San Kraal's 616 GWh = 193,000 households. Umsobomvu (Envusa, 140 MW): no figure published.
USAGE (repo root): python3 check_wind_farms.py
"""
import json, os, time
from build_wind_modern import fetch, NEW, SRC, PACE
FARMS = {  # name: (lat, lon, MW, stated GWh/yr or None)
    'Impofu':      (-34.074, 24.563, 330, 1260),
    'San Kraal':   (-31.281, 24.955, 140, 616),
    'Phezukomoya': (-31.256, 24.919, 140, None),
    'Umsobomvu':   (-31.377, 24.811, 140, None),
}
YEARS = [2016, 2019, 2021, 2023]
CACHE = 'ninja_farm_cache.json'
d = json.load(open(SRC)); bias = float(d['meta'].get('bias_corrected', '').split('scaled by ')[1].split(' ')[0])
cache = json.load(open(CACHE)) if os.path.exists(CACHE) else {}
rows = {}
for name, (lat, lon, mw, gwh) in FARMS.items():
    cfs = []
    for y in YEARS:
        k = f'{name}|{y}'
        if k not in cache:
            cache[k] = fetch(lat, lon, y, NEW[0], NEW[1]); json.dump(cache, open(CACHE, 'w')); time.sleep(PACE)
        s = cache[k]; cfs.append(sum(min(1.0, v * bias) for v in s) / len(s))
    raw = sum(sum(cache[f'{name}|{y}'][:]) / 8760 for y in YEARS) / len(YEARS)
    rows[name] = {'raw_cf': round(raw * 100, 1), 'corrected_cf': round(sum(cfs) / len(cfs) * 100, 1),
                  'by_year': [round(c * 100, 1) for c in cfs], 'stated_cf': round(gwh * 1000 / (mw * 8760) * 100, 1) if gwh else None}
    print(name, json.dumps(rows[name]), flush=True)
json.dump({'bias_factor': bias, 'years': YEARS, 'turbine': NEW, 'farms': rows}, open('ninja_farm_check.json', 'w'), indent=1)
