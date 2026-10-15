"""24-hour rolling version of sn_pypsa40.py: the same single-bus unit-commitment model and inputs, but each day is optimised
seeing only that day and the next 24 hours (a 48-hour window, or what is left of the week); the first 24 hours are kept, then
the window moves on a day, carrying each coal unit's status and hours in it, each store's state of charge and the fleet ramp
from the last kept hour. Only the last window carries the end-of-week state-of-charge floors (at least the engine's). Costs are
summed over the kept hours only, with start-ups charged where a unit comes on in a kept hour.
Storage at each window's end: NEUTRAL=fe (default) holds iron-air at least at its level at the window's start (a 100-hour store
cannot be planned on 48 hours of sight; without this the windows drain it and the last window cannot refill it to the engine's
end-of-week level); NEUTRAL=all does the same for every store (a stricter bound); lithium and pumped storage are otherwise free.
usage: python sn_pypsa40_roll.py week.json out.json [lookahead_hours=24]"""
import json, sys, time, os
import numpy as np, pandas as pd, pypsa
d = json.load(open(sys.argv[1])); out = sys.argv[2]; LA = int(sys.argv[3]) if len(sys.argv) > 3 else 24
NEUTRAL = os.environ.get('NEUTRAL', 'fe'); NSTORES = ['ps', 'li', 'fe'] if NEUTRAL == 'all' else ['fe']
c, H, R, ov = d['consts'], d['hours'], d['res'], d['over']; S, N = d['START'], d['N']
hs = [str(h) for h in range(S, S + N)]
ser = lambda k: np.array([H[h][k] for h in hs], dtype=float)
load, csp, hyb = ser('load') - ser('dr'), ser('cspGen'), ser('hyb')
vre = ser('windGen') + ser('pvGen') + ser('curtail')
nuc, hyd, imp, cav = ser('nuc'), ser('hyd'), ser('imp'), ser('cAvail')
ramp = float(H[hs[0]]['rampAllowedMW'])
# Engine version, from the week file. Start-ups: builds before 2026-10-13f charged a per-MW start-up on top of the pre-pass's unit
# starts; from 13f (14dl) only the unit starts. Coal units: before 13g every year kept all 85 UC_FLEET units scaled by coal
# standing / 41,530; from 13g (14dn) the pre-pass keeps the units still standing and the hook exports them (consts ucUnits).
_su = H[str(S + N - 1)]['startUpCostR'] - H[str(S - 1)]['startUpCostR']; _uc = sum(H[h]['ucStart'] for h in hs)
if abs(_su - _uc) >= 1.0: PERMW = c['coalStartUpCostRPerMW']
elif _uc > 0: PERMW = 0.0
else: PERMW = float(os.environ['SU_PERMW'])          # no starts in the week: say which engine (R/MW, or 0)
if c.get('ucUnits'):
    scale = c['ucScale']
    units = [dict(name=u['name'], cap=u['cap'], msl=u['msl'], up=int(u['min_up']), dn=int(u['min_dn']), su=u['startup_cost']) for u in c['ucUnits']]
else:
    scale = (c['coalInstalledMW'] - ov['coalDecomMW']) / 41530.0          # buildUCSchedule before 13g: coalInstalled / 41530, all units
    units = []
    for g in d['uc']:
        for k in range(int(g['n'])):
            units.append(dict(name=f"{g['name']}#{k+1}", cap=g['cap'] / g['n'] * scale, msl=g['msl'], up=int(g['min_up']), dn=int(g['min_dn']),
                              su=g['startup_cost'] / g['n']))
print('engine: per-MW start-up', PERMW, '| coal units', len(units), 'scale %.4f' % scale, flush=True)
fleet = sum(u['cap'] for u in units); pmax_all = np.minimum(1.0, cav / fleet)
coal_mc = c['costCoal'] + c['vomCoal'] + c['cC']; eaf_factor = c['eaf'] / 100 * scale
gas_mc = c['costCcgt'] + c['vomCcgt'] + c['cG']
OCK = 10624 / 3600 * 0.52; VOM_OC = 80.19 * 1.032 * 1.035          # index.html FIXED heatRateOcgtKJ, effCcgtHHV, vomOcgt
oc_mc = (c['costCcgt'] + c['cG']) * OCK + VOM_OC
dsl_mc = c['costDiesel'] + c['vomDiesel'] + c['cD']
T = R['tiers']; fe_mw, fe_mwh, fe_eff = T['fe']['mw'], T['fe']['mwh'], T['fe']['eff']
li_mw = c['battPower'] - fe_mw - T['vrfb']['mw']; li_mwh = c['battEnergy'] - fe_mwh; li_eff = T['li']['eff']
socLi, socFe = R['socLi'], R['socFe'] or [0.0] * (N + 1)
s0 = H[str(S - 1)]; e1 = H[str(S + N - 1)]
# starting commitment as in sn_pypsa40.py INIT=engine
target = s0['committedMW'] / s0['cAvail'] * fleet if s0['cAvail'] > 0 else 0; tot = fleet
state = {u['name']: dict(on=True, hrs=u['up']) for u in units}
for u in reversed(units):
    if tot - u['cap'] < target: break
    state[u['name']] = dict(on=False, hrs=u['dn']); tot -= u['cap']
