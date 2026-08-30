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
  console.log('\n  PERFECT FORESIGHT: the LP sees the whole year. This is an UPPER BOUND.');
  process.exit(0);
})();
