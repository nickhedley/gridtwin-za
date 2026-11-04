# Test 12, first part (design note version 2, test 12; message 699 (f)): every yearly build limit and energy cap that binds in a solved
# pathway LP, by technology and year, with its shadow price from the solve's duals. Limits read from the LP text: build variables' upper
# bounds (b_<tech>_<y>, eb_batt_<y>, cw_<y>, vppp_<y>, gy_<y>) and the limit rows (tcap, gascap, offcap, phescap, gfmcap, sccmax, rpb_*,
# rppool, cwb, cwpool, battdur_min/max, mbmin_*, limin, lemin, rcmono, rcain). A bound binds when the value is at it (within 1e-6 of
# the bound's size, and the bound above 0) and its reduced cost is not 0; a row binds when its dual is not 0. Shadow prices are the
# objective's units (rand, present value) per unit of the limit (MW or MWh); negative: relaxing the limit by one unit lowers the cost.
#   python3 -I test12.py <pass LP> <cached solution json> [out json]
import json, re, sys
lpf, solf = sys.argv[1], sys.argv[2]; out = sys.argv[3] if len(sys.argv) > 3 else None
BV = re.compile(r'^(b_[a-z]+|eb_batt|cw|vppp|gy)_(20\d\d)$')
ROWS = re.compile(r'^(tcap|gascap|offcap|phescap|gfmcap|sccmax|rpb_[a-z]+|rppool|cwb|cwpool|battdur_min|battdur_max|mbmin_[a-z]+|limin|lemin|rcmono|rcain)_(20\d\d)')
ub, rowdef, sec = {}, {}, None
with open(lpf) as f:
    for line in f:
        s = line.strip()
        if s in ('Subject To', 'Bounds', 'End', 'General', 'Generals', 'Binary'): sec = s; continue
        if sec == 'Subject To':
            m = re.match(r'^([A-Za-z_0-9]+):\s*(.*)$', s)
            if m and ROWS.match(m.group(1)): rowdef[m.group(1)] = m.group(2)[:160]
        elif sec == 'Bounds':
            m = re.match(r'^(-?[0-9.eE+]+)\s*<=\s*(\S+)\s*<=\s*(-?[0-9.eE+]+)$', s)
            if m and BV.match(m.group(2)): ub[m.group(2)] = (float(m.group(1)), float(m.group(3)))
sol = json.load(open(solf)); C = sol['Columns']; R = {r['Name']: r for r in sol['Rows']}
res = []
for n, (lo, hi) in sorted(ub.items()):
    if hi <= 0 or lo == hi: continue                      # zero caps (technology off) and fixed values are not build limits
    c = C.get(n); v = c['Primal'] if c else 0.0; d = c['Dual'] if c else 0.0
    if v >= hi - 1e-6 * max(1.0, abs(hi)) and abs(d) > 1e-6:
        t, y = BV.match(n).groups(); res.append({'year': int(y), 'limit': t + ' upper bound', 'value': round(v, 1), 'bound': hi, 'shadow': d})
for n, txt in sorted(rowdef.items()):
    r = R.get(n)
    if r and abs(r['Dual']) > 1e-6:
        fam, y = ROWS.match(n).groups(); res.append({'year': int(y), 'limit': fam + ' row', 'value': round(r['Primal'], 1), 'row': txt, 'shadow': r['Dual']})
res.sort(key=lambda x: (x['year'], x['limit']))
for x in res:
    print('%d  %-28s value %10s  %s  shadow %.4g' % (x['year'], x['limit'], x['value'], ('bound ' + str(x['bound'])) if 'bound' in x else x['row'][:90], x['shadow']))
if out: json.dump(res, open(out, 'w'), indent=1)
