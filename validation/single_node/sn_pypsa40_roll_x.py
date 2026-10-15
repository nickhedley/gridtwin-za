"""24-hour rolling version of sn_pypsa40.py: the same single-bus unit-commitment model and inputs, but each day is optimised
seeing only that day and the next 24 hours (a 48-hour window, or what is left of the week); the first 24 hours are kept, then
the window moves on a day, carrying each coal unit's status and hours in it, each store's state of charge and the fleet ramp
from the last kept hour. Only the last window carries the end-of-week state-of-charge floors (at least the engine's). Costs are
summed over the kept hours only, with start-ups charged where a unit comes on in a kept hour.
Storage at each window's end: NEUTRAL=fe (default) holds iron-air at least at its level at the window's start (a 100-hour store
cannot be planned on 48 hours of sight; without this the windows drain it and the last window cannot refill it to the engine's
end-of-week level); NEUTRAL=all does the same for every store (a stricter bound); lithium and pumped storage are otherwise free.
usage: python sn_pypsa40_roll.py week.json out.json [lookahead_hours=24]

LIKE-FOR-LIKE ADDITIONS (message 116, 15 Oct 2026), each switchable by environment, all off by default; off, the model is the
one above exactly (the 14d cross-check is reproduced with all three off):
  X_RES=1  operating reserve by product as engine build 14r holds it (reserveRule 'astr'): each hour's instantaneous, regulating
           and ten-minute requirement from the week file; batteries (lithium and iron-air) and pumped storage cover a product
           up to their free power (unused output plus charging that could be dropped) and their stored energy over the
           product's sustain time (10 minutes; reserveRegHours; reserveTenHours); hydro headroom, the online headroom of
           running CCGT, open-cycle and diesel (output x (1 - m) / m, at most capacity less output; m reserveGasMinStableFrac)
           and coal headroom (committed available capacity less output, and within the ramp from the previous hour) cover any
           product. A shortfall is allowed at X_RESPEN R/MWh (default midway between diesel's running cost and the cost of
           unserved energy): dearer than restoring reserve with diesel or interruptible load, cheaper than cutting customers,
           as the engine orders it (it releases reserve before shedding). The engine itself does not price a shortfall.
  X_MR=1   Avon and Dedisa's must-run: the engine's delivered must-run each hour, fixed, at diesel's cost, taken out of the
           diesel capacity left for dispatch.
  X_IL=1   interruptible load as a resource (drInterruptMW at drInterruptCostR) in place of taking the engine's interruptible
           calls off the load; the engine side then counts its interruptible compensation too (see eng40_cost.py).
  The three need the 14r hook's fields (consts res*, hours resInst/resReg/resTen/mustRun); a week file without them fails."""
