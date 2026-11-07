# 781 (b): the 27 Oct break-even table (RESULTS 'Coal sustaining capital: how far c6a's plan is from retiring coal early') on a solved
# pathway LP, from HiGHS's solution (highs_native.py's output, kept in the LP cache): the objective cost of retiring 1 MW of coal from
# year y onward = the sum of rc_t's reduced costs for t >= y plus rcmono_y's dual (none for the first year); divided by 1,000 x the sum of
# the discount factors (8%, from 2026) for t >= y, the extra coal fixed cost, R/kW-yr (January 2026 rands), at which that retirement pays.
# Years before RC_FROM have rc_ fixed at 0 (upper bound 0): their reduced costs still price retiring there ('from 2026' values).
#   python3 breakeven.py <solution.json> [disc]
import json, sys
sol = json.load(open(sys.argv[1])); disc = float(sys.argv[2]) if len(sys.argv) > 2 else 0.08
cols = sol['Columns']; rows = {r['Name']: r for r in sol['Rows']}
Y = sorted(int(n[3:]) for n in cols if n.startswith('rc_') and n[3:].isdigit())
df = {y: 1 / (1 + disc) ** (y - 2026) for y in Y}
print('objective', sol['ObjectiveValue'], 'status', sol['Status'])
print('year rc_MW reduced_cost rcmono_dual breakeven_R_per_kWyr')
out = {}
for y in Y:
    sd = sum(cols['rc_%d' % t]['Dual'] for t in Y if t >= y)
    mono = rows.get('rcmono_%d' % y, {}).get('Dual', 0.0)
    be = (sd + mono) / (1000 * sum(df[t] for t in Y if t >= y))
    out[y] = be
    print(y, round(cols['rc_%d' % y]['Primal'], 1), round(cols['rc_%d' % y]['Dual'], 1), round(mono, 1), round(be))
json.dump(out, open(sys.argv[1].rsplit('/', 1)[-1].replace('.json', '') + '_breakeven.json', 'w'))
