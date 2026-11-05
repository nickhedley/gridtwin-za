"""PyPSA network sensitivity of a national-engine run (message 717 (c)): ten GCCA supply areas, 8,760 hours, LP, storage
optimised, on the engine's own hourly run (an engine dump written by the patched pathcheck, sc/engine_dump_page.js).

usage: pypsa_net.py <engine dump json> <worktree root> <case> <siting> <out json> [losses 0|1] [coalmin 0|1] [mipgap]
  case:   nolimit | n0 | n1 | n1tdp (n0: today's limits as drawn; n1: 0.7 x today's corridor limits; n1tdp: plus TDP lines joining two areas, by TDP year)
  siting: reea | fleet              (new wind and solar by approved REEA records per area, or by the existing fleet's shares)
  losses: 1 adds linear losses of 6% per 1,000 km on each corridor (PyPSA-RSA config.yaml), as two one-way links
  coalmin: 1 imposes the engine's own hourly coal commitment x the design minimum stable level as a floor (a sensitivity); 2 fixes coal to the engine's hourly output
"""
import sys, os, json, re, csv, time
import numpy as np, pandas as pd, pypsa

DUMP, ROOT, CASE, SITING, OUT = sys.argv[1:6]
LOSSES = int(sys.argv[6]) if len(sys.argv) > 6 else 0
COALMIN = int(sys.argv[7]) if len(sys.argv) > 7 else 0
H = 8760
REG = ['Eastern Cape','Limpopo','Mpumalanga','Gauteng','Western Cape','Northern Cape','Hydra Central','Kwazulu Natal','North West','Free State']
D = json.load(open(DUMP)); p = D['p']; s = D['state']; hh = D['hourly']; st = hh['stack']; pu = hh['pu']; WY = str(D['weatherYear']); Y = int(s['scenarioYear'])
A = lambda a: np.array(a, dtype=float)
notes = []

# ---------------------------------------------------------------- regional data at the worktree's build
def jload(f): return json.load(open(os.path.join(ROOT, f)))
eng_src = open(os.path.join(ROOT, 'nodal/nodal_engine.js')).read()
CORR = [(a, b, float(l), float(km)) for a, b, l, km in re.findall(r"\['([^']+)','([^']+)',\s*(\d+),\s*(\d+)\]", re.search(r"const CORRIDORS = \[(.*?)\];", eng_src, re.S).group(1))]
cap = jload('nodal/regional_renewable_capacity.json'); roofmw = jload('nodal/rooftop_mw_by_region.json')
priv = cap.get('by_source', {}).get('private', {}).get('solar_mw', {})
roof_r = {r: max(0.0, roofmw[r] - priv.get(r, 0)) for r in REG}                  # the loader's private-solar subtraction
mm = jload('nodal/profiles_regional_multiyear.json'); SC = mm['scale']
wpu = {r: A(mm['wind_pu'][r][WY]) / SC for r in REG}; spu = {r: A(mm['solar_pu'][r][WY]) / SC for r in REG}
wmap = jload('nodal/profiles_wind_modern_map.json')['regional_map']; tmap = A(jload('nodal/profiles_solar_tracking_map.json')['map'])
demrows = [r for r in csv.DictReader(l for l in open(os.path.join(ROOT, 'nodal/demand_2025_regional.csv')) if not l.startswith('#'))]
dreg = {r: A([float(x[r + '_corrected']) for x in demrows]) for r in REG}; dtot = sum(dreg.values()); share = {r: dreg[r] / dtot for r in REG}
subs = {x['n']: x.get('area') for x in jload('nodal/substations_compact.json')['subs']}
uc = json.loads(re.search(r"const UC_FLEET = (\[.*?\]);", open(os.path.join(ROOT, 'index.html')).read()).group(1))
# month and hour of day for the tracking map
hod = np.arange(H) % 24; mdays = [31,28,31,30,31,30,31,31,30,31,30,31]; mon = np.concatenate([np.full(d * 24, i) for i, d in enumerate(mdays)])

