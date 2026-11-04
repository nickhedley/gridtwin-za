# Test 13's table (HANDOVER 'Message 691', brief B): for each MGA run in out/mga, the group's standing MW (lithium also MWh) at the run's
# year against the base, the other groups at that year, the cost row, the limits that bind, the engine check's verdict and the solve time.
# Reads the base LP (out/mga/base_pass1.lp, for bounds and the limit rows) and each run's cached solution (LPCACHE out/mga/lpc, by its
# passLog key). From harness/: python3 -I pathway/mga/mga_an.py [out/mga] > out/mga/table.md ; also writes out/mga/summary.json.
import glob, json, os, re, sys
from datetime import datetime
O = sys.argv[1] if len(sys.argv) > 1 else 'out/mga'
LP = open(os.path.join(O, 'base_pass1.lp')).read()
k = LP.index('\nBounds\n'); j = LP.index('\nSubject To\n')
UB, LB = {}, {}
for m in re.finditer(r'^ (-?[0-9.e+]+) <= ((?:b|eb)_[a-z]+_\d{4}|rc_\d{4}) <= (-?[0-9.e+]+)$', LP[k:], re.M):
    LB[m.group(2)], UB[m.group(2)] = float(m.group(1)), float(m.group(3))
LIMROWS = re.compile(r'^(offcap|phescap|phesrate|gascap|tcap|mbmin|limin|lemin|cwpool|rppool|rcmono|rcain|sccmax|gfmcap|battdur|tgt|iatot|ecap|mgacost)')
GROUPS = {'wind': ['wind', 'off'], 'solar': ['pv'], 'lithium': ['batt'], 'ldes': ['vrfb', 'ironair', 'phes', 'phel'], 'gas': ['ccgt', 'ocgt', 'ocgd']}
def standing(b, Y):
    s = {g: sum(v for n, v in b.items() if re.fullmatch(r'b_(%s)_(\d{4})' % '|'.join(T), n) and int(n[-4:]) <= Y) for g, T in GROUPS.items()}
    s['lithiumMWh'] = sum(v for n, v in b.items() if n.startswith('eb_batt_') and int(n[-4:]) <= Y)
    s['coal'] = UB['rc_%d' % Y] - b.get('rc_%d' % Y, 0.0)
    for t in ['wind', 'off', 'vrfb', 'ironair', 'phes']: s[t] = sum(v for n, v in b.items() if re.fullmatch(r'b_%s_\d{4}' % t, n) and int(n[-4:]) <= Y)
    return s
def solfile(R):
    key = R['passLog'][0]['key']; f = [x for x in glob.glob(os.path.join(O, 'lpc', key + '*.json')) if not x.endswith('basis.json')]
    if len(f) != 1: raise SystemExit('no unique cached solution for ' + key)
    return f[0]
def binding(R, Y, grp):
    S = json.load(open(solfile(R))); C, rows = S['Columns'], S['Rows']; tol = 1e-3
    out = {'own': {}, 'other': [], 'rows': [], 'mgacost': None}
    for t in GROUPS.get(grp, []) + (['batt_e'] if grp == 'lithium' else []):
        n0 = 'eb_batt' if t == 'batt_e' else 'b_' + t; at_ub, at_lb = [], []
        for y in range(2026, Y + 1):
            n = '%s_%d' % (n0, y)
            if n not in C or n not in UB: continue
            v = C[n]['Primal']
            if UB[n] > 0 and v >= UB[n] - tol: at_ub.append(y)
            elif v <= LB[n] + tol and UB[n] > 0: at_lb.append(y)
        out['own'][n0] = {'atCap': at_ub, 'atZeroOrFloor': at_lb}
    if grp == 'coal':
        v = C['rc_%d' % Y]['Primal']; out['own']['rc_%d' % Y] = {'retired': round(v, 1), 'max': UB['rc_%d' % Y]}
    for n, c in C.items():   # other build columns at their cap with a nonzero reduced cost, to the run's year
        m = re.fullmatch(r'(b_[a-z]+|eb_batt)_(\d{4})', n)
        if not m or int(m.group(2)) > Y or n not in UB or UB[n] <= 0: continue
        if any(n.startswith('b_' + t + '_') for t in GROUPS.get(grp, [])) or (grp == 'lithium' and n.startswith('eb_batt')): continue
        if c['Primal'] >= UB[n] - tol and abs(c['Dual']) > 1e-9: out['other'].append(n)
    for r in rows:
        if LIMROWS.match(r['Name']) and abs(r['Dual']) > 1e-9:
            y = re.search(r'_(\d{4})', r['Name'])
            if y and int(y.group(1)) > Y and not r['Name'].startswith('mgacost'): continue
            out['rows'].append([r['Name'], r['Primal'], r['Dual']])
        if r['Name'] == 'mgacost': out['mgacost'] = [r['Primal'], r['Dual']]
    return out
