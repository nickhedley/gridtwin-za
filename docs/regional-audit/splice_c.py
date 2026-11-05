import re
S='/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad/'
t=open(S+'net_tables.md').read().split('\n')
# blocks: tie-out table (until blank), cases table (until blank), siting line, area lines
blocks=[]; cur=[]
for l in t:
    if l.strip()=='' : blocks.append(cur); cur=[]
    else: cur.append(l)
blocks.append(cur)
tie='\n'.join(blocks[0]); cases='\n'.join(blocks[1]); rest=[l for b in blocks[2:] for l in b]
siting=[l for l in rest if l.startswith('Siting shares')][0]; areas='\n'.join(l for l in rest if l.startswith('Curtailment by area'))
sec=open(S+'section_c.md').read()
sec=sec.replace('<<SITING>>', siting.replace('Siting shares of new wind and solar by supply area (approved REEA records through their nearest substation): ','Shares: ')).replace('<<TIEOUT>>', tie).replace('<<CASES>>', cases).replace('<<AREAS>>', areas)
assert '<<' not in sec
p='/home/user/gridtwin-za/docs/regional-audit.md'; doc=open(p).read()
marker='\n## Message 717 (c):'
if marker in doc: doc=doc[:doc.index(marker)]
doc=doc.rstrip('\n')+'\n'+sec
open(p,'w').write(doc); print('spliced; doc lines', doc.count('\n'))
