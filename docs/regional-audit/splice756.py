"""Assemble the message 756 section (the corridor changes table and the rerun results); with --doc, replace or append in docs/regional-audit.md."""
import re, sys
S = '/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad/'
DOC = '/home/user/gridtwin-za/docs/regional-audit.md'
txt = open(S + 'section_756.md').read().replace('<<CHANGES_V3>>', open(S + 'corridor_changes_v3.md').read().strip())
try: r = open(S + 'read_756c.md').read().strip().replace('<<TABLE_756>>', open(S + 'tables756.md').read().strip()).replace('<<BATTEXT_AFTER>>', open(S + 'read_756_battext.md').read().strip() if __import__('os').path.exists(S + 'read_756_battext.md') else 'pending (the last case of queue23c is running).')
except FileNotFoundError: r = 'pending (the queues are running).'
txt = txt.replace('<<RESULTS_756>>', r)
open(S + 'section_756_filled.md', 'w').write(txt); print('filled; left:', re.findall(r'<<[A-Z_0-9]+>>', txt))
if '--doc' in sys.argv:
    doc = open(DOC).read(); m = re.search(r'\n## Message 756:.*?(?=\n## Message |\Z)', doc, re.S)
    doc = (doc[:m.start()] + '\n' + txt.strip() + '\n' + doc[m.end():]) if m else (doc.rstrip('\n') + '\n\n' + txt.strip() + '\n')
    open(DOC, 'w').write(doc); print('doc updated', 'replaced' if m else 'appended', len(doc))
