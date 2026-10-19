#!/usr/bin/env python3
"""gen_pathway_presets.py: writes the two 2035 pathway presets into index.html from their build files, so they sit on one
basis (user, 19 Oct 2026, messages 213 and 227 (2)):

  'Least-cost path 2035'  c5f's pathway (harness/pathway/c5f/pathway_c5f.json; frozen copy of b82bfd3, build 2026-10-17g)
  'IRP path 2035'         IRP 2025's Table 1 build on c5f's inputs (harness/pathway/irp2025/pathway_irp2025.json, written by
                          build_irp.py beside it), the engine check of 19 Oct 2026 (message 215 (3))

Nothing in a block is typed: every value is read from the build file, the way pathcheck.js builds 2035's state: cumulative
new build to 2035, coal standing in 2035 (retired = FIXED.coalInstalledMW less it), nuclear decided in advance to 2035, the
pathway's demand index and smelter block, Cape wind, the ASTR reserve reference (FIXED fleet plus the run's wind and solar to
2030), 2035's gas fuel price, the 51% gas floor where the run applied it in the engine, the carbon price (the page's
carbonTaxAt on the run's path) and the run's recorded settings that are state. The run's lithium decline and LNG terminal
charge are global cost settings, not state: from build 2026-10-19b the page defaults equal c5f's (message 227 (1)), and
validate_pathway_presets.js checks they still do.

  python3 harness/pathway/gen_pathway_presets.py [--check]   (from the repository root; --check: exit 1 if index.html differs)
"""
import json, sys
Y = 2035
PRESETS = [
    {'name': 'IRP path 2035', 'build': 'harness/pathway/irp2025/pathway_irp2025.json', 'check': 'harness/pathway/irp2025/pathcheck_irp2025_b.json',
     # first generation replaces the hand-written preset and its comment block, from this line to the end of the preset
     'first_from': "  // IRP path 2035. The counterfactual the two transition presets should be read against: what",
     'first_to': "ccgtForceLoad:1,scenarioYear:2035,asReserveOn:true,asInertiaOn:true},\n",
     'preamble': ("  // IRP path 2035 (from build 2026-10-19b; user, message 227 (2)): the IRP 2025's Table 1 build to 2035 priced on c5f's inputs,\n"
                  "  // the engine check of 19 Oct 2026 (RESULTS 'IRP 2025's Table 1 build priced on c5f's inputs'), so it compares like for like\n"
                  "  // with 'Least-cost path 2035': the same demand, gas price, carbon path and coal dates. Until 19a it was typed: Table 1's\n"
                  "  // build at the transition presets' +5% demand, the page's R2,003 gas and R46/t carbon, lcoeCcgt 2500, reserve and inertia\n"
                  "  // pricing on (git history). The IRP's own 51% gas floor on 6 GW applies, as in the run.\n")},
    {'name': 'Least-cost path 2035', 'build': 'harness/pathway/c5f/pathway_c5f.json', 'check': 'harness/pathway/c5f/pathcheck_c5f_b.json'},
]
j = lambda v: json.dumps(v)


