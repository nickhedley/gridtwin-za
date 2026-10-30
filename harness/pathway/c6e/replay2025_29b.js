// The 2025 replay (user, 30 Oct 2026): the preset '2025, as modelled' as the page runs it (applyState, then simulate on PROFILES,
// one run), coal TWh against Eskom's 170.4 for calendar 2025 and every carrier's energy. Page set-up copied from backcast_trace.js.
// usage (from harness/): node pathway/c6e/replay2025_29b.js testroot
const fs = require('fs'), path = require('path'); const { JSDOM } = require('jsdom');
const ROOT = process.argv[2] || 'testroot';
(async () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, url: 'file://' + path.resolve(ROOT) + '/index.html',
    beforeParse(w) { w.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: () => () => ({ addColorStop() {}, data: [], width: 0, measureText: () => ({ width: 10 }) }) });
      const ch = () => new Proxy(function () { return ch(); }, { get: () => ch() }); w.L = new Proxy({}, { get() { return function () { return ch(); }; } });
      w.onerror = () => {}; Object.defineProperty(w.history, 'replaceState', { value: () => {}, writable: true }); w.URL.createObjectURL = () => 'blob:x'; w.Worker = function () { this.postMessage = () => {}; };
      w.fetch = async (u) => { try { const cl = String(u).split('?')[0].replace(/^file:.*?\/(?=nodal\/|profiles|config)/, ''); const t = fs.readFileSync(path.join(path.resolve(ROOT), cl), 'utf8'); return { ok: true, json: async () => JSON.parse(t), text: async () => t }; } catch (e) { return { ok: false, json: async () => { throw e; }, text: async () => { throw e; } }; } }; } });
  await new Promise(r => setTimeout(r, 6000)); const w = dom.window;
  const r = JSON.parse(w.eval(`(() => { applyState(PRESETS['2025, as modelled']); const x = simulate(state, PROFILES);
    const E = {}; for (const k of Object.keys(x.E)) if (typeof x.E[k] === 'number') E[k] = +(x.E[k] / 1e6).toFixed(3);
    return JSON.stringify({ build: BUILD_STAMP, trace: state.outageTraceYear, seed: state.outageSeed, coalTWh: x.E.coal / 1e6, co2: x.co2, shedGWh: (x.E.unserved || 0) / 1e3, E_TWh: E }); })()`));
  console.log(JSON.stringify(r, null, 1));
  console.log(`2025, as modelled (build ${r.build}): coal ${r.coalTWh.toFixed(1)} TWh against Eskom's 170.4 (${(100 * (r.coalTWh - 170.4) / 170.4).toFixed(1)}%)`);
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
