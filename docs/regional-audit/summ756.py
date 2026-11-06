"""756 (c): before (the table of record, corridors_v2.json) and after (the labelled copy under the rule, corridors_v3.json): curtailment, unserved
energy by area, the binding corridors, and the cost with unserved energy at R12,300 and at R87,000 per MWh. Writes tables756.md."""
import json, os
S = '/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad/'
VOLL = 87000.0; LS = 12300.0
tw = lambda x: sum(x.values()) if isinstance(x, dict) else x
def load(fn): return json.load(open(S + fn)) if os.path.exists(S + fn) else None
def unserved_by_area(d):
    u = d.get('byAreaTWh', {}); out = {}
    for a, v in u.items():
        x = v.get('unserved', 0) if isinstance(v, dict) else 0
        if x > 0.0005: out[a] = x
    return out
def bind(d, n=4):
    cs = sorted((c for c in d['corridors'] if c['capMW'] < 1e5 and c['hoursAtLimit'] > 0), key=lambda c: -c['hoursAtLimit'])[:n]
    return '; '.join(f"{c['a']} to {c['b']} {c['hoursAtLimit']:,} h, R{c['shadowRperMWyr'] / 1e6:.1f}m" for c in cs).replace('Kwazulu Natal', 'KwaZulu-Natal')
def row(lab, d):
    E = d['E_TWh']; gas = tw(E.get('ocgt', 0)) + tw(E.get('ccgt', 0)) + tw(E.get('diesel', 0)); u = unserved_by_area(d)
    ua = ', '.join(f"{a} {v * 1e3:,.0f}" for a, v in sorted(u.items(), key=lambda x: -x[1])) or 'none'
    ex = d.get('expansionTotal', {}); bf = d.get('battFree') or {}
    extra = (f"; corridors built {ex['MW'] / 1e3:.1f} GW for R{ex['annualRbn']:.2f}bn" if ex.get('MW') else '') + (f"; lithium {bf['MW'] / 1e3:.1f} GW / {bf['MWh'] / 1e3:.0f} GWh (" + ', '.join(f"{k} {v / 1e3:.1f}" for k, v in sorted(bf['byAreaMW'].items(), key=lambda x: -x[1]) if v > 50) + ')' if bf else '')
    cL = d['fuelAndCarbonRbn'] + d['unservedGWh'] * 1e3 * LS / 1e9 + ex.get('annualRbn', 0) + bf.get('annualRbn', 0); cV = d['fuelAndCarbonRbn'] + d['unservedGWh'] * 1e3 * VOLL / 1e9 + ex.get('annualRbn', 0) + bf.get('annualRbn', 0)
    return f"| {lab} | {tw(d['curtailedTotalTWh']):.1f} | {tw(E.get('coal', 0)):.1f} | {gas:.2f} | {d['unservedGWh']:,.1f} | {ua} | {cL:.1f} | {cV:.1f} | {bind(d)}{extra} |"
H = "| case | curtailed TWh | coal TWh | gas and diesel TWh | unserved GWh | unserved by area, GWh | cost at R12,300 R bn | cost at R87,000 | binding corridors (hours; R m per MW-year); additions |\n|---|---|---|---|---|---|---|---|---|"
CASES = [("N-1 once, today's corridors", 'nm1_reea_l0_c0', ''), ('limits only', 'thermal_reea_l0_c0', ''), ("the TDP's lines, N-1 once", 'nm1tdp_reea_l0_c0', 'tdp'), ('with the Eros and Umtu lines', 'nm1tdp_reea_l0_c0', 'tdpwith'),
         ('corridors priced at R10,000', 'nm1_reea_l0_c0', '_ext10k'), ('corridors priced at R21,700', 'nm1_reea_l0_c0', '_ext21k'), ('free siting', 'nm1_reea_l0_c0', '_sitefree'), ('N-1 once, commitment floor', 'nm1_reea_l0_c1', '')]
out = ["### 756 (c): before (the table of record, v2) and after (the labelled copy under the rule, v3), fixed build, hourly, weather 2025, build 2026-11-05f", ""]
for y in (2035, 2040):
    out += [f"{y}", "", H]
    for lab, mid, sfx in CASES:
        for v, vl in (('v2', 'before'), ('v3', 'after')):
            d = load(f'net_final_{y}_wy2025_{mid}_{v}{sfx}.json')
            out.append(row(f"{lab}, {vl}", d) if d else f"| {lab}, {vl} | pending | | | | | | | |")
    if y == 2040:
        for lab, fn2, fn3 in (("3-hour base, no addition", 'net_final_2040_wy2025_nm1_reea_l0_c0_v2_h3.json', 'net_final_2040_wy2025_nm1_reea_l0_c0_v3_h3.json'), ("the LP's own lithium (3-hour blocks)", 'net_final_2040_wy2025_nm1_reea_l0_c0_v2_battfree_h3.json', 'net_final_2040_wy2025_nm1_reea_l0_c0_v3_battfree_h3.json'), ("the LP's own lithium with corridors at R21,700 (3-hour blocks)", 'net_final_2040_wy2025_nm1_reea_l0_c0_v2_battfree_ext21k_h3.json', 'net_final_2040_wy2025_nm1_reea_l0_c0_v3_battfree_ext21k_h3.json')):
            for vl, fn in (('before', fn2), ('after', fn3)):
                d = load(fn); out.append(row(f"{lab}, {vl}", d) if d else f"| {lab}, {vl} | pending | | | | | | | |")
    d = load(f'net_final_{y}_wy2025_nm1_reea_l0_c0_v3gk.json'); out.append(row('the copy with the first Gamma to Kappa 765 kV line (sensitivity)', d) if d else '| the copy with Gamma to Kappa (sensitivity) | pending | | | | | | | |')
    out.append('')
open(S + 'tables756.md', 'w').write('\n'.join(out) + '\n'); print('\n'.join(out))
