// GridTwin ZA - coverage for the capacity expansion LP build path.
// Run with: node validate_lp.js [root]     (default: testroot)
//
// WHY THIS EXISTS
// Neither eng5.js nor jsdom_local2.js contains a single reference to bld* or
// mipWorker, so nothing in the suite exercised bldBuildLP or bldBuildRegionalLP.
// That let `const S = opts.state || FIXED` sit there undetected: `state` is a
// sparse SLIDERS-only overlay and is always passed, so FIXED was never consulted
// and every constant read undefined, silently falling through to a hardcoded
// literal from 2024. The LP ran on wind 3600 while FIXED said 4458.
//
// HOW IT TESTS
// Not by inspecting source - by perturbation. Build the LP, change one field on
// FIXED, rebuild, and assert the LP text moved. If the LP is insensitive to a
// FIXED field, that field is not reaching the model, whatever the code appears
// to say. This is the check that would have caught the original bug, and it
// stays valid however the constants are plumbed in future.
//
// bldBuildRegionalLP is covered as well as bldBuildLP: it is the DEFAULT
// selection in the Where To Build dropdown (bldRegional option value="1" is
// marked selected), so it is the path most users actually run.

const { JSDOM } = require('jsdom');
const fs = require('fs'), path = require('path');
const ROOT = process.argv[2] || 'testroot';

// carbonTaxRPerT is now in FIXED and is the ONLY carbon price in the model. Both
// LPs previously fell through to a hardcoded 550 that no slider could change,
// while the hourly dispatch used the slider - two halves of the model on
// different carbon prices. These two entries are what catches that recurring.
// EVERY BUILDABLE TECHNOLOGY MUST APPEAR IN THE CAPEX FORMULA.
// Added 28 Aug 2026. Vanadium, iron-air and pumped storage were absent from
// newCapexR entirely, so 20 GW of 100-hour iron-air showed a capital cost of
// ZERO and slightly LOWERED average cost. Nothing caught it: newCapexR is not
// an LP input, so the perturbation tests below never touched it, and a missing
// addend produces a plausible number rather than a crash.
const BUILDABLE_CAPEX = {
  newWindMW: 'acapWind', newPvMW: 'acapPv', newRooftopMW: 'acapRooftop',
  newBattMW: 'acapBatt4h', newCcgtMW: 'acapCcgt', newNuclearMW: 'acapNuclear',
  newCoalMW: 'acapCoal', newVrfbMW: 'acapVrfb', newIronAirMW: 'acapIronAir',
  newPsMW: 'acapPs',
};

const NATIONAL_FIELDS = {
  windMW: 9999, pvUtilityMW: 9999, rooftopMW: 9999, cspMW: 9999, battPowerMW: 9999,
  costCoal: 1234, costCcgt: 4321, costDiesel: 7777, emisCoal: 2.5, emisCcgt: 1.5,
  carbonTaxRPerT: 999, emisDiesel: 3.3, lpCurtailCostR: 555, lpBattDischargeCostR: 77,
  vomCoal: 444, vomCcgt: 333, vomDiesel: 222,
};
const REGIONAL_FIELDS = { costCoal: 1234, costDiesel: 7777, emisCoal: 2.5, carbonTaxRPerT: 999, emisDiesel: 3.3, lpCurtailCostR: 555, vomCoal: 444, vomDiesel: 222 };

function boot(root) {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const dom = new JSDOM(html, {
    runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true,
    url: 'file://' + path.resolve(root) + '/index.html',
    beforeParse(w) {
      w.HTMLCanvasElement.prototype.getContext = () =>
        new Proxy({}, { get: () => () => ({ addColorStop() {}, data: [], width: 0 }) });
      const chain = () => new Proxy(function () { return chain(); }, { get: () => chain() });
      w.L = new Proxy({}, { get() { return function () { return chain(); }; } });
      w.onerror = () => {};
      Object.defineProperty(w.history, 'replaceState', { value: () => {}, writable: true });
      w.URL.createObjectURL = () => 'blob:x';
      w.Worker = function () { this.postMessage = () => {}; };
      w.fetch = async (u) => {
        try {
          const clean = String(u).split('?')[0].replace(/^file:.*?\/(?=nodal\/|profiles)/, '');
          const t = fs.readFileSync(path.join(path.resolve(root), clean), 'utf8');
          return { ok: true, json: async () => JSON.parse(t), text: async () => t };
        } catch (e) {
          return { ok: false, json: async () => { throw e; }, text: async () => { throw e; } };
        }
      };
    },
  });
  return new Promise(res => setTimeout(() => res(dom.window), 3000));
}

