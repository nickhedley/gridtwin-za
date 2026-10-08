// GridTwin ZA - writes the central pathway's first-pass build LP (Today 2026, demand +5% to 2040, coal minimum, pumped
// storage energy, two outage draws, half standard) in a chosen storage mode, to compare LP size and solve time across
// bldHourlySoc settings (build 2026-10-08c). Run from harness/:
//   node ext/hs_lp.js testroot <0|1|2|none> <out.lp>     ('none' leaves the build's default)
const ROOTARG = process.argv[2];
const fs = require('fs'), path = require('path'); const { JSDOM } = require(process.cwd() + '/node_modules/jsdom');
(async () => {
  const html = fs.readFileSync(path.join(ROOTARG, 'index.html'), 'utf8');
  const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, url: 'file://' + path.resolve(ROOTARG) + '/index.html',
    beforeParse(w) { w.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: () => () => ({ addColorStop() {}, data: [], width: 0, measureText: () => ({ width: 10 }) }) });
      const ch = () => new Proxy(function () { return ch(); }, { get: () => ch() }); w.L = new Proxy({}, { get() { return function () { return ch(); }; } });
      w.onerror = () => {}; Object.defineProperty(w.history, 'replaceState', { value: () => {}, writable: true }); w.URL.createObjectURL = () => 'blob:x'; w.Worker = function () { this.postMessage = () => {}; };
      w.fetch = async (u) => { try { const cl = String(u).split('?')[0].replace(/^file:.*?\/(?=nodal\/|profiles|config)/, ''); const t = fs.readFileSync(path.join(path.resolve(ROOTARG), cl), 'utf8'); return { ok: true, json: async () => JSON.parse(t), text: async () => t }; } catch (e) { return { ok: false, json: async () => { throw e; }, text: async () => { throw e; } }; } }; } });
  for (let i = 0; i < 80 && !dom.window.GTZA_READY; i++) await new Promise(r => setTimeout(r, 250));
  const w = dom.window;
  await w.eval('loadWeatherYears()');
  const hs = process.argv[3], outf = process.argv[4];
  const lp = w.eval(`(function(){ applyState(PRESETS['Today 2026']); state.demandGrowthPct=5; bldSetHorizon(2040);
    state.bldCoalCommit=1; state.bldPsEnergy=1; ${hs === 'none' ? '' : 'state.bldHourlySoc=' + hs + ';'}
    const tg=1.05, opts={growth:Math.pow(tg,1/Math.max(1,BLD_YEARS.length-1))-1, eaf:(state.coalEAFPct??FIXED.coalEAFPct)/100, rate:bldRates(), state:state, draws:2, targetFrac:0.5};
    return bldBuildLP(opts).lp; })()`);
  fs.writeFileSync(outf, lp);
  let h = 0; for (let i = 0; i < lp.length; i++) h = (h * 31 + lp.charCodeAt(i)) >>> 0;
  console.log(JSON.stringify({ stamp: w.eval('BUILD_STAMP'), hs, len: lp.length, hash: h, rows: lp.split('\n').length }));
  process.exit(0);
})();
