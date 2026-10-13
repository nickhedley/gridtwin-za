# GridTwin ZA - calendar (representative) days where the LP's within-day storage dip exceeds the lowest feasible start
# level, on an LP with the old daily storage balance. All years. Used for the 8 Oct 2026 RESULTS entries on the daily
# storage balance and the hourly fix (build 2026-10-08c). On an 08c LP (bldHourlySoc 1) it should report no borrowing.
#   python3 ext/soc_borrow_cal.py <solution.json> <lp file>
import re, json, sys
SOL, LP = sys.argv[1], sys.argv[2]
txt = open(SOL).read()
v = {}
for m in re.finditer(r'"((?:bchg|bdis|pchg|pdis|ichg|idis|vchg|vdis)_(\d{4})_(\d+)_(\d+)|e_(?:batt|ps|ironair|vrfb)_(\d{4})_(\d+))": \{"Name": "[^"]+", "Primal": ([-0-9.e+]+)', txt):
    v[m.group(1)] = float(m.group(7))
del txt
rows = {}
with open(LP) as f:
    for line in f:
        m = re.match(r' (soc|ecap)_(batt|ps|ironair|vrfb)_(\d{4})_(\d+): (.*)', line)
        if not m: continue
        kind, t, y, d, body = m.group(1), m.group(2), int(m.group(3)), int(m.group(4)), m.group(5)
        if d >= 1000: continue
        r = rows.setdefault((t, y, d), {})
        if kind == 'soc':
            c = re.search(r'([0-9.]+) [a-z]chg_', body); r['wEff'] = float(c.group(1))
            c = re.search(r'([0-9.]+) [a-z]dis_', body); r['w'] = float(c.group(1))
            p = re.findall(r'e_' + t + r'_\d{4}_(\d+)', body); p = [int(x) for x in p if int(x) != d]
            r['prev'] = p[0] if p else None; r['rhs'] = float(body.split('=')[-1])
        else:
            r['capRHS'] = float(body.split('<=')[-1])
pre = {'batt': 'b', 'ps': 'p', 'ironair': 'i', 'vrfb': 'v'}
out = []; n = 0
for (t, y, d), r in sorted(rows.items()):
    if 'w' not in r: continue
    eff = r['wEff'] / r['w']; w = r['w']
    cum, mn, mx = 0.0, 0.0, 0.0
    for h in range(24):
        cum += eff * v.get(f'{pre[t]}chg_{y}_{d}_{h}', 0) - v.get(f'{pre[t]}dis_{y}_{d}_{h}', 0)
        mn, mx = min(mn, cum), max(mx, cum)
    if mx - mn < 1: continue
    n += 1
    e_d = v.get(f'e_{t}_{y}_{d}', 0.0); e_p = v.get(f'e_{t}_{y}_{r["prev"]}', 0.0) if r['prev'] is not None else r['rhs']
    net = cum
    lowest_start = min(e_p, e_d - net)
    gap = -mn - lowest_start
    if gap > 1: out.append((y, d, t, round(w, 1), round(-mn / 1e3, 1), round(lowest_start / 1e3, 1), round(gap / 1e3, 1)))
yrs = sorted({o[0] for o in out})
print('calendar store-days with any within-day movement:', n)
print('calendar store-days where the within-day dip exceeds the lowest start level (energy borrowed):', len(out))
by = {}
for o in out: by.setdefault(o[2], []).append(o)
for t, l in by.items(): print('  %-8s %3d store-days, largest shortfall %.1f GWh, years %s' % (t, len(l), max(o[6] for o in l), sorted({o[0] for o in l})))
print('  examples (year, day, store, weight, dip GWh, lowest start GWh, shortfall GWh):', sorted(out, key=lambda o: -o[6])[:8])
