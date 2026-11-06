"""Assemble the message 738 section (b and d from read_738b.md and read_738d.md or pending notes) and, with --doc, replace or append it in docs/regional-audit.md."""
import re, sys, os
S = '/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad/'
DOC = '/home/user/gridtwin-za/docs/regional-audit.md'
def rd(f, d): return open(S + f).read().strip() if os.path.exists(S + f) else d
txt = open(S + 'section_738.md').read().replace('<<B738>>', rd('read_738b.md', 'Pending: queue14 (the rebuilt table\'s cases) runs after the gap-split sets.')).replace('<<D738>>', rd('read_738d.md', 'Pending: queue15 (the run\'s-accounting cases) runs after queue14.'))
left = re.findall(r'<<[A-Z_0-9]+>>', txt); open(S + 'section_738_filled.md', 'w').write(txt); print('filled; left:', left, 'length', len(txt))
if '--doc' in sys.argv:
    doc = open(DOC).read(); m = re.search(r'\n## Message 738:.*?(?=\n## Message |\Z)', doc, re.S)
    doc = (doc[:m.start()] + '\n' + txt.strip() + '\n' + doc[m.end():]) if m else (doc.rstrip('\n') + '\n\n' + txt.strip() + '\n')
    open(DOC, 'w').write(doc); print('doc updated', 'replaced' if m else 'appended', len(doc))
