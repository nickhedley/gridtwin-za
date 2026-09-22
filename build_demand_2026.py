#!/usr/bin/env python3
"""build_demand_2026.py - build the demand series in profiles.json at the 2026 level.

Runs from the repo root. Reads ESK19679.csv, profiles.json and index.html; writes
profiles.json.

Method, agreed 21-22 Sep 2026:
  - domestic demand is RSA Contracted Demand less International Exports. Contracted
    demand includes exports (Residual Demand + Total RE, supply-side), and the engine
    adds its own firm exports, so leaving them in counted exports twice;
  - calendar 2025 hourly shape, scaled by the year-on-year ratio of domestic demand,
    Jan-Aug 2026 against Jan-Aug 2025;
  - rooftop is added back with the engine's own formula and constants, so the engine
    removes exactly what was added and rooftop growth is not counted twice.

Re-run in January 2027 with the full calendar 2026 ratio.
"""
import csv, json, re, sys, datetime as dt

html = open('index.html').read()
def fixed(key):
    m = re.search(r'\b' + key + r'\s*:\s*([0-9.]+)', html)
    if not m: sys.exit(f'FIXED.{key} not found in index.html')
    return float(m.group(1))
ROOF_MW, DERATE = fixed('rooftopMW'), fixed('rooftopDerate')

rows = list(csv.reader(open('ESK19679.csv', newline='')))
ix = {h: i for i, h in enumerate(rows[0])}
rec = []
for r in rows[1:]:
    t = dt.datetime.strptime(r[0], '%Y-%m-%d %I:%M:%S %p')
    rec.append((t, float(r[ix['RSA Contracted Demand']]), float(r[ix['International Exports']] or 0)))

def dom(pred): return sum(c - x for t, c, x in rec if pred(t))
y25 = [(c - x) for t, c, x in rec if t.year == 2025]
assert len(y25) == 8760, len(y25)
n26 = sum(1 for t, _, _ in rec if t.year == 2026 and t.month <= 8)
n25 = sum(1 for t, _, _ in rec if t.year == 2025 and t.month <= 8)
assert n26 == n25 == 5832, (n25, n26)
RATIO = dom(lambda t: t.year == 2026 and t.month <= 8) / dom(lambda t: t.year == 2025 and t.month <= 8)

p = json.load(open('profiles.json'))
p.pop('demand_2025_gross', None)          # superseded: the CSV is the source now
S = p['solar_pu']
dom26 = [RATIO * d for d in y25]
# gross = domestic + rooftop, where the engine removes min(ROOF*S*DERATE, gross*0.9)
gross = []
for d, s in zip(dom26, S):
    r = ROOF_MW * s * DERATE
    g = d + r
    if r > 0.9 * g: g = d / 0.1           # the cap binds: engine removes 0.9 x gross
    gross.append(round(g, 3))
p['demand'] = gross
p['meta'].pop('demand_2026', None)
p['meta']['demand_source'] = (
    f'Built {dt.date.today():%d %b %Y} by build_demand_2026.py from ESK19679: RSA Contracted Demand '
    f'less International Exports, calendar 2025 hourly shape, scaled by {RATIO:.4f}, the Jan-Aug '
    f'2026 vs Jan-Aug 2025 ratio of that domestic demand. Rooftop added back at rooftopMW '
    f'{ROOF_MW:g} x derate {DERATE:g}, the engine formula, so the engine removes exactly this. '
    f'Domestic grid demand {sum(y25)/1e6:.2f} TWh (2025) -> {sum(dom26)/1e6:.2f} TWh. '
    f'Exports are added by the engine, not carried here. Provisional: re-run with full-year 2026.')
p['meta']['demand_note'] = 'See demand_source.'
json.dump(p, open('profiles.json', 'w'))
print(f'domestic ratio Jan-Aug 2026/2025: {RATIO:.4f}')
print(f'domestic grid demand 2025 {sum(y25)/1e6:.2f} -> 2026 {sum(dom26)/1e6:.2f} TWh')
