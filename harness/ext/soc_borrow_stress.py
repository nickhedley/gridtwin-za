# GridTwin ZA - stress days where the LP's storage goes below zero within a day (energy borrowed from later hours of the
# same day), on an LP with the old daily storage balance (bldHourlySoc 0, or any build before 2026-10-08c). Model year
# 2040. Used for the 8 Oct 2026 RESULTS entry on the optimiser-engine gap (07s central pass-2 LP, hash a8a71a7a).
#   python3 ext/soc_borrow_stress.py <solution.json> <lp file>
import re, json, sys
SOL, LP = sys.argv[1], sys.argv[2]
txt = open(SOL).read()
v = {}
for m in re.finditer(r'"((?:bchg|bdis|pchg|pdis|ichg|idis|u)_2040_(\d+)_(\d+)|e_(?:batt|ps|ironair)_2040_(\d+))": \{"Name": "[^"]+", "Primal": ([-0-9.e+]+)', txt):
    v[m.group(1)] = float(m.group(5))
del txt
# start constants and chaining: soc rows tell whether a day starts from the previous day's e_ or a constant
start = {}
with open(LP) as f:
    for line in f:
        m = re.match(r' soc_(batt|ps|ironair)_2040_(\d+): (.*)', line)
        if not m: continue
        t, d, body = m.group(1), int(m.group(2)), m.group(3)
        prev = re.search(r'e_' + t + r'_2040_(\d+)', body.split(':')[-1].replace('e_' + t + '_2040_' + str(d), ''))
        rhs = float(re.split(r'=', body)[-1])
        start[(t, d)] = ('e', int(prev.group(1))) if prev else ('c', rhs)
eff = {'batt': 0.88, 'ps': 0.76, 'ironair': 0.45}; pre = {'batt': 'b', 'ps': 'p', 'ironair': 'i'}
days = sorted(d for d in ({int(k.split('_')[2]) for k in v if k.startswith("bdis_2040_")}) if d >= 1000)
res = []
for d in days:
    for t in ('batt', 'ps', 'ironair'):
        kind, x = start.get((t, d), ('c', 0.0))
        s0 = v.get(f'e_{t}_2040_{x}', 0.0) if kind == 'e' else x
        s, mn, hmin = s0, s0, None
        for h in range(24):
            s += eff[t] * v.get(f'{pre[t]}chg_2040_{d}_{h}', 0) - v.get(f'{pre[t]}dis_2040_{d}_{h}', 0)
            if s < mn: mn, hmin = s, h
        if mn < -1: res.append((d, t, round(s0 / 1e3, 1), round(mn / 1e3, 1), hmin))
stress = [d for d in days if d >= 1000]
print('2040 days in the LP:', len(days), '(stress days', len(stress), ')')
print('days where a store goes below zero within the day (energy borrowed from later hours):', len(res))
by = {}
for d, t, s0, mn, h in res: by.setdefault(t, []).append(mn)
for t, l in by.items(): print('  %-8s %3d days, deepest %.1f GWh, total borrowed (sum of minima) %.1f GWh' % (t, len(l), min(l), sum(l)))
print('  stress days affected:', len({d for d, *_ in res if d >= 1000}), 'of', len(stress), '; calendar days affected:', len({d for d, *_ in res if d < 1000}))
print('  examples:', res[:8])
