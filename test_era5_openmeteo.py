"""
GridTwin ZA - does ERA5 have the morning wind minimum that MERRA-2 lacks?

WHY THIS SCRIPT EXISTS

Our modelled wind has the right daily amplitude and the wrong shape: the trough sits at
hour 6 against Eskom's metered hour 10, and the correlation is 0.60 nationally.

Hub height was ruled out on 10 Sep 2026 - the trough is identical at 80, 100, 120 and 140 m.
The next hypothesis was the reanalysis itself, and the obvious test was ERA5 through
Renewables.ninja. That returned "Unknown dataset: era5": Renewables.ninja serves MERRA-2
ONLY for wind.

Open-Meteo serves ERA5, is free, needs no token, and THIS PROJECT ALREADY USES IT - the
solar capacity-factor path at index.html:1434 fetches from it.

WHAT THIS MEASURES, AND WHAT IT DOES NOT

Open-Meteo gives wind SPEED at 100 m, not turbine output. For the question being asked that
is fine and arguably cleaner: the trough HOUR of a power series follows the trough hour of
the speed series, because a power curve is monotonic in speed. It cannot be compared to
Eskom on level or amplitude, only on TIMING.

So read one column: trough hour. Eskom's metered fleet troughs at 10.

    ERA5 troughs near 10   -> MERRA-2 is the problem. A different source fixes the shape,
                              and the refetch is worth costing.
    ERA5 troughs near 6    -> both reanalyses miss it. Document as a data limitation, keep
                              the 0.55 floor in validate_weather, close the item.

Free, no token, four sites, about ten seconds.
"""
import json, statistics, csv, urllib.request, urllib.parse

YEAR = 2025
# Four sites spanning the fleet's geography: Karoo interior, coastal escarpment, Cape
# coastal, and the Northern Cape. One site is not evidence - the PVGIS aspect error on
# 10 Sep came from comparing a single point against a national fleet.
# Coordinates with the OPERATIONAL wind capacity at each, in MW, from
# nodal/regional_renewable_capacity.json. The weights matter more than the sites.
#
# Eskom's metered series is the output of turbines that EXIST. Comparing a single site
# against it is the error that produced a wrong PVGIS reading and a wrong NERSA reading
# earlier the same day: Hydra Central peaks at hour 3 in ERA5, which is the Karoo nocturnal
# low-level jet and is probably CORRECT - it simply has almost no turbines in it, so it
# should barely influence the comparison.
SITES = [('Hydra Central', -30.568, 24.134, 0),
         ('Eastern Cape',  -31.500, 25.500, 1896),
         ('Western Cape',  -32.520, 19.571, 738),
         ('Northern Cape', -30.100, 21.900, 1878)]
BASE = 'https://archive-api.open-meteo.com/v1/era5'


def fetch_era5(lat, lon):
    q = urllib.parse.urlencode({
        'latitude': lat, 'longitude': lon,
        'start_date': f'{YEAR}-01-01', 'end_date': f'{YEAR}-12-31',
        'hourly': 'wind_speed_100m',
        'timezone': 'Africa/Johannesburg',   # LOCAL time, to match Eskom
        'windspeed_unit': 'ms',
    })
    with urllib.request.urlopen(f'{BASE}?{q}', timeout=180) as r:
        d = json.loads(r.read().decode())
    return [v for v in d['hourly']['wind_speed_100m'] if v is not None]


# Vestas V90 2.0 MW power curve - the SAME turbine our MERRA-2 profiles use.
#
# The first version of this script compared ERA5 wind SPEED against Eskom POWER and said
# to read the trough column only. That was not enough. Above about 13 m/s a turbine is at
# rated and power stops responding to speed, so at a windy site the speed series keeps
# climbing after the power series has plateaued - and peaks hours later. Hydra Central and
# the Northern Cape are the windiest sites here and the two where ERA5 scored worst, which
# is exactly what that artefact would produce.
#
# Applying the power curve makes it power against power. Then every column is comparable.
PC = [(3, 0), (4, 0.03), (5, 0.09), (6, 0.18), (7, 0.30), (8, 0.45), (9, 0.62),
      (10, 0.78), (11, 0.91), (12, 0.98), (13, 1.0), (25, 1.0), (25.01, 0)]


