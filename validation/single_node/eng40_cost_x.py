"""Engine week cost from the hook, decomposed (14r fields added, message 116); checks the parts against the engine's own cumulative fuel, carbon and start-up
totals. usage: python eng40_cost.py week.json"""
import json, sys
d = json.load(open(sys.argv[1])); H, c, R = d['hours'], d['consts'], d['res']; S, N = d['START'], d['N']
hs = [str(h) for h in range(S, S + N)]; a, b = H[str(S - 1)], H[str(S + N - 1)]
s = lambda k: sum(H[h][k] for h in hs)
coal_mc = c['costCoal'] + c['vomCoal'] + c['cC']; gas_mc = c['costCcgt'] + c['vomCcgt'] + c['cG']; dsl_mc = c['costDiesel'] + c['vomDiesel'] + c['cD']
coal_flat = s('coalGen') * coal_mc
coal_pl = sum(H[h]['coalGen'] * ((c['costCoal'] + c['cC']) * H[h]['plF'] + c['vomCoal']) for h in hs)
uc = s('ucStart'); su_all = b['startUpCostR'] - a['startUpCostR']
# Engine builds before 2026-10-13f put the pre-pass unit starts (ucStart) in fuelCost and charged a separate per-MW start-up
# in startUpCostR; from 13f (14dl) startUpCostR holds the pre-pass starts and nothing else. Detect which, from the totals.
FIXED_SU = abs(su_all - uc) < 1.0
permw = 0.0 if FIXED_SU else su_all
OCK = 10624 / 3600 * 0.52; VOM_OC = 80.19 * 1.032 * 1.035          # index.html FIXED heatRateOcgtKJ, effCcgtHHV, vomOcgt (c4f l.6489)
cc_cap = c['ccgtCap'] - c['ocgtLngMW']
oc = [min(c['ocgtLngMW'], max(0, H[h]['ccgt'] - cc_cap)) for h in hs]
gas = s('ccgt') * gas_mc + sum(oc) * ((c['costCcgt'] + c['cG']) * (OCK - 1) + VOM_OC - c['vomCcgt']); dsl = s('diesel') * dsl_mc
nuc = s('nuc') * (c['costNuclear'] + c['vomNuclear']); hyd = s('hyd') * c['costHydro']; imp = s('imp') * c['costImports']
shed = s('unservedH') * c['costUnservedR']
fc = (b['fuelCost'] - a['fuelCost']) + (b['carbonCost'] - a['carbonCost'])
if FIXED_SU: fc += uc          # put the unit starts back beside fuel so the parts below add up as before
parts = coal_pl + uc + gas + dsl + nuc + hyd + imp
li = R['tiers']['li']; disLi = sum(R['disLi'][1:]); disFe = sum(R['disFe'][1:]) if R['disFe'] else 0
out = dict(week=sys.argv[1].split('/')[-1], engineRm=(fc + permw + shed) / 1e6, engineFlatRm=(fc - coal_pl + coal_flat + permw + shed) / 1e6,
           residualRm=(fc - parts) / 1e6, coalGWh=s('coalGen') / 1e3, coalFlatRm=coal_flat / 1e6, partLoadRm=(coal_pl - coal_flat) / 1e6,
           ucStartRm=uc / 1e6, startPerMWRm=permw / 1e6, gasGWh=s('ccgt') / 1e3, ocgtLngGWh=sum(oc) / 1e3, gasRm=gas / 1e6, dieselGWh=s('diesel') / 1e3, dieselRm=dsl / 1e6,
           shedGWh=s('unservedH') / 1e3, shedRm=shed / 1e6, curtGWh=s('curtail') / 1e3, drGWh=s('dr') / 1e3,
           liDisGWh=disLi / 1e3, liCycles=disLi / li['mwh'], feDisGWh=disFe / 1e3, psDisGWh=s('ps') / 1e3,
           liSoc0=R['socLi'][0], liSocEnd=R['socLi'][-1], coalMin=min(H[h]['coalGen'] for h in hs), coalMax=max(H[h]['coalGen'] for h in hs))
# 14r hook fields (message 116), when present: the week's reserve shortfall, delivered must-run, interruptible compensation and
# the restore step, from the engine's cumulative totals. engineFlatILRm adds the interruptible compensation (drCostR), which the
# engine pays outside fuelCost; it is the engine figure to set beside a PyPSA run with interruptible load as a resource (X_IL=1).
if 'resShortCum' in b:
    d_ = lambda k: (b[k] - a[k])
    out.update(resShortGWh=d_('resShortCum') / 1e3, mustRunGWh=s('mustRun') / 1e3, drCostRm=d_('drCostCum') / 1e6,
               restoreDslGWh=d_('restoreDslCum') / 1e3, restoreDrGWh=d_('restoreDrCum') / 1e3,
               engineFlatILRm=out['engineFlatRm'] + d_('drCostCum') / 1e6)
print(json.dumps({k: (round(v, 2) if isinstance(v, float) else v) for k, v in out.items()}))
json.dump(out, open(sys.argv[1].replace('.json', '_eng.json'), 'w'), indent=1)
