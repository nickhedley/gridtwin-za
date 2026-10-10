#!/usr/bin/env python3
"""build_demand_paths.py - IRP 2025 reference demand path, year by year, from UCT ESRG's demand model (9 Oct 2026).

Source: B. Merven, "ESRG Hourly Demand Model v2025 by Province", University of Cape Town, CC BY 4.0,
doi:10.25375/uct.26942134.v5, file HourlyDemandModel_v10_IRP_v02_wExports.xlsm (the IRP Update 2023-2024 revision,
report dated 10 Sep 2024, Merven and Ireland, for SANEDI). Not in this repository (58 MB); pass its path.
Sheet AnnualDashboard, scenario IRPDemandREF, sector rows at sent-out level ("Seen by grid"), years 2023-2050.

The IRP team ran the tool in "Mode 1": on-site generators are not subtracted, because the IRP's supply model
includes them. That total ("Frozen Results", IRPDemandREF Dist. PV Excluded) = domestic grid + exports + distributed
PV + other on-site generation, all at sent-out level; this script rebuilds it from the sector rows and stops if the
two differ by more than 1 GWh.

The model scales its own gross domestic demand (grid demand plus rooftop-served load; exports and non-PV on-site
generation sit outside it), so the like-for-like growth index is domestic grid + distributed PV, relative to 2026.

    python3 build_demand_paths.py <path to HourlyDemandModel_v10_IRP_v02_wExports.xlsm>
writes public_data/esrg_irp_demand_ref.json
"""
import json, sys
import openpyxl

wb = openpyxl.load_workbook(sys.argv[1], read_only=True, data_only=True, keep_vba=False)
rows = list(wb['AnnualDashboard'].iter_rows(values_only=True))
hdr = rows[5]
col = {c: i for i, c in enumerate(hdr) if isinstance(c, int) and i < 36}          # first block, F..AJ
frozen = {c: i for i, c in enumerate(hdr) if isinstance(c, int) and i >= 36}      # Frozen Results, AM..BP
assert rows[7][37] == 'IRPDemandREF Dist. PV Excluded', rows[7][37]
num = lambda v: v if isinstance(v, (int, float)) else 0
R = {r[0]: r for r in rows if r and isinstance(r[0], str)}
val = lambda lbl, y: num(R[lbl][col[y]]) if lbl in R else 0.0   # Traction has no on-site rows
SECT = ['Agriculture', 'Mining', 'Manufacturing (incl.Refineries)', 'Commerce', 'Traction', 'Residential']
out = {}
for y in sorted(c for c in col if c >= 2023):
    dom = pv = oth = 0.0
    for s in SECT:
        seen, pur = val(s + 'Seen by grid (sent out level)', y), val(s + 'Purchases from Grid', y)
        f = seen / pur if pur else 1.0                     # sent-out factor (distribution and transmission losses)
        dom += seen; pv += val(s + 'PVGeneration', y) * f; oth += val(s + 'OtherGeneration', y) * f
    exp = val('International (exports)Seen by grid (sent out level)', y)
    mode1 = num(rows[7][frozen[y]])
    if abs(dom + exp + pv + oth - mode1) > 1: sys.exit('rebuilt Mode 1 total differs from the frozen one in %d' % y)
    out[y] = {'domestic_grid': round(dom, 1), 'exports': round(exp, 1), 'dist_pv': round(pv, 1), 'other_onsite': round(oth, 1), 'mode1_total': round(mode1, 1)}
base = out[2026]['domestic_grid'] + out[2026]['dist_pv']
for y in out:
    out[y]['index_vs_2026'] = round((out[y]['domestic_grid'] + out[y]['dist_pv']) / base, 6)
json.dump({'meta': {
    'what': 'IRP 2025 reference demand (ESRG IRPDemandREF, Mode 1), GWh at sent-out level by component, and the growth index the model applies (domestic grid + distributed PV, 2026 = 1).',
    'source': 'B. Merven, ESRG Hourly Demand Model v2025 by Province, University of Cape Town, doi:10.25375/uct.26942134.v5, HourlyDemandModel_v10_IRP_v02_wExports.xlsm, sheet AnnualDashboard (IRP Update 2023-2024 revision).',
    'licence': 'CC BY 4.0 (attribution: Bruno Merven, Energy Systems Research Group, University of Cape Town)',
    'built_by': 'build_demand_paths.py, 9 Oct 2026',
    'note': 'Applied as growth on the model\'s measured 2026 base, so the model\'s levels sit about 12% below the IRP\'s own (RESULTS, 9 Oct 2026).'},
    'years': out}, open('public_data/esrg_irp_demand_ref.json', 'w'), indent=1)
print('wrote public_data/esrg_irp_demand_ref.json;', ', '.join('%d %.4f' % (y, out[y]['index_vs_2026']) for y in (2030, 2035, 2040)))
