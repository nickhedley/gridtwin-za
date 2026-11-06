"""Replace or append the message 741 section in docs/regional-audit.md from section_741.md."""
import re, sys
S = '/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad/'; DOC = '/home/user/gridtwin-za/docs/regional-audit.md'
txt = open(S + 'section_741.md').read()
if '--doc' in sys.argv:
    doc = open(DOC).read(); m = re.search(r'\n## Message 741:.*?(?=\n## Message |\Z)', doc, re.S)
    doc = (doc[:m.start()] + '\n' + txt.strip() + '\n' + doc[m.end():]) if m else (doc.rstrip('\n') + '\n\n' + txt.strip() + '\n')
    open(DOC, 'w').write(doc); print('doc updated', 'replaced' if m else 'appended', len(doc))