# ---------------------------------------------------------------- siting of new wind and solar
def reea_shares():
    GEN = re.compile(r'wind|solar|csp|hydro', re.I)
    NOT = [re.compile(r'\b(gas|coal)[- ](fired|power|turbines?|to power)\b|\blpg\b|\blng\b|thabametsi', re.I),
           re.compile(r'^\s*(the\s+)?(proposed\s+)?(development\s+of\s+|construction\s+of\s+)?(the\s+|a\s+|an\s+)?(\d+\s*kv\s+)?(overhead\s+)?(power\s*lines?|grid\s+connection|transmission\s+lines?|distribution\s+lines?|switching\s+station|substation)\b', re.I),
           re.compile(r'^\s*(the\s+)?(proposed\s+)?(construction\s+and\s+operation\s+of\s+)?(the\s+)?battery energy storage', re.I)]
    seen = set(); out = {'wind': {r: 0.0 for r in REG}, 'solar': {r: 0.0 for r in REG}}
    for q in jload('nodal/reea_projects.json')['projects']:
        if q.get('status') != 'Approved' or not GEN.search(q.get('tech') or '') or not (isinstance(q.get('mw'), (int, float)) and q['mw'] > 0) or any(x.search(q.get('name') or '') for x in NOT): continue
        k = '|'.join(str(q.get(z)) for z in ('name', 'mw', 'decided', 'lat', 'lng'))
        if k in seen: continue
        seen.add(k); a = subs.get(q.get('sub'))
        if a not in out['wind']: continue
        if q['tech'] == 'Wind': out['wind'][a] += q['mw']
        elif q['tech'] == 'Solar PV': out['solar'][a] += q['mw']
    for t in out:
        T = sum(out[t].values()); out[t] = {r: v / T for r, v in out[t].items()}
    return out
def fleet_shares():
    out = {}
    for t, key in (('wind', 'wind_mw'), ('solar', 'solar_mw')):
        T = sum(cap[key][r] for r in REG); out[t] = {r: cap[key][r] / T for r in REG}
    return out
site = reea_shares() if SITING == 'reea' else fleet_shares()

# ---------------------------------------------------------------- national series the engine used
loadS, chPs, chBt, dr = A(hh['loadS']), A(hh['chargePs']), A(hh['chargeBatt']), A(hh['drMW']) if hh.get('drMW') else np.zeros(H)
roofpu = A(pu['roof']) if pu.get('roof') else A(pu['solar'])
roofCap = p['rooftopMW'] + s['newRooftopMW']; roofGen = roofCap * roofpu * p['rooftopDerate']
gridLoad = loadS - chPs - chBt + dr                 # what the engine served from the grid (demand after growth, block, rooftop netting and exports)
grossLoad = gridLoad + roofGen
wind_pu, windMod = A(pu['wind']), A(pu['windMod']) if pu.get('windMod') else None
solar_pu, solarTrk, solarX = A(pu['solar']), A(pu['solarTrk']) if pu.get('solarTrk') else None, A(pu['solarX']) if pu.get('solarX') else None
k, xs = p['kW'], p['xs']
E_w, N_w, E_p, N_p = p['windMW'], s['newWindMW'], p['pvUtilityMW'], s['newPvMW']
nat_avail = {'wind_ex': E_w * wind_pu, 'wind_new': N_w * (np.minimum(1, k * windMod) if (windMod is not None and N_w > 0) else wind_pu),
             'pv_ex': E_p * ((1 - xs) * solar_pu + xs * (solarX if solarX is not None else solar_pu)), 'pv_new': N_p * (solarTrk if solarTrk is not None else solar_pu)}

# ---------------------------------------------------------------- regional series scaled to the national totals
def scaled(tech, capby, pu_by, target):
    tot = sum(capby[r] * pu_by[r].sum() for r in REG)
    f = target / tot if tot > 0 else 1.0
    series = {r: np.minimum(1.0, f * pu_by[r]) for r in REG}
    got = sum(capby[r] * series[r].sum() for r in REG)
    notes.append(f'{tech}: regional series scaled by {f:.4f}; clipping at 1 loses {(target - got) / 1e6:.4f} TWh of {target / 1e6:.3f}')
    return series
