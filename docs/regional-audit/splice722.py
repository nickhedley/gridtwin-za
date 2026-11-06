"""Assemble the message 722 section from section_722a.md (+ tables722.md and section_722a_needs.md), section_722b.md and
section_722c.md; write section_722_filled.md; with --doc, replace or append the 'Message 722' section in docs/regional-audit.md.
Unfilled placeholders become a 'pending' note."""
import re, sys
S = '/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad/'
DOC = '/home/user/gridtwin-za/docs/regional-audit.md'
t = open(S + 'tables722.md').read()
ta = re.search(r'### 722 \(a\)[^\n]*\n(.*?)(?=\n### 722 \(b\)|\Z)', t, re.S); tb = re.search(r'### 722 \(b\)[^\n]*\n(.*?)\Z', t, re.S)
a = open(S + 'section_722a.md').read().replace('<<TABLE_722A>>', ta.group(1).strip() if ta else '(no rows yet)').replace('<<NEEDS>>', open(S + 'section_722a_needs.md').read().strip())
b = open(S + 'section_722b.md').read().replace('<<TABLE_722B>>', tb.group(1).strip() if tb else '(no rows yet)')
c = open(S + 'section_722c.md').read()
head = """
## Message 722: the three builds through the network test, the ten-area LP's time, and one soft link (6 Nov 2026; nothing here is to be quoted)

Builds as labelled in each part. Every case's JSON is in docs/regional-audit/results/718/ with the 718 cases (the prefixes
net_final_, net_ff_, net_deep_); scripts in docs/regional-audit/.
"""
txt = head + a + b + c
pend = {'FF2040_EXT': 'is in the queue', 'FF_MIX': 'pending, in the queue', 'IPM': 'An interior-point timing test on one extendable case is in the queue.', 'H3_TIME': 'pending (running)', 'MYOPIC_PASS': 'pending the 3-hour-block mix time'}
for k in ('READ_FF_EXT',):
    pass
for k, v in pend.items():
    f = S + 'read_' + k.lower() + '.md'
    try: v = open(f).read().strip()
    except FileNotFoundError: pass
    txt = txt.replace('<<' + k + '>>', v)
left = re.findall(r'<<[A-Z_0-9]+>>', txt)
open(S + 'section_722_filled.md', 'w').write(txt); print('filled; left:', left, 'length', len(txt))
if '--doc' in sys.argv:
    doc = open(DOC).read()
    m = re.search(r'\n## Message 722:.*?(?=\n## Message |\Z)', doc, re.S)
    doc = (doc[:m.start()] + '\n' + txt.strip() + '\n' + doc[m.end():]) if m else (doc.rstrip('\n') + '\n\n' + txt.strip() + '\n')
    open(DOC, 'w').write(doc); print('doc updated', 'replaced' if m else 'appended', len(doc))
