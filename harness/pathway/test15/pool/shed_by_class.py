# Message 778 (c): where each pass-1 LP plans its shedding, by day class, weighted as its adequacy row tgt_<y> weighs it (GWh a year):
# extreme days, typical days and the tail windows (days 1000+). The key's weights are read from its LP's tgt_2035 and tgt_2040 rows
# (key_tgt_weights.json; the LP of run_md.sh p1 cap, which has the key's days); option B's from its log line 'REP_POOL days ... weights',
# with the tail windows' weights taken from the key's (the same rule in both). Each solution is the LP cache's stored solution.
#   python3 -I shed_by_class.py <key_tgt_weights.json> <key solution json> <option B solution json> <option B log>
import json, re, sys, collections
K = json.load(open(sys.argv[1]))
wk = {int(d): v for d, v in K['tgt_2035']['w'].items()}
log = open(sys.argv[4]).read()
m = re.search(r'REP_POOL days: (\S+); weights (\S+);', log)
wb = {int(t.split(':')[1]): float(w) for t, w in zip(m.group(1).split(','), m.group(2).split(','))}
wb.update({d: w for d, w in wk.items() if d >= 1000})
for n, f, W in (('key', sys.argv[2], wk), ('option B', sys.argv[3], wb)):
    C = json.load(open(f))['Columns']
    for Y in ('2035', '2040'):
        cls = collections.defaultdict(float); top = collections.defaultdict(float)
        for k, v in C.items():
            p = k.split('_')
            if p[0] in ('u', 'rsl') and len(p) == 4 and p[1] == Y and v['Primal'] > 0:
                d = int(p[2]); w = W[d]
                c = 'tail' if d >= 1000 else ('extreme' if w <= 1.0 else 'typical')
                cls[c] += w * v['Primal']
                if p[0] == 'u': top[d] += v['Primal']
        big = max((x for x in top.items() if x[0] < 1000), key=lambda t: t[1], default=(None, 0))
        print('%s %s: weighted GWh %s, total %.2f; largest calendar day, unweighted: day %s, %.1f GWh (weight %s)' % (
            n, Y, {c: round(v / 1e3, 2) for c, v in sorted(cls.items())}, sum(cls.values()) / 1e3, big[0], big[1] / 1e3,
            round(W.get(big[0], 0), 4) if big[0] is not None else '-'))