cap_wex = {r: cap['wind_mw'][r] for r in REG}; cap_wnew = {r: N_w * site['wind'][r] for r in REG}
cap_pex = {r: cap['solar_mw'][r] for r in REG}; cap_pnew = {r: N_p * site['solar'][r] for r in REG}
wmod_r = {r: np.minimum(1.0, k * A(wmap[r])[np.minimum(49, np.floor(np.minimum(1, wpu[r]) * 50).astype(int))]) for r in REG}   # the regional LP's modern-turbine map, times the correction
trk_r = {r: spu[r] * tmap[mon, hod] for r in REG}                                                                            # the national tracking ratio by month and hour on the regional fixed-tilt series
ser_wex = scaled('existing wind', cap_wex, wpu, nat_avail['wind_ex'].sum())
ser_wnew = scaled('new wind', cap_wnew, wmod_r, nat_avail['wind_new'].sum()) if N_w > 0 else {r: wpu[r] for r in REG}
ser_pex = scaled('existing solar', cap_pex, spu, nat_avail['pv_ex'].sum())
ser_pnew = scaled('new solar', cap_pnew, trk_r, nat_avail['pv_new'].sum()) if N_p > 0 else {r: spu[r] for r in REG}
roofT = sum(roof_r.values()); roof_cap_r = {r: roofCap * roof_r[r] / roofT for r in REG}

# ---------------------------------------------------------------- coal by region, as the engine's standing fleet
coalRem = p['coalInstalledMW'] - s['coalDecomMW']
standing = [u for u in uc if (9999 if u['decom'] == 'beyond 2050' else int(u['decom'])) > Y]
rawT = sum(u['cap'] for u in standing); coal_r = {r: coalRem * sum(u['cap'] for u in standing if u['region'] == r) / rawT for r in REG}
coalAvail = A(hh['coalAvailable']); coal_pu = np.minimum(1.0, coalAvail / coalRem) if coalRem > 0 else np.zeros(H)
coalCommitted = A(hh['coalCommitted']) if hh.get('coalCommitted') else None
notes.append(f'coal: {coalRem:.0f} MW standing in {Y} from {len(standing)} UC_FLEET groups ({rawT:.0f} MW by date, scaled {coalRem / rawT:.3f}); hourly availability from the engine (mean {coalAvail.mean():.0f} MW)')
carbon = p['carbonTaxRPerT']
mc_coal = p['costCoal'] + p['vomCoal'] + carbon * p['emisCoal']
mc_ccgt = p['costCcgt'] + p['vomCcgt'] + carbon * p['emisCcgt']
OCK = 10624 / 3600 * 0.52   # the engine's _ocK: heatRateOcgtKJ / 3600 x effCcgtHHV (FIXED at build 2026-11-03a)
mc_ocgt = (p['costCcgt'] + carbon * p['emisCcgt']) * OCK + 80.19 * 1.068   # vomOcgt: FIXED 80.19 x CPI_JAN24_TO_JAN26
mc_dsl = p['costDiesel'] + p['vomDiesel'] + carbon * p['emisDiesel']
ccgtMW = (D['caps']['ccgtCap'] - s['newOcgtMW']); ocgtMW = s['newOcgtMW']; dslMW = D['dieselCap'] + s['newOcgdMW']
dsl_site = {'Western Cape': 2072 / 3077, 'Kwazulu Natal': 670 / 3077, 'Eastern Cape': 335 / 3077}   # Ankerlig and Gourikwa, Avon, Dedisa (fleet_units.csv)
gas_bus = 'Kwazulu Natal'   # new gas at the Richards Bay LNG site (assumption, stated)

# ---------------------------------------------------------------- storage
ps_site = {'Kwazulu Natal': 2332 / 2900, 'Western Cape': 568 / 2900}   # the nodal engine's siting, scaled to the page's psPowerMW
battEx = {'Western Cape': 20.0, 'Kwazulu Natal': 48.0}; battExH = p['battHours']
newBatt = s['newBattMW']; newBattH = s['newBattHours']
batt_site = {'North West': 692 / 1744, 'Free State': 616 / 1744, 'Northern Cape': 436 / 1744} if SITING != 'reea_batt' else site['solar']

