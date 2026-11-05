// GridTwin ZA - the LP and the engine read the same hourly series (message 707 (c); the data-path review on f36b230).
// Run with: node validate_series.js [root]     (default: testroot; about 1 minute)
//
// WHY THIS EXISTS
// The build LP and the hourly engine each read wind, solar, rooftop, CSP, offshore and demand through their own code. Nothing compared
// them, and the review found four places where they had parted: rooftop added back on the utility fleet's shape and removed on fixed tilt,
// CSP at a flat 0.38 in the LP against Eskom's shape in the engine, offshore on one year's series in the LP against each year's in the
// engine, and the forecast reading a diesel key that does not exist. Each one moved a result without failing a check.
//
// HOW IT TESTS
// Both sides record what they read: bldBuildLP with opts.__seriesProbe (every hour of one model year: the per-unit series and demand it
// writes into the LP) and simulate with u.__seriesProbe (the hourly series the run reads, before any dispatch). For every representative
// day in two LP builds (clustered on the metered reference with its extremes, a loop stress window and the seed tail; and calendar days
// on equal weights), each series is set beside the engine's on the profile the engine runs that day's weather on (the metered profile for
// calendar and clustered days, wxEngineProfile of the weather year for tail and stress days), at the same day and hour:
//   exact (to 1e-9): demand, exports, CSP and offshore on every day; every series on calendar, tail and stress days.
//   to one constant per day (1e-6): wind, new wind, solar, new solar and rooftop on clustered days, which are the reference's own days
//   rescaled to the twelve-year means by design (bldRepDaysClustered); the hours either side may clip at 1 and are left out.
// Existing utility solar is compared as the LP uses it: the metered fleet's own series on a clustered day of the metered reference, else
// (1 - x) fixed + x tracking, x the existing fleet's tracker share (as the engine on a modelled year).
// Then three faults are put back, one at a time, on the LP side only, and the check must fail on each: two the review found, rooftop on the
// utility fleet's shape (PROFILES.roof removed) and offshore on one year's series (OFFSHORE_BY_YEAR removed), and one this check found,
// existing solar blended with its tracking twin on the metered reference, which already carries its trackers (fixed on 5 Nov 2026).
// Last, a static scan: every `KEY || 0` and `KEY ?? 0` read off a settings object (p, S, u, q, st, state, FIXED) must name a key that
// exists somewhere (FIXED, a slider, a preset, or set in the code); a key that exists nowhere reads as zero forever, as dieselMW did.
//
// Pathway context: the rooftop add-back on the twelve-year mean is applied as every pathway run applies it (harness/pathway/roof12.js),
// so twelveYearDemand() is PROFILES.demand on both sides. On the page (roof12 not applied) the LP's tail and stress days read the
// unscaled series while the engine reads twelveYearDemand(); that difference is measured and printed, not checked (TODO 14mx).

const { JSDOM } = require('jsdom');
const fs = require('fs'), path = require('path');
const ROOT = process.argv[2] || 'testroot';

let pass = 0, fail = 0;
function check(label, ok, detail) {
  if (ok) { pass++; console.log(`  PASS  ${label}${detail ? '   ' + detail : ''}`); }
  else { fail++; console.log(`  FAIL  ${label}${detail ? '   ' + detail : ''}`); }
}

function boot(root) {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const dom = new JSDOM(html, {
    runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true,
    url: 'file://' + path.resolve(root) + '/index.html',
    beforeParse(w) {
      w.HTMLCanvasElement.prototype.getContext = () =>
        new Proxy({}, { get: () => () => ({ addColorStop() {}, data: [], width: 0, measureText: () => ({ width: 10 }) }) });
      const chain = () => new Proxy(function () { return chain(); }, { get: () => chain() });
      w.L = new Proxy({}, { get() { return function () { return chain(); }; } });
      w.onerror = () => {};
      Object.defineProperty(w.history, 'replaceState', { value: () => {}, writable: true });
      w.URL.createObjectURL = () => 'blob:x';
      w.Worker = function () { this.postMessage = () => {}; };
      w.fetch = async (u) => {
        try {
          const clean = String(u).split('?')[0].replace(/^file:.*?\/(?=nodal\/|profiles|config)/, '');
          const t = fs.readFileSync(path.join(path.resolve(root), clean), 'utf8');
          return { ok: true, json: async () => JSON.parse(t), text: async () => t };
        } catch (e) {
          return { ok: false, json: async () => { throw e; }, text: async () => { throw e; } };
        }
      };
    },
  });
  return new Promise(res => setTimeout(() => res(dom.window), 6000));
}

