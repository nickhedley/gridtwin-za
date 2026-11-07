// Message 767 (c), option B of the 764 design note: the build LP's representative days drawn from the twelve modelled weather years
// (metered 2025 out), as a harness-only test. pathway_perfail.js (with pool_hook.patch) requires this file when REP_POOL is set; it
// replaces the page's bldRepDaysClustered in place, so the LP, the loop and the linking read the pooled days as they read today's.
//   REP_POOL=dump:<file>   write the pool's series (each modelled year's wind, new wind, fixed-tilt and tracking solar as the LP reads
//                          them, the demand profile, today's fleet) for pool_extremes.py, then exit.
//   REP_POOL=1 REP_POOL_EXTREMES=<year:day,...> REP_POOL_CHRON=<year>   the pooled days:
// 1. The pool: 4,380 days, each modelled year's 365, every day its calendar day's demand (the reference profile, as the engine) with that
//    year's wind and solar; the pool's mean of each series equals the page's twelve-year mean by construction (checked to 1e-9).
// 2. Extremes: the given pool days (pool_extremes.py: extremes.py's criteria across the pool), each a twelfth of a year.
// 3. Typical days: Ward on the same 72 features as today (demand, new wind, tracking solar, each normalised 0-1 over the pool) over the
//    other pool days, cut at n minus the extremes; the same tree as the page's bldWardClusters, built by the nearest-neighbour chain
//    (quadratic, not cubic); medoids as today (least summed distance). Weights: cluster size / 12.
// 4. One calendar day per representative day: the LP names days by calendar day, so two representatives may not share one. Extremes
//    keep theirs (two extremes on one calendar day stop the run); a typical cluster whose medoid's calendar day is taken (larger clusters
//    choose first) takes its next member by summed distance whose calendar day is free; counted in clusterInfo.
// 5. The twelve-year means re-imposed on the weighted typical days, extremes as they are (step 4 of today's rule, the extremes at 1/12).
// 6. Linking (option B): one chronology, REP_POOL_CHRON's 365 days, each reading its own cluster's representative (map365).
// The day order, prevD chain and fields are today's (wind, solar, windMod, solarTrk, roof, off); poolYear records each day's year.
module.exports = function install(w, env){
  const fs = require('fs');
  const mode = env.REP_POOL;
  if (mode.startsWith('dump:')){
    const out = mode.slice(5);
    w.__poolDump = s => { fs.writeFileSync(out, s); console.log('REP_POOL dump written: ' + out); process.exit(0); };
    w.eval(`bldRepDaysClustered = function(n, method, S0){ window.__poolDump(JSON.stringify((${poolSeries.toString()})(S0))); };`);
    return;
  }
  if (mode !== '1') throw new Error('REP_POOL must be 1 or dump:<file>');
  const EXT = (env.REP_POOL_EXTREMES || '').split(',').filter(Boolean).map(s => { const m = s.match(/^(\d{4}):(\d{1,3})$/); if (!m) throw new Error('REP_POOL_EXTREMES: year:day, ...'); return [+m[1], +m[2]]; });
  const CHRON = env.REP_POOL_CHRON;
  if (!/^\d{4}$/.test(CHRON || '')) throw new Error('REP_POOL_CHRON: a modelled weather year for the linking chronology');
  w.eval(`__nnWard = ${nnWard.toString()};`);
  w.eval(`{ const __series = ${poolSeries.toString()}; const __pooled = ${pooled.toString()};
    bldRepDaysClustered = function(n, method, S0){ return __pooled(${JSON.stringify({ EXT, CHRON })}, n, S0, __series); }; }`);
  console.log('REP_POOL: twelve-year pooled days, ' + EXT.length + ' extremes, chronology ' + CHRON);
};

