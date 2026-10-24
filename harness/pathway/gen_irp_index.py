#!/usr/bin/env python3
# The IRP's demand path for c6's IRP pair (user, 22 Oct 2026, message 324 (c); 24 Oct 2026, message 363 (c)). Each year the
# model's customer demand (the 2026 demand profile x index, plus the contracted smelter block) equals ESRG's domestic grid demand
# (IRPDemandREF Mode 1, public_data/esrg_irp_demand_ref.json, ESRG, CC BY 4.0) scaled by Eskom's 2025 coverage of Stats SA's
# electricity available for distribution: 194.6 of 204.6 TWh (Stats SA P4141, 2025; SOURCES 'c6 inputs'). No export gap is folded
# in: the model's firm exports stay as they are. The scaling assumes the coverage share holds to 2040. In 2026 the scaled path is
# 203.4 TWh against the model's 203.5.
# Run from harness/: python3 pathway/gen_irp_index.py <block spec, e.g. 2027:930> > <out.json>
import json, sys
COVERED_TWH, P4141_TWH = 194.6, 204.6
SHARE = COVERED_TWH / P4141_TWH
E = json.load(open('testroot/public_data/esrg_irp_demand_ref.json'))['years']
base = sum(json.load(open('testroot/profiles.json'))['demand']) / 1e6          # TWh at index 1
blk = {int(y): float(mw) for y, mw in (p.split(':') for p in (sys.argv[1] if len(sys.argv) > 1 else '').split(',') if p)}
blkMW = lambda y: max([mw for s, mw in blk.items() if s <= y] or [0])
out = {}
for y in range(2026, 2041):
    cust = SHARE * E[str(y)]['domestic_grid'] / 1000
    out[str(y)] = (cust - blkMW(y) * 8.76 / 1000) / base
json.dump({'meta': {'what': "Demand index for c6's IRP pair: model customer demand = ESRG IRPDemandREF domestic grid x " + f'{SHARE:.4f}' +
                    ' (194.6/204.6, Eskom 2025 coverage of Stats SA P4141), each year; no export gap folded in.',
                    'base_TWh': base, 'share': SHARE, 'block': blk, 'source': 'public_data/esrg_irp_demand_ref.json (ESRG, CC BY 4.0)'},
           'years': out}, sys.stdout, indent=1)
