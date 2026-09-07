"""
GridTwin ZA - rebuild profiles.json from Eskom actuals, normalised correctly.

WHAT WAS WRONG

Two faults, found 6 Sep 2026 while preparing to swap in the rebuilt ten-year file.

1. THE YEAR. The file declares `"year": 2025` and names ESK19243 as its source. Correlated
   against Eskom actuals it is 2023 data: wind 0.729 against 2023, 0.115 against 2025. Solar
   and demand likewise. A direct check against ESK19243 gives 0.125 and a different diurnal
   shape, so the named source does not reproduce it either.

2. THE DENOMINATOR. Per-unit series were divided by an ESTIMATED flat nameplate while
   capacity grew through the year:

       wind    estimate 4,044 MW    Eskom mean installed 3,642 MW    understated 11.0%
       solar   estimate 2,789 MW    Eskom mean installed 2,302 MW    understated 21.2%

   Every MW of wind in the model generated a tenth less than the real fleet, and every MW of
   solar a fifth less, in the file whose whole purpose is to be observed truth.

Neither showed in the energy totals because they pull opposite ways: 2023 was the best wind
year of the ten, and the nameplate error depresses the level.

WHAT THIS DOES

Rebuilds wind_pu, solar_pu and csp_pu from ESK19679 calendar 2023, dividing each hour's
output by that hour's MEASURED installed capacity. Keeps the year at 2023 - option B - and
makes the label true rather than moving to 2025, because the reanalysis file the anchor
compares against stops at 2023. Move both together later.

DEMAND IS NOT TOUCHED. It is a derived series - grid demand plus estimated rooftop
generation, which the app nets off internally - not a raw Eskom column. Rebuilding it needs
the rooftop estimate and is a separate decision.

USAGE
    python3 rebuild_national_profiles.py
    python3 rebuild_national_profiles.py --year 2025    # once the reanalysis reaches 2025
"""
import csv, json, argparse, statistics

ESKOM = 'ESK19679.csv'
SRC = 'profiles.json'
OUT = 'profiles_rebuilt.json'

SERIES = [('wind_pu', 'Wind', 'Wind Installed Capacity'),
          ('solar_pu', 'PV', 'PV Installed Capacity'),
          ('csp_pu', 'CSP', 'CSP Installed Capacity')]


def num(row, key):
    try:
        return float(row[key])
    except (ValueError, KeyError, TypeError):
        return 0.0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--year', default='2023')
    ap.add_argument('--eskom', default=ESKOM)
    ap.add_argument('--out', default=OUT)
    a = ap.parse_args()

    rows = [r for r in csv.DictReader(open(a.eskom))
            if r['Date Time Hour Beginning'][:a.year.__len__()] == a.year]
    if len(rows) < 8000:
        raise SystemExit(f'only {len(rows)} hours for {a.year} in {a.eskom}')
    rows = rows[:8760]          # match the 8760 the engine assumes everywhere

    p = json.load(open(SRC))
    old = {k: sum(p[k]) / len(p[k]) for k, _, _ in SERIES if k in p}

    report = []
    for key, gcol, ccol in SERIES:
        gen = [num(r, gcol) for r in rows]
        cap = [num(r, ccol) for r in rows]
        if min(cap) <= 0:
            # A zero-capacity hour would divide by zero. None occur in 2023, but a future
            # year could carry one, and silently substituting a mean would be worse than
            # stopping.
            raise SystemExit(f'{key}: {sum(1 for c in cap if c <= 0)} hours with zero '
                             f'installed capacity - cannot normalise')
        # PER-HOUR denominator. This is the whole point: dividing by a flat nameplate while
        # capacity grows understates every hour in proportion to how much the fleet grew.
        pu = [round(min(1.0, max(0.0, g / c)), 5) for g, c in zip(gen, cap)]
        p[key] = pu
        report.append((key, old.get(key), sum(pu) / len(pu),
                       statistics.mean(cap), sum(gen) / sum(cap)))

    p['meta'] = dict(p.get('meta', {}))
    p['meta'].update({
        'year': int(a.year),
        'source': f'Eskom hourly dataset ESK19679, calendar {a.year}. Per-unit series are '
                  f'measured output divided by that HOUR\'S measured installed capacity.',
        'rebuilt': '6 Sep 2026. Replaces a file that declared 2025 but contained 2023 data, '
                   'and that divided by an estimated flat nameplate while capacity grew '
                   'through the year - understating wind by 11% and solar by 21%.',
        'demand_note': 'demand is UNCHANGED and is a derived series (grid demand plus '
                       'estimated rooftop, netted internally by the app), not a raw Eskom '
                       'column. Rebuilding it is a separate decision.',
        'anchor_note': 'This file is OBSERVED. profiles_regional_multiyear.json is '
                       'REANALYSIS. They describe the same fleet and year but by different '
                       'methods, so they will not agree to 1% - the residual gap is the '
                       'reanalysis bias, measured at about 5% for wind.',
        'licence': 'CC BY 4.0 - https://creativecommons.org/licenses/by/4.0/',
    })
    for k in ('wind_nameplate_est', 'pv_nameplate_est', 'wind_cf_2025', 'pv_cf_2025'):
        p['meta'].pop(k, None)     # these encoded the error; leaving them invites reuse

    json.dump(p, open(a.out, 'w'))
    print(f'Wrote {a.out}, calendar {a.year}\n')
    print(f"  {'series':<12}{'old mean':>10}{'new mean':>10}{'change':>9}"
          f"{'mean cap MW':>13}")
    for key, o, n, cap, cf in report:
        ch = f'{100*(n/o-1):+.1f}%' if o else '   new'
        print(f'  {key:<12}{(o or 0):>10.4f}{n:>10.4f}{ch:>9}{cap:>13,.0f}')
    print('\n  demand carried through untouched.')
    print(f'\nNext: replace profiles.json with {a.out}, then run the suite.')
    print('EXPECT the validate_weather anchor to fail: it compares this observed file')
    print('against the reanalysis multiyear file at a 1% tolerance, and they legitimately')
    print('differ by about 5%. That check needs restating, not relaxing.')


if __name__ == '__main__':
    main()