// Page context. Each modelled year's series as the LP reads them (bldRepDaysClustered's per-unit series for a weather-year reference).
function poolSeries(S0){
  const S = S0 || (typeof state !== 'undefined' ? { ...FIXED, ...state } : FIXED), N = 365 * 24;
  const mod = bldWindModernOn(), trk = bldPvTrackingOn(), kw = mod ? windNewCorr(S.bldWindCorr ?? FIXED.bldWindCorr) : 1;
  const YRS = bldWeatherYears.meta.years.map(String), T = bldTwelveYearMeansAll(kw, trk);
  const R = a => Array.from(a, v => +v.toFixed(6));
  const wy = {};
  for (const y of YRS){
    const nat = weatherYearNational(y), W0 = nat.wind, P0 = nat.solar, Wm = mod ? windModOf(W0) : W0, Pt = trk ? solarTrkOf(P0) : P0;
    wy[y] = { wind: Float64Array.from(W0.slice(0, N)), windN: Float64Array.from({ length: N }, (_, i) => Math.min(1, kw * Wm[i])),
              solar: Float64Array.from(P0.slice(0, N)), solarT: Float64Array.from(Pt.slice(0, N)), roof: Float64Array.from(P0.slice(0, N)),
              off: offshoreSeriesFor({ wind: W0 }) };
  }
  // dump form (for pool_extremes.py) when called with no consumer: plain arrays
  wy.__T = T; wy.__kw = kw; wy.__mod = mod; wy.__trk = trk; wy.__years = YRS;
  if (typeof window !== 'undefined' && window.__poolDump && !window.__poolInLP){
    const o = { years: YRS, kw, mod, trk, T, demand: R(PROFILES.demand.slice(0, N)),
      fleet: { windMW: S.windMW, pvUtilityMW: S.pvUtilityMW, rooftopMW: S.rooftopMW, congPct: S.congestionCurtailOn ?? FIXED.congestionCurtailOn ? S.congestionCurtailPct : 0, roofDerate: S.rooftopDerate ?? 0.78 },
      wy: Object.fromEntries(YRS.map(y => [y, { wind: R(wy[y].wind), windN: R(wy[y].windN), solar: R(wy[y].solar), solarT: R(wy[y].solarT) }])) };
    return o;
  }
  return wy;
}

