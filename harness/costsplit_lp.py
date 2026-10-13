# COST SPLIT, OPTIMISER SIDE (TODO 14cv, user, 13 Oct 2026; branch claude/costsplit, analysis only, solves nothing).
# Splits a finished pathway LP's objective into components, PV at 8% real (the objective's own discounting), from the
# LP text (rebuilt by pathway_perfail.js with DUMP_LP from the run's settings and stress windows) and the run's cached
# solution (lpcache/<sha1 of the LP text>.json). Checks that the coefficients times the solution reproduce the
# objective the run recorded. Also gives generation by technology in one year (default 2040), weighted to a year.
# Usage: python3 -I costsplit_lp.py <lp> <lpcache dir> <pathway json> <constants json> <out json> [year]
import sys, re, json, os, glob, hashlib, collections

lpf, cdir, pathf, constf, outf = sys.argv[1:6]
GY = int(sys.argv[6]) if len(sys.argv) > 6 else 2040
K = json.load(open(constf))
P = json.load(open(pathf))
text = open(lpf).read()
key = hashlib.sha1(text.encode()).hexdigest()
i = text.index('Subject To')
obj = text[:i].replace('obj:', 'obj: +', 1)
term = re.compile(r'([+-])\s*([0-9.eE+-]+)\s+([A-Za-z_][A-Za-z0-9_]*)')
coef = collections.defaultdict(float)
for s, c, v in term.findall(obj):
    coef[v] += float(c) if s == '+' else -float(c)

# The cached solution: by the LP's own key, else the cache file whose objective matches the run's.
cf = os.path.join(cdir, key + '.json')
how = 'key ' + key[:10]
if not os.path.exists(cf):
    rec = P.get('objective')
    cf = None
    for f in sorted(glob.glob(os.path.join(cdir, '*.json'))):
        if f.endswith('.basis.json'): continue
        try:
            with open(f) as fh: head = fh.read(400)
            m = re.search(r'"ObjectiveValue":\s*([0-9.eE+-]+)', head)
            if m and rec and abs(float(m.group(1)) - rec) <= 1e-7 * abs(rec): cf = f; how = 'objective match ' + os.path.basename(f)[:10]; break
        except Exception: pass
    if cf is None:
        for f in sorted(glob.glob(os.path.join(cdir, '*.json'))):
            if f.endswith('.basis.json'): continue
            d = json.load(open(f))
            if rec and abs(d.get('ObjectiveValue', 0) - rec) <= 1e-7 * abs(rec): cf = f; how = 'objective match ' + os.path.basename(f)[:10]; break
if cf is None: raise SystemExit('no cached solution for LP key %s or objective %s in %s' % (key[:10], P.get('objective'), cdir))
sol = json.load(open(cf))
val = {n: c['Primal'] for n, c in sol['Columns'].items()}
print('LP key', key[:10], '| solution', how, '| status', sol.get('Status'), '| objective', sol.get('ObjectiveValue'), '| run recorded', P.get('objective'))

VOLL, D = K['voll'], K['BLD_DISC']
df = lambda y: (1 + D) ** -(y - 2026)
def carbon_at(y):
    if not K['carbonTaxPathOn'] or y <= 2026: return K['carbonTaxRPerT']
    head = 462 if y >= 2030 else 308 * (462 / 308) ** ((y - 2026) / 4)
    return head * (1 - max(0.75, 0.85 - 0.025 * min(4, y - 2026)))
OC_K = K['heatRateOcgtKJ'] / 3600 * K['effCcgtHHV']
EMIS = {'gc': K['emisCoal'], 'gg': K['emisCcgt'], 'go': K['emisCcgt'] * OC_K, 'gd': K['emisDiesel']}
VOM = {'gc': K['vomCoal'], 'gg': K['vomCcgt'], 'go': K['vomOcgt'], 'gd': K['vomDiesel']}
FUEL = {'gc': 'coal', 'gg': 'gas (CCGT)', 'go': 'gas (OCGT on LNG)', 'gd': 'diesel'}

# Day weights from the shed terms (u_ is priced VOLL x day weight x discount factor on every hour of every day).
wdf = {}
for v, c in coef.items():
    m = re.match(r'^u_(\d{4})_(\d+)_(\d+)$', v)
    if m: wdf[(int(m.group(1)), m.group(2), m.group(3))] = c / VOLL
def weight(y, d, h): return wdf[(y, d, h)] / df(y)

