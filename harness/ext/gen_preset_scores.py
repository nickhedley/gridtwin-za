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
SRCS = {'Deep decarbonisation 2035': 'harness/ext/rescore_page_24b_deep_fresh.json', 'Fossil-free 2040': 'harness/ext/rescore_page_19e.json'}
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