soc = dict(ps=s0['psSoc'], li=socLi[0], fe=socFe[0]); prev_coal = None
coal_names = [u['name'] for u in units]
acc = dict(coal=0.0, gas=0.0, ocgt=0.0, diesel=0.0, shed=0.0, nuc=0.0, hyd=0.0, imp=0.0, su_unit=0.0, su_mw=0.0)
en = dict(coalGWh=0.0, gasGWh=0.0, ocgtLngGWh=0.0, dieselGWh=0.0, shedGWh=0.0, curtGWh=0.0, liDisGWh=0.0, psDisGWh=0.0, feDisGWh=0.0)
starts = 0; t0c = time.time(); wins = []
for t0 in range(0, N, 24):
    t1 = min(N, t0 + 24 + LA); keep = min(24, N - t0); W = t1 - t0; last = (t1 == N)
    sl = slice(t0, t1)
    n = pypsa.Network(); n.set_snapshots(pd.RangeIndex(W)); n.add('Bus', 'za', carrier='AC')
    n.add('Load', 'load', bus='za', p_set=load[sl])
    for nm, prof, mc in [('nuclear', nuc[sl], c['costNuclear'] + c['vomNuclear']), ('hydro', hyd[sl], c['costHydro']), ('imports', imp[sl], c['costImports'])]:
        pk = max(prof.max(), 1.0); n.add('Generator', nm, bus='za', p_nom=pk, p_max_pu=prof / pk, p_min_pu=prof / pk, marginal_cost=mc)
    for nm, prof in [('vre', vre[sl]), ('csp', csp[sl])]:
        pk = max(prof.max(), 1.0); n.add('Generator', nm, bus='za', p_nom=pk, p_max_pu=prof / pk, marginal_cost=0.0)
    pk = max(hyb[sl].max(), 1.0); n.add('Generator', 'hybrid', bus='za', p_nom=pk, p_max_pu=hyb[sl] / pk, p_min_pu=hyb[sl] / pk, marginal_cost=0.0)
    pmax = pmax_all[sl]
    for u in units:
        st = state[u['name']]
        n.add('Generator', u['name'], bus='za', p_nom=u['cap'], p_max_pu=pmax, marginal_cost=coal_mc, carrier='coal', committable=True,
              p_min_pu=np.minimum(u['msl'] * pmax, pmax), min_up_time=u['up'], min_down_time=u['dn'],
              start_up_cost=u['su'] * eaf_factor + PERMW * u['cap'],
              up_time_before=(min(st['hrs'], u['up']) if st['on'] else 0), down_time_before=(0 if st['on'] else min(st['hrs'], u['dn'])))
    n.add('Generator', 'gas', bus='za', p_nom=max(c['ccgtCap'] - c['ocgtLngMW'], 1.0), marginal_cost=gas_mc)
    n.add('Generator', 'ocgt_lng', bus='za', p_nom=max(c['ocgtLngMW'], 1.0), marginal_cost=oc_mc)
    n.add('Generator', 'diesel', bus='za', p_nom=c['dieselAvail'], marginal_cost=dsl_mc)
    n.add('Generator', 'shed', bus='za', p_nom=1e6, marginal_cost=c['costUnservedR'])
    n.add('StorageUnit', 'ps', bus='za', p_nom=c['psPowerTot'], max_hours=c['psEnergyTot'] / c['psPowerTot'], efficiency_store=c['psEffTot'],
          efficiency_dispatch=1.0, cyclic_state_of_charge=False, state_of_charge_initial=soc['ps'])
    n.add('StorageUnit', 'li', bus='za', p_nom=li_mw, max_hours=li_mwh / li_mw, efficiency_store=li_eff, efficiency_dispatch=1.0,
          cyclic_state_of_charge=False, state_of_charge_initial=soc['li'])
    n.add('StorageUnit', 'fe', bus='za', p_nom=max(fe_mw, 1.0), max_hours=fe_mwh / max(fe_mw, 1.0), efficiency_store=fe_eff, efficiency_dispatch=1.0,
          cyclic_state_of_charge=False, state_of_charge_initial=soc['fe'])
    def extra(n, sns, prev=prev_coal, last=last, soc0=dict(soc)):
        m = n.model; p = m.variables['Generator-p'].sel(name=coal_names).sum('name')
        m.add_constraints(p.isel(snapshot=slice(1, None)) - p.shift(snapshot=1).isel(snapshot=slice(1, None)) <= ramp, name='coal_ramp_up')
        m.add_constraints(p.shift(snapshot=1).isel(snapshot=slice(1, None)) - p.isel(snapshot=slice(1, None)) <= ramp, name='coal_ramp_dn')
        if prev is not None:
            m.add_constraints(p.isel(snapshot=0) <= prev + ramp, name='ramp_link_up'); m.add_constraints(p.isel(snapshot=0) >= prev - ramp, name='ramp_link_dn')
        sc = m.variables['StorageUnit-state_of_charge']
        if not last:
            for k in NSTORES: m.add_constraints(sc.sel(name=k).isel(snapshot=-1) >= soc0[k], name=k + '_neutral')
        if last:
            m.add_constraints(sc.sel(name='ps').isel(snapshot=-1) >= e1['psSoc'], name='ps_end')
            m.add_constraints(sc.sel(name='li').isel(snapshot=-1) >= socLi[-1], name='li_end')
            m.add_constraints(sc.sel(name='fe').isel(snapshot=-1) >= socFe[-1], name='fe_end')
    stt, cond = n.optimize(solver_name='highs', extra_functionality=extra, include_objective_constant=False,
                           solver_options={'mip_rel_gap': 0.001, 'time_limit': 600})
    gp = n.generators_t.p.iloc[:keep]; status = n.generators_t.status[coal_names].iloc[:keep]
    coal = gp[coal_names].sum(axis=1)
    acc['coal'] += float(coal.sum()) * coal_mc; acc['gas'] += float(gp['gas'].sum()) * gas_mc; acc['ocgt'] += float(gp['ocgt_lng'].sum()) * oc_mc
    acc['diesel'] += float(gp['diesel'].sum()) * dsl_mc; acc['shed'] += float(gp['shed'].sum()) * c['costUnservedR']
    acc['nuc'] += float(gp['nuclear'].sum()) * (c['costNuclear'] + c['vomNuclear']); acc['hyd'] += float(gp['hydro'].sum()) * c['costHydro']
    acc['imp'] += float(gp['imports'].sum()) * c['costImports']
    en['coalGWh'] += float(coal.sum()) / 1e3; en['gasGWh'] += float(gp['gas'].sum() + gp['ocgt_lng'].sum()) / 1e3
    en['ocgtLngGWh'] += float(gp['ocgt_lng'].sum()) / 1e3; en['dieselGWh'] += float(gp['diesel'].sum()) / 1e3; en['shedGWh'] += float(gp['shed'].sum()) / 1e3
    en['curtGWh'] += float(sum((n.generators.at[g, 'p_nom'] * n.generators_t.p_max_pu[g].iloc[:keep] - gp[g]).sum() for g in ['vre', 'csp', 'hybrid'])) / 1e3
    sud = n.storage_units_t.p_dispatch.iloc[:keep]
    en['liDisGWh'] += float(sud['li'].sum()) / 1e3; en['psDisGWh'] += float(sud['ps'].sum()) / 1e3; en['feDisGWh'] += float(sud['fe'].sum()) / 1e3
    for u in units:
        st = state[u['name']]; on_prev = st['on']; hrs = st['hrs']
        for i in range(keep):
            on = status[u['name']].iloc[i] > 0.5
            if on and not on_prev:
                starts += 1; acc['su_unit'] += u['su'] * eaf_factor; acc['su_mw'] += PERMW * u['cap']
            hrs = hrs + 1 if on == on_prev else 1; on_prev = on
        state[u['name']] = dict(on=on_prev, hrs=hrs)
    socs = n.storage_units_t.state_of_charge.iloc[keep - 1]
    soc = dict(ps=float(socs['ps']), li=float(socs['li']), fe=float(socs['fe'])); prev_coal = float(coal.iloc[-1])
    wins.append(dict(t0=t0, t1=t1, cond=cond, shedGWh=float(gp['shed'].sum()) / 1e3, liSocEnd=soc['li']))
    print('window', t0, t1, cond, 'shed GWh %.2f' % (float(gp['shed'].sum()) / 1e3), 'li soc %.0f' % soc['li'], flush=True)
tot = sum(acc.values())
res = dict(mode='roll', lookahead=LA, neutral=NEUTRAL, objectiveRm=tot / 1e6, secs=time.time() - t0c, windows=wins, starts=starts,
           coalRm=acc['coal'] / 1e6, gasRm=acc['gas'] / 1e6, ocgtLngRm=acc['ocgt'] / 1e6, dieselRm=acc['diesel'] / 1e6, shedRm=acc['shed'] / 1e6,
           nucRm=acc['nuc'] / 1e6, hydRm=acc['hyd'] / 1e6, impRm=acc['imp'] / 1e6, startUnitRm=acc['su_unit'] / 1e6, startPerMWRm=acc['su_mw'] / 1e6,
           startUpRm=(acc['su_unit'] + acc['su_mw']) / 1e6, liCycles=en['liDisGWh'] * 1e3 / li_mwh, **en,
           socEnd=soc, socEndFloor=dict(ps=e1['psSoc'], li=socLi[-1], fe=socFe[-1]))
json.dump(res, open(out, 'w'), indent=1); print(json.dumps({k: v for k, v in res.items() if k != 'windows'}, indent=1))
