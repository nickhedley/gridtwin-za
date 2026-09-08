"""
GridTwin ZA - rebuild the national demand series so rooftop cannot disagree with itself.

THE FAULT

`profiles.json` demand is Eskom's grid demand plus an estimate of rooftop generation, and
the app nets that rooftop back off internally using FIXED.rooftopMW. The two figures must
match. They do not:

    best fit from the data      ~4,500 MW
    profiles.json meta says      6,500 MW
    FIXED.rooftopMW              8,619 MW
    Eskom's own estimate         9,100 MW

Four numbers for one quantity. The series was built with roughly 4,500 MW baked in and the
app adds back 8,619, so underlying demand is overstated by about 4 GW of rooftop capacity -
roughly 1 GW of average generation on a 25 GW system, concentrated in daylight hours.

That biases daytime net load, which matters for curtailment and the solar ceiling. It
matters less for adequacy, which binds at night.

THE FIX

Rebuild demand from Eskom's measured 2025 contracted demand, adding rooftop with the SAME
formula and the SAME constant the app uses to remove it:

    rooftopGen = min(rooftopMW * solar_pu * derate, rawDemand * 0.9)

Reading FIXED.rooftopMW out of index.html rather than restating it means the two cannot
drift apart. The free parameter is removed rather than reconciled - if the constant changes,
re-run this and the series follows.

USAGE
    python3 rebuild_demand.py --dry-run
    python3 rebuild_demand.py
"""
import csv, json, re, argparse

ESKOM = 'ESK19679.csv'
INDEX = 'index.html'
SRC = 'profiles.json'
OUT = 'profiles_demand_rebuilt.json'


def constant(html, name, default=None):
    m = re.search(name + r'\s*:\s*([0-9.]+)', html)
    if m:
        return float(m.group(1))
    if default is not None:
        return default
    raise SystemExit(f'could not read {name} from {INDEX}')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--year', default='2025')
    ap.add_argument('--eskom', default=ESKOM)
    ap.add_argument('--out', default=OUT)
    ap.add_argument('--dry-run', action='store_true')
    a = ap.parse_args()

    html = open(INDEX, encoding='utf-8', errors='replace').read()
    rooftop = constant(html, 'rooftopMW')
    # rooftopDerate is a slider default, so it may be written as `def:0.78`.
    m = re.search(r"rooftopDerate[^0-9]{0,30}([0-9.]+)", html)
    derate = float(m.group(1)) if m else 0.78

    p = json.load(open(SRC))
    sol = p['solar_pu']
    rows = [r for r in csv.DictReader(open(a.eskom))
            if r['Date Time Hour Beginning'][:4] == a.year][:8760]
    if len(rows) < 8000:
        raise SystemExit(f'only {len(rows)} hours for {a.year}')

    def num(r, k):
        try:
            return float(r[k])
        except (ValueError, KeyError, TypeError):
            return 0.0

    grid = [num(r, 'RSA Contracted Forecast') for r in rows]
    # The SAME expression the engine uses to remove rooftop, so adding and removing are
    # exact inverses. The 0.9 cap is the engine's, not ours - rooftop cannot serve more
    # than 90% of the demand in an hour.
    new = []
    for i in range(8760):
        rt = min(rooftop * sol[i] * derate, grid[i] * 0.9)
        new.append(round(grid[i] + rt, 3))

    old = p['demand']
    print(f'rooftop constant read from {INDEX}: {rooftop:,.0f} MW, derate {derate}')
    print(f'  mean rooftop generation added   {sum(new[i]-grid[i] for i in range(8760))/8760:,.0f} MW')
    print()
    print(f"  {'':22}{'old':>12}{'new':>12}{'change':>10}")
    print(f"  {'mean demand':<22}{sum(old)/len(old):>12,.0f}{sum(new)/len(new):>12,.0f}"
          f"{sum(new)/len(new)-sum(old)/len(old):>+10,.0f}")
    print(f"  {'peak demand':<22}{max(old):>12,.0f}{max(new):>12,.0f}{max(new)-max(old):>+10,.0f}")
    print(f"  {'annual TWh':<22}{sum(old)/1e6:>12,.1f}{sum(new)/1e6:>12,.1f}"
          f"{(sum(new)-sum(old))/1e6:>+10,.1f}")

    if a.dry_run:
        print('\nDRY RUN. Nothing written.')
        return

    p['demand'] = new
    p['meta'] = dict(p.get('meta', {}))
    p['meta']['demand_source'] = (
        f'Eskom RSA contracted demand, calendar {a.year} (ESK19679), plus rooftop generation '
        f'computed with the SAME formula and constant the engine uses to remove it: '
        f'min(rooftopMW x solar_pu x {derate}, demand x 0.9) at rooftopMW = {rooftop:,.0f}. '
        f'Rebuilt 8 Sep 2026. Previously the series had roughly 4,500 MW of rooftop baked in '
        f'while the engine added back {rooftop:,.0f}, overstating underlying demand in '
        f'daylight hours.')
    p['meta'].pop('rooftop_mw_assumed', None)   # encoded the disagreement; do not preserve it
    json.dump(p, open(a.out, 'w'))
    print(f'\nWrote {a.out}')
    print('  Replace profiles.json with it, then run the suite. Expect the demand-side')
    print('  benchmarks to move; check them rather than assuming the change was benign.')


if __name__ == '__main__':
    main()
