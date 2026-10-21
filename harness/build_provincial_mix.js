#!/usr/bin/env node
// PROVINCIAL MIX FROM THE ENGINE (user, 20 Oct 2026, message 264, audit G6 fix 4). nodal/provincial_mix.json's generation and
// demand were fitted to an older engine (coal 160.7 TWh against 147.2 now, nuclear 13.8 against 10.9) and its demand shares
// were not the regional model's (Limpopo 4.8% against 9.2%). This rebuilds both from the page's start-up state (Today 2026):
//   generation: each technology's national total is the engine's; coal, nuclear, hydro and gas (open-cycle and diesel) are
//     split by the file's installed capacity, wind and solar (rooftop included) by the file's own regional-profile split;
//   demand: the engine's grid demand (loadS less storage charging plus demand response, as validate_outputs reads it), split
//     by the regional model's shares (nodal/demand_2025_regional.csv, the hourly columns summed).
// Capacity is not touched. Recompute, never hand-edit:
//   node build_provincial_mix.js testroot --write    rewrites generation_twh, demand_twh and their notes
//   node build_provincial_mix.js testroot            exits 1 if the file differs from the engine by more than 2%
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');
const ROOT = path.resolve(process.argv[2] || 'testroot');
const WRITE = process.argv.includes('--write');
const FILE = path.join(ROOT, 'nodal/provincial_mix.json');
const TOL = 0.02;

// The regional model's demand shares: each supply area's hourly column summed, over the sum of all ten.
function demandShares(){
  const lines = fs.readFileSync(path.join(ROOT, 'nodal/demand_2025_regional.csv'), 'utf8').split('\n').filter(l => l && l[0] !== '#');
  const head = lines[0].split(','), cols = head.map((h, i) => [h, i]).filter(([h]) => /_corrected$/.test(h));
  const sum = Object.fromEntries(cols.map(([h]) => [h.replace(/_corrected$/, ''), 0]));
  for (const l of lines.slice(1)){ const v = l.split(','); for (const [h, i] of cols) sum[h.replace(/_corrected$/, '')] += +v[i] || 0; }
  const tot = Object.values(sum).reduce((a, b) => a + b, 0);
  return Object.fromEntries(Object.entries(sum).map(([k, v]) => [k, v / tot]));
}

async function engineTotals(){
  const dom = new JSDOM(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), {
    runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, url: 'file://' + ROOT + '/index.html',
    beforeParse(w){
      w.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: () => () => ({ addColorStop(){}, data: [], width: 0, measureText: () => ({ width: 10 }) }) });
      const ch = () => new Proxy(function(){ return ch(); }, { get: () => ch() });
      w.L = new Proxy({}, { get(){ return function(){ return ch(); }; } });
      w.onerror = () => {}; Object.defineProperty(w.history, 'replaceState', { value: () => {}, writable: true });
      w.URL.createObjectURL = () => 'blob:x'; w.Worker = function(){ this.postMessage = () => {}; };
      w.fetch = async u => { try { const rel = String(u).split('?')[0].replace(/^file:.*?\/(?=nodal\/|profiles|config|public_data|stored_panels)/, '');
        const t = fs.readFileSync(path.join(ROOT, rel), 'utf8'); return { ok: true, json: async () => JSON.parse(t), text: async () => t }; }
        catch (e) { return { ok: false, json: async () => { throw e; }, text: async () => { throw e; } }; } };
    },
  });
  const w = dom.window;
  for (let i = 0; i < 1200 && !w.GTZA_READY; i++) await new Promise(r => setTimeout(r, 50));
  if (!w.GTZA_READY) throw new Error('the page did not finish loading');
  const t = JSON.parse(w.eval(`(function(){ const r = simulate(state, PROFILES), E = r.E;
    const sum = a => a ? Array.prototype.reduce.call(a, (x, y) => x + (+y || 0), 0) / 1e6 : 0;
    return JSON.stringify({ stamp: BUILD_STAMP, coal: E.coal / 1e6, nuclear: E.nuclear / 1e6, hydro: E.hydro / 1e6,
      gas: ((E.ccgt || 0) + (E.diesel || 0)) / 1e6, wind: E.wind / 1e6,
      solar: ((E.pv || 0) + (E.csp || 0) + (E.hybrid || 0) + (E.rooftop || 0)) / 1e6,
      demand: sum(r.loadS) - sum(r.chargeMW) + sum(r.drMW) }); })()`));
  w.close();
  return t;
}

