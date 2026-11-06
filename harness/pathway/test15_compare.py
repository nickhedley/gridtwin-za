# Message 724 (c): the two-stage central against the one-stage fin pass, by message 699 (b)'s rule. From harness/:
#   python3 -I pathway/test15_compare.py <fin pathway json> <fin engine json> <two-stage step_2040.json> <two-stage engine json>
#       [--recost <fin recost json> <two-stage recost json>] [--fin-engine-05j <fin engine json on 05j>]
# Mix: cumulative new MW standing (built 2026 to the year; lithium also MWh), coal standing and coal retired early, in 2030, 2035, 2040.
# The rule (699 (b)): a gap counts when it lies outside 5% / 250 MW of the one-stage figure, read here as both: |gap| > 250 MW and |gap| > 5%
# of the one-stage figure (the design note's 'settles' margin: within either is settled); then the engine check must be no worse (mean
# unserved, the same 20-draw measure); then, where test 13 has a 1% range for that technology and year, a gap inside it leaves one stage
# the headline. Objective: each build re-costed in the same one-stage LP (--recost), so the gap is the builds'; the runs' own objectives
# (one-stage pathway LP; two stages' step 2040 LP) are not comparable and are shown for the record only.
import json, sys

TECH = [('wind', 'wind'), ('off', 'offshore'), ('pv', 'solar'), ('batt', 'lithium MW'), ('battMWh', 'lithium MWh'), ('vrfb', 'vanadium'),
        ('ironair', 'iron-air'), ('phes', 'pumped new'), ('phel', 'pumped long'), ('ccgt', 'CCGT'), ('ocgt', 'OCGT gas'), ('ocgd', 'OCGT diesel'),
        ('gfm', 'grid-forming'), ('scn', 'condensers new'), ('scc', 'condenser conv.')]
YS = (2030, 2035, 2040)
# Test 13's 1% ranges (RESULTS 'Near-optimal ranges (MGA), method'; docs/test13-results.md on claude/test13-mga): only wind 2040's minimum
# is measured (24,605 MW, provisional: the old tracking twin), no maximum; nothing else yet.
T13 = {('wind', 2040): (24605, None)}

def cum(sched, k, Y):
    return sum((sched[y].get(k) or 0) for y in sched if int(y) <= Y)

def fmt(v, d=0):
    return '' if v is None else ('{:,.%df}' % d).format(v)

def main():
    a = sys.argv[1:]; rc = None; fe5 = None
    if '--recost' in a: i = a.index('--recost'); rc = a[i + 1:i + 3]; a = a[:i] + a[i + 3:]
    if '--fin-engine-05j' in a: i = a.index('--fin-engine-05j'); fe5 = a[i + 1]; a = a[:i] + a[i + 2:]
    F, FE, T, TE = (json.load(open(x)) for x in a[:4])
    fs, ts = F['sched'], T['sched']
    print('\nMix, cumulative from 2026, MW (lithium MWh): one stage (fin pass) | two stages | gap | outside 5% and 250 MW\n')
    print('| Technology | Year | One stage | Two stages | Gap | Gap, % | Outside | Test 13 1% range |'); print('|---|---|---:|---:|---:|---:|---|---|')
    outside = []
    for k, n in TECH:
        if not (cum(fs, k, 2040) or cum(ts, k, 2040)): continue
        for Y in YS:
            f, t = cum(fs, k, Y), cum(ts, k, Y); g = t - f; p = (100 * g / f) if f else None
            o = abs(g) > 250 and (f == 0 or abs(g) > 0.05 * abs(f))
            r = T13.get((k, Y)); rs = ('%s to %s' % (fmt(r[0]), fmt(r[1]) if r[1] is not None else 'not measured')) if r else 'none'
            if o: outside.append((n, Y, g))
            print('| %s | %d | %s | %s | %s | %s | %s | %s |' % (n, Y, fmt(f), fmt(t), fmt(g), fmt(p, 1) if p is not None else '', 'yes' if o else 'no', rs))
    for k, n in (('coalMW', 'coal standing'), ('earlyRetMW', 'coal retired early')):
        for Y in YS:
            f, t = fs[str(Y)].get(k), ts[str(Y)].get(k); g = (t or 0) - (f or 0)
            o = abs(g) > 250 and (not f or abs(g) > 0.05 * abs(f))
            if o: outside.append((n, Y, g))
            print('| %s | %d | %s | %s | %s | %s | %s | none |' % (n, Y, fmt(f), fmt(t), fmt(g), fmt(100 * g / f, 1) if f else '', 'yes' if o else 'no'))
    print('\nEngine check, mean unserved GWh a year (standard error), limit 20, the same 20-draw measure\n')
    E = lambda L: {r['y']: r for r in L}
    fe, te = E(FE), E(TE); f5 = E(json.load(open(fe5))) if fe5 else None
    print('| Year | One stage | %sTwo stages | Two stages no worse | Cost, R bn: one stage | two stages | CO2, Mt: one stage | two stages |' % ('One stage on 05j | ' if f5 else ''))
    print('|---|---:|' + ('---:|' if f5 else '') + '---:|---|---:|---:|---:|---:|')
    worse = []
    for Y in YS:
        f, t = fe.get(Y), te.get(Y)
        if not f or not t: print('| %d | missing |' % Y); continue
        ref = f5[Y] if f5 and Y in f5 else f
        nw = t['mean'] <= ref['mean']
        if not nw: worse.append(Y)
        g = lambda r, k, s=1: fmt((r.get(k) or 0) / s, 2)
        print('| %d | %s (%s) | %s%s (%s) | %s | %s | %s | %s | %s |' % (Y, g(f, 'mean'), g(f, 'seMean'), ('%s (%s) | ' % (g(f5[Y], 'mean'), g(f5[Y], 'seMean'))) if f5 else '',
              g(t, 'mean'), g(t, 'seMean'), 'yes' if nw else 'no', g(f, 'cost'), g(t, 'cost'), g(f, 'co2', 1), g(t, 'co2', 1)))
    print('\nObjective\n')
    if rc:
        R = [json.load(open(x)) for x in rc]
        o1, o2 = R[0]['objective'], R[1]['objective']
        print('- Re-costed in the same one-stage LP (05j, 25 days, every build fixed): one stage R%s bn, two stages R%s bn, gap %s bn (%s%%).' % (fmt(o1 / 1e9, 3), fmt(o2 / 1e9, 3), fmt((o2 - o1) / 1e9, 3), fmt(100 * (o2 - o1) / o1, 3)))
    print('- For the record, not comparable: the fin pass\'s own LP objective R%s bn (05h); two stages\' step 2040 LP R%s bn.' % (fmt(F['objective'] / 1e9, 3), fmt(T['objective'] / 1e9, 3)))
    print('\nRule (699 (b)): gaps outside 5%% and 250 MW: %s. Engine no worse in every checked year: %s.' % ('; '.join('%s %d %s' % (n, Y, fmt(g)) for n, Y, g in outside) or 'none', 'yes' if not worse else 'no (%s)' % ', '.join(map(str, worse))))

if __name__ == '__main__':
    main()
