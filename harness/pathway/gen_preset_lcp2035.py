#!/usr/bin/env python3
"""gen_preset_lcp2035.py: writes the 'Least-cost path 2035' preset into index.html from c5f's build file (user, 19 Oct 2026,
message 213). Nothing in the block is typed: every value is read from harness/pathway/c5f/pathway_c5f.json (c5f's pathway,
build 2026-10-17g) and its engine check for 2031-35 (pathcheck_c5f_b.json), the way pathcheck.js builds 2035's state:
cumulative new build to 2035, coal standing in 2035 (retired = FIXED.coalInstalledMW less it, as pathcheck), the pathway's
demand index and smelter block, Cape wind, the ASTR reserve reference (FIXED fleet plus the run's wind and solar to 2030),
2035's gas fuel price, the carbon price (the page's carbonTaxAt on the run's path) and the run's recorded settings that are state. Two of c5f's settings change
global cost tables, not state, so no preset can carry them: lithium capex falling 3% a year (page 5%) and the R530.5/kW-yr
gas terminal charge; validate_lcp2035.js measures what they do to 2035's cost.

  python3 harness/pathway/gen_preset_lcp2035.py [--check]     (from the repository root; --check: exit 1 if index.html differs)
"""
import json, sys
Y = 2035; NAME = 'Least-cost path 2035'
P = json.load(open('harness/pathway/c5f/pathway_c5f.json'))
R = [r for r in json.load(open('harness/pathway/c5f/pathcheck_c5f_b.json')) if r['y'] == Y][0]
S = P['sched']; yrs = sorted(int(y) for y in S)
cum = lambda k, to=Y: sum(S[str(y)].get(k, 0) for y in yrs if y <= to)
batt, mwh = cum('batt'), cum('battMWh'); ps = cum('phes') + cum('phel')
blk = P['demand'].get('block') or {}
blkMW = max(((int(y), mw) for y, mw in blk.items() if int(y) <= Y), default=(0, 0))[1]
if P.get('nuclearAdd'): raise SystemExit('nuclearAdd recorded: extend the generator before using it')
if ps: raise SystemExit('pumped storage built by 2035: carry PHES hours and acapPs before using the generator')
if P['gas'].get('fuelRFlat') is not None or (P.get('gasFloor') or {}).get('engine') or P.get('gasFinPremium') or P.get('importsEndYear') or P.get('comply'):
    raise SystemExit('a recorded setting this generator does not carry is set: extend it first')
j = lambda v: json.dumps(v)
f = {'scenarioYear': Y,
     'newWindMW': cum('wind'), 'newPvMW': cum('pv'), 'newRooftopMW': cum('rooftop'), 'newBattMW': batt,
     'newBattHours': max(1, min(20, mwh / batt)) if batt > 0 else 4, 'newVrfbMW': cum('vrfb'), 'newIronAirMW': cum('ironair'),
     'newCcgtMW': cum('ccgt'), 'newOcgtMW': cum('ocgt'), 'newOcgdMW': cum('ocgd'), 'newOffshoreMW': cum('off'), 'newNuclearMW': 0,
     'newPsMW': 0,
     'demandGrowthPct': (P['demand']['index'][str(Y)] - 1) * 100, 'demandBlockMW': blkMW, 'windCapeMW': cum('cw'),
     'costCcgt': P['gas']['fuelR'][str(Y)],
     'importsMW': P['importsMW'], 'importsCF': P['importsCF'], 'bldPvTracking': P['pvTracking'], 'bldCapeCurtPct': P['capeWind']['curtPct'],
     'carbonAllowancePath': P.get('carbonPath') or 'cut2027', 'carbonTaxFull': 1 if P.get('carbonFull') else 0,
     'bldWindCorr': P['windCorr'], 'bldWindCase': P['windCase'], 'bldPvCase': P['pvCase'], 'bldTariffCfBasis': P['tariffCfBasis'],
     'bldGridIntVreShare': P['gridIntVreShare'], 'bldGridCost': 1, 'bldOcgtCostCase': P['ocgt']['costCase']}
w30, p30 = cum('wind', 2030), cum('pv', 2030)
body = ','.join(f'{k}:{j(v)}' for k, v in f.items())
# The carbon price is the page's own carbonTaxAt on the run's path, as pathcheck.js prices it, so its value is not copied here.
body += (f",get carbonTaxRPerT(){{ return carbonTaxAt({Y}, {{...FIXED, carbonAllowancePath:{j(f['carbonAllowancePath'])}, carbonTaxFull:{f['carbonTaxFull']}}}); }}"
         f",get coalDecomMW(){{ return Math.max(0, Math.round(FIXED.coalInstalledMW - {j(S[str(Y)]['coalMW'])})); }}"
         f",get reserveVreRefWindMW(){{ return Math.round(FIXED.windMW + {j(w30)}); }},get reserveVreRefPvMW(){{ return Math.round(FIXED.pvUtilityMW + {j(p30)}); }}")
BEGIN = f"  // BEGIN GENERATED '{NAME}' (harness/pathway/gen_preset_lcp2035.py from harness/pathway/c5f/pathway_c5f.json; do not edit by hand)"
END = f"  // END GENERATED '{NAME}'"
block = f"{BEGIN}\n  '{NAME}':{{{body}}},\n{END}"
html = open('index.html').read()
if BEGIN in html:
    a = html.index(BEGIN); b = html.index(END, a) + len(END); new = html[:a] + block + html[b:]
else:
    anchor = "  // Deep decarbonisation 2035. Cheapest build found that meets the NEM reliability standard"
    if html.count(anchor) != 1: raise SystemExit('anchor not found once')
    new = html.replace(anchor, block + '\n' + anchor, 1)
if '--check' in sys.argv:
    print('index.html block matches the generator' if new == html else 'index.html block DIFFERS from the generator'); sys.exit(0 if new == html else 1)
open('index.html', 'w').write(new); print('written:', NAME, {k: f[k] for k in ('newWindMW', 'newPvMW', 'newRooftopMW', 'newBattMW', 'newCcgtMW', 'newOcgtMW', 'demandGrowthPct', 'demandBlockMW')}, 'coal standing', S[str(Y)]['coalMW'])
