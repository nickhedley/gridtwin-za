"""727 (a): the control's gap split. One row per case and state: the control (per-area series, approved caps), area caps lifted, one bus on the
national series, wind forced to the run's MW; wind, solar, lithium and cost (new build, fuel and carbon, unserved at the value of lost load)."""
import json, glob, os
S = '/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad/'
VOLL = json.load(open(S + 'engine_final_2035_wy2025.json'))['p']['voll']
CASES = [('control', 'control (per-area series, approved caps)'), ('control_nocap', 'area caps lifted'), ('control_onebus', 'one bus on the national series, no caps'), ('control_runwind', "wind forced to the run's MW")]
print('| year, weather year | case | wind GW (run) | solar GW (run) | lithium GW, GWh (run) | open cycle GW (run) | coal TWh | curtailed TWh | cost R bn | gap to the run R bn |')
print('|---|---|---|---|---|---|---|---|---|---|')
for y in (2035, 2040):
    for wy in (2025, 2015):
      for blk in ('h3', 'h6'):   # the 6-hour-block set only where it was run (2040, weather 2015: the 3-hour one-bus case did not fit a window)
        if blk == 'h6' and not os.path.exists(S + f'net_final_{y}_wy{wy}_nolimit_reea_l0_c1_mix_control_h6.json'): continue
        run = None
        for key, lab0 in CASES:
            lab = lab0 + (' (6-hour blocks)' if blk == 'h6' else '')
            fn = S + f'net_final_{y}_wy{wy}_nolimit_reea_l0_c1_mix_{key}_{blk}.json'
            if not os.path.exists(fn): print(f'| {y}, {wy} | {lab} | pending | | | | | | | |'); continue
            d = json.load(open(fn)); m = d['mix']; t = m['totals']; c = m['costs']; ru = m['run']
            cap = (t['windMW'] * c['wind'] + t['pvMW'] * c['pv'] + t['battMW'] * c['batt'] + t['battMWh'] * c['battE'] + t['ocgtMW'] * c['ocgt']) / 1e9
            cost = cap + d['fuelAndCarbonRbn'] + d['unservedGWh'] * 1e3 * VOLL / 1e9
            if run is None:
                rf = S + f'net_final_{y}_wy{wy}_nolimit_reea_l0_c1_{blk}.json'
                if not os.path.exists(rf): print(f"| {y}, {wy} | the run's fixed build in 6-hour blocks | pending (queue10d) | | | | | | | |"); break
                r = json.load(open(rf))
                run = (ru['windMW'] * c['wind'] + ru['pvMW'] * c['pv'] + ru['battMW'] * c['batt'] + ru['battMWh'] * c['battE'] + ru['ocgtMW'] * c['ocgt']) / 1e9 + r['fuelAndCarbonRbn'] + r['unservedGWh'] * 1e3 * VOLL / 1e9
            coal = d['E_TWh'].get('coal', 0); coal = sum(coal.values()) if isinstance(coal, dict) else coal
            curt = d['curtailedTotalTWh']; curt = sum(curt.values()) if isinstance(curt, dict) else curt
            print(f"| {y}, {wy} | {lab} | {t['windMW'] / 1e3:.1f} ({ru['windMW'] / 1e3:.1f}) | {t['pvMW'] / 1e3:.1f} ({ru['pvMW'] / 1e3:.1f}) | {t['battMW'] / 1e3:.1f}, {t['battMWh'] / 1e3:.0f} ({ru['battMW'] / 1e3:.1f}, {ru['battMWh'] / 1e3:.0f}) | {t['ocgtMW'] / 1e3:.2f} ({ru['ocgtMW'] / 1e3:.2f}) | {coal:.1f} | {curt:.1f} | {cost:.1f} | {run - cost:.1f} |")
            print('    wind by area GW: ' + ', '.join(f"{k} {v / 1e3:.1f}" for k, v in sorted(m['windMW'].items(), key=lambda x: -x[1]) if v > 50) + '; solar: ' + ', '.join(f"{k} {v / 1e3:.1f}" for k, v in sorted(m['pvMW'].items(), key=lambda x: -x[1]) if v > 50))
