"""Fill section_718_final.md's placeholders from the table files and write section_718_filled.md; with --doc, replace or append
the 'Message 718' section in docs/regional-audit.md. Placeholders left unfilled become a one-line 'pending' note."""
import re, sys
S = '/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad/'
DOC = '/home/user/gridtwin-za/docs/regional-audit.md'
txt = open(S + 'section_718_final.md').read()
t718 = open(S + 'tables718.md').read()
def part(key):
    m = re.search(r'### 718 \(' + key + r'\)[^\n]*\n(.*?)(?=\n### 718 \(|\Z)', t718, re.S)
    return m.group(1).strip() if m else ''
fills = {'TA': part('a'), 'TB': part('b'), 'TD': part('d'), 'TE': part('e'), 'TF': part('f'), 'TG': part('g'),
         'SECTION_B': open(S + 'section_b.md').read().strip(), 'SECTION_C_ACCOUNTING': open(S + 'section_718c_accounting.md').read().strip()}
nt = open(S + 'net_tables_final.md').read().split('\n\n')
fills['TC_TIEOUT'] = nt[0].strip(); fills['TC_CASES'] = nt[1].strip() if len(nt) > 1 else ''; fills['TC_AREAS'] = '\n\n'.join(x.strip() for x in nt[2:])
for k in ('READ_E', 'READ_F', 'READ_G', 'EXT21K'):
    f = S + 'read_' + k.lower() + '.md'
    try: fills[k] = open(f).read().strip()
    except FileNotFoundError: fills[k] = {'EXT21K': 'pending (the cases are in the queue)', 'READ_E': 'Reading: pending, the free-siting cases are being rerun after the accounting fix.', 'READ_F': 'Reading: pending, the free-mix cases are in the queue (report by 7 Nov 18:00 SAST).', 'READ_G': 'Reading: pending, the demand-split cases are in the queue.'}[k]
for k, v in fills.items(): txt = txt.replace('<<' + k + '>>', v if v else '(no rows yet)')
left = re.findall(r'<<[A-Z_0-9]+>>', txt)
open(S + 'section_718_filled.md', 'w').write(txt); print('filled; left:', left, 'length', len(txt))
if '--doc' in sys.argv:
    doc = open(DOC).read()
    m = re.search(r'\n## Message 718:.*?(?=\n## Message |\Z)', doc, re.S)
    doc = (doc[:m.start()] + '\n' + txt.strip() + '\n' + doc[m.end():]) if m else (doc.rstrip('\n') + '\n\n' + txt.strip() + '\n')
    open(DOC, 'w').write(doc); print('doc updated', 'replaced' if m else 'appended', len(doc))