// The central's series settings (test 8 and run (6): clustered on the metered reference with its twelve extremes, 25 days, tracking solar,
// modern-turbine wind, the six-constant wind correction, offshore on), as harness/pathway/pathway_perfail.js sets them.
const CENTRAL = { bldRepWeights: 'clustered', bldRepRefYear: 'metered', bldRepExtremeDays: [20, 161, 162, 163, 187, 188, 194, 195, 196, 214, 218, 358],
  bldPvTracking: 1, bldWindModern: 1, wxWindCorr: 1, bldOffshoreOn: 1, bldStressTarget: 1 };
const PROBE_YEAR = 2035, STRESS = { year: 2019, seed: 1, start: 180, n: 3, fromYear: 2026 };

// In the page: build the LP with the probe, then run the engine's probe on the profile each day's weather runs on, and set them side by side.
// fault: 'roof' or 'off' puts one of the review's faults back on the LP side only (restored before the engine runs).
const PAGE_SIDE = (over, fault) => `
  // The page state carries the same settings (bldBuildLP refuses a state that disagrees with the page's on its switches, and the weather
  // years read the page's wxWindCorr); restored at the end.
  const OVER = ${JSON.stringify(over)}, _st = {};
  for (const k of Object.keys(OVER)){ _st[k] = (k in state) ? { v: state[k] } : null; state[k] = OVER[k]; }
  try {
  const S = { ...state };
  const _rd = bldRepDays; bldRepDays = (n, ...a) => _rd(n === 12 ? 25 : n, ...a);
  const _sp = bldStressPeriods.slice(); bldStressPeriods.length = 0; bldStressPeriods.push(${JSON.stringify(STRESS)});
  const _roof = PROFILES.roof, _oby = OFFSHORE_BY_YEAR;
  const pr = { years: [${PROBE_YEAR}], rows: [] };
  try {
    if (${JSON.stringify(fault)} === 'roof') PROFILES.roof = null;
    if (${JSON.stringify(fault)} === 'off') OFFSHORE_BY_YEAR = null;
    const SL = ${JSON.stringify(fault)} === 'solarEx' ? { ...S, bldExistPvTrackShare: existPvTrackShareAt(S) } : S;   // the blend on every day, as before 707 (c)
    bldBuildLP({ growth: 0.02, eaf: 0.64, rate: bldRates(), state: SL, __seriesProbe: pr });
  } finally { PROFILES.roof = _roof; OFFSHORE_BY_YEAR = _oby; bldRepDays = _rd; bldStressPeriods.length = 0; _sp.forEach(v => bldStressPeriods.push(v)); }
  if (!pr.rows.length) throw new Error('the LP probe recorded no rows (horizon ' + BLD_YEARS[0] + '-' + BLD_YEARS[BLD_YEARS.length - 1] + ')');
  // The engine's series on a profile: existing fleet alone, then new builds alone (a blend of one is that one).
  const eng = prof => {
    const base = { ...S, scenarioYear: ${PROBE_YEAR}, demandGrowthPct: 0, demandBlockMW: 0, __ccgtFloor: 0, drShiftPct: 0 };
    const a = {}, b = {};
    simulate({ ...base, windMW: 1000, newWindMW: 0, pvUtilityMW: 1000, newPvMW: 0, __seriesProbe: a }, prof);
    simulate({ ...base, windMW: 0, newWindMW: 1000, pvUtilityMW: 0, newPvMW: 1000, __seriesProbe: b }, prof);
    for (const k of ['demand', 'exp', 'roof', 'windU', 'solarU', 'csp']) if (!a[k] || !b[k]) throw new Error('the engine probe has no ' + k);
    return { dem0: a.demand, exp: a.exp, roof: a.roof, wp: a.windU, wpN: b.windU, spE: a.solarU, spN: b.solarU, csp: a.csp, off: a.off };
  };
  const cache = {};
  const engFor = r => { const key = (r.kind === 'tail' || r.kind === 'stress') ? String(r.year) : 'ref';
    if (!cache[key]) cache[key] = eng(key === 'ref' ? PROFILES : wxEngineProfile(weatherYearNational(key))); return cache[key]; };
  // Group the LP rows by day, each hour's values beside the engine's at the same index.
  const days = {};
  for (const r of pr.rows){
    const E = engFor(r), id = r.kind + ':' + r.d;
    const D = days[id] || (days[id] = { kind: r.kind, d: r.d, year: r.year, lp: {}, en: {} });
    const lpv = { dem0: r.dem0, exp: r.exp, roof: r.spR, wp: r.wp, wpN: r.wpN, spE: r.spE, spN: r.spN, csp: r.csp, off: r.off };
    for (const k of Object.keys(lpv)){ (D.lp[k] = D.lp[k] || []).push(lpv[k]); (D.en[k] = D.en[k] || []).push(E[k] ? E[k][r.i % E[k].length] : null); }
  }
  return { days: Object.values(days), kinds: [...new Set(pr.rows.map(r => r.kind))], offOn: pr.rows.some(r => r.off !== null),
           xShare: Math.max(...pr.rows.map(r => r.x)) };
  } finally { for (const k of Object.keys(_st)){ if (_st[k]) state[k] = _st[k].v; else delete state[k]; } }
`;

