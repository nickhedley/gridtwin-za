"""729: a regional cap on the freed-coal connection credit. For a dump (a build's year state) and a control LP file: retired coal MW by area
(the page's UC_FLEET units with decommissioning year <= the year, scaled to the engine's coalDecomMW), the new plants by area on the
approved-record shares (718 (e)'s siting) and on the LP's chosen siting, the MW of the national pool usable in the same area and in the
same or a neighbouring area (a transportation LP over the corridor graph), rand a year at R364 per kW-year, against the pool the run
takes. usage: python3 rpcap.py <dump> <root> <control json>"""
import sys, os, json, re, numpy as np
from scipy.optimize import linprog
S = '/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad/'
dump, root, ctrl = sys.argv[1:4]; RATE = 364.0  # R per kW-year, the integration charge the mix cases use
src = open(S + 'sc/pypsa_net.py').read(); cut = src.index('roofT = sum(roof_r.values())')
os.environ['MIX'] = '1'; sys.argv = ['pypsa_net.py', dump, root, 'nolimit', 'reea', '/dev/null', '0', '1']
ns = {'__file__': S + 'sc/pypsa_net.py', '__name__': 'pypsa_net_prefix'}; exec(src[:cut], ns)
REG, uc, CORR, site, s, p = ns['REG'], ns['uc'], ns['CORR'], ns['site'], ns['s'], ns['p']
ser_p, ser_w, nat = ns['ser_pnew'], ns['ser_wnew'], ns['nat_avail']
N_w, N_p = ns['N_w'], ns['N_p']
Y = int(s['scenarioYear']); D = json.load(open(dump))
retired_u = [u for u in uc if (9999 if u['decom'] == 'beyond 2050' else int(u['decom'])) <= Y]
raw = {r: sum(u['cap'] for u in retired_u if u['region'] == r) for r in REG}; rawT = sum(raw.values())
freed = {r: s['coalDecomMW'] * raw[r] / rawT for r in REG}   # the engine's cumulative retirement, by the fleet list's regional shares
batt_site = {'North West': 692 / 1744, 'Free State': 616 / 1744, 'Northern Cape': 436 / 1744}; gas_bus = 'Kwazulu Natal'; ps_bus = 'Limpopo'
newPs = float(s.get('newPsMW') or 0); ocgt = float(s['newOcgtMW'] + s.get('newOcgdMW', 0)); ccgt = float(s['newCcgtMW'])
def shares_siting():
    new = {r: {} for r in REG}
    for r in REG:
        new[r]['wind'] = s['newWindMW'] * site['wind'][r]; new[r]['pv'] = s['newPvMW'] * site['solar'][r]; new[r]['batt'] = s['newBattMW'] * batt_site.get(r, 0.0)
        new[r]['gas'] = (ocgt + ccgt) if r == gas_bus else 0.0; new[r]['phes'] = newPs if r == ps_bus else 0.0
    return new
def lp_siting():
    m = json.load(open(ctrl))['mix']; new = {r: {} for r in REG}
    for r in REG:
        new[r]['wind'] = m['windMW'].get(r, 0.0); new[r]['pv'] = m['pvMW'].get(r, 0.0); new[r]['batt'] = m['battMW'].get(r, 0.0); new[r]['gas'] = m['ocgtMW'].get(r, 0.0) + (ccgt if r == gas_bus else 0.0); new[r]['phes'] = newPs if r == ps_bus else 0.0
    return new
