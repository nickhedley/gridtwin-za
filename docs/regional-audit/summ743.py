"""743 (b) and (c): the lead-time years (2030 and 2032: no limits, today's corridors N-1 once, the TDP's lines due by then, each with 2 and 10 GW of
lithium at 4 hours added at the four exits) and the delivery-rate sets (the plan by its dates; 800 and 293 km a year, ordered by the TDP's dates and
by the priority ranking) for 2030, 2032, 2035 and 2040. Writes tables743.md."""
import json, os
S = '/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad/'
VOLL = json.load(open(S + 'engine_final_2035_wy2025.json'))['p']['voll']
LS = 12300.0   # the engine's cost of load shedding, R per MWh (costUnservedR; message 754)
tw = lambda x: sum(x.values()) if isinstance(x, dict) else x
def load(fn): return json.load(open(fn)) if os.path.exists(fn) else None
def bind(d, n=3):
    cs = sorted((c for c in d['corridors'] if c['capMW'] < 1e5), key=lambda c: -c['hoursAtLimit'])[:n]
    return '; '.join(f"{c['a']} to {c['b']} {c['hoursAtLimit']:,} h, R{c['shadowRperMWyr'] / 1e6:.1f}m per MW-year" for c in cs if c['hoursAtLimit'] > 0)
def row(lab, d, annuity=0.0, base=None, tdp=True):
    E = d['E_TWh']; gas = tw(E.get('ccgt', 0)) + tw(E.get('ocgt', 0)) + tw(E.get('diesel', 0)); tm = sum(c['tdpMW'] for c in d['corridors'])
    costL = d['fuelAndCarbonRbn'] + d['unservedGWh'] * 1e3 * LS / 1e9 + annuity; costV = d['fuelAndCarbonRbn'] + d['unservedGWh'] * 1e3 * VOLL / 1e9 + annuity
    if base is None: sv = '- | - | - | - | - | -'
    else:
        sf = base['fuelAndCarbonRbn'] - d['fuelAndCarbonRbn']; dg = base['unservedGWh'] - d['unservedGWh']; suL = dg * 1e3 * LS / 1e9; suV = dg * 1e3 * VOLL / 1e9
        nL = annuity - sf - suL; nV = annuity - sf - suV; sv = f"{sf:.2f} | {suL:.2f} | {nL:.2f} | {suV:.2f} | {nV:.2f} | {'changes' if (nL > 0) != (nV > 0) else 'same'}"
    return f"| {lab} | {tm:,.0f} | {tw(d['curtailedTotalTWh']):.1f} | {tw(E.get('coal', 0)):.1f} | {gas:.2f} | {d['unservedGWh']:.1f} | {d['fuelAndCarbonRbn']:.2f} | {annuity:.2f} | {sv} | {costL:.2f} | {costV:.2f} | {bind(d)} |"
H = "| case | TDP MW in service | curtailed TWh | coal TWh | gas and diesel TWh | unserved GWh | fuel and carbon R bn | lithium, gross R bn a year | saves in fuel and carbon | saves in unserved energy at R12,300 per MWh | net cost at R12,300, R bn a year | saves in unserved energy at R87,000 | net cost at R87,000 | sign of the net between the two | annual cost at R12,300 R bn | annual cost at R87,000 | corridors at limit (hours; shadow value) |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|"
out = ["### 743 (b): 2030 and 2032 with only the TDP's lines due by then, with and without added lithium (build 2026-11-05f, the every-change pass; weather 2025; fixed build, hourly; the rebuilt table, N-1 once; lithium at the four exits in equal shares at 4 hours, the build's own lithium costs)", ""]
for y in (2030, 2032):
    out += [f"{y}", "", H]
    nl = load(S + f'net_final_{y}_wy2025_nolimit_reea_l0_c0.json'); td = load(S + f'net_final_{y}_wy2025_nm1_reea_l0_c0_v2.json'); tp = load(S + f'net_final_{y}_wy2025_nm1tdp_reea_l0_c0_v2tdp.json')
    if nl: out.append(row('no limits', nl))
    if td: out.append(row("today's corridors (N-1 once)", td))
    for mw in (2, 10):
        d = load(S + f'net_final_{y}_wy2025_nm1_reea_l0_c0_v2_li{mw}g4h.json')
        if d: out.append(row(f"today's corridors, lithium {mw} GW at 4 h added", d, d['battAdded']['annualRbn'], base=td))
    if tp: out.append(row(f"the TDP's lines due by {y} (N-1 once)", tp))
    for mw in (2, 10):
        d = load(S + f'net_final_{y}_wy2025_nm1tdp_reea_l0_c0_v2tdp_li{mw}g4h.json')
        if d: out.append(row(f"the TDP's lines due by {y}, lithium {mw} GW at 4 h added", d, d['battAdded']['annualRbn'], base=tp))
    out.append("")
out += ["### 743 (c): the TDP's inter-area lines delivered at 800 and 293 km a year, ordered by the TDP's dates and by the priority ranking, against the plan by its dates (the same fixed builds; the sets from delivery.py, tdp_del_*.json)", ""]
H2 = "| year | set | inter-area lines in service (MW) | curtailed TWh | coal TWh | gas and diesel TWh | unserved GWh | fuel and carbon R bn | annual cost at R12,300 R bn | annual cost at R87,000 | corridors at limit (hours; shadow value) |\n|---|---|---|---|---|---|---|---|---|---|---|"
out.append(H2)
for y in (2030, 2032, 2035, 2040):
    sets = [("the plan by its dates", S + f'net_final_{y}_wy2025_nm1tdp_reea_l0_c0_v2tdp.json', S + 'tdp_lines_v2.json')]
    for rate in (800, 293):
        for ordr in ('dates', 'priority'): sets.append((f"{rate} km a year, by {ordr}", S + f'net_final_{y}_wy2025_nm1tdp_reea_l0_c0_v2tdp_del{rate}_{ordr}.json', S + f'tdp_del_{rate}_{ordr}.json'))
    for lab, fn, df in sets:
        d = load(fn)
        if not d: out.append(f"| {y} | {lab} | pending | | | | | | | |"); continue
        lines = [q for q in json.load(open(df)) if (q.get('year') or 9999) <= y]
        E = d['E_TWh']; gas = tw(E.get('ccgt', 0)) + tw(E.get('ocgt', 0)) + tw(E.get('diesel', 0)); costL = d['fuelAndCarbonRbn'] + d['unservedGWh'] * 1e3 * LS / 1e9; costV = d['fuelAndCarbonRbn'] + d['unservedGWh'] * 1e3 * VOLL / 1e9
        out.append(f"| {y} | {lab} | {len(lines)} ({sum(q['mw'] for q in lines):,}) | {tw(d['curtailedTotalTWh']):.1f} | {tw(E.get('coal', 0)):.1f} | {gas:.2f} | {d['unservedGWh']:.1f} | {d['fuelAndCarbonRbn']:.2f} | {costL:.2f} | {costV:.2f} | {bind(d)} |")
open(S + 'tables743.md', 'w').write('\n'.join(out) + '\n'); print('\n'.join(out))
