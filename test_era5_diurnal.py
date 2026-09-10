"""
GridTwin ZA - does ERA5 reproduce the diurnal wind shape better than MERRA-2?

THE PROBLEM

Our modelled wind has the right daily amplitude and the wrong shape. Capacity-weighted
national against Eskom's metered fleet, 2025:

    peak hour       ours 17    Eskom 18
    trough hour     ours 06    Eskom 10
    amplitude       13.3 pt    14.4 pt
    correlation     0.60 unshifted

WHAT HAS ALREADY BEEN RULED OUT

Hub height. Tested at 80, 100, 120 and 140 m on 10 Sep 2026: the night/day RATIO responds
and the TIMING does not. Trough at hour 6 and peak at hour 20 at every height across a 60 m
range. A configuration error would not be that stable.

WHY ERA5 IS THE NEXT TEST

Renewables.ninja serves both MERRA-2 and ERA5. They are different reanalyses with different
boundary-layer schemes, and the feature we are missing - the morning minimum around
09:00-11:00 - comes from nocturnal decoupling and its breakup after sunrise, exactly the
process reanalyses represent differently.

ERA5 is also higher resolution: roughly 31 km against MERRA-2's 50 km.

WHAT WAS DELIBERATELY NOT DONE

Fitting our hour-of-day shape to Eskom's. It would work and it would be wrong: the LEVEL is
already calibrated to Eskom, and calibrating the SHAPE too would leave nothing independent
to check. The diurnal test added to validate_weather on 10 Sep would become circular - a
check that compares a fitted series against the thing it was fitted to.

READING THE RESULT

    ERA5 trough near hour 10   -> a dataset choice, not a limitation. Refetch on ERA5.
    ERA5 trough still near 6   -> both reanalyses miss it. Document the limitation, keep
                                  the floor in validate_weather, and stop looking.

Either answer is worth having. The second closes an open item honestly, which is better
than leaving it open and unexplained.

SETUP
    export RENEWABLES_NINJA_TOKEN=your_token
    python3 test_era5_diurnal.py

Four calls: two datasets at two sites.

ERA5 serves wind at fixed levels (10 m and 100 m) and rejects other heights, so it is
fetched at 100 m against MERRA-2 at our production 80 m. The trough and peak columns remain
comparable because the hub height test showed timing does not move with height; the
night/day ratio column does not.
"""
import os, io, time, statistics, csv
import requests
import pandas as pd

BASE = 'https://www.renewables.ninja/api/'
TURBINE = 'Vestas V90 2000'
YEAR = 2025

# Two sites, because one is not evidence. Hydra Central and the Eastern Cape between them
# carry most of the fleet and sit in different wind regimes - Karoo interior against
# coastal escarpment.
SITES = [('Hydra Central', -30.568, 24.134),
         ('Eastern Cape',  -31.500, 25.500)]


def fetch(session, lat, lon, dataset, height):
    args = {'lat': lat, 'lon': lon,
            'date_from': f'{YEAR}-01-01', 'date_to': f'{YEAR}-12-31',
            'capacity': 1.0, 'format': 'csv', 'local_time': 'true',
            'dataset': dataset, 'turbine': TURBINE}
    # height omitted for ERA5 - it may serve fixed levels and reject the parameter.
    if height is not None:
        args['height'] = height
    r = session.get(BASE + 'data/wind', params=args)
    r.raise_for_status()
    text = r.text
    df = pd.read_csv(io.StringIO(text[text.find('time,'):]))
    return df['electricity'].astype(float).clip(0, 1).tolist()[:8760]


def diurnal(series):
    b = [[] for _ in range(24)]
    for i, v in enumerate(series):
        b[i % 24].append(v)
    return [statistics.mean(x) if x else 0 for x in b]


def corr(a, b):
    n = len(a)
    ma, mb = sum(a) / n, sum(b) / n
    cov = sum((a[i] - ma) * (b[i] - mb) for i in range(n))
    sa = sum((x - ma) ** 2 for x in a) ** 0.5
    sb = sum((x - mb) ** 2 for x in b) ** 0.5
    return cov / (sa * sb) if sa * sb else 0


