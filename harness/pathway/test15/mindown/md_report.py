# Messages 767 (b) and (c): two pathway runs side by side, 2030, 2035 and 2040: new wind, solar and lithium (MW, MWh) standing since 2026
# (cumulative), coal standing and coal retired early, the run's objective; and each run's engine check at 20 draws (unserved GWh with its
# standard error, curtailment and coal TWh). From harness/ or anywhere:
#   python3 -I md_report.py <name A> <pathway A json> <engine A json> <name B> <pathway B json> <engine B json>
import json, sys
a = sys.argv[1:]
R = [(a[i], json.load(open(a[i + 1])), json.load(open(a[i + 2])) if a[i + 2] != '-' else None) for i in (0, 3)]
YS = (2030, 2035, 2040)
cum = lambda s, k, Y: sum((s[y].get(k) or 0) for y in s if int(y) <= Y)
rows = [('Wind, MW new', lambda s, Y: cum(s, 'wind', Y)), ('Solar, MW new', lambda s, Y: cum(s, 'pv', Y)),
        ('Lithium, MW new', lambda s, Y: cum(s, 'batt', Y)), ('Lithium, MWh new', lambda s, Y: cum(s, 'battMWh', Y)),
        ('Coal standing, MW', lambda s, Y: s[str(Y)].get('coalMW') or 0), ('Coal retired early, MW', lambda s, Y: s[str(Y)].get('earlyRetMW') or 0)]
n1, n2 = R[0][0], R[1][0]
print('| %s against %s | Year | %s | %s | Difference |' % (n2, n1, n1, n2)); print('|---|---|---:|---:|---:|')
for name, f in rows:
    for Y in YS:
        x, y = f(R[0][1]['sched'], Y), f(R[1][1]['sched'], Y)
        print('| %s | %d | %s | %s | %+.0f |' % (name, Y, '{:,.0f}'.format(x), '{:,.0f}'.format(y), y - x))
o1, o2 = R[0][1]['objective'] / 1e9, R[1][1]['objective'] / 1e9
print('| Objective, R bn | | %.3f | %.3f | %+.3f |' % (o1, o2, o2 - o1))
print()
print('| Engine, 20 draws | Year | %s: unserved GWh (se); curtailment, coal TWh | %s |' % (n1, n2)); print('|---|---|---|---|')
for i, Y in enumerate(YS):
    c = []
    for _, P, E in R:
        r = next((e for e in E if e.get('scenarioYear') == Y), None) if E else None
        c.append('%.2f (%.2f); %.2f, %.2f' % (r['mean'], r['seMean'], r['curt'], r['coal']) if r else 'not run')
    print('| | %d | %s | %s |' % (Y, c[0], c[1]))
