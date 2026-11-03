# Message 689 (3): the engine on the fixed data, from run_engine_queue's outputs (harness/out/wx686): the three wind series (686 (b)),
# the three metered calms as a stress test (687 (b), 688 (b); reported apart, not probability-weighted) and the coal practice floor
# ending before 2030 (as now), 2028 or 2027 (688 (a)). Unserved in GWh a year: mean over draws, worst 1% (p99) and worst draw (max).
#   python3 -I summarise686.py <outdir>
import json, os, sys
O = sys.argv[1]
def load(n):
    p = os.path.join(O, n + '.json')
    return {str(r['y']): r for r in json.load(open(p))} if os.path.exists(p) else None
f = lambda v, d=2: ('%.' + str(d) + 'f') % v if isinstance(v, (int, float)) else '-'
H = '%-10s %-5s %5s %8s %8s %8s %8s %7s %7s %7s %6s %6s %6s %6s %s'
print(H % ('run', 'year', 'draws', 'mean', 'p99', 'max', 'target', 'curt', 'coal', 'cost', 'ps', 'li', 'vrfb', 'fe', 'weather'))
def row(n, y):
    R = load(n)
    if not R or y not in R: return
    r = R[y]; s, q = r.get('storeTWh', {}), r.get('shedPct', {})
    print(H % (n, y, r['nRuns'], f(r['mean']), f(q.get('p99')), f(q.get('max')), f(r['target'], 1), f(r['curt']), f(r['coal'], 1), f(r['cost'], 1),
               f(s.get('ps')), f(s.get('li')), f(s.get('vrfb')), f(s.get('fe')), r.get('weather', '')))
for run, years in (('c7', ('2030', '2035', '2040')), ('ff', ('2040',))):
    print('\nwind series' if run == 'c7' else '')
    for y in years:
        for v in ('stored', 'c5', 'c6'): row('%s_%s' % (run, v), y)
for run, years in (('c7', ('2030', '2035', '2040')), ('ff', ('2040',))):
    print('\nlulls (stress test, apart)' if run == 'c7' else '')
    for y in years:
        for v in ('stored', 'lull0', 'lull1', 'lull2'): row('%s_%s' % (run, v), y)
print('\ncoal practice floor ending before')
for y in ('2027', '2028', '2029', '2030'):
    for fy in ('2030', '2028', '2027'): row('c7_floor' + fy, y)
