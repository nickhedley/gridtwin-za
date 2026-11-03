# 683 (c): the engine on three weather references, side by side. Reads run_wx.sh's outputs.
#   python3 -I summarise.py <outdir>
import json, os, sys
O = sys.argv[1]
def load(n):
    p = os.path.join(O, n + '.json')
    return {str(r['y']): r for i, r in enumerate(json.load(open(p)))} if os.path.exists(p) else None
for run, years in (('c7', ('2026', '2030', '2035', '2040')), ('ff', ('2040',))):
    for y in years:
        print('\n%s %s' % (run, y))
        print('%-16s %6s %8s %8s %8s %8s %8s %7s %7s %6s %6s %6s %6s' % ('weather', 'runs', 'shed', 'p95', 'p99', 'max', 'target', 'curt', 'coal', 'ps', 'li', 'vrfb', 'fe'))
        for n in ('metered', 'metered_k40', 'metered_trk12', 'metered_trk12_k40', '2025', '2025_k40', 'modelled'):
            R = load('%s_%s' % (run, n))
            if not R: continue
            r = R.get(y)
            if not r: continue
            s, q = r.get('storeTWh', {}), r.get('shedPct', {})
            f = lambda v, d=2: ('%.' + str(d) + 'f') % v if v is not None else '-'
            print('%-16s %6d %8s %8s %8s %8s %8s %7s %7s %6s %6s %6s %6s' % (n, r['nRuns'], f(r['mean']), f(q.get('p95')), f(q.get('p99')), f(q.get('max')), f(r['target'], 1),
                  f(r['curt']), f(r['coal'], 1), f(s.get('ps')), f(s.get('li')), f(s.get('vrfb')), f(s.get('fe'))))
