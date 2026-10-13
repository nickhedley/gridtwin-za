"""Single-bus PyPSA unit-commitment run on the engine's own 2040 week (sn_run40.js output), the baseline week's rules: same
load, must-take nuclear, hydro and imports, wind/solar/CSP/hybrid availability, coal available per hour, the engine's UC
pre-pass fleet (all 85 UC_FLEET units scaled by coal standing / 41,530, as buildUCSchedule does in every year), minimum
stable levels and minimum up/down times, uniform coal cost at full load, its two start-up charges, fleet ramp limit, the
engine's starting commitment (INIT=engine), gas (CCGT plus OCGT on LNG, one price), diesel (existing plus new open-cycle),
pumped storage, lithium and iron-air with the engine's starting state of charge each and at least that at the end, and the
engine's unserved-energy cost. usage: python sn_pypsa40.py week.json [lp|mip] out.json"""
import json, sys, time, os
import numpy as np, pandas as pd, pypsa
d = json.load(open(sys.argv[1])); mode = sys.argv[2]; out = sys.argv[3]
c, H, R, ov = d['consts'], d['hours'], d['res'], d['over']; S, N = d['START'], d['N']
hs = [str(h) for h in range(S, S + N)]
ser = lambda k: np.array([H[h][k] for h in hs], dtype=float)
load, csp, hyb = ser('load') - ser('dr'), ser('cspGen'), ser('hyb')   # hybrid fixed at the engine's output (its unused availability is energy-limited)
vre = ser('windGen') + ser('pvGen') + ser('curtail')    # the hook's wind and solar are after curtailment
nuc, hyd, imp, cav = ser('nuc'), ser('hyd'), ser('imp'), ser('cAvail')
ramp = float(H[hs[0]]['rampAllowedMW'])
coal_std = c['coalInstalledMW'] - ov['coalDecomMW']
scale = coal_std / 41530.0                                  # buildUCSchedule: coalInstalled / 41530, all units
units = []
for g in d['uc']:
    for k in range(int(g['n'])):
        units.append(dict(name=f"{g['name']}#{k+1}", cap=g['cap'] / g['n'] * scale, msl=g['msl'], up=int(g['min_up']), dn=int(g['min_dn']),
                          su=g['startup_cost'] / g['n']))
fleet = sum(u['cap'] for u in units)
pmax = np.minimum(1.0, cav / fleet)
coal_mc = c['costCoal'] + c['vomCoal'] + c['cC']
eaf_factor = c['eaf'] / 100 * scale                         # availFactor in the UC pre-pass, applied to its unit start cost
gas_mc = c['costCcgt'] + c['vomCcgt'] + c['cG']
n = pypsa.Network(); n.set_snapshots(pd.RangeIndex(N)); n.add('Bus', 'za', carrier='AC')
n.add('Load', 'load', bus='za', p_set=load)
for nm, prof, mc in [('nuclear', nuc, c['costNuclear'] + c['vomNuclear']), ('hydro', hyd, c['costHydro']), ('imports', imp, c['costImports'])]:
    pk = max(prof.max(), 1.0); n.add('Generator', nm, bus='za', p_nom=pk, p_max_pu=prof / pk, p_min_pu=prof / pk, marginal_cost=mc)
for nm, prof in [('vre', vre), ('csp', csp)]:
    pk = max(prof.max(), 1.0); n.add('Generator', nm, bus='za', p_nom=pk, p_max_pu=prof / pk, marginal_cost=0.0)
pk = max(hyb.max(), 1.0); n.add('Generator', 'hybrid', bus='za', p_nom=pk, p_max_pu=hyb / pk, p_min_pu=hyb / pk, marginal_cost=0.0)
online = {u['name']: True for u in units}
if os.environ.get('INIT') == 'engine':
    s_prev = H[str(S - 1)]; target = s_prev['committedMW'] / s_prev['cAvail'] * fleet if s_prev['cAvail'] > 0 else 0; tot = fleet
    for u in reversed(units):
        if tot - u['cap'] < target: break
        online[u['name']] = False; tot -= u['cap']
    print('INIT engine: online MW', round(tot), 'target', round(target))
