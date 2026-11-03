# Compares speed.py results with the simplex baseline (message 675 (b)): objective difference, and every build column that differs.
import json, sys, glob, os
d = sys.argv[1]; base = json.load(open(os.path.join(d, 'simplex_base.json')))
for f in sorted(glob.glob(os.path.join(d, '*.json'))):
    if f.endswith('simplex_base.json') or f.endswith('.basis.json'): continue
    r = json.load(open(f)); b = r.get('build', {})
    diffs = [(n, base['build'][n], b.get(n)) for n in base['build'] if b.get(n) is None or abs(base['build'][n] - b[n]) > 0.5]
    rel = (r['objective'] - base['objective']) / base['objective'] if r.get('objective') is not None else None
    print('%-12s %-12s %8s s %6s MB obj rel diff %s, build columns differing by over 0.5 MW: %d %s' % (
        r['config'], r['status'], r.get('seconds'), r.get('peak_rss_mb'), '%.2e' % rel if rel is not None else '-', len(diffs),
        [(n, round(x, 1), None if y is None else round(y, 1)) for n, x, y in diffs[:6]]))
