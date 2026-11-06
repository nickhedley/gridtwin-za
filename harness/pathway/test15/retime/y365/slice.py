# Message 750 (c): year Y's own cost from a single-year LP (OPER_FROM=Y HORIZON=Y, every build fixed) and its solution. The LP objective
# sums each build's annuity (capital, fixed O&M, grid) over the years from its build year to Y, discounted to 2026 at BLD_DISC, and year
# Y's dispatch. Year Y's slice: every dispatch and per-year term of year Y (names carrying _Y_ or ending _Y), plus each build column
# (b_<t>_<y>, eb_batt_<y>) at year Y's share of its discounted sum (the annual charge is the same each year: no FOSSIL_END here). Reported
# in year-Y rands (undiscounted), R bn. Usage: slice.py <lp> <solution json> <Y> [disc]
import json, re, sys
lp, sol, Y = sys.argv[1], sys.argv[2], int(sys.argv[3]); disc = float(sys.argv[4]) if len(sys.argv) > 4 else 0.08
txt = open(lp).read(); i = txt.index(' obj:'); j = txt.index('\nSubject To')
obj = {}
for c, v in re.findall(r'([-+]?\s*[0-9.eE+-]+)\s+([A-Za-z_][A-Za-z0-9_]*)', txt[i + 5:j].replace('\n', ' ')):
    obj[v] = obj.get(v, 0) + float(c.replace(' ', ''))
C = json.load(open(sol))['Columns']; df = lambda yy: 1 / (1 + disc) ** (yy - 2026)
parts = {'dispatch and per-year': 0.0, 'capital (year Y share)': 0.0}; by = {}
for v, c in obj.items():
    x = C.get(v, {}).get('Primal', 0.0)
    if not x: continue
    m = re.match(r'^(b_[a-z]+|eb_batt)_(\d{4})$', v)
    if m:
        y0 = int(m.group(2)); share = df(Y) / sum(df(yy) for yy in range(y0, Y + 1)); val = c * x * share; k = 'capital (year Y share)'; t = m.group(1)
    elif re.search(r'_%d(_|$)' % Y, v):
        val = c * x; k = 'dispatch and per-year'; t = v.split('_')[0]
    else: continue
    parts[k] += val; by[t] = by.get(t, 0) + val
tot = sum(parts.values())
out = {'year': Y, 'costRbn': round(tot / df(Y) / 1e9, 4), 'parts': {k: round(v / df(Y) / 1e9, 4) for k, v in parts.items()},
       'byTerm': {k: round(v / df(Y) / 1e9, 4) for k, v in sorted(by.items(), key=lambda kv: -abs(kv[1])) if abs(v) / df(Y) / 1e9 >= 0.005},
       'lpObjectiveRbn': round(json.load(open(sol))['ObjectiveValue'] / 1e9, 4), 'status': json.load(open(sol))['Status']}
print(json.dumps(out))
