# Test 2's further checks (design note v2, 14.5 rule 3; message 691 (g)): for every store, year and representative day k, lvmin_<s>_<y>_<k>
# against the lowest level lv over the real days mapped to k (the lvm_ rows: lvmin <= lv_i for each mapped day i); and the reserve rows'
# duals (resv_, rbe_, rbq_, rpe_, rpq_): how many are non-zero, so whether the rows bind anywhere.
#   python3 -I closure2.py <lp> <solution json>
import json, re, sys, collections
MAP = collections.defaultdict(list)
for line in open(sys.argv[1]):
    m = re.match(r'^ lvm_([a-z]+)_(\d{4})_(\d+): lvmin_[a-z]+_\d{4}_(\d+) - lv_[a-z]+_\d{4}_\d+ <= 0', line)
    if m: MAP[(m[1], m[2], int(m[4]))].append(int(m[3]))
S = json.load(open(sys.argv[2])); C = {k: v['Primal'] for k, v in S['Columns'].items()}
gaps, worst = [], (0, None)
for (s, y, k), days in MAP.items():
    lo = min(C.get('lv_%s_%s_%d' % (s, y, i), 0) for i in days); v = C.get('lvmin_%s_%s_%d' % (s, y, k), 0); g = lo - v
    gaps.append(g)
    if g > worst[0]: worst = (g, (s, y, k, round(v, 1), round(lo, 1)))
tol = 1e-3
print('lvmin groups', len(MAP), '| equal to the minimum over mapped days (within 1e-3 MWh):', sum(1 for g in gaps if abs(g) <= tol),
      '| below it:', sum(1 for g in gaps if g > tol), '| above it (a violation):', sum(1 for g in gaps if g < -tol), '| largest gap', worst)
D = collections.Counter(); N = collections.Counter()
for r in S.get('Rows', []):
    m = re.match(r'^(resv|rbe|rbq|rpe|rpq)_', r['Name'])
    if m: N[m[1]] += 1; D[m[1]] += abs(r.get('Dual', 0) or 0) > 1e-9
print('reserve rows: ' + ', '.join('%s %d of %d non-zero duals' % (k, D[k], N[k]) for k in sorted(N)))