// Page context. The pooled representative days (see the header).
function pooled(O, n, S0, series){
  window.__poolInLP = true;
  const S = S0 || (typeof state !== 'undefined' ? { ...FIXED, ...state } : FIXED), N = 365 * 24, KEYS = ['wind', 'windN', 'solar', 'solarT', 'roof'];
  const mod0 = bldWindModernOn(), trk0 = bldPvTrackingOn(), kw0 = mod0 ? windNewCorr(S.bldWindCorr ?? FIXED.bldWindCorr) : 1;
  const sk = JSON.stringify([kw0, mod0, trk0, wxWindCorrOn()]), ck = JSON.stringify([n, O, sk]);
  window.__poolSeries = window.__poolSeries || {}; window.__poolCache = window.__poolCache || {};
  const wy = window.__poolSeries[sk] || (window.__poolSeries[sk] = series(S0)), YRS = wy.__years, NY = YRS.length, T = wy.__T, kw = wy.__kw, mod = wy.__mod, trk = wy.__trk;
  if (!T) throw new Error("REP_POOL needs the twelve weather years, which are not loaded");
  let C = window.__poolCache[ck];
  if (!C){
    const P = NY * 365;
    // 1. The pool's means equal the twelve-year means.
    for (const key of KEYS){ let s = 0; for (const y of YRS) for (let i = 0; i < N; i++) s += wy[y][key][i];
      if (Math.abs(s / (NY * N) - T[key]) > 1e-9) throw new Error('REP_POOL: the pool mean of ' + key + ' ' + s / (NY * N) + ' is not the twelve-year mean ' + T[key]); }
    const yi = p => Math.floor(p / 365), dy = p => p % 365, val = (key, p, h) => wy[YRS[yi(p)]][key][dy(p) * 24 + h];
    // 2. Extremes.
    const E = O.EXT.map(([y, d]) => { const i = YRS.indexOf(String(y)); if (i < 0 || !(d >= 0 && d < 365)) throw new Error('REP_POOL_EXTREMES: ' + y + ':' + d + ' is not a pool day'); return i * 365 + d; });
    const Eset = new Set(E); if (Eset.size !== E.length) throw new Error('REP_POOL_EXTREMES: a day listed twice');
    const eDays = new Set(); for (const p of E){ if (eDays.has(dy(p))) throw new Error('REP_POOL_EXTREMES: two extremes on calendar day ' + dy(p)); eDays.add(dy(p)); }
    const k = n - E.length;
    if (!(k >= 1 && n <= 365)) throw new Error('REP_POOL: ' + n + ' days with ' + E.length + ' extremes leaves no typical day');
    // 3. Features over the pool and Ward by the nearest-neighbour chain.
    const mm = (key) => { let lo = Infinity, hi = -Infinity; for (const y of YRS) for (const v of wy[y][key]) { if (v < lo) lo = v; if (v > hi) hi = v; } return [lo, hi]; };
    let dlo = Infinity, dhi = -Infinity; for (let i = 0; i < N; i++){ const v = PROFILES.demand[i]; if (v < dlo) dlo = v; if (v > dhi) dhi = v; }
    const [wlo, whi] = mm('windN'), [slo, shi] = mm('solarT');
    const X = new Array(P);
    for (let p = 0; p < P; p++){ const x = new Float64Array(72), y = YRS[yi(p)], d = dy(p);
      for (let h = 0; h < 24; h++){ x[h] = dhi > dlo ? (PROFILES.demand[d * 24 + h] - dlo) / (dhi - dlo) : 0;
        x[24 + h] = whi > wlo ? (wy[y].windN[d * 24 + h] - wlo) / (whi - wlo) : 0; x[48 + h] = shi > slo ? (wy[y].solarT[d * 24 + h] - slo) / (shi - slo) : 0; }
      X[p] = x; }
    const ids = []; for (let p = 0; p < P; p++) if (!Eset.has(p)) ids.push(p);
    const groups = new Map((__nnWard(X, ids, k)).map((c, i) => [i, c]));
    const dist = (p, q) => { const a = X[p], b = X[q]; let s = 0; for (let t = 0; t < 72; t++){ const e = a[t] - b[t]; s += e * e; } return Math.sqrt(s); };
    // Medoids, with each member ranked by summed distance (ties to the lower pool day).
    const cl = [...groups.values()].map(c => { c.sort((a, b) => a - b); const sc = c.map(a => { let s = 0; for (const b of c) s += dist(a, b); return [a, s]; });
      sc.sort((x, y) => x[1] - y[1] || x[0] - y[0]); return { members: c, ranked: sc }; });
    // 4. One calendar day per representative: extremes first, then clusters by size (larger first; ties to the lower medoid).
    cl.sort((x, y) => y.members.length - x.members.length || x.ranked[0][0] - y.ranked[0][0]);
    const used = new Set(eDays); let moved = 0, extraDist = 0;
    for (const c of cl){ let pick = null;
      for (const [p, s] of c.ranked) if (!used.has(dy(p))){ pick = p; if (p !== c.ranked[0][0]){ moved++; extraDist += s - c.ranked[0][1]; } break; }
      if (pick === null) throw new Error('REP_POOL: no free calendar day in a cluster of ' + c.members.length);
      c.rep = pick; used.add(dy(pick)); }
    const repOf = new Int32Array(P).fill(-1), wt = {};
    for (const c of cl){ for (const p of c.members) repOf[p] = c.rep; wt[c.rep] = c.members.length / NY; }
    for (const p of E){ repOf[p] = p; wt[p] = 1 / NY; }
    const reps = Object.keys(wt).map(Number).sort((a, b) => dy(a) - dy(b));
    // 5. The twelve-year means re-imposed on the weighted typical days.
    const g = {};
    for (const key of KEYS){ const v = [], w = []; let ext = 0, ew = 0;
      for (const p of reps){ if (Eset.has(p)){ for (let h = 0; h < 24; h++) ext += wt[p] * val(key, p, h); ew += wt[p]; } else for (let h = 0; h < 24; h++){ v.push(val(key, p, h)); w.push(wt[p]); } }
      const tgt = (T[key] * N - ext) / (N - 24 * ew); g[key] = bldScaleTo(v, tgt, w, key + ' on the pooled typical days'); }
    // 6. Linking: the chronology year's 365 days, each its own cluster's representative.
    const ci = YRS.indexOf(String(O.CHRON)); if (ci < 0) throw new Error('REP_POOL_CHRON: ' + O.CHRON + ' is not a modelled weather year');
    const map = new Int32Array(365); for (let d = 0; d < 365; d++) map[d] = dy(repOf[ci * 365 + d]);
    let wsum = 0; for (const p of reps) wsum += wt[p];
    C = window.__poolCache[ck] = { reps, wt, g, map, E: Eset, info: { method: 'pool (767 (c) option B)', years: YRS, chron: O.CHRON, extremes: E.length, typical: k,
      moved, extraDist: +extraDist.toFixed(4), weightSum: wsum, repDays: reps.map(p => YRS[yi(p)] + ':' + dy(p)), weights: reps.map(p => +wt[p].toFixed(6)) } };
  }
  const { reps, wt, g, map, E } = C, yi = p => Math.floor(p / 365), dy = p => p % 365;
  const ser = (key, p) => Array.from({ length: 24 }, (_, h) => { const v = wy[YRS[yi(p)]][key][dy(p) * 24 + h]; return E.has(p) ? v : Math.min(1, g[key] * v); });
  const days = reps.map((p, i) => {
    const y = YRS[yi(p)], d = dy(p), r = { d, weight: wt[p], prevD: i === 0 ? undefined : dy(reps[i - 1]), extreme: E.has(p), wind: ser('wind', p), solar: ser('solar', p), poolYear: +y };
    const OFF = wy[y].off; if (OFF) r.off = Array.from({ length: 24 }, (_, h) => OFF[d * 24 + h]);
    r.roof = ser('roof', p);
    if (mod) r.windMod = ser('windN', p).map(v => v / kw);
    if (trk) r.solarTrk = ser('solarT', p);
    return r;
  });
  days.map365 = Array.from(map);
  days.clusterInfo = C.info;
  // Checks: 25 distinct calendar days in order; weights sum to 365; every key's weighted annual mean the twelve-year mean; map365 reads
  // only representative days, and each of the chronology's days reads its own cluster's.
  if (!C.checked){
    const ds = days.map(r => r.d); if (ds.length !== n || new Set(ds).size !== n || ds.some((d, i) => i && d <= ds[i - 1])) throw new Error('REP_POOL check: days not ' + n + ' distinct in order');
    const W = days.reduce((a, r) => a + r.weight, 0); if (Math.abs(W - 365) > 1e-9) throw new Error('REP_POOL check: weights sum to ' + W);
    const ann = {}; for (const [key, f] of [['wind', r => r.wind], ['solar', r => r.solar], ['roof', r => r.roof], ['solarT', r => r.solarTrk], ['windN', r => r.windMod && r.windMod.map(v => Math.min(1, kw * v))]]){
      if (!f(days[0])) continue; ann[key] = days.reduce((a, r) => a + r.weight * f(r).reduce((x, y) => x + y, 0), 0) / N;
      if (Math.abs(ann[key] - T[key]) > 1e-6) throw new Error('REP_POOL check: ' + key + ' annual mean ' + ann[key] + ' against ' + T[key]); }
    const set = new Set(ds); if (!days.map365.every(d => set.has(d))) throw new Error('REP_POOL check: map365 reads a day that is not a representative');
    C.info.annualMeans = Object.fromEntries(Object.entries(ann).map(([k, v]) => [k, +v.toFixed(8)])); C.checked = true;
    console.log('REP_POOL days: ' + C.info.repDays.join(',') + '; weights ' + C.info.weights.join(',') + '; moved ' + C.info.moved + ' (extra summed distance ' + C.info.extraDist + '); means ' + JSON.stringify(C.info.annualMeans));
  }
  return days;
}

