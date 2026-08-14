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

// carbonPrice is deliberately absent from this list: it is genuinely NOT a key
// of FIXED, so `S.carbonPrice != null ? S.carbonPrice : 550` is a real default
// rather than a duplicated constant. Whether carbonTaxRPerT should feed it is a
// separate question. Do not "fix" that guard on the strength of this file.
const NATIONAL_FIELDS = {
  windMW: 9999, pvUtilityMW: 9999, rooftopMW: 9999, cspMW: 9999, battPowerMW: 9999,
  costCoal: 1234, costCcgt: 4321, costDiesel: 7777, emisCoal: 2.5, emisCcgt: 1.5,
};
const REGIONAL_FIELDS = { costCoal: 1234, costDiesel: 7777, emisCoal: 2.5 };

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
      const res = {};
      for (const k of Object.keys(FIELDS)) {
        const original = FIXED[k];
        FIXED[k] = FIELDS[k];
        let after;
        try { after = build(); } catch (e) { after = 'ERROR:' + e; }
        FIXED[k] = original;
        res[k] = (after !== base);
      }
      return { moved: res, baseLen: base.length };`);

    if (r.error || r.buildError) {
      check(`${fn} builds an LP`, false, r.error || r.buildError);
      continue;
    }
    check(`${fn} builds an LP`, true, `${r.baseLen} chars`);
    for (const k of Object.keys(fields)) {
      check(`FIXED.${k} reaches ${fn}`, r.moved[k] === true,
            r.moved[k] ? '' : 'perturbing FIXED did not change the LP - the constant is not being read');
    }
  }

  console.log(`\n${pass}/${pass + fail} checks passed`);
  process.exit(fail ? 1 : 0);
})();
