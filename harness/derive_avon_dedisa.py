#!/usr/bin/env python3
"""derive_avon_dedisa.py [ESK19679.csv]: the Avon and Dedisa must-run levels in FIXED.avonDedisaMustRun (user, message 88).

Reads the local Eskom file (ESK19679.csv, column 'Dispatchable IPP OCGT', Avon and Dedisa together; never committed) and
prints, by calendar month, the mean output in the daytime block (hours beginning 05-16) and the evening-peak block (hours
beginning 17-20), each the plain mean of the 2025 month and, for January-August, the 2026 month. Night hours (21-04) are
taken as zero; the share of the measured energy that leaves out is printed too. Only these 24 monthly figures are published,
with Eskom credited; no hourly series."""
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
def lvl(m, b):
    ys = [y for y in (2025, 2026) if N[(y, m, b)]]
    return sum(S[(y, m, b)] / N[(y, m, b)] for y in ys) / len(ys)
day = [round(lvl(m, 'day')) for m in range(1, 13)]; eve = [round(lvl(m, 'eve')) for m in range(1, 13)]
print('day:', day); print('eve:', eve)
for y in (2025, 2026):
    T = sum(tot[(y, b)] for b in ('day', 'eve', 'night'))
    print(y, 'measured %.3f TWh, night share %.1f%%' % (T / 1e6, 100 * tot[(y, 'night')] / T))
