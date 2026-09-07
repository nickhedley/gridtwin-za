"""
GridTwin ZA - ten-year multi-site WIND pull.

Extends the single-year rebuild to the ten weather years the adequacy work runs on. This is
the file that decides the frontier, LOLE, expected unserved energy, storage duration and the
iron-air result - all of which currently overstate what a renewable build needs, because
they run on single-centroid profiles that sit below 2% output 60 hours a year against an
observed 7.

WIND ONLY, and deliberately. The multi-site pull takes solar from MERRA-2, which reproduces
the 50 km compression PVGIS was adopted to fix - 1.19x regional spread against a real
1.4-1.5x. Existing solar is carried through untouched.

FORMAT NOTES, both learned by reading the file rather than assuming:

  - Values are INTEGERS scaled by 1000, not floats. `scale: 1000` in the file.
  - Leap years are TRUNCATED to 8760 hours. 2016 and 2020 are leap years and the existing
    file drops 29 February, because the engine assumes 8760 everywhere. Matched rather than
    corrected: changing it is a separate decision affecting every consumer.

COST
  10 regions x 12 sites x 10 years = about 1,200 wind calls at 50/hour.
  Roughly a day of wall time. It resumes, so run it, leave it, come back.

USAGE
  python3 fetch_multiyear_wind.py                 # pull, resumable
  python3 fetch_multiyear_wind.py --merge         # write the output file
  python3 fetch_multisite_profiles.py --check --out profiles_multiyear_rebuilt.json
"""
import os, json, time, io, argparse
import requests
import pandas as pd

BASE = 'https://www.renewables.ninja/api/'
TURBINE = 'Vestas V90 2000'
HUB_HEIGHT = 80
SITES = 'profile_sites.json'
CURRENT = 'nodal/profiles_regional_multiyear.json'
OUT = 'profiles_multiyear_rebuilt.json'
CACHE = 'ninja_multiyear_cache.json'
# Extended to 2025 on 6 Sep 2026. The reanalysis stopped at 2023 while Eskom's observed
# data runs to Aug 2026, which forced two comparisons between different weather years:
# the validate_weather anchor (observed 2023 against reanalysis 2023 - fine) and the Ember
# benchmark (model 2023 against observed 12 months to May 2026 - a good wind year against
# the worst in the record). Reaching 2025 makes the second nearly like-for-like.
YEARS = [2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025]


def fetch_one(lat, lon, year, session):
    args = {'lat': lat, 'lon': lon, 'date_from': f'{year}-01-01', 'date_to': f'{year}-12-31',
            'capacity': 1.0, 'format': 'csv', 'local_time': 'true',
            'dataset': 'merra2', 'height': HUB_HEIGHT, 'turbine': TURBINE}
    r = session.get(BASE + 'data/wind', params=args)
    r.raise_for_status()
    text = r.text
    df = pd.read_csv(io.StringIO(text[text.find('time,'):]))
    return df['electricity'].astype(float).clip(0, 1).tolist()


def key(year, lat, lng):
    return f'{year}|{lat:.4f}|{lng:.4f}'


def load_cache():
    return json.load(open(CACHE)) if os.path.exists(CACHE) else {}


def pull():
    token = os.environ.get('RENEWABLES_NINJA_TOKEN')
    if not token:
        raise SystemExit('Set RENEWABLES_NINJA_TOKEN.')
    sites = json.load(open(SITES))['wind']
    cache = load_cache()
    jobs = [(r, s, y) for r, cfg in sites.items() for s in cfg['sites'] for y in YEARS]
    todo = [j for j in jobs if key(j[2], j[1]['lat'], j[1]['lng']) not in cache]
    print(f'{len(jobs)} site-years total, {len(cache)} cached, {len(todo)} to fetch.')
    print(f'At 50/hour that is about {len(todo)/50:.0f} hours. It resumes - stop any time.\n')

    s = requests.session()
    s.headers = {'Authorization': 'Token ' + token}
    done = 0
    for region, site, year in todo:
        k = key(year, site['lat'], site['lng'])
        attempt = 0
        while attempt < 3:
            try:
                ser = fetch_one(site['lat'], site['lng'], year, s)
                # Truncate leap years to match the existing file. 2016 and 2020 return 8784
                # hours; the engine assumes 8760 everywhere, so the existing multiyear file
                # already drops 29 February. Matching that is the conservative choice.
                # Truncate to 8760. 2016, 2020 and 2024 are leap years returning 8784
                # hours; the engine assumes 8760 everywhere and the existing multiyear
                # file already drops 29 February.
                cache[k] = [round(v, 5) for v in ser[:8760]]
                json.dump(cache, open(CACHE, 'w'))
                done += 1
                print(f'  [{done}/{len(todo)}] {region:15s} {year}  '
                      f'CF={sum(ser)/max(1,len(ser)):.3f}', flush=True)
                break
            except requests.HTTPError as e:
                code = e.response.status_code if e.response is not None else 0
                if code == 429:
                    # A rate limit is not a failure and must not consume a retry.
                    print(f'  [{done}/{len(todo)}] quota reached - sleeping 6 min '
                          f'({len(cache)} cached)', flush=True)
                    time.sleep(360)
                    continue
                if 400 <= code < 500:
                    print(f'  FAILED {region} {year}: HTTP {code}, not retrying')
                    break
                attempt += 1
                time.sleep(20)
            except Exception as e:
                attempt += 1
                print(f'  retry {attempt}: {e}')
                time.sleep(20)
        time.sleep(6)
    print('\nPull complete. Now run with --merge.')