def eskom_diurnal(path='ESK19679.csv'):
    b = [[] for _ in range(24)]
    with open(path) as fh:
        for row in csv.DictReader(fh):
            t = row['Date Time Hour Beginning']
            if t[:4] != str(YEAR):
                continue
            h = int(t[11:13])
            ap = t.strip()[-2:]
            if ap == 'PM' and h != 12:
                h += 12
            if ap == 'AM' and h == 12:
                h = 0
            try:
                g, c = float(row['Wind']), float(row['Wind Installed Capacity'])
            except (ValueError, KeyError):
                continue
            if c > 0 and 0 <= h < 24:
                b[h].append(g / c)
    return [statistics.mean(x) if x else 0 for x in b]


def call(session, lat, lon, ds, hh):
    for attempt in range(3):
        try:
            return fetch(session, lat, lon, ds, hh)
        except requests.HTTPError as e:
            code = e.response.status_code if e.response is not None else 0
            if code == 429:
                print('    quota reached - sleeping 6 min', flush=True)
                time.sleep(360)
                continue
            if 400 <= code < 500:
                # PRINT THE BODY. Renewables.ninja states the actual problem there, and
                # the first version of this script guessed at it instead - twice, wrongly.
                body = ''
                try:
                    body = e.response.text[:200].replace('\n', ' ')
                except Exception:
                    pass
                print(f'    HTTP {code}: {body}')
                print(f'    url: {e.response.url[:170]}')
                return None
            time.sleep(20)
        except Exception as e:
            print(f'    retry: {str(e)[:60]}')
            time.sleep(20)
    return None


def main():
    token = os.environ.get('RENEWABLES_NINJA_TOKEN')
    if not token:
        raise SystemExit('Set RENEWABLES_NINJA_TOKEN.')
    try:
        esk = eskom_diurnal()
    except FileNotFoundError:
        raise SystemExit('ESK19679.csv not found - run from the repo root.')

    s = requests.session()
    s.headers = {'Authorization': 'Token ' + token}

    en = statistics.mean([esk[h] for h in range(24) if h <= 5 or h >= 20])
    ed = statistics.mean([esk[h] for h in range(24) if 8 <= h <= 17])
    print(f'Eskom metered fleet {YEAR}: trough hour {esk.index(min(esk))}, '
          f'peak hour {esk.index(max(esk))}, night/day {en/ed:.3f}\n')
    print(f"  {'site':<16}{'dataset':<10}{'hub':>5}{'mean CF':>9}"
          f"{'trough':>8}{'peak':>6}{'night/day':>11}{'corr':>8}")

    best = None
    # ERA5 serves wind at FIXED levels - 10 m and 100 m - and rejects anything else with
    # HTTP 400. MERRA-2 interpolates freely and our production data is at 80 m.
    #
    # Comparing merra2@80 against era5@100 is still valid FOR THE QUESTION BEING ASKED.
    # The hub height test on 10 Sep showed the trough hour is identical at 80, 100, 120 and
    # 140 m, so height does not move the timing - only the night/day ratio. Read the trough
    # and peak columns as comparable and the ratio column as not.
    # ERA5: try WITHOUT height first, since two explicit values were rejected.
    HEIGHTS = {'merra2': 80, 'era5': None}
    for name, lat, lon in SITES:
        for ds in ['merra2', 'era5']:
            hh = HEIGHTS[ds]
            ser = call(s, lat, lon, ds, hh)
            if ser is None:
                print(f'  {name:<16}{ds:<10}{str(hh):>5}   failed')
                continue
            d = diurnal(ser)
            night = statistics.mean([d[h] for h in range(24) if h <= 5 or h >= 20])
            day = statistics.mean([d[h] for h in range(24) if 8 <= h <= 17])
            c = corr(d, esk)
            print(f'  {name:<16}{ds:<10}{str(hh):>5}{statistics.mean(ser)*100:>8.1f}%'
                  f'{d.index(min(d)):>8}{d.index(max(d)):>6}{night/day:>11.3f}{c:>8.3f}')
            if best is None or c > best[1]:
                best = (ds, c)
            time.sleep(6)

    if best:
        print(f'\n  best dataset on shape: {best[0]}, correlation {best[1]:.3f}')
        print(f'  current production data is merra2 at 80 m\n')
    print('WHAT TO DO')
    print('  ERA5 trough near hour 10 and correlation clearly higher')
    print('    -> refetch on ERA5. 1,176 calls, about 24 hours. Combine it with the')
    print('       100 m hub-height change so one refetch buys both fixes.')
    print('  ERA5 no better')
    print('    -> both reanalyses miss the morning minimum. Document it as a dataset')
    print('       limitation, keep the 0.55 floor in validate_weather, close the item.')


if __name__ == '__main__':
    main()