// Page context. Ward's clustering on squared Euclidean distances (Lance-Williams), cut at k clusters: the same partition as the page's
// bldWardClusters (cubic), built by the nearest-neighbour chain (quadratic); returns the clusters (arrays of ids).
function nnWard(X, ids, k){
    const m = ids.length, D = new Float64Array(m * m);
    for (let i = 0; i < m; i++){ const a = X[ids[i]]; for (let j = i + 1; j < m; j++){ const b = X[ids[j]]; let s = 0; for (let q = 0; q < 72; q++){ const e = a[q] - b[q]; s += e * e; } D[i * m + j] = D[j * m + i] = s; } }
    const act = new Uint8Array(m).fill(1), sz = new Int32Array(m).fill(1), merges = [], chain = [];
    let left = m, first = 0;
    while (left > 1){
      if (!chain.length){ while (!act[first]) first++; chain.push(first); }
      const a = chain[chain.length - 1], prev = chain.length > 1 ? chain[chain.length - 2] : -1;
      let b = prev, bd = prev >= 0 ? D[a * m + prev] : Infinity;
      for (let q = 0; q < m; q++) if (act[q] && q !== a && D[a * m + q] < bd){ bd = D[a * m + q]; b = q; }
      if (b === prev){
        chain.pop(); chain.pop(); merges.push([a, b, bd]);
        const lo = Math.min(a, b), hi = Math.max(a, b), na = sz[a], nb = sz[b];
        for (let q = 0; q < m; q++) if (act[q] && q !== a && q !== b){ const nq = sz[q];
          const v = ((nq + na) * D[a * m + q] + (nq + nb) * D[b * m + q] - nq * bd) / (nq + na + nb); D[lo * m + q] = D[q * m + lo] = v; }
        sz[lo] = na + nb; act[hi] = 0; left--;
      } else chain.push(b);
    }
    // The k-cluster cut: the m - k lowest merges (Ward's heights rise up the tree, so this is the greedy rule's partition).
    merges.sort((x, y) => x[2] - y[2] || Math.min(x[0], x[1]) - Math.min(y[0], y[1]));
    const par = Int32Array.from({ length: m }, (_, i) => i), find = i => { while (par[i] !== i){ par[i] = par[par[i]]; i = par[i]; } return i; };
    for (let t = 0; t < m - k; t++){ const ra = find(merges[t][0]), rb = find(merges[t][1]); if (ra !== rb) par[Math.max(ra, rb)] = Math.min(ra, rb); }
    const groups = new Map(); for (let i = 0; i < m; i++){ const r = find(i); if (!groups.has(r)) groups.set(r, []); groups.get(r).push(ids[i]); }
  if (groups.size !== k) throw new Error('nnWard: the cut gave ' + groups.size + ' clusters, not ' + k);
  return [...groups.values()];
}
