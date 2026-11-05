// National engine at a given build: applies a pathcheck state row for a year, runs simulate on a modelled weather year with one outage
// seed, as harness/pathcheck.js does, and writes the hourly series the PyPSA network needs. Run from <worktree>/harness with testroot.
// usage: NODE_PATH=... node engine_dump.js <state json (pathcheck row)> <weather year> <seed k> <out json>
const { JSDOM } = require('jsdom'); const fs = require('fs'), path = require('path');
const ST = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')), WY = String(process.argv[3]), KSEED = +(process.argv[4] || 0), OUT = process.argv[5];
const SEED_BASE = 71830529;   // pathcheck.js default
const html = fs.readFileSync('testroot/index.html', 'utf8');
const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', url: 'file://' + path.resolve('testroot') + '/index.html', pretendToBeVisual: true,
 beforeParse(w){ w.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: () => () => ({ addColorStop(){}, width: 0, data: [] }) });
  const chain = () => new Proxy(function(){ return chain(); }, { get: () => chain() }); w.L = new Proxy({}, { get(){ return function(){ return chain(); }; } }); w.onerror = () => {};
  Object.defineProperty(w.history, 'replaceState', { value: () => {}, writable: true }); w.URL.createObjectURL = () => 'blob:x'; w.Worker = function(){ this.postMessage = () => {}; }; } });
dom.window.fetch = async (u) => { try { const cl = String(u).split('?')[0].replace(/^file:.*?\/(?=nodal\/|profiles|config|public_data)/, ''); const t = fs.readFileSync(path.join(path.resolve('testroot'), cl), 'utf8'); return { ok: true, json: async () => JSON.parse(t), text: async () => t }; } catch (e) { return { ok: false, json: async () => { throw e; } }; } };
(async () => {
  const w = dom.window; const t0 = Date.now();
  while (!w.GTZA_READY && Date.now() - t0 < 120000) await new Promise(r => setTimeout(r, 500));
  await w.eval('loadWeatherYears()');
  const keep = ['costCcgt','newWindMW','newPvMW','newRooftopMW','newBattMW','newBattHours','newVrfbMW','newIronAirMW','newCcgtMW','newOcgtMW','newOcgdMW','newOffshoreMW','newNuclearMW','newPsMW','newPsHours','coalDecomMW','demandGrowthPct','demandBlockMW','windCapeMW','scenarioYear','carbonTaxRPerT','ssGfmMW','ssCondMVA','gyEnrolMW','vppEnrolGWh','reserveVreRefWindMW','reserveVreRefPvMW','dieselDecomMW'];
  const over = {}; for (const k of keep) if (ST[k] !== undefined) over[k] = ST[k];
  const PAGE = fs.readFileSync(path.join(path.dirname(process.argv[1]), 'engine_dump_page.js'), 'utf8').replace('__OVER__', JSON.stringify(over)).replace('__WY__', JSON.stringify(WY)).replace('__SEEDBASE__', String(SEED_BASE)).replace('__K__', String(KSEED));
  const res = JSON.parse(w.eval(PAGE));
  fs.writeFileSync(OUT, JSON.stringify(res));
  const { hourly, ...rest } = res; console.log(JSON.stringify(rest, null, 1)); process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
