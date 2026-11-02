// mtsao_compare.js (user, 2 Nov 2026, message 617 (a)): c6e's state in YEARS, each run through the twelve weather years (one outage draw
// per year, as ss_engine_check.js), the page default ('sync6'), under one NTCSA MTSAO 2027-2036 Reference Case input at a time:
// VARIANTS (JSON {name: {state settings, or a function of Y as a string}}). Prints unserved energy (GWh/yr), system cost (R bn/yr), CO2
// (Mt), coal, served and diesel output (TWh) and the diesel fleet's capacity factor, twelve-year means. From harness/:
//   YEARS=2031,2036 VARIANTS='<json>' [JSON=out.json] node ext/mtsao_compare.js
// The state builder is ss_engine_check.js's block() (claude/system-strength-min), c6e's build from harness/pathway/c6e/pathway_c6e.json.
// The VARIANTS used are in RESULTS 'NTCSA's MTSAO 2027-2036 against the model's inputs'.
const fs = require('fs'), path = require('path'), crypto = require('crypto'); const { JSDOM } = require('jsdom');
const ROOT = process.env.ROOT || 'testroot', BUILD = process.env.BUILD || 'pathway/c6e/pathway_c6e.json';
const YEARS = (process.env.YEARS || '2026,2030,2035,2040').split(',').map(Number), SEED_BASE = +(process.env.SEED_BASE || 71830529);
const EXTRA = process.env.EXTRA ? JSON.parse(process.env.EXTRA) : {};
const LOW_Q = +(process.env.LOW_Q || 0.10), MODES = (process.env.MODES || 'sync6,lift,nolift').split(',');
(async () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, url: 'file://' + path.resolve(ROOT) + '/index.html',
    beforeParse(w){ w.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: () => () => ({ addColorStop(){}, data: [], width: 0, measureText: () => ({ width: 10 }) }) });
      const ch = () => new Proxy(function(){ return ch(); }, { get: () => ch() }); w.L = new Proxy({}, { get(){ return function(){ return ch(); }; } });
      w.onerror = () => {}; Object.defineProperty(w.history, 'replaceState', { value: () => {}, writable: true }); w.URL.createObjectURL = () => 'blob:x'; w.Worker = function(){ this.postMessage = () => {}; };
      w.fetch = async (u) => { try { const cl = String(u).split('?')[0].replace(/^file:.*?\/(?=nodal\/|profiles|config)/, ''); const t = fs.readFileSync(path.join(path.resolve(ROOT), cl), 'utf8'); return { ok: true, json: async () => JSON.parse(t), text: async () => t }; } catch (e) { return { ok: false, json: async () => { throw e; }, text: async () => { throw e; } }; } }; } });
  await new Promise(r => setTimeout(r, 6000)); const w = dom.window;
  await w.eval('loadWeatherYears()');
  const stamp = w.eval('BUILD_STAMP'), hasSS = w.eval("typeof FIXED.ssMode !== 'undefined'");
  const P = JSON.parse(fs.readFileSync(BUILD, 'utf8')), S = P.sched, yrs = Object.keys(S).map(Number).sort((a, b) => a - b);
  // block() of gen_pathway_presets.py, in JS (the fields it writes; the getters evaluated in the page).
  const block = (Y) => {
    const cum = (k, to = Y) => yrs.filter(y => y <= to).reduce((a, y) => a + (S[y][k] || 0), 0);
    const batt = cum('batt'), mwh = cum('battMWh'), ps = cum('phes') + cum('phel');
    if (ps || cum('vrfb') || cum('ironair') || P.fossilEnd || (P.gasFloor || {}).engine) throw new Error('block: a setting this port does not carry is set');
    const blk = P.demand.block || {}; let bY = -1, blkMW = 0; for (const [y, mw] of Object.entries(blk)) if (+y <= Y && +y > bY){ bY = +y; blkMW = mw; }
    const nuc = Object.entries(P.nuclearAdd || {}).reduce((a, [y, mw]) => a + (+y <= Y ? mw : 0), 0);
    const f = { scenarioYear: Y, newWindMW: cum('wind'), newPvMW: cum('pv'), newRooftopMW: cum('rooftop'), newBattMW: batt,
      newBattHours: batt > 0 ? Math.max(1, Math.min(20, mwh / batt)) : 4, newVrfbMW: 0, newIronAirMW: 0, newCcgtMW: cum('ccgt'), newOcgtMW: cum('ocgt'),
      newOcgdMW: cum('ocgd'), newOffshoreMW: cum('off'), newNuclearMW: nuc, newPsMW: 0, demandGrowthPct: (P.demand.index[String(Y)] - 1) * 100,
      demandBlockMW: blkMW, windCapeMW: cum('cw'), costCcgt: P.gas.fuelR[String(Y)], importsMW: P.importsMW, importsCF: P.importsCF,
      bldPvTracking: P.pvTracking, bldCapeCurtPct: P.capeWind.curtPct, carbonAllowancePath: P.carbonPath || 'cut2027', carbonTaxFull: P.carbonFull ? 1 : 0,
      bldWindCorr: P.windCorr, bldWindCase: P.windCase, bldPvCase: P.pvCase, bldTariffCfBasis: P.tariffCfBasis, bldGridIntVreShare: P.gridIntVreShare,
      bldGridCost: 1, bldOcgtCostCase: P.ocgt.costCase };
    const ev = `(()=>{ const f=${JSON.stringify(f)}; f.carbonTaxRPerT=carbonTaxAt(${Y}, {...FIXED, carbonAllowancePath:f.carbonAllowancePath, carbonTaxFull:f.carbonTaxFull});
      f.coalDecomMW=Math.max(0, Math.round(FIXED.coalInstalledMW - ${S[Y].coalMW}));
      ${Y > 2030 ? `f.reserveVreRefWindMW=Math.round(FIXED.windMW + ${cum('wind', 2030)}); f.reserveVreRefPvMW=Math.round(FIXED.pvUtilityMW + ${cum('pv', 2030)});` : ''}
      return f; })()`;
    return ev;
  };
  const q = (a, p) => { const s = Float64Array.from(a).sort(); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
  const V = JSON.parse(process.env.VARIANTS || '{"base":{}}'), out = {};
  for (const Y of YEARS){
    w.eval(`applyState(${block(Y)}); window.__mBase = {...state};`);
    out[Y] = {};
    for (const [name, spec] of Object.entries(V)){
      const extra = typeof spec === 'string' ? eval(spec)(Y) : spec;
      if (extra === null){ continue; }
      const r = JSON.parse(w.eval(`(function(){ const o=[]; const st={...window.__mBase, ...${JSON.stringify(extra)}};
        for (const yy of bldWeatherYears.meta.years){ const nat=weatherYearNational(String(yy));
          const x=simulate({...st, outageSeed:${SEED_BASE}+yy*7919}, {demand:twelveYearDemand(), solar:nat.solar, wind:nat.wind, csp:PROFILES.csp, real:true});
          const dcap=Math.max(1, (st.ocgtDieselMW ?? FIXED.ocgtDieselMW) - (st.dieselDecomMW||0) + (st.newOcgdMW||0));
          o.push({un:x.E.unserved/1e3, cost:x.systemCostR/1e9, co2:x.co2, coal:x.E.coal/1e6, diesel:x.E.diesel/1e6, dcf:x.E.diesel/(dcap*x.loadS.length), served:x.gridServed/1e6}); }
        return JSON.stringify(o); })()`));
      const m = k => r.reduce((a, z) => a + z[k], 0) / r.length;
      out[Y][name] = { extra, unservedGWh: m('un'), costBn: m('cost'), co2Mt: m('co2'), coalTWh: m('coal'), dieselTWh: m('diesel'), dieselCF: m('dcf'), worstUnservedGWh: Math.max(...r.map(z => z.un)), servedTWh: m("served") };
      const b = out[Y].base, o2 = out[Y][name];
      console.log(`${Y} ${name.padEnd(10)} unserved ${o2.unservedGWh.toFixed(2)} GWh/yr (worst year ${o2.worstUnservedGWh.toFixed(1)}); cost R${o2.costBn.toFixed(2)}bn; CO2 ${o2.co2Mt.toFixed(2)} Mt; coal ${o2.coalTWh.toFixed(2)} TWh; served ${o2.servedTWh.toFixed(1)} TWh; diesel ${o2.dieselTWh.toFixed(3)} TWh, CF ${(100*o2.dieselCF).toFixed(2)}%`
        + (b && name !== 'base' ? ` | against base: unserved ${(o2.unservedGWh - b.unservedGWh >= 0 ? '+' : '') + (o2.unservedGWh - b.unservedGWh).toFixed(2)}, cost ${(o2.costBn - b.costBn >= 0 ? '+' : '') + (o2.costBn - b.costBn).toFixed(2)}bn, CO2 ${(o2.co2Mt - b.co2Mt >= 0 ? '+' : '') + (o2.co2Mt - b.co2Mt).toFixed(2)} Mt` : ''));
    }
  }
  console.log('build', stamp, 'state from', BUILD, 'seed base', SEED_BASE, 'variants', JSON.stringify(V));
  if (process.env.JSON) fs.writeFileSync(process.env.JSON, JSON.stringify({ stamp, build: BUILD, seedBase: SEED_BASE, out }, null, 1));
  process.exit(0);
})();
