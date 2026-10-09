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
