#!/usr/bin/env python3
"""Print a pathway run's saved state to the log (12 Oct 2026). Artifacts cannot be downloaded into the Claude
container, so this job prints what the IRP note needs: every pass's worst-year shed against target, the build by year,
and the engine check by year. It reads, never solves.

usage: python3 print_state.py <run name> <dir> [<dir> ...]   (each dir an unpacked state-<name> or results-<name>)
"""
import json, os, sys

name, dirs = sys.argv[1], sys.argv[2:]
def find(fn):
    for d in dirs:
        p = os.path.join(d, 'out', fn)
        if os.path.exists(p): return p
    return None

for d in dirs:
    o = os.path.join(d, 'out')
    if os.path.isdir(o):
        print('== files in', o)
        for f in sorted(os.listdir(o)): print('  %-48s %12d bytes' % (f, os.path.getsize(os.path.join(o, f))))

def passes_from_log(log):
    print('== stress loop, pass by pass (mean shed over the adequacy test against target, GWh; worst year by ratio)')
    for e in log:
        ys = e.get('years') or []
        nadd = len(e['added']) if isinstance(e.get('added'), list) else e.get('added')
        if ys:
            w = max(ys, key=lambda q: (q['mean'] / q['limit']) if q['limit'] else 0)
            fails = [q for q in ys if q['mean'] > q['limit']]
            print('pass %2d  worst %d: %.2f / %.2f GWh (%3.0f%%)  failing years %2d  windows added %s' % (
                e['pass'], w['y'], w['mean'], w['limit'], 100 * w['mean'] / w['limit'] if w['limit'] else 0, len(fails), nadd))
            if fails: print('         failing:', ', '.join('%d %.2f/%.2f' % (q['y'], q['mean'], q['limit']) for q in fails))
        if isinstance(e.get('added'), list):
            for a in e['added']:
                print('         added for %s: weather year %s, days %s-%s (%s days, draw seed %s), shed %s GWh' % (a.get('forModelYear'), a.get('year'),
                      a.get('start'), (a['start'] + a['n'] - 1) if isinstance(a.get('start'), int) and isinstance(a.get('n'), int) else '?', a.get('n'), a.get('seed'), a.get('shedGWh')))

P, G, C = find('pathway_%s.json' % name), find('pathway_%s.json.progress' % name), find('pathcheck_%s.json' % name)
if P:
    J = json.load(open(P))
    print('== pathway_%s.json: verdict %s, status %s, %s s, objective %s' % (name, J.get('verdict'), J.get('status'), J.get('secs'), J.get('objective')))
    for k in ('demand', 'gas', 'disc', 'liEnergyHours', 'adequacyBasis', 'gasFloor', 'gasMin', 'phes', 'nuclearAdd', 'margin', 'peakerExt'):
        if k in J: print('  %s: %s' % (k, json.dumps(J[k])[:300]))
    passes_from_log(J.get('log', []))
    S = J['sched']; ys = sorted(S, key=int)
    keys = []
    for y in ys:
        for k in S[y]:
            if k not in keys: keys.append(k)
    print('== build by year (MW; battMWh in MWh; coalMW standing, earlyRetMW early coal retirement, dslDecomMW diesel retired)')
    print('year ' + ' '.join('%9s' % k[:9] for k in keys))
    for y in ys:
        print(y + ' ' + ' '.join('%9s' % (round(S[y][k]) if isinstance(S[y].get(k), (int, float)) else (json.dumps(S[y].get(k))[:9] if k in S[y] else '-')) for k in keys))
elif G:
    print('== pathway_%s.json not present (run unfinished); progress file:' % name)
    pg = json.load(open(G))
    if isinstance(pg, str): pg = json.loads(pg)   # the pathway writes it JSON-encoded twice
    for e in pg:
        f = e.get('fails') or []
        w = max(f, key=lambda q: q[1] / q[2]) if f else None
        print('pass %2d  failing years %2d  windows added %s  %s' % (e['pass'], len(f), e.get('nAdded'),
              ('worst %d: %.2f / %.2f GWh (%.0f%%)' % (w[0], w[1], w[2], 100 * w[1] / w[2])) if w else 'no failing year'))
        if f: print('         failing:', ', '.join('%d %.2f/%.2f' % tuple(q) for q in f))
        if isinstance(e.get('added'), list):
            for a in e['added']:
                print('         added for %s: weather year %s, days %s-%s (%s days, draw seed %s), shed %s GWh' % (a.get('forModelYear'), a.get('year'),
                      a.get('start'), (a['start'] + a['n'] - 1) if isinstance(a.get('start'), int) and isinstance(a.get('n'), int) else '?', a.get('n'), a.get('seed'), a.get('shedGWh')))
        elif e.get('added') is not None: print('         added:', json.dumps(e['added']))
else:
    print('== no pathway output or progress file for', name)

if C:
    R = json.load(open(C)); rows = R if isinstance(R, list) else R.get('rows', [])
    print('== engine check by year (pathcheck_%s.json): shed and target on customer demand (GWh), cost R bn a year, CO2 Mt, TWh' % name)
    print('year  newOcgdMW coalDecomMW  shed  target   pct  marg  costRbn   co2   coalTWh dieselTWh gasTWh  draws')
    for r in rows:
        print('%d %10s %11s %5.2f %7.2f %5.0f%% %5s %8.1f %6.1f %8.1f %8.2f %7.2f %5s' % (
            r['y'], round(r.get('newOcgdMW', 0)), round(r.get('coalDecomMW', 0)), r['mean'], r['target'],
            100 * r['mean'] / r['target'] if r.get('target') else 0, 'yes' if r.get('marginal') else '',
            r['cost'], r['co2'], r['coal'], r['diesel'], r.get('gasTWh', 0), r.get('draws', '')))
    df = 1.08
    pv = sum(r['cost'] / df ** (r['y'] - 2026) for r in rows)
    print('cost 2026-%d, present value at 8%% real (2026 base): R%.0f bn; CO2 total %.0f Mt' % (rows[-1]['y'], pv, sum(r['co2'] for r in rows)))