// Split a national total over regions in proportion to weights; all zero weights give all zeros.
function split(total, weights){
  const s = Object.values(weights).reduce((a, b) => a + b, 0);
  return Object.fromEntries(Object.entries(weights).map(([k, v]) => [k, s > 0 ? total * v / s : 0]));
}
const r2 = x => Math.round(x * 100) / 100;

(async () => {
  const d = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  const E = await engineTotals(), shares = demandShares();
  const regions = Object.keys(d.capacity_mw);
  const missing = regions.filter(k => !(k in shares));
  if (missing.length) throw new Error('no regional demand column for ' + missing.join(', '));
  const by = (src, k) => Object.fromEntries(regions.map(p => [p, (src[p] || {})[k] || 0]));
  const gen = {
    coal: split(E.coal, by(d.capacity_mw, 'coal')), nuclear: split(E.nuclear, by(d.capacity_mw, 'nuclear')),
    hydro: split(E.hydro, by(d.capacity_mw, 'hydro')), gas: split(E.gas, by(d.capacity_mw, 'gas')),
    wind: split(E.wind, by(d.generation_twh, 'wind')), solar: split(E.solar, by(d.generation_twh, 'solar')),
  };
  const generation = Object.fromEntries(regions.map(p => [p, Object.fromEntries(
    ['wind', 'solar', 'nuclear', 'hydro', 'coal', 'gas'].map(k => [k, r2(gen[k][p])]))]));
  const demand = Object.fromEntries(regions.map(p => [p, r2(E.demand * shares[p])]));

  if (WRITE){
    const genTot = Object.values(generation).reduce((a, g) => a + Object.values(g).reduce((x, y) => x + y, 0), 0);
    const demTot = Object.values(demand).reduce((a, b) => a + b, 0);
    d.generation_twh = generation; d.demand_twh = demand;
    d.meta.generation_note = `Generation is the engine's, not measured: each technology's national total is the engine's at `
      + `start-up (Today 2026, build ${E.stamp}): coal ${E.coal.toFixed(1)}, nuclear ${E.nuclear.toFixed(1)}, hydro `
      + `${E.hydro.toFixed(1)}, gas and diesel ${E.gas.toFixed(1)}, wind ${E.wind.toFixed(1)}, solar with rooftop `
      + `${E.solar.toFixed(1)} TWh. Coal, nuclear, hydro and gas are split by installed capacity; wind and solar by the `
      + `regional hourly profiles (a Hydra Central wind MW at 42.5%, a KwaZulu-Natal one at 21.6%). It does not change with `
      + `the scenario. National generation is ${(100 * genTot / demTot).toFixed(0)}% of demand; the gap is imports, `
      + `exports and storage, which are not allocated by province. Built by harness/build_provincial_mix.js.`;
    d.meta.demand_note = `Provincial demand is the engine's grid demand at start-up (${E.demand.toFixed(1)} TWh; loadS less `
      + `storage charging plus demand response) apportioned by the regional model's shares, the ten hourly columns of `
      + `nodal/demand_2025_regional.csv summed (2025; source being confirmed, TODO 14fa: the file matches G. Ireland's `
      + `Demand-Spatialization-South-Africa, REF scenario, no exports, 2025, rotated 96 hours; that source's terms apply). An allocation, `
      + `not a measurement.`;
    fs.writeFileSync(FILE, JSON.stringify(d, null, 1));
    console.log('wrote nodal/provincial_mix.json from build ' + E.stamp);
    return;
  }
  // Check: every technology's national total, and demand, within 2% of the engine's.
  let bad = 0;
  const nat = k => regions.reduce((a, p) => a + ((d.generation_twh[p] || {})[k] || 0), 0);
  for (const k of ['coal', 'nuclear', 'hydro', 'gas', 'wind', 'solar']){
    const f = nat(k), e = E[k], ok = Math.abs(f - e) <= Math.max(0.05, TOL * e);
    if (!ok) bad++; console.log((ok ? '  ok   ' : '  FAIL ') + `${k}: file ${f.toFixed(2)} TWh, engine ${e.toFixed(2)}`);
  }
  const fd = regions.reduce((a, p) => a + (d.demand_twh[p] || 0), 0), okd = Math.abs(fd - E.demand) <= TOL * E.demand;
  if (!okd) bad++; console.log((okd ? '  ok   ' : '  FAIL ') + `demand: file ${fd.toFixed(1)} TWh, engine ${E.demand.toFixed(1)}`);
  console.log(bad ? `\nnodal/provincial_mix.json differs from the engine: node build_provincial_mix.js testroot --write` : '\nprovincial mix matches the engine');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
