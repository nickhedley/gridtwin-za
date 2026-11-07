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

  // ── THE BUILD LP CHOOSES LITHIUM'S DURATION ───────────────────────────────
  // Added 23 Sep 2026. Lithium is two build variables now: b_batt_<y> in megawatts for
  // inverters and balance of plant, eb_batt_<y> in megawatt-hours for cells. Three things must
  // hold, or the LP is either pricing duration wrongly or not free to choose it:
  //   the two coefficients recombine to the 4-hour annuity the constant is quoted at,
  //   the power share matches BATT_POWER_SHARE,
  //   and the duration rows exist, so the answer stays inside 1 to 12 hours.
  const dur = await runProbe(w, `
    const L = bldBuildLP({ growth: 0.02, eaf: 0.64, rate: bldRates(), state: state }).lp;
    const p = L.match(/([0-9.]+) b_batt_2030/), e = L.match(/([0-9.]+) eb_batt_2030/);
    return { power: p ? +p[1] : null, energy: e ? +e[1] : null,
             share: typeof BATT_POWER_SHARE === 'number' ? BATT_POWER_SHARE : null,
             rows: /battdur_min_2030:/.test(L) && /battdur_max_2030:/.test(L),
             credit: /ccpow_2030:/.test(L) && /ccnrg_2030:/.test(L),
             // Every store must be credited by the same rule, not lithium by its energy and the
             // others at fixed multiples of a lithium megawatt. Added 23 Sep 2026.
             creditAll: /ccvrfb_2030:/.test(L) && /ccironair_2030:/.test(L)
                        && !/BLD_DERATE/.test(L) && !/3\.60 b_ironair/.test(L) };`);
  {
    const four = (dur.power && dur.energy) ? dur.power + 4 * dur.energy : null;
    const share = four ? dur.power / four : null;
    check('the build LP splits lithium into power and energy and can choose duration',
          !!four && dur.rows && dur.credit && dur.creditAll
          && dur.share != null && Math.abs(share - dur.share) < 0.005,
          four
            ? `power R${Math.round(dur.power)}/MW-yr and energy R${Math.round(dur.energy)}/MWh-yr `
              + `recombine to R${Math.round(four)} at 4 hours, a power share of ${share.toFixed(3)} `
              + `against ${dur.share}; duration rows ${dur.rows ? 'present' : 'MISSING'}, `
              + `duration-limited capacity credit ${dur.credit ? 'present' : 'MISSING'}, `
              + `same rule for every store ${dur.creditAll ? 'yes' : 'NO - the long-duration tiers are still on fixed multiples'}`
            : `no energy variable in the LP: lithium is still one build decision at a fixed duration`);
  }
  // ── IMPORTS END YEAR (importsEndYear) ─────────────────────────────────────
  // Added 14 Oct 2026 (user, 13 Oct, TODO 14dv (6)): the no-imports-after-2030 sensitivity sets importsEndYear; the build LP
  // and the engine must drop imports in the same years and no others. On a 2026-2032 horizon the LP may change only in
  // 2031-2032, and simulate() must carry imports in 2030 and none in 2031.
  const imp = await runProbe(w, `
    const H0 = BLD_YEARS[BLD_YEARS.length - 1]; bldSetHorizon(2032);
    const lp = (ex) => bldBuildLP({ growth: 0.02, eaf: 0.64, rate: bldRates(), state: { ...state, ...ex } }).lp.split(String.fromCharCode(10));
    const a = lp({ importsEndYear: 0 }), b = lp({ importsEndYear: 2030 }); bldSetHorizon(H0);   // 0 explicit: 2030 is the default from build 2026-10-23a
    // Compared as multisets, not by position (PR B, build 2026-10-23a): the priced import variables add Bounds lines for the years
    // with imports, which shifts every later line, so a positional comparison reads unchanged 2026-2030 lines as changed. The
    // objective (one line) is compared term by term, each term dated by its own variable; every other line by the first year in it.
    const items = L => { const out = new Map(); for (const l of L){
        const parts = /^ {2}[0-9-]/.test(l) && / [a-z]+_20[0-9][0-9]/.test(l) && l.length > 100000 ? l.trim().split(/ (?=[+-] )/) : [l];
        for (const q of parts) out.set(q, (out.get(q) || 0) + 1); } return out; };
    const A = items(a), B = items(b); let early = 0, late = 0;
    for (const [q, n] of [...A].concat([...B])){ if ((A.get(q) || 0) === (B.get(q) || 0)) continue;
      const m = q.match(/_(20[0-9][0-9])/); if (m && +m[1] > 2030) late++; else early++; }
    const e = (y, end) => simulate({ ...state, scenarioYear: y, importsEndYear: end }, PROFILES).E.imports / 1e6;
    return { early, late, imp2030: e(2030, 2030), imp2031: e(2031, 2030), impOff: e(2031, 0) };`);
  check('importsEndYear drops imports after its year in the build LP and the engine, and nowhere else',
        imp && imp.early === 0 && imp.late > 0 && imp.imp2031 === 0 && imp.imp2030 > 0 && Math.abs(imp.imp2030 - imp.impOff) < 1e-9,
        imp ? `LP lines changed: ${imp.early} up to 2030, ${imp.late} after; engine imports ${imp.imp2030.toFixed(2)} TWh in 2030, `
              + `${imp.imp2031.toFixed(2)} in 2031 (${imp.impOff.toFixed(2)} with no end year)` : 'no result');
  // ── IMPORTS PRICED IN THE BUILD LP (c6 PR B, build 2026-10-23a) ───────────
  // The fixed infeed carries costImports in the objective: one variable a year, imp_<y>, fixed at importsMW x importsCF x the
  // year's weighted hours (a year's 8,760 plus any stress-day weight), its coefficient costImports discounted; none after
  // importsEndYear. Read back from the LP text.
  const ipr = await runProbe(w, `
    const H0 = BLD_YEARS[BLD_YEARS.length - 1]; bldSetHorizon(2032);
    const L = bldBuildLP({ growth: 0.02, eaf: 0.64, rate: bldRates(), state: { ...state, importsEndYear: 2030 } }).lp; bldSetHorizon(H0);
    const coef = y => { const m = L.match(new RegExp('([0-9.]+) imp_' + y + '(?![0-9])')); return m ? +m[1] : null; };
    const bnd = y => { const m = L.match(new RegExp(' ([0-9.]+) <= imp_' + y + ' <= ([0-9.]+)')); return m ? [+m[1], +m[2]] : null; };
    return { c26: coef(2026), c30: coef(2030), c31: coef(2031), b26: bnd(2026), b31: bnd(2031), price: FIXED.costImports, disc: BLD_DISC,
             flow: (state.importsMW ?? FIXED.importsMW) * (state.importsCF ?? FIXED.importsCF) };`);
  check('imports are priced in the build LP at costImports, fixed at the contracted infeed, and absent after importsEndYear',
        ipr && ipr.c26 !== null && Math.abs(ipr.c26 - ipr.price) < 0.01 && Math.abs(ipr.c30 - ipr.price / Math.pow(1 + ipr.disc, 4)) < 0.01
          && ipr.c31 === null && ipr.b31 === null && ipr.b26 && ipr.b26[0] === ipr.b26[1] && ipr.b26[0] / ipr.flow >= 8760 && ipr.b26[0] / ipr.flow <= 8784 + 24 * 15,
        ipr ? `2026: R${ipr.c26}/MWh on ${ipr.b26 && ipr.b26[0]} MWh, ${ipr.b26 && (ipr.b26[0] / ipr.flow).toFixed(1)} h of the ${ipr.flow.toFixed(0)} MW flow `
              + `(price R${ipr.price}); 2030: ${ipr.c30}; 2031: ${ipr.c31}` : 'no result');
  // ── CARBON PATHS (carbonTaxAt: carbonAllowancePath, carbonTaxFull) ───────
  // Added 14 Oct 2026 (user). Central, 'kept2030': the allowance kept at its 2026 share to 2030 on the rates in law (R308/t
  // 2026, 347, 385, 424, R462/t 2030) in 2026 rands at the 3% inflation target, held after 2030. 'treasury' (s_carbontreasury,
  // 27 Oct 2026, message 423): net share in equal steps from the 2026 share to 1 in 2031, then a straight line from the 2030
  // rate in law to US$120/t nominal (deflated at 2% a year to 2026 dollars, at R16.50) in 2050; 'law2031' holds the 2030 rate in law after 2030. 'cut2027' must
  // reproduce c4's path exactly. carbonTaxFull: the rates in law, no allowances, in 2026 rands. LP-KEY TEST: between any two
  // paths only the carbon terms may change, the objective coefficients of fossil output (gc_, gg_, gd_, go_) and no row.
  const ctf = await runProbe(w, `
    const H0 = BLD_YEARS[BLD_YEARS.length - 1]; bldSetHorizon(2031);
    const lp = (ex) => bldBuildLP({ growth: 0.02, eaf: 0.64, rate: bldRates(), state: { ...state, ...ex } }).lp;
    const terms = L => { const o = L.split(String.fromCharCode(10)), st = o.indexOf('Subject To'), m = new Map();
      for (const ln of o.slice(0, st)) for (const t of ln.split(' + ')) { const q = t.trim().match(/^(-?[0-9.e+-]+) ([A-Za-z0-9_]+)$/); if (q) m.set(q[2], +q[1]); }
      return { m, rows: o.slice(st).join(String.fromCharCode(10)) }; };
    const cmp = (A, B) => { const a = terms(A), b = terms(B); let nonCarbon = 0, carbon = 0, y2026 = 0, keys = a.m.size === b.m.size;
      for (const [k, v] of a.m){ if (!b.m.has(k)) { keys = false; continue; } if (b.m.get(k) !== v){
        if (/^(gc|gg|gd|go)_/.test(k)) { carbon++; if (/_2026_/.test(k)) y2026++; } else nonCarbon++; } }
      return { keys, carbon, nonCarbon, y2026, rowsSame: a.rows === b.rows }; };
    const kept = lp({ carbonAllowancePath: 'kept2030' }), cut = lp({ carbonAllowancePath: 'cut2027' }), full = lp({ carbonTaxFull: 1 }), tre = lp({ carbonAllowancePath: 'treasury' }); bldSetHorizon(H0);
    const S = { ...FIXED, ...state }, at = (y, ex) => carbonTaxAt(y, { ...S, ...ex });
    const old = y => y <= 2026 ? S.carbonTaxRPerT : (y >= 2030 ? 462 : 308 * Math.pow(462 / 308, (y - 2026) / 4)) * (1 - Math.max(0.75, 0.85 - 0.025 * Math.min(4, y - 2026)));
    const Y = [2026, 2027, 2028, 2029, 2030, 2031, 2040];
    return { law: [2026, 2027, 2028, 2029, 2030].map(carbonTaxHeadline), def: S.carbonAllowancePath,
             kept: Y.map(y => +at(y, { carbonAllowancePath: 'kept2030' }).toFixed(2)), full: Y.map(y => +at(y, { carbonTaxFull: 1 }).toFixed(2)),
             tre: Y.map(y => +at(y, { carbonAllowancePath: 'treasury' }).toFixed(2)), l31: Y.map(y => +at(y, { carbonAllowancePath: 'law2031' }).toFixed(2)), kt: cmp(kept, tre),
             cutErr: Math.max(...Y.map(y => Math.abs(at(y, { carbonAllowancePath: 'cut2027' }) - old(y)))),
             kc: cmp(kept, cut), kf: cmp(kept, full) };`);
  const wantK = [46, 347, 385, 424, 462, 462, 462].map((v, i) => +(i ? v / Math.pow(1.03, Math.min(4, [0,1,2,3,4,5,14][i])) * 46 / 308 : 46).toFixed(2));
  const wantF = [308, 347, 385, 424, 462, 462, 462].map((v, i) => +(v / Math.pow(1.03, Math.min(4, [0,1,2,3,4,5,14][i]))).toFixed(2));
  // The treasury path, written out independently of carbonTaxAt: real headline x net share to 2030, then the line to
  // 120 / 1.02^24 x 16.50.
  const realH = [308, 347, 385, 424, 462].map((v, i) => v / Math.pow(1.03, i)), s0 = 46 / 308;
  const wantT = [2026, 2027, 2028, 2029, 2030, 2031, 2040].map(y => +(y <= 2030 ? realH[y - 2026] * (s0 + (1 - s0) * (y - 2026) / 5)
                  : realH[4] + (120 / Math.pow(1.02, 24) * 16.5 - realH[4]) * (y - 2030) / 20).toFixed(2));
  const wantL = wantT.map((v, i) => i <= 4 ? v : +realH[4].toFixed(2));
  const lpk = c => c && c.keys && c.rowsSame && c.nonCarbon === 0 && c.carbon > 0;
  check('carbon paths: kept2030 central, treasury, law2031, cut2027 as c4, full rate; between paths only carbon terms change in the LP',
        ctf && !ctf.error && ctf.law.join() === '308,347,385,424,462' && ctf.def === 'kept2030'
          && ctf.kept.join() === wantK.join() && ctf.full.join() === wantF.join() && ctf.cutErr < 1e-9
          && ctf.tre.join() === wantT.join() && ctf.l31.join() === wantL.join() && lpk(ctf.kt) && ctf.kt.y2026 === 0
          && lpk(ctf.kc) && ctf.kc.y2026 === 0 && lpk(ctf.kf),
        ctf && !ctf.error ? `default ${ctf.def}; treasury R/t 2026-31, 2040: ${ctf.tre.join(', ')}; law2031: ${ctf.l31.join(', ')}; kept2030: ${ctf.kept.join(', ')}; full: ${ctf.full.join(', ')}; `
          + `cut2027 against c4's formula, worst gap ${ctf.cutErr.toExponential(1)}; LP kept vs cut2027: ${ctf.kc.carbon} carbon terms, `
          + `${ctf.kc.nonCarbon} others, ${ctf.kc.y2026} in 2026, rows ${ctf.kc.rowsSame ? 'same' : 'DIFFER'}; kept vs full: ${ctf.kf.carbon} carbon, `
          + `${ctf.kf.nonCarbon} others, rows ${ctf.kf.rowsSame ? 'same' : 'DIFFER'}` : JSON.stringify(ctf));

  // COAL EMISSIONS COMPLIANCE (COMPLY_MES, 15 Oct 2026, user messages 119 and 122 (4)). LP-KEY TEST: bldComply 'none' leaves the LP
  // text as it was; 'compromise' and 'full' add only the in-scope early-retirement credit (rca_ terms in the objective, one rcain_ row
  // and one bound per year from 2031). The capital allocated to the six stations sums to Eskom's figure in 2026 rands.
  const cmpl = await runProbe(w, `
    const H0 = BLD_YEARS[BLD_YEARS.length - 1]; bldSetHorizon(2032);
    const lp = (ex) => bldBuildLP({ growth: 0.02, eaf: 0.64, rate: bldRates(), state: { ...state, ...ex } }).lp;
    const base = lp({}), none = lp({ bldComply: 'none' }), full = lp({ bldComply: 'full' }), comp = lp({ bldComply: 'compromise' }); bldSetHorizon(H0);
    const NL = String.fromCharCode(10);
    const strip = L => L.replace(/ - [0-9.]+ rca_[0-9]+/g, '').split(NL).filter(l => !/^ rcain_/.test(l) && !/^ 0 <= rca_/.test(l)).join(NL);
    const S = { ...FIXED, ...state }, F = { ...S, bldComply: 'full' }, C = { ...S, bldComply: 'compromise' };
    return { def: FIXED.bldComply, noneSame: none === base, fullOnly: strip(full) === base, compOnly: strip(comp) === base,
             nFull: (full.match(/rca_[0-9]+/g) || []).length, mwA: complyYear(F, 2031).mwA, rateFull: complyYear(F, 2031).rateR,
             rateComp: complyYear(C, 2031).rateR, before: complyYear(F, 2030).chargeR,
             capexFull: complyStations(F).reduce((a, x) => a + x.capexR, 0), want: 257e9 * COMPLY_MES.rand, n: complyStations(F).length };`);
  check('coal compliance: none leaves the LP unchanged; compromise and full add only the in-scope retirement credit; capital sums to Eskom\'s',
        cmpl && !cmpl.error && cmpl.def === 'none' && cmpl.noneSame && cmpl.fullOnly && cmpl.compOnly && cmpl.nFull === 6 && cmpl.n === 6
          && cmpl.mwA > 0 && cmpl.rateFull > cmpl.rateComp && cmpl.rateComp > 0 && cmpl.before === 0
          && Math.abs(cmpl.capexFull / cmpl.want - 1) < 1e-9,
        cmpl && !cmpl.error ? `default ${cmpl.def}; none ${cmpl.noneSame ? 'identical' : 'DIFFERS'}; full and compromise add only rca terms: `
          + `${cmpl.fullOnly}, ${cmpl.compOnly} (${cmpl.nFull} rca references to 2032); in scope ${Math.round(cmpl.mwA)} MW in 2031; `
          + `charge per kW-yr in 2031 full R${(cmpl.rateFull / 1000).toFixed(0)}, compromise R${(cmpl.rateComp / 1000).toFixed(0)}; capital R${(cmpl.capexFull / 1e9).toFixed(1)}bn `
          + `(R257bn in 2026 rands)` : JSON.stringify(cmpl));
  // ── STRESS WINDOWS CARRY THEIR OWN AVAILABLE COAL (availFrac) ───────────
  // Added 14 Oct 2026. COAL_AVAIL used to re-derive a window's available coal on the 2026 state; with the outage draw over
  // the units still standing (14dr) a later year draws differently, and a run stopped on available below recorded. Each
  // shedding run now records availFrac beside coalFrac from the same engine run: at least coalFrac in every hour, at most 1,
  // and above it in some hours (coal available but not switched on).
  const avf = await runProbe(w, `
    const st = { ...FIXED, ...state, coalEAFPct: 45, demandGrowthPct: 25 };
    const t = bldAdequacyTest(st, 1), rows = t.rows.filter(r => r.coalFrac);
    let below = 0, above1 = 0, higher = 0, n = 0;
    for (const r of rows){ if (!r.availFrac || r.availFrac.length !== r.coalFrac.length) return { error: 'row without availFrac' };
      for (let i = 0; i < r.coalFrac.length; i++){ n++; const a = r.availFrac[i], c = r.coalFrac[i];
        if (a < c - 1e-6) below++; if (a > 1 + 1e-6) above1++; if (a > c + 1e-6) higher++; } }
    return { rows: rows.length, n, below, above1, higher };`);
  check('stress windows carry their own available coal, never below what was committed',
        avf && !avf.error && avf.rows > 0 && avf.below === 0 && avf.above1 === 0 && avf.higher > 0,
        avf && !avf.error ? `${avf.rows} shedding runs, ${avf.n} hours: available below committed in ${avf.below}, above 1 in ${avf.above1}, `
          + `above committed in ${avf.higher}` : JSON.stringify(avf));
  // ── THE LOOP'S STALL STOP (opts.stallFrac, STALL) ─────────────────────────
  // Added 14 Oct 2026 (user, c5's stopping rule): from pass stallFrom on, the loop stops when a pass cuts the worst
  // year's shed above target by less than stallFrac of the pass before, and says so in the verdict. The loop is run
  // with the solve and the engine test replaced by a scripted excess per pass, so the rule itself is what is tested.
  const stall = await runProbe(w, `
    const keep = { b: window.bldBuildLP, s: window.bldSolveLP, a: window.bldAdequacyTest, f: window.bldStateForYear, l: window.loadWeatherYears };
    const last = BLD_YEARS[BLD_YEARS.length - 1], D = 2 / (BLD_STRESS_STANDARD * 0.5);   // target 2 GWh in the last year
    const run = async (ex, o) => { let n = 0;
      window.bldBuildLP = () => { n++; return { lp: '' }; };
      window.bldSolveLP = async () => ({ Columns: {}, Rows: [] });
      window.bldStateForYear = (res, y) => ({ y });
      window.bldAdequacyTest = (st) => { const g = st.y === last ? 2 + ex[Math.min(n, ex.length) - 1] : 0;
        return g > 0 ? { rows: [{ gwh: g, year: 2016, seed: 1, start: 0 }], worst: { demandGWh: D, year: 2016, gwh: g } } : { rows: [], worst: null }; };
      window.loadWeatherYears = async () => {};
      const out = await bldStressLoopPerYear({ targetFrac: 0.5, maxPasses: 6, ...o });
      return { verdict: out.verdict, passes: out.log.length }; };
    try {
      return {
        stops:   await run([10, 8, 6, 5.5, 5, 4], { stallFrac: 0.1, stallFrom: 4 }),        // pass 4 cuts 8%
        early:   await run([10, 9.5, 9.4, 5, 4.9, 4], { stallFrac: 0.1, stallFrom: 4 }),     // small cuts at 2-3 ignored; pass 5 cuts 2%
        cap:     await run([10, 8, 6, 5, 4, 3], { stallFrac: 0.1, stallFrom: 4 }),           // every cut 10% or more
        adequate: await run([10, 8, -1], { stallFrac: 0.1, stallFrom: 4 }),                  // pass 3 within target
        unset:   await run([10, 8, 6, 5.5, 5.4, 5.3], {}) };                                 // no stall setting: as before
    } finally { window.bldBuildLP = keep.b; window.bldSolveLP = keep.s; window.bldAdequacyTest = keep.a;
                window.bldStateForYear = keep.f; window.loadWeatherYears = keep.l; bldStressLog = []; bldStressPeriods = []; }`);
  const sv = (r, v, p) => r && r.verdict === v && r.passes === p;
  check('the loop stops on a stalled pass from pass 4, and says why',
        stall && !stall.error && sv(stall.stops, 'stall stop', 4) && sv(stall.early, 'stall stop', 5) && sv(stall.cap, 'pass limit reached', 6)
          && sv(stall.adequate, 'adequate', 3) && sv(stall.unset, 'pass limit reached', 6),
        stall && !stall.error ? Object.entries(stall).map(([k, r]) => `${k} ${r.verdict} after ${r.passes}`).join('; ') : JSON.stringify(stall));
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

  // Clustered days' extremes (design note version 2, 3.1; messages 678 (e), 679 (e), 681 (a)): FIXED.bldRepExtremeDays is the list
  // harness/pathway/repdays/extremes.py computed and recorded, with its reference series, build and source runs, in extremes.json.
  {
    const fs2 = require('fs'), path2 = require('path'), X = JSON.parse(fs2.readFileSync(path2.join(__dirname, 'pathway/repdays/extremes.json'), 'utf8'));
    const got = JSON.parse(w.eval('JSON.stringify({ days: FIXED.bldRepExtremeDays, ref: FIXED.bldRepRefYear })'));
    check('bldRepExtremeDays equals extremes.json, the script\'s union', JSON.stringify(got.days) === JSON.stringify(X.days), JSON.stringify(got.days) + ' against ' + JSON.stringify(X.days));
    check('extremes.json was computed on bldRepRefYear\'s series', String(X.ref) === String(got.ref), X.ref + ' against ' + got.ref);
  }

  // Enrolment round-off (message 698 (a)): the virtual power plant's and the geyser control's enrolment (vppp_<y>, gy_<y>) is read from a
  // solution through bldEnrolPrimal, which reads a value below 0 by no more than BLD_ENROL_TOL_MW as 0 (test 15's step 2028: vppp_2028
  // -9e-11 MW stopped the engine) and stops on a larger negative. Called from here the way pathway_perfail.js calls it (dom.window), and
  // through bldStateForYear, which the adequacy loop and the engine check read.
  {
    const call = (cols, n) => { try { return w.bldEnrolPrimal(cols, n); } catch (e) { return 'stopped'; } };
    const unit = [call({ vppp_2028: { Primal: -9e-11 } }, 'vppp_2028'), call({ gy_2030: { Primal: 412.5 } }, 'gy_2030'),
      call({ vppp_2031: { Primal: -1e-3 } }, 'vppp_2031'), call({}, 'gy_2032')];
    const wired = JSON.parse(w.eval(`(() => { const st = { ...state, vppBuildOn: 1, gyBuildOn: 1 }, out = {};
      try { const s = bldStateForYear({ Columns: { vppp_2030: { Primal: -9e-11 }, gy_2030: { Primal: -2e-12 } } }, 2030, { state: st });
        out.small = [s.vppEnrolGWh, s.gyEnrolMW]; } catch (e) { out.small = 'stopped: ' + e.message; }
      for (const n of ['vppp_2030', 'gy_2030']) try { bldStateForYear({ Columns: { [n]: { Primal: -0.01 } } }, 2030, { state: st }); out[n] = 'not stopped'; }
        catch (e) { out[n] = /below 0 by more than round-off/.test(e.message) ? 'stopped' : 'stopped elsewhere: ' + e.message; }
      return JSON.stringify(out); })()`));
    check('enrolment round-off below 0 is read as 0 and a larger negative stops, in the page and through bldStateForYear',
      JSON.stringify(unit) === JSON.stringify([0, 412.5, 'stopped', 0]) && JSON.stringify(wired.small) === '[0,0]'
        && wired.vppp_2030 === 'stopped' && wired.gy_2030 === 'stopped',
      JSON.stringify({ unit, wired }));
  }

  // The CO2 cap row counts coal with the part-load factor (message 726 (d); the review of 6 Nov 2026, finding 1): the objective prices coal's
  // carbon on output x bldCoalPartLoadAt and the engine counts CO2 on fuel-equivalent MWh, so the cap must count the same. In every hour of
  // the cap row, coal's coefficient over combined cycle's (same weight) is emisCoal x the factor over emisCcgt, to the row's 6 decimals.
  // The row as it was (no factor) is put back by re-making bldBuildLP from its source with that one expression changed; it must fail.
  {
    const capRun = (fault) => JSON.parse(w.eval(`(() => {
      const _b = bldBuildLP, from = 'EMIS_COAL   * bldCoalPartLoadAt(S, y) * r.weight', S = { ...FIXED, ...state, carbonCapEnabled: 1 };
      try {
        if (${JSON.stringify(fault)}){ const src = _b.toString(); if (src.split(from).length !== 2) return JSON.stringify({ error: 'expression not found once' });
          bldBuildLP = (0, eval)('(' + src.replace(from, 'EMIS_COAL * r.weight') + ')'); }
        const L = bldBuildLP({ growth: 0.02, eaf: 0.64, rate: bldRates(), state: S }).lp.split(String.fromCharCode(10)).filter(l => /^ co2cap(_\\d+)?:/.test(l));
        const out = { rows: L.length, hours: 0, worst: 0, factor: null };
        for (const l of L){
          const y = +(l.match(/ gc_(\\d{4})_/) || [])[1], want = S.emisCoal * bldCoalPartLoadAt(S, y) / S.emisCcgt; out.factor = bldCoalPartLoadAt(S, y);
          const c = {}; for (const m of l.matchAll(/([0-9.]+) (g[cg])_(\\d+_\\d+_\\d+)/g)) (c[m[3]] = c[m[3]] || {})[m[2]] = +m[1];
          for (const t of Object.values(c)) if (t.gc > 0 && t.gg > 0){ out.hours++;
            const tol = 5e-7 / t.gg + 5e-7 * t.gc / (t.gg * t.gg);   // both written to 6 decimals
            out.worst = Math.max(out.worst, Math.abs(t.gc / t.gg - want) / Math.max(tol, 1e-12)); }
        }
        return JSON.stringify(out);
      } catch (e) { return JSON.stringify({ error: String(e.message || e) }); } finally { bldBuildLP = _b; } })()`));
    const ok = capRun(false), bad = capRun(true);
    check('the CO2 cap row counts coal with the part-load factor, as the objective and the engine (review of 6 Nov, finding 1)',
      !ok.error && ok.rows > 0 && ok.hours > 0 && ok.factor > 1 && ok.worst <= 1,
      ok.error || `${ok.rows} cap row(s), ${ok.hours} hours, factor ${ok.factor}, largest gap ${ok.worst.toFixed(3)} of the rounding allowance`);
    check('injected fault caught: the cap row without the part-load factor', !bad.error && bad.hours > 0 && bad.worst > 1,
      bad.error || `largest gap ${bad.worst.toFixed(1)} times the rounding allowance`);
  }

  // ── COAL-SITE SOLAR AND THE SPARE-CAPACITY POOL (user, 7 Nov 2026, messages 763, 774, 777; docs/coal-site-solar.md) ──
  // A second utility-solar class, b_pvc_<y>, on Mpumalanga's own PVGIS series, free of the grid cost, capped at the coal MW retired in
  // Mpumalanga by each year (shared with storage and gas on freed connections, early retirement at Mpumalanga's share); and a national
  // spare-capacity pool, hp_<t>_<y>, the first H MW of new wind and solar free of the integration charge, on the Cape allowance's mechanism.
  // Each check is proved on an injected fault: bldBuildLP or simulate re-made from its source with one expression changed, restored after.
  {
    const PVC_FAULTS = {
      none: null,
      nationalProfile: ["(spC*AVP(h)).toFixed(4)", "(spN*AVP(h)).toFixed(4)"],                                   // the class on the national twin in the row
      gridCost:        ["cost += capCharge('pv', y, yy) / Math.pow", "cost += (capCharge('pv', y, yy) + GA['pv']) / Math.pow"],   // the class charged solar's grid cost
      noCap:           ["L.push(' pvccap_' + y + ': '", "if (false) L.push(' pvccap_' + y + ': '"],               // the cap row dropped
    };
    const ENG_FAULTS = { none: null, nationalSeries: ["(C > 0 ? C * _pvcS[h] : 0)", "(C > 0 ? C * (T ? T[h] : solar[h]) : 0)"] };   // the engine runs the class on the national twin
    const pvcRun = (fault) => JSON.parse(w.eval(`(() => {
      const _b = bldBuildLP, F = ${JSON.stringify(PVC_FAULTS)}[${JSON.stringify(fault)}], _trk = state.bldPvTracking;
      try {
        if (F){ const src = _b.toString(); if (src.split(F[0]).length !== 2) return JSON.stringify({ error: 'expression not found once: ' + F[0] });
          bldBuildLP = (0, eval)('(' + src.replace(F[0], F[1]) + ')'); }
        state.bldPvTracking = 1;   // the class runs on its tracking twin, as the pathway does; bldBuildLP wants the page state to agree
        const S = { ...FIXED, ...state, bldGridCost: 1, bldCapeWindMW: 1000, bldPvCoalSite: 1 }, S0 = { ...S, bldPvCoalSite: 0 };
        const off = bldBuildLP({ growth: 0.02, eaf: 0.64, rate: bldRates(), state: S0 }).lp;
        const L = bldBuildLP({ growth: 0.02, eaf: 0.64, rate: bldRates(), state: S }).lp, lines = L.split(String.fromCharCode(10));
        const o = { offHasClass: /b_pvc_|pvccap_|hp_(wind|pv)_/.test(off), cols: [], rpPv: (L.match(/\\brp_pv_\\d+/g) || []).length, cap: {}, pace: {}, obj: {} };
        for (const y of BLD_YEARS) o.cols.push(new RegExp('\\\\bb_pvc_' + y + '\\\\b').test(L));
        // The cap rows: right-hand side the coal MW retired in Mpumalanga, early retirement's coefficient its share of the coal standing.
        const sh = y => bldCoalRegionShare(y, PVC_REGION), ret = y => bldCoalRetiredMW(y, PVC_REGION);
        for (const y of BLD_YEARS){ const l = lines.find(x => x.startsWith(' pvccap_' + y + ':'));
          o.cap[y] = l ? { rhs: +l.split('<=')[1], want: ret(y), rc: +((l.match(/- ([0-9.]+) rc_/) || [])[1] || 0), wantRc: sh(y), rp: (l.match(/rp_[a-z]+_/g) || []).length } : null;
          const pl = lines.find(x => x.startsWith(' pvcpace_' + y + ':')); o.pace[y] = pl ? +pl.split('<=')[1] : null; }
        o.rate = bldRates().pv; o.pvG = S.bldPvRateGrowthPct;
        // The objective: the class's coefficient is solar's less the discounted grid cost; the discount sum D is read from the Cape credit
        // (cw_<y> earns the integration charge x D), so no year list is typed here.
        const obj = lines[2], num = re => { const m = obj.match(re); return m ? +m[1] : null; };
        const y0 = BLD_YEARS[0], tx = (k => k === 1 ? S.txRPerKWyr : k * S.txRPerKWyr)(+(S.bldGridIntVreShare ?? FIXED.bldGridIntVreShare));
        const cw = num(new RegExp('- ([0-9.]+) cw_' + y0 + '\\\\b')), D = cw / (tx * 1000);
        o.obj = { pv: num(new RegExp('([0-9.]+) b_pv_' + y0 + '\\\\b')), pvc: num(new RegExp('([0-9.]+) b_pvc_' + y0 + '\\\\b')), ga: bldGridAnn('pv', S), D };
        // The profile reaches the rows: on calendar days the class's coefficient against solar's by month and hour (Mpumalanga is above the
        // national twin at 07:00 in winter and below it at 15:00 in summer; docs/coal-site-solar.md section 3).
        const byM = {}; for (const l of lines){ const m = l.match(/^ bal_(\\d+)_(\\d+)_(\\d+):/); if (!m || +m[1] !== y0 || +m[2] >= 365) continue;
          const d = +m[2], h = +m[3], mo = hourMonth(d * 24), cp = +((l.match(/([0-9.]+) b_pv_\\d+\\b/) || [])[1] || 0), cc = +((l.match(/([0-9.]+) b_pvc_\\d+\\b/) || [])[1] || 0);
          const k = (mo >= 4 && mo <= 7 && h === 7) ? 'winter07' : (mo >= 10 || mo <= 1) && h === 15 ? 'summer15' : null;
          if (k){ byM[k] = byM[k] || { n: 0, up: 0, pv: 0, pvc: 0 }; byM[k].n++; if (cc > cp) byM[k].up++; byM[k].pv += cp; byM[k].pvc += cc; } }
        o.shape = byM; o.days = bldRepDays(12).length;
        return JSON.stringify(o);
      } catch (e) { return JSON.stringify({ error: String(e.message || e) }); } finally { bldBuildLP = _b; state.bldPvTracking = _trk; } })()`));
    const ok = pvcRun('none');
    check('coal-site solar: with the switch off the LP has no class, cap or pool column (the text as before)', !ok.error && ok.offHasClass === false, ok.error || '');
    check('coal-site solar: b_pvc_<y> in every year, no rp_pv_ column, a cap row and a pace row for every year',
      !ok.error && ok.cols.every(Boolean) && ok.rpPv === 0 && Object.values(ok.cap).every(c => c) && Object.values(ok.pace).every(p => p !== null),
      ok.error || `cols ${JSON.stringify(ok.cols)}, rp_pv ${ok.rpPv}, cap rows ${Object.values(ok.cap).filter(Boolean).length}, pace rows ${Object.values(ok.pace).filter(p => p !== null).length}`);
    const capOk = !ok.error && Object.values(ok.cap).every(c => c && Math.abs(c.rhs - c.want) <= 0.06 && Math.abs(c.rc - c.wantRc) <= 6e-5 && c.rp > 0);
    check('coal-site solar: each cap row holds the coal MW retired in Mpumalanga by that year (bldCoalRetiredMW), with early retirement at Mpumalanga\'s share and storage and gas sharing the row (D1 (ii), D4)',
      capOk, ok.error || JSON.stringify(Object.fromEntries(Object.entries(ok.cap || {}).map(([y, c]) => [y, c && [c.rhs, +c.want.toFixed(1), c.rc, +c.wantRc.toFixed(4), c.rp]]))));
    const paceOk = !ok.error && Object.entries(ok.pace).every(([y, p]) => Math.abs(p - ok.rate * Math.pow(1 + Math.max(0, ok.pvG) / 100, +y - 2026)) <= 0.06);
    check('coal-site solar: the class draws on utility solar\'s build pace (pvcpace_<y>: b_pv + b_pvc at or below the year\'s solar rate)', paceOk, ok.error || JSON.stringify(ok.pace));
    const objOk = !ok.error && ok.obj.pv !== null && ok.obj.pvc !== null && ok.obj.D > 0 && Math.abs((ok.obj.pv - ok.obj.pvc) - ok.obj.ga * ok.obj.D * 1000) <= 1;
    check('coal-site solar: the class\'s objective coefficient is solar\'s less the discounted grid cost (GA[pv] x D x 1,000, D read from the Cape credit)',
      objOk, ok.error || `pv ${ok.obj.pv}, pvc ${ok.obj.pvc}, GA ${ok.obj.ga && ok.obj.ga.toFixed(2)}, D ${ok.obj.D && ok.obj.D.toFixed(4)}, gap ${ok.obj.pv !== null ? ((ok.obj.pv - ok.obj.pvc) - ok.obj.ga * ok.obj.D * 1000).toFixed(3) : '-'}`);
    // Summed over the representative days (a single day's weather can go either way): Mpumalanga's twin is above the national twin at
    // 07:00 over the winter days and below it at 15:00 over the summer days (docs/coal-site-solar.md section 3).
    const shapeOf = r => r.shape && r.shape.winter07 && r.shape.summer15 && r.shape.winter07.n > 0 && r.shape.summer15.n > 0 && r.shape.winter07.pvc > r.shape.winter07.pv && r.shape.summer15.pvc < r.shape.summer15.pv;
    check('coal-site solar: the class\'s balance coefficients are Mpumalanga\'s (summed over the winter days, above the national twin at 07:00; over the summer days, below it at 15:00)',
      !ok.error && shapeOf(ok), ok.error || JSON.stringify(ok.shape));
    for (const [f, label, test] of [
      ['nationalProfile', 'the class on the national twin in the balance rows', r => !r.error && !shapeOf(r)],
      ['gridCost', 'the class charged solar\'s grid cost', r => !r.error && !(Math.abs((r.obj.pv - r.obj.pvc) - r.obj.ga * r.obj.D * 1000) <= 1)],
      ['noCap', 'the cap row dropped', r => !r.error && !Object.values(r.cap).every(c => c)],
    ]){ const r = pvcRun(f); check('injected fault caught: ' + label, test(r), r.error || ''); }

    // The engine: the class's series on the profile is Mpumalanga's own tracking twin, hour for hour, and it pays no grid cost.
    const engRun = (fault) => JSON.parse(w.eval(`(() => {
      const _s = simulate, F = ${JSON.stringify(ENG_FAULTS)}[${JSON.stringify(fault)}];
      try {
        if (F){ const src = _s.toString(); if (src.split(F[0]).length !== 2) return JSON.stringify({ error: 'expression not found once: ' + F[0] });
          simulate = (0, eval)('(' + src.replace(F[0], F[1]) + ')'); }
        const base = { ...FIXED, ...state, bldPvTracking: 1, bldGridCost: 1, bldPvCoalSite: 1, scenarioYear: 2030, demandGrowthPct: 0 };
        const pr = {}; simulate({ ...base, pvUtilityMW: 0, newPvMW: 0, newPvCoalMW: 1000, __seriesProbe: pr }, PROFILES);
        const want = pvCoalSeriesOf(PROFILES.solar, true); let worst = 0; for (let h = 0; h < want.length; h++) worst = Math.max(worst, Math.abs(pr.solarU[h] - want[h]));
        let sw = 0, sn = 0; const nat = solarTrkOf(PROFILES.solar); for (let h = 0; h < want.length; h++){ sw += want[h]; sn += nat[h]; }
        const u1 = { ...base, newPvMW: 1000, newPvCoalMW: 0 }, u2 = { ...base, newPvMW: 0, newPvCoalMW: 1000 };
        return JSON.stringify({ worst, meanRatio: sw / sn, chargePv: gridChargeR(u1, u1), chargePvc: gridChargeR(u2, u2), ga: bldGridAnn('pv', u1), probeHasC: !!pr.solarC });
      } catch (e) { return JSON.stringify({ error: String(e.message || e) }); } finally { simulate = _s; } })()`));
    const e0 = engRun('none');
    check('coal-site solar: the engine runs the class on Mpumalanga\'s own tracking twin, hour for hour (series probe against pvCoalSeriesOf), and charges it no grid cost',
      !e0.error && e0.worst < 1e-12 && e0.probeHasC && e0.chargePvc === 0 && Math.abs(e0.chargePv - e0.ga * 1000 * 1000) < 1,
      e0.error || `largest gap ${e0.worst}, class over national twin ${e0.meanRatio && e0.meanRatio.toFixed(3)}, charge pv R${e0.chargePv && e0.chargePv.toExponential(3)} pvc R${e0.chargePvc}`);
    const e1 = engRun('nationalSeries');
    check('injected fault caught: the engine running the class on the national twin', !e1.error && !(e1.worst < 1e-12), e1.error || `largest gap ${e1.worst}`);

    // The spare-capacity pool (message 774): hp_ columns for new wind and solar in every year, the pool row at H, wind's row shared with the
    // Cape allowance, the credit the integration charge (the same as cw_'s), no freed-coal column while it is on.
    const HP_FAULTS = {
      none: null,
      gridCost: ["credit += VRE_TX / Math.pow(1+BLD_DISC, yy-2026);\n    obj.push('-' + (credit * 1000).toFixed(3) + ' hp_'", "credit += GA[t] / Math.pow(1+BLD_DISC, yy-2026);\n    obj.push('-' + (credit * 1000).toFixed(3) + ' hp_'"],
      noPool:   ["if (HP_T.length) L.push(' hppool: '", "if (false) L.push(' hppool: '"],
      poolLeftOn: ["const RP_T = (GRID_ON && !SPARE_ON) ?", "const RP_T = GRID_ON ?"],
    };
    const hpRun = (fault) => JSON.parse(w.eval(`(() => {
      const _b = bldBuildLP, F = ${JSON.stringify(HP_FAULTS)}[${JSON.stringify(fault)}];
      try {
        if (F){ const src = _b.toString(); if (src.split(F[0]).length !== 2) return JSON.stringify({ error: 'expression not found once: ' + F[0].slice(0, 40) });
          bldBuildLP = (0, eval)('(' + src.replace(F[0], F[1]) + ')'); }
        const S = { ...FIXED, ...state, bldGridCost: 1, bldCapeWindMW: 1000, bldSparePoolMW: 5000 };
        const L = bldBuildLP({ growth: 0.02, eaf: 0.64, rate: bldRates(), state: S }).lp, lines = L.split(String.fromCharCode(10)), y0 = BLD_YEARS[0];
        const pool = lines.find(x => x.startsWith(' hppool:')), obj = lines[2], num = re => { const m = obj.match(re); return m ? +m[1] : null; };
        const o = { cols: BLD_YEARS.every(y => new RegExp('\\\\bhp_wind_' + y + '\\\\b').test(L) && new RegExp('\\\\bhp_pv_' + y + '\\\\b').test(L)),
          poolRhs: pool ? +pool.split('<=')[1] : null, poolTerms: pool ? (pool.match(/hp_(wind|pv)_\\d+/g) || []).length : 0,
          hpbWind: lines.find(x => x.startsWith(' hpb_wind_' + y0 + ':')) || null,
          credPv: num(new RegExp('- ([0-9.]+) hp_pv_' + y0 + '\\\\b')), credCw: num(new RegExp('- ([0-9.]+) cw_' + y0 + '\\\\b')),
          rp: (L.match(/\\brp_(wind|pv|batt|vrfb|ironair|ccgt|phes|phel)_\\d+/g) || []).length, nY: BLD_YEARS.length };
        return JSON.stringify(o);
      } catch (e) { return JSON.stringify({ error: String(e.message || e) }); } finally { bldBuildLP = _b; } })()`));
    const h0 = hpRun('none');
    check('spare-capacity pool: hp_wind_<y> and hp_pv_<y> in every year, one pool row at H over both and all years, wind\'s row shared with the Cape allowance',
      !h0.error && h0.cols && h0.poolRhs === 5000 && h0.poolTerms === 2 * h0.nY && /hp_wind_\d+ \+ cw_\d+ - b_wind_/.test(h0.hpbWind || ''),
      h0.error || `pool ${h0.poolRhs} over ${h0.poolTerms} terms; ${h0.hpbWind}`);
    check('spare-capacity pool: the credit is the integration charge (equal to the Cape allowance\'s cw_ credit) and no freed-coal column exists while it is on',
      !h0.error && h0.credPv !== null && h0.credCw !== null && Math.abs(h0.credPv - h0.credCw) <= 0.001 && h0.rp === 0,
      h0.error || `hp_pv ${h0.credPv}, cw ${h0.credCw}, rp_ columns ${h0.rp}`);
    for (const [f, label, test] of [
      ['gridCost', 'the pool credited at solar\'s whole grid cost', r => !r.error && !(Math.abs(r.credPv - r.credCw) <= 0.001)],
      ['noPool', 'the pool row dropped', r => !r.error && r.poolRhs === null],
      ['poolLeftOn', 'the freed-coal pool left on beside the spare pool', r => !r.error && r.rp > 0],
    ]){ const r = hpRun(f); check('injected fault caught: ' + label, test(r), r.error || ''); }
    const sp = JSON.parse(w.eval(`(() => { const u = { ...FIXED, ...state, bldGridCost: 1, newWindMW: 3000, newPvMW: 4000, bldSparePoolMW: 5000 }, u0 = { ...u, bldSparePoolMW: 0 };
      return JSON.stringify({ diff: (gridChargeR(u0, u0) - gridChargeR(u, u)) / 1000, want: 5000 * bldGridIntegRkW('pv', u), hp: gridChargeR.last.hpMW }); })()`));
    check('spare-capacity pool: the engine credits the first H MW of new wind and solar at the integration charge (page rule) and the run\'s own use when given',
      Math.abs(sp.diff - sp.want) < 1e-6 && sp.hp === 5000, JSON.stringify(sp));
  }

  console.log(`\n${pass}/${pass + fail} checks passed`);
  process.exit(fail ? 1 : 0);
})();
