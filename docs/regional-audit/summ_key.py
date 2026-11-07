"""782: the 8 Nov key's central (not a final build) through the 738 (b) case list and 762 (b)'s two fixes on the table of record, beside the fin basis
(build 2026-11-05f, the every-change pass). Fixed build, weather 2025, one seed. Cost = fuel and carbon + unserved energy at R12,300 then R87,000
+ any addition's annuity. Writes tables_key.md."""
import json, os
S = '/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad/'
VOLL = 87000.0; LS = 12300.0
tw = lambda x: sum(x.values()) if isinstance(x, dict) else x
def load(fn): return json.load(open(S + fn)) if os.path.exists(S + fn) else None
def unserved_by_area(d):
    out = {}
    for a, v in d.get('byAreaTWh', {}).items():
        x = v.get('unserved', 0) if isinstance(v, dict) else 0
        if x > 0.0005: out[a] = x
    return out
def bind(d, n=4):
    cs = sorted((c for c in d['corridors'] if c['capMW'] < 1e5 and c['hoursAtLimit'] > 0), key=lambda c: -c['hoursAtLimit'])[:n]
    return '; '.join(f"{c['a']} to {c['b']} {c['hoursAtLimit']:,} h, R{c['shadowRperMWyr'] / 1e6:.1f}m" for c in cs).replace('Kwazulu Natal', 'KwaZulu-Natal')
def adds(d):
    ex = d.get('expansionTotal', {}); bf = d.get('battFree') or {}
    return (f"; corridors built {ex['MW'] / 1e3:.1f} GW for R{ex['annualRbn']:.2f}bn" if ex.get('MW') else '') + (f"; lithium {bf['MW'] / 1e3:.1f} GW / {bf['MWh'] / 1e3:.0f} GWh (" + ', '.join(f"{k} {v / 1e3:.1f}" for k, v in sorted(bf['byAreaMW'].items(), key=lambda x: -x[1]) if v > 50) + ')' if bf else '')
def addcost(d): return (d.get('expansionTotal') or {}).get('annualRbn', 0) + (d.get('battFree') or {}).get('annualRbn', 0)
def costs(d): return d['fuelAndCarbonRbn'] + d['unservedGWh'] * 1e3 * LS / 1e9 + addcost(d), d['fuelAndCarbonRbn'] + d['unservedGWh'] * 1e3 * VOLL / 1e9 + addcost(d)
def row(lab, d):
    E = d['E_TWh']; gas = tw(E.get('ocgt', 0)) + tw(E.get('ccgt', 0)) + tw(E.get('diesel', 0)); u = unserved_by_area(d)
    ua = (', '.join(f"{a} {v * 1e3:,.0f}" for a, v in sorted(u.items(), key=lambda x: -x[1])) or 'none').replace('Kwazulu Natal', 'KwaZulu-Natal'); cL, cV = costs(d)
    return f"| {lab} | {tw(d['curtailedTotalTWh']):.1f} | {tw(E.get('coal', 0)):.1f} | {gas:.2f} | {d['unservedGWh']:,.1f} | {ua} | {cL:.1f} | {cV:.1f} | {bind(d) or 'none'}{adds(d)} |"
H = "| case | curtailed TWh | coal TWh | gas and diesel TWh | unserved GWh | unserved by area, GWh | cost at R12,300 R bn | cost at R87,000 | binding corridors (hours; R m per MW-year); additions |\n|---|---|---|---|---|---|---|---|---|"
out = ["### 782: the 8 Nov key's central (build 2026-11-05h plus the key patch; LP key f60aa29e49) beside the fin basis (2026-11-05f) on the table of record; fixed build, weather 2025, one seed", "", "The fleets as dumped (the national engine's own run, one seed, weather 2025):", "",
       "| build | year | wind MW | utility solar MW | rooftop MW | lithium MW | closed cycle MW | diesel MW | engine unserved MWh |", "|---|---|---|---|---|---|---|---|---|"]
for p, pl in (('engine_final', 'fin basis 05f'), ('engine_key', "the key's central")):
    for y in (2035, 2040):
        d = load(f'{p}_{y}_wy2025.json'); c = d['caps']
        out.append(f"| {pl} | {y} | {c['windCap']:,.0f} | {c['pvCap']:,.0f} | {c['rooftopCap']:,.0f} | {c['battPower']:,.0f} | {c['ccgtCap']:,.0f} | {d['dieselCap']:,.0f} | {d['shedMWh']:,.0f} |")
out.append('')
CASES = [('no limits', 'nolimit_reea_l0_c0', '', ''), ("N-1 once, today's corridors", 'nm1_reea_l0_c0', '_v3', ''), ('limits only', 'thermal_reea_l0_c0', '_v3', ''), ("the TDP's lines, N-1 once", 'nm1tdp_reea_l0_c0', '_v3tdp', ''),
         ('corridors priced at R10,000', 'nm1_reea_l0_c0', '_v3_ext10k', ''), ('corridors priced at R21,700', 'nm1_reea_l0_c0', '_v3_ext21k', ''), ('free siting', 'nm1_reea_l0_c0', '_v3_sitefree', ''), ('N-1 once, commitment floor', 'nm1_reea_l0_c1', '_v3', '')]