def block(cfg):
    P = json.load(open(cfg['build']))
    R = [r for r in json.load(open(cfg['check'])) if r['y'] == Y][0]
    S = P['sched']; yrs = sorted(int(y) for y in S)
    cum = lambda k, to=Y: sum(S[str(y)].get(k, 0) for y in yrs if y <= to)
    batt, mwh = cum('batt'), cum('battMWh'); ps = cum('phes') + cum('phel')
    blk = P['demand'].get('block') or {}
    blkMW = max(((int(y), mw) for y, mw in blk.items() if int(y) <= Y), default=(0, 0))[1]
    nuc = sum(mw for y, mw in (P.get('nuclearAdd') or {}).items() if int(y) <= Y)
    if ps: raise SystemExit(cfg['name'] + ': pumped storage built by 2035: carry PHES hours and acapPs before using the generator')
    if P['gas'].get('fuelRFlat') is not None or P.get('gasFinPremium') or P.get('importsEndYear') or P.get('comply'):
        raise SystemExit(cfg['name'] + ': a recorded setting this generator does not carry is set: extend it first')
    f = {'scenarioYear': Y,
         'newWindMW': cum('wind'), 'newPvMW': cum('pv'), 'newRooftopMW': cum('rooftop'), 'newBattMW': batt,
         'newBattHours': max(1, min(20, mwh / batt)) if batt > 0 else 4, 'newVrfbMW': cum('vrfb'), 'newIronAirMW': cum('ironair'),
         'newCcgtMW': cum('ccgt'), 'newOcgtMW': cum('ocgt'), 'newOcgdMW': cum('ocgd'), 'newOffshoreMW': cum('off'), 'newNuclearMW': nuc,
         'newPsMW': 0,
         'demandGrowthPct': (P['demand']['index'][str(Y)] - 1) * 100, 'demandBlockMW': blkMW, 'windCapeMW': cum('cw'),
         'costCcgt': P['gas']['fuelR'][str(Y)],
         'importsMW': P['importsMW'], 'importsCF': P['importsCF'], 'bldPvTracking': P['pvTracking'], 'bldCapeCurtPct': P['capeWind']['curtPct'],
         'carbonAllowancePath': P.get('carbonPath') or 'cut2027', 'carbonTaxFull': 1 if P.get('carbonFull') else 0,
         'bldWindCorr': P['windCorr'], 'bldWindCase': P['windCase'], 'bldPvCase': P['pvCase'], 'bldTariffCfBasis': P['tariffCfBasis'],
         'bldGridIntVreShare': P['gridIntVreShare'], 'bldGridCost': 1, 'bldOcgtCostCase': P['ocgt']['costCase']}
    gf = P.get('gasFloor') or {}
    if gf.get('engine'):   # the 51% floor, as pathcheck.js applies it (state.ccgtForceLoad, and its MW where recorded)
        f['ccgtForceLoad'] = 1
        if gf.get('mw', 0) > 0: f['ccgtForceLoadMW'] = gf['mw']
    w30, p30 = cum('wind', 2030), cum('pv', 2030)
    body = ','.join(f'{k}:{j(v)}' for k, v in f.items())
    # The carbon price is the page's own carbonTaxAt on the run's path, as pathcheck.js prices it, so its value is not copied here.
    body += (f",get carbonTaxRPerT(){{ return carbonTaxAt({Y}, {{...FIXED, carbonAllowancePath:{j(f['carbonAllowancePath'])}, carbonTaxFull:{f['carbonTaxFull']}}}); }}"
             f",get coalDecomMW(){{ return Math.max(0, Math.round(FIXED.coalInstalledMW - {j(S[str(Y)]['coalMW'])})); }}"
             f",get reserveVreRefWindMW(){{ return Math.round(FIXED.windMW + {j(w30)}); }},get reserveVreRefPvMW(){{ return Math.round(FIXED.pvUtilityMW + {j(p30)}); }}")
    n = cfg['name']; BEGIN = f"  // BEGIN GENERATED '{n}' (harness/pathway/gen_pathway_presets.py from {cfg['build']}; do not edit by hand)"
    END = f"  // END GENERATED '{n}'"
    return BEGIN, END, f"{BEGIN}\n  '{n.replace(chr(39), chr(92) + chr(39))}':{{{body}}},\n{END}", f, S[str(Y)]['coalMW']


html = open('index.html').read(); new = html
for cfg in PRESETS:
    BEGIN, END, blk, f, coal = block(cfg)
    if BEGIN in new:
        a = new.index(BEGIN); b = new.index(END, a) + len(END); new = new[:a] + blk + new[b:]
    elif 'first_from' in cfg:
        if new.count(cfg['first_from']) != 1 or new.count(cfg['first_to']) != 1: raise SystemExit(cfg['name'] + ': the hand-written preset was not found once')
        a = new.index(cfg['first_from']); b = new.index(cfg['first_to'], a) + len(cfg['first_to']); new = new[:a] + cfg['preamble'] + blk + '\n' + new[b:]
    else:
        anchor = "  // Deep decarbonisation 2035. Cheapest build found that meets the NEM reliability standard"
        if new.count(anchor) != 1: raise SystemExit('anchor not found once')
        new = new.replace(anchor, blk + '\n' + anchor, 1)
    if '--check' not in sys.argv:
        print('written:', cfg['name'], {k: round(f[k], 4) if isinstance(f[k], float) else f[k] for k in ('newWindMW', 'newPvMW', 'newRooftopMW', 'newBattMW', 'newCcgtMW', 'newOcgtMW', 'newNuclearMW', 'demandGrowthPct', 'costCcgt')}, 'coal standing', coal, 'gas floor', f.get('ccgtForceLoad', 0))
if '--check' in sys.argv:
    print('index.html blocks match the generator' if new == html else 'index.html blocks DIFFER from the generator'); sys.exit(0 if new == html else 1)
open('index.html', 'w').write(new)
