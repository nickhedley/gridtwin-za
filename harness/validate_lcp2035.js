#!/usr/bin/env node
/**
 * validate_lcp2035.js: the 'Least-cost path 2035' preset against the pathway it was generated from (user, 19 Oct 2026,
 * message 213).
 *
 * The preset is c5f's build and coal standing in 2035, written into index.html by harness/pathway/gen_preset_lcp2035.py
 * from c5f's build file (harness/pathway/c5f/pathway_c5f.json). Its engine check for 2031-35 (pathcheck_c5f_b.json,
 * build 2026-10-17g, TF=0.5 LNG=1 GRID=1) is the reference. This script
 *   1. confirms the preset block is the generator's output (no hand edits);
 *   2. confirms the page state after applyState(preset) is the state the engine check ran 2035 on, key by key;
 *   3. runs the preset on the engine check's profiles and outage draws (every weather year, the row's own number of
 *      draws, SEED_BASE + k*104729 + year*7919) and compares mean unserved energy and mean system cost with the row.
 *
 * Two of c5f's settings are global cost tables, not state, so no preset carries them (message 225; page defaults unchanged
 * until the user decides): lithium capex falling P.battDecl a year (the page's BLD_COST.batt.decl otherwise) and the LNG
 * terminal charge, P.gas.fomAdd R/kW-yr on new gas fixed O&M (none on the page). They move cost only: the script measures
 * what they add on two runs, applying them as pathcheck.js does, and checks that the addition is the same on both and
 * leaves unserved energy unchanged. The page's own figures are reported; the comparison with the row adds the two.
 *
 * Tolerances (RESULTS, 19 Oct 2026, 'Least-cost path 2035'; measured gaps zero to the digit on build 2026-10-19a):
 * unserved energy within UNS_TOL_PCT_TARGET% of 2035's reliability target in the row; system cost with c5f's two settings
 * within COST_TOL_PCT of the row.
 *
 *   node validate_lcp2035.js [root]
 */
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const { JSDOM } = require('jsdom');
const ROOT = process.argv[2] || 'testroot', NAME = 'Least-cost path 2035', Y = 2035;
const COST_TOL_PCT = 0.01, UNS_TOL_PCT_TARGET = 1;
const SEED_BASE = 71830529;   // pathcheck.js's default, with which c5f's engine check ran

let npass = 0, nfail = 0; const fails = [];
function check(name, ok, detail){ if (ok) npass++; else { nfail++; fails.push(`  ${name}` + (detail ? `  -  ${detail}` : '')); } }

const P = JSON.parse(fs.readFileSync(path.join(ROOT, 'harness/pathway/c5f/pathway_c5f.json'), 'utf8'));
const ROW = JSON.parse(fs.readFileSync(path.join(ROOT, 'harness/pathway/c5f/pathcheck_c5f_b.json'), 'utf8')).find(r => r.y === Y);
check('c5f\'s engine check has a 2035 row', !!ROW);
if (!ROW){ console.log('no 2035 row'); process.exit(1); }
const UNS_TOL_GWH = UNS_TOL_PCT_TARGET / 100 * ROW.target;

// 1. The block is the generator's output.
try { execFileSync('python3', ['harness/pathway/gen_preset_lcp2035.py', '--check'], { cwd: ROOT, stdio: 'pipe' }); check('the preset block is the generator\'s output', true); }
catch (e) { check('the preset block is the generator\'s output', false, String(e.stdout || e.message).trim().slice(0, 160)); }

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, url: 'file://' + path.resolve(ROOT) + '/index.html',
  beforeParse(w){ w.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: () => () => ({ addColorStop(){}, data: [], width: 0, measureText: () => ({ width: 10 }) }) });
    const ch = () => new Proxy(function(){ return ch(); }, { get: () => ch() }); w.L = new Proxy({}, { get(){ return function(){ return ch(); }; } });
    w.onerror = () => {}; Object.defineProperty(w.history, 'replaceState', { value: () => {}, writable: true }); w.URL.createObjectURL = () => 'blob:x'; w.Worker = function(){ this.postMessage = () => {}; };
    w.fetch = async (u) => { try { const cl = String(u).split('?')[0].replace(/^file:.*?\/(?=nodal\/|profiles|config)/, ''); const t = fs.readFileSync(path.join(path.resolve(ROOT), cl), 'utf8');
      return { ok: true, json: async () => JSON.parse(t), text: async () => t }; } catch (e) { return { ok: false, json: async () => { throw e; }, text: async () => { throw e; } }; } }; } });

