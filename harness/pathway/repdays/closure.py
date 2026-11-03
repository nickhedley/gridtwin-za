# Closure check for a linked build LP's solution (design note version 2, test 2): for every store and year, the sum over real days of
# their representative day's net movement (c_<t>_<y>_<k>_23 over map365) is zero, and every hour's level on every real day,
# lv_i + c_<k(i)>_h, is at least zero. Reads the LP (for each real day's representative, from its lnk_ rows) and its solution from
# highs_native.py.  python3 -I closure.py <lp> <solution json>
import json, re, sys, collections
REP = {}
for line in open(sys.argv[1]):
    m = re.match(r'^ lnk_([a-z]+)_(\d{4})_(\d+): .* - c_[a-z]+_\d{4}_(\d+)_23 = 0', line)
    if m: REP[(m[1], m[2], int(m[3]))] = int(m[4])
C = json.load(open(sys.argv[2]))['Columns']
lv = collections.defaultdict(dict); c = collections.defaultdict(dict)
for n, x in C.items():
    m = re.match(r'^lv_([a-z]+)_(\d{4})_(\d+)$', n)
    if m: lv[(m[1], m[2])][int(m[3])] = x['Primal']; continue
    m = re.match(r'^c_([a-z]+)_(\d{4})_(\d+)_(\d+)$', n)
    if m: c[(m[1], m[2], int(m[3]))][int(m[4])] = x['Primal']
bad = 0; worst = 0
for (t, y), L in sorted(lv.items()):
    if len(L) != 365: print('store-year', t, y, 'has', len(L), 'levels'); bad += 1; continue
    for i in range(365):
        k = REP[(t, y, i)]
        if abs(L[(i + 1) % 365] - L[i] - c[(t, y, k)][23]) > 1e-3: print('link broken on day', i, t, y); bad += 1
        worst = min(worst, L[i], min(L[i] + c[(t, y, k)][h] for h in range(24)))
    tot = sum(L[(i + 1) % 365] - L[i] for i in range(365))
    if abs(tot) > 1e-3: print('net over the year not zero', t, y, tot); bad += 1
print('store-years', len(lv), 'lowest hourly level', round(worst, 4), 'problems', bad)
