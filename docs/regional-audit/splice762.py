"""Assemble the message 762 section; with --doc, replace or append in docs/regional-audit.md."""
import re, sys, os
S = '/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad/'
DOC = '/home/user/gridtwin-za/docs/regional-audit.md'
txt = open(S + 'section_762.md').read().replace('<<FIX_762>>', open(S + 'read_762b.md').read().strip() if os.path.exists(S + 'read_762b.md') else 'Results: pending (queue24 is running).')
open(S + 'section_762_filled.md', 'w').write(txt); print('filled; left:', re.findall(r'<<[A-Z_0-9]+>>', txt))
if '--doc' in sys.argv:
    doc = open(DOC).read(); m = re.search(r'\n## Message 762:.*?(?=\n## Message |\Z)', doc, re.S)
    doc = (doc[:m.start()] + '\n' + txt.strip() + '\n' + doc[m.end():]) if m else (doc.rstrip('\n') + '\n\n' + txt.strip() + '\n')
    open(DOC, 'w').write(doc); print('doc updated', 'replaced' if m else 'appended', len(doc))
