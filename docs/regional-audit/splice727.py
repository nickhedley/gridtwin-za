"""Assemble the message 727 section (a: table from tables727.md and read_727a.md; b; c; d) and, with --doc, replace or append it in docs/regional-audit.md."""
import re, sys
S = '/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad/'
DOC = '/home/user/gridtwin-za/docs/regional-audit.md'
a = open(S + 'section_727a.md').read().replace('<<TABLE_727A>>', open(S + 'tables727.md').read().strip())
try: ra = open(S + 'read_727a.md').read().strip()
except FileNotFoundError: ra = 'Reading: pending, the cases are in the queues (queue10a weather 2025, queue10b weather 2015).'
a = a.replace('<<READ_727A>>', ra)
head = """
## Message 727: the control's gap split, new wind's supply curve, the pending cases, sources for the corridor ratings (6 Nov 2026; nothing here is to be quoted)
"""
txt = head + a + open(S + 'section_727b.md').read() + open(S + 'section_727c.md').read() + open(S + 'section_727d.md').read()
left = re.findall(r'<<[A-Z_0-9]+>>', txt); open(S + 'section_727_filled.md', 'w').write(txt); print('filled; left:', left, 'length', len(txt))
if '--doc' in sys.argv:
    doc = open(DOC).read(); m = re.search(r'\n## Message 727:.*?(?=\n## Message |\Z)', doc, re.S)
    doc = (doc[:m.start()] + '\n' + txt.strip() + '\n' + doc[m.end():]) if m else (doc.rstrip('\n') + '\n\n' + txt.strip() + '\n')
    open(DOC, 'w').write(doc); print('doc updated', 'replaced' if m else 'appended', len(doc))