import json, sys, time, os
import numpy as np, pandas as pd, pypsa
d = json.load(open(sys.argv[1])); out = sys.argv[2]; LA = int(sys.argv[3]) if len(sys.argv) > 3 else 24
NEUTRAL = os.environ.get('NEUTRAL', 'fe'); NSTORES = ['ps', 'li', 'fe'] if NEUTRAL == 'all' else ['fe']
c, H, R, ov = d['consts'], d['hours'], d['res'], d['over']; S, N = d['START'], d['N']
hs = [str(h) for h in range(S, S + N)]
ser = lambda k: np.array([H[h][k] for h in hs], dtype=float)
X_RES, X_MR, X_IL = (os.environ.get(k, '0') == '1' for k in ('X_RES', 'X_MR', 'X_IL'))
load, csp, hyb = (ser('load') if X_IL else ser('load') - ser('dr')), ser('cspGen'), ser('hyb')
if X_MR: mustrun = ser('mustRun')
if X_RES: rq = dict(inst=ser('resInst'), reg=ser('resReg'), ten=ser('resTen'))
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
RES_PEN = float(os.environ.get('X_RESPEN', (dsl_mc + c['costUnservedR']) / 2))
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
    if X_MR:
        mr = mustrun[sl]; n.add('Generator', 'mustrun', bus='za', p_nom=max(mr.max(), 1.0), p_max_pu=mr / max(mr.max(), 1.0), p_min_pu=mr / max(mr.max(), 1.0), marginal_cost=dsl_mc)
        n.add('Generator', 'diesel', bus='za', p_nom=c['dieselAvail'], p_max_pu=np.maximum(0.0, c['dieselAvail'] - mr) / c['dieselAvail'], marginal_cost=dsl_mc)
    else:
        n.add('Generator', 'diesel', bus='za', p_nom=c['dieselAvail'], marginal_cost=dsl_mc)
    if X_IL: n.add('Generator', 'interruptible', bus='za', p_nom=c['drInterruptMW'], marginal_cost=c['drInterruptCostR'])
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
        if X_RES: add_reserve(n, m, sl, prev)
    def add_reserve(n, m, sl, prev):
        # Engine 14r's ASTR cover as constraints (see the docstring). Products k with sustain hours HK; stores s.
        import xarray as xr
        snap = n.snapshots; HK = dict(inst=1 / 6, reg=c['reserveRegHours'], ten=c['reserveTenHours'])
        req = {k: xr.DataArray(rq[k][sl], coords={'snapshot': snap}) for k in HK}
        G = m.variables['Generator-p']; ST = m.variables['Generator-status'] if 'Generator-status' in m.variables else None
        disp, store, socv = m.variables['StorageUnit-p_dispatch'], m.variables['StorageUnit-p_store'], m.variables['StorageUnit-state_of_charge']
        stores = [s for s in ('li', 'fe', 'ps') if n.storage_units.at[s, 'p_nom'] > 1.0]
        r = {(s, k): m.add_variables(lower=0, coords=[snap], name=f'res_{s}_{k}') for s in stores for k in HK}
        for s in stores:
            pn = n.storage_units.at[s, 'p_nom']
            m.add_constraints(sum(r[s, k] for k in HK) + disp.sel(name=s) - store.sel(name=s) <= pn, name=f'res_pow_{s}')
            # stored energy at the start of the hour (the engine uses the store's level as it enters the hour)
            soc_prev = socv.sel(name=s).shift(snapshot=1)
            e0 = soc_init[s]
            m.add_constraints(sum(r[s, k] * HK[k] for k in HK).isel(snapshot=slice(1, None)) - soc_prev.isel(snapshot=slice(1, None)) <= 0, name=f'res_en_{s}')
            m.add_constraints(sum(r[s, k] * HK[k] for k in HK).isel(snapshot=0) <= e0, name=f'res_en0_{s}')
        for k in HK: m.add_constraints(sum(r[s, k] for s in stores) <= req[k], name=f'res_cap_{k}')
        # pooled providers: hydro headroom (a constant), online headroom of running gas and diesel, coal headroom, shortfall
        mm = c['reserveGasMinStableFrac']
        pool = []
        for g in ['gas', 'ocgt_lng', 'diesel']:
            if n.generators.at[g, 'p_nom'] <= 1.0: continue
            rg = m.add_variables(lower=0, coords=[snap], name=f'res_on_{g}'); pg = G.sel(name=g)
            cap = n.generators.at[g, 'p_nom'] * (n.generators_t.p_max_pu[g] if g in n.generators_t.p_max_pu else 1.0)
            m.add_constraints(rg - pg * ((1 - mm) / mm) <= 0, name=f'res_on1_{g}'); m.add_constraints(rg + pg <= cap, name=f'res_on2_{g}'); pool.append(rg)
        rc = m.add_variables(lower=0, coords=[snap], name='res_coal')
        cap_on = sum(ST.sel(name=u['name']) * (u['cap'] * xr.DataArray(pmax_all[sl], coords={'snapshot': snap})) for u in units)
        pc = G.sel(name=coal_names).sum('name')
        m.add_constraints(rc + pc - cap_on <= 0, name='res_coal_on')
        m.add_constraints((rc + pc - pc.shift(snapshot=1)).isel(snapshot=slice(1, None)) <= ramp, name='res_coal_ramp')
        if prev is not None: m.add_constraints((rc + pc).isel(snapshot=0) <= prev + ramp, name='res_coal_ramp0')
        short = m.add_variables(lower=0, coords=[snap], name='res_short')
        need = sum(req[k] for k in HK) - c['resHydroHeadroomMW']
        m.add_constraints(sum(r[s, k] for s in stores for k in HK) + sum(pool) + rc + short >= need, name='res_cover')
        m.objective = m.objective + RES_PEN * short.sum()
        resvars.update(short=short)
    resvars = {}; soc_init = dict(soc)
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
    if X_RES:
        sh = n.model.solution['res_short'].values[:keep]; en['resShortGWh'] = en.get('resShortGWh', 0.0) + float(sh.sum()) / 1e3
        acc['res_pen'] = acc.get('res_pen', 0.0) + float(sh.sum()) * RES_PEN
    if X_MR: acc['mustrun'] = acc.get('mustrun', 0.0) + float(gp['mustrun'].sum()) * dsl_mc; en['mustrunGWh'] = en.get('mustrunGWh', 0.0) + float(gp['mustrun'].sum()) / 1e3
    if X_IL: acc['interruptible'] = acc.get('interruptible', 0.0) + float(gp['interruptible'].sum()) * c['drInterruptCostR']; en['interruptibleGWh'] = en.get('interruptibleGWh', 0.0) + float(gp['interruptible'].sum()) / 1e3
    wins.append(dict(t0=t0, t1=t1, cond=cond, shedGWh=float(gp['shed'].sum()) / 1e3, liSocEnd=soc['li']))
    print('window', t0, t1, cond, 'shed GWh %.2f' % (float(gp['shed'].sum()) / 1e3), 'li soc %.0f' % soc['li'], flush=True)
resPenRm = acc.pop('res_pen', 0.0) / 1e6          # reported apart: the engine does not price a shortfall
tot = sum(acc.values())
res = dict(mode='roll', lookahead=LA, neutral=NEUTRAL, switches=dict(res=X_RES, mr=X_MR, il=X_IL, resPen=RES_PEN if X_RES else None), resPenaltyRm=resPenRm, objectiveRm=tot / 1e6, secs=time.time() - t0c, windows=wins, starts=starts,
           coalRm=acc['coal'] / 1e6, gasRm=acc['gas'] / 1e6, ocgtLngRm=acc['ocgt'] / 1e6, dieselRm=acc['diesel'] / 1e6, shedRm=acc['shed'] / 1e6,
           nucRm=acc['nuc'] / 1e6, hydRm=acc['hyd'] / 1e6, impRm=acc['imp'] / 1e6, startUnitRm=acc['su_unit'] / 1e6, startPerMWRm=acc['su_mw'] / 1e6,
           startUpRm=(acc['su_unit'] + acc['su_mw']) / 1e6, liCycles=en['liDisGWh'] * 1e3 / li_mwh, **en,
           socEnd=soc, socEndFloor=dict(ps=e1['psSoc'], li=socLi[-1], fe=socFe[-1]))
json.dump(res, open(out, 'w'), indent=1); print(json.dumps({k: v for k, v in res.items() if k != 'windows'}, indent=1))
