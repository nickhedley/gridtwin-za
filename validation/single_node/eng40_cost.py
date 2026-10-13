"""Engine week cost from the hook, decomposed; checks the parts against the engine's own cumulative fuel, carbon and start-up
totals. usage: python eng40_cost.py week.json"""
import json, sys
d = json.load(open(sys.argv[1])); H, c, R = d['hours'], d['consts'], d['res']; S, N = d['START'], d['N']
hs = [str(h) for h in range(S, S + N)]; a, b = H[str(S - 1)], H[str(S + N - 1)]
s = lambda k: sum(H[h][k] for h in hs)
coal_mc = c['costCoal'] + c['vomCoal'] + c['cC']; gas_mc = c['costCcgt'] + c['vomCcgt'] + c['cG']; dsl_mc = c['costDiesel'] + c['vomDiesel'] + c['cD']
coal_flat = s('coalGen') * coal_mc
coal_pl = sum(H[h]['coalGen'] * ((c['costCoal'] + c['cC']) * H[h]['plF'] + c['vomCoal']) for h in hs)
uc = s('ucStart'); permw = b['startUpCostR'] - a['startUpCostR']
OCK = 10624 / 3600 * 0.52; VOM_OC = 80.19 * 1.032 * 1.035          # index.html FIXED heatRateOcgtKJ, effCcgtHHV, vomOcgt (c4f l.6489)
cc_cap = c['ccgtCap'] - c['ocgtLngMW']
oc = [min(c['ocgtLngMW'], max(0, H[h]['ccgt'] - cc_cap)) for h in hs]
gas = s('ccgt') * gas_mc + sum(oc) * ((c['costCcgt'] + c['cG']) * (OCK - 1) + VOM_OC - c['vomCcgt']); dsl = s('diesel') * dsl_mc
nuc = s('nuc') * (c['costNuclear'] + c['vomNuclear']); hyd = s('hyd') * c['costHydro']; imp = s('imp') * c['costImports']
shed = s('unservedH') * c['costUnservedR']
fc = (b['fuelCost'] - a['fuelCost']) + (b['carbonCost'] - a['carbonCost'])
parts = coal_pl + uc + gas + dsl + nuc + hyd + imp
li = R['tiers']['li']; disLi = sum(R['disLi'][1:]); disFe = sum(R['disFe'][1:]) if R['disFe'] else 0
out = dict(week=sys.argv[1].split('/')[-1], engineRm=(fc + permw + shed) / 1e6, engineFlatRm=(fc - coal_pl + coal_flat + permw + shed) / 1e6,
           residualRm=(fc - parts) / 1e6, coalGWh=s('coalGen') / 1e3, coalFlatRm=coal_flat / 1e6, partLoadRm=(coal_pl - coal_flat) / 1e6,
           ucStartRm=uc / 1e6, startPerMWRm=permw / 1e6, gasGWh=s('ccgt') / 1e3, ocgtLngGWh=sum(oc) / 1e3, gasRm=gas / 1e6, dieselGWh=s('diesel') / 1e3, dieselRm=dsl / 1e6,
           shedGWh=s('unservedH') / 1e3, shedRm=shed / 1e6, curtGWh=s('curtail') / 1e3, drGWh=s('dr') / 1e3,
           liDisGWh=disLi / 1e3, liCycles=disLi / li['mwh'], feDisGWh=disFe / 1e3, psDisGWh=s('ps') / 1e3,
           liSoc0=R['socLi'][0], liSocEnd=R['socLi'][-1], coalMin=min(H[h]['coalGen'] for h in hs), coalMax=max(H[h]['coalGen'] for h in hs))
print(json.dumps({k: (round(v, 2) if isinstance(v, float) else v) for k, v in out.items()}))
json.dump(out, open(sys.argv[1].replace('.json', '_eng.json'), 'w'), indent=1)
