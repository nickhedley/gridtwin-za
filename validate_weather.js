#!/usr/bin/env node
/**
 * validate_weather.js — the multi-year weather path. Nothing else touches it.
 *
 * WHY THIS EXISTS. On 28 Aug 2026 `weatherYearNational()` was found to be
 * building the national renewable profile by weighting each region by
 * BLD_LOAD_SHARE — where DEMAND is. Gauteng got 31.5% and the Northern Cape
 * 1.4%, when every megawatt of South African wind sits in the Eastern Cape,
 * Western Cape, Northern Cape or Hydra Central, which together carry 17.7% of
 * load. The national wind profile was therefore built almost entirely from
 * provinces with no wind.
 *
 * It returned wind capacity factors of 22.6–27.2% across ALL TEN YEARS, below
 * the 28–38% band validate_benchmarks already enforced for the single-year
 * path. Fourteen harnesses and 683 checks passed over it, because not one of
 * them ever called weatherYearNational(). Three rounds of published results
 * were wrong before it was caught.
 *
 * THE LESSON, and the reason this file is separate: a code path with no harness
 * is not "probably fine", it is unmeasured. The single-year path had five
 * harnesses on it and was correct; the multi-year path had none and was not.
 *
 *   node validate_weather.js [root]
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = process.argv[2] || '.';
let pass = 0, fail = 0;
const failures = [], notes = [];
const check = (name, ok, detail) => {
  if (ok) pass++; else { fail++; failures.push(`  ${name}${detail ? '  —  ' + detail : ''}`); }
};

// Bands are the SAME ones validate_benchmarks applies to the single-year path.
// Deliberately not widened: the whole point is that both paths describe the same
// fleet and must agree on what is physically plausible.
// Bands apply to the MEAN across years, not to each year individually.
// validate_benchmarks' own justification for 28-38% is that the "SA fleet AVERAGES
// ~32-35%" — a claim about the average. A genuinely bad wind year legitimately sits
// below it: 2022 comes out at 27.4% and 2015 at 27.5%, and that is the finding, not
// a fault. Applying an average-year band to a worst-year value is a category error.
//
// THIS IS NOT WIDENING A CHECK TO GET GREEN. The check that actually catches the
// demand-weighting bug is the ANCHOR below, and it is far tighter than this band ever
// was: 1% on a single year against the dashboard. The broken version missed it by 15%.
// Verified by scoring this file against the pre-fix index.html, where it still fails.
const CF_BAND_MEAN = {
  wind:  { lo: 28, hi: 38, why: 'SA fleet averages ~32-35%; Eastern Cape sites reach the low 40s' },
  solar: { lo: 19, hi: 27, why: 'SA fixed-tilt utility PV, 21-24% typical' },
};
// Per-year, only a loose physical sanity range — anything outside is garbage rather
// than weather. Deliberately NOT the mechanism for catching mis-weighting.
const CF_BAND_YEAR = { wind: { lo: 20, hi: 45 }, solar: { lo: 15, hi: 30 } };
// The anchor. profiles.json is calendar 2023 on a METERED basis. The multi-year
// path is MERRA-2 modelled resource with a bias correction applied. If the
// correction is right, 2023 through the multi-year path reproduces the dashboard.
// This is the single most valuable check in the file: it ties the two paths
// together, so neither can drift without the other noticing.
const ANCHOR_YEAR = '2023';
const ANCHOR_TOL_PCT = 1.0;

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
  const probe = (src) => {
    const s = w.document.createElement('script');
    w.__p = null;
    s.textContent = `try { window.__p = JSON.stringify((function(){ ${src} })()); }
                     catch (e) { window.__p = JSON.stringify({ error: String(e) }); }`;
    w.document.body.appendChild(s);
    return JSON.parse(w.__p);
  };

  const r = probe(`
    const mean = a => { let t = 0; for (let i = 0; i < a.length; i++) t += a[i]; return t / a.length; };
    if (typeof weatherYearNational !== 'function') return { missing: 'weatherYearNational' };
    if (!bldWeatherYears) return { missing: 'bldWeatherYears (multi-year file not loaded)' };
    const years = bldWeatherYears.meta.years.map(String);
    const out = { years, byYear: {}, hours: HOURS,
                  dashWind: mean(PROFILES.wind), dashSolar: mean(PROFILES.solar),
                  weightsPresent: (typeof bldWxWeights !== 'undefined') && !!bldWxWeights };
    if (out.weightsPresent) {
      out.windWeights = bldWxWeights.wind; out.solarWeights = bldWxWeights.solar;
    }
    for (const y of years) {
      const n = weatherYearNational(y);
      out.byYear[y] = n ? { wind: mean(n.wind), solar: mean(n.solar),
                            len: n.wind.length,
                            finite: n.wind.every(Number.isFinite) && n.solar.every(Number.isFinite),
                            nonneg: n.wind.every(v => v >= 0) && n.solar.every(v => v >= 0) }
                        : null;
    }
    return out;`);

  if (r.error || r.missing) {
    console.log('\nFATAL: ' + (r.error || 'not available: ' + r.missing));
    process.exit(1);
  }

  console.log(`\nMULTI-YEAR WEATHER PATH  (${r.years.length} years, ${r.hours} hours)`);
  console.log('  year     wind CF   solar CF');

  // 1. every year must produce a profile at all
  for (const y of r.years) {
    const v = r.byYear[y];
    check(`${y} returns a national profile`, !!v, 'weatherYearNational() returned null');
    if (!v) continue;
    console.log(`  ${y}     ${(v.wind * 100).toFixed(2)}%     ${(v.solar * 100).toFixed(2)}%`);
  }

  // 2. series integrity
  for (const y of r.years) {
    const v = r.byYear[y]; if (!v) continue;
    check(`${y} series are ${r.hours} hours, finite and non-negative`,
          v.len === r.hours && v.finite && v.nonneg,
          `len ${v.len}, finite ${v.finite}, nonneg ${v.nonneg}`);
  }

  // 3a. per-year physical sanity only
  for (const y of r.years) {
    const v = r.byYear[y]; if (!v) continue;
    for (const [tech, b] of Object.entries(CF_BAND_YEAR)) {
      const cf = v[tech] * 100;
      check(`${y} ${tech} CF is within physical range`, cf >= b.lo && cf <= b.hi,
            `${cf.toFixed(2)}% outside ${b.lo}-${b.hi}% — that is not weather, that is a broken series`);
    }
  }
  // 3b. the MEAN across years must meet the same band validate_benchmarks applies
  //     to the single-year path. Both describe the same fleet.
  for (const [tech, b] of Object.entries(CF_BAND_MEAN)) {
    const xs = r.years.map(y => r.byYear[y] && r.byYear[y][tech]).filter(v => typeof v === 'number');
    const m = 100 * xs.reduce((a, c) => a + c, 0) / Math.max(1, xs.length);
    check(`mean ${tech} CF across all years is plausible`, m >= b.lo && m <= b.hi,
          `${m.toFixed(2)}% outside ${b.lo}-${b.hi}%. ${b.why}`);
    notes.push(`mean ${tech} CF across ${xs.length} years: ${m.toFixed(2)}%`);
  }

  // 4. THE ANCHOR. Ties the multi-year path to the dashboard.
  {
    const v = r.byYear[ANCHOR_YEAR];
    if (!v) { check(`anchor year ${ANCHOR_YEAR} available`, false, 'no profile'); }
    else {
      const gap = 100 * Math.abs(v.wind - r.dashWind) / r.dashWind;
      check(`${ANCHOR_YEAR} wind reproduces profiles.json`, gap <= ANCHOR_TOL_PCT,
            `multi-year ${(v.wind * 100).toFixed(2)}% vs dashboard ${(r.dashWind * 100).toFixed(2)}%, `
            + `gap ${gap.toFixed(1)}% > ${ANCHOR_TOL_PCT}%. The two paths describe the SAME fleet in the `
            + `SAME year and must agree. If the bias correction or the capacity weights changed, re-derive.`);
      notes.push(`anchor ${ANCHOR_YEAR}: multi-year ${(v.wind * 100).toFixed(2)}% vs dashboard `
        + `${(r.dashWind * 100).toFixed(2)}% wind CF, gap ${gap.toFixed(2)}%`);
    }
  }

  // 5. weights must be CAPACITY, not demand. Checked structurally rather than by
  //    value: regions with no wind capacity must carry no wind weight.
  check('capacity weights are loaded', r.weightsPresent,
        'bldWxWeights is null — the multi-year path is disabled, which is the correct '
        + 'failure mode, but it means nothing below was exercised');
  if (r.weightsPresent) {
    const cap = JSON.parse(fs.readFileSync(path.join(ROOT, 'nodal/regional_renewable_capacity.json'), 'utf8'));
    const bad = [];
    for (const [R, mw] of Object.entries(cap.wind_mw || {})) {
      const wt = r.windWeights[R] || 0;
      if (mw === 0 && wt > 1e-9) bad.push(`${R} has 0 MW of wind but weight ${wt.toFixed(3)}`);
      if (mw > 0 && wt <= 1e-9) bad.push(`${R} has ${mw} MW of wind but weight 0`);
    }
    check('wind weights follow installed capacity, not demand', bad.length === 0,
          bad.join('; ') + '  — this is the demand-weighting bug returning');
    const sum = Object.values(r.windWeights).reduce((a, b) => a + b, 0);
    check('wind weights sum to 1', Math.abs(sum - 1) < 1e-6, `sum ${sum}`);
  }

  // 6. inter-annual variation must actually exist — the whole purpose of the file
  {
    const ws = r.years.map(y => r.byYear[y] && r.byYear[y].wind).filter(Boolean);
    const spread = ws.length ? (Math.max(...ws) - Math.min(...ws)) / Math.min(...ws) : 0;
    check('wind varies between years', spread > 0.05,
          `spread only ${(spread * 100).toFixed(1)}% — if the years are identical the file is not being read`);
    notes.push(`inter-annual wind spread: ${(spread * 100).toFixed(1)}% `
      + `(worst ${(Math.min(...ws) * 100).toFixed(2)}%, best ${(Math.max(...ws) * 100).toFixed(2)}%)`);
  }

  // 7. the profiles must actually reach simulate() and move the answer
  {
    const d = probe(`
      const P = (y) => { const n = weatherYearNational(y);
        return { demand: PROFILES.demand, solar: n.solar, wind: n.wind, csp: PROFILES.csp, real: true }; };
      const ys = bldWeatherYears.meta.years.map(String);
      const a = simulate(state, P(ys[0])), b = simulate(state, P(ys[ys.length - 1]));
      return { a: a.E.wind, b: b.E.wind, same: a.E.wind === b.E.wind };`);
    check('different weather years produce different dispatch', d && d.same === false,
          d && d.error ? d.error : 'wind energy identical across two different years — '
          + 'the substituted profile is not reaching simulate()');
  }

  console.log(`\n${pass}/${pass + fail} weather checks passed`);
  if (failures.length) { console.log('\nFAILURES:'); failures.forEach(f => console.log(f)); }
  if (notes.length) { console.log('\nNOTES:'); notes.forEach(n => console.log('  ' + n)); }
  process.exit(fail ? 1 : 0);
})();
