// coal_swing.js (user, 1-2 Nov 2026, messages 611 and 615): the daily coal swing and the evening ramp, the model's Today 2026 against
// Eskom's hourly data, as RESULTS 'Daily coal swing and the evening ramp' (message 611). Writes derived figures only (OUT, default
// harness/ext/coal_swing.json): means, ranges and shares, never an hourly series (ESK19679's terms, CLAUDE.md). The reviewer pack reads
// them through packfill's swing.* keys.
// Model: the Today 2026 preset, simulate on the default profiles (profiles.json, calendar 2025 shapes); each 2026 date is taken at the
// same day of the 2025 profile. Eskom: ESK19679.csv (not in the repository; Eskom, analysis ours): Thermal Generation (coal), Pumped
// Water Generation, Eskom OCGT Generation plus Dispatchable IPP OCGT (diesel), Eskom Gas Generation, Hydro Water Generation,
// International Imports; no battery series. Per day (SAST, hour beginning): swing = maximum less minimum hourly coal; evening peak
// less midday minimum = the highest coal hour 17:00-21:00 less the lowest 10:00-15:00; evening ramp = each source's mean 18:00-20:00
// less its mean 11:00-14:00, its share of the sum over the sources.
//   cd harness && node ext/coal_swing.js   (testroot linked; ESK19679.csv in the repository root, gitignored)
const fs = require('fs'), path = require('path'); const { JSDOM } = require('jsdom');
const ROOT = 'testroot', OUT = process.env.OUT || path.join(__dirname, 'coal_swing.json');
const FROM = process.env.FROM || '2026-01-01', TO = process.env.TO || '2026-08-31';
const ESK = path.join(ROOT, 'ESK19679.csv');
if (!fs.existsSync(ESK)) { console.error('ESK19679.csv not found in the repository root: the Eskom side cannot be computed'); process.exit(1); }
(async () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, url: 'file://' + path.resolve(ROOT) + '/index.html',
    beforeParse(w) { w.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: () => () => ({ addColorStop() {}, data: [], width: 0, measureText: () => ({ width: 10 }) }) });
      const ch = () => new Proxy(function () { return ch(); }, { get: () => ch() }); w.L = new Proxy({}, { get() { return function () { return ch(); }; } });
      w.onerror = () => {}; Object.defineProperty(w.history, 'replaceState', { value: () => {}, writable: true }); w.URL.createObjectURL = () => 'blob:x'; w.Worker = function () { this.postMessage = () => {}; };
      w.fetch = async (u) => { try { const cl = String(u).split('?')[0].replace(/^file:.*?\/(?=nodal\/|profiles|config)/, ''); const t = fs.readFileSync(path.join(path.resolve(ROOT), cl), 'utf8'); return { ok: true, json: async () => JSON.parse(t), text: async () => t }; } catch (e) { return { ok: false, json: async () => { throw e; }, text: async () => { throw e; } }; } }; } });
  await new Promise(r => setTimeout(r, 6000)); const w = dom.window;
  const M = JSON.parse(w.eval(`applyState(PRESETS['Today 2026']); const r = simulate({ ...state }, PROFILES);
    JSON.stringify({ stamp: BUILD_STAMP, s: Object.fromEntries(['coal','ps','batt','ccgt','diesel','hydro','imports'].map(k => [k, Array.from(r.stack[k])])) })`));
  // The model's days are the default profiles' calendar year (profiles.json meta.year, read from the file: PROFILES carries no meta).
  const PY = (JSON.parse(fs.readFileSync(path.join(ROOT, 'profiles.json'), 'utf8')).meta || {}).year;
  if (PY !== 2025) throw new Error('coal_swing.js: the profiles are not calendar 2025 (meta.year ' + PY + ')');
  // Eskom's hourly rows, keyed 'YYYY-MM-DD HH'
  const lines = fs.readFileSync(ESK, 'utf8').split(/\r?\n/), head = lines[0].split(','), ix = n => { const i = head.indexOf(n); if (i < 0) throw new Error('ESK19679.csv: no column ' + n); return i; };
  const C = { coal: ix('Thermal Generation'), ps: ix('Pumped Water Generation'), ocgt: ix('Eskom OCGT Generation'), ipp: ix('Dispatchable IPP OCGT'), gas: ix('Eskom Gas Generation'), hydro: ix('Hydro Water Generation'), imports: ix('International Imports') };
  const E = new Map(), num = v => { const x = parseFloat(v); return isFinite(x) ? x : 0; };
  for (const ln of lines.slice(1)) { if (!ln) continue; const c = ln.split(','); const m = c[0].match(/^(\d{4}-\d{2}-\d{2}) (\d{1,2}):\d{2}:\d{2} (AM|PM)$/); if (!m) continue;
    let hh = +m[2] % 12; if (m[3] === 'PM') hh += 12;
    E.set(m[1] + ' ' + hh, { coal: num(c[C.coal]), ps: num(c[C.ps]), batt: null, diesel: num(c[C.ocgt]) + num(c[C.ipp]), gas: num(c[C.gas]), hydro: num(c[C.hydro]), imports: num(c[C.imports]) }); }
  const SRC = ['coal', 'ps', 'batt', 'diesel', 'gas', 'hydro', 'imports'];
  const days = []; for (let d = new Date(FROM + 'T00:00:00Z'); d <= new Date(TO + 'T00:00:00Z'); d = new Date(d.getTime() + 864e5)) days.push(d.toISOString().slice(0, 10));
  const doy = s => Math.round((Date.UTC(2025, +s.slice(5, 7) - 1, +s.slice(8, 10)) - Date.UTC(2025, 0, 1)) / 864e5);
  const mDay = s => { const b = doy(s) * 24; return Array.from({ length: 24 }, (_, h) => ({ coal: M.s.coal[b + h], ps: M.s.ps[b + h], batt: M.s.batt[b + h], diesel: M.s.diesel[b + h], gas: M.s.ccgt[b + h], hydro: M.s.hydro[b + h], imports: M.s.imports[b + h] })); };
  const eDay = s => { const r = Array.from({ length: 24 }, (_, h) => E.get(s + ' ' + h)); return r.some(x => !x) ? null : r; };
  const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
  const stats = fn => { const sw = [], ep = [], dl = Object.fromEntries(SRC.map(k => [k, []])); let n = 0;
    for (const s of days) { const hrs = fn(s); if (!hrs) continue; n++;
      const c = hrs.map(x => x.coal); sw.push(Math.max(...c) - Math.min(...c)); ep.push(Math.max(...c.slice(17, 22)) - Math.min(...c.slice(10, 16)));
      for (const k of SRC) if (hrs[0][k] !== null) dl[k].push(mean(hrs.slice(18, 21).map(x => x[k])) - mean(hrs.slice(11, 15).map(x => x[k]))); }
    const tot = SRC.reduce((a, k) => a + (dl[k].length ? mean(dl[k]) : 0), 0);
    return { days: n, swingMW: { mean: mean(sw), min: Math.min(...sw), max: Math.max(...sw) }, eveningLessMiddayMW: { mean: mean(ep), min: Math.min(...ep), max: Math.max(...ep) },
      eveningRampMW: tot, rampShare: Object.fromEntries(SRC.map(k => [k, dl[k].length ? mean(dl[k]) / tot : null])) }; };
  const out = { note: 'Derived figures only (no hourly series). Eskom: ESK19679 hourly data, analysis ours. RESULTS: Daily coal swing and the evening ramp (message 611).',
    build: M.stamp, from: FROM, to: TO, model: stats(mDay), eskom: stats(eDay) };
  if (out.model.days !== out.eskom.days) throw new Error('coal_swing.js: the model and Eskom cover different days (' + out.model.days + ' against ' + out.eskom.days + ')');
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
  console.log('swing, MW: model', out.model.swingMW.mean.toFixed(0), 'Eskom', out.eskom.swingMW.mean.toFixed(0), '| pumped storage share of the evening ramp: model',
    (100 * out.model.rampShare.ps).toFixed(0) + '%', 'Eskom', (100 * out.eskom.rampShare.ps).toFixed(0) + '%', '| days', out.model.days, '| written', OUT);
  process.exit(0);
})();
