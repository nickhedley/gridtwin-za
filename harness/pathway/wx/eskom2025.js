// The page's own 2025 run ('2025, as modelled', as run2025AsModelled builds it) on three weather references, against Eskom's 2025
// (message 683 (c); measurement only). Weather: metered (the page's own 2025 profiles, Eskom's ESK19679, as the validation panel runs it),
// modelled 2025 (weatherYearNational('2025')), and each modelled year 2014-2025. Demand is the page's 2025 in every case. K outage draws
// per weather year (seeds as pathcheck.js: SEED_BASE + k x 104729 + year x 7919, the metered profile on 2025's). Prints means; writes JSON.
// From harness/: NODE_PATH=node_modules node pathway/wx/eskom2025.js <out.json> [K]
const fs = require('fs'), path = require('path'), { JSDOM } = require('jsdom');
const ROOT = 'testroot', OUT = process.argv[2], K = +(process.argv[3] || 10), SEED_BASE = 71830529;
(async () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, url: 'file://' + path.resolve(ROOT) + '/index.html',
    beforeParse(w){ w.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: () => () => ({ addColorStop(){}, data: [], width: 0, measureText: () => ({ width: 10 }) }) });
      const ch = () => new Proxy(function(){ return ch(); }, { get: () => ch() }); w.L = new Proxy({}, { get(){ return function(){ return ch(); }; } });
      w.onerror = () => {}; Object.defineProperty(w.history, 'replaceState', { value: () => {}, writable: true }); w.URL.createObjectURL = () => 'blob:x'; w.Worker = function(){ this.postMessage = () => {}; };
      w.fetch = async (u) => { try { const cl = String(u).split('?')[0].replace(/^file:.*?\/(?=nodal\/|profiles|config|public_data)/, ''); const t = fs.readFileSync(path.join(path.resolve(ROOT), cl), 'utf8'); return { ok: true, json: async () => JSON.parse(t), text: async () => t }; } catch (e) { return { ok: false, json: async () => { throw e; }, text: async () => { throw e; } }; } }; } });
  await new Promise(r => setTimeout(r, 6000)); const w = dom.window;
  await w.eval('loadWeatherYears()');
  // WX_FIX=fixed|corrected (WX_TABLE for corrected): the modelled years with the fixes of wxfix.js; the metered profile as it is.
  const WXF = process.env.WX_FIX || null;
  if (WXF) require('./wxfix.js')(w, WXF, WXF === 'corrected' ? JSON.parse(fs.readFileSync(process.env.WX_TABLE, 'utf8')) : null);
  w.eval(`window.__nat = yy => ${WXF ? '__wxFixNat(yy)' : 'weatherYearNational(yy)'};`);
  const res = JSON.parse(w.eval(`(function(){
    const o = PRESETS['2025, as modelled'], s = {};
    SLIDERS.forEach(x => { if (x.grp || !x.id) return; s[x.id] = (x.id in o) ? o[x.id] : (x.toggle ? (x.def ? 1 : 0) : x.def); });
    for (const k of PRESET_NON_SLIDER_KEYS) s[k] = (k in o) ? o[k] : FIXED[k];
    const page = simulate(s, PROFILES);   // the validation panel's own run (its default seed)
    const pick = x => ({ coal: x.E.coal / 1e6, wind: x.E.wind / 1e6, pv: x.E.pv / 1e6, rooftop: x.E.rooftop / 1e6, ps: x.E.ps / 1e6, batt: x.E.batt / 1e6,
      diesel: x.E.diesel / 1e6, ccgt: (x.E.ccgt || 0) / 1e6, unservedGWh: x.E.unserved / 1e3, curtailed: x.E.curtailed / 1e6, co2: x.co2 });
    const ws = ['metered'].concat(bldWeatherYears.meta.years.map(String)), out = { page: pick(page), byWeather: {} };
    for (const yy of ws){
      const nat = yy === 'metered' ? { solar: PROFILES.solar, wind: PROFILES.wind } : __nat(yy), seedY = yy === 'metered' ? 2025 : +yy, runs = [];
      for (let k = 0; k < ${K}; k++) runs.push(pick(simulate({ ...s, outageSeed: ${SEED_BASE} + k * 104729 + seedY * 7919 }, { demand: PROFILES.demand, solar: nat.solar, wind: nat.wind, ...(nat.solarTrk ? { solarTrk: nat.solarTrk } : {}), csp: PROFILES.csp, real: true })));
      const m = {}; for (const key of Object.keys(runs[0])) m[key] = runs.reduce((a, r) => a + r[key], 0) / runs.length;
      m.unservedMaxGWh = Math.max(...runs.map(r => r.unservedGWh)); out.byWeather[yy] = m; }
    return JSON.stringify(out); })()`));
  const E = JSON.parse(fs.readFileSync(path.join(ROOT, 'public_data/ember_za.json'), 'utf8')), g = {};
  for (const [date, cat, sub, v, unit, val] of E.monthly) if (cat === 'Electricity generation' && sub === 'Fuel' && unit === 'TWh' && String(date).startsWith('2025')) g[v] = (g[v] || 0) + val;
  res.actual = { eskomCoalSentOut: +w.eval('ESKOM_2025_COAL_TWH'), emberWind: g.Wind, emberSolar: g.Solar, emberCoal: g.Coal };
  const yrs = Object.keys(res.byWeather).filter(k => k !== 'metered'), mean12 = {};
  for (const key of Object.keys(res.byWeather.metered)) mean12[key] = yrs.reduce((a, y) => a + res.byWeather[y][key], 0) / yrs.length;
  res.modelled12 = mean12; res.K = K; res.wxFix = WXF;
  fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
  const f = (o) => ['coal', 'wind', 'pv', 'rooftop', 'ps', 'batt', 'diesel', 'curtailed'].map(k => k + ' ' + o[k].toFixed(2)).join(', ') + ', unserved ' + o.unservedGWh.toFixed(1) + ' GWh';
  console.log('actual', JSON.stringify(res.actual)); console.log('page run (metered, default seed):', f(res.page));
  console.log('metered:', f(res.byWeather.metered)); console.log('modelled 2025:', f(res.byWeather['2025'])); console.log('modelled, 12-year mean:', f(mean12));
  process.exit(0);
})();
