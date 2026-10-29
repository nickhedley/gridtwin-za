#!/usr/bin/env python3
"""gen_pathway_presets.py: writes the pathway presets into index.html from their build files, so they sit on one basis
(user, 19 Oct 2026, messages 213, 227 (2) and 232 (2)):

  "IRP's 2030 targets"    the IRP engine check's 2030 state (below; check harness/pathway/irp2025/pathcheck_irp2025_a.json)
  "..., grid delayed"     the same state with 60% of its new wind and solar connected and curtailment capped at 10%

  'Least-cost path 2035'  c5f's pathway (harness/pathway/c5f/pathway_c5f.json; frozen copy of b82bfd3, build 2026-10-17g)
  'IRP path 2035'         IRP 2025's Table 1 build on c5f's inputs (harness/pathway/irp2025/pathway_irp2025.json, written by
                          build_irp.py beside it), the engine check of 19 Oct 2026 (message 215 (3))

Nothing in a block is typed: every value is read from the build file, the way pathcheck.js builds a year's state: cumulative
new build to the preset's year, coal standing in that year (retired = FIXED.coalInstalledMW less it), nuclear decided in
advance to that year, the pathway's demand index and smelter block, Cape wind, the ASTR reserve reference (FIXED fleet plus
the run's wind and solar to 2030; after 2030 only, as pathcheck.js sets it), that year's gas fuel price, the 51% gas floor
where the run applied it in the engine, the carbon price (the page's carbonTaxAt on the run's path) and the run's recorded
settings that are state. The run's lithium decline and LNG terminal
charge are global cost settings, not state: from build 2026-10-19b the page defaults equal c5f's (message 227 (1)), and
validate_pathway_presets.js checks they still do.

  python3 harness/pathway/gen_pathway_presets.py [--check]   (from the repository root; --check: exit 1 if index.html differs)
"""
import json, sys
Y = 2035
PRE2030 = ("  // IRP's 2030 targets and its grid-delayed variant (from build 2026-10-19d; user, message 232 (2)): generated from the IRP\n"
           "  // engine check's 2030 state (harness/pathway/irp2025/, as IRP path 2035), so their demand, gas price, carbon path, coal dates\n"
           "  // and coal availability are c5f's; the typed preset before it (IRP demand +20%, coalEafFromFleet(67), lcoeCcgt 2500, 4,500 MW\n"
           "  // rooftop and 3,724 MW of storage) is in git history. The build is the run's (build_irp.py): Table 1's wind and solar by year,\n"
           "  // s_irpgas_c5f's gas and 51% floor, rooftop 900 MW a year from 2027, s_be6_c5f's lithium. The variant connects 60% of the\n"
           "  // state's new wind and solar and caps congestion curtailment at 10%, as before.\n")
