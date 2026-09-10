"""
GridTwin ZA - does hub height explain the diurnal wind shape error?

THE PROBLEM

Our modelled wind has the right daily amplitude and the wrong shape. Capacity-weighted
national against Eskom's metered fleet, 2025:

    peak hour       ours 17    Eskom 18
    trough hour     ours 06    Eskom 10
    amplitude       13.3 pt    14.4 pt
    correlation     0.60 unshifted

A timezone error would displace peak and trough equally. These differ by one hour and four,
so it is a waveform difference. Our profile lacks the morning minimum the real fleet shows
and carries too much midday wind.

THE HYPOTHESIS

Our profiles are modelled at 80 m hub height on a Vestas V90. South Africa's fleet has been
getting taller for a decade:

    REIPPPP BW1-2, 2014-15      80-100 m
    BW3-4, 2016-18              84-120 m
    BW4-5, 2021-24             105-135 m
    BW5-6 and private, 2024-26 118-148 m

At 80 m a turbine sits inside the nocturnal boundary layer, which decouples from the surface
after sunset and goes calm. Above roughly 120 m it is often in the low-level jet, where wind
ACCELERATES at night. So an 80 m model should understate night wind relative to a modern
fleet - which is the direction of our error.

If that is the cause, raising the modelled hub height should move the trough later and lift
the night hours. If it is not, the shape will barely change and the cause is the MERRA-2
boundary-layer representation itself, which we cannot fix by refetching.

WHY THIS TEST BEFORE ANY REFETCH

A full refetch is 98 sites x 12 years = 1,176 calls, about 24 hours at 50/hour. This is
FOUR calls at one site and settles whether that day is worth spending.

SETUP
    export RENEWABLES_NINJA_TOKEN=your_token
    python3 test_hub_height.py
"""
import os, io, time, statistics, csv
import requests
import pandas as pd

# Northern Cape wind centroid - the region with the most wind capacity, and the one the
# withdrawn Wind Pioneers finding was about.
LAT, LON = -30.568, 24.134
YEAR = 2025
HEIGHTS = [80, 100, 120, 140]
TURBINE = 'Vestas V90 2000'
BASE = 'https://www.renewables.ninja/api/'


def fetch(session, height):
    args = {'lat': LAT, 'lon': LON,
            'date_from': f'{YEAR}-01-01', 'date_to': f'{YEAR}-12-31',
            'capacity': 1.0, 'format': 'csv', 'local_time': 'true',
            'dataset': 'merra2', 'height': height, 'turbine': TURBINE}
    r = session.get(BASE + 'data/wind', params=args)
    r.raise_for_status()
    text = r.text
    df = pd.read_csv(io.StringIO(text[text.find('time,'):]))
    return df['electricity'].astype(float).clip(0, 1).tolist()[:8760]


def diurnal(series):
    buckets = [[] for _ in range(24)]
    for i, v in enumerate(series):
        buckets[i % 24].append(v)
    return [statistics.mean(b) if b else 0 for b in buckets]


def corr(a, b):
    n = len(a)
    ma, mb = sum(a) / n, sum(b) / n
    cov = sum((a[i] - ma) * (b[i] - mb) for i in range(n))
    sa = sum((x - ma) ** 2 for x in a) ** 0.5
    sb = sum((x - mb) ** 2 for x in b) ** 0.5
    return cov / (sa * sb) if sa * sb else 0


def eskom_diurnal(path='ESK19679.csv', year=str(YEAR)):
    """Eskom's metered fleet, same year, same hour convention."""
    buckets = [[] for _ in range(24)]
    with open(path) as fh:
        for row in csv.DictReader(fh):
            t = row['Date Time Hour Beginning']
            if t[:4] != year:
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
                buckets[h].append(g / c)
    return [statistics.mean(b) if b else 0 for b in buckets]


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

    print(f'Northern Cape centroid, {YEAR}, {TURBINE}\n')
    print(f"  {'hub':>6}{'mean CF':>10}{'trough hr':>11}{'peak hr':>9}"
          f"{'night/day':>11}{'corr vs Eskom':>15}")

    en = statistics.mean([esk[h] for h in range(24) if h <= 5 or h >= 20])
    ed = statistics.mean([esk[h] for h in range(24) if 8 <= h <= 17])
    results = []
    for hh in HEIGHTS:
        attempt = 0
        while attempt < 3:
            try:
                ser = fetch(s, hh)
                break
            except requests.HTTPError as e:
                code = e.response.status_code if e.response is not None else 0
                if code == 429:
                    print(f'  quota reached - sleeping 6 min')
                    time.sleep(360)
                    continue
                raise
            except Exception as e:
                attempt += 1
                time.sleep(20)
        else:
            print(f'  {hh:>4} m   failed after 3 attempts')
            continue
        d = diurnal(ser)
        night = statistics.mean([d[h] for h in range(24) if h <= 5 or h >= 20])
        day = statistics.mean([d[h] for h in range(24) if 8 <= h <= 17])
        results.append((hh, d))
        print(f'  {hh:>4} m{statistics.mean(ser)*100:>9.1f}%{d.index(min(d)):>11}'
              f'{d.index(max(d)):>9}{night/day:>11.3f}{corr(d, esk):>15.3f}')
        time.sleep(6)

    print(f"\n  {'Eskom metered':>12}{'':>3}{statistics.mean(esk)*100:>9.1f}%"
          f"{esk.index(min(esk)):>11}{esk.index(max(esk)):>9}{en/ed:>11.3f}")

    print('\nHOW TO READ IT')
    print('  correlation RISING with height   -> hub height is the cause. A refetch at the')
    print('                                      best height fixes the shape, ~24 hours.')
    print('  correlation FLAT across heights  -> it is MERRA-2 boundary-layer physics, not')
    print('                                      configuration. A refetch will not help and')
    print('                                      the limitation should be documented instead.')
    print('  night/day ratio approaching Eskom is the same signal, stated as a level.')


if __name__ == '__main__':
    main()
