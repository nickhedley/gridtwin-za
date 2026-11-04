# Test 15 (two stages) summary: the stage-2 mix by technology and year, each step's passes, adequacy and solve times, against a one-stage
# pathway output where one is given. Reads <run dir>/step_<y>.json (two_stage.sh) and <run dir>/progress.txt (pathway/test15.sh).
# From harness/:
#   python3 -I pathway/test15_summary.py out/ts_central out/ts_ff out/ts_central_ann [--one-stage <label>=<pathway json> ...] > <md>
# The two-stage answer for year y is step y's sched[y] (year y's builds, fixed after step y); a one-stage file gives its own sched[y].
import json, os, re, sys

TECH = [('wind', 'wind'), ('off', 'offshore'), ('pv', 'solar'), ('batt', 'lithium MW'), ('battMWh', 'lithium MWh'), ('vrfb', 'vanadium'),
        ('ironair', 'iron-air'), ('phes', 'pumped new'), ('phel', 'pumped long'), ('ccgt', 'CCGT'), ('ocgt', 'OCGT gas'), ('ocgd', 'OCGT diesel'),
        ('gfm', 'grid-forming'), ('scn', 'condensers new'), ('scc', 'condenser conv.')]
YEARS = list(range(2026, 2041))

def steps(d):
    out = {}
    for y in YEARS:
        f = os.path.join(d, 'step_%d.json' % y)
        if os.path.exists(f) and os.path.getsize(f):
            out[y] = json.load(open(f))
    return out

def progress(d):
    """Per step: solve wall times (s, to the 15-second poll), node attempts, peak memory (GB), outcome lines."""
    f = os.path.join(d, 'progress.txt'); per = {}; cur = None; blk = {}
    if not os.path.exists(f): return per
    for line in open(f):
        m = re.search(r'step node PID (\d+)', line)
        if m: cur = m.group(1); blk[cur] = {'solves': [], 'peak': None, 'step': None}; continue
        m = re.search(r'solve \(highs_native.py \d+\) ended after about (\d+)s', line)
        if m and cur: blk[cur]['solves'].append(int(m.group(1))); continue
        m = re.search(r'node (\d+) ended, peak memory ([0-9.]+) GB', line)
        if m and m.group(1) in blk: blk[m.group(1)]['peak'] = float(m.group(2)); continue
        m = re.search(r'step (\d{4}) \(horizon (\d{4})\) rc=(\d+) (done|NO OUTPUT)', line)
        if m and cur and blk[cur]['step'] is None: blk[cur]['step'] = (int(m.group(1)), int(m.group(3)), m.group(4))
    for b in blk.values():
        if not b['step']: continue
        y = b['step'][0]; p = per.setdefault(y, {'solves': [], 'attempts': 0, 'peak': 0.0, 'rcs': []})
        p['solves'] += b['solves']; p['attempts'] += 1; p['rcs'].append(b['step'][1]); p['peak'] = max(p['peak'], b['peak'] or 0)
    return per

def mix(sched_by_year):
    # A year with no step (or no sched entry) is None throughout: shown blank, left out of sums.
    return {y: {k: (sched_by_year[y].get(k, 0) or 0) if sched_by_year.get(y) else None for k, _ in TECH} for y in YEARS}

def tot(M, k, Y=2040):
    return sum(M[y][k] or 0 for y in YEARS if y <= Y)

def two_stage_mix(S):
    return mix({y: S[y]['sched'][str(y)] for y in S})

def one_stage_mix(f):
    d = json.load(open(f)); return mix({y: d['sched'].get(str(y)) for y in YEARS}), d

def coal(S):
    return {y: (S[y]['sched'][str(y)].get('coalMW'), S[y]['sched'][str(y)].get('earlyRetMW'), S[y]['sched'][str(y)].get('rcaMW')) for y in S}

def fmt(v):
    return '' if v is None else '{:,.0f}'.format(v)

def mix_table(M, label, ref=None):
    used = [(k, n) for k, n in TECH if any(M[y][k] for y in YEARS) or (ref and any(ref[y][k] for y in YEARS))]
    if not used: print('\n%s: no step yet' % label); return
    print('\n%s: new build by year, MW (lithium also MWh)%s\n' % (label, '; in brackets, the one-stage figure where it differs by 1 MW or more' if ref else ''))
    print('| Year | ' + ' | '.join(n for _, n in used) + ' |'); print('|---|' + '---:|' * len(used))
    for y in YEARS:
        cells = []
        for k, _ in used:
            a = M[y][k]; c = fmt(a)
            if ref is not None and a is not None and ref[y][k] is not None and abs(a - ref[y][k]) >= 1: c += ' (' + fmt(ref[y][k]) + ')'
            cells.append(c)
        print('| %d | ' % y + ' | '.join(cells) + ' |')
    print('| Total | ' + ' | '.join(fmt(tot(M, k)) + ((' (' + fmt(tot(ref, k)) + ')') if ref else '') for k, _ in used) + ' |')

