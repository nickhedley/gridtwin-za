# Message 122 (1): s_repdays_c5b14r (calendar days re-chosen so new wind and tracking solar match the twelve-year means) against the null
# (same settings and seeding, default days) and c5b_14r. Builds from the pathway files; engine figures from the engine checks
# (s_repdays local, three year groups; null from GitHub, gh_results.json); objectives from the cost split (tsl_*.txt).
import json, re, sys, os
H = sys.argv[1]; SENS = sys.argv[2]
P = {n: json.load(open(f'{H}/out/pathway_{n}.json')) for n in ('s_repdays_c5b14r', 'null_c5b14r', 'c5b_14r')}
cum = lambda p, k, y: sum((p['sched'][str(yy)].get(k) or 0) for yy in range(2026, y + 1))
print('| Built by (cumulative new MW) | ' + ' | '.join(f'{y} days test / null / c5b_14r' for y in (2030, 2035, 2040)) + ' |'); print('|---|---|---|---|')
for k, lab in [('wind', 'Wind'), ('pv', 'Utility solar'), ('batt', 'Lithium MW'), ('battMWh', 'Lithium MWh'), ('ccgt', 'CCGT'), ('ocgt', 'Open-cycle LNG'), ('ocgd', 'Open-cycle diesel'), ('phes', 'Pumped hydro'), ('ironair', 'Iron-air'), ('earlyRetMW', 'Coal retired early (that year)')]:
    cells = []
    for y in (2030, 2035, 2040):
        f = (lambda p: p['sched'][str(y)].get(k) or 0) if k == 'earlyRetMW' else (lambda p: cum(p, k, y))
        cells.append(' / '.join(f"{f(P[n]):,.0f}" for n in ('s_repdays_c5b14r', 'null_c5b14r', 'c5b_14r')))
    print(f'| {lab} | ' + ' | '.join(cells) + ' |')
obj = lambda n: float(re.search(r'objective without it R([0-9.]+) bn', open(f'{SENS}/tsl_{n}.txt').read()).group(1))
print(); print(f"Objective (optimiser, 8% real, without the stress-target penalty): days test R{obj('s_repdays_c5b14r'):,.1f}bn, null R{obj('null_c5b14r'):,.1f}bn; scored on different calendar days, so not like for like.")
rows = []
for g in 'abc':
    f = f'{H}/out/pathcheck_s_repdays_{g}.json'
    if os.path.exists(f): rows += json.load(open(f))
if len(rows) == 15:
    R = {r['y']: r for r in rows}; G = json.load(open(f'{SENS}/gh_results.json'))['null_c5b14r']['years']
    pv = lambda c: sum(c(y) / 1.08 ** (y - 2026) for y in range(2026, 2041))
    print(f"Engine PV 2026-40 at 8%: days test R{pv(lambda y: R[y]['cost']):,.1f}bn, null R{pv(lambda y: G[str(y)]['cost']):,.1f}bn; CO2 2026-40: days test {sum(R[y]['co2'] for y in R):,.1f} Mt, null {sum(G[str(y)]['co2'] for y in range(2026,2041)):,.1f} Mt.")
    print(); print('| Year | Mean shed, GWh: days test / null | Target | Passes (days test / null) |'); print('|---|---|---|---|')
    for y in range(2031, 2041):
        a, b = R[y], G[str(y)]
        print(f"| {y} | {a['mean']:.2f} / {b['mean']:.2f} | {a['target']:.2f} | {'yes' if a['mean'] <= a['target'] else 'no'} / {'yes' if b['mean'] <= b['target'] else 'no'} |")
else:
    print(f'engine check: {len(rows)} of 15 years so far')