function runProbe(w, src) {
  const s = w.document.createElement('script');
  s.textContent = `window.__r = null;
    (async function(){ try { window.__r = JSON.stringify(await (async function(){ ${src} })()); }
                       catch (e) { window.__r = JSON.stringify({ error: String(e) }); } })();`;
  w.__r = null;
  w.document.body.appendChild(s);
  // The regional LP needs bldLoadRegionalData() to resolve first, so poll.
  return new Promise(res => {
    let waited = 0;
    const tick = () => {
      if (w.__r) return res(JSON.parse(w.__r));
      if ((waited += 100) > 20000) return res({ error: 'probe timed out' });
      setTimeout(tick, 100);
    };
    tick();
  });
}

let pass = 0, fail = 0;
function check(label, ok, detail) {
  if (ok) { pass++; console.log(`  PASS  ${label}${detail ? '   ' + detail : ''}`); }
  else { fail++; console.log(`  FAIL  ${label}${detail ? '   ' + detail : ''}`); }
}

(async () => {
  const w = await boot(ROOT);

  console.log(`\nLP coverage (${ROOT})`);

  // Does the regional LP - the default selection - build at all in this harness?
  const avail = await runProbe(w, `
    const out = { national: typeof bldBuildLP === 'function',
                  regional: typeof bldBuildRegionalLP === 'function',
                  defaultRegional: (document.getElementById('bldRegional')||{}).value };
    return out;`);
  check('bldBuildLP is reachable', avail.national === true);
  check('bldBuildRegionalLP is reachable', avail.regional === true);
  check('Where To Build defaults to the regional LP', avail.defaultRegional === '1',
        `bldRegional = ${avail.defaultRegional}`);

  // Slider defaults vs FIXED: one source of truth. Any slider whose id is also
  // a FIXED key must read its default FROM FIXED (def:FIXED.x). A numeric
  // literal there is drift waiting to happen - it is exactly how lcoeBatt sat
  // at 1450 in FIXED while the slider (the LIVE value) said 1600.
  const drift = await runProbe(w, `
    const bad = [];
    for (const sl of SLIDERS){
      if (!(sl.id in FIXED) || sl.toggle) continue;
      if (sl.def !== FIXED[sl.id]) bad.push(sl.id + ': slider ' + sl.def + ' vs FIXED ' + FIXED[sl.id]);
    }
    return { bad };`);
  check('Slider defaults match FIXED for every shadowed key',
        drift.bad && drift.bad.length === 0,
        drift.bad && drift.bad.length ? drift.bad.join('; ') : '');

  for (const [fn, fields] of [['bldBuildLP', NATIONAL_FIELDS], ['bldBuildRegionalLP', REGIONAL_FIELDS]]) {
    console.log(`\n  ${fn} - every FIXED constant must reach the model`);
    const r = await runProbe(w, `
      const FIELDS = ${JSON.stringify(fields)};
      const mkOpts = () => ({ growth: 0.02, eaf: 0.64, rate: bldRates(), state: state });
      // The regional LP reads data loaded asynchronously; load it before building.
      if ('${fn}' === 'bldBuildRegionalLP') {
        const ok = await bldLoadRegionalData();
        if (!ok) return { buildError: 'bldLoadRegionalData() returned falsy' };
      }
      const build = () => ${fn}(mkOpts()).lp;
      let base;
      try { base = build(); } catch (e) { return { buildError: String(e) }; }
      const res = {}, src = {};
      for (const k of Object.keys(FIELDS)) {
        // S resolves as { ...FIXED, ...state }, so for a field the SLIDER carries,
        // state wins and perturbing FIXED proves nothing. Perturb whichever object
        // actually supplies the value.
        const holder = (typeof state !== 'undefined' && k in state) ? state : FIXED;
        src[k] = (holder === FIXED) ? 'FIXED' : 'state';
        const original = holder[k];
        holder[k] = FIELDS[k];
        let after;
        try { after = build(); } catch (e) { after = 'ERROR:' + e; }
        holder[k] = original;
        res[k] = (after !== base);
      }
      return { moved: res, src, baseLen: base.length };`);

    if (r.error || r.buildError) {
      check(`${fn} builds an LP`, false, r.error || r.buildError);
      continue;
    }
    check(`${fn} builds an LP`, true, `${r.baseLen} chars`);
    for (const k of Object.keys(fields)) {
      const where = (r.src && r.src[k]) || 'FIXED';
      check(`${where}.${k} reaches ${fn}`, r.moved[k] === true,
            r.moved[k] ? '' : `perturbing ${where} did not change the LP - the constant is not being read`);
    }
  }

  // ---- CONSTRAINT FAMILIES MUST BE PRESENT ---------------------------------
  // Added 17 Aug 2026 after a whole constraint family went missing unnoticed.
  // A revert of the headroom-transmission coupling replaced everything from a
  // comment down to the hb_ row, deleting the hw_ and hp_ headroom constraints
  // and leaving only the prose describing them. Wind and solar connection limits
  // were unenforced, and NOTHING caught it: the LP still solved, still returned
  // Optimal, and every other check passed. Only counting constraint families in
  // the emitted LP found it.
  //
  // A silently missing constraint is the worst failure mode this model has -
  // the answer looks entirely normal and is simply wrong.
  {
    const REQUIRED = {
      bal_:   'energy balance',
      cmax_:  'coal capacity',
      hw_:    'wind connection headroom',
      hp_:    'solar connection headroom',
      hb_:    'battery connection headroom',
      rate_:  'national build rate',
      dur_:   'storage duration',
      soc_:   'storage state of charge',
      txa_:   'corridor flow limit',
    };
    const lp = await runProbe(w, `return bldBuildRegionalLP({growth:0.0146,eaf:0.68,rate:bldRates(),state}).lp;`);
    if (typeof lp === 'string') {
      for (const [fam, desc] of Object.entries(REQUIRED)) {
        const n = (lp.match(new RegExp(' ' + fam, 'g')) || []).length;
        check(`regional LP emits ${fam} (${desc})`, n > 0,
              n > 0 ? `${n} rows` : 'NO ROWS - constraint family is missing entirely');
      }
    } else {
      check('regional LP available for constraint-family audit', false, String(lp).slice(0,120));
    }
  }

  // ---- CAPEX COVERAGE -------------------------------------------------------
  {
    const cov = await runProbe(w, `
      const WANT = ${JSON.stringify(BUILDABLE_CAPEX)};
      const base = simulate(state, PROFILES).newCapexR;
      const out = {};
      for (const [mwKey, acapKey] of Object.entries(WANT)) {
        if (!(acapKey in FIXED)) { out[mwKey] = 'NO SUCH CONSTANT: ' + acapKey; continue; }
        const r = simulate({ ...state, [mwKey]: 5000 }, PROFILES).newCapexR;
        out[mwKey] = (r !== base) ? 'ok' : 'newCapexR DID NOT MOVE';
      }
      return out;`);
    for (const k of Object.keys(BUILDABLE_CAPEX)) {
      const v = cov && cov[k];
      check(`${k} is costed in newCapexR`, v === 'ok', v === 'ok' ? '' : String(v));
    }
  }

  console.log(`\n${pass}/${pass + fail} checks passed`);
  process.exit(fail ? 1 : 0);
})();
