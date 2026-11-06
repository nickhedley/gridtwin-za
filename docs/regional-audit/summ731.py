"""731: battery against corridor on the central build. One row per state (year, weather year), network (today's corridors at one circuit dropped;
the full TDP's lines) and addition (none; lithium at the four exits; corridor additions at a price capped at the lithium step's annual cost):
curtailment, coal, gas, unserved and annual cost (fuel and carbon, unserved energy at the value of lost load, the addition's annuity).
A budget case whose budget is above the unconstrained expansion's cost was not run; the unconstrained case stands for it and is marked."""
import json, glob, os, re
S = '/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad/'
VOLL = json.load(open(S + 'engine_final_2035_wy2025.json'))['p']['voll']
tw = lambda x: sum(x.values()) if isinstance(x, dict) else x
def load(fn):
    try: return json.load(open(fn))
    except FileNotFoundError: return None
BASE = {}
def row(d, addition, annuity, extra='', base=None):
    E = d['E_TWh']; gas = tw(E.get('ccgt', 0)) + tw(E.get('ocgt', 0)) + tw(E.get('diesel', 0))
    cost = d['fuelAndCarbonRbn'] + d['unservedGWh'] * 1e3 * VOLL / 1e9 + annuity
    if base is None: return f"| {addition} | {tw(d['curtailedTotalTWh']):.1f} | {tw(E.get('coal', 0)):.1f} | {gas:.2f} | {d['unservedGWh']:.1f} | {d['fuelAndCarbonRbn']:.2f} | {annuity:.2f} | - | - | - | {cost:.2f} |{extra}"
    sf = base['fuelAndCarbonRbn'] - d['fuelAndCarbonRbn']; su = (base['unservedGWh'] - d['unservedGWh']) * 1e3 * VOLL / 1e9
    return f"| {addition} | {tw(d['curtailedTotalTWh']):.1f} | {tw(E.get('coal', 0)):.1f} | {gas:.2f} | {d['unservedGWh']:.1f} | {d['fuelAndCarbonRbn']:.2f} | {annuity:.2f} | {sf:.2f} | {su:.2f} | {annuity - sf - su:.2f} |  {cost:.2f} |{extra}"
print('### 731: battery against corridor (build 2026-11-05f, the every-change pass; the rebuilt corridor table, N-1 once, corridors at the run\'s 0.071; fixed build, hourly, no commitment floor, losses off; lithium at the four exits in equal shares at the build\'s own lithium costs; corridor additions capped at the same annual cost)')
for y in (2035, 2040):
    for wy in (2025, 2015):
        for net, lab, sfx in (('nm1', "today's corridors (the rebuilt table, N-1 once)", '_v2'), ('nm1tdp', "the TDP's lines (the rebuilt table, N-1 once; tdp_lines_v2.json)", '_v2tdp'), ('n1c', "today's corridors (the old table, one circuit dropped; superseded)", ''), ('n1ctdp', "the TDP's lines (the old table, one circuit dropped, full TDP; superseded)", '_tdpfull')):
            base = load(S + f'net_final_{y}_wy{wy}_{net}_reea_l0_c0{sfx}.json')
            if base is None: continue
            rows = [row(base, 'none', 0.0)]; B = base
            for fn in sorted(glob.glob(S + f'net_final_{y}_wy{wy}_{net}_reea_l0_c0{sfx}_li*g*h.json'), key=lambda f: (int(re.search(r'_li(\d+)g', f).group(1)), int(re.search(r'g(\d+)h', f).group(1)))):
                d = load(fn); b = d['battAdded']; rows.append(row(d, f"lithium {b['MW'] / 1e3:.0f} GW at {b['hours']:g} h", b['annualRbn'], base=B))
                for px, psfx in ((10000, '_ext10k'), (21700, '_ext21k')):
                    m = re.search(r'_li(\d+)g(\d+)h', fn); bfn = S + f'net_final_{y}_wy{wy}_{net}_reea_l0_c0{sfx}{psfx}_b{m.group(1)}g{m.group(2)}h.json'
                    e = load(bfn); mark = ''
                    if e is None:
                        u = load(S + f'net_final_{y}_wy{wy}_{net}_reea_l0_c0{sfx}{psfx}.json')
                        if u is None or u['expansionTotal']['annualRbn'] > b['annualRbn'] + 1e-6: continue
                        e = u; mark = ' (the unconstrained expansion, whose cost is below the budget)'
                    ex = sorted(e['expansion'], key=lambda r: -r['addMW'])
                    rows.append(row(e, f"corridors at R{px:,} per MW-km for the same R{b['annualRbn']:.2f}bn: {e['expansionTotal']['MW'] / 1e3:.1f} GW" + mark, e['expansionTotal']['annualRbn'], ' ' + '; '.join(f"{r['a']} to {r['b']} {r['addMW'] / 1e3:.1f}" for r in ex if r['addMW'] > 300), base=B))
            for fn in sorted(glob.glob(S + f'net_final_{y}_wy{wy}_{net}_reea_l0_c0{sfx}_battfree*.json')):
                d = load(fn); b = d['battFree']; ex = d.get('expansionTotal', {}); lab = f"the LP's own lithium: {b['MW'] / 1e3:.1f} GW / {b['MWh'] / 1e3:.0f} GWh (" + ', '.join(f"{k} {v / 1e3:.1f}" for k, v in sorted(b['byAreaMW'].items(), key=lambda x: -x[1]) if v > 50) + ')' + (f"; with corridors at R21,700 too: {ex['MW'] / 1e3:.1f} GW of corridor for R{ex['annualRbn']:.2f}bn" if ex.get('MW') else '')
                rows.append(row(d, lab, b['annualRbn'] + ex.get('annualRbn', 0), ' ' + '; '.join(f"{r['a']} to {r['b']} {r['addMW'] / 1e3:.1f}" for r in sorted(d['expansion'], key=lambda r: -r['addMW']) if r['addMW'] > 300) if ex.get('MW') else '', base=B))
            if len(rows) == 1: continue
            print(f'\n{y}, weather {wy}, {lab}\n\n| addition | curtailed TWh | coal TWh | gas and diesel TWh | unserved GWh | fuel and carbon R bn | addition, gross R bn a year | saves in fuel and carbon | saves in unserved energy at the value of lost load | net cost R bn a year | annual cost R bn | corridors built |\n|---|---|---|---|---|---|---|---|---|---|---|---|')
            print('\n'.join(rows))
print("\n### The LP's chosen lithium by area where the free mix gives it (718 (f) cases; block length stated)\n")
print('| year, weather year | case | blocks | lithium GW, GWh | by area GW |\n|---|---|---|---|---|')
for fn in sorted(glob.glob(S + 'net_final_*_mix_*_h3.json')) + sorted(glob.glob(S + 'net_final_*_mix_*_h6.json')):
    d = load(fn); m = d['mix']; t = m['totals']; nm = os.path.basename(fn).replace('net_final_', '').replace('.json', '')
    print(f"| {d['year']}, {d['weatherYear']} | {nm} | {d['timing'].get('hstep', 1)} h | {t['battMW'] / 1e3:.1f}, {t['battMWh'] / 1e3:.0f} | " + ', '.join(f"{k} {v / 1e3:.1f}" for k, v in sorted(m['battMW'].items(), key=lambda x: -x[1]) if v > 50) + ' |')
