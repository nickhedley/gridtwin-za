# Native HiGHS for the pathway scripts (SOLVER=native): highs-js (WebAssembly) aborts on large stress
# LPs. Reads an LP file, writes the fields index.html reads from a highs-js result. 5 Oct 2026.
#   python3 highs_native.py in.lp out.json [time_limit_s]
import json, os, sys
import highspy

h = highspy.Highs()
h.setOptionValue('output_flag', False)
h.setOptionValue('solver', os.environ.get('HIGHS_SOLVER', 'simplex'))   # simplex by default: interior point took over 38 min on a pass-2 LP that simplex solves in 2; HIGHS_SOLVER=ipm for LPs where simplex stalls (7 Oct 2026, grid-cost runs)
h.setOptionValue('run_crossover', os.environ.get('HIGHS_CROSSOVER', 'on'))   # 'off' with ipm: an interior answer, no vertex (timing test, 9 Oct 2026)
h.setOptionValue('time_limit', float(sys.argv[3]) if len(sys.argv) > 3 else 900.0)
h.readModel(sys.argv[1])
# WARM START (11 Oct 2026): HIGHS_BASIS_IN, a basis saved by name from an earlier pass (variables and rows not in it
# start nonbasic at their lower bound and basic respectively; HiGHS repairs it as an alien basis). HIGHS_BASIS_OUT
# saves this solve's basis by name. Checked on a 2026-2032 pass 2: same objective (relative 1e-15), same builds, 2.1x
# faster. Full size (the 4 GW lithium run's pass 2 from its pass 1, 12 Oct): same objective (4e-15) and builds, but
# 4.95 h against 3.86 h cold (run at nice 10 beside two other solves, so not a clean timing); no gain shown, so off.
_bin, _bout = os.environ.get('HIGHS_BASIS_IN'), os.environ.get('HIGHS_BASIS_OUT')
if _bin and os.path.exists(_bin):
    _B = json.load(open(_bin)); _lp = h.getLp(); _b = highspy.HighsBasis()
    _b.col_status = [highspy.HighsBasisStatus(_B['cols'].get(n, 0)) for n in _lp.col_names_]
    _b.row_status = [highspy.HighsBasisStatus(_B['rows'].get(n, 1)) for n in _lp.row_names_]
    _b.valid = True; _b.alien = True
    h.setBasis(_b)
h.run()
lp, sol = h.getLp(), h.getSolution()
# Copy each vector once: indexing sol.col_value copies the whole vector per access (19 min, not 2).
cv, cd, rv, rd = list(sol.col_value), list(sol.col_dual), list(sol.row_value), list(sol.row_dual)
cols = {n: {'Name': n, 'Primal': cv[i], 'Dual': cd[i]} for i, n in enumerate(lp.col_names_)}
rows = [{'Name': n, 'Primal': rv[i], 'Dual': rd[i]} for i, n in enumerate(lp.row_names_)]
out = {'Status': h.modelStatusToString(h.getModelStatus()),
       'ObjectiveValue': h.getInfo().objective_function_value, 'Columns': cols, 'Rows': rows}
with open(sys.argv[2], 'w') as f:
    json.dump(out, f)
if _bout and out['Status'] == 'Optimal':
    _bs = h.getBasis()
    with open(_bout, 'w') as f:
        json.dump({'cols': {n: int(x) for n, x in zip(lp.col_names_, _bs.col_status)},
                   'rows': {n: int(x) for n, x in zip(lp.row_names_, _bs.row_status)}}, f)
