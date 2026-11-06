"""Assemble the message 753 section: section_753.md with tables753.md, geocheck_summary.md and read_753c.md; with --doc, replace or append in
docs/regional-audit.md."""
import re, sys
S = '/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad/'
DOC = '/home/user/gridtwin-za/docs/regional-audit.md'
txt = open(S + 'section_753.md').read()
t = open(S + 'tables753.md').read(); t = t.split('\n', 2)[2].strip() if t.startswith('###') else t.strip()
txt = txt.replace('<<TABLE_753A>>', t)
for k, f, d in (('GEOCHECK', 'geocheck_summary.md', 'the check is running; its summary follows.'), ('SENS_753', 'read_753c.md', 'Results: pending (queue22 runs after the 7 Nov reports).')):
    try: v = open(S + f).read().strip()
    except FileNotFoundError: v = d
    txt = txt.replace('<<' + k + '>>', v)
left = re.findall(r'<<[A-Z_0-9]+>>', txt)
open(S + 'section_753_filled.md', 'w').write(txt); print('filled; left:', left, 'length', len(txt))
if '--doc' in sys.argv:
    doc = open(DOC).read()
    m = re.search(r'\n## Message 753:.*?(?=\n## Message |\Z)', doc, re.S)
    doc = (doc[:m.start()] + '\n' + txt.strip() + '\n' + doc[m.end():]) if m else (doc.rstrip('\n') + '\n\n' + txt.strip() + '\n')
    open(DOC, 'w').write(doc); print('doc updated', 'replaced' if m else 'appended', len(doc))
