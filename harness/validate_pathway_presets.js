#!/usr/bin/env node
/**
 * validate_pathway_presets.js: the generated pathway presets against the runs they were generated from (user, 19 Oct 2026,
 * messages 213, 227 (2) and 232 (2)).
 *
 *   'Least-cost path 2035'  the central run's pathway (c6e from 29 Oct 2026: harness/pathway/c6e/pathway_c6e.json, PR #128; c5f before) and its engine check for 2031-35
 *   'IRP path 2035'         IRP 2025's Table 1 build on the central run's inputs (harness/pathway/c6e/pathway_irp2025_c6e.json) and its check
 *   "IRP's 2030 targets"    the same build file's 2030 state and its engine check for 2026-30 (pathcheck_irp2025_c6e_a.json)
 *   "..., grid delayed"     a variant with no run of its own: the 2030 state with a share of its new wind and solar held back
 *
 * The blocks are written into index.html by harness/pathway/gen_pathway_presets.py. For each preset with a run this script
 *   1. confirms the blocks are the generator's output (no hand edits);
 *   2. confirms the page state after applyState(preset) is the state the engine check ran the preset's year on, key by key, and that the
 *      page's global cost settings are the run's (lithium decline, LNG terminal charge, discount rate: from build 2026-10-19b
 *      the page defaults equal c5f's, message 227 (1));
 *   3. runs the preset on the engine check's profiles and outage draws (every weather year, the row's own number of draws,
 *      SEED_BASE + k*104729 + year*7919) and compares mean unserved energy and mean system cost with the stored row.
 * The grid-delayed variant: its state is the 2030 preset's, key by key, except the wind and solar it holds back (the
 * generator's share, rounded to the MW) and its curtailment cap.
 *
 * Tolerances (RESULTS, 19 Oct 2026, 'Least-cost path 2035 preset', 'IRP path 2035 regenerated' and the 2030 presets' entry;
 * measured gaps zero to the digit): unserved energy within UNS_TOL_PCT_TARGET% of the year's reliability target in the row; system cost within COST_TOL_PCT.
 *
 *   node validate_pathway_presets.js [root]
 */
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const { JSDOM } = require('jsdom');
const ROOT = process.argv[2] || 'testroot';
const COST_TOL_PCT = 0.01, UNS_TOL_PCT_TARGET = 1;
const SEED_BASE = 71830529;   // pathcheck.js's default, with which both engine checks ran
// From build 2026-10-31l the engine checks are those run on build 31c (both cost corrections, messages 552 (a), 560, 565 (a)): the
// corrections lower each preset's system cost by 1.0-1.3% (unserved and CO2 unchanged), so the 31a checks no longer describe the page.
const RUNS = [
  { name: "IRP's 2030 targets", year: 2030, build: 'harness/pathway/c6e/pathway_irp2025_c6e.json', check: 'harness/pathway/c6e/pathcheck_irp2025_c6e_31c_a.json' },
  { name: 'Least-cost path 2035', build: 'harness/pathway/c6e/pathway_c6e.json', check: 'harness/pathway/c6e/pathcheck_c6e_31c_b.json' },
  { name: 'IRP path 2035', build: 'harness/pathway/c6e/pathway_irp2025_c6e.json', check: 'harness/pathway/c6e/pathcheck_irp2025_c6e_31c_b.json' },
];

let npass = 0, nfail = 0; const fails = [];
function check(name, ok, detail){ if (ok) npass++; else { nfail++; fails.push(`  ${name}` + (detail ? `  -  ${detail}` : '')); } }

