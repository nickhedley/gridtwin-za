# Table of each storage build column's value by row group (message 667 (d)): ecap (chained block-end level), soc-linked calendar
# capacity rows (cua/cub/cla/clb: the hourly level on the block's first and last real day), dur, stress-day rows, and the rest
# (named). Value = -sum(a*y), R per MW or MWh PV. Usage: python3 -I decomptab.py <decomp json> [<label>]
import json, sys, re, collections
D = json.load(open(sys.argv[1])); lab = sys.argv[2] if len(sys.argv) > 2 else ''
G = lambda f: ('ecap' if f.startswith('ecap') else 'block ends' if re.match(r'(cua|cub|cla|clb) \(repr', f) else
               'stress days' if 'stress' in f else 'dur' if f.startswith('dur') else 'other')
print(lab, '| column | built | value R/unit | ecap % | block ends % | dur % | stress days % | other % | largest other rows')
for v in sorted(D, key=lambda v: (v[-4:], v)):
    d = D[v]; tot = sum(d['fam'].values())
    if abs(tot) < 1: continue
    g = collections.defaultdict(float); oth = collections.defaultdict(float)
    for f, x in d['fam'].items():
        g[G(f)] += x
        if G(f) == 'other': oth[f] += x
    o = ', '.join('%s %.0f%%' % (f, 100 * x / tot) for f, x in sorted(oth.items(), key=lambda t: -abs(t[1]))[:3])
    print('| %s | %.0f | %.0f | %.1f | %.1f | %.1f | %.1f | %.1f | %s |' % (v, d['primal'] or 0, -tot, *(100 * g[k] / tot for k in ('ecap', 'block ends', 'dur', 'stress days', 'other')), o))
