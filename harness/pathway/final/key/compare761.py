# Message 761 (c): the 8 Nov key (combined loop) beside each single change on the baseline (f3d, k8, 40%, the same-area cap) and the
# interaction (combined - baseline - sum of the single changes). LP objective; wind, solar, lithium and open-cycle (gas + diesel) in
# 2030, 2035, 2040; curtailment, unserved (20 draws) and CO2 from the engine checks; the 100-draw gate.
import json, sys, os
S = sys.argv[1]; F = '/home/user/gridtwin-za/harness/pathway/final'; L = S + '/loops'
def eng(*ps):
    out = {}
    for p in ps:
        if os.path.exists(p):
            d = json.load(open(p))
            for r in (d if isinstance(d, list) else d.values()): out[r['y']] = r
    return out
CASES = [('Baseline', F + '/pathway_loop_base_05h.json', [F + '/engine_loop_base_05h.json'], [F + '/engine_loop_base_05h_k100.json', L + '/base_k100_2030_2040.json']),
         ('f3d', L + '/f3d_p1.json', [L + '/f3d_p1_eng.json'], [L + '/f3d_p1_k100.json']),
         ('Batteries 1-3 (k8)', L + '/k8_p1.json', [L + '/k8_p1_eng.json'], [L + '/k8_p1_k100.json']),
         ('Wind 40%', F + '/pathway_loop_w40_05h_cmp.json', [F + '/engine_loop_w40_05h_cmp.json'], [F + '/engine_loop_w40_05h_cmp_k100.json']),
         ('Same-area cap', F + '/pathway_rpcap_05h_cmp.json', [F + '/engine_rpcap_05h_cmp.json'], [F + '/engine_rpcap_05h_cmp_k100.json']),
         ('8 Nov key (combined)', L + '/key.json', [L + '/key_eng.json'], [L + '/key_k100.json'])]
def build(P):
    c = {}; at = {}
    for y in sorted(P['sched']):
        for k in ['wind', 'pv', 'batt', 'ocgt', 'ocgd']: c[k] = c.get(k, 0) + (P['sched'][y].get(k, 0) or 0)
        at[int(y)] = dict(c)
    return at
D = {}
for name, pf, e20, e100 in CASES:
    if not os.path.exists(pf): continue
    P = json.load(open(pf)); b = build(P); E = eng(*e20); K = eng(*e100)
    v = {'obj': P['objective'] / 1e9, 'verdict': P.get('verdict'), 'passes': len(P.get('passLog') or []) or None}
    for y in (2030, 2035, 2040):
        e = E.get(y, {})
        v[y] = {'wind': b[y]['wind'] / 1e3, 'solar': b[y]['pv'] / 1e3, 'lithium': b[y]['batt'] / 1e3, 'open-cycle': (b[y]['ocgt'] + b[y]['ocgd']) / 1e3,
                'curt': e.get('curt'), 'unserved': e.get('mean'), 'co2': e.get('co2')}
    v['gate'] = {y: (K[y]['mean'], K[y]['seMean']) for y in (2034, 2035, 2036, 2040) if y in K}
    D[name] = v
B = D['Baseline']; singles = [n for n in D if n not in ('Baseline', '8 Nov key (combined)')]
keys = ['wind', 'solar', 'lithium', 'open-cycle', 'curt', 'unserved', 'co2']
def f(x): return '-' if x is None else '%+.2f' % x
print('| Change on the baseline | Verdict | Objective, R bn | Year | Wind, GW | Solar, GW | Lithium, GW | Open-cycle, GW | Curtailment, TWh | Unserved, GWh (20 draws) | CO2, Mt |')
print('|---|---|---|---|---|---|---|---|---|---|---|')
for i, y in enumerate((2030, 2035, 2040)):
    print('| Baseline (level) | %s | %s | %d | %s |' % (B['verdict'] if i == 0 else '', '%.1f' % B['obj'] if i == 0 else '', y, ' | '.join('%.2f' % B[y][k] for k in keys)))
for n in singles + (['8 Nov key (combined)'] if '8 Nov key (combined)' in D else []):
    V = D[n]
    for i, y in enumerate((2030, 2035, 2040)):
        print('| %s | %s | %s | %d | %s |' % (n if i == 0 else '', V['verdict'] if i == 0 else '', ('%+.1f' % (V['obj'] - B['obj'])) if i == 0 else '', y, ' | '.join(f(None if V[y][k] is None else V[y][k] - B[y][k]) for k in keys)))
if '8 Nov key (combined)' in D:
    C = D['8 Nov key (combined)']
    for i, y in enumerate((2030, 2035, 2040)):
        inter = []
        for k in keys:
            parts = [D[n][y][k] for n in singles]
            if C[y][k] is None or any(p is None for p in parts): inter.append('-'); continue
            inter.append(f(C[y][k] - B[y][k] - sum(p - B[y][k] for p in parts)))
        oi = C['obj'] - B['obj'] - sum(D[n]['obj'] - B['obj'] for n in singles)
        print('| Interaction (combined - sum of singles) | | %s | %d | %s |' % (('%+.1f' % oi) if i == 0 else '', y, ' | '.join(inter)))
print()
print('100-draw gate, GWh (se): 2034 / 2035 / 2036 (2040)')
for n, V in D.items():
    g = V['gate']; print('  %s: %s' % (n, ' / '.join(('%.1f (%.1f)' % g[y]) if y in g else '-' for y in (2034, 2035, 2036, 2040))))
json.dump(D, open(S + '/key/compare761.json', 'w'), default=str)
