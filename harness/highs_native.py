# Native HiGHS for the pathway scripts (SOLVER=native): highs-js (WebAssembly) aborts on large stress
# LPs. Reads an LP file, writes the fields index.html reads from a highs-js result. 5 Oct 2026.
#   python3 highs_native.py in.lp out.json [time_limit_s]
import json, sys
import highspy

h = highspy.Highs()
h.setOptionValue('output_flag', False)
h.setOptionValue('time_limit', float(sys.argv[3]) if len(sys.argv) > 3 else 900.0)
h.readModel(sys.argv[1])
h.run()
lp, sol = h.getLp(), h.getSolution()
cols = {n: {'Name': n, 'Primal': sol.col_value[i], 'Dual': sol.col_dual[i]} for i, n in enumerate(lp.col_names_)}
rows = [{'Name': n, 'Primal': sol.row_value[i], 'Dual': sol.row_dual[i]} for i, n in enumerate(lp.row_names_)]
out = {'Status': h.modelStatusToString(h.getModelStatus()),
       'ObjectiveValue': h.getInfo().objective_function_value, 'Columns': cols, 'Rows': rows}
with open(sys.argv[2], 'w') as f:
    json.dump(out, f)