comp = collections.defaultdict(float)      # PV R by component
byyear = collections.defaultdict(lambda: collections.defaultdict(float))
total = 0.0
for v, c in coef.items():
    x = val.get(v, 0.0)
    if x == 0 or c == 0: continue
    pv = c * x; total += pv
    m = re.match(r'^(gc|gg|go|gd)_(\d{4})_(\d+)_(\d+)$', v)
    if m:
        f, y = m.group(1), int(m.group(2)); w = wdf[(y, m.group(3), m.group(4))]
        unit = c / w
        carb = carbon_at(y) * EMIS[f]; vom = VOM[f]
        tail = (w / df(y)) < 1
        comp['fuel: ' + FUEL[f]] += (unit - carb - vom) * w * x
        comp['variable O&M: ' + FUEL[f]] += vom * w * x
        comp['carbon: ' + FUEL[f]] += carb * w * x
        comp['(of which on stress-window days) ' + FUEL[f]] += pv if tail else 0
        byyear[y]['fuel+VOM+carbon'] += pv
        continue
    m = re.match(r'^(u|rsl)_(\d{4})_(\d+)_(\d+)$', v)
    if m:
        y = int(m.group(2)); tail = weight(y, m.group(3), m.group(4)) < 1
        comp[('shed' if m.group(1) == 'u' else 'reserve shortfall') + (' on stress-window days' if tail else ' on representative days')] += pv
        byyear[y]['shed and reserve penalties'] += pv
        continue
    m = re.match(r'^tsl_(\d{4})$', v)
    if m: comp['stress target: expected shed above target (VoLL x 365)'] += pv; byyear[int(m.group(1))]['stress target'] += pv; continue
    m = re.match(r'^crt_(\d{4})_', v)
    if m: comp['curtailment charge'] += pv; continue
    m = re.match(r'^([a-z])dis_(\d{4})_', v)
    if m: comp['storage discharge wear (' + m.group(1) + 'dis)'] += pv; continue
    m = re.match(r'^(b|eb)_([a-z]+)_(\d{4})$', v)
    if m: comp['build: ' + (m.group(2) + (' energy' if m.group(1) == 'eb' else ''))] += pv; continue
    m = re.match(r'^rc_(\d{4})$', v)
    if m: comp['early coal retirement: fixed O&M saved'] += pv; continue
    comp['other: ' + re.sub(r'_\d.*$', '', v)] += pv

print('objective from coefficients x solution: R%.3f bn (solver %.3f, run %.3f)' % (total / 1e9, (sol.get('ObjectiveValue') or 0) / 1e9, (P.get('objective') or 0) / 1e9))
for k in sorted(comp, key=lambda k: -abs(comp[k])):
    if abs(comp[k]) > 1e6: print('  %-62s R%10.2f bn' % (k, comp[k] / 1e9))

# The stress target by year: expected shed and reserve shortfall on stress-window days (the tgt_ row's left-hand side, with
# the solution), its target (right-hand side) and the excess tsl_ priced at VoLL x 365; and plain shed (u) alone.
tgt = re.compile(r'^ tgt_(\d{4}): (.*) - tsl_\d{4} <= (-?[0-9.eE+]+)$', re.M)
tpair = re.compile(r'([0-9.]+) ((u|rsl)_\d{4}_\d+_\d+)')
st = {}
for m in tgt.finditer(text):
    y = int(m.group(1)); lhs = {'u': 0.0, 'rsl': 0.0}
    for c, v, k in tpair.findall(m.group(2)): lhs[k] += float(c) * val.get(v, 0.0)
    st[y] = {'shedMWh': lhs['u'], 'reserveShortMWh': lhs['rsl'], 'targetMWh': float(m.group(3)), 'tslMWh': val.get('tsl_%d' % y, 0.0),
             'penaltyBn': coef.get('tsl_%d' % y, 0.0) * val.get('tsl_%d' % y, 0.0) / 1e9}
if st:
    print('stress target by year, expected MWh over the year (representative days at their weight, stress-window days at theirs): shed + reserve shortfall vs target -> excess penalised at VoLL x 365 (R bn PV)')
    for y in sorted(st):
        z = st[y]
        if z['shedMWh'] + z['reserveShortMWh'] > 0 or z['tslMWh'] > 0:
            print('  %d  shed %9.1f + reserve shortfall %9.1f = %9.1f vs target %9.1f -> excess %9.1f (R%6.2f bn)' % (y, z['shedMWh'], z['reserveShortMWh'], z['shedMWh'] + z['reserveShortMWh'], z['targetMWh'], z['tslMWh'], z['penaltyBn']))

