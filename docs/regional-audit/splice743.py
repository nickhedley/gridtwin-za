"""Assemble the message 743 section (a, b and the (c) cases from read_743a.md, read_743b.md, read_743c.md or pending notes) and, with --doc, replace or append it in docs/regional-audit.md."""
import re, sys, os
S = '/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad/'
DOC = '/home/user/gridtwin-za/docs/regional-audit.md'
def rd(f, d): return open(S + f).read().strip() if os.path.exists(S + f) else d
txt = open(S + 'section_743.md').read().replace('<<A743>>', rd('read_743a.md', 'Pending: queue20 (the LP choosing battery sites and sizes, lithium against corridors, the 8-hour steps) is running.')).replace('<<B743>>', rd('read_743b.md', 'Pending: the 2030 and 2032 states are dumped from the every-change pass when a solver slot frees, then run with the TDP lines due by then, with and without added batteries.')).replace('<<C743>>', rd('read_743c.md', 'pending (queue21).'))
left = re.findall(r'<<[A-Z_0-9]+>>', txt); open(S + 'section_743_filled.md', 'w').write(txt); print('filled; left:', left, 'length', len(txt))
if '--doc' in sys.argv:
    doc = open(DOC).read(); m = re.search(r'\n## Message 743:.*?(?=\n## Message |\Z)', doc, re.S)
    doc = (doc[:m.start()] + '\n' + txt.strip() + '\n' + doc[m.end():]) if m else (doc.rstrip('\n') + '\n\n' + txt.strip() + '\n')
    open(DOC, 'w').write(doc); print('doc updated', 'replaced' if m else 'appended', len(doc))