def cum_table(runs):
    """Cumulative new MW standing by 2030, 2035 and 2040, one column per run."""
    print('\nCumulative new build, MW (lithium also MWh), built 2026 to the year\n')
    print('| Technology | Year | ' + ' | '.join(l for l, _ in runs) + ' |'); print('|---|---|' + '---:|' * len(runs))
    for k, n in TECH:
        if not any(any(M[y][k] for y in YEARS) for _, M in runs): continue
        for Y in (2030, 2035, 2040):
            print('| %s | %d | ' % (n, Y) + ' | '.join(fmt(tot(M, k, Y)) if M[Y][k] is not None else '' for _, M in runs) + ' |')

def step_table(label, S, P):
    print('\n%s: each step (year y on 365 days, the look-ahead years at 25 days)\n' % label)
    print('| Step | Horizon | Passes | Verdict | Solve wall time, min (each pass) | Step wall time, min | Attempts | Peak memory, GB | Years over the standard, pass by pass (mean GWh / limit) | Objective, Rbn |')
    print('|---|---|---:|---|---|---:|---:|---:|---|---:|')
    for y in YEARS:
        if y not in S:
            p = P.get(y); print('| %d | | | not run%s | | | %s | | | |' % (y, (' (rc ' + ','.join(map(str, p['rcs'])) + ')') if p else '', p['attempts'] if p else '')); continue
        s = S[y]; log = s.get('log') or []; p = P.get(y, {'solves': [], 'attempts': '', 'peak': 0})
        fails = []
        for e in log:
            f = ['%d: %.1f / %.0f' % (q['y'], q['mean'], q['limit']) for q in e['years'] if q['limit'] > 0 and q['mean'] > q['limit']]
            fails.append('pass %d: %s' % (e['pass'], '; '.join(f) if f else 'none'))
        hz = max(int(k) for k in s['sched'])
        print('| %d | %d | %d | %s | %s | %.1f | %s | %s | %s | %.3f |' % (y, hz, len(log), s.get('verdict'), ', '.join('%.1f' % (t / 60) for t in p['solves']) or 'cache',
              (s.get('secs') or 0) / 60, p['attempts'], ('%.1f' % p['peak']) if p['peak'] else '', '<br>'.join(fails), (s.get('objective') or 0) / 1e9))

def year_y_adequacy(label, S):
    print('\n%s: the adequacy test on each step\'s own year y at its final pass (mean unserved GWh a year against the limit)\n' % label)
    print('| Year | Pass 1 mean / limit | Final pass mean / limit | Worst weather year (GWh) |'); print('|---|---|---|---|')
    for y in YEARS:
        if y not in S: continue
        log = S[y].get('log') or []
        q1 = next((q for q in log[0]['years'] if q['y'] == y), None) if log else None
        qf = next((q for q in log[-1]['years'] if q['y'] == y), None) if log else None
        g = lambda q: ('%.2f / %.0f' % (q['mean'], q['limit'])) if q else 'not tested'
        print('| %d | %s | %s | %s |' % (y, g(q1), g(qf), ('%s (%.1f)' % (qf['worstYear'], qf['worstGWh'])) if qf else ''))

def fixed_check(S):
    """Year y's builds as fixed by step y must stand unchanged in every later step (FIX_FROM): count mismatches."""
    bad = []
    for y in S:
        for z in S:
            if z <= y: continue
            for n, v in S[y]['build'].items():
                if n.endswith('_%d' % y) and abs(S[z]['build'].get(n, v) - v) > 1e-6: bad.append((y, z, n, v, S[z]['build'].get(n)))
    return bad

def main():
    a = sys.argv[1:]; one = []
    if '--one-stage' in a:
        i = a.index('--one-stage'); one = [x.split('=', 1) for x in a[i + 1:]]; a = a[:i]
    runs = []
    for d in a:
        S = steps(d); P = progress(d); runs.append((os.path.basename(d.rstrip('/')), S, P))
    refs = {l: one_stage_mix(f) for l, f in one}
    for l, S, P in runs:
        print('\n### %s (%d of 15 steps)\n' % (l, len(S)))
        bad = fixed_check(S)
        print('Fixed builds carried unchanged into later steps: %s' % ('yes, every one' if not bad else '%d mismatches, first %s' % (len(bad), bad[0])))
        ref = refs.get(l, (None,))[0]
        mix_table(two_stage_mix(S), l, ref)
        C = coal(S)
        print('\n%s: coal standing (MW), coal retired ahead of its dates (MW) and kept under the compliance case (MW), year y of each step\n' % l)
        print('| Year | Coal standing | Retired early | Compliance MW kept |'); print('|---|---:|---:|---:|')
        for y in YEARS:
            if y in C: print('| %d | %s | %s | %s |' % ((y,) + tuple(fmt(v) for v in C[y])))
        step_table(l, S, P); year_y_adequacy(l, S)
    cum = [(l, two_stage_mix(S)) for l, S, _ in runs] + [(l + ' (one-stage)', M) for l, (M, _) in refs.items()]
    cum_table(cum)

if __name__ == '__main__':
    main()
