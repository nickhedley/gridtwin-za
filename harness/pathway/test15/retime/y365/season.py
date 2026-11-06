# Messages 748 and 750 (b): where two stages' extra solar and lithium sit in year Y, from the single-year LPs: both builds dispatched on the
# same 365 days (and the same 25 days, weighted). Per month (and July's hours): curtailment, lithium charge and discharge, coal, diesel and
# open-cycle gas output, unserved; two stages minus the fin pass; GWh. The 25-day LP's day weights are read from the objective (each
# day's gc coefficient against the 365-day LP's, the same fuel price and discount). Usage: season.py <dir> <Y>
import json, re, sys, collections
D, Y = sys.argv[1], int(sys.argv[2])
ML = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; MON = []
for i, n in enumerate(ML): MON += [i] * n
def load(n):
    C = json.load(open('%s/%s_sol.json' % (D, n)))['Columns']; out = collections.defaultdict(float)
    for k, v in C.items():
        p = k.split('_')
        if len(p) == 4 and p[1] == str(Y) and p[0] in ('crt', 'bdis', 'bchg', 'gc', 'gd', 'go', 'gg', 'u') and v['Primal']:
            out[(p[0], int(p[2]), int(p[3]))] += v['Primal']
    return out
def objcoef(n, var):
    txt = open('%s/%s_pass1.lp' % (D, n)).read(); i = txt.index(' obj:'); j = txt.index('\nSubject To'); o = {}
    for c, v in re.findall(r'([-+]?\s*[0-9.eE+-]+)\s+(%s_%d_\d+_\d+)\b' % (var, Y), txt[i:j].replace('\n', ' ')): o[v] = float(c.replace(' ', ''))
    return o
# weights of the 25 days: gc coefficient on the 25-day LP over its coefficient for the same hour on the 365-day LP
o365, o25 = objcoef('ts%d_365' % Y, 'gc'), objcoef('ts%d_25' % Y, 'gc')
W = {}
for v, c in o25.items():
    d = int(v.split('_')[2]); r = o365.get(v)
    if r: W.setdefault(d, []).append(c / r)
W = {d: sum(x) / len(x) for d, x in W.items()}
def monthly(S, w=None):
    M = collections.defaultdict(lambda: [0.0] * 12)
    for (t, d, h), x in S.items():
        if d >= 1000: continue   # stress windows: not calendar days
        wt = 1 if w is None else w.get(d, 0); M[t][MON[d]] += x * wt / 1000
    return M
out = {'weights25': {d: round(x, 3) for d, x in sorted(W.items())}, 'sumWeights25': round(sum(W.values()), 2)}
for days in ('365', '25'):
    ts, fn = load('ts%d_%s' % (Y, days)), load('fin%d_%s' % (Y, days)); w = W if days == '25' else None
    mt, mf = monthly(ts, w), monthly(fn, w)
    out[days] = {t: {'twoStages': [round(x) for x in mt[t]], 'fin': [round(x) for x in mf[t]], 'gap': [round(a - b) for a, b in zip(mt[t], mf[t])],
                     'gapYear': round(sum(mt[t]) - sum(mf[t]))} for t in ('crt', 'bdis', 'bchg', 'gc', 'gd', 'go', 'u')}
    if days == '365':
        jul = [d for d in range(365) if MON[d] == 6]; hrs = {}
        for t in ('bdis', 'bchg', 'crt', 'gc'):
            hrs[t] = [round((sum(ts.get((t, d, h), 0) for d in jul) - sum(fn.get((t, d, h), 0) for d in jul)) / len(jul)) for h in range(24)]
        out['julyMeanDayGapMW'] = hrs
print(json.dumps(out))
