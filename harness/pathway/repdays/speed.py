# Solver options on one LP, same model and same optimum (message 675 (b); design note version 2, section 5). One configuration a
# process, so peak memory is the process's own. Tolerances stay at HiGHS's defaults and crossover stays on for interior point.
#   python3 -I speed.py <lp> <config> <out dir> [<basis json>]
# Configs: simplex (the baseline: highs_native.py's settings); ipm (interior point, crossover on); pami (dual simplex, parallel on,
# simplex_strategy 3, threads 4); scale2 / scale4 (simplex_scale_strategy 2 / 4); objscale (user_objective_scale -10, simplex);
# ipm_objscale (the same, interior point); warm (simplex from <basis json>, an alien basis by name, as highs_native.py's
# HIGHS_BASIS_IN); cut (simplex stopped at 120 s, its basis saved as highs_native.py saves a partial basis, then resumed from it);
# warmfix and cutfix: the same with impossible nonbasic statuses set from the bounds (load_basis); hscale, ipm_hscale, warm_hscale:
# HiGHS's own scaling advice for this LP (user_objective_scale -7, user_bound_scale -4: powers of two, unscaled on output).
# Writes <out>/<config>.json: status, objective, seconds, peak memory, basis validity, and every build column's value (b_, eb_, rc_).
import json, math, os, re, resource, sys, time
import highspy
lp_path, cfg, out = sys.argv[1], sys.argv[2], sys.argv[3]; basis_in = sys.argv[4] if len(sys.argv) > 4 else None
BUILD = re.compile(r'^(b_|eb_|rc_)')
def new(opts):
    h = highspy.Highs(); h.setOptionValue('output_flag', False); h.setOptionValue('time_limit', 6000.0)
    for k, v in opts.items():
        if h.setOptionValue(k, v) != highspy.HighsStatus.kOk: raise SystemExit('option refused: %s=%s' % (k, v))
    h.readModel(lp_path); return h
def load_basis(h, path, fix=False):
    # As highs_native.py's HIGHS_BASIS_IN: a missing column nonbasic at its lower bound (0), a missing row basic (1). With fix (the
    # 'warmfix' and 'cutfix' configs): a nonbasic status that the column's or row's bounds cannot take (at an infinite bound) is
    # replaced by the status its bounds allow: at the lower bound if finite, else at the upper if finite, else zero (free).
    B = json.load(open(path)); lp = h.getLp(); b = highspy.HighsBasis(); S = highspy.HighsBasisStatus
    def ok(st, lo, up):
        if not fix or st == 1: return st
        if st == 0 and lo > -math.inf: return 0
        if st == 2 and up < math.inf: return 2
        return 0 if lo > -math.inf else 2 if up < math.inf else 3
    lo, up = list(lp.col_lower_), list(lp.col_upper_); rl, ru = list(lp.row_lower_), list(lp.row_upper_)
    b.col_status = [S(ok(B['cols'].get(n, 0), lo[i], up[i])) for i, n in enumerate(lp.col_names_)]
    b.row_status = [S(ok(B['rows'].get(n, 1), rl[i], ru[i])) for i, n in enumerate(lp.row_names_)]
    b.valid = True; b.alien = True
    return h.setBasis(b), sum(n in B['cols'] for n in lp.col_names_), lp.num_col_
def result(h, t, extra):
    lp = h.getLp(); cv = list(h.getSolution().col_value)
    return dict(config=cfg, status=h.modelStatusToString(h.getModelStatus()), objective=h.getInfo().objective_function_value,
                seconds=round(t, 1), simplex_iterations=h.getInfo().simplex_iteration_count, ipm_iterations=h.getInfo().ipm_iteration_count,
                peak_rss_mb=round(resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / 1024), **extra,
                build={n: cv[i] for i, n in enumerate(lp.col_names_) if BUILD.match(n)})
OPTS = {'simplex': {'solver': 'simplex'}, 'ipm': {'solver': 'ipm', 'run_crossover': 'on'},
        'pami': {'solver': 'simplex', 'parallel': 'on', 'simplex_strategy': 3, 'threads': 4},
        'scale2': {'solver': 'simplex', 'simplex_scale_strategy': 2}, 'scale4': {'solver': 'simplex', 'simplex_scale_strategy': 4},
        'objscale': {'solver': 'simplex', 'user_objective_scale': -10}, 'ipm_objscale': {'solver': 'ipm', 'run_crossover': 'on', 'user_objective_scale': -10},
        'warm': {'solver': 'simplex'}, 'cut': {'solver': 'simplex'}, 'warmfix': {'solver': 'simplex'}, 'cutfix': {'solver': 'simplex'},
        # HiGHS's own advice for this LP on reading it: 'setting the user_objective_scale option to -7' and 'user_bound_scale option to -4'
        'hscale': {'solver': 'simplex', 'user_objective_scale': -7, 'user_bound_scale': -4},
        'ipm_hscale': {'solver': 'ipm', 'run_crossover': 'on', 'user_objective_scale': -7, 'user_bound_scale': -4},
        'warm_hscale': {'solver': 'simplex', 'user_objective_scale': -7, 'user_bound_scale': -4}}
extra = {}
if cfg not in OPTS: raise SystemExit('unknown config ' + cfg)
h = new(OPTS[cfg])
if cfg in ('warm', 'warmfix', 'warm_hscale'):
    st, matched, ncol = load_basis(h, basis_in, fix=(cfg != 'warm')); extra.update(basis_set=str(st), basis_cols_matched=matched, cols=ncol)
if cfg in ('cut', 'cutfix'):
    h.setOptionValue('time_limit', 120.0); t0 = time.time(); h.run(); t1 = time.time() - t0
    bs = h.getBasis(); lp = h.getLp()
    extra.update(cut_status=h.modelStatusToString(h.getModelStatus()), cut_seconds=round(t1, 1), cut_basis_valid=bool(bs.valid),
                 cut_basis_counts={str(s): list(bs.col_status).count(s) for s in set(bs.col_status)})
    path = os.path.join(out, cfg + '.partial.basis.json')
    json.dump({'cols': {n: int(x) for n, x in zip(lp.col_names_, bs.col_status)}, 'rows': {n: int(x) for n, x in zip(lp.row_names_, bs.row_status)}}, open(path, 'w'))
    del h; h = new(OPTS[cfg]); st, matched, ncol = load_basis(h, path, fix=(cfg == 'cutfix')); extra.update(resume_basis_set=str(st))
t0 = time.time(); rs = h.run(); t = time.time() - t0; extra['run_status'] = str(rs)
if cfg == 'simplex' and len(sys.argv) > 4 and sys.argv[4] == 'save_basis':
    bs = h.getBasis(); lp = h.getLp()
    json.dump({'cols': {n: int(x) for n, x in zip(lp.col_names_, bs.col_status)}, 'rows': {n: int(x) for n, x in zip(lp.row_names_, bs.row_status)}},
              open(os.path.join(out, os.path.basename(lp_path) + '.basis.json'), 'w'))
r = result(h, t, extra); json.dump(r, open(os.path.join(out, cfg + '.json'), 'w'))
print(cfg, r['status'], r['objective'], r['seconds'], 's', r['peak_rss_mb'], 'MB', {k: v for k, v in extra.items() if k != 'cut_basis_counts'})