# ---------------------------------------------------------------- the network
n = pypsa.Network(); n.set_snapshots(range(H))
for r in REG: n.add('Bus', r, carrier='AC')
# corridors
tdp = []
if CASE == 'n1tdp':
    KVMW = {400: 900, 765: 3000, 275: 600}
    for q in jload('nodal/tdp_projects.json')['projects']:
        if q.get('kind') != 'line' or (q.get('year') or 9999) > Y: continue
        areas = sorted(set(a for a in (subs.get(z['n']) for z in q.get('pts', [])) if a))
        if len(areas) == 2: tdp.append((areas[0], areas[1], KVMW.get(q.get('kv'), 900), q['name'], q.get('year')))
corr = []
for a, b, lim, km in CORR:
    add = sum(mw for x, y2, mw, nm, yr in tdp if {x, y2} == {a, b})
    if CASE == 'nolimit': cap_ab = 1e6
    elif CASE == 'n0': cap_ab = lim                 # today's corridors as the model draws them (N-0)
    else: cap_ab = 0.7 * (lim + add)
    corr.append((a, b, cap_ab, km, lim, add))
extra = [(x, y2, mw, nm) for x, y2, mw, nm, yr in tdp if not any({x, y2} == {a, b} for a, b, *_ in CORR)]
for x, y2, mw, nm in extra: corr.append((x, y2, 0.7 * mw, 300.0, 0.0, mw)); notes.append(f'TDP line {nm} joins {x} and {y2}, a pair with no corridor today: added at 0.7 x {mw} MW, 300 km')
for i, (a, b, cap_ab, km, lim, add) in enumerate(corr):
    if LOSSES:
        eff = 1 - 0.06 * km / 1000
        n.add('Link', f'c{i}_ab', bus0=a, bus1=b, p_nom=cap_ab, efficiency=eff, marginal_cost=0.01, carrier='corridor')
        n.add('Link', f'c{i}_ba', bus0=b, bus1=a, p_nom=cap_ab, efficiency=eff, marginal_cost=0.01, carrier='corridor')
    else:
        n.add('Link', f'c{i}', bus0=a, bus1=b, p_nom=cap_ab, p_min_pu=-1, efficiency=1.0, marginal_cost=0.01, carrier='corridor')
# loads: gross national load split by the regional demand file's hourly shares; rooftop as a must-run generator per area
for r in REG:
    n.add('Load', f'{r} load', bus=r, p_set=grossLoad * share[r])
    n.add('Generator', f'{r} rooftop', bus=r, p_nom=max(1e-6, roof_cap_r[r]), p_max_pu=roofpu * p['rooftopDerate'], p_min_pu=roofpu * p['rooftopDerate'], marginal_cost=0, carrier='rooftop')
    if cap_wex[r] > 0: n.add('Generator', f'{r} wind ex', bus=r, p_nom=cap_wex[r], p_max_pu=ser_wex[r], marginal_cost=0, carrier='wind')
    if cap_wnew[r] > 0: n.add('Generator', f'{r} wind new', bus=r, p_nom=cap_wnew[r], p_max_pu=ser_wnew[r], marginal_cost=0, carrier='wind')
    if cap_pex[r] > 0: n.add('Generator', f'{r} pv ex', bus=r, p_nom=cap_pex[r], p_max_pu=ser_pex[r], marginal_cost=0, carrier='pv')
    if cap_pnew[r] > 0: n.add('Generator', f'{r} pv new', bus=r, p_nom=cap_pnew[r], p_max_pu=ser_pnew[r], marginal_cost=0, carrier='pv')
    if coal_r[r] > 0:
        kw = dict(p_max_pu=coal_pu)
        if COALMIN == 1 and coalCommitted is not None: kw['p_min_pu'] = np.minimum(coal_pu, 0.57 * coalCommitted / coalRem)
        if COALMIN == 2:   # the engine's own hourly coal output, fixed (the tie-out's decomposition)
            cs = np.minimum(coal_pu, A(st['coal']) / coalRem); kw['p_max_pu'] = cs; kw['p_min_pu'] = cs
        n.add('Generator', f'{r} coal', bus=r, p_nom=coal_r[r], marginal_cost=mc_coal, carrier='coal', **kw)
    n.add('Generator', f'{r} unserved', bus=r, p_nom=1e5, marginal_cost=p['voll'], carrier='unserved')
    if r in dsl_site: n.add('Generator', f'{r} diesel', bus=r, p_nom=dslMW * dsl_site[r], marginal_cost=mc_dsl, carrier='diesel')
