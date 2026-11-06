# Message 748 / 750 (b): which days the 25-day LP gets wrong, the representation gap alone: the same build on the same reference year,
# its 25 days (weighted by the LP's own day weights) against all 365 days, by month; GWh. Also the 365-day LP's days with shed or diesel
# that are not among the 25 days. Usage: rep_gap.py <dir> <Y> <name prefix: ts|fin>
import json, sys, collections, importlib.util
D, Y, N = sys.argv[1], int(sys.argv[2]), sys.argv[3]
spec = importlib.util.spec_from_file_location('season', D + '/season.py')
ML = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; MON = []
for i, n in enumerate(ML): MON += [i] * n
W = {int(k): v for k, v in json.load(open('%s/season_%d.json' % (D, Y)))['weights25'].items()}
def load(n):
    C = json.load(open('%s/%s_sol.json' % (D, n)))['Columns']; out = collections.defaultdict(float)
    for k, v in C.items():
        p = k.split('_')
        if len(p) == 4 and p[1] == str(Y) and p[0] in ('crt', 'bdis', 'gc', 'gd', 'go', 'u') and v['Primal']: out[(p[0], int(p[2]), int(p[3]))] += v['Primal']
    return out
a, b = load('%s%d_365' % (N, Y)), load('%s%d_25' % (N, Y)); res = {}
for t in ('gc', 'gd', 'go', 'crt', 'bdis', 'u'):
    m365, m25 = [0.0] * 12, [0.0] * 12
    for (tt, d, h), x in a.items():
        if tt == t and d < 365: m365[MON[d]] += x / 1000
    for (tt, d, h), x in b.items():
        if tt == t and d < 365: m25[MON[d]] += x * W.get(d, 0) / 1000
    res[t] = {'365': [round(x) for x in m365], '25': [round(x) for x in m25], 'year365': round(sum(m365)), 'year25': round(sum(m25))}
days25 = {d for d in W if d < 365}; byday = collections.defaultdict(float)
for (t, d, h), x in a.items():
    if d < 365 and t in ('u', 'gd') and d not in days25: byday[(t, d)] += x
res['offDays365'] = sorted([(t, d, round(x)) for (t, d), x in byday.items() if x > 1], key=lambda z: -z[2])[:12]
print(json.dumps(res))
