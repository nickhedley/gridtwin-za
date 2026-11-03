// Checks of bldRepWeights 'clustered' (design note version 2, 3.1; build item B2). Loads the page as pathway_perfail.js does, with
// c7's day settings (PVTRK=1, ROOF12), and for each day count and method: weights sum to 365; map365 gives each representative as many
// real days as its weight; extremes weigh 1 and map to themselves; the weighted year's four series equal their twelve-year means; the
// days carry their own shapes. Prints the weights and the mean distance, for comparison with analyse.py on the same extremes.
// From harness/: NODE_PATH=node_modules node pathway/repdays/test_clustered.js [n ...]
const fs = require('fs'), path = require('path'), { JSDOM } = require('jsdom');
const ROOT = 'testroot', NS = process.argv.slice(2).map(Number).filter(x => x > 0);
(async () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, url: 'file://' + path.resolve(ROOT) + '/index.html',
    beforeParse(w){ w.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: () => () => ({ addColorStop(){}, data: [], width: 0, measureText: () => ({ width: 10 }) }) });
      const ch = () => new Proxy(function(){ return ch(); }, { get: () => ch() }); w.L = new Proxy({}, { get(){ return function(){ return ch(); }; } });
      w.onerror = () => {}; Object.defineProperty(w.history, 'replaceState', { value: () => {}, writable: true }); w.URL.createObjectURL = () => 'blob:x'; w.Worker = function(){ this.postMessage = () => {}; };
      w.fetch = async (u) => { try { const cl = String(u).split('?')[0].replace(/^file:.*?\/(?=nodal\/|profiles|config)/, ''); const t = fs.readFileSync(path.join(path.resolve(ROOT), cl), 'utf8'); return { ok: true, json: async () => JSON.parse(t), text: async () => t }; } catch (e) { return { ok: false, json: async () => { throw e; }, text: async () => { throw e; } }; } }; } });
  await new Promise(r => setTimeout(r, 6000)); const w = dom.window;
  require(path.resolve('pathway/roof12.js'))(w);
  w.eval(`applyState(PRESETS['Today 2026']); bldSetHorizon(2040); state.bldPvTracking=1;`);
  let fails = 0; const ok = (c, m) => { if (!c){ fails++; console.log('FAIL', m); } };
  for (const n of (NS.length ? NS : [19, 30])) for (const method of ['hierarchical', 'kmedoids']){
    const r = JSON.parse(w.eval(`(() => { const S = { ...FIXED, ...state, bldRepWeights: 'clustered', bldRepMethod: '${method}' };
      const t0 = Date.now(); const rd = bldRepDays(${n}, { clustered: true, method: '${method}', S }); const ms = Date.now() - t0;
      const cal = rd.filter(q => !q.tail); const T = bldTwelveYearMeansAll(1, true);
      const cnt = {}; for (const d of rd.map365) cnt[d] = (cnt[d] || 0) + 1;
      const wm = key => cal.reduce((a, q) => a + q.weight * q[key].reduce((s, v) => s + v, 0) / 24, 0) / 365;
      return JSON.stringify({ ms, info: rd.clusterInfo, days: cal.map(q => [q.d, q.weight, !!q.extreme]), cnt, T,
        means: { wind: wm('wind'), windN: wm('windMod'), solar: wm('solar'), solarT: wm('solarTrk') }, tail: rd.filter(q => q.tail).length,
        shapes: cal.every(q => q.wind.length === 24 && q.solar.length === 24 && q.windMod.length === 24 && q.solarTrk.length === 24) }); })()`));
    const sum = r.days.reduce((a, q) => a + q[1], 0);
    ok(Math.abs(sum - 365) < 1e-9, n + ' ' + method + ': weights sum ' + sum);
    ok(r.days.every(q => r.cnt[q[0]] === q[1]), n + ' ' + method + ': map365 counts equal the weights');
    ok(r.days.filter(q => q[2]).every(q => q[1] === 1), n + ' ' + method + ': extremes at weight 1');
    for (const k of ['wind', 'windN', 'solar', 'solarT']) ok(Math.abs(r.means[k] - r.T[k]) < 1e-6, n + ' ' + method + ': ' + k + ' mean ' + r.means[k].toFixed(6) + ' against ' + r.T[k].toFixed(6));
    ok(r.shapes, n + ' ' + method + ': every day carries its shapes');
    console.log(n, method, r.ms + ' ms', 'typical weights ' + Math.min(...r.info.weights) + '-' + Math.max(...r.info.weights), 'mean distance ' + r.info.meanDistance.toFixed(3),
      'days', r.days.map(q => q[0] + (q[2] ? '*' : '') + ':' + q[1]).join(' '), 'tail days', r.tail);
  }
  console.log(fails ? fails + ' FAILED' : 'all checks passed'); process.exit(fails ? 1 : 0);
})();
