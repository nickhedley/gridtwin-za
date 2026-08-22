#!/usr/bin/env node
/**
 * validate_solve.js — actually SOLVES the build optimiser and reports what it
 * chose. The one harness that was missing, and its absence cost a whole session.
 *
 * WHY THIS EXISTS. Every other harness checks that the LP is well FORMED: that
 * constraint families are present, that identifiers resolve, that controls move
 * outputs. None of them solve it. So on 21 Aug 2026 two changes to the regional
 * storage headroom constraint shipped, one hung the solver and the other made
 * the model infeasible, and neither was caught until the user ran the page.
 *
 * The earlier attempt at this failed because it injected bldRegProfiles and
 * bldHeadroom by hand and left everything else null - TDP projects, per-region
 * coal, existing fleet. It reported Infeasible on code the browser ran fine,
 * which is worse than useless: it looks like evidence and is not.
 *
 * The fix is to call the page's OWN loaders, so the data state matches what the
 * build box actually has when the user presses the button.
 *
 *   node validate_solve.js [root] [--pace grid|masterplan|none] [--verbose]
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const highsLoader = require('highs');

const ROOT = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '.';
const PACE = (process.argv.find(a => a.startsWith('--pace=')) || '--pace=masterplan').split('=')[1];
const VERBOSE = process.argv.includes('--verbose');

// Expectations. Deliberately loose: this checks the model SOLVES and gives a
// sane answer, not that it gives one particular answer. A tight assertion here
// would fail on every legitimate cost update.
const EXPECT = {
  status: 'Optimal',
  maxTotalGW: 400,     // anything above this is a runaway, not a plan
  maxOneTechGW: 120,   // no single technology should dominate this hard
};

let pass = 0, fail = 0;
const failures = [], notes = [];
const check = (name, ok, detail) => {
  if (ok) pass++; else { fail++; failures.push(`  ${name}  —  ${detail || ''}`); }
};

(async () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const errs = [];
  const dom = new JSDOM(html, {
    runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true,
    url: 'file://' + path.resolve(ROOT) + '/index.html',
    beforeParse(w) {
      w.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, {
        get: () => () => ({ addColorStop(){}, data: [], width: 0, measureText: () => ({ width: 10 }) }) });
      const ch = () => new Proxy(function () { return ch(); }, { get: () => ch() });
      w.L = new Proxy({}, { get() { return function () { return ch(); }; } });
      w.onerror = (m) => errs.push(String(m).slice(0, 120));
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

  await new Promise(r => setTimeout(r, 5000));
  const w = dom.window;

  // Call the PAGE'S OWN loaders rather than injecting data. This is the whole
  // point: bldLoadRegionalData also pulls in the TDP projects, and anything else
  // it decides it needs stays in step automatically.
  const run = (src) => {
    const s = w.document.createElement('script');
    s.textContent = src;
    w.document.body.appendChild(s);
  };
  run(`window.__ready = bldLoadRegionalData().then(ok => { window.__loaded = ok; })
        .catch(e => { window.__loadErr = String(e).slice(0,160); });`);
  await new Promise(r => setTimeout(r, 2500));

  if (w.__loadErr) { console.log('data load threw:', w.__loadErr); process.exit(1); }
  check('regional data loads through the page\'s own loader', w.__loaded === true,
    'bldLoadRegionalData() returned ' + w.__loaded);
  if (!w.__loaded) { report(); return; }

  run(`try {
    if (typeof PRESETS !== 'undefined' && PRESETS[${JSON.stringify(process.env.PRESET || 'Future electricity mix')}])
      applyState(PRESETS[${JSON.stringify(process.env.PRESET || 'Future electricity mix')}]);
    const rate = BLD_PACE[${JSON.stringify(PACE)}] || BLD_PACE.masterplan;
    const built = bldBuildRegionalLP({ growth:0.05, eaf:65, rate, carbonCap:null, state:state });
    window.__lp = built.lp;
    window.__built = JSON.stringify({ chars: built.lp.length, rows: built.lp.split(String.fromCharCode(10)).length });
  } catch(e) { window.__buildErr = String(e).slice(0,200); }`);
  await new Promise(r => setTimeout(r, 500));

  if (w.__buildErr) {
    check('regional LP builds', false, w.__buildErr);
    report(); return;
  }
  const b = JSON.parse(w.__built);
  check('regional LP builds', true, '');
  notes.push(`LP is ${b.chars.toLocaleString()} chars, ${b.rows.toLocaleString()} rows`);

  const highs = await highsLoader({
    locateFile: (f) => path.join(__dirname, 'node_modules/highs/build', f) });
  const t0 = Date.now();
  let res;
  try { res = highs.solve(w.__lp, { time_limit: 180 }); }
  catch (e) { check('solver runs to completion', false, String(e).slice(0, 160)); report(); return; }
  const secs = ((Date.now() - t0) / 1000).toFixed(1);

  check('solver runs to completion', true, '');
  check(`model status is ${EXPECT.status}`, res.Status === EXPECT.status,
    `got ${res.Status} after ${secs}s`);
  notes.push(`solved in ${secs}s on the ${PACE} pace`);

  if (res.Status !== EXPECT.status) { report(); return; }

  const sumOf = (pre) => Object.entries(res.Columns)
    .filter(([k]) => k.startsWith(pre)).reduce((a, [, v]) => a + (v.Primal || 0), 0) / 1000;
  const got = {};
  for (const t of ['wind','pv','rooftop','batt','vrfb','ironair','ccgt'])
    got[t] = sumOf('b_' + t + '_');
  const total = Object.values(got).reduce((a, b2) => a + b2, 0);

  console.log('\nWHAT THE OPTIMISER CHOSE, GW');
  for (const [t, v] of Object.entries(got))
    console.log('   ' + t.padEnd(10) + (v > 0.01 ? v.toFixed(2) : '\u2013').padStart(9));
  console.log('   ' + 'TOTAL'.padEnd(10) + total.toFixed(2).padStart(9));

  check('total build is not a runaway', total <= EXPECT.maxTotalGW,
    `${total.toFixed(0)} GW total, ceiling ${EXPECT.maxTotalGW}`);
  const worst = Object.entries(got).sort((a, b2) => b2[1] - a[1])[0];
  check('no single technology runs away', worst[1] <= EXPECT.maxOneTechGW,
    `${worst[0]} at ${worst[1].toFixed(0)} GW, ceiling ${EXPECT.maxOneTechGW}`);

  if (VERBOSE) {
    console.log('\nBY REGION');
    for (let ri = 0; ri < 10; ri++){
      const r = {};
      for (const t of ['wind','pv','batt','vrfb','ironair'])
        r[t] = sumOf('b_' + t + '_' + ri + '_');
      if (Object.values(r).some(v => v > 0.01))
        console.log('   region ' + ri + '  ' + Object.entries(r)
          .map(([t, v]) => t + ' ' + (v > 0.01 ? v.toFixed(2) : '-')).join('  '));
    }
  }
  report();

  function report(){
    if (errs.length) notes.push('page errors during load: ' + errs.slice(0, 3).join(' | '));
    console.log(`\n${pass}/${pass + fail} solve checks passed`);
    if (failures.length) { console.log('\nFAILURES:'); failures.forEach(f => console.log(f)); }
    if (notes.length) { console.log('\nNOTES:'); notes.forEach(n => console.log('  ' + n)); }
    process.exit(fail ? 1 : 0);
  }
})();
