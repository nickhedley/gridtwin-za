"""Assemble the message 731 section from section_731.md, tables731.md and read_731.md (or a pending note) and, with --doc, replace or append it in docs/regional-audit.md."""
import re, sys, os
S = '/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad/'
DOC = '/home/user/gridtwin-za/docs/regional-audit.md'
r = open(S + 'read_731.md').read().strip() if os.path.exists(S + 'read_731.md') else 'Reading: pending, the cases are in the queue (queue12a.sh, after 727 and 732).'
txt = open(S + 'section_731.md').read().replace('<<TABLE_731>>', open(S + 'tables731.md').read().strip()).replace('<<READ_731>>', r)
left = re.findall(r'<<[A-Z_0-9]+>>', txt); open(S + 'section_731_filled.md', 'w').write(txt); print('filled; left:', left, 'length', len(txt))
if '--doc' in sys.argv:
    doc = open(DOC).read(); m = re.search(r'\n## Message 731.*?(?=\n## Message |\Z)', doc, re.S)
    doc = (doc[:m.start()] + '\n' + txt.strip() + '\n' + doc[m.end():]) if m else (doc.rstrip('\n') + '\n\n' + txt.strip() + '\n')
    open(DOC, 'w').write(doc); print('doc updated', 'replaced' if m else 'appended', len(doc))
