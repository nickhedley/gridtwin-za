#!/usr/bin/env python3
# The IRP's demand path for c6's IRP pair. Each year the model's customer demand (the 2026 demand profile x index, plus the contracted
# smelter block) is set from the IRP's own forecast, converted to the model's demand basis for definitions only.
#
# Basis 'fig2' (default; user, 24 Oct 2026, message 370 (a), replacing 367 (c)): IRP 2025's Moderate forecast as published, digitised
# from its Figure 2 (public_data/irp2025_fig2_moderate.json), at the IRP's own level and growth, not re-anchored to the model's 2026:
# the pair tests the IRP's build at the demand the IRP planned for. Conversion, definitions only:
#   customer demand = COVERAGE x (IRP total - exports - other onsite generation - distributed PV at its 2026 level)
# - exports, other onsite generation and distributed PV from ESRG's split of the same forecast (public_data/esrg_irp_demand_ref.json,
#   ESRG, CC BY 4.0; ESRG built the IRP's forecast, IRP 2025 p.10 fn 9): the figure's 2024 value (238.3 TWh) matches ESRG's Mode 1
#   total of those four parts (239.2), so the figure is read on that basis. The model carries its own firm exports; other onsite
#   generation (Sasol and others) is not grid demand; distributed PV growth after 2026 stays in demand, as c6's central path keeps it
#   (index_vs_2026 is domestic grid plus distributed PV), with rooftop modelled as supply.
# - COVERAGE 0.951: Eskom's 2025 domestic grid demand over Stats SA's electricity available for distribution, 194.6 of 204.6 TWh
#   (Stats SA P4141, 2025; SOURCES 'c6 inputs'; messages 318-319), the share the model's demand covers; held to 2040.
# Basis 'esrg' (367 (c), kept for the record): ESRG's domestic grid demand x COVERAGE.
# Run from harness/: python3 pathway/gen_irp_index.py [fig2|esrg] <block spec, e.g. 2027:930> > <out.json>
import json, sys
COVERED_TWH, P4141_TWH = 194.6, 204.6
SHARE = COVERED_TWH / P4141_TWH
args = sys.argv[1:]; basis = args.pop(0) if args and args[0] in ('fig2', 'esrg') else 'fig2'
E = json.load(open('testroot/public_data/esrg_irp_demand_ref.json'))['years']
F = json.load(open('testroot/public_data/irp2025_fig2_moderate.json'))['years']
base = sum(json.load(open('testroot/profiles.json'))['demand']) / 1e6          # TWh at index 1
blk = {int(y): float(mw) for y, mw in (p.split(':') for p in (args[0] if args else '').split(',') if p)}
blkMW = lambda y: max([mw for s, mw in blk.items() if s <= y] or [0])
out, cust_twh = {}, {}
for y in range(2026, 2041):
    e = E[str(y)]
    if basis == 'fig2':
        cust = SHARE * (F[str(y)]['twh'] * 1000 - e['exports'] - e['other_onsite'] - E['2026']['dist_pv']) / 1000
    else:
        cust = SHARE * e['domestic_grid'] / 1000
    cust_twh[str(y)] = round(cust, 2)
    out[str(y)] = (cust - blkMW(y) * 8.76 / 1000) / base
what = {'fig2': "Demand index for c6's IRP pair: model customer demand = " + f'{SHARE:.4f}' + " x (IRP 2025 Figure 2 Moderate, digitised, less "
                "ESRG's exports, other onsite generation and 2026 distributed PV), each year; the IRP's own level, not re-anchored.",
        'esrg': "Demand index for c6's IRP pair: model customer demand = ESRG IRPDemandREF domestic grid x " + f'{SHARE:.4f}' + ", each year."}[basis]
json.dump({'meta': {'what': what, 'basis': basis, 'base_TWh': base, 'share': SHARE, 'block': blk, 'customer_TWh': cust_twh,
                    'source': 'public_data/irp2025_fig2_moderate.json (IRP 2025, digitised) and public_data/esrg_irp_demand_ref.json (ESRG, CC BY 4.0)'},
           'years': out}, sys.stdout, indent=1)
