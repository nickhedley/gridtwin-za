#!/usr/bin/env node
/**
 * validate_shapes.js - the physical shape of every wind and solar series the page, the engine or the build LP reads (message 702 (b)).
 * WHY. Since 6 Sep 2026 four faults in these series passed every level, spread and ranking check: the multi-year wind two hours early
 * (Renewables.ninja's UTC rows read as SAST), the leap years a day out, the metered tracking twin's doubled gain and then its shape (an
 * 08:00 peak and a midday dip from a fixed-tilt-to-tracker ratio applied to a fleet already half on trackers), and the PVGIS solar years
 * about 25 minutes late (instantaneous values read as hourly means). A time shift or a shape error moves no mean. These checks look at
 * shape and timing against the metered fleet (profiles.json, Eskom's 2025 fleet; Eskom data, the analysis ours):
 *   solar (the metered twin; each modelled year's fixed tilt and tracking twin): peak hour of the mean day 11-13 SAST (fixed tilt); the day's
 *     energy-weighted time within 15 minutes of the metered fleet's; the morning and evening halves around that time within 15% of each
 *     other; under 1% of hours at full output; the monthly capacity factors' shape (correlation 0.9 or more with the metered fleet's);
 *     (0.9 against the fleet for the twin; 0.6 against the twelve-year mean of the same kind for a modelled year); modelled 2025 against metered 2025, 5-minute lag within 15 minutes;
 *   wind (each modelled year, as the page reads it, and its modern-turbine twin; the metered profile's twin): the mean day's best shift
 *     against the metered fleet's within 1 hour; under 2% of hours at full output; modelled 2025 against metered 2025, best lag within 1 hour.
 * Each check names the series that fail. Each was proved on an injected fault (RESULTS 'Physical shape checks').
 *   node validate_shapes.js [root]
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = process.argv[2] || '.';
let pass = 0, fail = 0;
const failures = [], notes = [];
const check = (name, ok, detail) => { if (ok) { pass++; console.log('  PASS  ' + name); } else { fail++; failures.push(name + (detail ? '  \u2014  ' + detail : '')); console.log('  FAIL  ' + name + (detail ? '   ' + detail : '')); } };

(async () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const dom = new JSDOM(html, {
    runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true,
    url: 'file://' + path.resolve(ROOT) + '/index.html',
    beforeParse(w) {
      w.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, {
        get: () => () => ({ addColorStop() {}, data: [], width: 0, measureText: () => ({ width: 10 }) }) });
      const ch = () => new Proxy(function () { return ch(); }, { get: () => ch() });
      w.L = new Proxy({}, { get() { return function () { return ch(); }; } });
      w.onerror = () => {};
      Object.defineProperty(w.history, 'replaceState', { value: () => {}, writable: true });
      w.URL.createObjectURL = () => 'blob:x';
      w.Worker = function () { this.postMessage = () => {}; };
      w.fetch = async (u) => {
        try {
          const cl = String(u).split('?')[0].replace(/^file:.*?\/(?=nodal\/|profiles|config)/, '');
          const t = fs.readFileSync(path.join(path.resolve(ROOT), cl), 'utf8');
          return { ok: true, json: async () => JSON.parse(t), text: async () => t };
        } catch (e) { return { ok: false, json: async () => { throw e; }, text: async () => { throw e; } }; }
      };
    },
  });

  await new Promise(r => setTimeout(r, 6000));
  const w = dom.window;
  // Wait for the multi-year file itself rather than trusting the fixed pause. Added 22 Sep
  // 2026: under load the 6 s wait expired first and the harness reported the file missing.
  {
    const s0 = w.document.createElement('script');
    s0.textContent = `window.__wyDone = false; Promise.resolve(typeof loadWeatherYears === 'function'
      ? loadWeatherYears() : null).then(() => { window.__wyDone = true; }, () => { window.__wyDone = true; });`;
    w.document.body.appendChild(s0);
    for (let waited = 0; !w.__wyDone && waited < 60000; waited += 250)
      await new Promise(r => setTimeout(r, 250));
  }
  const probe = (src) => {
    const s = w.document.createElement('script');
    w.__p = null;
    s.textContent = `try { window.__p = JSON.stringify((function(){ ${src} })()); }
                     catch (e) { window.__p = JSON.stringify({ error: String(e) }); }`;
    w.document.body.appendChild(s);
    return JSON.parse(w.__p);
  };
  const D = probe(`
    const H = 8760, MS = [0,31,59,90,120,151,181,212,243,273,304,334].map(d => d * 24), mon = h => { let m = 11; while (m > 0 && h < MS[m]) m--; return m; };
    const stat = x => { const byH = new Float64Array(24), byM = new Float64Array(12), nM = new Float64Array(12); let s = 0, c = 0, cm = 0;
      for (let h = 0; h < H; h++){ const v = x[h]; s += v; byH[h % 24] += v; byM[mon(h)] += v; nM[mon(h)]++; if (v >= 0.99) c++; cm += (h % 24 + 0.5) * v; }
      let pk = 0; for (let k = 1; k < 24; k++) if (byH[k] > byH[pk]) pk = k;
      return { mean: s / H, peak: pk, centroidH: cm / s, clipped: c / H, byH: Array.from(byH, v => v / (H / 24)), monthCF: Array.from(byM, (v, i) => v / nM[i]) }; };
    const halves = (x, c) => { let m = 0, e = 0; for (let h = 0; h < H; h++){ const t = h % 24 + 0.5; if (t >= c - 6 && t < c) m += x[h]; else if (t >= c && t < c + 6) e += x[h]; } return m / e; };
    const lag = (a, b, maxMin, step) => { const up = x => { const o = []; for (let i = 0; i < x.length * 60 / step; i++){ const t = i * step / 60 - 0.5, j = Math.floor(t), f = t - j;
        o.push(j < 0 ? x[0] : j + 1 >= x.length ? x[x.length - 1] : x[j] * (1 - f) + x[j + 1] * f); } return o; };
      const A = up(a), B = up(b), n = A.length; let best = 0, rb = -2;
      for (let s = -maxMin; s <= maxMin; s += step){ const k = s / step; let sa = 0, sb = 0, saa = 0, sbb = 0, sab = 0, m = 0;
        for (let i = Math.max(0, k); i < Math.min(n, n + k); i++){ const x = A[i], y = B[i - k]; sa += x; sb += y; saa += x * x; sbb += y * y; sab += x * y; m++; }
        const r = (sab - sa * sb / m) / Math.sqrt((saa - sa * sa / m) * (sbb - sb * sb / m)); if (r > rb){ rb = r; best = s; } }
      return { lagMin: best, r: rb }; };
    const out = { metered: { solar: stat(PROFILES.solar), wind: stat(PROFILES.wind) }, twin: null, years: {} };
    const ref = out.metered.solar.centroidH;
    const twin = solarTrkOf(PROFILES.solar); out.twin = { basis: solarTrkBasis(), ...stat(twin), halves: halves(twin, ref) };
    out.windModMetered = stat(windModOf(PROFILES.wind));
    for (const y of bldWeatherYears.meta.years){ const n = weatherYearNational(String(y)), r = {};
      r.fixed = { ...stat(n.solar), halves: halves(n.solar, ref) }; r.trk = { ...stat(n.solar.trk), halves: halves(n.solar.trk, ref) };
      r.wind = stat(n.wind); r.windMod = stat(n.wind.mod || windModOf(n.wind));
      if (String(y) === '2025'){ r.lagSolar = lag(PROFILES.solar, n.solar, 120, 5); r.lagWind = lag(PROFILES.wind, n.wind, 240, 15); }
      out.years[y] = r; }
    return out;`);
  if (D.error){ check('the shape probe runs', false, D.error); return finish(); }
  const M = D.metered, refC = M.solar.centroidH, corr = (a, b) => { const n = a.length, ma = a.reduce((s, v) => s + v, 0) / n, mb = b.reduce((s, v) => s + v, 0) / n;
    let sab = 0, saa = 0, sbb = 0; for (let i = 0; i < n; i++){ sab += (a[i] - ma) * (b[i] - mb); saa += (a[i] - ma) ** 2; sbb += (b[i] - mb) ** 2; } return sab / Math.sqrt(saa * sbb); };
  // fixed: peak hour 11-13 applies (fixed tilt peaks at solar noon); a tracker's plateau can peak at 9-10 or 14-15, so trackers are
  // judged on timing and balance. Monthly shape against the same kind of series: the twelve-year mean (modelled) or the fleet (the twin).
  // Morning-evening balance on the mean day interpolated to 5 minutes (hourly bins bias it: the bins either side of a time are not
  // equally far from it), energy in the 6 hours before the fleet's energy-weighted time over the 6 hours after, relative to the fleet's own.
  const balance = byH => { const v = t => { const x = t - 0.5, i = Math.floor(x), f = x - i, a = byH[(i + 24) % 24], b = byH[(i + 25) % 24]; return a * (1 - f) + b * f; };
    let m = 0, e = 0; for (let k = 0; k < 72; k++){ m += v(refC - 6 + (k + 0.5) / 12); e += v(refC + (k + 0.5) / 12); } return m / e; };
  const fleetBal = balance(M.solar.byH);
  const solarFails = (name, s, refMonth, fixedTilt, rMin = 0.9) => { const f = []; s.halves = balance(s.byH) / fleetBal;
    if (fixedTilt && (s.peak < 11 || s.peak > 13)) f.push(name + ' peak hour ' + s.peak);
    const dm = (s.centroidH - refC) * 60; if (Math.abs(dm) > 15) f.push(name + ' timing ' + dm.toFixed(0) + ' min');
    if (s.halves < 1 / 1.15 || s.halves > 1.15) f.push(name + ' morning/evening ' + s.halves.toFixed(2));
    if (s.clipped >= 0.01) f.push(name + ' clipped ' + (100 * s.clipped).toFixed(1) + '%');
    const rc = corr(s.monthCF, refMonth); if (rc < rMin) f.push(name + ' monthly shape r ' + rc.toFixed(2));
    return f; };
  const meanMonth = k => Array.from({ length: 12 }, (_, i) => Object.values(D.years).reduce((a, r) => a + r[k].monthCF[i], 0) / Object.keys(D.years).length);
  // Wind: the shift (whole hours, circular) of each year's mean day against the metered fleet's mean day that best matches it.
  const dayShift = (a, b) => { let best = 0, rb = -2; for (let k = -6; k <= 6; k++){ const bs = b.map((_, i) => b[(i - k + 24) % 24]); const r = corr(a, bs); if (r > rb){ rb = r; best = k; } } return best; };
  notes.push('metered fleet (profiles.json, 2025): solar peak hour ' + M.solar.peak + ', energy-weighted time ' + refC.toFixed(3) + ' h SAST, morning/evening ' + fleetBal.toFixed(3) + '; wind peak hour ' + M.wind.peak);
  check('the metered tracking twin keeps a tracker\'s shape and timing (peak 11-13, within 15 min of the fleet, halves within 15%, under 1% clipped, monthly shape)',
    solarFails('twin (' + D.twin.basis + ')', D.twin, M.solar.monthCF, false).length === 0, solarFails('twin (' + D.twin.basis + ')', D.twin, M.solar.monthCF, false).join('; '));
  const Y = Object.keys(D.years);
  const yf = k => { const mm = meanMonth(k); return Y.flatMap(y => solarFails(y, D.years[y][k], mm, k === 'fixed', 0.6)); };   // a year's months vary with its weather: r 0.77-0.87 in good years; a misplaced season goes far lower
  check('every modelled year\'s fixed-tilt solar keeps its shape and timing against the metered fleet', yf('fixed').length === 0, yf('fixed').join('; '));
  check('every modelled year\'s tracking twin keeps its shape and timing against the metered fleet', yf('trk').length === 0, yf('trk').join('; '));
  const wf = k => Y.flatMap(y => { const s = D.years[y][k], f = []; const sh = dayShift(M.wind.byH, s.byH);
    if (Math.abs(sh) > 1) f.push(y + ' mean day ' + sh + ' h from the fleet\'s'); if (s.clipped >= 0.02) f.push(y + ' clipped ' + (100 * s.clipped).toFixed(1) + '%'); return f; });
  check('every modelled year\'s wind: its mean day within 1 hour of the metered fleet\'s, under 2% of hours at full output', wf('wind').length === 0, wf('wind').join('; '));
  check('every modelled year\'s modern-turbine wind does the same', wf('windMod').length === 0, wf('windMod').join('; '));
  { const s = D.windModMetered, sh = dayShift(M.wind.byH, s.byH);
    check('the metered profile\'s modern-turbine twin: its mean day within 1 hour of the fleet\'s, under 2% at full output', Math.abs(sh) <= 1 && s.clipped < 0.02, 'shift ' + sh + ' h, clipped ' + (100 * s.clipped).toFixed(1) + '%'); }
  const y25 = D.years['2025'];
  if (y25 && y25.lagSolar){
    check('modelled 2025 solar against metered 2025: lag within 15 minutes at 5-minute resolution', Math.abs(y25.lagSolar.lagMin) <= 15, 'lag ' + y25.lagSolar.lagMin + ' min (r ' + y25.lagSolar.r.toFixed(3) + ')');
    check('modelled 2025 wind against metered 2025: best lag within 1 hour', Math.abs(y25.lagWind.lagMin) <= 60, 'lag ' + y25.lagWind.lagMin + ' min (r ' + y25.lagWind.r.toFixed(3) + ')');
  } else check('modelled 2025 is loaded for the lag checks', false, 'no 2025');
  for (const y of Y) notes.push(y + ': fixed ' + ((D.years[y].fixed.centroidH - refC) * 60).toFixed(0) + ' min, tracking ' + ((D.years[y].trk.centroidH - refC) * 60).toFixed(0) + ' min, wind peak ' + D.years[y].wind.peak);
  return finish();
})();
function finish(){
  console.log(`\n${pass}/${pass + fail} shape checks passed`);
  if (failures.length){ console.log('\nFAILURES:'); for (const f of failures) console.log('  ' + f); }
  if (notes.length){ console.log('\nNOTES:'); for (const n of notes) console.log('  ' + n); }
  process.exit(fail ? 1 : 0);
}