PRESETS = [
    {'name': "IRP's 2030 targets", 'year': 2030, 'build': 'harness/pathway/irp2025/pathway_irp2025.json', 'check': 'harness/pathway/irp2025/pathcheck_irp2025_a.json',
     'first_from': "  // DEMAND FROM 19 OCT 2026 (user, message 231 (2)): both 2030 presets run on c5f's demand for 2030", 'first_to': "lcoeCcgt:2500,ccgtForceLoad:1,scenarioYear:2030},\n", 'preamble': PRE2030},
    # 'grid delayed': 40% of the new wind and solar cannot connect and curtailment is 10% (the variant's own definition, 7 Oct 2026)
    {'name': "IRP's 2030 targets, grid delayed", 'year': 2030, 'build': 'harness/pathway/irp2025/pathway_irp2025.json', 'check': 'harness/pathway/irp2025/pathcheck_irp2025_a.json',
     'delay': {'share': 0.6, 'congestionCurtailPct': 10},
     'first_from': "  'IRP\\'s 2030 targets, grid delayed':{demandGrowthPct:C5F_DEMAND[2030].growthPct,", 'first_to': "congestionCurtailPct:10,scenarioYear:2030},\n", 'preamble': ''},
    {'name': 'IRP path 2035', 'build': 'harness/pathway/irp2025/pathway_irp2025.json', 'check': 'harness/pathway/irp2025/pathcheck_irp2025_b.json',
     'gap_index': 'harness/pathway/irp2025/index_irpdem.json',
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


import re
def page_defaults():
    h = open('index.html').read()
    m1 = re.search(r"^\s*importsEndYear:(\d+),", h, re.M); m2 = re.search(r"^\s*bldCocCase:'([a-z]+)',", h, re.M)
    m3 = re.search(r"^\s*exportsMW:(\d+),", h, re.M)   # FIXED's firm exports, the first such line
    if not (m1 and m2 and m3): raise SystemExit('page defaults not found once (importsEndYear, bldCocCase, exportsMW)')
    return {'importsEndYear': int(m1.group(1)), 'bldCocCase': m2.group(1), 'exportsMW': int(m3.group(1))}


def block(cfg):
    Y = cfg.get('year', 2035)
    P = json.load(open(cfg['build']))
    R = [r for r in json.load(open(cfg['check'])) if r['y'] == Y][0]
    S = P['sched']; yrs = sorted(int(y) for y in S)
    cum = lambda k, to=Y: sum(S[str(y)].get(k, 0) for y in yrs if y <= to)
    batt, mwh = cum('batt'), cum('battMWh'); ps = cum('phes') + cum('phel')
    blk = P['demand'].get('block') or {}
    blkMW = max(((int(y), mw) for y, mw in blk.items() if int(y) <= Y), default=(0, 0))[1]
    nuc = sum(mw for y, mw in (P.get('nuclearAdd') or {}).items() if int(y) <= Y)
    if ps: raise SystemExit(cfg['name'] + f': pumped storage built by {Y}: carry PHES hours and acapPs before using the generator')
    if P['gas'].get('fuelRFlat') is not None or P.get('gasFinPremium') or P.get('comply'):
        raise SystemExit(cfg['name'] + ': a recorded setting this generator does not carry is set: extend it first')
    # Settings the run records that are the page's own defaults, not preset state (29 Oct 2026, for c6e; the same rule as the
    # lithium decline and the LNG terminal): the imports end year (c6's central ends the Cahora Bassa contract after 2030, PR B) and
    # the cost-of-capital case (build 2026-10-28a). The run must equal the page, read here from index.html, or the preset would run
    # on another basis than its run; validate_pathway_presets.js checks the same equality on the generated preset.
    # Enforced only where the run records the setting: files from before PR B (c5f) and before build 2026-10-28a carry neither,
    # and validate_pathway_presets.js reports those presets against the page as it does now.
    pg = page_defaults()
    if P.get('importsEndYear') is not None and P['importsEndYear'] != pg['importsEndYear']:
        raise SystemExit(cfg['name'] + f": the run's imports end year {P['importsEndYear']} is not the page's {pg['importsEndYear']}")
    if P.get('cocCase') is not None and P['cocCase'] != pg['bldCocCase']:
        raise SystemExit(cfg['name'] + f": the run's cost-of-capital case {P['cocCase']} is not the page's {pg['bldCocCase']}")
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
    if 'delay' in cfg:   # a variant: a share of the state's new wind and solar connects, the rest is held back (grid delayed)
        D = cfg['delay']; f['newWindMW'] = round(D['share'] * f['newWindMW']); f['newPvMW'] = round(D['share'] * f['newPvMW'])
        f['congestionCurtailPct'] = D['congestionCurtailPct']
    body = ','.join(f'{k}:{j(v)}' for k, v in f.items())
    # The carbon price is the page's own carbonTaxAt on the run's path, as pathcheck.js prices it, so its value is not copied here.
    body += (f",get carbonTaxRPerT(){{ return carbonTaxAt({Y}, {{...FIXED, carbonAllowancePath:{j(f['carbonAllowancePath'])}, carbonTaxFull:{f['carbonTaxFull']}}}); }}"
             f",get coalDecomMW(){{ return Math.max(0, Math.round(FIXED.coalInstalledMW - {j(S[str(Y)]['coalMW'])})); }}"
             + (f",get reserveVreRefWindMW(){{ return Math.round(FIXED.windMW + {j(w30)}); }},get reserveVreRefPvMW(){{ return Math.round(FIXED.pvUtilityMW + {j(p30)}); }}" if Y > 2030 else ''))
    n = cfg['name']; BEGIN = f"  // BEGIN GENERATED '{n}' (harness/pathway/gen_pathway_presets.py from {cfg['build']}; do not edit by hand)"
    END = f"  // END GENERATED '{n}'"
    return BEGIN, END, f"{BEGIN}\n  '{n.replace(chr(39), chr(92) + chr(39))}':{{{body}}},\n{END}", f, S[str(Y)]['coalMW']


def demand_gap(cfg, Y=2035):
    # How far the IRP's demand path sits above the pathway's in 2035 (message 229 (2)): customer demand plus firm exports on
    # the pair's index (harness/pathway/irp2025/index_irpdem.json, message 224) against the same on the build file's own index.
    # From c6e (29 Oct 2026) the pair's demand is read from its own run files instead ('gap_run': the IRP-demand run beside
    # 'build'): customer demand is the profile base x the run's index plus its smelter block, firm exports the page's, on both sides;
    # the c6 index file carries no firm-exports entry. Negative when the IRP's own forecast sits below the pathway's, as it does
    # on c6's basis; the caption words the sign.
    P = json.load(open(cfg['build']))
    blkOf = lambda R: max(((int(y), mw) for y, mw in (R['demand'].get('block') or {}).items() if int(y) <= Y), default=(0, 0))[1] * 8.76 / 1000
    if 'gap_run' in cfg:
        R = json.load(open(cfg['gap_run'])); base = sum(json.load(open('profiles.json'))['demand']) / 1e6
        exp = page_defaults()['exportsMW'] * 8.76 / 1000
        tot = lambda Q: base * Q['demand']['index'][str(Y)] + blkOf(Q) + exp
        return 100 * (tot(R) / tot(P) - 1)
    I = json.load(open(cfg['gap_index'])); m = I['meta']; blk = blkOf(P)
    tot = lambda ix: m['base_TWh'] * ix + blk + m['firm_exports_TWh']
    return 100 * (tot(I['years'][str(Y)]) / tot(P['demand']['index'][str(Y)]) - 1)


def c5f_demand():
    # c5f's demand for the presets' years (message 231 (2)): growth on the 2026 base and the smelter block, from its build file,
    # read by every preset that runs on the pathway's demand.
    P = json.load(open('harness/pathway/c5f/pathway_c5f.json')); blk = P['demand'].get('block') or {}
    yrs = {y: {'growthPct': (P['demand']['index'][str(y)] - 1) * 100,
               'blockMW': max([mw for s, mw in blk.items() if int(s) <= y] or [0])} for y in (2026, 2030, 2035, 2040)}
    DB = "// BEGIN GENERATED C5F_DEMAND (harness/pathway/gen_pathway_presets.py from harness/pathway/c5f/pathway_c5f.json; do not edit by hand)"
    DE = "// END GENERATED C5F_DEMAND"
    # c5f's build-rate caps that override the pace, recorded in its build file (WIND_CAP, LI_CAP, MW a year from the year given;
    # lithium energy at liEnergyHours of the power cap); the captions compare the searched presets' builds with c5f's limits
    # (messages 245 and 246 (4)).
    caps = {'wind': {'mw': P['windCap'], 'from': P['windCapFrom']}, 'batt': {'mw': P['liCap'], 'from': P['liCapFrom']},
            'battEnergyHours': P['liEnergyHours']}
    return DB, DE, (f"{DB}\n// c5f's demand by model year: growth on the 2026 base (ESRG IRPDemandREF index) and the flat smelter block, MW (message 231 (2))\nconst C5F_DEMAND = {j(yrs)};\n"
                    f"// c5f's build-rate caps over the pace: MW a year from the year given; lithium energy in hours of its power cap (messages 245, 246 (4))\nconst C5F_BUILD_CAPS = {j(caps)};\n{DE}")


html = open('index.html').read(); new = html


def replace_block(text, begin, end, blk):
    # A generated block is found by the start of its BEGIN marker up to '(' (its name), not by the whole marker: the marker records the
    # build file's path, which changes when the central changes (c5f to c6e, 29 Oct 2026). Returns the new text, or None if absent.
    pre = begin.split('(')[0]
    if pre not in text: return None
    a = text.index(pre); b = text.index(end, a) + len(end); return text[:a] + blk + text[b:]


DB, DE, dblk = c5f_demand()
if replace_block(new, DB, DE, dblk) is not None:
    new = replace_block(new, DB, DE, dblk)
else:
    if new.count('const PRESETS={') != 1: raise SystemExit('PRESETS not found once')
    new = new.replace('const PRESETS={', dblk + '\nconst PRESETS={', 1)
for cfg in PRESETS:
    BEGIN, END, blk, f, coal = block(cfg); Y = cfg.get('year', 2035)
    if replace_block(new, BEGIN, END, blk) is not None:
        new = replace_block(new, BEGIN, END, blk)
    elif 'first_from' in cfg:
        if new.count(cfg['first_from']) != 1 or new.count(cfg['first_to']) != 1: raise SystemExit(cfg['name'] + ': the hand-written preset was not found once')
        a = new.index(cfg['first_from']); b = new.index(cfg['first_to'], a) + len(cfg['first_to']); new = new[:a] + cfg['preamble'] + blk + '\n' + new[b:]
    else:
        anchor = "  // Deep decarbonisation 2035. Cheapest build found that meets the NEM reliability standard"
        if new.count(anchor) != 1: raise SystemExit('anchor not found once')
        new = new.replace(anchor, blk + '\n' + anchor, 1)
    if 'gap_index' in cfg or 'gap_run' in cfg:
        # IRP's 2030 targets' caption gives the same gap for 2030 (message 235 (3)), from the same index
        g30 = demand_gap(cfg, 2030)
        gsrc = cfg.get('gap_run') or cfg['gap_index']
        GB30 = f"// BEGIN GENERATED IRP's 2030 targets demand gap (harness/pathway/gen_pathway_presets.py from {gsrc}; do not edit by hand)"
        GE30 = "// END GENERATED IRP's 2030 targets demand gap"
        g30blk = f"{GB30}\nconst IRP2030_DEMAND_GAP_PCT = {j(g30)};   // the IRP's demand path above the pathway's in 2030, customer demand plus firm exports\n{GE30}"
        if replace_block(new, GB30, GE30, g30blk) is not None:
            new = replace_block(new, GB30, GE30, g30blk)
        else:
            anchor = "const _gw = mw => String(+(mw / 1000).toFixed(1));"
            if new.count(anchor) != 1: raise SystemExit('caption anchor not found once')
            new = new.replace(anchor, g30blk + '\n' + anchor, 1)
        gap = demand_gap(cfg)
        GB = f"// BEGIN GENERATED 'IRP path 2035' demand gap (harness/pathway/gen_pathway_presets.py from {gsrc}; do not edit by hand)"
        GE = "// END GENERATED 'IRP path 2035' demand gap"
        gblk = f"{GB}\nconst IRP2035_DEMAND_GAP_PCT = {j(gap)};   // Table 1's demand path above the pathway's in 2035, customer demand plus firm exports\n{GE}"
        if replace_block(new, GB, GE, gblk) is not None:
            new = replace_block(new, GB, GE, gblk)
        else:
            anchor = "const _gw = mw => String(+(mw / 1000).toFixed(1));"
            if new.count(anchor) != 1: raise SystemExit('caption anchor not found once')
            new = new.replace(anchor, gblk + '\n' + anchor, 1)
    if '--check' not in sys.argv:
        print('written:', cfg['name'], Y, {k: round(f[k], 4) if isinstance(f[k], float) else f[k] for k in ('newWindMW', 'newPvMW', 'newRooftopMW', 'newBattMW', 'newCcgtMW', 'newOcgtMW', 'newNuclearMW', 'demandGrowthPct', 'costCcgt')}, 'coal standing', coal, 'gas floor', f.get('ccgtForceLoad', 0))
if '--check' in sys.argv:
    print('index.html blocks match the generator' if new == html else 'index.html blocks DIFFER from the generator'); sys.exit(0 if new == html else 1)
open('index.html', 'w').write(new)
