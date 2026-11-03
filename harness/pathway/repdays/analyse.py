# Measurement script for message 673 (b) (design note version 2, 3 Nov 2026): medoid clustering of the reference year's days, extremes appended at weight 1,
# rescaling to the twelve-year means (capped at 1), extremes on the plan's fleet by year. Reads series.json (extract.js) and
# c7's pathway output. Prints tables; writes res.json.
import json, sys, numpy as np
import os
D = json.load(open(sys.argv[1])); P = json.load(open(sys.argv[2])); REF = os.environ.get('REF', 'metered')   # 679 (a): a modelled weather year
Sr = D if REF == 'metered' else D['wy'][REF]
dem = np.array(D['demand']).reshape(365, 24); w0 = np.array(Sr['wind']).reshape(365, 24); wn = np.array(Sr['windN']).reshape(365, 24)
s0 = np.array(Sr['solar']).reshape(365, 24); st = np.array(Sr['solarT']).reshape(365, 24)
WY = {y: {k: np.array(v).reshape(365, 24) for k, v in d.items()} for y, d in D['wy'].items()}
T12 = {'windN': D['T']['wind'], 'solarT': D['T']['solar'],
       'wind': float(np.mean([WY[y]['wind'].mean() for y in WY])), 'solar': float(np.mean([WY[y]['solar'].mean() for y in WY]))}
SER = {'demand': dem, 'wind': w0, 'windN': wn, 'solar': s0, 'solarT': st}
out = {'T12': T12, 'year2025': {k: float(v.mean()) for k, v in SER.items()}}
print('2025 means', {k: round(v, 4) for k, v in out['year2025'].items()}, 'twelve-year', {k: round(v, 4) for k, v in T12.items()})
# Features: 72 values a day, each series min-max normalised over the year (tsam's default normalisation).
nz = lambda a: (a - a.min()) / (a.max() - a.min())
X = np.hstack([nz(dem), nz(wn), nz(st)])
dist = np.sqrt(((X[:, None, :] - X[None, :, :]) ** 2).sum(-1))
day = {k: v.mean(1) for k, v in SER.items()}
peakday = int(dem.max(1).argmax()); print('peak-demand day', peakday, round(dem.max(), 0), '(roof12 demand)')
def roll(v, n, sign=1):
    s = np.array([v[i:i + n].sum() for i in range(365 - n + 1)]); return int((sign * s).argmax())
# Extremes on today's fleet (bldRepDays: 4,000 MW solar, 3,600 MW wind, existing profiles)
net0 = dem - 4000 * s0 - 3600 * w0
ext_today = {'tightest hour': int(net0.max(1).argmax()), 'slackest day': int(dem.sum(1).argmin()),
             'worst 3-day net load': roll(net0.sum(1), 3) + 1, 'worst 3-day wind lull': roll(-w0.sum(1), 3) + 1, 'peak demand': peakday}
print('extremes, today\'s fleet', ext_today)
# The plan's fleet by year (c7 central): existing wind and solar on the 2025 profiles, new wind and tracking solar on theirs,
# rooftop on solar; congestion and rooftop derates as the LP; demand x the run's index (+ the 2027 block, as DEM_BLOCK).
b = P['build']; idx = {int(k): v for k, v in P['demand']['index'].items()}; F = D['fleet']; cong = 1 - F['congPct'] / 100
blk = {y: (930 if y >= 2027 else 0) for y in range(2026, 2041)}
def fleet(y):
    cw = sum(b.get('b_wind_%d' % yy, 0) for yy in range(2026, y + 1)); cp = sum(b.get('b_pv_%d' % yy, 0) for yy in range(2026, y + 1))
    cr = sum(b.get('b_rooftop_%d' % yy, 0) for yy in range(2026, y + 1)) + (P.get('roofStep2027', 0) if y >= 2027 else 0)
    ew = F['windMW'] + (P['fleet2026'].get('windMW', 0) if y == 2026 else 0); ep = F['pvUtilityMW'] + (P['fleet2026'].get('pvUtilityMW', 0) if y == 2026 else 0)
    return ew, cw, ep, cp, F['rooftopMW'] + cr
