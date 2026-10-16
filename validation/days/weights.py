# Message 122 (1): smallest change to the optimiser's 12 calendar-day weights that makes new wind and tracking solar match the
# twelve-year means. Minimise sum (w - 365/12)^2 s.t. sum w = 365, sum w*nw = 365*NW12, sum w*tr = 365*TR12, w >= lo.
import json, sys, numpy as np
from scipy.optimize import minimize
r = json.load(open(sys.argv[1])); D = r['days']; n = len(D); w0 = np.full(n, 365 / n)
nw = np.array([d['nw'] for d in D]); tr = np.array([d['tr'] for d in D]); dem = np.array([d['dem'] for d in D]); cw = np.array([d['cw'] for d in D]); fp = np.array([d['fp'] for d in D])
T = r['twelveYears']
for lo in (0.0, 5.0, 10.0):
    cons = [{'type': 'eq', 'fun': lambda w: w.sum() - 365}, {'type': 'eq', 'fun': lambda w: w @ nw - 365 * T['nw']}, {'type': 'eq', 'fun': lambda w: w @ tr - 365 * T['tr']}]
    res = minimize(lambda w: ((w - w0) ** 2).sum(), w0, constraints=cons, bounds=[(lo, 365)] * n, method='SLSQP')
    w = res.x
    print(f"lo={lo}: ok={res.success} max|dw|={abs(w-w0).max():.1f} days; weights", [round(x, 1) for x in w])
    print(f"   nw {w@nw/365:.4f} tr {w@tr/365:.4f} | existing wind {w@cw/365:.4f} (12y {T['cw']:.4f}, now {w0@cw/365:.4f}) fixed pv {w@fp/365:.4f} (12y {T['fp']:.4f}, now {w0@fp/365:.4f}) demand {w@dem/365:,.0f} (year {r['defaultYear']['dem']:,.0f}, now {w0@dem/365:,.0f})")
