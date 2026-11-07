"""Make a pathcheck_dump.js for any worktree: insert the two DUMP lines (the engine-state dump of 717 (c)) after the anchor line that ends the
pumped-storage override block, as in pathcheck_dump_wt-05f.js. usage: python3 make_pathcheck_dump.py <worktree> <out file>"""
import sys
S = '/tmp/claude-0/-home-user-gridtwin-za/ff25664d-5d95-5cb3-a5ba-9894dfa04a8f/scratchpad/'
wt, out = sys.argv[1], sys.argv[2]
ref = open(S + 'sc/pathcheck_dump_wt-05f.js').read().split('\n')
i = next(k for k, l in enumerate(ref) if l.startswith('   if (process.env.DUMP_WY)')); anchor = ref[i - 1]; dump = ref[i:i + 2]
src = open(wt + '/harness/pathcheck.js').read().split('\n')
hits = [k for k, l in enumerate(src) if l == anchor]
assert len(hits) == 1, f'anchor found {len(hits)} times'
src[hits[0] + 1:hits[0] + 1] = dump; open(out, 'w').write('\n'.join(src)); print('written', out, 'dump lines after line', hits[0] + 1)
