// The 2025 backcast ('2025, as modelled') with and without the measured coal availability trace (user, 12 Oct 2026:
// the trace is to be retired from the public repository; if diesel burn or shed energy moves by more than about 10%,
// monthly mean availability goes into the preset's outage draw). Runs the preset three ways: with its trace year
// (as published today), on the outage draw with the preset's fixed seed (what the page would show without the
// trace), and on the draw over N seeds (the spread of one draw). Optional MONTHLY=<12 comma-separated factors> applies
// a monthly availability shape to the draw (state.outageMonthlyAvail), for the follow-up test.
// usage (from harness/): node backcast_trace.js testroot [N]
const fs = require('fs'), path = require('path'); const { JSDOM } = require('jsdom');
const ROOT = process.argv[2] || 'testroot', N = +(process.argv[3] || 20);
(async () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, url: 'file://' + path.resolve(ROOT) + '/index.html',
    beforeParse(w) { w.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: () => () => ({ addColorStop() {}, data: [], width: 0, measureText: () => ({ width: 10 }) }) });
      const ch = () => new Proxy(function () { return ch(); }, { get: () => ch() }); w.L = new Proxy({}, { get() { return function () { return ch(); }; } });
      w.onerror = () => {}; Object.defineProperty(w.history, 'replaceState', { value: () => {}, writable: true }); w.URL.createObjectURL = () => 'blob:x'; w.Worker = function () { this.postMessage = () => {}; };
      w.fetch = async (u) => { try { const cl = String(u).split('?')[0].replace(/^file:.*?\/(?=nodal\/|profiles|config)/, ''); const t = fs.readFileSync(path.join(path.resolve(ROOT), cl), 'utf8'); return { ok: true, json: async () => JSON.parse(t), text: async () => t }; } catch (e) { return { ok: false, json: async () => { throw e; }, text: async () => { throw e; } }; } }; } });
  await new Promise(r => setTimeout(r, 6000)); const w = dom.window;
  const run = (extra) => JSON.parse(w.eval(`(() => { applyState(PRESETS['2025, as modelled']); const S = { ...state, ...${JSON.stringify(extra)} };
    const r = simulate(S, PROFILES); return JSON.stringify({ dieselGWh: (r.E.diesel || 0) / 1e3, shedGWh: (r.E.unserved || 0) / 1e3,
      coalTWh: (r.E.coal || 0) / 1e6, trace: S.outageTraceYear, seed: S.outageSeed }); })()`));
  const base = run({});
  console.log('preset as published (trace year ' + base.trace + '):', JSON.stringify(base));
  const monthly = process.env.MONTHLY ? process.env.MONTHLY.split(',').map(Number) : null;
  const draw = (seed) => run({ outageTraceYear: null, ...(seed !== undefined ? { outageSeed: seed } : {}), ...(monthly ? { outageMonthlyAvail: monthly } : {}) });
  const fixed = draw(); console.log('outage draw, preset seed ' + fixed.seed + (monthly ? ', monthly shape' : '') + ':', JSON.stringify(fixed));
  const xs = []; for (let k = 0; k < N; k++) xs.push(draw(20260816 + 1000 * (k + 1)));
  const st = (key) => { const v = xs.map(x => x[key]).sort((a, b) => a - b); const m = v.reduce((a, b) => a + b, 0) / v.length;
    return { mean: +m.toFixed(2), p10: +v[Math.floor(0.1 * (v.length - 1))].toFixed(2), p90: +v[Math.ceil(0.9 * (v.length - 1))].toFixed(2) }; };
  console.log('outage draw over ' + N + ' seeds:', JSON.stringify({ dieselGWh: st('dieselGWh'), shedGWh: st('shedGWh'), coalTWh: st('coalTWh') }));
  const pct = (a, b) => (b ? (100 * (a - b) / b).toFixed(1) + '%' : 'n/a');
  console.log('change against the trace: fixed seed diesel ' + pct(fixed.dieselGWh, base.dieselGWh) + ', shed ' + pct(fixed.shedGWh, base.shedGWh)
    + '; mean of seeds diesel ' + pct(st('dieselGWh').mean, base.dieselGWh) + ', shed ' + pct(st('shedGWh').mean, base.shedGWh));
  process.exit(0);
})();
