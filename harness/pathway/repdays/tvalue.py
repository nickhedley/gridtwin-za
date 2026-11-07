# New wind's and new solar's cost and value as the build LP sees them (message 700 (e)), from a solved pass: for b_<tech>_<y>,
#   cost  = its objective coefficient (every cost the LP charges a MW built in year y over the horizon: annuities, fixed O&M, grid), R;
#   PV MWh = sum over the energy-balance rows it enters of its coefficient (available output per MW) x the row's weight and discount,
#           read from the unserved-energy variable's objective coefficient (VoLL x weight x discount; VoLL R87,000/MWh);
#   value  = sum over the balance rows of coefficient x the row's dual (the energy value), and the rest of (cost - reduced cost) from its
#           other rows (rpb_ etc.); reduced cost from the solution.
# Run capacity factor = PV MWh / (8,760 h x the same weights summed over the hours it could run). Per-MWh figures divide by PV MWh.
#   python3 -I tvalue.py <pass LP> <cached solution json> [years, default 2030,2035,2040] [techs, default wind,pv]
import json, re, sys
lpf, solf = sys.argv[1], sys.argv[2]
YEARS = [int(y) for y in (sys.argv[3] if len(sys.argv) > 3 else '2030,2035,2040').split(',')]
TECHS = (sys.argv[4] if len(sys.argv) > 4 else 'wind,pv').split(',')
VOLL = 87000.0
targets = {'b_%s_%d' % (t, y): (t, y) for t in TECHS for y in YEARS}
obj, ucoef, rows = {}, {}, {n: [] for n in targets}   # rows[var] = [(row, coef)]
def coefs(s):   # {variable: coefficient} for one LP line's terms (an implicit 1 where no number precedes the name)
    t = s.split(); out = {}
    for i, v in enumerate(t):
        if v in targets:
            c, j = 1.0, i - 1
            if j >= 0 and re.match(r'^[0-9.eE+-]+$', t[j]) and t[j] not in ('+', '-'): c = float(t[j]); j -= 1
            if j >= 0 and t[j] == '-': c = -c
            out[v] = out.get(v, 0.0) + c
    return out
upat = re.compile(r'([0-9.eE+-]+)\s+(u_20\d\d_\d+_\d+)(?=\s|$)')
sec = None
with open(lpf) as f:
    for line in f:
        s = line.strip()
        if s.startswith('Minimize') or s.startswith('Minimise') or s == 'obj:' or s.startswith('obj:'): sec = 'obj'
        if s == 'Subject To': sec = 'st'; continue
        if s in ('Bounds', 'End'): sec = None; continue
        if sec == 'obj':
            for m in upat.finditer(s): ucoef[m.group(2)] = float(m.group(1))
            for n, c in coefs(s).items(): obj[n] = obj.get(n, 0.0) + c
        elif sec == 'st' and ':' in s:
            name = s.split(':', 1)[0]
            if not name.startswith('bal_') and not name.startswith('rpb_'): continue
            for n, c in coefs(s.split(':', 1)[1]).items(): rows[n].append((name, c))
sol = json.load(open(solf)); C = sol['Columns']; R = {r['Name']: r['Dual'] for r in sol['Rows']}
out = []
for n, (t, y) in sorted(targets.items(), key=lambda kv: (kv[1][0], kv[1][1])):
    c = obj.get(n, 0.0); d = C.get(n, {}).get('Dual', 0.0); built = C.get(n, {}).get('Primal', 0.0)
    pvmwh = ev = wsum = 0.0; other = 0.0
    for r, a in rows[n]:
        if r.startswith('bal_'):
            wd = ucoef.get('u_' + r[4:], 0.0) / VOLL; pvmwh += a * wd; wsum += wd; ev += a * R.get(r, 0.0)
        else: other += a * R.get(r, 0.0)
    cf = pvmwh / wsum if wsum else float('nan')
    out.append({'tech': t, 'year': y, 'builtMW': round(built, 1), 'costR': round(c), 'pvMWhPerMW': round(pvmwh, 1), 'runCF': round(cf, 4),
                'costPerMWh': round(c / pvmwh, 1) if pvmwh else None, 'energyValuePerMWh': round(ev / pvmwh, 1) if pvmwh else None,
                'otherRowsValueR': round(other), 'reducedCostR': round(d), 'reducedCostPerMWh': round(d / pvmwh, 1) if pvmwh else None})
for o in out: print(json.dumps(o))