# must-run plant as the engine dispatched it
def mustrun(name, bus, series, carrier):
    pn = max(1.0, float(np.max(series))); n.add('Generator', name, bus=bus, p_nom=pn, p_max_pu=series / pn, p_min_pu=series / pn, marginal_cost=0, carrier=carrier)
mustrun('Koeberg', 'Western Cape', A(st['nuclear']), 'nuclear')
mustrun('hydro', 'Hydra Central', A(st['hydro']), 'hydro')
if st.get('hybrid'): mustrun('hybrid', 'Northern Cape', A(st['hybrid']), 'hybrid')
if st.get('imports') and np.sum(st['imports']) > 0: mustrun('imports', 'Gauteng', A(st['imports']), 'imports')
n.add('Generator', 'CSP', bus='Northern Cape', p_nom=p['cspMW'], p_max_pu=A(pu['csp']), p_min_pu=A(pu['csp']), marginal_cost=0, carrier='csp')
if ccgtMW > 0: n.add('Generator', 'CCGT', bus=gas_bus, p_nom=ccgtMW, marginal_cost=mc_ccgt, carrier='ccgt')
if ocgtMW > 0: n.add('Generator', 'OCGT', bus=gas_bus, p_nom=ocgtMW, marginal_cost=mc_ocgt, carrier='ocgt')
for r, f in ps_site.items():
    n.add('StorageUnit', f'{r} pumped storage', bus=r, p_nom=p['psPowerMW'] * f, max_hours=p['psEnergyMWh'] / p['psPowerMW'], efficiency_store=p['psEff'], efficiency_dispatch=1.0, cyclic_state_of_charge=True, carrier='ps')
for r, mw in battEx.items():
    n.add('StorageUnit', f'{r} battery ex', bus=r, p_nom=mw, max_hours=battExH, efficiency_store=p['battEff'], efficiency_dispatch=1.0, cyclic_state_of_charge=True, carrier='batt')
for r, f in batt_site.items():
    if newBatt > 0: n.add('StorageUnit', f'{r} battery new', bus=r, p_nom=newBatt * f, max_hours=newBattH, efficiency_store=p['battEff'], efficiency_dispatch=1.0, cyclic_state_of_charge=True, carrier='batt')

t0 = time.time()
status, cond = n.optimize(solver_name='highs', solver_options={'presolve': 'on', 'parallel': 'on'})
secs = time.time() - t0
# ---------------------------------------------------------------- results
g = n.generators_t.p; gc = n.generators.carrier
E = {}
for name, c in gc.items(): E[c] = E.get(c, 0.0) + float(g[name].sum())
avail = {}; curt = {}
for name, c in gc.items():
    if c in ('wind', 'pv'):
        av = float((n.generators_t.p_max_pu[name] * n.generators.p_nom[name]).sum()); avail[c] = avail.get(c, 0.0) + av; curt[c] = curt.get(c, 0.0) + av - float(g[name].sum())
curt_r = {}
for name, c in gc.items():
    if c in ('wind', 'pv'):
        r = n.generators.bus[name]; curt_r[r] = curt_r.get(r, 0.0) + float((n.generators_t.p_max_pu[name] * n.generators.p_nom[name]).sum()) - float(g[name].sum())
sto = n.storage_units_t.p; dis = {}; chg = {}
for name, c in n.storage_units.carrier.items():
    dis[c] = dis.get(c, 0.0) + float(sto[name].clip(lower=0).sum()); chg[c] = chg.get(c, 0.0) + float((-sto[name].clip(upper=0)).sum())
