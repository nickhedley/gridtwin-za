# Message 750 (a): new solar's capacity factor on the 365-day year, read from a written-out LP (the coefficient of b_pv_<Y> in each
# bal_<Y>_<day>_<hour> row: MW of output per MW built; every vintage carries the same coefficient). Day 0 is 1 January (365 days).
import re, sys, json
lp, Y = sys.argv[1], sys.argv[2]
rx = re.compile(r'^ bal_%s_(\d+)_(\d+):.*?([-+]) ([0-9.eE-]+) b_pv_%s\b' % (Y, Y))
cf = {}
for line in open(lp):
    if not line.startswith(' bal_%s_' % Y): continue
    m = rx.match(line)
    if m: d, h = int(m.group(1)), int(m.group(2)); cf[(d, h)] = float(m.group(4)) * (1 if m.group(3) == '+' else -1)
    else:
        m2 = re.match(r'^ bal_%s_(\d+)_(\d+):' % Y, line)
        if m2 and int(m2.group(1)) < 365: cf[(int(m2.group(1)), int(m2.group(2)))] = 0.0   # no solar term: zero output that hour
days = sorted({d for d, h in cf if d < 365}); assert len(days) == 365, len(days)
ML = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; M = []; for_m = 0
for i, n in enumerate(ML): M += [i] * n
mon = [[] for _ in range(12)]
for d in days:
    for h in range(24): mon[M[d]].append(cf[(d, h)])
monthly = [sum(v) / len(v) for v in mon]
annual = sum(cf[(d, h)] for d in days for h in range(24)) / (365 * 24)
jul = [d for d in days if M[d] == 6]
hours = {h: sum(cf[(d, h)] for d in jul) / len(jul) for h in (7, 8, 16, 17)}
print(json.dumps({'year': int(Y), 'annual': round(annual, 4), 'monthly': [round(x, 3) for x in monthly], 'july_hours': {('%02d:00' % h): round(v, 3) for h, v in hours.items()}}))
