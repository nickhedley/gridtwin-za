"""753 (c): the report's corridor limits (2025 as today's corridors; 2035 as a stand-in for the TDP's lines) beside the rebuilt table, fixed build,
2035 and 2040, weather 2025, hourly; curtailment, coal, gas, unserved energy, cost, and the corridors at limit (the priority ranking). Writes tables753c.md."""
import json, os
S = '/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad/'
VOLL = json.load(open(S + 'engine_final_2035_wy2025.json'))['p']['voll']
tw = lambda x: sum(x.values()) if isinstance(x, dict) else x
out = ["| year | corridor limits | total MW (the 17 + Mercury) | curtailed TWh | coal TWh | gas and diesel TWh | unserved GWh | fuel and carbon R bn | cost with unserved energy at the value of lost load R bn | corridors at limit, in order (hours; shadow value R m per MW-year) |", "|---|---|---|---|---|---|---|---|---|---|"]
for y in (2035, 2040):
    for lab, fn in (("the rebuilt table, N-1 once (today's corridors)", f'net_final_{y}_wy2025_nm1_reea_l0_c0_v2.json'), ("the report's 2025 limits as today's corridors", f'net_final_{y}_wy2025_nm1_reea_l0_c0_dbsa2025.json'),
                    ("the rebuilt table with the TDP's lines, N-1 once", f'net_final_{y}_wy2025_nm1tdp_reea_l0_c0_v2tdp.json'), ("the report's 2035 limits as the stand-in for the TDP's lines", f'net_final_{y}_wy2025_nm1_reea_l0_c0_dbsa2035.json')):
        if not os.path.exists(S + fn): out.append(f'| {y} | {lab} | pending | | | | | | | |'); continue
        d = json.load(open(S + fn)); E = d['E_TWh']; gas = tw(E.get('ocgt', 0)) + tw(E.get('ccgt', 0)) + tw(E.get('diesel', 0))
        tot = sum(c['capMW'] for c in d['corridors'] if c['capMW'] < 1e5); cost = d['fuelAndCarbonRbn'] + d['unservedGWh'] * 1e3 * VOLL / 1e9
        top = sorted((c for c in d['corridors'] if c['capMW'] < 1e5 and c['hoursAtLimit'] > 0), key=lambda c: -c['hoursAtLimit'])[:6]
        out.append(f"| {y} | {lab} | {tot:,.0f} | {tw(d['curtailedTotalTWh']):.1f} | {tw(E.get('coal', 0)):.1f} | {gas:.2f} | {d['unservedGWh']:,.1f} | {d['fuelAndCarbonRbn']:.1f} | {cost:.1f} | " + '; '.join(f"{c['a']} to {c['b']} {c['hoursAtLimit']:,} h, R{c['shadowRperMWyr'] / 1e6:.1f}m" for c in top).replace('Kwazulu Natal', 'KwaZulu-Natal') + ' |')
open(S + 'tables753c.md', 'w').write('\n'.join(out) + '\n'); print('\n'.join(out))