// 1. The blocks are the generator's output.
try { execFileSync('python3', ['harness/pathway/gen_pathway_presets.py', '--check'], { cwd: ROOT, stdio: 'pipe' }); check('the preset blocks are the generator\'s output', true); }
catch (e) { check('the preset blocks are the generator\'s output', false, String(e.stdout || e.message).trim().slice(0, 160)); }

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, url: 'file://' + path.resolve(ROOT) + '/index.html',
  beforeParse(w){ w.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: () => () => ({ addColorStop(){}, data: [], width: 0, measureText: () => ({ width: 10 }) }) });
    const ch = () => new Proxy(function(){ return ch(); }, { get: () => ch() }); w.L = new Proxy({}, { get(){ return function(){ return ch(); }; } });
    w.onerror = () => {}; Object.defineProperty(w.history, 'replaceState', { value: () => {}, writable: true }); w.URL.createObjectURL = () => 'blob:x'; w.Worker = function(){ this.postMessage = () => {}; };
    w.fetch = async (u) => { try { const cl = String(u).split('?')[0].replace(/^file:.*?\/(?=nodal\/|profiles|config)/, ''); const t = fs.readFileSync(path.join(path.resolve(ROOT), cl), 'utf8');
      return { ok: true, json: async () => JSON.parse(t), text: async () => t }; } catch (e) { return { ok: false, json: async () => { throw e; }, text: async () => { throw e; } }; } }; } });