def solve_secs(name):
    L = open(os.path.join(O, name + '.log')).read().splitlines(); s = e = None
    for l in L:
        if 'start from basis' in l and re.match(r'^\d\d:\d\d:\d\d ', l): s = l[:8]
        m = re.search(r'solved Optimal (\S+)', l)
        if m: e = m.group(1)
    if not (s and e): return None
    t1 = datetime.fromisoformat(e.replace('Z', '+00:00')); t0 = t1.replace(hour=int(s[:2]), minute=int(s[3:5]), second=int(s[6:8]), microsecond=0)
    d = (t1 - t0).total_seconds(); return d + 86400 if d < 0 else d
B = json.load(open(os.path.join(O, 'base.json'))); FSTAR = B['objective']
res = {'base': {'objective': FSTAR, 'standing': {Y: standing(B['build'], Y) for Y in (2030, 2040)}, 'verdict': B['verdict'], 'secs': B['secs']}}
for f in sorted(glob.glob(os.path.join(O, '*_20[34]0_m[ia][nx]_0.0[12].json'))):
    name = os.path.basename(f)[:-5]; R = json.load(open(f)); M = R['mga']; Y = M['year']
    if R['status'] != 'Optimal' or len(R['passLog']) != 1 or M['fstar'] != FSTAR: raise SystemExit('run not usable: ' + name)
    bnd = binding(R, Y, M['group'])
    fails = [[q['y'], round(q['mean'], 2), round(q['limit'], 2)] for q in R['log'][0]['years'] if q['mean'] > q['limit']]
    res[name] = {'group': M['group'], 'year': Y, 'dir': M['dir'], 'slack': M['slack'], 'objective': R['objective'], 'standing': standing(R['build'], Y),
                 'binding': bnd, 'costPctAboveBase': 100 * (bnd['mgacost'][0] / FSTAR - 1) if bnd['mgacost'] else None,
                 'verdict': R['verdict'], 'engineFails': fails, 'solveSecs': solve_secs(name), 'runSecs': R['secs']}
json.dump(res, open(os.path.join(O, 'summary.json'), 'w'), indent=1)
G = ['wind', 'solar', 'lithium', 'lithiumMWh', 'ldes', 'coal', 'gas']
print('| run | ' + ' | '.join(G) + ' | cost vs base | engine | solve min |'); print('|' + '---|' * (len(G) + 4))
for Y in (2030, 2040):
    print('| base %d | ' % Y + ' | '.join('{:,.0f}'.format(res['base']['standing'][Y][g]) for g in G) + ' | 0 | %s | |' % res['base']['verdict'])
for n, r in res.items():
    if n == 'base': continue
    print('| %s | ' % n + ' | '.join('{:,.0f}'.format(r['standing'][g]) for g in G) + ' | %+.3f%% | %s | %s |' % (r['costPctAboveBase'], 'pass' if not r['engineFails'] else 'fails ' + ','.join(str(x[0]) for x in r['engineFails']), '%.0f' % (r['solveSecs'] / 60) if r['solveSecs'] else '?'))
