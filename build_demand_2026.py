#!/usr/bin/env python3
"""build_demand_2026.py - rescale the demand series in profiles.json to 2026.

Runs from the repo root. Reads profiles.json and index.html, writes profiles.json.

Method, agreed 21 Sep 2026:
  - the grid-served part of demand (gross less the engine's own rooftop estimate) is
    scaled by the year-on-year ratio of RSA Contracted Demand, Jan-Aug 2026 against
    Jan-Aug 2025 (ESK19679);
  - rooftop is left at the engine's level, so rooftop growth is not counted twice;
  - the 2025 hourly shape is kept.

The original series is kept as demand_2025_gross and is always the input, so running
this twice gives the same file. Replace YOY_RATIO with the full-year figure when
calendar 2026 is complete.
"""
import json, re, sys

YOY_RATIO = 1 - 0.062   # RSA Contracted Demand, Jan-Aug 2026 vs Jan-Aug 2025, ESK19679.
                        # Recorded in validate_outputs.js; not recomputed here because
                        # ESK19679.csv was not in the upload set on 21 Sep 2026.

html = open('index.html').read()
def fixed(key):
    m = re.search(r'\b' + key + r'\s*:\s*([0-9.]+)', html)
    if not m: sys.exit(f'FIXED.{key} not found in index.html')
    return float(m.group(1))
ROOF_MW, DERATE = fixed('rooftopMW'), fixed('rooftopDerate')

p = json.load(open('profiles.json'))
if 'demand_2025_gross' not in p:
    p['demand_2025_gross'] = p['demand']
G, S = p['demand_2025_gross'], p['solar_pu']
assert len(G) == len(S) == 8760

roof = [min(ROOF_MW * s * DERATE, g * 0.9) for g, s in zip(G, S)]
new = [r + YOY_RATIO * (g - r) for g, r in zip(G, roof)]
p['demand'] = [round(x, 3) for x in new]

grid25 = sum(g - r for g, r in zip(G, roof)) / 1e6
grid26 = sum(n - r for n, r in zip(new, roof)) / 1e6
p['meta']['demand_2026'] = (
    f'Built 21 Sep 2026 by build_demand_2026.py. Grid-served demand (gross less rooftop at '
    f'rooftopMW {ROOF_MW:g}, derate {DERATE:g}) scaled by {YOY_RATIO:.3f}, the Jan-Aug 2026 vs '
    f'Jan-Aug 2025 ratio of RSA Contracted Demand (ESK19679). 2025 hourly shape kept. '
    f'Grid-served {grid25:.2f} -> {grid26:.2f} TWh. Original series in demand_2025_gross. '
    f'Provisional: replace with the full-year 2026 ratio in January 2027.')
json.dump(p, open('profiles.json', 'w'))
print(f'rooftop {ROOF_MW:g} MW x {DERATE:g}; ratio {YOY_RATIO:.3f}')
print(f'grid-served demand {grid25:.2f} -> {grid26:.2f} TWh')