for u in units:
    kw = dict(bus='za', p_nom=u['cap'], p_max_pu=pmax, marginal_cost=coal_mc, carrier='coal')
    if mode == 'mip':
        kw.update(committable=True, p_min_pu=np.minimum(u['msl'] * pmax, pmax), min_up_time=u['up'], min_down_time=u['dn'],
                  start_up_cost=u['su'] * eaf_factor + c['coalStartUpCostRPerMW'] * u['cap'],
                  up_time_before=(u['up'] if online[u['name']] else 0), down_time_before=(0 if online[u['name']] else u['dn']))
    n.add('Generator', u['name'], **kw)
OCK = 10624 / 3600 * 0.52; VOM_OC = 80.19 * 1.032 * 1.035          # index.html FIXED heatRateOcgtKJ, effCcgtHHV, vomOcgt (c4f l.6489)
oc_mc = (c['costCcgt'] + c['cG']) * OCK + VOM_OC
n.add('Generator', 'gas', bus='za', p_nom=max(c['ccgtCap'] - c['ocgtLngMW'], 1.0), marginal_cost=gas_mc)
n.add('Generator', 'ocgt_lng', bus='za', p_nom=max(c['ocgtLngMW'], 1.0), marginal_cost=oc_mc)
n.add('Generator', 'diesel', bus='za', p_nom=c['dieselAvail'], marginal_cost=c['costDiesel'] + c['vomDiesel'] + c['cD'])
n.add('Generator', 'shed', bus='za', p_nom=1e6, marginal_cost=c['costUnservedR'])
s0 = H[str(S - 1)]; e1 = H[str(S + N - 1)]
T = R['tiers']; fe_mw, fe_mwh, fe_eff = T['fe']['mw'], T['fe']['mwh'], T['fe']['eff']
li_mw = c['battPower'] - fe_mw - T['vrfb']['mw']; li_mwh = c['battEnergy'] - fe_mwh; li_eff = T['li']['eff']
assert T['vrfb']['mw'] == 0, 'vanadium not modelled'
socLi, socFe = R['socLi'], R['socFe'] or [0.0] * (N + 1)
n.add('StorageUnit', 'ps', bus='za', p_nom=c['psPowerTot'], max_hours=c['psEnergyTot'] / c['psPowerTot'], efficiency_store=c['psEffTot'],
      efficiency_dispatch=1.0, cyclic_state_of_charge=False, state_of_charge_initial=s0['psSoc'])
n.add('StorageUnit', 'li', bus='za', p_nom=li_mw, max_hours=li_mwh / li_mw, efficiency_store=li_eff, efficiency_dispatch=1.0,
      cyclic_state_of_charge=False, state_of_charge_initial=socLi[0])
if fe_mw > 0:
    n.add('StorageUnit', 'fe', bus='za', p_nom=fe_mw, max_hours=fe_mwh / fe_mw, efficiency_store=fe_eff, efficiency_dispatch=1.0,
          cyclic_state_of_charge=False, state_of_charge_initial=socFe[0])
coal_names = [u['name'] for u in units]
def extra(n, sns):
    m = n.model; p = m.variables['Generator-p'].sel(name=coal_names).sum('name')
    m.add_constraints(p.isel(snapshot=slice(1, None)) - p.shift(snapshot=1).isel(snapshot=slice(1, None)) <= ramp, name='coal_ramp_up')
    m.add_constraints(p.shift(snapshot=1).isel(snapshot=slice(1, None)) - p.isel(snapshot=slice(1, None)) <= ramp, name='coal_ramp_dn')
    soc = m.variables['StorageUnit-state_of_charge']
    m.add_constraints(soc.sel(name='ps').isel(snapshot=-1) >= e1['psSoc'], name='ps_end')
    m.add_constraints(soc.sel(name='li').isel(snapshot=-1) >= socLi[-1], name='li_end')
    if fe_mw > 0: m.add_constraints(soc.sel(name='fe').isel(snapshot=-1) >= socFe[-1], name='fe_end')
