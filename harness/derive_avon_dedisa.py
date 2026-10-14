#!/usr/bin/env python3
"""derive_avon_dedisa.py [ESK19679.csv]: the Avon and Dedisa must-run levels in FIXED.avonDedisaMustRun (user, messages 88, 93).

Reads the local Eskom file (ESK19679.csv, column 'Dispatchable IPP OCGT', Avon and Dedisa together; never committed) and
prints, by calendar month, the mean output in the daytime block (hours beginning 05-16) and the evening-peak block (hours
beginning 17-20). January-August: the 2026 month (user, message 93). September-December, which 2026 has not reached: the 2025
month times k, the ratio of January-August 2026 to January-August 2025 energy in the two blocks, so 2025's seasonal shape is kept
at 2026's level. Night hours (21-04) are taken as zero; the share of measured energy that leaves out is printed. Only these 24
monthly figures are published, with Eskom credited; no hourly series."""
import csv, sys, datetime as dt, collections
src = sys.argv[1] if len(sys.argv) > 1 else '../ESK19679.csv'
S = collections.defaultdict(float); N = collections.defaultdict(int); tot = collections.defaultdict(float)
with open(src) as f:
    r = csv.reader(f); head = next(r); col = head.index('Dispatchable IPP OCGT')
    for row in r:
        t = dt.datetime.strptime(row[0], '%Y-%m-%d %I:%M:%S %p')
        if t.year not in (2025, 2026): continue
        try: v = max(0.0, float(row[col]))
        except ValueError: continue
        b = 'day' if 5 <= t.hour <= 16 else 'eve' if 17 <= t.hour <= 20 else 'night'
        S[(t.year, t.month, b)] += v; N[(t.year, t.month, b)] += 1; tot[(t.year, b)] += v
        if t.month <= 8: tot[(t.year, 'ja_' + b)] += v
mean = lambda y, m, b: S[(y, m, b)] / N[(y, m, b)]
k = (tot[(2026, 'ja_day')] + tot[(2026, 'ja_eve')]) / (tot[(2025, 'ja_day')] + tot[(2025, 'ja_eve')])
lvl = lambda m, b: mean(2026, m, b) if m <= 8 else k * mean(2025, m, b)
day = [round(lvl(m, 'day')) for m in range(1, 13)]; eve = [round(lvl(m, 'eve')) for m in range(1, 13)]
print('day:', day); print('eve:', eve); print('k (Sep-Dec scale on 2025): %.3f' % k)
D = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
ja = sum((day[m] * 12 + eve[m] * 4) * D[m] for m in range(8)); yr = sum((day[m] * 12 + eve[m] * 4) * D[m] for m in range(12))
print('profile: January-August %.0f GWh, full year %.0f GWh' % (ja / 1e3, yr / 1e3))
for y in (2025, 2026):
    T = sum(tot[(y, b)] for b in ('day', 'eve', 'night')); TJ = sum(tot[(y, 'ja_' + b)] for b in ('day', 'eve', 'night'))
    print(y, 'measured %.3f TWh (January-August %.3f), night share %.1f%%' % (T / 1e6, TJ / 1e6, 100 * tot[(y, 'night')] / T))
