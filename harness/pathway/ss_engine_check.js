// System strength, minimum version: the engine checks and lambda (user, 1 Nov 2026, messages 603 (a), 604 (b), 606; TODO 14lo).
// From harness/: node pathway/ss_engine_check.js [> out.txt]. Minutes, not a pathway run.
// c6e's state in YEARS (default 2026,2030,2035,2040), built as harness/pathway/gen_pathway_presets.py's block() writes it from
// harness/pathway/c6e/pathway_c6e.json (2026 without the run's fleet2026 adjustment), set with applyState, each run through the twelve
// weather years (twelveYearDemand, one outage draw per year, seed SEED_BASE + weather year x 7919), as RESULTS 'System strength on
// c6e, read-only (547 (b))', in three modes: 'sync6' (the page default), 'inertia' with the coal lift and 'inertia' without it
// (ssCoalLift 0, the shortfall before the lift). Prints, by year: the requirement, inertia by source (mean, 5th percentile, minimum),
// hours short before and after the lift, coal output lifted (TWh, the lift run's coal less the no-lift run's), committed coal
// (mean, minimum), and lambda: the committed-to-output ratio of coal in the low-inertia hours of the no-lift runs (the lowest
// LOW_Q of hours by inertia, pooled over the weather years, coal output above 1 MW), at its lower quartile. lambda by year is
// SS_COAL_LAMBDA in index.html (decision D1).
// DIGEST=<file>: also writes, for 'sync6' only, a sha1 of every output key of every run, to compare with another commit's page
// (ROOT=<that root>): the 'sync6' outputs must equal main's (the keys this change adds, coalCommittedMW and ss, aside).
// JSON=<file>: the table as JSON.
const fs = require('fs'), path = require('path'), crypto = require('crypto'); const { JSDOM } = require('jsdom');
const ROOT = process.env.ROOT || 'testroot', BUILD = process.env.BUILD || 'pathway/c6e/pathway_c6e.json';
const YEARS = (process.env.YEARS || '2026,2030,2035,2040').split(',').map(Number), SEED_BASE = +(process.env.SEED_BASE || 71830529);
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
  const out = {}, digest = {};
  for (const Y of YEARS){
    w.eval(`applyState(${block(Y)}); window.__ssBase = {...state};`);
    const res = {};
    for (const M of MODES){
      if (M !== 'sync6' && !hasSS) continue;
      const extra = M === 'sync6' ? '{}' : M === 'lift' ? "{ssMode:'inertia', ssCoalLift:1}" : "{ssMode:'inertia', ssCoalLift:0}";
      const r = JSON.parse(w.eval(`(function(){ const o=[], dg=[];
        for (const yy of bldWeatherYears.meta.years){ const nat=weatherYearNational(String(yy));
          const x=simulate({...window.__ssBase, ...${extra}, outageSeed:${SEED_BASE}+yy*7919}, {demand:twelveYearDemand(), solar:nat.solar, wind:nat.wind, csp:PROFILES.csp, real:true});
          ${process.env.DIGEST && M === 'sync6' ? `{ const d={}; for (const k of Object.keys(x)){ if (k==='coalCommittedMW'||k==='ss') continue; const v=x[k];
              const s=JSON.stringify(v, (kk, vv)=> (vv instanceof Float64Array || vv instanceof Float32Array || vv instanceof Uint8Array) ? Array.from(vv) : vv); d[k]=s===undefined?'undefined':s; } dg.push(d); }` : ''}
          const H=x.loadS.length, ss=x.ss;
          const row={wy:yy, coalTWh:x.E.coal/1e6, unservedGWh:x.E.unserved/1e3, committed:Array.from(x.coalCommittedMW||[]), coal:Array.from(x.stack.coal)};
          if (ss){ row.req=ss.reqGWs; row.lossMW=ss.lossMW; row.shortH=ss.shortH; row.shortGWsH=ss.shortGWsH; row.liftH=ss.liftH; row.liftMWh=ss.liftMWh; row.liftCappedH=ss.liftCappedH; row.tot=Array.from(ss.inertiaGWs);
            row.src=Object.fromEntries(Object.entries(ss.bySource).map(([k,v])=>[k,Array.from(v)])); row.condMVA=ss.condMVA; }
          o.push(row); }
        return JSON.stringify({o, dg}); })()`));
      if (r.dg.length) digest[Y] = r.dg.map(d => Object.fromEntries(Object.entries(d).map(([k, s]) => [k, crypto.createHash('sha1').update(s).digest('hex')])));
      res[M] = r.o;
    }
    const row = { year: Y };
    if (res.sync6) row.sync6 = { coalTWh: res.sync6.reduce((a, b) => a + b.coalTWh, 0) / res.sync6.length, unservedGWh: res.sync6.reduce((a, b) => a + b.unservedGWh, 0) / res.sync6.length };
    for (const M of ['lift', 'nolift']) if (res[M]){
      const R = res[M], tot = [].concat(...R.map(r => r.tot)), n = tot.length, src = {};
      for (const k of Object.keys(R[0].src)){ const a = [].concat(...R.map(r => r.src[k])); src[k] = { mean: a.reduce((s, v) => s + v, 0) / n, p5: q(a, 0.05), min: Math.min(...a) }; }
      const com = [].concat(...R.map(r => r.committed));
      row[M] = { reqGWs: R[0].req, lossMW: R[0].lossMW, condMVA: R[0].condMVA, hours: n, shortH: R.reduce((a, r) => a + r.shortH, 0), shortGWsH: R.reduce((a, r) => a + r.shortGWsH, 0),
        liftH: R.reduce((a, r) => a + r.liftH, 0), liftCappedH: R.reduce((a, r) => a + r.liftCappedH, 0), liftCommitTWh: R.reduce((a, r) => a + r.liftMWh, 0) / 1e6, coalTWh: R.reduce((a, r) => a + r.coalTWh, 0) / R.length,
        unservedGWh: R.reduce((a, r) => a + r.unservedGWh, 0) / R.length,
        inertia: { mean: tot.reduce((s, v) => s + v, 0) / n, p5: q(tot, 0.05), min: Math.min(...tot) }, bySource: src,
        committedMW: { mean: com.reduce((s, v) => s + v, 0) / n, min: Math.min(...com) } };
      if (M === 'nolift'){
        // lambda: committed / output in the lowest LOW_Q of hours by inertia (coal output above 1 MW), lower quartile; and two
        // alternatives for the record: hours below the requirement, and the lowest 5%.
        const cut = q(tot, LOW_Q), cut5 = q(tot, 0.05), req = R[0].req, ratios = [], r5 = [], rReq = [];
        let i = 0; for (const r of R) for (let h = 0; h < r.tot.length; h++, i++){ if (!(r.coal[h] > 1)) continue; const x = r.committed[h] / r.coal[h];
          if (r.tot[h] <= cut) ratios.push(x); if (r.tot[h] <= cut5) r5.push(x); if (r.tot[h] < req) rReq.push(x); }
        row.lambda = { lowQ: LOW_Q, n: ratios.length, p25: ratios.length ? q(ratios, 0.25) : null, median: ratios.length ? q(ratios, 0.5) : null,
          low5: { n: r5.length, p25: r5.length ? q(r5, 0.25) : null }, belowReq: { n: rReq.length, p25: rReq.length ? q(rReq, 0.25) : null } };
      }
    }
    if (row.lift && row.nolift) row.coalLiftedTWh = row.lift.coalTWh - row.nolift.coalTWh;   // mean over weather years
    out[Y] = row;
    const f1 = v => v == null ? '-' : (+v).toFixed(1), f3 = v => v == null ? '-' : (+v).toFixed(3);
    if (row.lift) console.log(`${Y}: requirement ${f1(row.lift.reqGWs)} GW.s (loss ${row.lift.lossMW} MW); TDP condensers ${row.lift.condMVA} MVA; short before the lift ${row.nolift.shortH} h `
      + `(${f1(row.nolift.shortGWsH)} GW.s-h), after ${row.lift.shortH} h (${f1(row.lift.shortGWsH)} GW.s-h) of ${row.lift.hours}; lift hours ${row.lift.liftH} (no coal left to lift in ${row.lift.liftCappedH}), coal output lifted ${f3(row.coalLiftedTWh)} TWh/yr `
      + `(commitment ${f3(row.lift.liftCommitTWh / 12)} TWh/yr); inertia after (mean/p5/min) ${f1(row.lift.inertia.mean)}/${f1(row.lift.inertia.p5)}/${f1(row.lift.inertia.min)}, before ${f1(row.nolift.inertia.mean)}/${f1(row.nolift.inertia.p5)}/${f1(row.nolift.inertia.min)}; `
      + `committed coal mean/min ${f1(row.lift.committedMW.mean)}/${f1(row.lift.committedMW.min)} MW (before ${f1(row.nolift.committedMW.mean)}/${f1(row.nolift.committedMW.min)}); lambda p25 ${f3(row.lambda.p25)} (n ${row.lambda.n}; median ${f3(row.lambda.median)}; lowest 5% ${f3(row.lambda.low5.p25)}; below requirement ${f3(row.lambda.belowReq.p25)}, n ${row.lambda.belowReq.n})`);
    if (row.lift) console.log('  by source after the lift, mean/p5/min GW.s: ' + Object.entries(row.lift.bySource).map(([k, v]) => `${k} ${f1(v.mean)}/${f1(v.p5)}/${f1(v.min)}`).join('; '));
    if (row.sync6) console.log(`  sync6: coal ${f3(row.sync6.coalTWh)} TWh/yr, unserved ${f3(row.sync6.unservedGWh)} GWh/yr; inertia lift: coal ${row.lift ? f3(row.lift.coalTWh) : '-'}, unserved ${row.lift ? f3(row.lift.unservedGWh) : '-'}; no lift: coal ${row.nolift ? f3(row.nolift.coalTWh) : '-'}`);
  }
  console.log('build', stamp, 'root', ROOT, 'state from', BUILD, 'seed base', SEED_BASE, 'lowQ', LOW_Q);
  if (process.env.DIGEST) fs.writeFileSync(process.env.DIGEST, JSON.stringify({ stamp, digest }));
  if (process.env.JSON) fs.writeFileSync(process.env.JSON, JSON.stringify({ stamp, build: BUILD, seedBase: SEED_BASE, lowQ: LOW_Q, out }, null, 1));
  process.exit(0);
})();