(async () => {
  await new Promise(r => setTimeout(r, 6000)); const w = dom.window;
  check('the preset exists', w.eval(`'${NAME}' in PRESETS`));
  check('the preset has a button', w.eval(`PRESET_ORDER.includes('${NAME}') && !!document.querySelector('button[data-preset="${NAME}"]')`));
  w.eval(`applyState(PRESETS['${NAME}'])`); await w.eval('loadWeatherYears()');

  // 2. The page state is the engine check's 2035 state. The row records each key the check set for the year; the build file
  // the run's settings. A key the page does not hold reads its FIXED default, as the engine does.
  const st = k => JSON.parse(w.eval(`JSON.stringify(state['${k}'] ?? FIXED['${k}'] ?? null)`));
  const same = (a, b) => (typeof a === 'number' && typeof b === 'number') ? Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b)) : a === b;
  const want = {};
  for (const k of ['newWindMW', 'newPvMW', 'newRooftopMW', 'newBattMW', 'newBattHours', 'newVrfbMW', 'newIronAirMW', 'newCcgtMW', 'newOcgtMW', 'newOcgdMW',
                   'newOffshoreMW', 'newNuclearMW', 'newPsMW', 'newPsHours', 'coalDecomMW', 'demandGrowthPct', 'demandBlockMW', 'windCapeMW', 'scenarioYear',
                   'carbonTaxRPerT', 'costCcgt', 'reserveVreRefWindMW', 'reserveVreRefPvMW']) want[k] = ROW[k];
  Object.assign(want, { importsMW: P.importsMW, importsCF: P.importsCF, bldPvTracking: P.pvTracking, bldCapeCurtPct: P.capeWind.curtPct,
    carbonAllowancePath: P.carbonPath ?? 'cut2027', carbonTaxFull: P.carbonFull ? 1 : 0, bldWindCorr: P.windCorr, bldWindCase: P.windCase, bldPvCase: P.pvCase,
    bldTariffCfBasis: P.tariffCfBasis, bldGridIntVreShare: P.gridIntVreShare, bldOcgtCostCase: P.ocgt.costCase, bldGridCost: 1 });
  const off = Object.entries(want).filter(([k, v]) => !same(st(k), v)).map(([k, v]) => `${k} page ${JSON.stringify(st(k))}, check ${JSON.stringify(v)}`);
  check('the page state after the preset is the engine check\'s 2035 state', off.length === 0, off.join('; '));
  check('the discount rate is the run\'s', same(+w.eval('BLD_DISC'), P.disc), `BLD_DISC ${w.eval('BLD_DISC')}, run ${P.disc}`);
  check('the run recorded no setting the preset cannot carry beyond the two cost tables',
        !P.nuclearAdd && !P.importsEndYear && !P.gasFinPremium && !(P.gasFloor && P.gasFloor.engine) && !P.comply && P.gas.fuelRFlat == null);
  const decl0 = +w.eval('BLD_COST.batt.decl'), fom0 = JSON.parse(w.eval('JSON.stringify({c: BLD_FOM.ccgt, o: BLD_FOM.ocgt})'));
  console.log(`state: ${Object.keys(want).length} keys checked; ${off.length} differ. c5f's global cost settings, not carried: lithium decline page ${decl0}, run ${P.battDecl}; LNG terminal page none, run R${P.gas.fomAdd}/kW-yr`);
  const setG = (decl, fa) => w.eval(`for (const k of ['batt','batt_high','batt_low']){ if(!BLD_COST[k] || !('decl' in BLD_COST[k])) throw new Error('BLD_COST.'+k+'.decl missing'); BLD_COST[k].decl=${decl}; }
    BLD_FOM.ccgt=${fom0.c}+${fa}; BLD_FOM.ocgt=${fom0.o}+${fa};`);
  const sim = (yy, k) => JSON.parse(w.eval(`(function(){ const nat=weatherYearNational(String(${yy}));
      const x=simulate({...state,outageSeed:${SEED_BASE}+${k}*104729+${yy}*7919},{demand:PROFILES.demand,solar:nat.solar,wind:nat.wind,csp:PROFILES.csp,real:true});
      return JSON.stringify([x.E.unserved/1e3, x.systemCostR/1e9, x.co2, (x.systemCostR-x.btmCapexR)/1e9]); })()`));

  // 3. The engine check's profiles and outage draws, on the page's own cost tables.
  const K = ROW.draws, YRS = JSON.parse(w.eval('JSON.stringify(bldWeatherYears.meta.years)')), t0 = Date.now(), o = [];
  for (const yy of YRS) for (let k = 0; k < K; k++) o.push(sim(yy, k));
  const m = i => o.reduce((a, b) => a + b[i], 0) / o.length;
  const r = { nRuns: o.length, mean: m(0), cost: m(1), co2: m(2), gridCost: m(3) };
  // What c5f's two cost settings add, on the first and last weather years' first draw: each alone, then both.
  const add = [[YRS[0], 0], [YRS[YRS.length - 1], K - 1]].map(([yy, k]) => {
    setG(decl0, 0); const a = sim(yy, k); setG(P.battDecl, 0); const b = sim(yy, k); setG(decl0, P.gas.fomAdd); const c = sim(yy, k); setG(P.battDecl, P.gas.fomAdd); const d = sim(yy, k); setG(decl0, 0);
    return { li: b[1] - a[1], term: c[1] - a[1], both: d[1] - a[1], unsSame: a[0] === b[0] && a[0] === c[0] && a[0] === d[0] }; });
  const A = add[0];
  check('c5f\'s two cost settings leave unserved energy unchanged', add.every(z => z.unsSame));
  check('what they add to cost is the same on both runs', add.every(z => Math.abs(z.both - A.both) < 1e-6 && Math.abs(z.li - A.li) < 1e-6), JSON.stringify(add));
  const cost5f = r.cost + A.both, dPct = 100 * (cost5f - ROW.cost) / ROW.cost;
  check('as many runs as the engine check', r.nRuns === ROW.nRuns, `${r.nRuns} against ${ROW.nRuns}`);
  check(`2035 unserved energy within ${UNS_TOL_PCT_TARGET}% of the reliability target (${UNS_TOL_GWH.toFixed(4)} GWh) of the engine check`, Math.abs(r.mean - ROW.mean) <= UNS_TOL_GWH,
        `page ${r.mean.toFixed(4)} GWh, check ${ROW.mean.toFixed(4)}`);
  check('2035 unserved energy within the reliability target', r.mean <= ROW.target, `${r.mean.toFixed(4)} GWh against ${ROW.target.toFixed(4)}`);
  check(`2035 system cost with c5f's two cost settings within ${COST_TOL_PCT}% of the engine check`, Math.abs(dPct) <= COST_TOL_PCT,
        `R${cost5f.toFixed(3)}bn against R${ROW.cost.toFixed(3)}bn (${dPct.toFixed(4)}%)`);
  console.log(`2035 on ${o.length} runs (${((Date.now() - t0) / 1000).toFixed(0)} s):`);
  console.log(`  unserved   page ${r.mean.toFixed(4)} GWh   check ${ROW.mean.toFixed(4)} GWh   target ${ROW.target.toFixed(4)} GWh`);
  console.log(`  cost       page R${r.cost.toFixed(3)}bn   + c5f's lithium decline R${A.li.toFixed(3)}bn + LNG terminal R${A.term.toFixed(3)}bn = R${cost5f.toFixed(3)}bn   check R${ROW.cost.toFixed(3)}bn (${dPct.toFixed(4)}%)`);
  console.log(`  CO2        page ${r.co2.toFixed(3)} Mt   check ${ROW.co2.toFixed(3)} Mt`);
  console.log(`  grid cost  page R${r.gridCost.toFixed(3)}bn   check R${ROW.gridCost.toFixed(3)}bn (the check's on build 2026-10-17g, before M11's fix)`);
  console.log(`\n${npass}/${npass + nfail} 'Least-cost path 2035' checks pass`);
  if (fails.length){ console.log('\nFAILURES:'); fails.forEach(f => console.log(f)); }
  process.exit(nfail ? 1 : 0);
})();
