"""Compare two profiles.json-format files: annual capacity factors, demand totals and peaks, timing of the top demand
hours, diurnal shapes, hourly correlation, and renewable output in the top demand hours.
usage: python3 compare_profiles.py label=fileA label=fileB"""
import json, sys, numpy as np, pandas as pd
runs = [(a.split('=', 1)[0], json.load(open(a.split('=', 1)[1]))) for a in sys.argv[1:]]
idx = pd.date_range('2025-01-01', periods=8760, freq='h')
print('%-26s' % '' + ''.join('%16s' % l for l, _ in runs))
row = lambda name, f: print('%-26s' % name + ''.join('%16s' % f(p) for _, p in runs))
for k in ('wind_pu', 'solar_pu', 'csp_pu'): row(k + ' CF %', lambda p, k=k: '%.2f' % (100 * np.mean(p[k])))
for k in ('demand', 'demand_2025'):
    row(k + ' TWh', lambda p, k=k: '%.2f' % (sum(p[k]) / 1e6))
    row(k + ' peak MW', lambda p, k=k: '%.0f' % max(p[k]))
    row(k + ' peak when', lambda p, k=k: idx[int(np.argmax(p[k]))].strftime('%d %b %Hh'))
    row(k + ' min MW', lambda p, k=k: '%.0f' % min(p[k]))
    row(k + ' load factor %', lambda p, k=k: '%.1f' % (100 * np.mean(p[k]) / max(p[k])))
def top(p, k='demand', n=100): return np.argsort(p[k])[-n:]
print('\ntop 100 demand hours: count by month (Jan..Dec)')
for l, p in runs: print('  %-14s' % l, np.bincount(idx[top(p)].month, minlength=13)[1:].tolist())
print('top 100 demand hours: count by hour of day (0..23)')
for l, p in runs: print('  %-14s' % l, np.bincount(idx[top(p)].hour, minlength=24).tolist())
print('\nmean output in the top 100 demand hours (per unit): wind, solar')
for l, p in runs: t = top(p); print('  %-14s %.3f %.3f' % (l, np.mean(np.array(p['wind_pu'])[t]), np.mean(np.array(p['solar_pu'])[t])))
print('\ndiurnal mean by hour (0..23)')
for k in ('wind_pu', 'solar_pu', 'csp_pu', 'demand'):
    for l, p in runs:
        s = pd.Series(p[k], idx).groupby(idx.hour).mean()
        print('  %-9s %-12s' % (k, l), ' '.join(('%.2f' % v) if k != 'demand' else ('%.1f' % (v / 1e3)) for v in s))
print('\nmonthly CF % (Jan..Dec)')
for k in ('wind_pu', 'solar_pu'):
    for l, p in runs:
        s = pd.Series(p[k], idx).groupby(idx.month).mean()
        print('  %-9s %-12s' % (k, l), ' '.join('%.1f' % (100 * v) for v in s))
if len(runs) >= 2:
    print('\nhourly correlation with %s' % runs[0][0])
    for k in ('wind_pu', 'solar_pu', 'csp_pu', 'demand'):
        print('  %-9s' % k, ' '.join('%s %.3f' % (l, np.corrcoef(runs[0][1][k], p[k])[0, 1]) for l, p in runs[1:]))
    print('daily-mean correlation with %s' % runs[0][0])
    for k in ('wind_pu', 'solar_pu', 'demand'):
        d0 = pd.Series(runs[0][1][k], idx).resample('D').mean()
        print('  %-9s' % k, ' '.join('%s %.3f' % (l, np.corrcoef(d0, pd.Series(p[k], idx).resample('D').mean())[0, 1]) for l, p in runs[1:]))
    print('hours below 2%% output, wind: ' + ' '.join('%s %d' % (l, int((np.array(p['wind_pu']) < 0.02).sum())) for l, p in runs))
