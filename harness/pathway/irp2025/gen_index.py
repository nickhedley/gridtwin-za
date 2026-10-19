# Provenance (19 Oct 2026, message 229 (2)): the script that wrote harness/pathway/irp2025/index_irpdem.json (the pair's demand
# index, message 224), run in the session's scratch area; its paths are the scratch area's.
#!/usr/bin/env python3
# Message 222 (2) / 224: the IRP's demand path for the pair. Each year the model's customer demand (the 2026 demand profile x
# index, plus the 930 MW smelter block from 2027) plus its firm exports is set equal to the IRP reference's domestic grid
# demand + distributed PV + exports (ESRG IRPDemandREF Mode 1, public_data/esrg_irp_demand_ref.json). The model's firm exports
# stay at c5f's (745 MW held flat, 6.57 TWh a year as the engine delivers it), so the export gap to the IRP's 11.0 TWh is
# folded into domestic demand (user, message 224); part of the IRP's export volume reflects Mozal, suspended in March 2026.
import json, sys
S = '/tmp/claude-0/-home-user/7f3311fb-be50-5c31-9fe8-354006007a62/scratchpad'; R = f'{S}/m224/repo'
E = json.load(open(f'{R}/public_data/esrg_irp_demand_ref.json'))['years']
prof = json.load(open(f'{R}/profiles.json'))['demand']; base = sum(prof) / 1e6           # TWh at index 1
P = json.load(open(f'{S}/c5f/repo/harness/out/pathway_c5f.json')); blk = P['demand']['block']   # {"2027": 930}
G = {r['y']: r for g in 'abc' for r in json.load(open(f'{S}/c5f/gen/harness/out/m130_c5f_{g}.json'))}
exp = {y: G[y]['m139']['expFirm'] for y in G}
assert max(exp.values()) - min(exp.values()) < 0.01, exp
blkMW = lambda y: max([mw for s, mw in blk.items() if int(s) <= y] or [0])
out, rows = {}, []
for y in range(2026, 2041):
    e = E[str(y)]; irp = (e['domestic_grid'] + e['dist_pv'] + e['exports']) / 1000
    cust = irp - exp[y]; ix = (cust - blkMW(y) * 8.76 / 1000) / base
    c5f_cust = base * P['demand']['index'][str(y)] + blkMW(y) * 8.76 / 1000
    out[str(y)] = ix
    rows.append((y, irp, e['domestic_grid'] / 1000, e['dist_pv'] / 1000, e['exports'] / 1000, c5f_cust + exp[y], P['demand']['index'][str(y)], ix))
json.dump({'meta': {'what': 'Demand index for the IRP-demand pair (message 224): model customer demand + firm exports = ESRG IRPDemandREF domestic grid + distributed PV + exports, each year; exports folded into domestic demand.',
                    'base_TWh': base, 'firm_exports_TWh': exp[2030], 'block': blk, 'source': 'public_data/esrg_irp_demand_ref.json (ESRG, CC BY 4.0)'},
           'years': out}, open(f'{S}/m224/index_irpdem.json', 'w'), indent=1)
print(f'profile {base:.3f} TWh at index 1; firm exports {exp[2030]:.2f} TWh')
print('year  IRP total (dom + PV + exp)   c5f total   c5f index   pair index   change')
for y, irp, d, pv, x, c5, i0, i1 in rows:
    print(f'{y}  {irp:6.1f} ({d:.1f} + {pv:.1f} + {x:.1f})   {c5:6.1f}   {i0:.4f}   {i1:.4f}   {100*(irp/c5-1):+.1f}%')
