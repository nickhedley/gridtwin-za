#!/usr/bin/env python3
"""
GridTwin ZA - fetch the day the leap-year truncation dropped (user decision, 3 Nov 2026, message 684 (b)).

WHY
  fetch_multiyear_wind.py, rebuild_solar_pvgis.py, fetch_missing_solar_years.py, build_solar_tracking.py and build_wind_modern.py
  kept the first 8,760 hours of each year (ser[:8760]). In 2016, 2020 and 2024 that keeps 29 February and drops 31 December,
  where their comments said the opposite (RESULTS, 'Modelled wind: two plain errors', 3 Nov 2026). This fetches what is missing
  so the files can be rebuilt with 29 February removed instead (fix_weather_clock_leap.py):
    - wind, Renewables.ninja: 31 December (UTC) of 2016, 2020 and 2024 at every site in profile_sites.json (98 x 3 = 294 calls),
      with fetch_multiyear_wind.py's parameters; the last two UTC hours of each also give the first two SAST hours of 2017, 2021
      and 2025 (the clock fix);
    - solar, Renewables.ninja: the whole of 2024 at fetch_missing_solar_years.py's ten centroids (10 calls), its parameters: 2024
      is a borrowed year rescaled to 2023's PVGIS level (rebuild_solar_pvgis.py --borrow), so its rescaling is redone on the full
      year; a single day could not be put on the stored year's scale;
    - solar, PVGIS SARAH3: whole years 2016 and 2020, fixed tilt and single-axis tracking, at rebuild_solar_pvgis.py's ten
      points with build_solar_tracking.py's parameters (40 requests; PVGIS serves whole years only).
  Renewables.ninja's free tier allows 50 requests an hour: one call every 75 s, and a 6-minute wait on HTTP 429.

USAGE (from the repository root; resumable: cached results are skipped; stops cleanly at --minutes)
  RENEWABLES_NINJA_TOKEN=<token> python3 fetch_leap_days.py [--minutes 100] [--only wind|pvyear|pvgis]
Caches (gitignored): ninja_leapday_cache.json, pvgis_leap_cache.json.
"""
import os, io, json, time, argparse, urllib.request
import requests
import pandas as pd
import fetch_multiyear_wind as FW
import fetch_missing_solar_years as FS
from rebuild_solar_pvgis import COORDS as PVGIS_COORDS
import build_solar_tracking as BT
import fetch_real_regional_profiles as FR

LEAP = [2016, 2020, 2024]
NINJA_CACHE, PVGIS_CACHE = 'ninja_leapday_cache.json', 'pvgis_leap_cache.json'
GAP_S = 75


def ninja_day(session, kind, lat, lon, year):
    """31 December (UTC) from Renewables.ninja ('wind'), or a whole UTC year of solar ('pvyear'), with the original scripts'
    parameters; checks the stamps."""
    if kind in ('wind', 'wind1'):
        H, TB = (FW.HUB_HEIGHT, FW.TURBINE) if kind == 'wind' else (FR.HUB_HEIGHT, FR.TURBINE)
        args = {'lat': lat, 'lon': lon, 'capacity': 1.0, 'format': 'csv', 'local_time': 'true',
                'dataset': 'merra2', 'height': H, 'turbine': TB}
        path = 'data/wind'
    else:
        args = {'lat': lat, 'lon': lon, 'capacity': 1.0, 'format': 'csv', 'local_time': 'true',
                'dataset': 'merra2', 'system_loss': 0.1, 'tracking': 0, 'tilt': abs(lat), 'azim': 180}
        path = 'data/pv'
    whole = kind == 'pvyear'
    args['date_from'], args['date_to'] = (f'{year}-01-01', f'{year}-12-31') if whole else (f'{year}-12-31', f'{year}-12-31')
    r = session.get(FW.BASE + path, params=args, timeout=120)
    r.raise_for_status()
    text = r.text
    if 'time in UTC' not in text:
        raise RuntimeError('response header does not state UTC')
    df = pd.read_csv(io.StringIO(text[text.find('time,'):]))
    n, first = (8784 if year % 4 == 0 else 8760, f'{year}-01-01 00:00') if whole else (24, f'{year}-12-31 00:00')
    if len(df) != n or str(df['time'].iloc[0]) != first or str(df['time'].iloc[-1]) != f'{year}-12-31 23:00':
        raise RuntimeError(f'unexpected rows: {len(df)} from {df["time"].iloc[0]} to {df["time"].iloc[-1]}')
    return [round(v, 5) for v in df['electricity'].astype(float).clip(0, 1).tolist()]