ext_year, tails = {}, {}
for y in range(2026, 2041):
    ew, cw, ep, cp, rf = fleet(y); d_y = dem * idx[y] + blk[y]
    vre = lambda W0, WN, S0, ST: (ew * W0 + cw * WN) * cong + (ep * S0 + cp * ST) * cong + rf * S0 * F['roofDerate']
    net = d_y - vre(w0, wn, s0, st); fw = ew * w0 + cw * wn
    ext_year[y] = {'tightest hour': int(net.max(1).argmax()), 'worst 3-day net load': roll(net.sum(1), 3) + 1,
                   'worst 3-day wind lull': roll(-fw.sum(1), 3) + 1, 'lowest net load': int(net.sum(1).argmin()),
                   'peak net MW': round(float(net.max()), 0), 'fleet': [round(ew + cw), round(ep + cp), round(rf)]}
    best = None
    for wyk, S in WY.items():
        n7 = (d_y - vre(S['wind'], S['windN'], S['solar'], S['solarT'])).sum(1); i = roll(n7, 7)
        v = n7[i:i + 7].sum()
        if best is None or v > best[0]: best = (v, wyk, i)
    tails[y] = (best[1], best[2])
print('\nextremes on the plan fleet (c7 central), day of year (0 = 1 Jan); fleet = wind, utility solar, rooftop MW')
for y, e in ext_year.items(): print(y, e, 'seed tail', tails[y])
# Seed tail on today's fleet, for comparison
bt = None
for wyk, S in WY.items():
    n7 = (dem - 4000 * S['solar'] - 3600 * S['wind']).sum(1); i = roll(n7, 7); v = n7[i:i + 7].sum()
    if bt is None or v > bt[0]: bt = (v, wyk, i)
print('seed tail on today\'s fleet', bt[1], bt[2])
out.update(ext_today=ext_today, ext_year={str(k): v for k, v in ext_year.items()}, tails={str(k): v for k, v in tails.items()}, tail_today=[bt[1], bt[2]])
# Weighted shares
def stats(reps, wts, scale=None):
    wts = np.array(wts, float); r = np.array(reps); res = {}
    for k in ('windN', 'solarT', 'wind', 'solar', 'demand'):
        v = day[k][r] * (scale[k] if scale and k in scale else 1); res[k] = float((wts * v).sum() / wts.sum())
    def sh(cond): return float(wts[cond].sum() / wts.sum())
    vw = day['windN'][r] * (scale['windN'] if scale else 1); vs = day['solarT'][r] * (scale['solarT'] if scale else 1)
    res['calm'] = sh(vw < 0.15); res['windy'] = sh(vw > 0.5); res['cloudy'] = sh(vs < 0.17); res['highdem'] = sh(day['demand'][r] > 24500)
    res['wind_sd'] = float(np.sqrt((wts * (vw - (wts * vw).sum() / wts.sum()) ** 2).sum() / wts.sum()))
    return res
allr = list(range(365)); real = stats(allr, [1] * 365)
tw = np.concatenate([WY[y]['windN'].mean(1) for y in WY]); ts = np.concatenate([WY[y]['solarT'].mean(1) for y in WY])
twelve = {'calm': float((tw < 0.15).mean()), 'windy': float((tw > 0.5).mean()), 'cloudy': float((ts < 0.17).mean()), 'wind_sd': float(tw.std())}
print('\nreal 2025 year', {k: round(v, 4) for k, v in real.items()}, '\ntwelve years', {k: round(v, 4) for k, v in twelve.items()})
out.update(real=real, twelve=twelve)
c7days = [d['d'] for d in D['rd'] if not d['tail']]; ext4 = [218, 359, 162, 195]
cur = stats(c7days, [365 / 12] * 12); print('current c7 days, equal weights', {k: round(v, 4) for k, v in cur.items()})
out['current'] = cur
def mapping(reps, ext):
    typ = [d for d in reps if d not in ext]; cnt = {d: 0 for d in reps}; md = []
    for d in range(365):
        if d in ext: m = d
        else: m = typ[int(np.argmin([dist[d, t] for t in typ]))]
        cnt[m] += 1; md.append(dist[d, m])
    return cnt, np.array(md)
