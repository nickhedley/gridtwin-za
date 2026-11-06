"""Assemble the message 729 section from section_729.md and read_729_judge.md (or its default) and, with --doc, replace or append it in docs/regional-audit.md."""
import re, sys, os
S = '/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad/'
DOC = '/home/user/gridtwin-za/docs/regional-audit.md'
j = open(S + ('read_729_judge.md' if os.path.exists(S + 'read_729_judge.md') else 'read_729_judge.md.default')).read().strip()
txt = open(S + 'section_729.md').read().replace('<<JUDGE_729>>', j)
left = re.findall(r'<<[A-Z_0-9]+>>', txt); open(S + 'section_729_filled.md', 'w').write(txt); print('filled; left:', left, 'length', len(txt))
if '--doc' in sys.argv:
    doc = open(DOC).read(); m = re.search(r'\n## Message 729:.*?(?=\n## Message |\Z)', doc, re.S)
    doc = (doc[:m.start()] + '\n' + txt.strip() + '\n' + doc[m.end():]) if m else (doc.rstrip('\n') + '\n\n' + txt.strip() + '\n')
    open(DOC, 'w').write(doc); print('doc updated', 'replaced' if m else 'appended', len(doc))