// Compare one build's days. Returns, per series, the number of hours compared, the largest difference and the failing days.
function compare(res) {
  const EXACT = ['dem0', 'exp', 'csp', 'off'], SCALED = ['roof', 'wp', 'wpN', 'spE', 'spN'];
  const out = {};
  const note = (k, n, diff, bad) => { const o = out[k] || (out[k] = { n: 0, max: 0, bad: [] }); o.n += n; o.max = Math.max(o.max, diff); if (bad) o.bad.push(bad); };
  for (const D of res.days){
    for (const k of EXACT.concat(SCALED)){
      const L = D.lp[k], E = D.en[k];
      if (k === 'off' && L.every(v => v === null)) continue;
      if (E.some(v => v === null || v === undefined)) { note(k, 0, Infinity, D.kind + ' ' + D.d + ': the engine has no ' + k); continue; }
      if (D.kind !== 'clustered' || EXACT.includes(k)){
        let m = 0; for (let h = 0; h < 24; h++) m = Math.max(m, Math.abs(L[h] - E[h]));
        note(k, 24, m, m > 1e-9 ? D.kind + ' ' + D.d + (D.year ? ' (' + D.year + ')' : '') + ' ' + m.toExponential(2) : null);
      } else {
        // One constant per day: c from the hours clear of clipping, then every such hour within 1e-6 of c x engine; zero where it is zero.
        const hrs = []; for (let h = 0; h < 24; h++) if (E[h] > 0.02 && E[h] < 0.8 && L[h] < 0.999) hrs.push(h);
        let m = 0, c = null;
        if (hrs.length){ const rs = hrs.map(h => L[h] / E[h]).sort((a, b) => a - b); c = rs[Math.floor(rs.length / 2)];
          for (const h of hrs) m = Math.max(m, Math.abs(L[h] - c * E[h])); }
        for (let h = 0; h < 24; h++) if (E[h] === 0) m = Math.max(m, Math.abs(L[h]));
        note(k, hrs.length, m, m > 1e-6 ? 'clustered ' + D.d + ' ' + m.toExponential(2) + ' (c ' + (c === null ? '-' : c.toFixed(4)) + ')' : null);
      }
    }
  }
  return out;
}

// The '|| 0' scan: keys read with a zero fallback off a settings object, against every key that exists.
function scanZeroFallbacks(src, known) {
  const re = /\b(?:p|S|u|q|st|state|FIXED|S0|_rw)\.([A-Za-z_$][\w$]*)\s*(?:\|\||\?\?)\s*0(?![.\d])/g;
  const keys = new Map(); let m;
  while ((m = re.exec(src))) { const k = m[1]; if (!keys.has(k)) keys.set(k, src.slice(0, m.index).split('\n').length); }
  const missing = [];
  for (const [k, line] of keys){
    if (known.has(k)) continue;
    // Set anywhere in the code: an assignment to .k, a property k: in an object literal, a 'k' or "k" string (a slider id or a key list).
    const set = new RegExp('\\.' + k + '\\s*(?:=(?!=)|\\+=|-=)|[{,\\s]' + k + '\\s*:|[\'"`]' + k + '[\'"`]');
    if (!set.test(src)) missing.push(k + ' (first read on line ' + line + ')');
  }
  return { n: keys.size, missing };
}

