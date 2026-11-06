"""Assemble the message 739 section (a and the km-limited case from read_739a.md and read_739km.md or pending notes) and, with --doc, replace or append it in docs/regional-audit.md."""
import re, sys, os
S = '/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad/'
DOC = '/home/user/gridtwin-za/docs/regional-audit.md'
def rd(f, d): return open(S + f).read().strip() if os.path.exists(S + f) else d
txt = open(S + 'section_739.md').read().replace('<<A739>>', rd('read_739a.md', "Pending: queue16 (today's 2025 and 2026 fleets, N-1 once and limits only, Koeberg on its calendar) runs when a solver slot frees.")).replace('<<KM739>>', rd('read_739km.md', 'pending (queue16).'))
left = re.findall(r'<<[A-Z_0-9]+>>', txt); open(S + 'section_739_filled.md', 'w').write(txt); print('filled; left:', left, 'length', len(txt))
if '--doc' in sys.argv:
    doc = open(DOC).read(); m = re.search(r'\n## Message 739:.*?(?=\n## Message |\Z)', doc, re.S)
    doc = (doc[:m.start()] + '\n' + txt.strip() + '\n' + doc[m.end():]) if m else (doc.rstrip('\n') + '\n\n' + txt.strip() + '\n')
    open(DOC, 'w').write(doc); print('doc updated', 'replaced' if m else 'appended', len(doc))