flows = []
lk = n.links_t.p0
for i, (a, b, cap_ab, km, lim, add) in enumerate(corr):
    if LOSSES: f = lk[f'c{i}_ab'].values - lk[f'c{i}_ba'].values
    else: f = lk[f'c{i}'].values
    flows.append({'a': a, 'b': b, 'capMW': cap_ab, 'todayMW': lim, 'tdpMW': add, 'km': km, 'GWh': float(np.abs(f).sum()) / 1e3, 'hoursAtLimit': int((np.abs(f) >= 0.98 * cap_ab).sum()) if cap_ab < 1e5 else 0, 'maxMW': float(np.abs(f).max())})
fuel = float(sum((g[name] * n.generators.marginal_cost[name]).sum() for name in n.generators.index if gc[name] in ('coal', 'ccgt', 'ocgt', 'diesel')))
res = {'dump': os.path.basename(DUMP), 'build': D['build'], 'year': Y, 'weatherYear': WY, 'seed': D['seed'], 'case': CASE, 'siting': SITING, 'losses': LOSSES, 'coalmin': COALMIN, 'status': f'{status}/{cond}', 'secs': secs,
       'objectiveRbn': float(n.objective) / 1e9, 'fuelAndCarbonRbn': fuel / 1e9,
       'E_TWh': {c: v / 1e6 for c, v in E.items()}, 'storageDischargeTWh': {c: v / 1e6 for c, v in dis.items()}, 'storageChargeTWh': {c: v / 1e6 for c, v in chg.items()},
       'availTWh': {c: v / 1e6 for c, v in avail.items()}, 'curtailedTWh': {c: v / 1e6 for c, v in curt.items()}, 'curtailedTotalTWh': sum(curt.values()) / 1e6, 'curtailedByRegionTWh': {r: v / 1e6 for r, v in curt_r.items()},
       'unservedGWh': E.get('unserved', 0.0) / 1e3, 'corridors': flows, 'siting_shares': site, 'notes': notes,
       'engine': {'E_TWh': {c: v / 1e6 for c, v in D['E'].items()}, 'shedGWh': D['shedMWh'] / 1e3, 'gridLoadTWh': float(gridLoad.sum()) / 1e6, 'grossLoadTWh': float(grossLoad.sum()) / 1e6, 'psDischargeTWh': D['E'].get('ps', 0) / 1e6, 'battDischargeTWh': D['E'].get('batt', 0) / 1e6}}
json.dump(res, open(OUT, 'w'), indent=1)
eng = res['engine']['E_TWh']
print(f"{CASE} {SITING} losses={LOSSES} coalmin={COALMIN} {Y} wy{WY}: {status}/{cond} in {secs:.0f}s, objective R{res['objectiveRbn']:.2f}bn, fuel+carbon R{res['fuelAndCarbonRbn']:.2f}bn")
print(f"{'TWh':12s} {'engine':>9s} {'pypsa':>9s}")
for c in ('coal', 'ccgt', 'ocgt', 'diesel', 'wind', 'pv', 'rooftop', 'csp', 'nuclear', 'hydro', 'hybrid', 'imports'):
    e = eng.get(c, 0) + (eng.get('ccgt', 0) * 0 if c != 'ccgt' else 0)
    print(f"{c:12s} {e:9.3f} {res['E_TWh'].get(c, 0):9.3f}")
print(f"{'ps dis':12s} {eng.get('ps', 0):9.3f} {res['storageDischargeTWh'].get('ps', 0):9.3f}")
print(f"{'batt dis':12s} {eng.get('batt', 0):9.3f} {res['storageDischargeTWh'].get('batt', 0):9.3f}")
print(f"{'curtailed':12s} {eng.get('curtailed', 0):9.3f} {res['curtailedTotalTWh']:9.3f}   (wind {res['curtailedTWh'].get('wind', 0):.3f}, pv {res['curtailedTWh'].get('pv', 0):.3f})")
print(f"{'unserved GWh':12s} {res['engine']['shedGWh']:9.3f} {res['unservedGWh']:9.3f}")
print('binding corridors:', sorted([(f['a'] + '-' + f['b'], f['hoursAtLimit'], round(f['GWh'])) for f in flows if f['hoursAtLimit'] > 0], key=lambda x: -x[1])[:8])
for x in notes: print(' note:', x)
