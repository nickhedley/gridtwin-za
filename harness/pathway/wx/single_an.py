# Reads single_tests.sh's outputs: the LP's year-y builds, energy on the representative days (coal gc, CCGT gg, diesel open cycle gd,
# OCGT go, curtailment crt, unserved u; day weights from coal's objective coefficients, calendar days summing to 365), objective; and
# the engine on that fleet (mean unserved, worst 1% of draws, worst draw, curtailment, coal, cost).
#   python3 -I pathway/wx/single_an.py <outdir>
import json, os, re, sys
O = sys.argv[1]
def objcoef(lp):
    coef, on = {}, False
    for line in open(lp):
        if line.startswith('Minimize'): on = True; continue
        if line.startswith('Subject To'): break
        if on:
            for c, n in re.findall(r'([+-]?\s*[0-9.eE+-]+)\s+([A-Za-z_][A-Za-z0-9_]*)', line.replace(' obj:', ' ')):
                coef[n] = coef.get(n, 0) + float(c.replace(' ', ''))
    return coef
rows = []
for f in sorted(os.listdir(O)):
    m = re.match(r'^(.*_(\d{4}))_sol\.json$', f)
    if not m: continue
    n, y = m.group(1), int(m.group(2)); S = json.load(open(os.path.join(O, f)))
    if S.get('Status') != 'Optimal': rows.append(dict(run=n, status=S.get('Status'))); continue
    X = {k: v['Primal'] for k, v in S['Columns'].items()}; c = objcoef(os.path.join(O, n + '_pass1.lp'))
    g = {k: v for k, v in c.items() if re.match(r'^gc_%d_\d+_\d+$' % y, k)}
    days = sorted({int(k.split('_')[2]) for k in g}); cal = [d for d in days if d < 1100]
    h0 = {d: c['gc_%d_%d_12' % (y, d)] for d in cal}; tot = sum(h0.values()); wt = {d: 365 * h0[d] / tot for d in cal}
    spread = max(abs(c['gc_%d_%d_%d' % (y, d, h)] / h0[d] - 1) for d in cal for h in range(24))
    E = lambda p: sum(wt[d] * X.get('%s_%d_%d_%d' % (p, y, d, h), 0) for d in cal for h in range(24)) / 1e6
    b = {k[:-5]: round(v) for k, v in X.items() if re.match(r'^(b_[a-z]+|eb_batt|rc|cc_[a-z]+)_%d$' % y, k) and abs(v) > 0.5}
    r = dict(run=n, year=y, obj_bn=S['ObjectiveValue'] / 1e9 if S['ObjectiveValue'] > 1e6 else S['ObjectiveValue'], days=len(cal), wspread=spread,
             lp=dict(coal=E('gc'), ccgt=E('gg'), diesel=E('gd'), ocgt=E('go'), curt=E('crt'), shed=E('u')), build=b)
    e = os.path.join(O, n + '_eng.json')
    if os.path.exists(e):
        R = {x['y']: x for x in json.load(open(e))}.get(y)
        if R: r['eng'] = dict(runs=R['nRuns'], mean=R['mean'], p99=R['shedPct'].get('p99'), max=R['shedPct'].get('max'), target=R['target'],
                              curt=R['curt'], coal=R['coal'], cost=R['cost'], gasTWh=R.get('gasTWh'), diesel=R.get('diesel'), weather=R.get('weather'))
    rows.append(r)
for r in rows: print(json.dumps(r))
json.dump(rows, open(os.path.join(O, 'an.json'), 'w'), indent=1)
