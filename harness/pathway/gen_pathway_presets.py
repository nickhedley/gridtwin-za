#!/usr/bin/env python3
"""gen_pathway_presets.py: writes the pathway presets into index.html from their build files, so they sit on one basis
(user, 19 Oct 2026, messages 213, 227 (2) and 232 (2)):

  "IRP's 2030 targets"    the IRP engine check's 2030 state (below; check harness/pathway/irp2025/pathcheck_irp2025_a.json)
  "..., grid delayed"     the same state with 60% of its new wind and solar connected and curtailment capped at 10%

  'Least-cost path 2035'  the central run's pathway (CENTRAL below: harness/pathway/c6e/pathway_c6e.json from 29 Oct 2026; c5f before)
  'IRP path 2035'         IRP 2025's Table 1 build on the central run's inputs (harness/pathway/c6e/pathway_irp2025_c6e.json, written by
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
import json, sys, math, os
Y = 2035
PRE2030 = ("  // IRP's 2030 targets and its grid-delayed variant (from build 2026-10-19d; user, message 232 (2)): generated from the IRP\n"
           "  // engine check's 2030 state (harness/pathway/c6e/, as IRP path 2035), so their demand, gas price, carbon path, coal dates\n"
           "  // and coal availability are the central run's (c6e from 29 Oct 2026); the typed preset before it (IRP demand +20%, coalEafFromFleet(67), lcoeCcgt 2500, 4,500 MW\n"
           "  // rooftop and 3,724 MW of storage) is in git history. The build is the run's (build_irp.py): Table 1's wind and solar by year,\n"
           "  // the IRP's gas and 51% floor, rooftop 900 MW a year from 2027 to 2035, the IRP's lithium. The variant connects 60% of the\n"
           "  // state's new wind and solar and caps congestion curtailment at 10%, as before.\n")
CENTRAL = 'harness/pathway/c6e/pathway_c6e.json'   # the central run's build file (c6e, PR #128, run on f7921b7, build 2026-10-28a)
PRESETS = [
    {'name': "IRP's 2030 targets", 'year': 2030, 'build': 'harness/pathway/c6e/pathway_irp2025_c6e.json', 'check': 'harness/pathway/c6e/pathcheck_irp2025_c6e_a.json',
     'first_from': "  // DEMAND FROM 19 OCT 2026 (user, message 231 (2)): both 2030 presets run on c5f's demand for 2030", 'first_to': "lcoeCcgt:2500,ccgtForceLoad:1,scenarioYear:2030},\n", 'preamble': PRE2030},
    # 'grid delayed': 40% of the new wind and solar cannot connect and curtailment is 10% (the variant's own definition, 7 Oct 2026)
    {'name': "IRP's 2030 targets, grid delayed", 'year': 2030, 'build': 'harness/pathway/c6e/pathway_irp2025_c6e.json', 'check': 'harness/pathway/c6e/pathcheck_irp2025_c6e_a.json',
     'delay': {'share': 0.6, 'congestionCurtailPct': 10},
     'first_from': "  'IRP\\'s 2030 targets, grid delayed':{demandGrowthPct:C5F_DEMAND[2030].growthPct,", 'first_to': "congestionCurtailPct:10,scenarioYear:2030},\n", 'preamble': ''},
    {'name': 'IRP path 2035', 'build': 'harness/pathway/c6e/pathway_irp2025_c6e.json', 'check': 'harness/pathway/c6e/pathcheck_irp2025_c6e_b.json',
     'gap_run': 'harness/pathway/c6e/pathway_c6e_irpdem.json',
     # first generation replaces the hand-written preset and its comment block, from this line to the end of the preset
     'first_from': "  // IRP path 2035. The counterfactual the two transition presets should be read against: what",
     'first_to': "ccgtForceLoad:1,scenarioYear:2035,asReserveOn:true,asInertiaOn:true},\n",
     'preamble': ("  // IRP path 2035 (from build 2026-10-19b; user, message 227 (2)): the IRP 2025's Table 1 build to 2035 priced on the central\n"
                  "  // run's inputs (c6e from 29 Oct 2026; c5f before), its engine check beside the central's, so it compares like for like\n"
                  "  // with 'Least-cost path 2035': the same demand, gas price, carbon path and coal dates. Until 19a it was typed: Table 1's\n"
                  "  // build at the transition presets' +5% demand, the page's R2,003 gas and R46/t carbon, lcoeCcgt 2500, reserve and inertia\n"
                  "  // pricing on (git history). The IRP's own 51% gas floor on 6 GW applies, as in the run.\n")},
    {'name': 'Least-cost path 2035', 'build': 'harness/pathway/c6e/pathway_c6e.json', 'check': 'harness/pathway/c6e/pathcheck_c6e_b.json'},
    # The two hypothetical presets (user, 31 Oct 2026, messages 537 (f), 555 and 558): optimised builds at relaxed build rates (the grid
    # pace) with iron-air capped at 5 GW, replacing the hand-searched builds; the comments above each hand-written line, kept, are the
    # record of the builds they replace. Deep decarbonisation 2035: the CO2 cap from 2035, elastic at R50,000/t (no slack used);
    # Fossil-free 2040: no coal, gas or diesel after 2039, a hard rule.
    # From 1 Nov 2026 (user, message 599 (a)) Deep is the no-gas run calibrated to 40 Mt from 2035 on its own engine check (RESULTS
    # 'Deep decarbonisation 2035 at 22.8, 30, 35 and 40 Mt'); 'cal' is its calibration record, read for the caption's cap.
    {'name': 'Deep decarbonisation 2035', 'build': 'harness/pathway/opt/pathway_s_hypo_deep2035nogas_t40n_r3_c6e.json',
     'check': 'harness/pathway/opt/pathcheck_s_hypo_deep2035nogas_t40n_r3_c6e_31c_b.json', 'cal': 'harness/pathway/opt/cal_t40n.txt',
     'first_from': "  'Deep decarbonisation 2035':{demandGrowthPct:C5F_DEMAND[2035]", 'first_to': "newCcgtMW:0,scenarioYear:2035,asReserveOn:true,asInertiaOn:true},\n",
     'preamble': "  // Replaced 1 Nov 2026 by the optimised hypothetical build (user, messages 537 (f) and 555; harness/pathway/opt/, RESULTS 'Deep\n  // decarbonisation 2035, hypothetical'): the hand-searched build described above is in git history before build 2026-10-31k.\n  // From build 2026-11-01d the no-gas build calibrated to 40 Mt from 2035 (message 599 (a)).\n"},
    {'name': 'Fossil-free 2040', 'year': 2040, 'build': 'harness/pathway/opt/pathway_s_hypo_ff2040_c6e.json', 'check': 'harness/pathway/opt/pathcheck_s_hypo_ff2040_c6e_31c_c.json',
     'first_from': "  'Fossil-free 2040':{demandGrowthPct:C5F_DEMAND[2040]", 'first_to': "newNuclearMW:0,scenarioYear:2040,asReserveOn:true,asInertiaOn:true},\n",
     'preamble': "  // Replaced 1 Nov 2026 by the optimised hypothetical build (user, messages 537 (f), 555 and 558; harness/pathway/opt/, RESULTS\n  // 'Fossil-free 2040, hypothetical'): the hand-searched build described above is in git history before build 2026-10-31k.\n"},
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
    # New pumped storage (from 1 Nov 2026, Fossil-free 2040's optimised build): carried as pathcheck.js prices it, at the run's recorded
    # hours and the build LP's annuity on its cost basis (acapPs), which is not the page's derived acapPs (FIXED, its own basis).
    PH = P.get('phes') or {}
    if ps and (cum('phel') or PH.get('hours2')): raise SystemExit(cfg['name'] + ': a second pumped-storage duration: carry it before using the generator')
    # System strength (build 2026-11-02a): a run on 'inertia' or with the fault-level adder carries builds (grid-forming MW, condenser
    # MVA) and settings the presets do not yet carry (c7 adds them).
    ss = P.get('ss') or {}
    if ss.get('mode', 'sync6') != 'sync6' or ss.get('fault', 'off') != 'off':
        raise SystemExit(cfg['name'] + ': the run is on system strength mode ' + str(ss.get('mode')) + ', fault ' + str(ss.get('fault')) + ': extend the generator first')
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
         'newPsMW': ps,
         'demandGrowthPct': (P['demand']['index'][str(Y)] - 1) * 100, 'demandBlockMW': blkMW, 'windCapeMW': cum('cw'),
         'costCcgt': P['gas']['fuelR'][str(Y)],
         'importsMW': P['importsMW'], 'importsCF': P['importsCF'], 'bldPvTracking': P['pvTracking'], 'bldCapeCurtPct': P['capeWind']['curtPct'],
         'carbonAllowancePath': P.get('carbonPath') or 'cut2027', 'carbonTaxFull': 1 if P.get('carbonFull') else 0,
         'bldWindCorr': P['windCorr'], 'bldWindCase': P['windCase'], 'bldPvCase': P['pvCase'], 'bldTariffCfBasis': P['tariffCfBasis'],
         'bldGridIntVreShare': P['gridIntVreShare'], 'bldGridCost': 1, 'bldOcgtCostCase': P['ocgt']['costCase']}
    fe = P.get('fossilEnd')
    if fe and Y > fe:   # FOSSIL_END (message 531 (c)), as pathcheck.js applies it: no coal, gas or diesel standing after the last fossil year
        if S[str(Y)]['coalMW'] > 0: raise SystemExit(cfg['name'] + f': fossilEnd {fe} but coal standing in {Y}')
        f.update({'newCcgtMW': 0, 'newOcgtMW': 0, 'newOcgdMW': 0})
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
             + (f",get reserveVreRefWindMW(){{ return Math.round(FIXED.windMW + {j(w30)}); }},get reserveVreRefPvMW(){{ return Math.round(FIXED.pvUtilityMW + {j(p30)}); }}" if Y > 2030 else '')
             + (",get dieselDecomMW(){ return FIXED.ocgtDieselMW; }" if fe and Y > fe else '')
             + (f",newPsHours:{j(PH.get('hours', 14))},get acapPs(){{ return bldAnnuity(bldPhesCapexKW({j(PH['basis'])}, {j(PH.get('hours', 14))}), 60, 'phes') + FIXED.bldPhesFomRkW; }}" if ps else ''))
    n = cfg['name']; BEGIN = f"  // BEGIN GENERATED '{n}' (harness/pathway/gen_pathway_presets.py from {cfg['build']}; do not edit by hand)"
    END = f"  // END GENERATED '{n}'"
    return BEGIN, END, f"{BEGIN}\n  '{n.replace(chr(39), chr(92) + chr(39))}':{{{body}}},\n{END}", f, S[str(Y)]['coalMW']


def demand_gap(cfg, Y=2035):
    # How far the IRP's demand path sits from the pathway's in 2035, signed (message 229 (2)): customer demand plus firm exports on
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
    # From 29 Oct 2026 the central is c6e (harness/pathway/c6e, PR #128); the identifiers keep the C5F_ names (renaming them is churn in
    # the presets block), and the block's comment says whose figures they are.
    P = json.load(open(CENTRAL)); blk = P['demand'].get('block') or {}
    yrs = {y: {'growthPct': (P['demand']['index'][str(y)] - 1) * 100,
               'blockMW': max([mw for s, mw in blk.items() if int(s) <= y] or [0])} for y in (2026, 2030, 2035, 2040)}
    DB = f"// BEGIN GENERATED C5F_DEMAND (harness/pathway/gen_pathway_presets.py from {CENTRAL}; do not edit by hand)"
    DE = "// END GENERATED C5F_DEMAND"
    # c5f's build-rate caps that override the pace, recorded in its build file (WIND_CAP, LI_CAP, MW a year from the year given;
    # lithium energy at liEnergyHours of the power cap); the captions compare the searched presets' builds with c5f's limits
    # (messages 245 and 246 (4)).
    caps = {'wind': {'mw': P['windCap'], 'from': P['windCapFrom']}, 'batt': {'mw': P['liCap'], 'from': P['liCapFrom']},
            'battEnergyHours': P['liEnergyHours']}
    return DB, DE, (f"{DB}\n// The central run's demand by model year (c6e from 29 Oct 2026; the C5F_ names are kept): growth on the 2026 base (ESRG IRPDemandREF index) and the flat smelter block, MW (message 231 (2))\nconst C5F_DEMAND = {j(yrs)};\n"
                    f"// The central run's build-rate caps over the pace: MW a year from the year given; lithium energy in hours of its power cap (messages 245, 246 (4))\nconst C5F_BUILD_CAPS = {j(caps)};\n{DE}")


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
        g30blk = f"{GB30}\nconst IRP2030_DEMAND_GAP_PCT = {j(g30)};   // the IRP's demand path against the pathway's in 2030, signed (negative: below), customer demand plus firm exports\n{GE30}"
        if replace_block(new, GB30, GE30, g30blk) is not None:
            new = replace_block(new, GB30, GE30, g30blk)
        else:
            anchor = "const _gw = mw => String(+(mw / 1000).toFixed(1));"
            if new.count(anchor) != 1: raise SystemExit('caption anchor not found once')
            new = new.replace(anchor, g30blk + '\n' + anchor, 1)
        gap = demand_gap(cfg)
        GB = f"// BEGIN GENERATED 'IRP path 2035' demand gap (harness/pathway/gen_pathway_presets.py from {gsrc}; do not edit by hand)"
        GE = "// END GENERATED 'IRP path 2035' demand gap"
        gblk = f"{GB}\nconst IRP2035_DEMAND_GAP_PCT = {j(gap)};   // the IRP's demand path against the pathway's in 2035, signed (negative: below), customer demand plus firm exports\n{GE}"
        if replace_block(new, GB, GE, gblk) is not None:
            new = replace_block(new, GB, GE, gblk)
        else:
            anchor = "const _gw = mw => String(+(mw / 1000).toFixed(1));"
            if new.count(anchor) != 1: raise SystemExit('caption anchor not found once')
            new = new.replace(anchor, gblk + '\n' + anchor, 1)
    if '--check' not in sys.argv:
        print('written:', cfg['name'], Y, {k: round(f[k], 4) if isinstance(f[k], float) else f[k] for k in ('newWindMW', 'newPvMW', 'newRooftopMW', 'newBattMW', 'newCcgtMW', 'newOcgtMW', 'newNuclearMW', 'demandGrowthPct', 'costCcgt')}, 'coal standing', coal, 'gas floor', f.get('ccgtForceLoad', 0))
# The hypothetical presets' captions (user, 31 Oct 2026, message 555 (f)): the CO2 cap and its first year, or the last fossil year, read
# from each run, and NTCSA's two criteria from its engine check (message 600 (b)). A caption says 'at or below' the cap only if the engine check's CO2 is at or below it in every year from the cap's
# first year and the build LP used no slack above it; otherwise the generator stops.
hyp = {}
for cfg in PRESETS:
    P = json.load(open(cfg['build']))
    if not (P.get('co2cap') or P.get('fossilEnd')): continue
    e = {'pace': P.get('pace'), 'ironAirMW': sum(P['sched'][y].get('ironair', 0) for y in P['sched'] if int(y) <= cfg.get('year', 2035))}
    rows = [r for g in 'abc' for r in json.load(open(cfg['check'][:-6] + g + '.json'))]
    # NTCSA's two criteria in every year (user, 1 Nov 2026, message 600 (b)): the caption says 'Meets' only if each year's mean unserved
    # energy is within the standard and each year's open-cycle share under its limit (the page compares, with its own constants).
    # A missing or null figure stops the generator (RULES 4): a check made with the pathcheck bug of 31 Oct has null open-cycle shares.
    num = lambda v: isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v)
    # A year with no open-cycle plants standing (Fossil-free from 2040) has no share (pathcheck writes null for zero capacity). Whether a
    # plant stands comes from the run, not the check (user, 1 Nov 2026, message 602 (a)): the 31 Oct pathcheck bug wrote null with
    # capacity 0 and output 0, the same fields as a true zero. Capacity standing in year y as pathcheck.js builds it (dieselAvailMW plus
    # new open-cycle gas): the page's diesel fleet (FIXED.ocgtDieselMW; the run's 2026 fleet adjustment in 2026) less FIXED.dieselDecomMW,
    # plus new diesel and gas open-cycle built to y, none after the run's fossilEnd; a peaker retirement schedule (PEAK=1) is not counted,
    # so capacity is never understated. The rule is harness/pathway/tables/packfill.js's ocCapRun. A null share is zero only when that
    # capacity is 0 and the check's output is 0.
    fx = {k: re.findall(r'\n  ' + k + r':(\d+(?:\.\d+)?),', html) for k in ('ocgtDieselMW', 'dieselDecomMW')}
    if any(len(v) != 1 for v in fx.values()): raise SystemExit('FIXED.ocgtDieselMW or FIXED.dieselDecomMW not found once in index.html')
    def oc_cap(y):
        fe = P.get('fossilEnd')
        if fe is not None and y > fe: return 0.0
        D = float(fx['ocgtDieselMW'][0]) + ((P.get('fleet2026') or {}).get('ocgtDieselMW', 0) if y == 2026 else 0)
        cum = lambda k: sum(P['sched'][yy].get(k, 0) or 0 for yy in P['sched'] if int(yy) <= y)
        return max(0.0, D - float(fx['dieselDecomMW'][0])) + cum('ocgd') + cum('ocgt')
    none = lambda r: r.get('ocgtCF', 0) is None and r.get('ocgtTWh') == 0 and oc_cap(r['y']) == 0
    oc = lambda r: 0.0 if none(r) else r.get('ocgtCF')
    bad = sorted(r['y'] for r in rows if not (num(r.get('mean')) and num(oc(r))))
    if bad or len(rows) != len({r['y'] for r in rows}): raise SystemExit(cfg['name'] + f': no unserved mean or open-cycle share (ocgtCF) in {bad}, or a year repeated, in its engine check')
    e.update({'unservedMaxGWh': max(r['mean'] for r in rows), 'ocShareMax': max(oc(r) for r in rows)})
    if P.get('co2cap'):
        c = P['co2cap']
        slack = [(k, y, v) for L in (P.get('passLog') or []) for k, d in [(L.get('key'), L.get('co2Slack') or {})] for y, v in d.items() if v > 1e-9]
        if c.get('byYear'):
            # A run calibrated on its own engine check (messages 588 and 599 (a)): the build LP's per-year caps sit below the target so the
            # engine lands on it. The caption states the target from the calibration record, as 'about', and holds only if the record
            # converged ('final' on this run) and the engine check's CO2 is within the calibration's tolerance of the target, or below it,
            # in every year from the cap's first year. The tolerance is read from the calibration script, not typed here.
            if 'cal' not in cfg: raise SystemExit(cfg['name'] + ': per-year caps without a calibration record')
            cal = open(cfg['cal']).read()
            rnd = re.findall(r'round \d+ cap ([0-9.]+) engine2035 ([0-9.]+) target ([0-9.]+)', cal)
            run = os.path.basename(cfg['build'])[len('pathway_'):-len('.json')]
            if not rnd or not re.search(r'^final ' + re.escape(run) + r' 3/3$', cal, re.M): raise SystemExit(cfg['name'] + ': the calibration record did not converge on ' + run)
            capLast, eng, T = map(float, rnd[-1])
            tol = float(re.search(r'abs\(\$e-\$T\)<=([0-9.]+)', open('harness/pathway/opt/run_deep_cal.sh').read()).group(1))
            if any(abs(v - capLast) > 1e-9 for v in c['byYear'].values()): raise SystemExit(cfg['name'] + ': the per-year caps are not the calibration\'s last cap')
            over = [(r['y'], round(r['co2'], 2)) for r in rows if r['y'] >= c['fromYear'] and r['co2'] > T + tol + 1e-9]
            if over or slack: raise SystemExit(cfg['name'] + f': CO2 more than {tol} Mt above the target {T} in the engine check {over} or slack in the build LP {slack}')
            e.update({'co2CapMt': T, 'co2CapFrom': c['fromYear'], 'co2CapAbout': True})
        else:
            over = [(r['y'], round(r['co2'], 2)) for r in rows if r['y'] >= c['fromYear'] and r['co2'] > c['mt'] + 1e-9]
            if over or slack: raise SystemExit(cfg['name'] + f': CO2 above the cap in the engine check {over} or slack in the build LP {slack}: the caption cannot say at or below')
            e.update({'co2CapMt': c['mt'], 'co2CapFrom': c['fromYear']})
    if P.get('fossilEnd'): e['fossilFreeFrom'] = P['fossilEnd'] + 1
    hyp[cfg['name']] = e
HB = "// BEGIN GENERATED HYPO_PRESETS (harness/pathway/gen_pathway_presets.py from the hypothetical presets' run files; do not edit by hand)"
HE = "// END GENERATED HYPO_PRESETS"
hblk = (f"{HB}\n// The hypothetical presets' caption facts (message 555 (f)): the build LP's pace, iron-air built to the preset's year (MW), the CO2 cap (Mt a year)\n"
        f"// and its first year (co2CapAbout: a calibration target, message 599 (a)), or the first fossil-free year; the highest mean unserved\n"
        f"// energy (GWh) and open-cycle share in any year of the engine check, for NTCSA's two criteria (message 600 (b))\nconst HYPO_PRESETS = {j(hyp)};\n{HE}")
if replace_block(new, HB, HE, hblk) is not None:
    new = replace_block(new, HB, HE, hblk)
else:
    anchor = "const _gw = mw => String(+(mw / 1000).toFixed(1));"
    if new.count(anchor) != 1: raise SystemExit('caption anchor not found once')
    new = new.replace(anchor, hblk + '\n' + anchor, 1)
if '--check' in sys.argv:
    print('index.html blocks match the generator' if new == html else 'index.html blocks DIFFER from the generator'); sys.exit(0 if new == html else 1)
open('index.html', 'w').write(new)
