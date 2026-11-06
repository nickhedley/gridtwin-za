"""727 (b): new wind's supply curve by area: the approved capacity (REEA, status Approved) in order of the regional series' capacity factor as
the ten-area LP sees it, cumulative, beside the engine's national new-wind series, and where each control's LP choice sits. Runs the
loading part of pypsa_net.py (up to the series) for a dump and prints a markdown table. usage: python3 wind_curve.py <dump> <root> [<control json> ...]"""
import sys, json, os, numpy as np
S = '/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad/'
dump, root = sys.argv[1], sys.argv[2]; ctrls = sys.argv[3:]
src = open(S + 'sc/pypsa_net.py').read(); cut = src.index('roofT = sum(roof_r.values())')
os.environ['MIX'] = '1'; sys.argv = ['pypsa_net.py', dump, root, 'nolimit', 'reea', '/dev/null', '0', '1']
ns = {'__file__': S + 'sc/pypsa_net.py', '__name__': 'pypsa_net_prefix'}; exec(src[:cut], ns)
REG, ser, nat, N_w, REEA = ns['REG'], ns['ser_wnew'], ns['nat_avail'], ns['N_w'], ns['REEA_MW']
wmod_r, wpu, k = ns['wmod_r'], ns['wpu'], ns['k']
natcf = float(nat['wind_new'].mean() / N_w); excf = float(ns['wind_pu'].mean())
rows = sorted(((r, float(ser[r].mean()), float(wmod_r[r].mean()), REEA['wind'].get(r, 0.0)) for r in REG), key=lambda x: -x[1])
taken = {}
for c in ctrls:
    d = json.load(open(c)); taken[os.path.basename(c)] = d['mix']['windMW']
print(f"national new-wind series (the engine's, {os.path.basename(dump)}): capacity factor {natcf:.4f}; existing-fleet series {excf:.4f}; the regional series are scaled so that the approved-share fleet's energy equals the national series' (factor in the case notes)")
print('| area | capacity factor, regional series as scaled | unscaled modern-turbine series | approved MW | cumulative MW | ' + ' | '.join('LP wind MW, ' + k.replace('net_final_', '').replace('_nolimit_reea_l0_c1_mix_control', '').replace('.json', '') for k in taken) + ' |')
print('|---|---|---|---|---|' + '---|' * len(taken))
cum = 0.0
for r, cf, cfu, mw in rows:
    cum += mw
    print(f"| {r} | {cf:.3f} | {cfu:.3f} | {mw:,.0f} | {cum:,.0f} | " + ' | '.join(f"{taken[k].get(r, 0.0):,.0f}" for k in taken) + ' |')
print('| total | | | ' + f"{cum:,.0f} | | " + ' | '.join(f"{sum(taken[k].values()):,.0f}" for k in taken) + ' |')
