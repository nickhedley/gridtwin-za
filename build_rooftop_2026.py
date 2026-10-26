#!/usr/bin/env python3
"""build_rooftop_2026.py - rooftop PV for 2026 on 2025's basis, and the end-2026 level (user, 26 Oct 2026, messages 390 (a) and 392 (b)).

NTCSA's 'Estimated Rooftop PV' (Weekly System Status Report) counts every PV installation without an NTCSA contract, wheeled
ground-mounted plant included. '2025, as modelled' uses the calendar-2025 mean of that series less the wheeled solar of the time.
This puts 2026 on the same basis (planning practice: the year's average for that year; the trajectory from the latest installed level):
  - monthly national points as published (below); January-April 2026 interpolated linearly between December 2025 and May 2026;
  - less wheeled private solar inside the series from its commercial operation: the H1 2026 PFL plants (nodal/pfl_cod_h1_2026.json),
    the pre-2026 named plants (Selemela 2 and 3, Damlaagte; build_capacity.py PRE2026_PRIVATE) and SunCentral 1 from October 2026
    (in c6a's 2026 build floor as utility solar);
  - October-December 2026 not yet published: the series without wheeled plant grows at its December 2025 - September 2026 pace.
Writes nodal/rooftop_ntcsa_2026.json: the monthly series, the 2026 mean (FIXED.rooftopMW; validate_capacity.js asserts it) and the
end-2026 level (the pathway's 2027 starting point, ROOF_FROM_END2026).
"""
import json, datetime as dt
POINTS = {  # NTCSA national 'Estimated Rooftop PV', MW, as published
    '2025-12': (7464.0, 'Eskom weekly reports, via Engineering News, 23 Jan 2026'),
    '2026-05': (8294.5, 'Weekly System Status Report 2026 week 25, pp.5-6'),
    '2026-06': (9107.4, 'Weekly System Status Report, June 2026 row (index.html rooftop note; SOURCES)'),
    '2026-07': (9219.6, 'Weekly System Status Report, July 2026 row: August less the +210.5 MW nodal/rooftop_mw_by_region.json records'),
    '2026-08': (9430.1, 'Weekly System Status Report 2026 week 37 (nodal/rooftop_mw_by_region.json, Aug-26 row)'),
    '2026-09': (9430.1, 'Weekly System Status Report 2026 week 42: August-September unchanged (SOURCES, rooftop basis)'),
}
SUNCENTRAL1 = (114.0, '2026-10')   # nodal/private_pending_h2_2026.json; MW AC, commercial operation October 2026
cod = json.load(open('nodal/pfl_cod_h1_2026.json'))['projects']
MISSING_COD = '2026-04'            # ARM Platinum: H1 2026, month unpublished (as build_demand_2026.py)
cap = json.load(open('nodal/regional_renewable_capacity.json'))
pre = [x for x in cap['meta']['private_pre2026'] if x['tech'] == 'solar']
months = [f'2026-{m:02d}' for m in range(1, 13)]
def wheeled(ym):                   # wheeled private solar inside NTCSA's series in month ym
    w = sum(x['mw'] for x in pre if x['cod'] <= ym)
    w += sum(q['mw_installed'] for q in cod if q.get('route') == 'private' and q.get('method') == 'wheeling'
             and q['tech'] == 'solar' and (q.get('cod') or MISSING_COD) <= ym)
    return w + (SUNCENTRAL1[0] if SUNCENTRAL1[1] <= ym else 0)
total = {}
d0, d5 = POINTS['2025-12'][0], POINTS['2026-05'][0]
for k in range(1, 5): total[f'2026-{k:02d}'] = d0 + (d5 - d0) * k / 5
for ym, (v, _) in POINTS.items():
    if ym.startswith('2026'): total[ym] = v
ex = {ym: total[ym] - wheeled(ym) for ym in total}
dec25_ex = d0 - sum(x['mw'] for x in pre if x['cod'] <= '2025-12')
pace = (ex['2026-09'] - dec25_ex) / 9
for k in (10, 11, 12): ex[f'2026-{k:02d}'] = ex['2026-09'] + pace * (k - 9)
mean = round(sum(ex[m] for m in months) / 12, 1)
end = round(ex['2026-12'], 1)
out = {'meta': {'description': __doc__.strip().split('\n\n')[1].replace('\n', ' '), 'built_by': 'build_rooftop_2026.py',
                'built': dt.date.today().isoformat(), 'licence': 'CC BY 4.0 - https://creativecommons.org/licenses/by/4.0/ ; attribution GridTwin ZA; NTCSA figures as published by Eskom/NTCSA',
                'points': {k: {'mw': v, 'source': s} for k, (v, s) in POINTS.items()},
                'wheeled_pre2026': [{k: x[k] for k in ('name', 'mw', 'cod')} for x in pre], 'suncentral1': SUNCENTRAL1,
                'pace_ex_wheeled_mw_per_month': round(pace, 1)},
       'monthly_total_mw': {m: round(total[m], 1) for m in months if m in total},
       'monthly_ex_wheeled_mw': {m: round(ex[m], 1) for m in months},
       'mean_2026_mw': mean, 'end_2026_mw': end}
json.dump(out, open('nodal/rooftop_ntcsa_2026.json', 'w'), indent=1)
print('2026 mean (rooftopMW)', mean, 'end-2026', end, 'pace', round(pace, 1), 'wheeled Sep', wheeled('2026-09'))
