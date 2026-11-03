# Per-column value decomposition (messages 667 (d), 665 (c)): for each column matching the regex, sum a_ij * y_i over the rows it
# appears in, grouped by row family and day class (representative days below index 1100... stress days at or above; as decomp.py,
# whose fam() this copies), and its objective coefficient. Writes JSON {column: {"c": c_j, "fam": {family: a*y}, "primal": x}}.
# Usage: python3 -I decompcol.py <lp> <solution json> <column regex> <out json>
import json, re, sys, collections
lp, solf, cre, out = sys.argv[1], sys.argv[2], re.compile(sys.argv[3]), sys.argv[4]
S = json.load(open(solf)); duals = {r['Name']: r['Dual'] for r in S['Rows']}; cols = S['Columns']
pat = re.compile(r'([+-]?)\s*((?:[0-9]*\.?[0-9]+(?:[eE][+-]?[0-9]+)?)?)\s*([A-Za-z_][A-Za-z0-9_]*)')
def terms(expr):
    o = {}
    for m in pat.finditer(expr):
        sg, num, v = m.groups(); c = float(num) if num else 1.0
        if sg == '-': c = -c
        o[v] = o.get(v, 0) + c
    return o
def fam(row):
    base = re.match(r'([a-zA-Z]+)', row).group(1)
    m = re.search(r'_(\d{4})_(\d+)_(\d+)$', row) or re.search(r'_\d+_(\d{4})_(\d+)_(\d+)$', row) or re.search(r'_(\d{4})_(\d+)$', row)
    if m and len(m.groups()) >= 2 and base not in ('b', 'eb'):
        return base + (' (stress days)' if int(m.group(2)) >= 1000 else ' (representative days)')
    return base
R = collections.defaultdict(lambda: {'c': 0.0, 'fam': collections.defaultdict(float)})
sec = None
with open(lp) as f:
    for line in f:
        s = line.strip()
        if s in ('Minimize', 'Maximize'): sec = 'obj'; continue
        if s.startswith('Subject To'): sec = 'st'; continue
        if s.startswith('Bounds') or s.startswith('Generals') or s == 'End': sec = 'o'; continue
        if sec == 'obj':
            if s.startswith('obj:'): s = s[4:]
            if not cre.search(s): continue
            for v, c in terms(s).items():
                if cre.fullmatch(v): R[v]['c'] += c
        elif sec == 'st' and ':' in s:
            name, expr = s.split(':', 1); lhs = re.split(r'<=|>=|=', expr)[0]
            if not cre.search(lhs): continue
            y = duals.get(name.strip(), 0.0)
            if y == 0: continue
            for v, c in terms(lhs).items():
                if cre.fullmatch(v): R[v]['fam'][fam(name.strip())] += c * y
json.dump({v: {'c': d['c'], 'fam': dict(d['fam']), 'primal': cols.get(v, {}).get('Primal')} for v, d in R.items()}, open(out, 'w'))
print(len(R), 'columns')
