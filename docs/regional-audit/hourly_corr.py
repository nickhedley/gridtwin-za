"""738 (e): the hourly correlation of the LP's availability series (regional series at the siting shares, scaled to the engine's annual energy)
against the engine's own national series, for existing and new wind and solar. Runs the loading part of pypsa_net.py. usage: python3 hourly_corr.py <dump> <root>"""
import sys, os, numpy as np
S = '/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad/'
dump, root = sys.argv[1], sys.argv[2]
src = open(S + 'sc/pypsa_net.py').read(); cut = src.index('roofT = sum(roof_r.values())')
sys.argv = ['pypsa_net.py', dump, root, 'nolimit', 'reea', '/dev/null', '0', '0']
ns = {'__file__': S + 'sc/pypsa_net.py', '__name__': 'pypsa_net_prefix'}; exec(src[:cut], ns)
REG, nat = ns['REG'], ns['nat_avail']
series = {'existing wind': ('cap_wex', 'ser_wex', 'wind_ex'), 'new wind': ('cap_wnew', 'ser_wnew', 'wind_new'), 'existing solar': ('cap_pex', 'ser_pex', 'pv_ex'), 'new solar': ('cap_pnew', 'ser_pnew', 'pv_new')}
print(f"{os.path.basename(dump)}: | series | engine TWh | LP TWh | hourly correlation | mean absolute gap MW | TWh moved between hours |")
print('|---|---|---|---|---|---|')
tot_e = 0; tot_l = 0
for lab, (capk, serk, natk) in series.items():
    cap, ser = ns[capk], ns[serk]; lp = sum(cap[r] * ser[r] for r in REG); en = nat[natk]
    tot_e = tot_e + en; tot_l = tot_l + lp
    corr = float(np.corrcoef(lp, en)[0, 1]) if np.std(lp) > 0 and np.std(en) > 0 else float('nan')
    print(f"| {lab} | {en.sum() / 1e6:.2f} | {lp.sum() / 1e6:.2f} | {corr:.3f} | {np.abs(lp - en).mean():,.0f} | {np.clip(lp - en, 0, None).sum() / 1e6:.1f} |")
print(f"| all | {tot_e.sum() / 1e6:.2f} | {tot_l.sum() / 1e6:.2f} | {float(np.corrcoef(tot_l, tot_e)[0, 1]):.3f} | {np.abs(tot_l - tot_e).mean():,.0f} | {np.clip(tot_l - tot_e, 0, None).sum() / 1e6:.1f} |")