# 2030 diagnostics (TODO 14cv, user, 13 Oct): the stress windows binding in 2030 (from the windows file the run used, WINDOWS
# env), and the coal and diesel capacity the LP allows in 2030, by representative and stress-window day: coal from the
# cmax_ rows (right-hand side less the early-retirement term at the solution), diesel from the dmax_ rows plus new open-cycle.
WY = 2030
WF = os.environ.get('WINDOWS')
if WF and os.path.exists(WF):
    W = json.load(open(WF)); per = W.get('periods') or []
    print('windows file %s: %d periods; keys of the first: %s' % (WF, len(per), sorted(per[0].keys()) if per else None))
    for p in per:
        ys = p.get('years'); fy = p.get('fromYear', p.get('forModelYear'))
        binds = (WY in ys) if isinstance(ys, list) else (fy is not None and fy <= WY)
        if binds:
            print('  binds %d: weather year %s, days %s-%s (%s days), draw seed %s, for model year %s, years %s, shed %s GWh' % (WY, p.get('year'), p.get('start'),
                  (p['start'] + p['n'] - 1) if isinstance(p.get('start'), int) and isinstance(p.get('n'), int) else '?', p.get('n'), p.get('seed'), p.get('forModelYear'), ys, p.get('shedGWh')))
cm = re.compile(r'^ cmax_%d_(\d+)_(\d+): .*?(?: \+ ([0-9.]+) rc_%d)? <= (-?[0-9.]+)$' % (WY, WY), re.M)
dm = re.compile(r'^ dmax_%d_(\d+)_(\d+): gd_\S+((?: - b_ocgd_\d{4})*) <= (-?[0-9.]+)$' % WY, re.M)
rcv = val.get('rc_%d' % WY, 0.0)
cap = collections.defaultdict(lambda: {'coal': [], 'diesel': []})
for m in cm.finditer(text):
    d, h, k, rhs = m.group(1), m.group(2), m.group(3), float(m.group(4))
    cap[d]['coal'].append(rhs - (float(k) if k else 0) * rcv)
ocgd = sum(val.get('b_ocgd_%d' % y, 0.0) for y in range(2026, WY + 1))
for m in dm.finditer(text):
    cap[m.group(1)]['diesel'].append(float(m.group(4)) + ocgd)
rep = [d for d in cap if weight(WY, d, '0') >= 1]; tail = [d for d in cap if weight(WY, d, '0') < 1]
def stats(ds, k):
    xs = [x for d in ds for x in cap[d][k]]
    return (sum(xs) / len(xs), min(xs), max(xs)) if xs else (0, 0, 0)
for lab, ds in (('representative days', rep), ('stress-window days', tail)):
    c, dd = stats(ds, 'coal'), stats(ds, 'diesel')
    print('%d LP capacity, %s (%d days): coal available mean %.0f MW (min %.0f, max %.0f); diesel open-cycle %.0f MW (existing plus %.0f new)' % (WY, lab, len(ds), c[0], c[1], c[2], dd[0], ocgd))
print('%d coal standing in the LP: early retirement rc_%d = %.0f MW' % (WY, WY, rcv))

# Generation in year GY, TWh, weighted to a year: representative days at their weight, stress-window days at theirs.
gen = collections.defaultdict(lambda: [0.0, 0.0])   # [representative days, stress-window days]
for v, x in val.items():
    m = re.match(r'^(gc|gg|go|gd|u|rsl|crt|[a-z]dis|[a-z]chg)_(\d{4})_(\d+)_(\d+)$', v)
    if not m or int(m.group(2)) != GY or x == 0: continue
    w = weight(GY, m.group(3), m.group(4))
    gen[m.group(1)][0 if w >= 1 else 1] += w * x / 1e6
# New wind, solar, rooftop and offshore from the balance rows (profile x capacity built to date), and the right-hand side
# (demand less the existing fleet's fixed supply).
row = re.compile(r'^ bal_%d_(\d+)_(\d+): (.*) = (-?[0-9.]+)$' % GY, re.M)
pair = re.compile(r'([0-9.]+) (b_(wind|pv|rooftop|off)_\d{4})')
for m in row.finditer(text):
    d, h, lhs, rhs = m.group(1), m.group(2), m.group(3), float(m.group(4))
    w = weight(GY, d, h); j = 0 if w >= 1 else 1
    for c, v, t in pair.findall(lhs):
        gen['new ' + t][j] += w * float(c) * val.get(v, 0.0) / 1e6
    gen['demand less existing fixed supply'][j] += w * rhs / 1e6
print('generation %d, TWh (representative days | stress-window days):' % GY)
for k in sorted(gen): print('  %-40s %9.2f | %7.2f' % (k, gen[k][0], gen[k][1]))
json.dump({'stressTarget': st, 'key': key, 'solution': how, 'objective': total, 'recorded': P.get('objective'), 'components': comp,
           'byYear': {y: dict(v) for y, v in byyear.items()}, 'gen': {'year': GY, **{k: v for k, v in gen.items()}}}, open(outf, 'w'), indent=1)