def merge():
    sites = json.load(open(SITES))['wind']
    cur = json.load(open(CURRENT))
    cache = load_cache()
    scale = cur.get('scale', 1000)

    out = {'meta': dict(cur.get('meta', {})), 'scale': scale,
           'wind_pu': {}, 'solar_pu': cur['solar_pu']}
    out['meta']['wind_rebuilt'] = (
        'MULTI-SITE, 6 Sep 2026. Capacity-weighted mean of up to 12 sites per region from '
        'Renewables.ninja MERRA-2. Replaces one centroid per region, which sat below 2% '
        'output 60 h/yr against Eskom-observed 7. Sites from REEA permits, REDZ where '
        'permits are thin, province spread where neither - see profile_sites.json basis.')
    out['meta']['solar_note'] = ('UNCHANGED. The multi-site pull reproduces the MERRA-2 '
                                 '50 km compression PVGIS was adopted to fix.')
    # weatherProfileFactory reads meta.years to build its year list. Writing it from YEARS
    # rather than leaving the previous value means the two cannot disagree - a file holding
    # twelve years while its meta claims ten would silently hide the new ones.
    out['meta']['years'] = list(YEARS)

    missing = []
    for region, cfg in sites.items():
        out['wind_pu'][region] = {}
        for year in YEARS:
            acc, wsum = None, 0.0
            for site in cfg['sites']:
                k = key(year, site['lat'], site['lng'])
                if k not in cache:
                    continue
                ser, w = cache[k], site['w']
                acc = [a + v * w for a, v in zip(acc, ser)] if acc else [v * w for v in ser]
                wsum += w
            if acc and wsum > 0:
                out['wind_pu'][region][str(year)] = [round(v / wsum * scale) for v in acc]
            else:
                missing.append(f'{region} {year}')

    if missing:
        print(f'INCOMPLETE - {len(missing)} region-years have no cached sites:')
        print('  ' + ', '.join(missing[:10]) + ('...' if len(missing) > 10 else ''))
        print('Re-run the pull before merging.')
        return

    bad = {f'{r} {y}': len(v) for r, yy in out['wind_pu'].items()
           for y, v in yy.items() if len(v) != 8760}
    if bad:
        raise SystemExit(f'series not 8760 hours: {bad}')

    json.dump(out, open(OUT, 'w'))
    print(f'Wrote {OUT}\n')
    print(f"  {'region':<16}{'new mean CF':>13}{'old mean CF':>13}{'change':>9}")
    for r in sorted(out['wind_pu']):
        n = sum(sum(v) for v in out['wind_pu'][r].values()) / (scale * 8760 * len(YEARS)) * 100
        o = (sum(sum(v) for v in cur['wind_pu'][r].values()) /
             (scale * 8760 * len(YEARS)) * 100) if r in cur['wind_pu'] else None
        ch = f'{n-o:+.1f}' if o is not None else '  new'
        print(f'  {r:<16}{n:>12.1f}%{(f"{o:.1f}%" if o is not None else "-"):>13}{ch:>9}')
    print('\n  solar carried through untouched.')
    print(f'\nNext: python3 fetch_multisite_profiles.py --check --out {OUT}')


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--merge', action='store_true')
    a = ap.parse_args()
    merge() if a.merge else pull()
