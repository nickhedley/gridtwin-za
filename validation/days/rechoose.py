# Message 122 (1): option (a) by choice of days. Keep bldRepDays' four selected days; replace its eight evenly spaced days (0, 45, ...,
# 315) by one day in each of the same 45-day blocks, equal weights 365/12, so that new wind and tracking solar on the 12 days match the
# twelve-year means; among solutions, keep demand on the days close to its current level and each day close to its block's original.
import json, sys, random
r = json.load(open(sys.argv[1])); A = {d['d']: d for d in r['allDays']}; T = r['twelveYears']
cur = [d['d'] for d in r['days']]; even = [0, 45, 90, 135, 180, 225, 270, 315]; fixed = [d for d in cur if d not in even]
blocks = [list(range(b, min(b + 45, 365))) for b in even]
mean = lambda ds, k: sum(A[d][k] for d in ds) / len(ds)
dem0 = mean(cur, 'dem')
def score(ds):
    return ((mean(ds, 'nw') - T['nw']) / 0.01) ** 2 + ((mean(ds, 'tr') - T['tr']) / 0.01) ** 2 + ((mean(ds, 'dem') - dem0) / 100) ** 2 * 0.25
best = None; random.seed(1)
for rs in range(200):
    pick = [random.choice([d for d in b if d not in fixed]) for b in blocks] if rs else list(even)
    for it in range(30):
        ch = False
        for i, b in enumerate(blocks):
            cand = min((d for d in b if d not in fixed), key=lambda d: (score(fixed + pick[:i] + [d] + pick[i+1:]), abs(d - even[i])))
            if cand != pick[i]: pick[i] = cand; ch = True
        if not ch: break
    s = score(fixed + pick)
    if best is None or s < best[0] - 1e-12: best = (s, list(pick))
ds = sorted(fixed + best[1])
print('current days', cur); print('fixed (selected by stress)', fixed); print('new days', ds)
for k, lab in [('nw', 'new wind'), ('tr', 'tracking solar'), ('cw', 'existing wind'), ('fp', 'fixed-tilt solar'), ('dem', 'demand MW')]:
    tgt = T.get(k, r['defaultYear'][k]) if k != 'dem' else r['defaultYear']['dem']
    print(f"{lab:18} now {mean(cur, k):.4f}  new {mean(ds, k):.4f}  target {tgt:.4f}" if k != 'dem' else f"{lab:18} now {mean(cur, k):,.0f}  new {mean(ds, k):,.0f}  default year {tgt:,.0f}")
json.dump({'days': ds, 'fixed': fixed}, open(sys.argv[2], 'w'))