(async () => {
  await new Promise(r => setTimeout(r, 6000)); const w = dom.window;
  await w.eval('loadWeatherYears()');
  // The runs' rooftop add-back scaled to the twelve-year mean (messages 391 (b), 392 (c)), recorded as roofAddback12. From build
  // 2026-10-30a the page applies the same scaling itself in its twelve-weather-year runs (twelveYearDemand, message 518 (c)), so
  // this check uses the page's series as it stands and only asserts that every run records the page's K.
  { const Ks = RUNS.map(R => JSON.parse(fs.readFileSync(path.join(ROOT, R.build), 'utf8')).roofAddback12 || null);
    const K = +w.eval('roofTwelveYearK()'), on = !!w.eval('FIXED.bldRoof12');
    check('the page scales the rooftop add-back as the runs record it (roof12)', on && Ks.every(k => k != null && Math.abs(k - K) <= 1e-9), `page ${on ? 'on' : 'off'}, K ${K}, runs ${Ks.join(', ')}`);
    console.log(`roof12: the page scales the rooftop add-back by ${K.toFixed(4)}; the runs record ${Ks.join(', ')}`); }
  const same = (a, b) => (typeof a === 'number' && typeof b === 'number') ? Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b)) : a === b;
  for (const R of RUNS){
    const NAME = R.name, Y = R.year || 2035, P = JSON.parse(fs.readFileSync(path.join(ROOT, R.build), 'utf8'));
    const ROW = JSON.parse(fs.readFileSync(path.join(ROOT, R.check), 'utf8')).find(r => r.y === Y);
    console.log(`\n== ${NAME}`);
    check(`${NAME}: the engine check has a ${Y} row`, !!ROW); if (!ROW) continue;
    check(`${NAME}: the preset exists and has a button`, w.eval(`'${NAME.replace(/'/g, "\\'")}' in PRESETS && PRESET_ORDER.includes(${JSON.stringify(NAME)}) && !!document.querySelector('button[data-preset="${NAME.replace(/'/g, "\\'")}"]')`));
    w.eval(`applyState(PRESETS[${JSON.stringify(NAME)}])`);

    // 2. The page state is the engine check's state for the year. The row records each key the check set for the year; the
    // build file the run's settings. A key the page does not hold reads its FIXED default, as the engine does; a key the row
    // does not hold (the reserve reference, set by pathcheck.js after 2030 only) is the page default the check ran on.
    const st = k => JSON.parse(w.eval(`JSON.stringify(state['${k}'] ?? FIXED['${k}'] ?? null)`));
    const want = {};
    for (const k of ['newWindMW', 'newPvMW', 'newRooftopMW', 'newBattMW', 'newBattHours', 'newVrfbMW', 'newIronAirMW', 'newCcgtMW', 'newOcgtMW', 'newOcgdMW',
                     'newOffshoreMW', 'newNuclearMW', 'newPsMW', 'newPsHours', 'coalDecomMW', 'demandGrowthPct', 'demandBlockMW', 'windCapeMW', 'scenarioYear',
                     'carbonTaxRPerT', 'costCcgt', 'reserveVreRefWindMW', 'reserveVreRefPvMW']) want[k] = (k in ROW) ? ROW[k] : JSON.parse(w.eval(`JSON.stringify(FIXED['${k}'] ?? null)`));
    Object.assign(want, { importsMW: P.importsMW, importsCF: P.importsCF, bldPvTracking: P.pvTracking, bldCapeCurtPct: P.capeWind.curtPct,
      carbonAllowancePath: P.carbonPath ?? 'cut2027', carbonTaxFull: P.carbonFull ? 1 : 0, bldWindCorr: P.windCorr, bldWindCase: P.windCase, bldPvCase: P.pvCase,
      bldTariffCfBasis: P.tariffCfBasis, bldGridIntVreShare: P.gridIntVreShare, bldOcgtCostCase: P.ocgt.costCase, bldGridCost: 1 });
    const gf = P.gasFloor || {};
    if (gf.engine) Object.assign(want, { ccgtForceLoad: 1, ccgtForceLoadMW: gf.mw, ccgtForceLoadPct: gf.pct, ccgtForceFromYear: gf.from, ccgtForceToYear: gf.to });
    else want.ccgtForceLoad = 0;
    const norm = (a, v) => (typeof v === 'number' && typeof a === 'boolean') ? +a : a;   // toggles hold true or 1
    const off = Object.entries(want).filter(([k, v]) => !same(norm(st(k), v), v))
      .map(([k, v]) => `${k} page ${JSON.stringify(st(k))}, check ${JSON.stringify(v)}`);
    check(`${NAME}: the page state is the engine check's ${Y} state`, off.length === 0, off.join('; '));
    check(`${NAME}: the run recorded no setting the preset cannot carry`,
          (P.importsEndYear ?? 0) === +w.eval('FIXED.importsEndYear') && (P.cocCase ?? w.eval('FIXED.bldCocCase')) === w.eval('FIXED.bldCocCase') && !P.gasFinPremium && !P.comply && P.gas.fuelRFlat == null);   // the cost-of-capital case from build 2026-10-28a, as the generator's guard
    // The page's coal settings are the run's (PR C, build 2026-10-24a): a run recorded before PR C carries none and ran on COAL_PRE_C.
    const coalOff = JSON.parse(w.eval(`(function(){ const R = ${JSON.stringify(P.coal || null)} || COAL_PRE_C;
      return JSON.stringify(Object.keys(COAL_PRE_C).filter(k => JSON.stringify(state[k] ?? FIXED[k]) !== JSON.stringify(R[k])).map(k => k + ' page ' + JSON.stringify(state[k] ?? FIXED[k]) + ', run ' + JSON.stringify(R[k]))); })()`));
    check(`${NAME}: the page's coal settings are the run's`, coalOff.length === 0, coalOff.join('; '));
    // The page's global cost settings are the run's: from 19b the defaults equal c5f's (message 227 (1)).
    const decl = +w.eval('BLD_COST.batt.decl'), term = +w.eval('bldGasTerminalRkW()'), disc = +w.eval('BLD_DISC');
    check(`${NAME}: the page's lithium decline is the run's`, same(decl, +P.battDecl), `page ${decl}, run ${P.battDecl}`);
    check(`${NAME}: the page's LNG terminal charge is the run's`, same(term, +P.gas.fomAdd), `page ${term}, run ${P.gas.fomAdd}`);
    check(`${NAME}: the discount rate is the run's`, same(disc, +P.disc), `page ${disc}, run ${P.disc}`);
    console.log(`state: ${Object.keys(want).length} keys checked, ${off.length} differ; lithium decline ${decl}, LNG terminal R${term}/kW-yr, discount ${disc}`);

    // 3. The engine check's profiles and outage draws.
    const K = ROW.draws, YRS = JSON.parse(w.eval('JSON.stringify(bldWeatherYears.meta.years)')), t0 = Date.now(), o = [];
    for (const yy of YRS) for (let k = 0; k < K; k++) o.push(JSON.parse(w.eval(`(function(){ const nat=weatherYearNational(String(${yy}));
        const x=simulate({...state,outageSeed:${SEED_BASE}+${k}*104729+${yy}*7919},{demand:twelveYearDemand(),solar:nat.solar,wind:nat.wind,csp:PROFILES.csp,real:true});
        return JSON.stringify([x.E.unserved/1e3, x.systemCostR/1e9, x.co2, (x.systemCostR-x.btmCapexR)/1e9]); })()`)));
    const m = i => o.reduce((a, b) => a + b[i], 0) / o.length;
    const r = { nRuns: o.length, mean: m(0), cost: m(1), co2: m(2), gridCost: m(3) }, dPct = 100 * (r.cost - ROW.cost) / ROW.cost;
    const tol = UNS_TOL_PCT_TARGET / 100 * ROW.target;
    check(`${NAME}: as many runs as the engine check`, r.nRuns === ROW.nRuns, `${r.nRuns} against ${ROW.nRuns}`);
    check(`${NAME}: ${Y} unserved energy within ${UNS_TOL_PCT_TARGET}% of the reliability target of the engine check`, Math.abs(r.mean - ROW.mean) <= tol,
          `page ${r.mean.toFixed(4)} GWh, check ${ROW.mean.toFixed(4)}, tolerance ${tol.toFixed(4)}`);
    check(`${NAME}: ${Y} unserved energy within the reliability target`, r.mean <= ROW.target, `${r.mean.toFixed(4)} GWh against ${ROW.target.toFixed(4)}`);
    check(`${NAME}: ${Y} system cost within ${COST_TOL_PCT}% of the engine check`, Math.abs(dPct) <= COST_TOL_PCT, `page R${r.cost.toFixed(3)}bn, check R${ROW.cost.toFixed(3)}bn (${dPct.toFixed(4)}%)`);
    console.log(`${Y} on ${o.length} runs (${((Date.now() - t0) / 1000).toFixed(0)} s):`);
    console.log(`  unserved   page ${r.mean.toFixed(4)} GWh   check ${ROW.mean.toFixed(4)} GWh   target ${ROW.target.toFixed(4)} GWh`);
    console.log(`  cost       page R${r.cost.toFixed(3)}bn   check R${ROW.cost.toFixed(3)}bn (${dPct.toFixed(4)}%)`);
    console.log(`  CO2        page ${r.co2.toFixed(3)} Mt   check ${ROW.co2.toFixed(3)} Mt`);
    console.log(`  grid cost  page R${r.gridCost.toFixed(3)}bn   check R${ROW.gridCost.toFixed(3)}bn (grid cost is informational: the check's build may predate M11's fix)`);
  }
  // The grid-delayed variant (message 232 (2)): the 2030 preset's state with a share of its new wind and solar held back and
  // its own curtailment cap; nothing else differs.
  { const V = "IRP's 2030 targets, grid delayed", T = "IRP's 2030 targets";
    console.log(`\n== ${V}`);
    check(`${V}: the preset exists and has a button`, w.eval(`${JSON.stringify(V)} in PRESETS && PRESET_ORDER.includes(${JSON.stringify(V)}) && !!document.querySelector('button[data-preset="IRP\\'s 2030 targets, grid delayed"]')`));
    const snap = n => JSON.parse(w.eval(`(function(){ applyState(PRESETS[${JSON.stringify(n)}]); return JSON.stringify(state); })()`));
    const t = snap(T), v = snap(V), keys = [...new Set([...Object.keys(t), ...Object.keys(v)])];
    const differ = keys.filter(k => !same(v[k], t[k]));
    const share = v.newWindMW / t.newWindMW, heldSame = Math.round(share * t.newPvMW) === v.newPvMW;
    check(`${V}: the state is the 2030 preset's except new wind, new solar and the curtailment cap`,
          differ.every(k => ['newWindMW', 'newPvMW', 'congestionCurtailPct'].includes(k)), differ.join(', '));
    check(`${V}: wind and solar are held back by the same share`, share < 1 && heldSame, `wind ${v.newWindMW} of ${t.newWindMW}, solar ${v.newPvMW} of ${t.newPvMW}`);
    console.log(`state: ${keys.length} keys compared; differ: ${differ.join(', ')}; share connected ${share.toFixed(4)}; curtailment cap ${v.congestionCurtailPct}% (2030 preset ${t.congestionCurtailPct}%)`); }
  console.log(`\n${npass}/${npass + nfail} pathway preset checks pass`);
  if (fails.length){ console.log('\nFAILURES:'); fails.forEach(f => console.log(f)); }
  process.exit(nfail ? 1 : 0);
})();
