# Message 691 (c): reads refs2x2.sh's outputs after accept_an.py has written an.json in the same folder: per run and cell, the LP's
# objective, 2040 builds and operating totals, and the engine on each build on the stored and on the six-constant weather.
#   python3 -I accept_an.py <dir>; python3 -I refs_an.py <dir>
import json, os, sys
O = sys.argv[1]; A = {r['run']: r for r in json.load(open(os.path.join(O, 'an.json')))}
def eng(n, wx):
    p = os.path.join(O, '%s_eng_%s.json' % (n, wx))
    if not os.path.exists(p): return None
    r = [x for x in json.load(open(p)) if x['y'] == 2040][0]
    return dict(mean=r['mean'], p99=r['shedPct']['p99'], worst=r['worst'], curt=r['curt'], coal=r['coal'], cost=r['cost'], se=r['seMean'])
out = []
for run in ('central', 'ff'):
    for c in ('met_st', 'y25_st', 'met_c6', 'y25_c6'):
        n = run + '_' + c; a = A.get(n)
        if not a: continue
        o = dict(run=n, obj_bn=a['obj_bn'], lp=dict(coal=a['coal'], gas=a['ccgt'] + a['ocgt'], diesel=a['diesel'], curt=a['curt'], shed_gwh=a['shed_gwh']),
                 build=a['build'], eng_st=eng(n, 'st'), eng_c6=eng(n, 'c6'))
        out.append(o)
        f = lambda e: ('mean %.2f p99 %.1f worst %.1f curt %.1f coal %.1f' % (e['mean'], e['p99'], e['worst'], e['curt'], e['coal'])) if e else '-'
        print('%-16s obj %9.2f bn | LP coal %5.1f gas %5.2f curt %6.1f shed %6.2f GWh' % (n, a['obj_bn'], a['coal'], a['ccgt'] + a['ocgt'], a['curt'], a['shed_gwh']))
        print('   build', a['build']); print('   engine stored:', f(o['eng_st'])); print('   engine six-constant:', f(o['eng_c6']))
json.dump(out, open(os.path.join(O, 'refs_an.json'), 'w'), indent=1)
