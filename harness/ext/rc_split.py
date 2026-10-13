# Split the reduced cost of one build column (default b_ccgt_2030) into the value of each row it enters, and the
# hourly gas-limit rows further by the marginal resource of that hour: unserved energy, diesel, coal, or other.
# usage: python3 rc_split.py <lp> <solution json> <costconst json> [column]
# The LP from a pathway run with DUMP_LP (pathway_perfail.js); the solution from lpcache/ under the LP's hash; the
# cost constants as {costCcgt, vomCcgt, emisCcgt, costDiesel, vomDiesel, emisDiesel, costCoal, vomCoal, emisCoal,
# carbonTaxRPerT, carbonTaxPathOn} read from the page. 8 Oct 2026.
import sys, re, json
from collections import defaultdict
lp, solf, ccf = sys.argv[1:4]; COL = sys.argv[4] if len(sys.argv) > 4 else 'b_ccgt_2030'
cc = json.load(open(ccf))
term = re.compile(r'([-+])\s*([0-9.]+(?:[eE][-+]?\d+)?)?\s*([A-Za-z_][\w]*)')
objc = {}; rows = {}            # objective coefficients; rows containing COL: name -> coefficient
want = re.compile(r'^(gg|gd|gc|u|rsl)_')
sec = None
with open(lp) as f:
    for line in f:
        s = line.strip(); low = s.lower()
        if low in ('minimize', 'maximize'): sec = 'obj'; continue
        if low in ('subject to', 'st', 's.t.', 'such that'): sec = 'st'; continue
        if low in ('bounds', 'end', 'generals', 'general', 'binary'): sec = 'other'; continue
        if sec == 'obj':
            body = s.split(':', 1)[1] if s.startswith('obj') else s
            for sg, c, v in term.findall(' + ' + body if not body.lstrip().startswith(('+', '-')) else body):
                if v == COL or want.match(v): objc[v] = (-1 if sg == '-' else 1) * (float(c) if c else 1.0)
        elif sec == 'st' and COL in s:
            name, body = s.split(':', 1)
            lhs = re.split(r'<=|>=|=', body)[0]
            for sg, c, v in term.findall(lhs if lhs.lstrip().startswith(('+', '-')) else ' + ' + lhs):
                if v == COL: rows[name.strip()] = (-1 if sg == '-' else 1) * (float(c) if c else 1.0)
print('rows containing', COL, len(rows), 'by type', dict((t, sum(1 for r in rows if r.startswith(t + '_'))) for t in ('gmax', 'resv', 'res')))
sol = json.load(open(solf))
cols = sol['Columns']; rdual = {r['Name']: r['Dual'] for r in sol['Rows']}
cj = objc.get(COL, 0.0); dj = cols[COL]['Dual']
val = {r: a * rdual[r] for r, a in rows.items()}
print('objective coef c_j %.4g, reported reduced cost d_j %.4g, c_j - sum(a*y) %.4g' % (cj, dj, cj - sum(val.values())))
# Hourly gas-limit rows: classify the hour by its marginal resource and split the value into parts.
def carbon(y):
    if not cc['carbonTaxPathOn'] or y <= 2026: return cc['carbonTaxRPerT']
    head = 462 if y >= 2030 else 308 * (462 / 308) ** ((y - 2026) / 4)
    return head * (1 - max(0.75, 0.85 - 0.025 * min(4, y - 2026)))
G = (cc['costCcgt'] + cc['vomCcgt'], cc['emisCcgt']); D = (cc['costDiesel'] + cc['vomDiesel'], cc['emisDiesel']); C = (cc['costCoal'] + cc['vomCoal'], cc['emisCoal'])
parts = defaultdict(float); hours = defaultdict(int); byyear = defaultdict(lambda: defaultdict(float)); wchk = []
def classify(k, y):
    # The hour's energy price (balance-row dual) matched to the cost coefficient of the resource that sets it.
    price = rdual.get('bal_' + k, 0.0); cg = objc.get('gg_' + k); wdf = cg / (G[0] + carbon(y) * G[1])
    wchk.append(abs(objc.get('gd_' + k, 0) / (D[0] + carbon(y) * D[1]) - wdf) / wdf)
    for n, comp in (('u', None), ('gd', D), ('gg', G), ('gc', C)):
        c = objc.get(n + '_' + k)
        if c and abs(price - c) <= 1e-6 * max(1.0, abs(c)):
            if comp is None: return price, wdf, 'unserved (VoLL)', (price, 0.0, 0.0)
            return price, wdf, {'gd': 'diesel', 'gg': 'gas', 'gc': 'coal'}[n], (0.0, comp[0] * wdf, carbon(y) * comp[1] * wdf)
    tag = 'scarcity carried by storage or energy limits' if price > objc.get('gd_' + k, 0) * (1 + 1e-6) else 'below diesel: storage, curtailment or coupled'
    return price, wdf, tag, None
for r, v in val.items():
    if r.startswith('res_'): parts['planning margin row (res_)'] += v; continue
    if r.startswith('resv_'): parts['hourly reserve rows (resv_)'] += v; continue
    if r.startswith('gmax_'): k = r[5:]; kind = 'gas-limit'
    elif r.startswith('bal_'): k = r[4:]; kind = 'balance'
    else: parts['other rows (' + r.split('_')[0] + ')'] += v; continue
    y = int(k.split('_')[0]); d = int(k.split('_')[1]); day = 'stress' if d >= 1000 else 'rep'
    if abs(v) < 1e-9: hours[kind + ' rows not binding'] += 1; continue
    price, wdf, tag, comp = classify(k, y)
    a = rows[r]
    if kind == 'gas-limit':   # value = price - gas running cost; split both sides
        gasf, gasc = G[0] * wdf, carbon(y) * G[1] * wdf
        if comp: unserved, fuel, carb = comp[0], comp[1] - gasf, comp[2] - gasc
        else: unserved, fuel, carb = 0.0, -gasf, -gasc
    else:                     # value = coefficient x price
        if comp: unserved, fuel, carb = a * comp[0], a * comp[1], a * comp[2]
        else: unserved, fuel, carb = 0.0, 0.0, 0.0
    rest = v - unserved - fuel - carb
    key = day + ' / ' + tag; hours[key] += 1
    parts[day + ': VoLL, hours where shedding sets the price'] += unserved
    parts[day + ': fuel and VOM of the marginal unit'] += fuel
    parts[day + ': carbon of the marginal unit'] += carb
    parts[day + ': ' + ('scarcity carried by storage or energy limits' if tag.startswith('scarcity') else 'other coupled value') ] += rest
    byyear[y][key] += v
print('hour weight check (diesel vs gas coefficients agree): max rel. diff %.2e' % (max(wchk) if wchk else 0))
tot = sum(parts.values())
print('\nvalue of one MW of', COL, 'by part (R, discounted, objective units), total %.4g' % tot)
for p, v in sorted(parts.items(), key=lambda x: -abs(x[1])): print('  %-48s %14.4g  %5.1f%%' % (p, v, 100 * v / tot if tot else 0))
print('\nbinding gas-limit hours by marginal resource:', dict(hours))
print('\nby year, gas-limit value (R):')
for y in sorted(byyear): print(' ', y, {k: '%.3g' % v for k, v in sorted(byyear[y].items(), key=lambda x: -abs(x[1]))})