(async () => {
  const w = await boot(ROOT);
  console.log(`\nThe LP and the engine read the same hourly series (${ROOT})`);
  const K = require('./pathway/roof12.js')(w);   // the pathway context: the add-back on the twelve-year mean, as every pathway run
  w.eval(`applyState(PRESETS['Today 2026']); bldSetHorizon(2040);`);   // the pathway's horizon, as pathway_perfail.js sets it
  await w.eval('loadWeatherYears()');
  const run = async (over, fault) => {
    const src = `(async () => { ${PAGE_SIDE(over, fault)} })()`;
    try { return await w.eval(src); } catch (e) { return { error: String(e && e.stack || e) }; }
  };

  const builds = [['clustered (central)', CENTRAL], ['calendar days (equal weights)', { ...CENTRAL, bldRepWeights: 'equal', bldRepExtremeDays: [] }]];
  const results = {};
  for (const [name, over] of builds){
    const res = await run(over, null);
    if (res.error){ check(name + ': the probes run', false, res.error.split('\n')[0]); continue; }
    results[name] = res;
    const cmp = compare(res);
    console.log(`  ${name}: days ${res.days.length} (${res.kinds.join(', ')}), offshore ${res.offOn ? 'on' : 'off'}, existing tracker share ${res.xShare.toFixed(4)}`);
    const LABEL = { dem0: 'demand', exp: 'exports', roof: 'rooftop', wp: 'existing wind', wpN: 'new wind', spE: 'existing utility solar', spN: 'new solar', csp: 'CSP', off: 'offshore' };
    for (const k of Object.keys(LABEL)){
      const o = cmp[k];
      if (!o){ check(`${name}: ${LABEL[k]} compared`, k === 'off' && !res.offOn, k === 'off' ? 'offshore off in this build' : 'no hours'); continue; }
      check(`${name}: ${LABEL[k]}, LP = engine at the same day and hour`, o.bad.length === 0 && o.n > 0,
        `${o.n} hours, largest difference ${o.max === 0 ? '0' : o.max.toExponential(2)}${o.bad.length ? '; ' + o.bad.length + ' days differ, e.g. ' + o.bad.slice(0, 3).join('; ') : ''}`);
    }
  }

  // Injected faults: each must fail the comparison on its own series.
  for (const [fault, key, label] of [['roof', 'roof', 'rooftop on the utility fleet\'s shape'], ['off', 'off', 'offshore on one year\'s series'],
                                     ['solarEx', 'spE', 'existing solar blended with its twin on the metered reference (trackers twice)']]){
    const res = await run(CENTRAL, fault);
    if (res.error){ check(`injected fault (${label}) runs`, false, res.error.split('\n')[0]); continue; }
    const o = compare(res)[key];
    check(`injected fault caught: ${label}`, !!o && o.bad.length > 0, o ? `${o.bad.length} days differ, largest ${o.max.toExponential(2)}` : 'not compared');
  }

  // The '|| 0' scan.
  const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const known = new Set(JSON.parse(w.eval(`JSON.stringify([...Object.keys(FIXED), ...Object.keys(state || {}),
    ...Object.values(PRESETS).flatMap(o => Object.keys(o || {}))])`)));
  // Two reads that are not settings keys, each with its reason: listed, so a new one still fails.
  const NOT_SETTINGS = { _laGasRefill: 'a measurement switch passed by hand to simulate (its comment: measurement only); off unless set',
                         Dual: "a HiGHS solution column's field (p is a column there, not a setting)" };
  for (const [k, why] of Object.entries(NOT_SETTINGS)){ known.add(k); console.log(`  note  ${k}: ${why}`); }
  const scan = scanZeroFallbacks(src, known);
  check(`every key read with a zero fallback exists (${scan.n} keys)`, scan.missing.length === 0,
    scan.missing.length ? 'exists nowhere: ' + scan.missing.join(', ') : '');
  // The scan must find a key that exists nowhere.
  const planted = scanZeroFallbacks(src + '\nconst __z = p.dieselMWx || 0;\n', known);
  check('injected fault caught: a zero fallback on a key that exists nowhere', planted.missing.some(s => s.startsWith('dieselMWx ')));

  // Page context, measured not checked: without roof12, the LP's tail and stress days read PROFILES.demand and the engine on a weather year
  // twelveYearDemand(), which differ by rooftopMW x derate x (1 - K) x the rooftop series.
  const pageMW = +w.eval(`(() => { const S = PROFILES.roof || PROFILES.solar; let m = 0; for (const v of S) m = Math.max(m, v);
    return FIXED.rooftopMW * FIXED.rooftopDerate * Math.abs(1 - ${K}) * m; })()`);
  console.log(`  page context (roof12 not applied): tail and stress days' demand differs from the engine's by at most ${pageMW.toFixed(1)} MW (K ${K.toFixed(4)}); measured, not checked`);
  console.log(`\n${pass}/${pass + fail} series checks passed`);
  process.exit(fail ? 1 : 0);
})();
