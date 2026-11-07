# Message 767 (c), option B: the extreme days over the twelve modelled years' pool (4,380 days), by extremes.py's criteria
# (harness/pathway/repdays/extremes.py; design note version 2, 3.1; message 678 (e)): for today's fleet and for each source run's fleet
# in each year 2026-2040, the peak-demand day; the day of the tightest net-load hour; the worst three-day net load and the worst
# three-day wind lull, each as all three of its days; the lowest net-load day. Net load as extremes.py: demand at the run's growth index
# (+ the 2027 block) less wind and solar on the run's fleet that year (existing on the fixed-tilt and plain wind series, new on the
# modern-wind and tracking series, rooftop on fixed tilt), the LP's congestion and rooftop derates. On the pool: every day carries the
# same demand profile, so the peak-demand criterion takes, of the twelve copies of the peak calendar day, the one with the highest
# peak net load; three-day windows run within one weather year. The union, as year:day.
#   python3 -I pool_extremes.py <pool dump json (REP_POOL=dump:)> <out json> <pathway json> [...]
import json, sys
import numpy as np
D = json.load(open(sys.argv[1])); out = sys.argv[2]; runs = sys.argv[3:]
YRS = D['years']; NY = len(YRS)
dem = np.array(D['demand']).reshape(365, 24)
S = {k: np.stack([np.array(D['wy'][y][k]).reshape(365, 24) for y in YRS]) for k in ('wind', 'windN', 'solar', 'solarT')}   # (12, 365, 24)
F = D['fleet']; cong = 1 - F['congPct'] / 100
def roll3(v):   # v: (12, 365) daily sums; the worst (largest) three-day window within a year: (year index, first day)
    s = v[:, :-2] + v[:, 1:-1] + v[:, 2:]; i = int(s.argmax()); return i // s.shape[1], i % s.shape[1]
def crit(net, fw, d_y):
    # net, fw: (12, 365, 24); d_y: (365, 24)
    pk = int(d_y.max(1).argmax()); yp = int(net[:, pk, :].max(1).argmax())
    th = int(net.max(2).argmax()); m3 = roll3(net.sum(2)); l3 = roll3(-fw.sum(2)); lo = int(net.sum(2).argmin())
    tag = lambda y, d: '%s:%d' % (YRS[y], d)
    return {'peak demand': [tag(yp, pk)], 'tightest hour': [tag(th // 365, th % 365)],
            'worst 3-day net load': [tag(m3[0], m3[1] + j) for j in range(3)], 'worst 3-day wind lull': [tag(l3[0], l3[1] + j) for j in range(3)],
            'lowest net load': [tag(lo // 365, lo % 365)]}
rec = {'today': crit(dem[None] - 4000 * S['solar'] - 3600 * S['wind'], 3600 * S['wind'], dem)}
for path in runs:
    P = json.load(open(path)); b = P['build']; idx = {int(k): v for k, v in P['demand']['index'].items()}
    name = path.split('/')[-1].replace('pathway_', '').replace('.json', '')
    for y in range(2026, 2041):
        cw = sum(b.get('b_wind_%d' % v, 0) for v in range(2026, y + 1)); cp = sum(b.get('b_pv_%d' % v, 0) for v in range(2026, y + 1))
        cr = sum(b.get('b_rooftop_%d' % v, 0) for v in range(2026, y + 1)) + (P.get('roofStep2027', 0) if y >= 2027 else 0)
        f26 = P.get('fleet2026') or {}
        ew = F['windMW'] + (f26.get('windMW', 0) if y == 2026 else 0); ep = F['pvUtilityMW'] + (f26.get('pvUtilityMW', 0) if y == 2026 else 0)
        d_y = dem * idx[y] + (930 if y >= 2027 else 0)
        fw = ew * S['wind'] + cw * S['windN']
        net = d_y[None] - (fw * cong + (ep * S['solar'] + cp * S['solarT']) * cong + (F['rooftopMW'] + cr) * S['solar'] * F['roofDerate'])
        rec['%s %d' % (name, y)] = crit(net, fw, d_y)
union = sorted({d for c in rec.values() for days in c.values() for d in days}, key=lambda t: (int(t.split(':')[0]), int(t.split(':')[1])))
cal = {}
for t in union: cal.setdefault(int(t.split(':')[1]), []).append(t)
clash = {d: v for d, v in cal.items() if len(v) > 1}
json.dump({'days': union, 'n': len(union), 'calendarClashes': clash, 'years': YRS, 'sources': ['today'] + runs, 'by_source': rec,
           'basis': 'pool_extremes.py: extremes.py criteria over the twelve modelled years (message 767 (c), option B)'}, open(out, 'w'), indent=1)
print('pool extremes (%d):' % len(union), ','.join(union))
print('calendar-day clashes:', clash if clash else 'none')