def pvgis_year(lat, lon, year, tracking):
    """A whole PVGIS year at build_solar_tracking.py's parameters, all 8,784 hours of a leap year (UTC, HH:10 stamps)."""
    mount = '&trackingtype=1' if tracking else f'&angle={abs(lat):.0f}&aspect=180'
    url = (f'https://re.jrc.ec.europa.eu/api/{BT.API}/seriescalc?lat={lat}&lon={lon}&startyear={year}&endyear={year}'
           f'&pvcalculation=1&peakpower=1&loss={BT.LOSS}{mount}&outputformat=json&raddatabase={BT.DB}')
    with urllib.request.urlopen(url, timeout=180) as r:
        h = json.loads(r.read().decode())['outputs']['hourly']
    if len(h) != 8784 or not h[0]['time'].startswith(f'{year}0101:00') or not h[-1]['time'].startswith(f'{year}1231:23'):
        raise RuntimeError(f'unexpected PVGIS rows: {len(h)} from {h[0]["time"]} to {h[-1]["time"]}')
    return [round(min(1.0, max(0.0, x['P'] / 1000.0)), 6) for x in h]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--minutes', type=float, default=100)
    ap.add_argument('--only', choices=['wind', 'pvyear', 'pvgis', 'wind1'])
    a = ap.parse_args()
    stop = time.time() + a.minutes * 60
    nc = json.load(open(NINJA_CACHE)) if os.path.exists(NINJA_CACHE) else {}
    pc = json.load(open(PVGIS_CACHE)) if os.path.exists(PVGIS_CACHE) else {}
    sites = json.load(open(FW.SITES))['wind']
    jobs = [('wind', r, s['lat'], s['lng'], y) for y in LEAP for r, cfg in sites.items() for s in cfg['sites']]
    jobs += [('pvyear', r, lat, lon, 2024) for r, (lat, lon) in FS.SOLAR_COORDS.items()]
    # After those, the two stand-ins' days (user, 3 Nov 2026, message 686 (c); 108 calls, never ahead of the 304 above): 31 December
    # 2013 at the 98 sites (2014's first two SAST hours) and 31 December 2022 at fetch_real_regional_profiles.py's ten wind centroids
    # (the first two SAST hours of nodal/profiles_regional.json's 2023 wind).
    jobs += [('wind', r, s['lat'], s['lng'], 2013) for r, cfg in sites.items() for s in cfg['sites']]
    jobs += [('wind1', r, lat, lon, 2022) for r, (lat, lon) in FR.WIND_COORDS.items()]
    pv = [('pvgis', r, lat, lon, y, t) for y in (2016, 2020) for r, (lat, lon) in PVGIS_COORDS.items() for t in (0, 1)]
    key = lambda j: f'{j[0]}|{j[4]}|{j[2]:.4f}|{j[3]:.4f}'
    todo = [j for j in jobs if key(j) not in nc and (not a.only or a.only == j[0])]
    ptodo = [j for j in pv if f'{j[1]}|{j[4]}|{j[5]}' not in pc and (not a.only or a.only == 'pvgis')]
    print(f'Renewables.ninja: {len(jobs)} calls, {len(jobs) - len(todo)} cached, {len(todo)} to fetch; PVGIS: {len(pv)} requests, '
          f'{len(pv) - len(ptodo)} cached, {len(ptodo)} to fetch. Stops at {time.strftime("%H:%M", time.gmtime(stop))} UTC.', flush=True)
    for j in ptodo:   # PVGIS first: no hourly quota is known, so it does not wait on the ninja pacing
        if time.time() > stop: break
        _, region, lat, lon, y, t = j
        for attempt in range(4):
            try:
                pc[f'{region}|{y}|{t}'] = pvgis_year(lat, lon, y, t); json.dump(pc, open(PVGIS_CACHE, 'w'))
                print(f'  PVGIS {region} {y} {"tracking" if t else "fixed"} ok', flush=True); break
            except Exception as e:
                print(f'  PVGIS {region} {y} {t} retry {attempt + 1}: {e}', flush=True); time.sleep(2 ** (attempt + 2))
        time.sleep(2)
    s = requests.session()
    s.headers = {'Authorization': 'Token ' + os.environ.get('RENEWABLES_NINJA_TOKEN', '')}
    done = 0
    for j in todo:
        if time.time() > stop - GAP_S: print('  stopping at the piece deadline', flush=True); break
        kind, region, lat, lon, y = j
        attempt = 0
        while attempt < 3 and time.time() < stop:
            try:
                nc[key(j)] = ninja_day(s, kind, lat, lon, y); json.dump(nc, open(NINJA_CACHE, 'w'))
                done += 1; print(f'  [{done}/{len(todo)}] {kind} {region} {y} ok', flush=True); break
            except requests.HTTPError as e:
                code = e.response.status_code if e.response is not None else 0
                if code == 429:
                    print('  quota reached - waiting 6 min', flush=True); time.sleep(360); continue
                print(f'  FAILED {kind} {region} {y}: HTTP {code}', flush=True)
                if 400 <= code < 500: break
                attempt += 1; time.sleep(20)
            except Exception as e:
                attempt += 1; print(f'  retry {attempt}: {e}', flush=True); time.sleep(20)
        time.sleep(GAP_S)
    left = len([j for j in jobs if key(j) not in nc]) + len([j for j in pv if f'{j[1]}|{j[4]}|{j[5]}' not in pc])
    print(f'piece done: {left} left', flush=True)


if __name__ == '__main__':
    main()