def power(v):
    if v is None or v < 3 or v > 25:
        return 0.0
    for i in range(len(PC) - 1):
        a, b = PC[i], PC[i + 1]
        if a[0] <= v <= b[0]:
            return a[1] + (b[1] - a[1]) * (v - a[0]) / (b[0] - a[0])
    return 0.0


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


def main():
    try:
        esk = eskom_diurnal()
    except FileNotFoundError:
        raise SystemExit('ESK19679.csv not found - run from the repo root.')

    print(f'ERA5 wind speed at 100 m, via Open-Meteo, {YEAR}, local time\n')
    print(f'  Eskom metered fleet: trough hour {esk.index(min(esk))}, '
          f'peak hour {esk.index(max(esk))}\n')
    print(f"  {'site':<16}{'mean CF':>7}{'trough':>8}{'peak':>6}{'corr vs Eskom':>15}{'MW':>9}")

    troughs = []
    series = {}
    for name, lat, lon, mw in SITES:
        try:
            ser = fetch_era5(lat, lon)
        except Exception as e:
            print(f'  {name:<16}   failed: {str(e)[:70]}')
            continue
        pw = [power(v) for v in ser]
        series[name] = (pw, mw)
        d = diurnal(pw)
        t, p = d.index(min(d)), d.index(max(d))
        troughs.append(t)
        print(f'  {name:<16}{statistics.mean(pw)*100:>7.1f}%{t:>8}{p:>6}'
              f'{corr(d, esk):>15.3f}{mw:>9,}')

    # THE COMPARISON THAT COUNTS: capacity-weighted, because that is what Eskom meters.
    tot = sum(mw for _, mw in series.values())
    if tot > 0:
        n = min(len(p) for p, _ in series.values())
        comp = [sum(p[h] * mw for p, mw in series.values()) / tot for h in range(n)]
        dc = diurnal(comp)
        print(f"\n  {'FLEET-WEIGHTED':<16}{statistics.mean(comp)*100:>7.1f}%"
              f"{dc.index(min(dc)):>8}{dc.index(max(dc)):>6}{corr(dc, esk):>15.3f}{tot:>9,}")
        print(f"  {'Eskom metered':<16}{'35.5%':>7}{esk.index(min(esk)):>8}"
              f"{esk.index(max(esk)):>6}{1.0:>15.3f}")
        print(f"  {'MERRA-2, ours':<16}{'':>7}{6:>8}{19:>6}{0.60:>15.3f}")
        print('\n  THE LINE THAT MATTERS is FLEET-WEIGHTED against MERRA-2 at 0.60.')

    if troughs:
        med = sorted(troughs)[len(troughs) // 2]
        print(f'\n  ERA5 median trough hour: {med}   MERRA-2: 6   Eskom: 10\n')
        if abs(med - 10) <= 2:
            print('  ERA5 HAS the morning minimum. MERRA-2 is the problem, and a refetch')
            print('  from an ERA5 source would fix the shape. Cost it against the value.')
        elif abs(med - 6) <= 2:
            print('  ERA5 misses it too. Both reanalyses lack the morning minimum, so this')
            print('  is a property of reanalysis wind rather than of our processing.')
            print('  Document it, keep the floor in validate_weather, close the item.')
        else:
            print('  Neither pattern. Look at the numbers before concluding anything.')

    print('\n  ERA5 speeds are put through the SAME Vestas V90 curve our MERRA-2 profiles')
    print('  use, so this is power against power and every column is comparable.')
    print('  MERRA-2 for reference: trough 6 everywhere, corr 0.435 Hydra, 0.380 E Cape.')


if __name__ == '__main__':
    main()
