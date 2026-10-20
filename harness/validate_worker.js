#!/usr/bin/env node
/**
 * validate_worker.js: the engine in its web worker gives exactly the page's outputs (user, 19 Oct 2026, message 251 (3)).
 *
 * The page runs simulate() and the risk-panel draws in a web worker built from its own functions and data. jsdom has no
 * workers, so this check runs the page in Chromium (Playwright, /opt/pw-browsers), served from the repository by a small
 * local server, and for the start-up state and every preset compares, to the digit (the JSON of every number):
 *   1. the worker started and answered;
 *   2. the main run: simulate() in the worker against simulate() on the page;
 *   3. the Monte Carlo draws, the adequacy ensemble and the capture curve: the worker's against the page's own.
 * About 15 to 25 minutes (each panel is computed twice per state).
 *
 *   node validate_worker.js [root] [--quick]     --quick: the main run on every state, the panels on Today 2026 only
 */
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = path.resolve(process.argv[2] || 'testroot');
const QUICK = process.argv.includes('--quick');
let chromium;
try { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); } catch (e) { ({ chromium } = require('playwright')); }
const CHROME = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium'].find(f => fs.existsSync(f));

let pass = 0, fail = 0;
const check = (name, ok, detail) => { if (ok) pass++; else fail++; console.log((ok ? '  ok   ' : '  FAIL ') + name + (ok || !detail ? '' : '  -  ' + detail)); };
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.geojson': 'application/json' };

(async () => {
  const server = http.createServer((req, res) => {
    let f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
    if (f.endsWith('/')) f += 'index.html';
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || !fs.statSync(f).isFile()){ res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); res.end(fs.readFileSync(f));
  }).listen(0);
  const port = server.address().port;
  const b = await chromium.launch(CHROME ? { executablePath: CHROME } : {});
  const p = await (await b.newContext({ viewport: { width: 1400, height: 900 } })).newPage(); p.setDefaultTimeout(3600000);
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto(`http://localhost:${port}/index.html`, { waitUntil: 'load' });
  await p.waitForFunction(() => window.GTZA_READY === true);
  // 1.
  check('the engine worker started and answered', await p.evaluate(() => engineReady()), 'the page fell back to the main thread');
  // The page's own panel schedules would race these computations.
  await p.evaluate(() => { scheduleMC = scheduleAdequacy = scheduleCaptureCurve = () => {}; cancelPanels(); });
  const start = await p.evaluate(() => JSON.stringify(state));
  const states = [null, ...await p.evaluate(() => [...PRESET_ORDER.filter(n => n in PRESETS), ...Object.keys(PRESETS).filter(n => !PRESET_ORDER.includes(n))])];
  for (const n of states){
    const label = n || 'Start-up';
    const r = await p.evaluate(async ([n, start, panels]) => {
      const S0 = JSON.parse(start); Object.assign(state, S0); for (const k of Object.keys(state)) if (!(k in S0)) delete state[k];
      if (n) applyState(PRESETS[n]);
      const J = v => JSON.stringify(v, (k, x) => ArrayBuffer.isView(x) ? Array.from(x) : (typeof x === 'number' && !Number.isFinite(x) ? String(x) : x));
      const firstDiff = (a, b) => { let i = 0; while (i < a.length && a[i] === b[i]) i++; return i < Math.max(a.length, b.length) ? a.slice(Math.max(0, i - 60), i + 60) + '  |  ' + b.slice(Math.max(0, i - 60), i + 60) : ''; };
      const out = {};
      const w = J(await engineCall('simulate', { u: JSON.parse(JSON.stringify(state)), prof: 'PROFILES' })), m = J(simulate(state, PROFILES));
      out.simulate = w === m ? '' : firstDiff(w, m);
      if (panels) for (const f of ['mcDraws', 'adequacyDraws', 'captureCurve']){
        const a = J(await engineCall(f, null, false)), c = J(await window[f](() => true));
        out[f] = a === c ? '' : firstDiff(a, c);
      }
      return out;
    }, [n, start, !QUICK || n === 'Today 2026']);
    // 2. and 3.
    for (const [k, d] of Object.entries(r)) check(`[${label}] ${k}: worker and page identical`, d === '', d);
  }
  check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close(); server.close();
  console.log(`\n${pass}/${pass + fail} worker checks passed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
