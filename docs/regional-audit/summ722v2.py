"""722 (a) on the rebuilt table (738): the Fossil-free and Deep stand-ins (build 2026-11-03a) and the central build, 2035 and 2040, weather 2025:
no limits, the old table's N-1 row, the rebuilt table N-1 once and limits only, the TDP's lines (tdp_lines_v2.json), corridors priced at R10,000 and
R21,700 at 0.071. Columns as 722 (a)."""
import json
S = '/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad/'
tw = lambda x: sum(x.values()) if isinstance(x, dict) else x
def load(fn):
    try: return json.load(open(S + fn))
    except FileNotFoundError: return None
def row(lab, d):
    E = d['E_TWh']; ex = d.get('expansionTotal', {})
    exs = (f"{ex['MW'] / 1e3:,.1f} GW, R{ex['annualRbn']:.2f}bn: " + '; '.join(f"{r['a']} to {r['b']} {r['addMW'] / 1e3:.1f}" for r in sorted(d['expansion'], key=lambda r: -r['addMW']) if r['addMW'] > 300)) if ex.get('MW') else '-'
    b = '; '.join(f"{f['a']} to {f['b']} ({f['bindingHours']} h, R{f['shadowRperMWyr'] / 1e6:.1f}m)" for f in sorted(d['corridors'], key=lambda x: -x['shadowRperMWyr']) if f['bindingHours'] >= 4000)[:300] or 'none over 4,000 h'
    return f"| {lab} | {tw(d['curtailedTotalTWh']):.1f} | {d['unservedGWh']:,.0f} | {tw(E.get('coal', 0)):.1f} | {tw(E.get('ccgt', 0)) + tw(E.get('ocgt', 0)):.2f} | {tw(E.get('diesel', 0)):.2f} | {tw(d['storageDischargeTWh']):.1f} | {d['fuelAndCarbonRbn']:.1f} | {exs} | {b} |"
print("### 722 (a) on the rebuilt corridor table (738): the three builds, weather 2025 (Fossil-free and Deep: the committed stand-ins, build 2026-11-03a; central: the every-change pass, 2026-11-05f)")
print('| build, year: case | curtailed TWh | unserved GWh | coal TWh | gas TWh | diesel TWh | storage TWh | fuel and carbon R bn | corridors built | binding corridors over 4,000 h |')
print('|---|---|---|---|---|---|---|---|---|---|')
for tag, name in (('ff', 'Fossil-free'), ('deep', 'Deep'), ('final', 'Central')):
    for y in (2035, 2040):
        p = f'net_{tag}_{y}_wy2025' if tag != 'final' else f'net_final_{y}_wy2025'
        for lab, fn in ((f'{name} {y}: no limits', f'{p}_nolimit_reea_l0_c0.json'), (f"{name} {y}: old table, PyPSA-RSA's N-1 (was 'as drawn')", f'{p}_n0_reea_l0_c0.json'), (f'{name} {y}: old table, one circuit dropped (superseded)', f'{p}_n1c_reea_l0_c0.json'), (f'{name} {y}: rebuilt, limits only', f'{p}_thermal_reea_l0_c0_v2.json'), (f'{name} {y}: rebuilt, N-1 once', f'{p}_nm1_reea_l0_c0_v2.json'), (f"{name} {y}: rebuilt, the TDP's lines", f'{p}_nm1tdp_reea_l0_c0_v2tdp.json'), (f'{name} {y}: rebuilt, corridors at R10,000', f'{p}_nm1_reea_l0_c0_v2_ext10k.json'), (f'{name} {y}: rebuilt, corridors at R21,700', f'{p}_nm1_reea_l0_c0_v2_ext21k.json')):
            d = load(fn); print(row(lab, d) if d else f'| {lab} | pending | | | | | | | | |')
