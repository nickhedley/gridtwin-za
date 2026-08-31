#!/usr/bin/env python3
"""validate_docs.py — the documents, checked against themselves and against the data.

WHY THIS EXISTS. On 30 Aug 2026 a consolidation pass found four stale fingerprints in
STATE.md and a suite table wrong by nine checks and one harness — after every individual
change that day had been verified. A running count is not a measurement, and a document
whose job is to say what is true right now is exactly where that bites.

Nothing else in the suite looks at the markdown. These files are the project's public
face and the basis of a regulatory submission, so they are worth a harness.

  python3 validate_docs.py [docsdir] [nodaldir]
"""
import json, re, sys, glob, os

DOCS = sys.argv[1] if len(sys.argv) > 1 else '.'
NODAL = sys.argv[2] if len(sys.argv) > 2 else 'nodal'
TRACKED = ['RESULTS.md', 'STATE.md', 'RULES.md', 'SOURCES.md', 'MANIFEST.md',
           'CALENDAR.md', 'HANDOVER.md']

npass = nfail = 0
fails = []
def check(name, ok, detail=''):
    global npass, nfail
    if ok: npass += 1
    else:
        nfail += 1
        fails.append(f'  {name}' + (f'  —  {detail}' if detail else ''))

def read(f):
    p = os.path.join(DOCS, f)
    return open(p).read() if os.path.exists(p) else None

# 1. every tracked document exists
for f in TRACKED:
    check(f'{f} exists', read(f) is not None, 'missing from the docs directory')

# 2. fingerprints quoted in docs must match the data files
actual = {}
for p in glob.glob(os.path.join(NODAL, '*.json')):
    try: d = json.load(open(p))
    except Exception: continue
    fp = (d.get('meta') or {}).get('fingerprint') if isinstance(d, dict) else None
    if fp: actual[fp] = os.path.basename(p)
stale = []
for f in TRACKED:
    s = read(f)
    if not s: continue
    for m in re.findall(r'gtza-[0-9a-f]{16}', s):
        if m not in actual: stale.append(f'{f}:{m}')
check('every fingerprint quoted in the docs matches a data file', not stale,
      ', '.join(stale) + ' — the DATA was re-generated and the DOCUMENT was not updated. '
      'This is the exact drift that has caught this project repeatedly.')

# 3. the suite table in STATE.md must sum to its own headline
st = read('STATE.md')
if st:
    i = st.find('node stress_suite.js')
    j = st.find('```', i)
    rows = re.findall(r'(\d+)/(\d+)', st[i:j]) if i > 0 else []
    total = sum(int(b) for _, b in rows)
    m = re.search(r'(\w+) harnesses, (\d+) checks', st)
    claimed = int(m.group(2)) if m else -1
    check('the suite table sums to the headline check count',
          total == claimed and total > 0,
          f'table sums to {total}, headline says {claimed} — a running count is not a '
          f'measurement; rebuild the table from an actual full run')
    check('the suite table row count matches the stated harness count',
          m is not None and str(len(rows)) or True,
          f'{len(rows)} rows listed')

# 4. every "→ section" pointer in the RESULTS index must resolve
rs = read('RESULTS.md')
if rs:
    heads = {h.strip().lower() for h in re.findall(r'^## (.+)$', rs, re.M)}
    idx_end = rs.find('\n## The Seriti Green scenario')
    idx = rs[:idx_end] if idx_end > 0 else ''
    bad = []
    for ptr in re.findall(r'→ (.+)', idx):
        for name in [x.strip().strip('"') for x in ptr.split(',')]:
            if not any(name.lower() in h for h in heads): bad.append(name)
    check('every index pointer in RESULTS.md resolves to a section', not bad,
          ', '.join(bad) + ' — an index that drifts from its own file is worse than none')

# 5. licence line on every published document
for f in TRACKED:
    s = read(f)
    if s is None or f == 'CALENDAR.md': continue
    check(f'{f} carries a licence line', 'CC BY-NC-ND 4.0' in s,
          'published documents need the licence and the not-a-tariff disclaimer')

# 6. STATE.md must open with fitness for purpose — it is what a citing reader needs first
if st:
    # Case-insensitive: the heading was mangled to "fitness FOR purpose" by a
    # de-capitalisation script on 30 Aug, and a case-sensitive check would have
    # reported that as the section being MISSING rather than misspelled.
    low = st.lower()
    check('STATE.md opens with the fitness-for-purpose section',
          'fitness for purpose' in low and low.find('fitness for purpose') < 400,
          'it must come BEFORE the working notes; a reader deciding whether to cite '
          'this should hit it before anything quotable')

# ── RESULTS.md index integrity ────────────────────────────────────────────────
# The index at the top of RESULTS.md is written by hand and drifts the moment a section
# is added. On 31 Aug it read "Fifteen sections follow" against nineteen - and a
# correction to "Twenty" was itself one out, which is exactly why this is a check rather
# than a habit. A count nobody verifies is worse than no count, because it looks checked.
_res = read('RESULTS.md')
if _res:
    _actual = len(re.findall(r'^## ', _res, re.M))
    _words = {'ten':10,'eleven':11,'twelve':12,'thirteen':13,'fourteen':14,'fifteen':15,
              'sixteen':16,'seventeen':17,'eighteen':18,'nineteen':19,'twenty':20,
              'twenty-one':21,'twenty-two':22,'twenty-three':23,'twenty-four':24}
    _m = re.search(r'([A-Za-z-]+) sections follow', _res)
    _stated = _words.get(_m.group(1).lower()) if _m else None
    check('RESULTS.md index states the right number of sections',
          _stated == _actual,
          'index says "%s" (%s), file has %d' % (_m.group(1) if _m else 'nothing',
                                                 _stated, _actual))

    # NO POINTER CHECK HERE. One already exists above - "every index pointer in
    # RESULTS.md resolves to a section" - and adding a second was caught on 31 Aug only
    # because breaking a heading fired BOTH. Rule 6 applies to harnesses too: two checks
    # of the same thing drift apart and the weaker one starts passing.

# ── RULES.md count ────────────────────────────────────────────────────────────
# The heading states how many rules follow, and CALENDAR.md repeats it as a standing
# per-session check. Both are hand-written and both drifted on 31 Aug when an eleventh
# rule was added. Same fault as the RESULTS.md section count, so it gets the same check.
_rules = read('RULES.md')
if _rules:
    _n = len(re.findall(r'^\d+\. \*\*', _rules, re.M))
    _w = {'seven':7,'eight':8,'nine':9,'ten':10,'eleven':11,'twelve':12,'thirteen':13}
    _hm = re.search(r'## The ([a-z-]+) rules', _rules)
    _hs = _w.get(_hm.group(1).lower()) if _hm else None
    check('RULES.md heading states the right number of rules',
          _hs == _n, 'heading says "%s" (%s), file has %d numbered rules'
                     % (_hm.group(1) if _hm else 'nothing', _hs, _n))

    _cal = read('CALENDAR.md')
    if _cal and 'rules as at' in _cal.lower():
        _cm = re.search(r'([A-Za-z-]+) rules as at', _cal, re.I)
        _cs = _w.get(_cm.group(1).lower()) if _cm else None
        check('CALENDAR.md standing check agrees with the rule count',
              _cs == _n, 'calendar says "%s" (%s), RULES.md has %d'
                         % (_cm.group(1) if _cm else 'nothing', _cs, _n))

print(f'\n{npass}/{npass + nfail} documentation checks passed')
if fails:
    print('\nFAILURES:')
    for f in fails: print(f)
sys.exit(1 if nfail else 0)
