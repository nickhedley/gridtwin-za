# The extreme days for bldRepWeights 'clustered' (design note version 2, 3.1; user decision 3 Nov 2026, message 678 (e): the fixed
# union, computed by this script). Every day that is an extreme on today's fleet or on a reference run's fleet in any year 2026-2040:
# the peak-demand day; the day of the tightest net-load hour; the worst three-day net load and the worst three-day wind lull, each as
# all three of its days; the lowest net-load day. Net load: demand at the run's growth index (+ the 2027 block) less wind and solar on
# the run's fleet that year (existing on the reference-year profiles, new on the modern-wind and tracking profiles, rooftop on solar),
# the LP's congestion and rooftop derates. Today's fleet: bldRepDays' 4,000 MW solar and 3,600 MW wind.
#   python3 -I extremes.py <series.json from extract.js> <out.json> <pathway json> [<pathway json> ...]
# Writes the sorted union and, per source and year, which day met which criterion. validate_lp.js checks FIXED.bldRepExtremeDays
# against <out.json> (harness/pathway/repdays/extremes.json).
import json, sys, numpy as np
D = json.load(open(sys.argv[1])); out = sys.argv[2]; runs = sys.argv[3:]
dem = np.array(D['demand']).reshape(365, 24); w0 = np.array(D['wind']).reshape(365, 24); wn = np.array(D['windN']).reshape(365, 24)
s0 = np.array(D['solar']).reshape(365, 24); st = np.array(D['solarT']).reshape(365, 24); F = D['fleet']; cong = 1 - F['congPct'] / 100
def roll(v, n):
    s = np.array([v[i:i + n].sum() for i in range(365 - n + 1)]); return int(s.argmax())
def crit(net, fw, d_y):
    m3 = roll(net.sum(1), 3) + 1; l3 = roll(-fw.sum(1), 3) + 1
    return {'peak demand': [int(d_y.max(1).argmax())], 'tightest hour': [int(net.max(1).argmax())],
            'worst 3-day net load': [m3 - 1, m3, m3 + 1], 'worst 3-day wind lull': [l3 - 1, l3, l3 + 1],
            'lowest net load': [int(net.sum(1).argmin())]}
rec = {'today': crit(dem - 4000 * s0 - 3600 * w0, 3600 * w0, dem)}
for path in runs:
    P = json.load(open(path)); b = P['build']; idx = {int(k): v for k, v in P['demand']['index'].items()}
    name = path.split('/')[-1].replace('pathway_', '').replace('.json', '')
    for y in range(2026, 2041):
        cw = sum(b.get('b_wind_%d' % v, 0) for v in range(2026, y + 1)); cp = sum(b.get('b_pv_%d' % v, 0) for v in range(2026, y + 1))
        cr = sum(b.get('b_rooftop_%d' % v, 0) for v in range(2026, y + 1)) + (P.get('roofStep2027', 0) if y >= 2027 else 0)
        f26 = P.get('fleet2026') or {}
        ew = F['windMW'] + (f26.get('windMW', 0) if y == 2026 else 0); ep = F['pvUtilityMW'] + (f26.get('pvUtilityMW', 0) if y == 2026 else 0)
        d_y = dem * idx[y] + (930 if y >= 2027 else 0)
        fw = ew * w0 + cw * wn
        net = d_y - (fw * cong + (ep * s0 + cp * st) * cong + (F['rooftopMW'] + cr) * s0 * F['roofDerate'])
        rec['%s %d' % (name, y)] = crit(net, fw, d_y)
union = sorted({d for c in rec.values() for days in c.values() for d in days})
json.dump({'days': union, 'sources': ['today'] + runs, 'by_source': rec,
           'basis': "design note version 2, 3.1; message 678 (e); series from extract.js (c7's day settings, ROOF12)"}, open(out, 'w'), indent=1)
print('extreme days (%d):' % len(union), union)
