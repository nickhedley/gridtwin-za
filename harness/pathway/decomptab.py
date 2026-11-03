# Table of each storage build column's operating value by row group (messages 665 (c), 667 (d)). Value = -sum(a x dual) over the
# operating rows, R per MW (or per MWh for eb_batt) PV; build limits and floors (iatot, phescap, limin, lemin, stcum) are rents on
# the bound, not value earned, and are shown apart. Groups: ecap (the chained block-end level), block ends (cua/cub/cla/clb, the hourly
# level on each block's first and last real day), dur (within-day discharge within stored energy), stress days (day index 1000+),
# other operating rows (named). Usage: python3 -I decomptab.py <decomp json> [<label>] [<year filter regex>]
import json, sys, re, collections
D = json.load(open(sys.argv[1])); lab = sys.argv[2] if len(sys.argv) > 2 else ''; yf = re.compile(sys.argv[3]) if len(sys.argv) > 3 else None
LIM = ('iatot', 'phescap', 'limin', 'lemin', 'stcum')
G = lambda f: ('limit' if f.split(' ')[0] in LIM else 'ecap' if f.startswith('ecap') else 'block ends' if re.match(r'(cua|cub|cla|clb) \(repr', f) else
               'stress days' if 'stress' in f else 'dur' if f.startswith('dur') else 'other')
m = D.get('_meta', {}); print(lab, 'objective', m.get('objective'), m.get('status'))
print('| column | built | value R/unit | ecap % | block ends % | dur % | stress days % | other % | largest other rows | limit rows R/unit |')
for v in sorted((k for k in D if k != '_meta'), key=lambda v: (v[-4:], v)):
    if yf and not yf.search(v): continue
    d = D[v]; g = collections.defaultdict(float); oth = collections.defaultdict(float)
    for f, x in d['fam'].items():
        g[G(f)] += x
        if G(f) == 'other': oth[f] += x
    val = sum(x for k, x in g.items() if k != 'limit')
    if abs(val) < 1: continue
    o = ', '.join('%s %.0f%%' % (f, 100 * x / val) for f, x in sorted(oth.items(), key=lambda t: -abs(t[1]))[:3])
    print('| %s | %.0f | %.0f | %.1f | %.1f | %.1f | %.1f | %.1f | %s | %.0f |' % (v, d['primal'] or 0, -val, *(100 * g[k] / val for k in ('ecap', 'block ends', 'dur', 'stress days', 'other')), o, -g['limit']))
