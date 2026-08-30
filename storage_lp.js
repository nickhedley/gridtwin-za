#!/usr/bin/env node
/**
 * storage_lp.js — price-taker storage LP, the fix the heuristics could not deliver.
 *
 * WHY. Two ordering heuristics were tried and reverted (30 Aug 2026). Both failed for
 * the same reason: deciding which store gets a megawatt is a COMPARATIVE question that
 * depends on whether the coming event outlasts the short store, given both states of
 * charge. That is a value function on SOC and a ranking cannot express one. This is
 * the standard answer — co-optimise charge, discharge and SOC across the whole horizon,
 * which is what PLEXOS and PyPSA do.
 *
 * FORMULATION, per tier t and hour h:
 *   vars   c[t,h] charge MW, d[t,h] discharge MW, s[t,h] state of charge MWh
 *   s[t,h] - s[t,h-1] - eff[t]*c[t,h] + d[t,h] = 0        SOC balance
 *   0 <= c,d <= P[t]                                       power
 *   0 <= s   <= E[t]                                       energy
 *   s[t,0] = s[t,8759]                                     cyclic, no free energy
 *   sum_t d[t,h] <= residual[h]                            cannot discharge into nothing
 *   sum_t c[t,h] <= chargeable[h]                          cannot charge from nothing
 *   objective  min  sum_h mc[h] * ( sum_t c[t,h] - sum_t d[t,h] )
 *
 * The objective is the price-taker one: buy cheap, sell dear, against a FIXED marginal
 * cost series from a prior dispatch. That is a linear approximation — it does not
 * re-clear the market — but it is the right first cut and it is what the literature
 * calls price-taker modelling.
 *
 * PERFECT FORESIGHT. The LP sees the whole year. Real operators forecast. Every result
 * from this file is an UPPER BOUND on storage value, not an estimate. Say so.
 *
 *   node storage_lp.js [root] [--hours N]
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const highsLoader = require('highs');

const ROOT = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '.';
const hoursArg = process.argv.indexOf('--hours');
const HOURS_LIMIT = hoursArg > 0 ? parseInt(process.argv[hoursArg + 1], 10) : 0;

function makeDom(){
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  return new JSDOM(html, {
    runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true,
    url: 'file://' + path.resolve(ROOT) + '/index.html',
    beforeParse(w){
      w.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, {
        get: () => () => ({ addColorStop(){}, data: [], width: 0, measureText: () => ({ width: 10 }) }) });
      const ch = () => new Proxy(function(){ return ch(); }, { get: () => ch() });
      w.L = new Proxy({}, { get(){ return function(){ return ch(); }; } });
      w.onerror = () => {};
      Object.defineProperty(w.history, 'replaceState', { value: () => {}, writable: true });
      w.URL.createObjectURL = () => 'blob:x';
      w.Worker = function(){ this.postMessage = () => {}; };
      w.fetch = async (u) => {
        try {
          const cl = String(u).split('?')[0].replace(/^file:.*?\/(?=nodal\/|profiles)/, '');
          const t = fs.readFileSync(path.join(path.resolve(ROOT), cl), 'utf8');
          return { ok: true, json: async () => JSON.parse(t), text: async () => t };
        } catch (e) { return { ok: false, json: async () => { throw e; }, text: async () => { throw e; } }; }
      };
    },
  });
}

(async () => {
  const dom = makeDom();
  await new Promise(r => setTimeout(r, 7000));
  const w = dom.window;

  const probe = (src) => {
    const s = w.document.createElement('script');
    w.__p = null;
    s.textContent = `try{ window.__p = JSON.stringify((function(){ ${src} })()); }
                     catch(e){ window.__p = JSON.stringify({error:String(e)+' '+e.stack}); }`;
    w.document.body.appendChild(s);
    return JSON.parse(w.__p);
  };

  // Pass one: a normal dispatch, to get prices and the residual the storage must serve.
  const d = probe(`
    const seriti = { newWindMW: 20000-FIXED.windMW, newPvMW: 25000-FIXED.pvUtilityMW,
      newNuclearMW: 0, coalEAFPct: 70, coalDecomMW: 32000, newCcgtMW: 25000,
      newBattMW: 20000, newBattHours: 10, newIronAirMW: 20000 };
    const r = simulate({ ...state, ...seriti }, PROFILES);
    const N = HOURS;
    const mc = Array.from(r.marginalP);
    // What storage could serve: gas and diesel are the expensive tail it should displace.
    const serveable = [];
    const chargeable = [];
    for (let h = 0; h < N; h++){
      serveable.push((r.stack.ccgt[h]||0) + (r.stack.diesel[h]||0));
      // headroom on coal plus anything being spilled
      chargeable.push((r.curtailMW ? r.curtailMW[h]||0 : 0) + Math.max(0, (r.chargeMW ? r.chargeMW[h]||0 : 0)));
    }
    const tiers = [
      { k:'li',  P: 20000, E: 200000,  eff: FIXED.battEff },
      { k:'fe',  P: 20000, E: 2000000, eff: FIXED.newIronAirEff ?? 0.45 },
    ];
    return { N, mc, serveable, chargeable, tiers,
             julGas: (()=>{ let s=0; for(let h=4344;h<5088;h++) s+=(r.stack.ccgt[h]||0)+(r.stack.diesel[h]||0); return s/1000; })(),
             battTWh: r.E.batt/1e6 };
  `);
  if (d.error){ console.log('probe failed:', d.error.slice(0,300)); process.exit(1); }

  const N = HOURS_LIMIT > 0 ? Math.min(HOURS_LIMIT, d.N) : d.N;
  console.log(`\nPRICE-TAKER STORAGE LP  (${N} hours, ${d.tiers.length} tiers)`);
  console.log(`  baseline July gas ${d.julGas.toFixed(0)} GWh · storage ${d.battTWh.toFixed(2)} TWh`);

  // Build the LP.
  const L = ['Minimize', ' obj:'];
  const obj = [];
  for (let h = 0; h < N; h++){
    const p = d.mc[h];
    for (const t of d.tiers){
      obj.push(`${p >= 0 ? '+' : '-'} ${Math.abs(p).toFixed(4)} c_${t.k}_${h}`);
      obj.push(`${p >= 0 ? '-' : '+'} ${Math.abs(p).toFixed(4)} d_${t.k}_${h}`);
    }
  }
  L.push('  ' + obj.join(' '));
  L.push('Subject To');
  for (const t of d.tiers){
    for (let h = 0; h < N; h++){
      const prev = h === 0 ? `s_${t.k}_${N-1}` : `s_${t.k}_${h-1}`;
      L.push(` bal_${t.k}_${h}: s_${t.k}_${h} - ${prev} - ${t.eff.toFixed(4)} c_${t.k}_${h} + d_${t.k}_${h} = 0`);
    }
  }
  for (let h = 0; h < N; h++){
    L.push(` srv_${h}: ` + d.tiers.map(t => `d_${t.k}_${h}`).join(' + ') + ` <= ${Math.max(0, d.serveable[h]).toFixed(2)}`);
    L.push(` chg_${h}: ` + d.tiers.map(t => `c_${t.k}_${h}`).join(' + ') + ` <= ${Math.max(0, d.chargeable[h]).toFixed(2)}`);
  }
  L.push('Bounds');
  for (const t of d.tiers) for (let h = 0; h < N; h++){
    L.push(` 0 <= c_${t.k}_${h} <= ${t.P}`);
    L.push(` 0 <= d_${t.k}_${h} <= ${t.P}`);
    L.push(` 0 <= s_${t.k}_${h} <= ${t.E}`);
  }
  L.push('End');
  const lp = L.join('\n');
  console.log(`  LP: ${(lp.length/1e6).toFixed(1)} MB, ${d.tiers.length*N*3} variables`);

  const highs = await highsLoader({ locateFile: f => path.join(__dirname, 'node_modules/highs/build', f) });

  // ── ROLLING HORIZON ───────────────────────────────────────────────────────
  // THE PERFECT-FORESIGHT PROBLEM, and how production cost models handle it.
  //
  // The single full-year solve above sees every hour before deciding anything. No
  // operator does. PCMs solve a WINDOW - typically 1-2 days for day-ahead markets,
  // longer for storage studies - then step forward, carrying state of charge across.
  // Foresight is limited to the window, which is the whole point.
  //
  // Running both is the useful thing: the full-year solve is an UPPER BOUND on storage
  // value, the rolling solve is closer to achievable, and the GAP between them is the
  // value of forecasting. That gap is a result in itself and is rarely reported.
  //
  // The window must exceed the longest store's duration or the run is rigged: a
  // 100-hour asset inside a 48-hour window can never plan a full cycle, which is
  // exactly the failure the 25-hour heuristic had.
  const solveRolling = (windowH, stepH) => {
    const soc = {}; for (const t of d.tiers) soc[t.k] = 0;
    const sched = {}; for (const t of d.tiers) sched[t.k] = { chg: new Float64Array(N), dis: new Float64Array(N) };
    let worst = 'Optimal', nSolves = 0;
    for (let start = 0; start < N; start += stepH){
      const end = Math.min(N, start + windowH);
      const M = end - start; if (M < 2) break;
      const LL = ['Minimize', ' obj:'];
      const ob = [];
      for (let i = 0; i < M; i++){
        const p = d.mc[start + i];
        for (const t of d.tiers){
          ob.push(`${p >= 0 ? '+' : '-'} ${Math.abs(p).toFixed(4)} c_${t.k}_${i}`);
          ob.push(`${p >= 0 ? '-' : '+'} ${Math.abs(p).toFixed(4)} d_${t.k}_${i}`);
        }
      }
      LL.push('  ' + ob.join(' '));
      LL.push('Subject To');
      for (const t of d.tiers) for (let i = 0; i < M; i++){
        if (i === 0)
          LL.push(` bal_${t.k}_0: s_${t.k}_0 - ${t.eff.toFixed(4)} c_${t.k}_0 + d_${t.k}_0 = ${soc[t.k].toFixed(3)}`);
        else
          LL.push(` bal_${t.k}_${i}: s_${t.k}_${i} - s_${t.k}_${i-1} - ${t.eff.toFixed(4)} c_${t.k}_${i} + d_${t.k}_${i} = 0`);
      }
      for (let i = 0; i < M; i++){
        LL.push(` srv_${i}: ` + d.tiers.map(t => `d_${t.k}_${i}`).join(' + ') + ` <= ${Math.max(0, d.serveable[start+i]).toFixed(2)}`);
        LL.push(` chg_${i}: ` + d.tiers.map(t => `c_${t.k}_${i}`).join(' + ') + ` <= ${Math.max(0, d.chargeable[start+i]).toFixed(2)}`);
      }
      // END-OF-WINDOW FLOOR. Without it the last window hours dump everything, because
      // stored energy has no value past the horizon - the classic rolling-horizon
      // artefact. Requiring the store to end where it started removes the free lunch.
      // A production model would use a value function here; this is the crude version
      // and it is deliberately conservative.
      for (const t of d.tiers)
        LL.push(` endfloor_${t.k}: s_${t.k}_${M-1} >= ${Math.min(soc[t.k], t.E * 0.5).toFixed(3)}`);
      LL.push('Bounds');
      for (const t of d.tiers) for (let i = 0; i < M; i++){
        LL.push(` 0 <= c_${t.k}_${i} <= ${t.P}`);
        LL.push(` 0 <= d_${t.k}_${i} <= ${t.P}`);
        LL.push(` 0 <= s_${t.k}_${i} <= ${t.E}`);
      }
      LL.push('End');
      const r2 = highs.solve(LL.join('\n'), { time_limit: 60 });
      nSolves++;
      if (r2.Status !== 'Optimal'){ worst = r2.Status; continue; }
      // Keep only the STEP hours, then advance. Keeping the whole window would
      // double-count the overlap and reintroduce the foresight we are trying to limit.
      const keep = Math.min(stepH, M);
      for (const [k, v] of Object.entries(r2.Columns)){
        const m = k.match(/^([cds])_(\w+)_(\d+)$/); if (!m) continue;
        const [, kind, tier, is] = m; const i = +is;
        if (i >= keep || !sched[tier]) continue;
        if (kind === 'c') sched[tier].chg[start + i] = v.Primal || 0;
        if (kind === 'd') sched[tier].dis[start + i] = v.Primal || 0;
      }
      // Carry SOC forward from the last KEPT hour.
      for (const t of d.tiers){
        let sv = soc[t.k];
        for (let i = 0; i < keep; i++) sv += sched[t.k].chg[start+i] * t.eff - sched[t.k].dis[start+i];
        soc[t.k] = Math.max(0, Math.min(t.E, sv));
      }
    }
    return { sched, worst, nSolves };
  };

  const t0 = Date.now();
  const res = highs.solve(lp, { time_limit: 600 });
  console.log(`  solved in ${((Date.now()-t0)/1000).toFixed(1)} s · status ${res.Status}`);
  if (res.Status !== 'Optimal'){ console.log('  NOT OPTIMAL — results withheld'); process.exit(1); }

  // Read the schedule back.
  const out = {};
  for (const t of d.tiers){ out[t.k] = { chg: 0, dis: 0, maxSoc: 0, julDis: 0 }; }
  for (const [k, v] of Object.entries(res.Columns)){
    const m = k.match(/^([cds])_(\w+)_(\d+)$/); if (!m) continue;
    const [, kind, tier, hs] = m; const h = +hs; const val = v.Primal || 0;
    if (!out[tier]) continue;
    if (kind === 'c') out[tier].chg += val;
    if (kind === 'd'){ out[tier].dis += val; if (h >= 4344 && h < 5088) out[tier].julDis += val; }
    if (kind === 's' && val > out[tier].maxSoc) out[tier].maxSoc = val;
  }
  console.log('\n  tier   charged TWh   discharged TWh   peak SOC MWh   JULY discharge GWh');
  let julTotal = 0;
  for (const t of d.tiers){
    const o = out[t.k]; julTotal += o.julDis/1000;
    console.log(`  ${t.k.padEnd(6)}${(o.chg/1e6).toFixed(2).padStart(12)}${(o.dis/1e6).toFixed(2).padStart(17)}`
      + `${o.maxSoc.toFixed(0).padStart(15)}${(o.julDis/1000).toFixed(0).padStart(21)}`);
  }
  console.log(`\n  July gas that storage could displace: ${julTotal.toFixed(0)} GWh of ${d.julGas.toFixed(0)} GWh`);
  console.log(`  = ${(100*julTotal/Math.max(1,d.julGas)).toFixed(1)}% of July gas`);
  // ── DUALS: the opportunity value of stored energy ─────────────────────────
  // The dual on each SOC balance row is what one more MWh in that store is worth in
  // that hour. It is the number the two-pass reservation price was approximating, and
  // the quantity a storage developer actually wants. Rows come back index-keyed, so
  // names are recovered from the LP text in order - the count match is the check.
  {
    const lines = lp.split('\n');
    const ci = lines.findIndex(l => /^Subject To$/.test(l.trim()));
    const bi = lines.findIndex((l, i) => i > ci && /^Bounds$/.test(l.trim()));
    const names = [];
    for (let i = ci + 1; i < (bi < 0 ? lines.length : bi); i++){
      const m = lines[i].match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*:/);
      if (m) names.push(m[1]);
    }
    const rows = res.Rows || {};
    console.log(`\n  constraint rows parsed ${names.length} · HiGHS returned ${Object.keys(rows).length}`
      + (names.length === Object.keys(rows).length ? '  (match)' : '  MISMATCH - duals unreliable'));
    if (names.length === Object.keys(rows).length){
      const byTier = {};
      Object.entries(rows).forEach(([k, v]) => {
        const n = names[+k]; if (!n) return;
        const m = n.match(/^bal_(\w+)_(\d+)$/); if (!m) return;
        (byTier[m[1]] = byTier[m[1]] || []).push(Math.abs(v.Dual || 0));
      });
      console.log('\n  OPPORTUNITY VALUE of stored energy, R/MWh');
      console.log('  tier      mean      p50      p90      max');
      for (const [k, arr] of Object.entries(byTier)){
        arr.sort((a,b)=>a-b);
        const q = f => arr[Math.min(arr.length-1, Math.floor(arr.length*f))];
        const mean = arr.reduce((a,b)=>a+b,0)/arr.length;
        console.log(`  ${k.padEnd(6)}${mean.toFixed(0).padStart(10)}${q(0.5).toFixed(0).padStart(9)}`
          + `${q(0.9).toFixed(0).padStart(9)}${arr[arr.length-1].toFixed(0).padStart(9)}`);
      }
    }
  }

  // ── ROLLING vs PERFECT ────────────────────────────────────────────────────
  for (const [wH, sH] of [[168, 24], [336, 48]]){
    const t1 = Date.now();
    const { sched, worst, nSolves } = solveRolling(wH, sH);
    let jul = 0, tot = 0;
    for (const t of d.tiers) for (let h = 0; h < N; h++){
      tot += sched[t.k].dis[h];
      if (h >= 4344 && h < 5088) jul += sched[t.k].dis[h];
    }
    console.log(`\n  ROLLING ${wH} h window, ${sH} h step · ${nSolves} solves · `
      + `${((Date.now()-t1)/1000).toFixed(1)} s · worst status ${worst}`);
    console.log(`    July displacement ${(jul/1000).toFixed(0)} GWh `
      + `(${(100*jul/1000/Math.max(1,d.julGas)).toFixed(1)}% of July gas) · annual discharge ${(tot/1e6).toFixed(2)} TWh`);
  }

  console.log('\n  PERFECT FORESIGHT gives the UPPER BOUND. The rolling runs limit');
  console.log('  foresight to the window, as a production cost model does. The GAP');
  console.log('  between them is the value of forecasting.');
  process.exit(0);
})();
