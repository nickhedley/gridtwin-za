#!/usr/bin/env python3
"""gen_preset_scores.py: writes PRESET_SCORES into index.html from a preset rescore (harness/ext/preset_rescore.js output), so a
caption that quotes a preset's measured shed reads it from the code (user, 19 Oct 2026, message 231 (3)): mean unserved energy
and the target (half the 0.002% standard on customer demand) over twelve weather years x 20 independent outage draws, as the
page runs the preset.

  python3 harness/ext/gen_preset_scores.py [--check]   (from the repository root)
"""
import json, sys
# Each preset from its own rescore. Deep decarbonisation 2035 was topped up on the draws of seed 71830529, so its score comes
# from a fresh, disjoint seed set (site review A1, message 252: SEED=120000017 ONLY=Deep VARIANTS=page on build 19i); Fossil-free
# 2040 had no top-up, so 214's rescore on 19e stands (message 234 (5)). 19c's is kept as the record. Deep decarbonisation 2035 was
# rebuilt on PR C's coal rules and rescored the same way on build 24b (24 Oct 2026, message 369); 19i's is kept as the record.
# Deep decarbonisation 2035 rescored on build 2026-10-29a for the presets PR on c6e (29 Oct 2026, message 485 (c); 1.43 GWh against
# 2.43 on 240 runs, seed 120000017; RESULTS 'Fossil-free 2040 sheds 132.4 GWh'). Fossil-free 2040 keeps 19e's score pending the user's
# decision on its caption (TODO 14kq): on 29a it sheds 132.4 GWh, the central having ended imports after 2030 since the preset was built.
# Fossil-free 2040 topped up on build 2026-10-29a (user, messages 487 (1) and 490; RESULTS 'Fossil-free 2040 topped up') and rescored
# on the same runs the top-up was confirmed on (seed 71830529, K=20).
# Both rescored on build 2026-10-30a, with the page applying the twelve-year rooftop add-back itself (user, 30 Oct 2026, message 518 (c);
# TODO 391 (b)), on the same seeds and K as 29a's; 29a's files are kept as the record.
# Both replaced by their optimised hypothetical builds on build 2026-10-31k (user, 31 Oct 2026, messages 537 (f) and 555) and rescored on
# the page, 240 runs each, both on the disjoint seed 120000017 (their engine checks ran on seed 71830529, K=10; rule 366, so no rescore
# shares the check's draws); 30a's files are kept as the record of the hand-searched builds.
# Deep decarbonisation 2035 replaced by the no-gas build calibrated to 40 Mt from 2035 on build 2026-11-01d (user, 1 Nov 2026, message 599 (a))
# and rescored on the page the same way (240 runs, seed 120000017): 0.78 GWh, CO2 40.10 Mt; 31k's file is kept as the record.
SRCS = {'Deep decarbonisation 2035': 'harness/ext/rescore_page_01d_deep.json', 'Fossil-free 2040': 'harness/ext/rescore_page_31k_fossil.json'}
sc = {}
for n, src in SRCS.items():
    R = json.load(open(src)); v = R['presets'][n]['page']
    sc[n] = {'shed': round(v['shed'], 4), 'target': round(v['target'], 4), 'runs': v['n'], 'build': R['stamp'], 'seed': R.get('seed', 71830529)}
SRC = ' and '.join(sorted(set(SRCS.values())))
B = f"// BEGIN GENERATED PRESET_SCORES (harness/ext/gen_preset_scores.py from {SRC}; do not edit by hand)"
E = "// END GENERATED PRESET_SCORES"
blk = f"{B}\nconst PRESET_SCORES = {json.dumps(sc)};\n{E}"
html = open('index.html').read()
# Find the block by the marker's fixed part, so a change of source replaces the block rather than adding a second one.
BP = "// BEGIN GENERATED PRESET_SCORES ("
if html.count(BP) > 1: raise SystemExit('PRESET_SCORES block found more than once')
if BP in html: a = html.index(BP); b = html.index(E, a) + len(E); new = html[:a] + blk + html[b:]
else:
    anchor = "const _gw = mw => String(+(mw / 1000).toFixed(1));"
    if html.count(anchor) != 1: raise SystemExit('anchor not found once')
    new = html.replace(anchor, blk + '\n' + anchor, 1)
if '--check' in sys.argv: print('PRESET_SCORES matches' if new == html else 'PRESET_SCORES DIFFERS'); sys.exit(0 if new == html else 1)
open('index.html', 'w').write(new); print('written', sc)
