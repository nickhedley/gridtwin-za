# Equivalence test for the single-year LP (design note version 2, 3.4 and test 7; message 673 (d)). C: the full LP with every build up to
# y - 1 fixed; B: the single-year LP (OPER_FROM=y) with the same builds fixed. Checks (1) objective: C's objective less the contribution of
# the columns C has and B does not (the earlier years' operation) equals B's, to 1e-7 relative; (2) every column B has takes the same value
# in C, to 0.01 (MW, MWh or tonnes) or 1e-6 relative, the year y build columns listed.
#   python3 -I equiv.py <lp C> <solution C> <lp B> <solution B> <year>
import json, re, sys
def objective(lp):
    coef, on = {}, False
    for line in open(lp):
        if line.startswith('Minimize') or line.startswith('Maximize'): on = True; continue
        if line.startswith('Subject To'): break
        if on:
            for c, n in re.findall(r'([+-]?\s*[0-9.eE+-]+)\s+([A-Za-z_][A-Za-z0-9_]*)', line.replace(' obj:', ' ')):
                coef[n] = coef.get(n, 0) + float(c.replace(' ', ''))
    return coef
lpC, sC, lpB, sB, y = sys.argv[1:6]
C = json.load(open(sC)); B = json.load(open(sB)); cc = objective(lpC)
xC = {n: v['Primal'] for n, v in C['Columns'].items()}; xB = {n: v['Primal'] for n, v in B['Columns'].items()}
drop = sum(cc.get(n, 0) * x for n, x in xC.items() if n not in xB)
lhs, rhs = C['ObjectiveValue'] - drop, B['ObjectiveValue']
print('status', C['Status'], B['Status'], '| C objective', C['ObjectiveValue'], 'less earlier operation', drop, '=', lhs, 'against B', rhs,
      '| relative difference %.2e' % (abs(lhs - rhs) / max(1, abs(rhs))))
diff = [(n, xC.get(n), x) for n, x in xB.items() if n not in xC or abs(xC[n] - x) > max(0.01, 1e-6 * abs(x))]
print('columns in B', len(xB), 'not equal in C', len(diff), diff[:10])
yb = {n: round(x, 1) for n, x in xB.items() if re.match(r'^(b_|eb_|rc_)[a-z_]*' + y + '$', n) and abs(x) > 0.05}
print('year', y, 'builds in B', yb)
ok = C['Status'] == B['Status'] == 'Optimal' and abs(lhs - rhs) <= 1e-7 * max(1, abs(rhs))
print('EQUIVALENT' if ok and not diff else ('objective equal; columns differ (alternative optima?)' if ok else 'NOT EQUIVALENT'))
