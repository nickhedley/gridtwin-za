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

// EVERY PRESET THIS HARNESS NAMES MUST EXIST. Added 22 Sep 2026. A missing preset spreads as
// undefined and runs the defaults, or its button lookup returns null and the checks are
// skipped - either way with no error. Deleting Crisis 2023 took validate_outputs from 40/40 to
// 36/36 while it still reported green.
{
  const _src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const _i = _src.indexOf('const PRESETS={');
  const _blk = _src.slice(_i, _src.indexOf('\n};', _i));
  const _have = new Set([..._blk.matchAll(/^\s*'((?:[^'\\]|\\.)+)'\s*:\s*\{/gm)].map(m => m[1].replace(/\\'/g, "'")));
  const _miss = [process.env.PRESET || 'Deep decarbonisation 2035'].filter(n => !_have.has(n));
  check('every preset this harness uses exists', _miss.length === 0, 'missing: ' + _miss.join(', '));
}
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
    if (typeof PRESETS !== 'undefined' && PRESETS[${JSON.stringify(process.env.PRESET || 'Deep decarbonisation 2035')}])
      applyState(PRESETS[${JSON.stringify(process.env.PRESET || 'Deep decarbonisation 2035')}]);
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

  // ── THE NODAL DAY MIP HOLDS RESERVE ───────────────────────────────────────
  // Added 23 Sep 2026. Nothing in the suite exercised buildDayLP, and on 23 Sep the regional MIP
  // turned out to be dispatching with NO reserve held unless the user had switched ancillary
  // PRICING on - while the national engine held 2,200 MW in every hour of every scenario. The
  // requirement now follows reserveEnabled. Three things to assert, all on the LP text, because
  // solving a day MIP here would double this harness's runtime:
  //   the reserve variables and rows exist when reserve is enabled,
  //   they are absent when it is not, so the formulation is unchanged in that case,
  //   and the requirement is the ASTR figure rather than something invented locally.
  // buildDayLP lives inside MIP_WORKER_SRC, the string the page hands to its Web Worker, so it
  // is not callable from here directly. Rebuild it from that same string: the harness then tests
  // the code that actually runs, not a copy of it.
  run(`try {
    const buildDayLP = new Function(MIP_WORKER_SRC + '; return buildDayLP;')();
    const mk = (on) => {
      const units = [{ marginal_cost: 500, startup_cost: 1e5, cap: 1000, msl: 0.5, region: 0 }];
      const sto = [{ power: 500, energy: 2000, eff: 0.88, region: 0 }];
      const load = [[]]; for (let h = 0; h < 24; h++) load[0].push(20000);
      const frac = on ? mipReserveFrac() : 0;
      const out = buildDayLP(units, sto, [], 1, load, [0], [1000], 87000, null, frac);
      return Array.isArray(out) ? out.join(String.fromCharCode(10)) : String(out);
    };
    window.__res = JSON.stringify({ on: mk(true), off: mk(false),
                                    frac: mipReserveFrac(),
                                    unpriced: (state.asReserveOn = false, mipReserveFrac()) });
  } catch(e) { window.__resErr = String(e).slice(0,200); }`);
  await new Promise(r => setTimeout(r, 400));
  if (w.__resErr){
    check('the nodal day MIP holds reserve when reserve is enabled', false, w.__resErr);
  } else if (w.__res){
    const R = JSON.parse(w.__res);
    const hasRows = /rs_0_0/.test(R.on) && /rp_0_0/.test(R.on) && /rb_0_0/.test(R.on);
    const clean = !/rs_0_0/.test(R.off);
    // The defect was in the CALLER, not the builder: what the page TELLS the nodal model to hold.
    // R.unpriced is that number with ancillary pricing switched off, which is the default and
    // was zero until 23 Sep 2026.
    check('the nodal day MIP holds reserve when reserve is enabled',
          hasRows && clean && R.frac > 0.09 && R.frac < 0.11 && R.unpriced > 0.09,
          `reserve rows ${hasRows ? 'present' : 'MISSING'} with reserve on and `
          + `${clean ? 'absent' : 'STILL PRESENT'} with it off; requirement `
          + `${(R.frac * 100).toFixed(1)}% of mean load, and `
          + `${(R.unpriced * 100).toFixed(1)}% with ancillary pricing off`);
  }

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

  // ── ENGINE AND OPTIMISER AGREE ON RESERVE ELIGIBILITY ─────────────────────
  // Added 14 Oct 2026 (user, message 90). Under the ASTR rule the spare headroom of running gas and diesel turbines counts as
  // operating reserve, idle open-cycle plant does not. The engine applies astrOnlineHeadroom(output, capacity, m); the national
  // build LP has its own rows (rgo_, rd_). Solve the national LP to 2028 with open-cycle LNG on and, in every representative
  // hour, test the LP's credited headroom against the engine's function on the LP's own dispatch: the LP may never count more.
  // Before this the LP counted all new gas capacity, running or not, while the engine counted none (found 14 Oct 2026).
  {
    w.eval(`window.__agreeLp = (() => { const H0 = BLD_YEARS[BLD_YEARS.length - 1]; bldSetHorizon(2028);
      try { return bldBuildLP({ growth: 0.02, eaf: 0.64, rate: bldRates(), state: { ...state, bldOcgtOn: 1, reserveRule: 'astr' } }).lp; }
      catch (e) { return 'ERR ' + e; } finally { bldSetHorizon(H0); } })()`);
    const lpA = w.__agreeLp;
    let ag = null;
    try {
      if (String(lpA).startsWith('ERR')) throw new Error(lpA);
      const rA = highs.solve(lpA, { time_limit: 180 });
      if (rA.Status !== 'Optimal') throw new Error('status ' + rA.Status);
      const C = rA.Columns, v = n => (C[n] && C[n].Primal) || 0, act = {};
      for (const r of (Array.isArray(rA.Rows) ? rA.Rows : Object.values(rA.Rows))) act[r.Name] = r.Primal;
      const dslCap = {}; for (const mm of lpA.matchAll(/ rd2_(\S+): .*<= ([0-9.eE+-]+)/g)) dslCap[mm[1]] = +mm[2];
      const m = w.eval('FIXED.reserveGasMinStableFrac');
      ag = { n: 0, over: 0, worst: 0, gasOn: 0, dslOn: 0 };
      for (const name of Object.keys(C)) if (name.startsWith('rgo_')) {
        const k = name.slice(4), gas = v('gg_' + k) + v('go_' + k), gd = v('gd_' + k), rgo = v(name), rd = v('rd_' + k);
        const gasCap = rgo + gas - act['rgo2_' + k];          // rgo2: rgo + gas - capacity <= 0
        const o = Math.max(0, rgo - w.astrOnlineHeadroom(gas, gasCap, m)) + Math.max(0, rd - w.astrOnlineHeadroom(gd, dslCap[k], m));
        ag.n++; if (o > 1) ag.over++; ag.worst = Math.max(ag.worst, o); if (gas > 1) ag.gasOn++; if (gd > 1) ag.dslOn++;
      }
      // Pumped storage (message 97): its reserve is at most its unused output plus the pumping it could drop, as in the engine.
      const psCap = {}; for (const mm of lpA.matchAll(/ rpp_(\S+): .*<= ([0-9.eE+-]+)/g)) psCap[mm[1]] = +mm[2];
      ag.ps = 0; ag.psOver = 0;
      for (const k of Object.keys(psCap)) { ag.ps++; if (v('rp_' + k) - (psCap[k] - v('pdis_' + k) + v('pchg_' + k)) > 1) ag.psOver++; }
    } catch (e) { ag = { error: String(e).slice(0, 160) }; }
    check('engine and optimiser count the same online headroom as reserve',
      ag && !ag.error && ag.n > 0 && ag.over === 0 && ag.ps > 0 && ag.psOver === 0,
      ag && ag.error ? ag.error : `${ag.over} of ${ag.n} hours where the LP credits more than the engine (worst ${ag.worst.toFixed(1)} MW); `
        + `gas running in ${ag.gasOn}, diesel in ${ag.dslOn}; pumped storage over its unused power in ${ag.psOver} of ${ag.ps}`);
  }

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
