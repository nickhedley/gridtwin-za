"""738 (d): the control and the 727 (a) split on both accountings. The test's: every MW of new wind and solar pays the integration charge, gas pays
none, no reuse pool, no Cape allowance. The run's: new solar up to the run's reuse pool pays no integration charge, 1,580 MW of Western Cape wind
pays none (the Cape allowance), new open cycle pays it; the run's own mix is priced the same way on each. Cost = new build (less the credits taken)
plus fuel and carbon plus unserved energy at the value of lost load; the gap = the run's mix on the same blocks less the LP's."""
import json, os
S = '/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad/'
VOLL = json.load(open(S + 'engine_final_2035_wy2025.json'))['p']['voll']; INTEG = 364000.0
POOL = {2035: 14306.0, 2040: 22333.0}; CAPE = 1580.0
def load(fn):
    try: return json.load(open(S + fn))
    except FileNotFoundError: return None
def cost(d):
    m = d['mix']; t = m['totals']; c = m['costs']
    cap = (t['windMW'] * c['wind'] + t['pvMW'] * c['pv'] + t['battMW'] * c['batt'] + t['battMWh'] * c['battE'] + t['ocgtMW'] * c['ocgt']) / 1e9 - m.get('creditRbn', 0) - m.get('capeCreditRbn', 0)
    return cap + d['fuelAndCarbonRbn'] + d['unservedGWh'] * 1e3 * VOLL / 1e9
def run_cost(y, d, acct):
    ru = d['mix']['run']; c = d['mix']['costs']; r = load(f'net_final_{y}_wy2025_nolimit_reea_l0_c1_h3.json')
    ann = (ru['windMW'] * c['wind'] + ru['pvMW'] * c['pv'] + ru['battMW'] * c['batt'] + ru['battMWh'] * c['battE'] + ru['ocgtMW'] * c['ocgt']) / 1e9
    if acct == 'run': ann = ann - min(POOL[y], ru['pvMW']) * INTEG / 1e9 - CAPE * INTEG / 1e9 + (ru['ocgtMW'] * INTEG / 1e9 if d.get('gasInteg') else 0)   # the pool on its solar, the allowance on its wind, the charge on its gas; the LP's ocgt cost already carries it when gasInteg
    return ann + r['fuelAndCarbonRbn'] + r['unservedGWh'] * 1e3 * VOLL / 1e9
print("### 738 (d): the control and the split on the test's accounting and on the run's (3-hour blocks, weather 2025, no limits)")
print("| year | case | accounting | wind GW (run) | solar GW (run) | of it credited | lithium GW, GWh | open cycle GW | cost R bn | the run's mix R bn | gap R bn |")
print('|---|---|---|---|---|---|---|---|---|---|---|')
for y in (2035, 2040):
    for key, lab in (('control', 'control'), ('control_nocap', 'area caps lifted'), ('control_onebus', 'one bus on the national series'), ('control_runwind', "wind forced to the run's MW")):
        for acct, sfx in (('test', '_h3'), ('run', '_runacct_h3')):
            d = load(f'net_final_{y}_wy2025_nolimit_reea_l0_c1_mix_{key}{sfx}.json')
            if d is None: print(f"| {y} | {lab} | {'the test\'s' if acct == 'test' else 'the run\'s'} | pending | | | | | | | |"); continue
            t = d['mix']['totals']; ru = d['mix']['run']; cst = cost(d); rc = run_cost(y, d, acct)
            print(f"| {y} | {lab} | {'the test\'s' if acct == 'test' else 'the run\'s'} | {t['windMW'] / 1e3:.1f} ({ru['windMW'] / 1e3:.1f}) | {t['pvMW'] / 1e3:.1f} ({ru['pvMW'] / 1e3:.1f}) | {t.get('pvCreditMW', 0) / 1e3:.1f} | {t['battMW'] / 1e3:.1f}, {t['battMWh'] / 1e3:.0f} | {t['ocgtMW'] / 1e3:.2f} | {cst:.1f} | {rc:.1f} | {rc - cst:.1f} |")
    d = load(f'net_final_{y}_wy2025_nolimit_reea_l0_c1_mix_control_runacct_nopool_h3.json')
    if d is not None:
        t = d['mix']['totals']; ru = d['mix']['run']; cst = cost(d); rc = run_cost(y, d, 'run') + min(POOL[y], ru['pvMW']) * INTEG / 1e9
        print(f"| {y} | control without the reuse pool (the Cape allowance and the gas charge kept; 732's pair on the repriced costs) | the run's less the pool | {t['windMW'] / 1e3:.1f} ({ru['windMW'] / 1e3:.1f}) | {t['pvMW'] / 1e3:.1f} ({ru['pvMW'] / 1e3:.1f}) | 0.0 | {t['battMW'] / 1e3:.1f}, {t['battMWh'] / 1e3:.0f} | {t['ocgtMW'] / 1e3:.2f} | {cst:.1f} | {rc:.1f} | {rc - cst:.1f} |")