for y in (2035, 2040):
    out += [f"{y}, the 738 (b) cases, hourly", "", H]
    for lab, mid, sfx, _ in CASES:
        for pfx, ksfx, pl in (('net_final', '', 'fin basis'), ('net_key', '_key', 'the key')):
            s = sfx if pfx == 'net_final' else sfx.replace('_v3', '_key_v3', 1)
            d = load(f'{pfx}_{y}_wy2025_{mid}{s}.json')
            out.append(row(f"{lab}, {pl}", d) if d else f"| {lab}, {pl} | pending | | | | | | | |")
    out.append('')
# 762 (b)'s two fixes, both years, the key only (the fin basis has 2040 in 762 (b))
out += ["The 762 (b) fixes on the key's central (the TDP's lines, table of record; 3-hour blocks against a block base, the corridor case hourly as well). Net is the addition's annuity less the fuel and carbon saved less the unserved energy saved at R12,300, then at R87,000.", ""]
for y in (2035, 2040):
    out += [f"| case ({y}, the TDP's lines, the key's central) | curtailed TWh | coal TWh | unserved GWh (by area) | addition | gross R bn a year | fuel and carbon saved | unserved energy saved | net at R12,300 | net at R87,000 |", '|---|---|---|---|---|---|---|---|---|---|']
    bH = load(f'net_key_{y}_wy2025_nm1tdp_reea_l0_c0_key_v3tdp.json'); b3 = load(f'net_key_{y}_wy2025_nm1tdp_reea_l0_c0_key_v3tdp_h3.json')
    def fixrow(lab, d, base):
        E = d['E_TWh']; u = unserved_by_area(d); ua = (', '.join(f"{a} {v * 1e3:,.0f}" for a, v in sorted(u.items(), key=lambda x: -x[1])) or 'none').replace('Kwazulu Natal', 'KwaZulu-Natal')
        if base is None: return f"| {lab} | {tw(d['curtailedTotalTWh']):.1f} | {tw(E.get('coal', 0)):.1f} | {d['unservedGWh']:,.0f} ({ua}) | none | - | - | - | - | - |"
        ex = d.get('expansionTotal') or {}; bf = d.get('battFree') or {}
        if bf and bf['MW'] < 1: add = 'none built (nothing to clear)'
        elif bf: add = f"{bf['MW'] / 1e3:.1f} GW / {bf['MWh'] / 1e3:.0f} GWh, {bf['MWh'] / max(bf['MW'], 1):.1f} hours: " + ', '.join(f"{k} {v / 1e3:.1f}" for k, v in sorted(bf['byAreaMW'].items(), key=lambda x: -x[1]) if v > 50)
        else: add = f"{ex.get('MW', 0) / 1e3:.1f} GW: " + '; '.join(f"{r['a']} to {r['b']} {r['addMW'] / 1e3:.1f}" for r in sorted(d['expansion'], key=lambda r: -r['addMW']) if r['addMW'] > 300)
        add = add.replace('Kwazulu Natal', 'KwaZulu-Natal'); g = addcost(d); fc = base['fuelAndCarbonRbn'] - d['fuelAndCarbonRbn']; us = base['unservedGWh'] - d['unservedGWh']
        nL = g - fc - us * 1e3 * LS / 1e9; nV = g - fc - us * 1e3 * VOLL / 1e9
        f = lambda x: f"a cost of {x:.2f}" if x > 0 else f"a saving of {-x:.2f}"
        return f"| {lab} | {tw(d['curtailedTotalTWh']):.1f} | {tw(E.get('coal', 0)):.1f} | {d['unservedGWh']:,.0f} ({ua}) | {add} | {g:.2f} | {fc:.2f} | {us:,.0f} GWh | {f(nL)} | {f(nV)} |"
    for lab, fn, base in (('base, hourly', 'nm1tdp_reea_l0_c0_key_v3tdp', None), ('base, 3-hour blocks', 'nm1tdp_reea_l0_c0_key_v3tdp_h3', None),
                          ("the LP's own lithium, sited freely (3-hour blocks)", 'nm1tdp_reea_l0_c0_key_v3tdp_battfree_h3', b3), ('corridors at R21,700 per MW-km (3-hour blocks)', 'nm1tdp_reea_l0_c0_key_v3tdp_ext21k_h3', b3),
                          ('corridors at R21,700 per MW-km (hourly)', 'nm1tdp_reea_l0_c0_key_v3tdp_ext21k', bH)):
        d = load(f'net_key_{y}_wy2025_{fn}.json'); out.append(fixrow(lab, d, base) if d else f"| {lab} | pending | | | | | | | | |")
    out.append('')
open(S + 'tables_key.md', 'w').write('\n'.join(out) + '\n'); print('\n'.join(out))
