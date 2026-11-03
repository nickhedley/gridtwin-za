# Acceptance tests (message 689 (5); design note version 2, section 6): reads accept.sh's outputs. For each single-year 2040 LP: status,
# objective, 2040's builds, and 2040's operating totals on the representative days (coal gc, CCGT gg, OCGT go, diesel open cycle gd,
# curtailment crt in TWh; unserved u in GWh), the day weights from the unserved term's objective coefficients (one value per MWh, so
# each calendar day's coefficient is proportional to its weight; calendar days scaled to 365; the tail days d >= 1000 left out of the
# totals). Each run against its 365-day benchmark (same fleet, same reference): objective and builds, MW and %, and whether each
# technology is within 5% or 250 MW (the design note's 'settles' margin).
#   python3 -I accept_an.py <outdir>
import json, os, re, sys
O = sys.argv[1]
def objcoef(lp, pat):
    coef, on, rx = {}, False, re.compile(r'([+-]?\s*[0-9.eE+-]+)\s+(' + pat + r')\b')
    for line in open(lp):
        if line.startswith('Minimize'): on = True; continue
        if line.startswith('Subject To'): break
        if on:
            for c, n in rx.findall(line.replace(' obj:', ' ')): coef[n] = coef.get(n, 0) + float(c.replace(' ', ''))
    return coef
def stime(n):
    p = os.path.join(O, n + '_solve.log')
    if not os.path.exists(p): return None
    m = re.findall(r'(?:solve|Solve|time|Time)[^0-9]*([0-9]+\.?[0-9]*)\s*s', open(p).read())
    return float(m[-1]) if m else None
rows = {}
for f in sorted(os.listdir(O)):
    m = re.match(r'^(.*)_sol\.json$', f)
    if not m: continue
    n = m.group(1); S = json.load(open(os.path.join(O, f))); X = {k: v['Primal'] for k, v in S['Columns'].items()}; del S['Columns']
    c = objcoef(os.path.join(O, n + '_pass1.lp'), r'u_2040_\d+_\d+')
    cal = sorted({int(k.split('_')[2]) for k in c if int(k.split('_')[2]) < 1000})
    h0 = {d: c['u_2040_%d_12' % d] for d in cal}; tot = sum(h0.values()); wt = {d: 365 * h0[d] / tot for d in cal}
    E = lambda p: sum(wt[d] * X.get('%s_2040_%d_%d' % (p, d, h), 0) for d in cal for h in range(24))
    b = {k[:-5]: round(v) for k, v in X.items() if re.match(r'^(b_[a-z]+|eb_batt|rc|cc_[a-z]+)_2040$', k) and abs(v) > 0.5}
    rows[n] = dict(run=n, status=S.get('Status'), obj_bn=S.get('ObjectiveValue', 0) / 1e9, days=len(cal), wmin=min(wt.values()), wmax=max(wt.values()),
                   coal=E('gc') / 1e6, ccgt=E('gg') / 1e6, ocgt=E('go') / 1e6, diesel=E('gd') / 1e6, curt=E('crt') / 1e6, shed_gwh=E('u') / 1e3, build=b,
                   solve_s=stime(n))
for n, r in rows.items():
    base = re.sub(r'_(a|[b-e]_d\d+|d_d\d+|d365)$', '', n); B = rows.get(base + '_d365')
    if B and B is not r and B['status'] == 'Optimal' and r['status'] == 'Optimal':
        r['vs365'] = dict(obj_pct=100 * (r['obj_bn'] / B['obj_bn'] - 1),
                          build={t: (r['build'].get(t, 0) - B['build'].get(t, 0), None if not B['build'].get(t) else round(100 * (r['build'].get(t, 0) / B['build'][t] - 1), 1),
                                     abs(r['build'].get(t, 0) - B['build'].get(t, 0)) <= max(250, 0.05 * abs(B['build'].get(t, 0))))
                                 for t in sorted(set(r['build']) | set(B['build']))})
json.dump(list(rows.values()), open(os.path.join(O, 'an.json'), 'w'), indent=1)
for r in rows.values():
    v = r.get('vs365', {})
    print('%-22s %-8s obj %10.2f bn %s days %3d coal %6.2f ccgt %5.2f ocgt %5.2f dsl %5.2f curt %6.2f shed %8.2f GWh' % (r['run'], r['status'], r['obj_bn'],
          ('(%+.2f%%)' % v['obj_pct']) if v else '         ', r['days'], r['coal'], r['ccgt'], r['ocgt'], r['diesel'], r['curt'], r['shed_gwh']))
    print('   build', r['build'])
    if v: print('   vs 365', {t: x for t, x in v['build'].items() if not x[2]} or 'all within 5% or 250 MW')
