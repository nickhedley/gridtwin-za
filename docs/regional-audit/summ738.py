"""738 (b): the main cases on the rebuilt corridor table (corridors_v2.json), beside the same cases on the old table (PyPSA-RSA's N-1 table at
400 kV ratings; its 'as drawn' rows are N-1 rows and its 0.7 and one-circuit rows derate twice). Fixed build unless stated, hourly, no commitment
floor; weather 2025. Columns as 722 (a)."""
import json, glob, os
S = '/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad/'
tw = lambda x: sum(x.values()) if isinstance(x, dict) else x
def load(fn):
    try: return json.load(open(S + fn))
    except FileNotFoundError: return None
def binding(d): return '; '.join(f"{f['a']} to {f['b']} ({f['bindingHours']} h, R{f['shadowRperMWyr'] / 1e6:.1f}m)" for f in sorted(d['corridors'], key=lambda x: -x['shadowRperMWyr']) if f['bindingHours'] >= 4000)[:400] or 'none over 4,000 h'
def row(lab, d):
    E = d['E_TWh']; ex = d.get('expansionTotal', {}); exs = (f"{ex['MW'] / 1e3:,.1f} GW, R{ex['annualRbn']:.2f}bn: " + '; '.join(f"{r['a']} to {r['b']} {r['addMW'] / 1e3:.1f}" for r in sorted(d['expansion'], key=lambda r: -r['addMW']) if r['addMW'] > 300)) if ex.get('MW') else '-'
    sited = ''
    if d.get('siteFree') and d.get('sitingChosen'): sited = ' wind: ' + ', '.join(f"{k} {v:.0%}" for k, v in sorted(d['sitingChosen'].get('wind new', {}).items(), key=lambda x: -x[1]) if v > 0.02)
    return f"| {lab} | {tw(d['curtailedTotalTWh']):.1f} ({tw(d['curtailedTWh'].get('wind', 0)):.1f}, {tw(d['curtailedTWh'].get('pv', 0)):.1f}) | {d['unservedGWh']:,.0f} | {tw(E.get('coal', 0)):.1f} | {tw(E.get('ccgt', 0)) + tw(E.get('ocgt', 0)):.2f} | {tw(E.get('diesel', 0)):.2f} | {tw(d['storageDischargeTWh']):.1f} | {d['fuelAndCarbonRbn']:.1f} | {exs}{sited} | {binding(d)} |"
print("### 738 (b): the main cases on the rebuilt corridor table (build 2026-11-05f; fixed build, hourly, losses off; corridors priced at the run's 0.071; weather 2025, then 2015)")
print('| case | curtailed TWh (wind, solar) | unserved GWh | coal TWh | gas TWh | diesel TWh | storage TWh | fuel and carbon R bn | corridors built or siting | binding corridors over 4,000 h (value of one more MW, R m a year) |')
print('|---|---|---|---|---|---|---|---|---|---|')
for y, wy in ((2035, 2025), (2040, 2025), (2035, 2015), (2040, 2015)):
    cases = [(f'{y}, weather {wy}: no limits', f'net_final_{y}_wy{wy}_nolimit_reea_l0_c0.json'),
             (f"{y}, weather {wy}: old table, PyPSA-RSA's N-1 (labelled 'as drawn' before 738)", f'net_final_{y}_wy{wy}_n0_reea_l0_c0.json'),
             (f'{y}, weather {wy}: old table, one circuit dropped (a second derate)', f'net_final_{y}_wy{wy}_n1c_reea_l0_c0.json'),
             (f'{y}, weather {wy}: rebuilt table, limits only (thermal and loadability; the sensitivity)', f'net_final_{y}_wy{wy}_thermal_reea_l0_c0_v2.json'),
             (f'{y}, weather {wy}: rebuilt table, N-1 once (the central)', f'net_final_{y}_wy{wy}_nm1_reea_l0_c0_v2.json'),
             (f'{y}, weather {wy}: rebuilt table, N-1 once, commitment floor by design minimum', f'net_final_{y}_wy{wy}_nm1_reea_l0_c1_v2.json'),
             (f"{y}, weather {wy}: rebuilt table, the TDP's lines by their dates, N-1 once (Eros in KwaZulu-Natal, no Umtu line, Gamma to Grassridge twice)", f'net_final_{y}_wy{wy}_nm1tdp_reea_l0_c0_v2tdp.json'),
             (f"{y}, weather {wy}: the same with the Eros to Isundu, Ariadne to Eros and Mercury to Umtu lines (the range)", f'net_final_{y}_wy{wy}_nm1tdp_reea_l0_c0_v2tdpwith.json'),
             (f'{y}, weather {wy}: rebuilt table, corridors extendable at R10,000 per MW-km', f'net_final_{y}_wy{wy}_nm1_reea_l0_c0_v2_ext10k.json'),
             (f'{y}, weather {wy}: rebuilt table, corridors extendable at R21,700 per MW-km', f'net_final_{y}_wy{wy}_nm1_reea_l0_c0_v2_ext21k.json'),
             (f'{y}, weather {wy}: rebuilt table, free siting of new wind and solar', f'net_final_{y}_wy{wy}_nm1_reea_l0_c0_v2_sitefree.json'),
             (f"{y}, weather {wy}: old table, one circuit dropped, full TDP (for comparison)", f'net_final_{y}_wy{wy}_n1ctdp_reea_l0_c0_tdpfull.json')]
    for lab, fn in cases:
        d = load(fn); print(row(lab, d) if d else f'| {lab} | pending | | | | | | | | |')
