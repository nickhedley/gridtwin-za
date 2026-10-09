# GridTwin ZA - cost-scaling test for the build LP (user, 9 Oct 2026). Divides every objective coefficient (and the
# offset) by FACTOR, solves, and writes the solution with the objective multiplied back, so it compares directly with an
# unscaled solve. The variables and constraints are unchanged, so the optimum is the same point.
#   python3 ext/scale_test.py in.lp out.json <factor> <ipm|simplex> <crossover on|off> [time_limit_s]
import json, sys, time
import highspy
f_in, f_out, factor, solver, xover = sys.argv[1], sys.argv[2], float(sys.argv[3]), sys.argv[4], sys.argv[5]
tl = float(sys.argv[6]) if len(sys.argv) > 6 else 72000.0
h = highspy.Highs(); h.setOptionValue('output_flag', False)
h.readModel(f_in)
lp = h.getLp()
lp.col_cost_ = [c / factor for c in lp.col_cost_]; lp.offset_ = lp.offset_ / factor
h.passModel(lp)
h.setOptionValue('solver', solver); h.setOptionValue('run_crossover', xover); h.setOptionValue('time_limit', tl)
t0 = time.time(); h.run(); secs = time.time() - t0
lp, sol = h.getLp(), h.getSolution()
cv, rv = list(sol.col_value), list(sol.row_value)
out = {'Status': h.modelStatusToString(h.getModelStatus()), 'ObjectiveValue': h.getInfo().objective_function_value * factor,
       'secs': secs, 'factor': factor, 'solver': solver, 'crossover': xover,
       'Columns': {n: {'Name': n, 'Primal': cv[i]} for i, n in enumerate(lp.col_names_)},
       'Rows': [{'Name': n, 'Primal': rv[i]} for i, n in enumerate(lp.row_names_)]}
json.dump(out, open(f_out, 'w'))
print(out['Status'], '%.12e' % out['ObjectiveValue'], '%.0f s' % secs)