cnt, md = mapping(c7days, ext4)
v1 = stats(list(cnt), list(cnt.values()))
print('v1 mapping on c7 days: counts', sorted(cnt.values()), 'mean distance all days %.3f, non-extreme %.3f' % (md.mean(), md[[d for d in range(365) if d not in ext4]].mean()))
print('  shares', {k: round(v, 4) for k, v in v1.items()})
out['v1'] = dict(counts=cnt, md=float(md.mean()), stats=v1)
def pam(idx, k, seed=0):
    sub = dist[np.ix_(idx, idx)]; n = len(idx)
    med = [int(sub.sum(1).argmin())]   # BUILD
    while len(med) < k:
        dmin = sub[:, med].min(1); gain = np.array([np.maximum(dmin - sub[:, j], 0).sum() if j not in med else -1 for j in range(n)]); med.append(int(gain.argmax()))
    cost = sub[:, med].min(1).sum()
    while True:   # SWAP
        best = (cost, None)
        for i in range(k):
            for j in range(n):
                if j in med: continue
                m2 = med[:i] + [j] + med[i + 1:]; c = sub[:, m2].min(1).sum()
                if c < best[0] - 1e-9: best = (c, m2)
        if best[1] is None: break
        cost, med = best
    lab = sub[:, med].argmin(1)
    return [idx[m] for m in med], [idx[med[l]] for l in lab]
def ward_medoid(idx, k):
    from scipy.cluster.hierarchy import linkage, fcluster
    Z = linkage(X[idx], 'ward'); lab = fcluster(Z, k, 'maxclust'); meds, asg = [], {}
    for c in sorted(set(lab)):
        mem = [idx[i] for i in range(len(idx)) if lab[i] == c]; m = mem[int(dist[np.ix_(mem, mem)].sum(1).argmin())]; meds.append(m)
        for q in mem: asg[q] = m
    return meds, [asg[i] for i in idx]
def rescale(reps, wts, ext, target, key, it=20):
    # tsam-style: scale the non-extreme representative days so the weighted year's mean equals the target, values capped at 1.
    r = np.array(reps); wts = np.array(wts, float); base = SER[key][r].copy(); typ = np.array([d not in ext for d in reps]); f = 1.0
    for _ in range(it):
        v = base.copy(); v[typ] = np.minimum(1, base[typ] * f); m = (wts * v.mean(1)).sum() / 365
        if abs(m - target) < 1e-6: break
        f *= target / m
    capped = float((base[typ] * f >= 1).mean())
    return f, m, capped
def clusterset(ext, k, method):
    idx = [d for d in range(365) if d not in ext]
    meds, lab = (pam if method == 'pam' else ward_medoid)(idx, k)
    cnt = {m: 0 for m in meds}; md = []
    for d, m in zip(idx, lab): cnt[m] += 1; md.append(dist[d, m])
    reps = sorted(set(meds) | set(ext)); wts = [cnt.get(d, 0) + (1 if d in ext else 0) for d in reps]
    st0 = stats(reps, wts); sc = {}; info = {}
    for key in ('windN', 'solarT', 'wind', 'solar'):
        f, m, cap = rescale(reps, wts, ext, T12[key], key); sc[key] = f; info[key] = dict(f=round(f, 4), mean=round(m, 4), capped_hours=round(cap, 4))
    st1 = stats(reps, wts, {k2: v for k2, v in sc.items()})   # shares after rescaling (factor applied to all non-extreme days; extremes are 1-in-365)
    typw = [cnt[m] for m in meds]
    return dict(reps=reps, weights=wts, wrange=[min(typw), max(typw)], md_all=float(np.sum(md) / 365), md_typ=float(np.mean(md)), raw=st0, rescaled=st1, scale=info)
import os
EXT5 = sorted(json.loads(os.environ["EXT"])) if os.environ.get("EXT") else sorted(set(ext4) | {peakday}); res = {}
print('\nextremes appended (weight 1):', EXT5)
for k in (8, 20, 45, 95):
    for meth in (('pam', 'ward') if k <= 20 else ('ward',)):
        r = clusterset(EXT5, k, meth); res['%s%d' % (meth, k)] = r
        print('%s k=%d (%d days): weights %s-%s, mean mapped distance all days %.3f (typical days %.3f)' % (meth, k, len(r['reps']), r['wrange'][0], r['wrange'][1], r['md_all'], r['md_typ']))
        if k == 8: print('   days', r['reps'], 'weights', r['weights'])
        print('   raw', {q: round(v, 4) for q, v in r['raw'].items()}); print('   rescaled', {q: round(v, 4) for q, v in r['rescaled'].items()}); print('   factors', r['scale'])
out['cluster'] = res
json.dump(out, open(sys.argv[3], 'w'), indent=1, default=lambda o: o.item() if hasattr(o, 'item') else str(o))
