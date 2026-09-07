"""
GridTwin ZA - pull the two missing SOLAR years for the multi-year file.

WHY 20 CALLS AND NOT 196

The wind rebuild sampled up to twelve sites per region. The obvious next step looks like
doing the same for solar, at 98 sites x 2 years.

That would be wrong. The multi-year file's solar for 2014-2023 was sampled at ONE
capacity-weighted centroid per region - the original fetch_real_regional_profiles.py
coordinates. Adding multi-site solar for 2024 and 2025 would mix two sampling methods
ACROSS YEARS, so any year-to-year solar comparison would be measuring the method change
rather than the weather.

So this pulls the two missing years at the SAME coordinates as the other ten. Ten regions,
two years, twenty calls - under half an hour.

The right long-term answer is to resample all twelve years consistently, either multi-site
or from PVGIS. That is a separate job and it is in the to-do list. This one makes the wind
years already paid for actually usable.

WHAT THIS UNBLOCKS

weatherYearNational() requires BOTH wind and solar for a year. Wind reached 2025 on 6 Sep
and solar stopped at 2023, so those two wind years return null, the anchor cannot find its
year, and four weather checks fail.

SETUP
  export RENEWABLES_NINJA_TOKEN=your_token
  python3 fetch_missing_solar_years.py

Then the merge is done in place - no separate step.
"""
import os, json, time, io, argparse
import requests
import pandas as pd

BASE = 'https://www.renewables.ninja/api/'
TARGET = 'nodal/profiles_regional_multiyear.json'

# The ORIGINAL centroids from fetch_real_regional_profiles.py, unchanged. Using anything
# else would break consistency with 2014-2023.
SOLAR_COORDS = {
    'Free State':    (-28.385, 25.944),
    'Northern Cape': (-29.140, 21.073),
    'Western Cape':  (-32.520, 19.571),
    'North West':    (-26.512, 25.163),
    'Hydra Central': (-30.568, 24.134),
    'Limpopo':       (-23.300, 28.638),
    'Gauteng':       (-25.646, 27.870),
    'Eastern Cape':  (-31.500, 25.500),
    'Kwazulu Natal': (-28.500, 30.500),
    'Mpumalanga':    (-26.000, 29.500),
}


def fetch(lat, lon, year, session):
    args = {'lat': lat, 'lon': lon, 'date_from': f'{year}-01-01', 'date_to': f'{year}-12-31',
            'capacity': 1.0, 'format': 'csv', 'local_time': 'true',
            # azim=180, not 0. Renewables.ninja treats 180 as equator-facing regardless of
            # hemisphere; azim=0 gave CF 0.149 against 0.225 and scrambled the regional
            # ranking. Verified in the original script, kept here for the same reason.
            'dataset': 'merra2', 'system_loss': 0.1, 'tracking': 0,
            'tilt': abs(lat), 'azim': 180}
    r = session.get(BASE + 'data/pv', params=args)
    r.raise_for_status()
    text = r.text
    df = pd.read_csv(io.StringIO(text[text.find('time,'):]))
    return df['electricity'].astype(float).clip(0, 1).tolist()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--years', default='2024,2025')
    ap.add_argument('--target', default=TARGET)
    a = ap.parse_args()

    token = os.environ.get('RENEWABLES_NINJA_TOKEN')
    if not token:
        raise SystemExit('Set RENEWABLES_NINJA_TOKEN.')

    d = json.load(open(a.target))
    scale = d.get('scale', 1000)
    years = [y.strip() for y in a.years.split(',')]

    todo = [(r, y) for y in years for r in SOLAR_COORDS
            if not (d['solar_pu'].get(r) or {}).get(y)]
    print(f'{len(todo)} region-years to fetch. Already present are skipped.\n')
    if not todo:
        print('Nothing missing.')
        return

    s = requests.session()
    s.headers = {'Authorization': 'Token ' + token}
    done = 0
    for region, year in todo:
        lat, lon = SOLAR_COORDS[region]
        attempt = 0
        while attempt < 3:
            try:
                ser = fetch(lat, lon, year, s)
                # Truncate leap years to 8760, matching every other series in this file.
                ser = ser[:8760]
                if len(ser) != 8760:
                    print(f'  ! {region} {year}: {len(ser)} hours, skipping')
                    break
                d['solar_pu'].setdefault(region, {})[year] = [round(v * scale) for v in ser]
                json.dump(d, open(a.target, 'w'))     # save after each, quota is precious
                done += 1
                print(f'  [{done}/{len(todo)}] {region:15s} {year}  '
                      f'CF={sum(ser)/len(ser):.3f}', flush=True)
                break
            except requests.HTTPError as e:
                code = e.response.status_code if e.response is not None else 0
                if code == 429:
                    print(f'  [{done}/{len(todo)}] quota reached - sleeping 6 min', flush=True)
                    time.sleep(360)
                    continue          # a rate limit is not a failure
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

    note = d['meta'].get('solar_note', '')
    d['meta']['solar_note'] = (note + ' Years ' + ', '.join(years) + ' added 6 Sep 2026 at '
                               'the SAME single centroids as 2014-2023, not multi-site, so '
                               'the sampling method is consistent across every year.')
    json.dump(d, open(a.target, 'w'))

    have = {r: sorted((d['solar_pu'].get(r) or {}).keys()) for r in SOLAR_COORDS}
    short = {r: v for r, v in have.items() if len(v) != len(d['meta']['years'])}
    print(f'\nWrote {a.target}')
    if short:
        print('  STILL INCOMPLETE:', ', '.join(f'{r} has {len(v)}' for r, v in short.items()))
    else:
        print(f'  every region now has {len(d["meta"]["years"])} solar years')
    print('\nSend the file back and the four weather checks should clear.')


if __name__ == '__main__':
    main()
