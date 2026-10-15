"""Single-bus PyPSA unit-commitment run on the engine's own week (sn_run.js output): same load, must-take nuclear, hydro and
imports, wind/solar/CSP/hybrid availability, coal availability per hour, UC_FLEET units (minimum stable levels including the
0.5 rows, minimum up/down times), the engine's uniform coal cost at full load (part-load factor 1), its two start-up charges,
fleet ramp limit, diesel, pumped storage and batteries with the engine's starting state of charge (and at least that at the
end), and the engine's unserved-energy cost. usage: python sn_pypsa.py week.json [lp|mip] out.json"""
import json, sys, time
import numpy as np, pandas as pd, pypsa
d = json.load(open(sys.argv[1])); mode = sys.argv[2]; out = sys.argv[3]
c, H, fx = d['consts'], d['hours'], d['fx']; S, N = d['START'], d['N']
hs = [str(h) for h in range(S, S + N)]
ser = lambda k: np.array([H[h][k] for h in hs], dtype=float)
load, wind, pv, csp, hyb = ser('load'), ser('windGen'), ser('pvGen'), ser('cspGen'), ser('hybAvail')
nuc, hyd, imp, cav = ser('nuc'), ser('hyd'), ser('imp'), ser('cAvail')
ramp = float(H[hs[0]]['rampAllowedMW'])
year = 2026
units = []
scale = c['coalInstalledMW'] / 41530.0                     # engine's UC pre-pass scale (index.html, ucPrepass)
for g in d['uc']:
    dy = 9999 if g['decom'] == 'beyond 2050' else int(g['decom'])
    if dy <= year: continue
    for k in range(int(g['n'])):
        units.append(dict(name=f"{g['name']}#{k+1}", cap=g['cap'] / g['n'] * scale, msl=g['msl'], up=int(g['min_up']), dn=int(g['min_dn']),
                          su=g['startup_cost'] / g['n']))
fleet = sum(u['cap'] for u in units)
pmax = np.minimum(1.0, cav / fleet)                        # the engine's available coal, spread evenly over committed units
coal_mc = c['costCoal'] + c['vomCoal'] + c['cC']           # uniform coal cost at full load (plF = 1)
eaf_factor = c['eaf'] / 100 * scale                        # availFactor in the UC pre-pass, applied to its unit start cost
n = pypsa.Network(); n.set_snapshots(pd.RangeIndex(N)); n.add('Bus', 'za', carrier='AC')
n.add('Load', 'load', bus='za', p_set=load)
for nm, prof, mc in [('nuclear', nuc, c['costNuclear'] + c['vomNuclear']), ('hydro', hyd, c['costHydro']), ('imports', imp, c['costImports'])]:
    pk = max(prof.max(), 1.0); n.add('Generator', nm, bus='za', p_nom=pk, p_max_pu=prof / pk, p_min_pu=prof / pk, marginal_cost=mc)
for nm, prof in [('wind', wind), ('pv', pv), ('csp', csp), ('hybrid', hyb)]:
    pk = max(prof.max(), 1.0); n.add('Generator', nm, bus='za', p_nom=pk, p_max_pu=prof / pk, marginal_cost=0.0)
# Starting commitment (INIT=engine): the engine's committed share of available coal in the hour before the week,
# taken offline from the end of the unit list (all coal costs the same in the engine, so the order is arbitrary).
import os
online = {u['name']: True for u in units}
if os.environ.get('INIT') == 'engine':
    s_prev = H[str(S - 1)]; target = s_prev['committedMW'] / s_prev['cAvail'] * fleet; tot = fleet
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
n.add('Generator', 'diesel', bus='za', p_nom=c['dieselAvail'], marginal_cost=c['costDiesel'] + c['vomDiesel'] + c['cD'])
n.add('Generator', 'shed', bus='za', p_nom=1e6, marginal_cost=c['costUnservedR'])
s0 = H[str(S - 1)]
n.add('StorageUnit', 'ps', bus='za', p_nom=c['psPowerTot'], max_hours=c['psEnergyTot'] / c['psPowerTot'], efficiency_store=c['psEffTot'],
      efficiency_dispatch=1.0, cyclic_state_of_charge=False, state_of_charge_initial=s0['psSoc'])
n.add('StorageUnit', 'batt', bus='za', p_nom=c['battPower'], max_hours=c['battEnergy'] / c['battPower'], efficiency_store=c['battEffMix'],
      efficiency_dispatch=1.0, cyclic_state_of_charge=False, state_of_charge_initial=s0['battSoc'])
coal_names = [u['name'] for u in units]
def extra(n, sns):
    m = n.model; p = m.variables['Generator-p'].sel(name=coal_names).sum('name')
    m.add_constraints(p.isel(snapshot=slice(1, None)) - p.shift(snapshot=1).isel(snapshot=slice(1, None)) <= ramp, name='coal_ramp_up')
    m.add_constraints(p.shift(snapshot=1).isel(snapshot=slice(1, None)) - p.isel(snapshot=slice(1, None)) <= ramp, name='coal_ramp_dn')
    soc = m.variables['StorageUnit-state_of_charge']
    e = H[str(S + N - 1)]
    m.add_constraints(soc.sel(name='ps').isel(snapshot=-1) >= e['psSoc'], name='ps_end')
    m.add_constraints(soc.sel(name='batt').isel(snapshot=-1) >= e['battSoc'], name='batt_end')
t0 = time.time()
st, cond = n.optimize(solver_name='highs', extra_functionality=extra, include_objective_constant=False,
                      solver_options=({'mip_rel_gap': 0.001, 'time_limit': 3000} if mode == 'mip' else {}))
gp = n.generators_t.p; coal = gp[coal_names].sum(axis=1)
cost = lambda g, mc: float(gp[g].sum() * mc)
su = float(n.objective) - sum(float((gp[g] * n.generators.at[g, 'marginal_cost']).sum()) for g in gp.columns)
res = dict(mode=mode, status=st, cond=cond, secs=time.time() - t0, objectiveRm=float(n.objective) / 1e6, startUpRm=su / 1e6,
           coalGWh=float(coal.sum()) / 1e3, coalRm=float(coal.sum()) * coal_mc / 1e6, dieselGWh=float(gp['diesel'].sum()) / 1e3,
           shedGWh=float(gp['shed'].sum()) / 1e3, nucRm=cost('nuclear', c['costNuclear'] + c['vomNuclear']) / 1e6,
           hydRm=cost('hydro', c['costHydro']) / 1e6, impRm=cost('imports', c['costImports']) / 1e6,
           curtGWh=float(sum((n.generators.at[g, 'p_nom'] * n.generators_t.p_max_pu[g] - gp[g]).sum() for g in ['wind', 'pv', 'csp', 'hybrid'])) / 1e3,
           psDisGWh=float(n.storage_units_t.p_dispatch['ps'].sum()) / 1e3, battDisGWh=float(n.storage_units_t.p_dispatch['batt'].sum()) / 1e3,
           coalMin=float(coal.min()), coalMax=float(coal.max()), units=len(units), fleetMW=fleet)
json.dump(res, open(out, 'w'), indent=1); print(json.dumps(res, indent=1))
