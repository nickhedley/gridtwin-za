// SOLAR_TRK_K, the metered profile's tracking scale (user decision, 3 Nov 2026, message 684 (c)): computed by the page's own
// solarTrkMeteredK (the twelve modelled years' mean tracking output over the mean of min(1, k x metered solar x SOLAR_TRK_G)) and
// written into nodal/profiles_solar_tracking_map.json as metered_scale, which the page reads at start-up and checks against its own
// computation when the weather years load. Rerun with --write after any change to profiles.json's solar, the regional solar or
// tracking files, or the map (build_solar_tracking.py writes the map without it).
// From harness/: NODE_PATH=node_modules node solar_trk_k.js testroot [--write]
const fs = require('fs'), path = require('path'), { JSDOM } = require('jsdom');
const ROOT = process.argv[2] || 'testroot', WRITE = process.argv.includes('--write'), MAPF = path.join(ROOT, 'nodal/profiles_solar_tracking_map.json');
(async () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, url: 'file://' + path.resolve(ROOT) + '/index.html',
    beforeParse(w){ w.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: () => () => ({ addColorStop(){}, data: [], width: 0, measureText: () => ({ width: 10 }) }) });
      const ch = () => new Proxy(function(){ return ch(); }, { get: () => ch() }); w.L = new Proxy({}, { get(){ return function(){ return ch(); }; } });
      w.onerror = () => {}; Object.defineProperty(w.history, 'replaceState', { value: () => {}, writable: true }); w.URL.createObjectURL = () => 'blob:x'; w.Worker = function(){ this.postMessage = () => {}; };
      w.fetch = async (u) => { try { const cl = String(u).split('?')[0].replace(/^file:.*?\/(?=nodal\/|profiles|config|public_data|stored)/, ''); const t = fs.readFileSync(path.join(path.resolve(ROOT), cl), 'utf8'); return { ok: true, json: async () => JSON.parse(t), text: async () => t }; } catch (e) { return { ok: false, json: async () => { throw e; }, text: async () => { throw e; } }; } }; } });
  await new Promise(r => setTimeout(r, 6000)); const w = dom.window;
  await w.eval('loadWeatherYears()');
  const k = w.eval("_profilesReal ? solarTrkMeteredK('fixed') : null");
  // The fleet basis (message 701 (a)): its map as the page computes it from the series, and its scale.
  const GF = JSON.parse(w.eval('JSON.stringify(SOLAR_TRK_MAPS.fleet.G)')), kf = w.eval("_profilesReal ? solarTrkMeteredK('fleet') : null");
  if (!GF || !(kf > 0)) { console.log('FAIL: the page could not compute the fleet basis (map or scale)'); process.exit(1); }
  if (!(k > 0)) { console.log('FAIL: the page could not compute the metered scale (profiles.json, the weather years or the tracking files missing)'); process.exit(1); }
  const info = JSON.parse(w.eval(`(() => { const t = solarTrkOf(PROFILES.solar), m = a => a.reduce((s, v) => s + v, 0) / a.length;
    let s = 0; for (const y of bldWeatherYears.meta.years) s += m(weatherYearNational(String(y)).solar.trk); return JSON.stringify({ meteredFixed: m(PROFILES.solar), twin: m(t), twelve: s / bldWeatherYears.meta.years.length }); })()`));
  const M = JSON.parse(fs.readFileSync(MAPF, 'utf8')), had = M.metered_scale;
  console.log('fleet basis: scale', kf.toFixed(10), '| in the map file', M.metered_scale_fleet === undefined ? 'none' : M.metered_scale_fleet);
  console.log('metered scale k', k.toFixed(10), '| in the map file', had === undefined ? 'none' : had, '| metered profile', info.meteredFixed.toFixed(4),
    '| its twin with k', info.twin.toFixed(4), '| twelve-year tracking', info.twelve.toFixed(4));
  if (WRITE){
    M.metered_scale = +k.toFixed(12);
    M.map_fleet = GF.map(r => r.map(v => +v.toFixed(12))); M.metered_scale_fleet = +kf.toFixed(12);
    M.meta.map_fleet = 'The metered twin\u2019s fleet basis (user decision, 4 Nov 2026, message 701 (a); FIXED.solarTrkMeteredBasis \u2018fleet\u2019): modelled '
      + 'tracking over the modelled fleet mix, (1 - X) fixed tilt + X tracking, X existing solar\u2019s tracker share at the defaults, by month and hour, '
      + 'capacity-weighted, all years in both files; metered_scale_fleet scales the twin to the twelve-year tracking mean. Written by harness/solar_trk_k.js '
      + 'from the page\u2019s own computation, which the page checks when the weather years load.';
    M.meta.metered_scale = 'SOLAR_TRK_K: scales the twin derived for the metered profile (profiles.json, Eskom’s 2025 fleet, already 53-58% on '
      + 'single-axis trackers) to the twelve modelled years’ mean tracking output; without it the map’s tracking gain counts the trackers twice '
      + '(user decision, 3 Nov 2026, message 684 (c)). Written by harness/solar_trk_k.js from the page’s solarTrkMeteredK.';
    fs.writeFileSync(MAPF, JSON.stringify(M)); console.log('wrote', MAPF);
  } else {
    const dG = M.map_fleet ? Math.max(...GF.map((r, m) => Math.max(...r.map((v, h) => Math.abs(v - M.map_fleet[m][h]) / Math.max(1e-9, Math.abs(v)))))) : Infinity;
    if (had === undefined || Math.abs(had - k) / k > 1e-9 || M.metered_scale_fleet === undefined || Math.abs(M.metered_scale_fleet - kf) / kf > 1e-9 || dG > 1e-9) {
      console.log('FAIL: the map file\u2019s metered_scale, map_fleet or metered_scale_fleet is missing or stale; rerun with --write'); process.exit(1); } }
  process.exit(0);
})();
