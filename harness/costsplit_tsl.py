# STRESS-TARGET PENALTY ONLY (TODO 14cv, user, 13 Oct 2026; branch claude/costsplit, analysis only, solves nothing).
# The optimiser objective with and without its stress-target penalty, from a finished run's own cached solution (the
# cache file whose objective matches the run's recorded one): penalty = sum over years of VoLL x 365 x tsl_y, discounted
# at the run's own rate to 2026, as bldBuildLP prices it. Needs no LP rebuild, so no settings.
# Usage: python3 -I costsplit_tsl.py <lpcache dir> <pathway json> <constants json> <out json>
import sys, json, glob, os, re
cdir, pathf, constf, outf = sys.argv[1:5]
K = json.load(open(constf)); P = json.load(open(pathf))
rec = P.get('objective'); disc = P.get('disc', K['BLD_DISC'])
sol = None
for f in sorted(glob.glob(os.path.join(cdir, '*.json'))):
    if f.endswith('.basis.json'): continue
    with open(f) as fh: head = fh.read(400)
    m = re.search(r'"ObjectiveValue":\s*([0-9.eE+-]+)', head)
    if m and rec and abs(float(m.group(1)) - rec) <= 1e-7 * abs(rec): sol = json.load(open(f)); used = os.path.basename(f); break
if sol is None: raise SystemExit('no cached solution matching the recorded objective %s' % rec)
cols = sol['Columns']; pen = 0.0; rows = []
for y in range(2026, 2041):
    c = cols.get('tsl_%d' % y)
    if not c: continue
    v = c['Primal']; p = K['voll'] * 365 * v / (1 + disc) ** (y - 2026)
    pen += p
    if v > 1e-6: rows.append((y, v, p / 1e9))
print('solution %s | objective R%.1f bn at %.1f%% | stress-target penalty R%.1f bn | objective without it R%.1f bn' % (used[:10], rec / 1e9, disc * 100, pen / 1e9, (rec - pen) / 1e9))
for y, v, b in rows: print('  %d  excess %.1f MWh  R%.2f bn' % (y, v, b))
json.dump({'objective': rec, 'disc': disc, 'penalty': pen, 'withoutPenalty': rec - pen, 'byYear': rows, 'solution': used}, open(outf, 'w'))
