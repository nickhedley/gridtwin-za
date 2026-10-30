#!/usr/bin/env python3
"""gen_lcoe_anchors.py: writes the three run-based LCOE anchor constants (LCP_2030_LI_CYCLES, LCP_2030_DSL_CF, LCP_2030_WIND_CF)
into index.html from the central run's hooked 2030 engine check (harness/pathcheck.js with LCOE=1, K=20, YEARS=2030), so the
slider notes' 'In the model's least-cost pathway in 2030' figures are read from a file, never typed (user, 29 Oct 2026, message
487 (2); before this the constants were typed from c5f's hooked check, RESULTS 'Message 236').

  python3 harness/ext/gen_lcoe_anchors.py [--check]   (from the repository root; --check: exit 1 if index.html differs)

SRC names the check file; it is committed beside this script. The block records the run, the draws and the three inputs each
constant is made from (pathcheck.js, r.lcoe): lithium cycles = discharged MWh over lithium MWh in service; diesel capacity
factor = diesel MWh over the diesel fleet x 8,760; new-wind capacity factor = the engine's wind output split pro rata between the
new fleet's uncurtailed potential and the existing fleet's, over new wind MW x 8,760.
"""
import json, sys
SRC = 'harness/ext/lcoe_c6e_2030_k20.json'
RUN = 'c6e (harness/pathway/c6e/pathway_c6e.json, build 2026-10-28a)'
r = [x for x in json.load(open(SRC)) if x['y'] == 2030][0]; L = r['lcoe']
B = f"// BEGIN GENERATED LCP_2030 (harness/ext/gen_lcoe_anchors.py from {SRC}; do not edit by hand)"
E = "// END GENERATED LCP_2030"
blk = (f"{B}\n// {RUN}, 2030 row, {r['nRuns']} runs (twelve weather years x {r['nRuns'] // 12} draws): lithium {L['battDisTWh']:.3f} TWh discharged from "
       f"{L['battMWh']:,.0f} MWh; diesel {L['dieselTWh']:.3f} TWh from {L['dieselCapMW']:,.0f} MW; new wind {L['windNewTWh']:.2f} TWh from {L['windNewMW']:,.0f} MW.\n"
       f"const LCP_2030_LI_CYCLES = {L['liCycles']:.3f}, LCP_2030_DSL_CF = {L['dslCF']:.6f}, LCP_2030_WIND_CF = {L['windNewCF']:.5f};\n{E}")
html = open('index.html').read()
if B.split('(')[0] in html:
    a = html.index(B.split('(')[0]); b = html.index(E, a) + len(E); new = html[:a] + blk + html[b:]
else:
    anchor = "const LCP_2030_LI_CYCLES = 102.688, LCP_2030_DSL_CF = 0.027045, LCP_2030_WIND_CF = 0.41707;"
    if html.count(anchor) != 1: raise SystemExit('typed LCP_2030 line not found once')
    new = html.replace(anchor, blk, 1)
if '--check' in sys.argv:
    print('LCP_2030 matches' if new == html else 'LCP_2030 DIFFERS from the generator'); sys.exit(0 if new == html else 1)
open('index.html', 'w').write(new); print('written', {k: L[k] for k in ('liCycles', 'dslCF', 'windNewCF')})
