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
    // SELF-DISCHARGE and CYCLE COST, added 30 Aug 2026. Both are ESTIMATES and both
    // are flagged as such - they are not in FIXED because no South African source
    // gives them, and inventing a constant would be worse than naming an assumption.
    //
    //   selfDisch  fraction of stored energy lost per HOUR. Immaterial for a 10-hour
    //              battery, material for a 100-hour store: at 0.05%/h a full iron-air
    //              charge loses about 5% over 100 hours, which is small against a 55%
    //              conversion loss but not nothing. Vanadium is worse per hour because
    //              of shunt currents through the electrolyte.
    //   cycleCost  R per MWh of THROUGHPUT, standing in for degradation. Lithium
    //              degrades on cycling and this is the dominant non-energy cost of
    //              running it hard. Vanadium's electrolyte does not degrade, so its
    //              figure is near zero and that is a genuine commercial advantage the
    //              model could not previously express. Iron-air is between.
    const tiers = [
      { k:'li',  P: 20000, E: 200000,  eff: FIXED.battEff,
        selfDisch: 0.00004, cycleCost: 250 },
      { k:'fe',  P: 20000, E: 2000000, eff: FIXED.newIronAirEff ?? 0.45,
        selfDisch: 0.0005,  cycleCost: 50 },
    ];
    // Reserve requirement per hour, straight from the engine so there is ONE
    // definition. Uses the NET requirement - what storage and thermal actually
    // compete for after curtailed VRE is credited as a provider.
    const reserveReq = [];
    for (let h = 0; h < N; h++) reserveReq.push(r.resReqMeanMW || 0);
    return { N, mc, serveable, chargeable, tiers, reserveReq,
             julGas: (()=>{ let s=0; for(let h=4344;h<5088;h++) s+=(r.stack.ccgt[h]||0)+(r.stack.diesel[h]||0); return s/1000; })(),
             battTWh: r.E.batt/1e6 };
  `);
  if (d.error){ console.log('probe failed:', d.error.slice(0,300)); process.exit(1); }

  const N = HOURS_LIMIT > 0 ? Math.min(HOURS_LIMIT, d.N) : d.N;
  // Reserve co-optimisation is OPT-IN. It is the change most likely to alter published
  // numbers, so it must be a deliberate choice rather than a silent default.
  const RESERVE_ON = process.argv.includes('--reserve');
  console.log(`\nPRICE-TAKER STORAGE LP  (${N} hours, ${d.tiers.length} tiers)`);
  console.log(`  baseline July gas ${d.julGas.toFixed(0)} GWh · storage ${d.battTWh.toFixed(2)} TWh`);

  // Build the LP.
  const L = ['Minimize', ' obj:'];
  const obj = [];
  for (let h = 0; h < N; h++){
    const p = d.mc[h];
    for (const t of d.tiers){
      // Buy at the marginal price, sell at it, and pay a degradation cost on every
      // MWh discharged. The cycle cost is what stops the LP cycling for a one-rand
      // spread, which it will otherwise happily do.
      obj.push(`+ ${(p + t.cycleCost * 0).toFixed(4)} c_${t.k}_${h}`.replace('+ -', '- '));
      obj.push(`- ${(p - t.cycleCost).toFixed(4)} d_${t.k}_${h}`.replace('- -', '+ '));
    }
  }
  L.push('  ' + obj.join(' '));
  L.push('Subject To');
  for (const t of d.tiers){
    for (let h = 0; h < N; h++){
      const prev = h === 0 ? `s_${t.k}_${N-1}` : `s_${t.k}_${h-1}`;
      const keep = (1 - t.selfDisch).toFixed(6);   // self-discharge on the carried SOC
      L.push(` bal_${t.k}_${h}: s_${t.k}_${h} - ${keep} ${prev} - ${t.eff.toFixed(4)} c_${t.k}_${h} + d_${t.k}_${h} = 0`);
    }
  }
  for (let h = 0; h < N; h++){
    L.push(` srv_${h}: ` + d.tiers.map(t => `d_${t.k}_${h}`).join(' + ') + ` <= ${Math.max(0, d.serveable[h]).toFixed(2)}`);
    L.push(` chg_${h}: ` + d.tiers.map(t => `c_${t.k}_${h}`).join(' + ') + ` <= ${Math.max(0, d.chargeable[h]).toFixed(2)}`);
    // RESERVE CO-OPTIMISATION. Power committed to reserve cannot also be discharging,
    // and energy behind it cannot be spent - reserve you cannot deliver is not reserve.
    // The ancillary work showed these two revenue streams compete directly; until now
    // the model let a battery sell both at once, which overstates what storage earns.
    if (RESERVE_ON){
      L.push(` res_${h}: ` + d.tiers.map(t => `r_${t.k}_${h}`).join(' + ') + ` >= ${(d.reserveReq[h]||0).toFixed(2)}`);
      for (const t of d.tiers){
        L.push(` rp_${t.k}_${h}: d_${t.k}_${h} + r_${t.k}_${h} <= ${t.P}`);          // power
        L.push(` re_${t.k}_${h}: r_${t.k}_${h} - s_${t.k}_${h} <= 0`);               // energy behind it
      }
    }
  }
  L.push('Bounds');
  for (const t of d.tiers) for (let h = 0; h < N; h++){
    L.push(` 0 <= c_${t.k}_${h} <= ${t.P}`);
    L.push(` 0 <= d_${t.k}_${h} <= ${t.P}`);
    L.push(` 0 <= s_${t.k}_${h} <= ${t.E}`);
    if (RESERVE_ON) L.push(` 0 <= r_${t.k}_${h} <= ${t.P}`);
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
          LL.push(` bal_${t.k}_${i}: s_${t.k}_${i} - ${(1-t.selfDisch).toFixed(6)} s_${t.k}_${i-1} - ${t.eff.toFixed(4)} c_${t.k}_${i} + d_${t.k}_${i} = 0`);
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
      // TERMINAL VALUE FUNCTION, replacing the crude "end where you started" floor.
      // A production model values energy left in the store at the horizon; without
      // that, the last hours of every window dump everything, because stored energy
      // is worthless past the edge. The value used is the expected price BEYOND the
      // window - the same forward-looking quantity the two-pass gate used - so the
      // store holds energy exactly when it is worth holding.
      //
      // This is a linear approximation to the value function. A proper one is concave
      // in SOC and would need piecewise segments; that is the next refinement and is
      // NOT done here.
      const fwd = [];
      for (let j = end; j < Math.min(N, end + windowH); j++) fwd.push(d.mc[j]);
      const termVal = fwd.length
        ? fwd.slice().sort((a,b)=>a-b)[Math.floor(fwd.length * 0.5)]
        : 0;
      for (const t of d.tiers)
        LL[1] = LL[1];   // objective already emitted; terminal value appended below
      if (termVal > 0) {
        const extra = d.tiers.map(t => `- ${termVal.toFixed(4)} s_${t.k}_${M-1}`).join(' ');
        LL[2] = LL[2] + ' ' + extra;
      }
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

  // ── FIXED-POINT ITERATION ─────────────────────────────────────────────────
  // The LP optimises against prices the HEURISTIC produced. Impose the LP's schedule
  // and the dispatch changes, so the prices change, so the LP's answer should change.
  // Iterating to a fixed point is the closest a price-taker model gets to genuine
  // co-optimisation, which would need storage inside the commitment problem.
  //
  // KNOWN RISK, stated before the result: schedule-price iterations are prone to
  // OSCILLATION rather than convergence. Storage flattens the peaks it was built to
  // exploit, which removes the spread that justified the schedule, which produces a
  // different schedule, and so on. Damping is the usual remedy. Whether this one
  // converges is the finding, not an assumption - so the loop reports the price
  // movement every round and does not claim success if it does not settle.
  if (process.argv.includes('--iterate')){
    console.log('\n  FIXED-POINT ITERATION (LP schedule -> dispatch -> prices -> LP)');
    console.log('  round   mean |dP| R/MWh   July gas GWh   storage TWh   LP obj');
    let mc = d.mc.slice();
    let prevJul = d.julGas;
    const DAMP = 0.5;   // new prices are blended with old; undamped oscillates
    for (let it = 1; it <= 5; it++){
      // Solve the LP against the current price series.
      const L2 = ['Minimize', ' obj:'];
      const o2 = [];
      for (let h = 0; h < N; h++) for (const t of d.tiers){
        o2.push(`+ ${mc[h].toFixed(4)} c_${t.k}_${h}`.replace('+ -','- '));
        o2.push(`- ${(mc[h] - t.cycleCost).toFixed(4)} d_${t.k}_${h}`.replace('- -','+ '));
      }
      L2.push('  ' + o2.join(' '));
      L2.push('Subject To');
      for (const t of d.tiers) for (let h = 0; h < N; h++){
        const prev = h === 0 ? `s_${t.k}_${N-1}` : `s_${t.k}_${h-1}`;
        L2.push(` bal_${t.k}_${h}: s_${t.k}_${h} - ${(1-t.selfDisch).toFixed(6)} ${prev} - ${t.eff.toFixed(4)} c_${t.k}_${h} + d_${t.k}_${h} = 0`);
      }
      for (let h = 0; h < N; h++){
        L2.push(` srv_${h}: ` + d.tiers.map(t=>`d_${t.k}_${h}`).join(' + ') + ` <= ${Math.max(0,d.serveable[h]).toFixed(2)}`);
        L2.push(` chg_${h}: ` + d.tiers.map(t=>`c_${t.k}_${h}`).join(' + ') + ` <= ${Math.max(0,d.chargeable[h]).toFixed(2)}`);
      }
      L2.push('Bounds');
      for (const t of d.tiers) for (let h = 0; h < N; h++){
        L2.push(` 0 <= c_${t.k}_${h} <= ${t.P}`);
        L2.push(` 0 <= d_${t.k}_${h} <= ${t.P}`);
        L2.push(` 0 <= s_${t.k}_${h} <= ${t.E}`);
      }
      L2.push('End');
      const r3 = highs.solve(L2.join('\n'), { time_limit: 300 });
      if (r3.Status !== 'Optimal'){ console.log(`  ${it}      solver returned ${r3.Status} - stopping`); break; }
      // Total discharge per hour, handed to the engine as a CAP.
      const dis = new Array(N).fill(0);
      for (const [k, v] of Object.entries(r3.Columns)){
        const m = k.match(/^d_(\w+)_(\d+)$/); if (!m) continue;
        dis[+m[2]] += v.Primal || 0;
      }
      // Re-dispatch with that schedule imposed TWO-SIDED, and read the new prices.
      // The cap version could only reduce storage output, so it could never confirm the
      // LP's claim. This replaces the heuristic's decisions and reports how much of the
      // schedule the engine could not physically follow.
      const back = probe(`
        const seriti = { newWindMW: 20000-FIXED.windMW, newPvMW: 25000-FIXED.pvUtilityMW,
          newNuclearMW: 0, coalEAFPct: 70, coalDecomMW: 32000, newCcgtMW: 25000,
          newBattMW: 20000, newBattHours: 10, newIronAirMW: 20000 };
        const forced = Float64Array.from(${JSON.stringify(dis.map(x=>Math.round(x*100)/100))});
        const r = simulate({ ...state, ...seriti,
          _forceStorageSchedule: { dis: forced, chg: forced } }, PROFILES);
        let jul = 0; for (let h=4344;h<5088;h++) jul += (r.stack.ccgt[h]||0)+(r.stack.diesel[h]||0);
        return { mc: Array.from(r.marginalP), julGas: jul/1000, batt: r.E.batt/1e6,
                 clip: r._forceClipped };
      `);
      if (back.error){ console.log('  re-dispatch failed:', back.error.slice(0,120)); break; }
      let dp = 0; for (let h = 0; h < N; h++) dp += Math.abs(back.mc[h] - mc[h]);
      dp /= N;
      const cl = back.clip ? ` · could not follow ${back.clip.disGWh.toFixed(0)} GWh of the schedule` : '';
      console.log(`  ${String(it).padEnd(6)}${dp.toFixed(1).padStart(16)}${back.julGas.toFixed(0).padStart(15)}`
        + `${back.batt.toFixed(2).padStart(14)}${(r3.ObjectiveValue/1e9).toFixed(2).padStart(9)}${cl}`);
      for (let h = 0; h < N; h++) mc[h] = DAMP * back.mc[h] + (1 - DAMP) * mc[h];
      if (dp < 1){ console.log('  CONVERGED - mean price movement under R1/MWh'); break; }
      prevJul = back.julGas;
    }
  }

  console.log('\n  PERFECT FORESIGHT gives the UPPER BOUND. The rolling runs limit');
  console.log('  foresight to the window, as a production cost model does. The GAP');
  console.log('  between them is the value of forecasting.');
  process.exit(0);
})();