t0 = time.time()
st, cond = n.optimize(solver_name='highs', extra_functionality=extra, include_objective_constant=False,
                      solver_options=({'mip_rel_gap': 0.001, 'time_limit': 1800} if mode == 'mip' else {}))
gp = n.generators_t.p; coal = gp[coal_names].sum(axis=1)
cost = lambda g, mc: float(gp[g].sum() * mc)
su = float(n.objective) - sum(float((gp[g] * n.generators.at[g, 'marginal_cost']).sum()) for g in gp.columns)
# start-ups split into the engine's two charges: per-unit start cost x availFactor, and R/MW of capacity started
su_unit = su_mw = 0.0; starts = 0
if mode == 'mip':
    stt = n.generators_t.status[coal_names]
    prev = pd.Series({u['name']: (1.0 if online[u['name']] else 0.0) for u in units})
    for i in range(N):
        cur = stt.iloc[i]; up = ((cur > 0.5) & (prev < 0.5)); prev = cur
        for nm in up[up].index:
            u = next(x for x in units if x['name'] == nm); starts += 1
            su_unit += u['su'] * eaf_factor; su_mw += c['coalStartUpCostRPerMW'] * u['cap']
sud = n.storage_units_t.p_dispatch; suc = n.storage_units_t.p_store
res = dict(mode=mode, status=st, cond=cond, secs=time.time() - t0, objectiveRm=float(n.objective) / 1e6, startUpRm=su / 1e6,
           startUnitRm=su_unit / 1e6, startPerMWRm=su_mw / 1e6, starts=starts,
           coalGWh=float(coal.sum()) / 1e3, coalRm=float(coal.sum()) * coal_mc / 1e6, gasGWh=float(gp['gas'].sum()) / 1e3, gasRm=cost('gas', gas_mc) / 1e6, ocgtLngGWh=float(gp['ocgt_lng'].sum()) / 1e3, ocgtLngRm=cost('ocgt_lng', oc_mc) / 1e6,
           dieselGWh=float(gp['diesel'].sum()) / 1e3, dieselRm=cost('diesel', c['costDiesel'] + c['vomDiesel'] + c['cD']) / 1e6,
           shedGWh=float(gp['shed'].sum()) / 1e3, shedRm=cost('shed', c['costUnservedR']) / 1e6,
           nucRm=cost('nuclear', c['costNuclear'] + c['vomNuclear']) / 1e6, hydRm=cost('hydro', c['costHydro']) / 1e6, impRm=cost('imports', c['costImports']) / 1e6,
           curtGWh=float(sum((n.generators.at[g, 'p_nom'] * n.generators_t.p_max_pu[g] - gp[g]).sum() for g in ['vre', 'csp', 'hybrid'])) / 1e3,
           psDisGWh=float(sud['ps'].sum()) / 1e3, liDisGWh=float(sud['li'].sum()) / 1e3, liChgGWh=float(suc['li'].sum()) / 1e3,
           feDisGWh=float(sud['fe'].sum()) / 1e3 if fe_mw > 0 else 0.0, liCycles=float(sud['li'].sum()) / li_mwh,
           li=dict(mw=li_mw, mwh=li_mwh, eff=li_eff, soc0=socLi[0], socEnd=socLi[-1]), fe=dict(mw=fe_mw, mwh=fe_mwh, eff=fe_eff),
           coalMin=float(coal.min()), coalMax=float(coal.max()), units=len(units), fleetMW=fleet)
json.dump(res, open(out, 'w'), indent=1); print(json.dumps(res, indent=1))
