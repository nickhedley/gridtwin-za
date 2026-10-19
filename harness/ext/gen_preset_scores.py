#!/usr/bin/env python3
"""gen_preset_scores.py: writes PRESET_SCORES into index.html from a preset rescore (harness/ext/preset_rescore.js output), so a
caption that quotes a preset's measured shed reads it from the code (user, 19 Oct 2026, message 231 (3)): mean unserved energy
and the target (half the 0.002% standard on customer demand) over twelve weather years x 20 independent outage draws, as the
page runs the preset.

  python3 harness/ext/gen_preset_scores.py [--check]   (from the repository root)
"""
import json, sys
SRC = 'harness/ext/rescore_page_19c.json'
R = json.load(open(SRC))
sc = {n: {'shed': round(v['page']['shed'], 4), 'target': round(v['page']['target'], 4), 'runs': v['page']['n'], 'build': R['stamp']} for n, v in R['presets'].items()}
B = f"// BEGIN GENERATED PRESET_SCORES (harness/ext/gen_preset_scores.py from {SRC}; do not edit by hand)"
E = "// END GENERATED PRESET_SCORES"
blk = f"{B}\nconst PRESET_SCORES = {json.dumps(sc)};\n{E}"
html = open('index.html').read()
if B in html: a = html.index(B); b = html.index(E, a) + len(E); new = html[:a] + blk + html[b:]
else:
    anchor = "const _gw = mw => String(+(mw / 1000).toFixed(1));"
    if html.count(anchor) != 1: raise SystemExit('anchor not found once')
    new = html.replace(anchor, blk + '\n' + anchor, 1)
if '--check' in sys.argv: print('PRESET_SCORES matches' if new == html else 'PRESET_SCORES DIFFERS'); sys.exit(0 if new == html else 1)
open('index.html', 'w').write(new); print('written', sc)
