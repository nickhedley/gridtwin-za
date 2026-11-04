// Measurement (message 683 (c) follow-up): the page's single runs derive new tracking solar from the metered 2025 profile
// (solarTrkOf(PROFILES.solar)), which already includes the fleet's trackers. For each preset with bldPvTracking on: the run as a click
// makes it, and the same run with new tracking solar rescaled to the twelve-year tracking mean (metered timing kept). Test only.
// From harness/: NODE_PATH=node_modules node pathway/wx/presets_trk.js <out.json>
const fs = require('fs'), path = require('path'), { JSDOM } = require('jsdom');
const ROOT = 'testroot', OUT = process.argv[2];
(async () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, url: 'file://' + path.resolve(ROOT) + '/index.html',
    beforeParse(w){ w.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: () => () => ({ addColorStop(){}, data: [], width: 0, measureText: () => ({ width: 10 }) }) });
      const ch = () => new Proxy(function(){ return ch(); }, { get: () => ch() }); w.L = new Proxy({}, { get(){ return function(){ return ch(); }; } });
      w.onerror = () => {}; Object.defineProperty(w.history, 'replaceState', { value: () => {}, writable: true }); w.URL.createObjectURL = () => 'blob:x'; w.Worker = function(){ this.postMessage = () => {}; };
      w.fetch = async (u) => { try { const cl = String(u).split('?')[0].replace(/^file:.*?\/(?=nodal\/|profiles|config|public_data|stored)/, ''); const t = fs.readFileSync(path.join(path.resolve(ROOT), cl), 'utf8'); return { ok: true, json: async () => JSON.parse(t), text: async () => t }; } catch (e) { return { ok: false, json: async () => { throw e; }, text: async () => { throw e; } }; } }; } });
  await new Promise(r => setTimeout(r, 6000)); const w = dom.window;
  await w.eval('loadWeatherYears()');
  const res = JSON.parse(w.eval(`(function(){
    let s12 = 0, n12 = 0; for (const y of bldWeatherYears.meta.years){ const t = solarTrkOf(weatherYearNational(String(y)).solar); for (let h = 0; h < t.length; h++){ s12 += t[h]; n12++; } }
    const T = solarTrkOf(PROFILES.solar), mT = T.reduce((a, v) => a + v, 0) / T.length, k = (s12 / n12) / mT, T12 = new Float64Array(T.length);
    for (let h = 0; h < T.length; h++) T12[h] = Math.min(1, k * T[h]);
    const mS = PROFILES.solar.reduce((a, v) => a + v, 0) / PROFILES.solar.length;
    const out = { meteredFixed: mS, meteredTwin: mT, twelveYearTrk: s12 / n12, k, presets: {} };
    const pick = x => ({ pv: x.E.pv / 1e6, curtailed: x.E.curtailed / 1e6, coal: x.E.coal / 1e6, ccgt: (x.E.ccgt || 0) / 1e6, diesel: x.E.diesel / 1e6,
      ps: x.E.ps / 1e6, batt: x.E.batt / 1e6, unservedGWh: x.E.unserved / 1e3, co2: x.co2, costRbn: x.systemCostR / 1e9 });
    for (const [name, o] of Object.entries(PRESETS)) if ((o.bldPvTracking | 0) > 0){
      applyState(o); const st = { ...state };
      out.presets[name] = { newPvMW: st.newPvMW, asClicked: pick(simulate(st, PROFILES)), trk12: pick(simulate(st, { ...PROFILES, solarTrk: T12 })) }; }
    return JSON.stringify(out); })()`));
  fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
  console.log('metered fixed', res.meteredFixed.toFixed(4), '| metered tracking twin', res.meteredTwin.toFixed(4), '| twelve-year tracking', res.twelveYearTrk.toFixed(4), '| x', res.k.toFixed(4));
  for (const [n, r] of Object.entries(res.presets)){ const a = r.asClicked, b = r.trk12, d = k => (a[k] - b[k]).toFixed(2);
    console.log(n, '| new PV', r.newPvMW, 'MW | PV', a.pv.toFixed(1), 'vs', b.pv.toFixed(1), 'TWh | curt', a.curtailed.toFixed(1), 'vs', b.curtailed.toFixed(1),
      '| coal', d('coal'), 'gas', d('ccgt'), 'diesel', d('diesel'), '| unserved', a.unservedGWh.toFixed(2), 'vs', b.unservedGWh.toFixed(2), 'GWh | cost', d('costRbn'), 'R bn'); }
  process.exit(0);
})();
