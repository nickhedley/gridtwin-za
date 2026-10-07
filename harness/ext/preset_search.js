// PRESET RE-SEARCH (user, 7 Oct 2026): least system cost meeting half the 0.002% reliability standard, the
// transition presets' design rule, by the 4 Oct 2026 method (RESULTS, "Both transition presets re-sized"):
//  - target fixed at the starting build's level: half of 0.002% of the energy it serves, mean over the runs;
//  - greedy: every technology alone (up or down a step) and every pair (one cut by twice the step, another
//    raised by the step); take the cheapest move that still meets the target; repeat until none helps;
//    steps 2, 1, 0.5 GW (iron-air 0.5, 0.25, 0.125; offshore 1, 0.5, 0.25);
//  - new rooftop held at expected uptake, lithium held at 12 hours, offshore capped at ESMAP's deployable path
//    (1 GW by 2035, 5 GW by 2040);
//  - scored on twelve weather years x DRAWS outage draws (Deep 2, Fossil-free 1: no coal), then the result is
//    confirmed on CONFIRM draws (Deep 40, i.e. 480 runs); if it misses there, the smallest top-ups are tested
//    on the same runs and the cheapest that meets the target is taken.
// Run from harness/:  PRESET='Deep decarbonisation 2035' DRAWS=2 CONFIRM=40 OUT=ext/search_deep.json node ext/preset_search.js
const fs = require('fs'), path = require('path'); const { JSDOM } = require(process.cwd() + '/node_modules/jsdom');
const ROOT = 'testroot', PRESET = process.env.PRESET || 'Deep decarbonisation 2035', OUT = process.env.OUT || 'ext/preset_search.json';
const DRAWS = +(process.env.DRAWS || 2), CONFIRM = +(process.env.CONFIRM || 0), SEED = 20260816;
(async () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, url: 'file://' + path.resolve(ROOT) + '/index.html',
    beforeParse(w) { w.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: () => () => ({ addColorStop() {}, data: [], width: 0, measureText: () => ({ width: 10 }) }) });
      const ch = () => new Proxy(function () { return ch(); }, { get: () => ch() }); w.L = new Proxy({}, { get() { return function () { return ch(); }; } });
      w.onerror = () => {}; Object.defineProperty(w.history, 'replaceState', { value: () => {}, writable: true }); w.URL.createObjectURL = () => 'blob:x'; w.Worker = function () { this.postMessage = () => {}; };
      w.fetch = async (u) => { try { const cl = String(u).split('?')[0].replace(/^file:.*?\/(?=nodal\/|profiles|config)/, ''); const t = fs.readFileSync(path.join(path.resolve(ROOT), cl), 'utf8'); return { ok: true, json: async () => JSON.parse(t), text: async () => t }; } catch (e) { return { ok: false, json: async () => { throw e; }, text: async () => { throw e; } }; } }; } });
  for (let i = 0; i < 80 && !dom.window.GTZA_READY; i++) await new Promise(r => setTimeout(r, 250));
  const w = dom.window;
  await w.eval('loadWeatherYears()');
  if (process.env.BATT_CAPEX) w.eval(`BLD_COST.batt.c2026=${+process.env.BATT_CAPEX}; BLD_COST.batt.connIncl=false;`);   // low case / check
  if (!w.eval(`!!PRESETS[${JSON.stringify(PRESET)}]`)) throw new Error('no preset ' + PRESET);
  const P0 = JSON.parse(w.eval(`JSON.stringify(PRESETS[${JSON.stringify(PRESET)}])`));
  // The preset applied the way the page applies it (applyState also sets derived fields), as pathcheck.js does.
  w.eval(`applyState(PRESETS[${JSON.stringify(PRESET)}])`);
  const stamp = w.eval('BUILD_STAMP'), years = JSON.parse(w.eval('JSON.stringify(bldWeatherYears.meta.years)'));
  const offCap = (P0.scenarioYear || 2035) <= 2035 ? 1000 : 5000;
  const TECH = [
    { k: 'newWindMW', steps: [2000, 1000, 500] }, { k: 'newPvMW', steps: [2000, 1000, 500] },
    { k: 'newBattMW', steps: [2000, 1000, 500] }, { k: 'newIronAirMW', steps: [500, 250, 125] },
    { k: 'newOffshoreMW', steps: [1000, 500, 250], cap: offCap },
  ];
  const cache = new Map();
  // Mean shed (GWh), mean system cost (R bn) and mean served energy (TWh) over years x draws.
  const evaluate = (b, draws) => {
    const key = JSON.stringify(b) + '|' + draws; if (cache.has(key)) return cache.get(key);
    const r = JSON.parse(w.eval(`(function(){ let sh=0, c=0, d=0, n=0;
      for (const wy of ${JSON.stringify(years)}){ const nat = weatherYearNational(String(wy));
        for (let k = 0; k < ${draws}; k++){
          const x = simulate({ ...state, ...${JSON.stringify(b)}, newBattHours: 12,
            outageSeed: ${SEED} + k*104729 + wy*7919 }, { demand: PROFILES.demand, solar: nat.solar, wind: nat.wind, csp: PROFILES.csp, real: true });
          let dem = 0; for (let i = 0; i < x.loadS.length; i++) dem += x.loadS[i];
          sh += x.E.unserved / 1e3; c += x.systemCostR / 1e9; d += dem / 1e6; n++; } }
      return JSON.stringify({ shed: sh/n, cost: c/n, served: d/n }); })()`));
    cache.set(key, r); return r;
  };
  const base = Object.fromEntries(TECH.map(t => [t.k, P0[t.k] || 0]));
  const t0 = Date.now(), start = evaluate(base, DRAWS);
  const target = 0.5 * 0.00002 * start.served * 1e3;   // GWh: half of 0.002% of served energy, fixed at the start
  const log = [{ step: 'start', build: base, ...start }];
  if (process.env.PROBE){ console.log('PROBE', JSON.stringify(start), 'target', target.toFixed(2)); process.exit(0); }
  console.log(stamp, PRESET, 'start', JSON.stringify(base), JSON.stringify(start), 'target', target.toFixed(2), 'GWh', ((Date.now() - t0) / 1000).toFixed(0) + ' s/eval');
  let cur = { ...base }, curR = start;
  const ok = (b) => TECH.every(t => b[t.k] >= 0 && (!t.cap || b[t.k] <= t.cap));
  for (let si = 0; si < 3; si++){
    for (;;){
      const cands = [];
      for (const t of TECH){ const s = t.steps[si];
        for (const d of [s, -s]){ const b = { ...cur, [t.k]: cur[t.k] + d }; if (ok(b)) cands.push(b); } }
      for (const a of TECH) for (const u of TECH) if (a !== u){
        const b = { ...cur, [a.k]: cur[a.k] - 2 * a.steps[si], [u.k]: cur[u.k] + u.steps[si] }; if (ok(b)) cands.push(b); }
      let best = null, bestR = null;
      for (const b of cands){ const r = evaluate(b, DRAWS); if (r.shed <= target && r.cost < curR.cost - 1e-6 && (!bestR || r.cost < bestR.cost)){ best = b; bestR = r; } }
      if (!best) break;
      cur = best; curR = bestR; log.push({ step: 'move', stepIndex: si, build: cur, ...curR });
      console.log('move', si, JSON.stringify(cur), 'cost', curR.cost.toFixed(1), 'shed', curR.shed.toFixed(2));
      fs.writeFileSync(OUT, JSON.stringify({ stamp, preset: PRESET, target, log }, null, 1));
    }
  }
  const out = { stamp, preset: PRESET, draws: DRAWS, target, start: { build: base, ...start }, searched: { build: cur, ...curR }, log };
  if (CONFIRM > DRAWS){
    const c = evaluate(cur, CONFIRM); out.confirm = { draws: CONFIRM, ...c };
    console.log('confirm', CONFIRM, 'draws: shed', c.shed.toFixed(2), 'cost', c.cost.toFixed(1));
    if (c.shed > target){
      const ups = TECH.map(t => ({ ...cur, [t.k]: cur[t.k] + t.steps[2] })).filter(ok).map(b => ({ build: b, ...evaluate(b, CONFIRM) }));
      out.topups = ups; const fit = ups.filter(u => u.shed <= target).sort((a, b) => a.cost - b.cost)[0];
      if (fit) { out.final = fit; console.log('top-up', JSON.stringify(fit.build), fit.cost.toFixed(1), fit.shed.toFixed(2)); }
      else out.final = null;
    } else out.final = { build: cur, ...c };
  } else out.final = { build: cur, ...curR };
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
  console.log('done', JSON.stringify(out.final), ((Date.now() - t0) / 60000).toFixed(0) + ' min');
  process.exit(0);
})();