adj = {r: {r} for r in REG}
for a, b, l, km in CORR: adj[a].add(b); adj[b].add(a)
def usable(new, techs, neighbours):
    elig = {r: sum(new[r][t] for t in techs) for r in REG}
    same = sum(min(freed[r], elig[r]) for r in REG)
    if not neighbours: return same, elig
    pairs = [(r, q) for r in REG for q in REG if q in adj[r]]; n = len(pairs)
    A = []; b = []
    for r in REG: A.append([1.0 if pr == r else 0.0 for pr, pq in pairs]); b.append(freed[r])        # a freed site's MW
    for q in REG: A.append([1.0 if pq == q else 0.0 for pr, pq in pairs]); b.append(elig[q])         # an area's eligible new MW
    res = linprog(c=[-1.0] * n, A_ub=np.array(A), b_ub=np.array(b), bounds=[(0, None)] * n, method='highs'); assert res.status == 0, res.message
    return -res.fun, elig
pool = float(sum(s.get('gridRpMW', {}).values())) if isinstance(s.get('gridRpMW'), dict) else 0.0
print('New-solar capacity factor by area (the regional tracking series as scaled; national ' + f"{float(nat['pv_new'].mean() / N_p):.3f}" + '): ' + ', '.join(f'{r} {float(ser_p[r].mean()):.3f}' for r in sorted(REG, key=lambda r: -float(ser_p[r].mean()))) + '; new wind: ' + ', '.join(f'{r} {float(ser_w[r].mean()):.3f}' for r in sorted(REG, key=lambda r: -float(ser_w[r].mean()))))
print(f"Build {D['build']}, {Y}: coal retired {s['coalDecomMW']:,.0f} MW of {p['coalInstalledMW']:,.0f} (the fleet list's retired units {rawT:,.0f} MW, scaled); the run's pool {pool:,.0f} MW ({', '.join(f'{k} {v:,.0f}' for k, v in (s.get('gridRpMW') or {}).items())}) = R{pool * RATE / 1e6:.2f}bn a year at R{RATE:.0f} per kW-year; new wind {s['newWindMW']:,.0f}, solar {s['newPvMW']:,.0f}, lithium {s['newBattMW']:,.0f}, gas {ocgt + ccgt:,.0f}, pumped storage {newPs:,.0f} MW.")
print()
print('| area | coal retired MW | new MW, approved-record shares (wind; solar, lithium, gas, pumped) | new MW, LP siting (wind; solar, lithium, gas, pumped) | neighbours |')
print('|---|---|---|---|---|')
A_s, A_l = shares_siting(), lp_siting()
for r in sorted(REG, key=lambda r: -freed[r]):
    f = lambda new: f"{new[r]['wind']:,.0f}; {new[r]['pv']:,.0f}, {new[r]['batt']:,.0f}, {new[r]['gas']:,.0f}, {new[r]['phes']:,.0f}"
    print(f"| {r} | {freed[r]:,.0f} | {f(A_s)} | {f(A_l)} | {', '.join(sorted(adj[r] - {r}))} |")
print()
print('| siting | rule | eligible new MW (solar, gas, pumped storage; wind where allowed; no lithium) | usable in the same area, MW (R bn a year) | removed by a same-area cap, R bn a year | usable in the same or a neighbouring area, MW (R bn a year) | removed by a neighbour cap, R bn a year | the run takes, MW (R bn a year) |')
print('|---|---|---|---|---|---|---|---|')
for lab, new in (('approved-record shares', A_s), ("the LP's choice (control)", A_l)):
    for rule, techs in (('pathway (wind barred)', ('pv', 'gas', 'phes')), ("the page's (wind allowed)", ('wind', 'pv', 'gas', 'phes'))):   # lithium pays no grid charge in the build LP and cannot use the credit (user, message 732)
        same, elig = usable(new, techs, False); nb, _ = usable(new, techs, True)
        print(f"| {lab} | {rule} | {sum(elig.values()):,.0f} | {same:,.0f} (R{same * RATE / 1e6:.2f}bn) | R{(pool - min(same, pool)) * RATE / 1e6:.2f}bn | {nb:,.0f} (R{nb * RATE / 1e6:.2f}bn) | R{(pool - min(nb, pool)) * RATE / 1e6:.2f}bn | {pool:,.0f} (R{pool * RATE / 1e6:.2f}bn) |")
