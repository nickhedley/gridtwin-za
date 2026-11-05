# Message 724 (b): does a solve stopped at its time limit keep a valid basis, presolve on against off? One LP, each case alone in turn.
import json, sys, time, highspy
lp, tl = sys.argv[1], float(sys.argv[2])
cases = [('serial, presolve on', {}), ('parallel 2 threads, presolve on', {'simplex_strategy': 2, 'threads': 2}),
         ('serial, presolve off', {'presolve': 'off'}), ('parallel 2 threads, presolve off', {'simplex_strategy': 2, 'threads': 2, 'presolve': 'off'})]
for name, o in cases:
    h = highspy.Highs(); h.setOptionValue('output_flag', False); h.setOptionValue('solver', 'simplex'); h.setOptionValue('time_limit', tl)
    for k, v in o.items(): h.setOptionValue(k, v)
    h.readModel(lp); t = time.time(); h.run(); b = h.getBasis()
    print(json.dumps({'case': name, 'status': h.modelStatusToString(h.getModelStatus()), 'seconds': round(time.time() - t, 1),
                      'basis_valid': bool(b.valid), 'iterations': h.getInfo().simplex_iteration_count}), flush=True)
