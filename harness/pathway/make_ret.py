# Restart counts (messages 374 (a) and 391): builds harness/pathcheck_ret.gen.js from the run commit's own pathcheck.js plus the
# forced-outage-return counter in ret_counter.js, so the counts run exactly that commit's engine check.
# Usage, from harness/: python3 -I pathway/make_ret.py pathway/ret_counter.js pathcheck.js pathcheck_ret.gen.js
import sys
block = open(sys.argv[1]).read().rstrip('\n')
lines = open(sys.argv[2]).read().split('\n')
# insert the counter just before the year loop
k = next(n for n, l in enumerate(lines) if l.lstrip().startswith('for (const y of') or l.lstrip().startswith('for(const y of'))
lines.insert(k, block)
out = '\n'.join(lines)
a = "const x=simulate(st,{demand:PROFILES.demand,solar:nat.solar,wind:nat.wind,csp:PROFILES.csp,real:true});"
assert out.count(a) == 2, out.count(a)   # the main loop (first) and the stress windows; only the first is counted
out = out.replace(a, "window.__curY=st.scenarioYear; " + a, 1)
b = "fs.writeFileSync(process.env.OUTC||'pathcheck.json', JSON.stringify(rows)); process.exit(0);"
assert out.count(b) == 1
out = out.replace(b, "fs.writeFileSync(process.env.OUTR, w.eval('JSON.stringify({rate:window.__rate, years:window.__agg})')); " + b)
open(sys.argv[3], 'w').write(out)
print('ok, counter inserted before line', k + 1)
