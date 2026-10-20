#!/usr/bin/env node
/**
 * validate_stored_panels.js: the stored risk panels (stored_panels.json) against a fresh computation (user, 19 Oct 2026,
 * messages 226, 242 and 251).
 *
 * The page shows the Monte Carlo risk panel, the adequacy board and the capture curve from stored_panels.json for each preset
 * and for the start-up state, instead of computing them, while its fingerprint (the page's scripts and its start-up engine
 * files, gtzaHash in the page's head) matches the one stored. This script computes them fresh with the page's own functions
 * (mcDraws, adequacyDraws, captureCurve) and the page's own key (panelKey), and checks:
 *   1. the stored file holds one entry for the start-up state and one for each preset, with every panel;
 *   2. the page's fingerprint equals the stored one, so a browser uses the stored panels;
 *   3. every file the page read, scripts included, is unchanged since the panels were stored (SHA-256), and the page read
 *      none that the stored list lacks;
 *   4. each stored panel equals the fresh computation to the digit (every number identical, Object.is);
 *   5. the page draws a stored panel exactly as it draws a fresh one: runAdequacy and runMC end to end (the risk panel
 *      and the board, as text, titles and classes), once from the store and once computing, and renderCaptureCurve;
 *   6. the main results do not depend on whether the weather years have loaded: on each state, simulate() gives an
 *      identical result before and after they load. With stored panels the weather years may never load on a visit;
 *   7. a scenario revisited in the same session (its main result from the session cache) draws the whole page exactly as a
 *      fresh run of it does. jsdom has no structuredClone, which the cache needs, so this script supplies one for plain
 *      objects, arrays and typed arrays; the page in a browser uses the browser's.
 * The browser and Node run the same JavaScript engine (V8). Other browsers may differ in the last bit of Math functions;
 * the panels round far above that.
 *
 *   node validate_stored_panels.js [root]            check
 *   node validate_stored_panels.js [root] --write    compute and write stored_panels.json (and check 6); then run the
 *                                                    check, which loads the page afresh so it reads the new file
 *
 * Rerun with --write after any change to index.html or to a file the panels read (check 3 names it). Takes about 10 to 20
 * minutes: 113 or more engine runs per state (60 Monte Carlo draws, 48 adequacy draws, five capture curve points; the IRP
 * presets repeat each run for the gas floor).
 */
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { JSDOM } = require('jsdom');
const ROOT = path.resolve(process.argv[2] || 'testroot');
const WRITE = process.argv.includes('--write');
const STORE = path.join(ROOT, 'stored_panels.json');

let pass = 0, fail = 0;
const check = (name, ok, detail) => { if (ok) pass++; else fail++; console.log((ok ? '  ok   ' : '  FAIL ') + name + (ok || !detail ? '' : '  -  ' + detail)); };
const sha = f => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, f))).digest('hex');
// The repository-relative path of a URL the page asked for.
const rel = u => decodeURIComponent(String(u && u.url || u).split('?')[0]).replace('file://' + ROOT + '/', '').replace(/^\.?\//, '');

// Where two strings first differ, with some context either side.
const firstSpot = (a, b) => { let i = 0; while (i < a.length && a[i] === b[i]) i++;
  return JSON.stringify(a.slice(Math.max(0, i - 50), i + 70)) + '\n      cache ' + JSON.stringify((b || '').slice(Math.max(0, i - 50), i + 70)); };
// Every number identical (Object.is, so -0 and NaN count), same keys, same order of array items.
function firstDiff(a, b, at = ''){
  if (typeof a === 'number' && typeof b === 'number') return Object.is(a, b) ? null : at + ': ' + a + ' against ' + b;
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return a === b ? null : at + ': ' + JSON.stringify(a) + ' against ' + JSON.stringify(b);
  if (Array.isArray(a) !== Array.isArray(b)) return at + ': array against object';
  const ka = Object.keys(a), kb = Object.keys(b);
  if (ka.join() !== kb.join()) return at + ': keys ' + ka.join(',') + ' against ' + kb.join(',');
  for (const k of ka){ const d = firstDiff(a[k], b[k], at + '.' + k); if (d) return d; }
  return null;
}

(async () => {
  const read = new Set();
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const dom = new JSDOM(html, {
    runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true,
    url: 'file://' + ROOT + '/index.html',
    beforeParse(w) {
      w.HTMLCanvasElement.prototype.getContext = () =>
        new Proxy({}, { get: () => () => ({ addColorStop() {}, data: [], width: 0 }) });
      const ch = () => new Proxy(function () { return ch(); }, { get: () => ch() });
      w.L = new Proxy({}, { get() { return function () { return ch(); }; } });
      w.onerror = () => {};
      Object.defineProperty(w.history, 'replaceState', { value: () => {}, writable: true });
      w.URL.createObjectURL = () => 'blob:x';
      w.Worker = function () { this.postMessage = () => {}; };
      w.eval(`window.structuredClone = function sc(v){ if (v === null || typeof v !== 'object') return v;
        if (ArrayBuffer.isView(v)) return new v.constructor(v); if (Array.isArray(v)) return v.map(sc);
        if (Object.getPrototypeOf(v) !== Object.prototype) throw new Error('not a plain object');
        const o = {}; for (const k of Object.keys(v)) o[k] = sc(v[k]); return o; };`);
      // Real Response objects, as a browser's fetch returns, so the page's fingerprint wrapper hashes the start-up files.
      w.fetch = async (u) => {
        const f = rel(u);
        try { const t = fs.readFileSync(path.join(ROOT, f), 'utf8'); read.add(f); return new Response(t, { status: 200 }); }
        catch (e) { return new Response('', { status: 404 }); }
      };
    },
  });
  const w = dom.window;
  const t0 = Date.now();
  while (!w.GTZA_READY && Date.now() - t0 < 180000) await new Promise(r => setTimeout(r, 20));
  if (!w.GTZA_READY){ console.log('  FAIL page never reached GTZA_READY'); process.exit(1); }
  // The page's own panel runs would race these computations: stop them, and keep run() from scheduling more.
  const ev = (code) => { const s = w.document.createElement('script'); s.textContent = code; w.document.body.appendChild(s); };
  ev(`scheduleMC = scheduleAdequacy = scheduleCaptureCurve = () => {}; clearTimeout(mcTimer); clearTimeout(adeqTimer);
      if (_capCurveTimer) clearTimeout(_capCurveTimer); cancelPanels();`);
  // Async page code, awaited from here.
  const call = async (code) => {
    const id = '__r' + Math.random().toString(36).slice(2);
    ev(`(async () => { try { window.${id} = { v: await (async () => { ${code} })() }; } catch (e) { window.${id} = { e: String(e && e.stack || e) }; } })();`);
    while (!w[id]) await new Promise(r => setTimeout(r, 25));
    const r = w[id]; delete w[id];
    if (r.e) throw new Error(r.e);
    return r.v;
  };

  const startState = await call(`return JSON.parse(JSON.stringify(state));`);
  const presets = await call(`return [...PRESET_ORDER.filter(n => n in PRESETS), ...Object.keys(PRESETS).filter(n => !PRESET_ORDER.includes(n))];`);
  const STATES = [{ label: 'Start-up', preset: null }, ...presets.map(p => ({ label: p, preset: p }))];
  // As a click does (applyState), then the main run; from the start-up state each time, so no state carries another's keys.
  const enter = (S) => `Object.assign(state, JSON.parse(${JSON.stringify(JSON.stringify(startState))}));
    for (const k of Object.keys(state)) if (!(k in ${JSON.stringify(startState)})) delete state[k];
    ${S.preset ? `applyState(PRESETS[${JSON.stringify(S.preset)}]);` : ''} run();`;
  const resultDigest = `const r = simulate(state, PROFILES);
    return gtzaHash(JSON.stringify(r, (k, v) => ArrayBuffer.isView(v) ? Array.from(v) : (typeof v === 'number' && !Number.isFinite(v) ? String(v) : v)));`;

  // 6, first half: every state's main result before the weather years load.
  const before = {};
  for (const S of STATES){
    const loaded = await call(`${enter(S)} return bldWeatherYears !== null;`);
    if (loaded){ check('the weather years are not loaded before the panels run', false, 'loaded before ' + S.label); break; }
    before[S.label] = await call(resultDigest);
  }
  await call(`return !!(await loadWeatherYears());`);

  // The panels as the page draws them: the risk panel and the board, as text, titles and classes.
  const drawnText = `const t = id => { const el = document.getElementById(id); return el ? el.textContent + ' | ' + el.title + ' | ' + el.className : null; };
    return ['riskTag', 'riskHead', 'shed', 'shedNums', 'riskNote', 'statusWord', 'bdShed', 'lamps'].map(t).join('\\n')
      + '\\n' + Array.from(document.querySelectorAll('.lamp'), l => l.className).join(',');`;
  // Fresh: through the page's own runners with the store and the session cache off, so the panels are computed and drawn
  // exactly as on a visit with no stored panel; the computed figures are then read from the session cache.
  const fresh = {}, freshText = {};
  for (const S of STATES){
    const t = Date.now();
    await call(enter(S));
    // 6, second half.
    const after = await call(resultDigest);
    check(`[${S.label}] main results identical before and after the weather years load`, after === before[S.label],
          before[S.label] + ' against ' + after);
    freshText[S.label] = await call(`PANEL_CACHE.clear(); _panelStore = Promise.resolve(null); await runAdequacy(); await runMC(); ${drawnText}`);
    fresh[S.label] = await call(`const key = panelKey(), c = PANEL_CACHE.get(key) || {};
      return { key, state: JSON.parse(JSON.stringify(state)), mc: c.mc || null, adequacy: c.adequacy || null, capCurve: await captureCurve(() => true) };`);
    console.log(`  ..   ${S.label}: computed in ${((Date.now() - t) / 1000).toFixed(0)} s`);
  }

  if (WRITE){
    const fp = await call(`return await pageFingerprint();`);
    const files = {};
    for (const f of [...[...read].filter(f => f !== 'stored_panels.json'), 'index.html', ...await call(`return Array.from(document.scripts).filter(s => s.hasAttribute('src') && !/^https?:/.test(s.getAttribute('src'))).map(s => s.getAttribute('src').split('?')[0]);`)].sort())
      if (fs.existsSync(path.join(ROOT, f))) files[f] = sha(f);
    const out = {
      meta: { build: await call(`return BUILD_STAMP;`), written: new Date().toISOString(), by: 'harness/validate_stored_panels.js --write',
              note: 'The risk panels for each preset and the start-up state, computed by the page\'s own code. The page uses an entry '
                  + 'only while its fingerprint equals this one; files lists the SHA-256 of every file the computation read, which '
                  + 'validate_stored_panels.js checks.' },
      fingerprint: fp, files,
      entries: STATES.map(S => ({ label: S.label, ...fresh[S.label] })),
    };
    fs.writeFileSync(STORE, JSON.stringify(out) + '\n');
    console.log(`  wrote ${path.relative(process.cwd(), STORE)} (${fs.statSync(STORE).size} bytes, fingerprint ${fp})`);
    console.log(`\n${pass}/${pass + fail} checks passed while writing; now run without --write`);
    process.exit(fail ? 1 : 0);
  }

  // 1.
  const st = fs.existsSync(STORE) ? JSON.parse(fs.readFileSync(STORE, 'utf8')) : null;
  check('stored_panels.json exists', !!st);
  if (!st){ console.log(`\n${pass}/${pass + fail} stored-panel checks passed`); process.exit(1); }
  const byLabel = Object.fromEntries((st.entries || []).map(e => [e.label, e]));
  const missing = STATES.filter(S => !byLabel[S.label] || !byLabel[S.label].mc || !byLabel[S.label].adequacy || !byLabel[S.label].capCurve);
  check('one entry per preset and for the start-up state, each with all three panels', missing.length === 0,
        'missing: ' + missing.map(S => S.label).join(', '));
  // 2.
  const fp = await call(`return await pageFingerprint();`);
  check('the page\'s fingerprint equals the stored one (a browser uses the stored panels)', fp === st.fingerprint,
        'page ' + fp + ', stored ' + st.fingerprint + ': rerun with --write');
  // 3.
  const changed = Object.keys(st.files || {}).filter(f => !fs.existsSync(path.join(ROOT, f)) || sha(f) !== st.files[f]);
  check('every file the panels were computed from is unchanged', changed.length === 0, changed.join(', ') + ': rerun with --write');
  const unlisted = [...read].filter(f => f !== 'stored_panels.json' && !(f in (st.files || {})));
  check('the page read no file the stored list lacks', unlisted.length === 0, unlisted.join(', '));

  for (const S of STATES){
    const e = byLabel[S.label], F = fresh[S.label];
    if (!e) continue;
    // 4.
    check(`[${S.label}] stored key is the page's key for this scenario`, e.key === F.key, e.key + ' against ' + F.key);
    for (const kind of ['mc', 'adequacy', 'capCurve']){
      const d = firstDiff(e[kind], F[kind], kind);
      check(`[${S.label}] stored ${kind} equals a fresh computation to the digit`, !d, d);
    }
    // 5. The same runners, from the store.
    await call(enter(S));
    const fromStore = await call(`PANEL_CACHE.clear(); _panelStore = null; await runAdequacy(); await runMC(); ${drawnText}`);
    const storeHit = await call(`const m = await panelStore(); return !!(m && m.get(panelKey()));`);
    const fromFresh = freshText[S.label];
    check(`[${S.label}] the page used the stored panels`, storeHit);
    check(`[${S.label}] risk panel and board drawn from the store match a fresh run`, fromStore === fromFresh,
          'differs:\n' + fromStore.split('\n').map((l, i) => l === fromFresh.split('\n')[i] ? '' : '      stored ' + l.slice(0, 160) + '\n      fresh  ' + fromFresh.split('\n')[i].slice(0, 160)).filter(Boolean).join('\n'));
    const curve = await call(`renderCaptureCurve(${JSON.stringify(e.capCurve)}); const a = document.getElementById('capCurveBody').innerHTML;
      renderCaptureCurve(${JSON.stringify(F.capCurve)}); return a === document.getElementById('capCurveBody').innerHTML;`);
    check(`[${S.label}] capture curve drawn from the store matches a fresh one`, curve);
    // 7. The page after start-up then this scenario, run fresh, then again with this scenario's result from the session cache.
    // Every element with an id, as text and title, so a difference names where it is.
    const page = `return Array.from(document.querySelectorAll('[id]'), e => [e.id, e.textContent + ' | ' + (e.title || '')]);`;
    const viaFresh = await call(`RES_CACHE.clear(); ${enter(STATES[0])} ${enter(S)} return [RES_CACHE.size, (() => { ${page} })()];`);
    const viaCache = await call(`${enter(STATES[0])} ${enter(S)} return [RES_CACHE.size, (() => { ${page} })()];`);
    const A = new Map(viaFresh[1]), B = new Map(viaCache[1]);
    const differ = [...A.keys()].filter(k => A.get(k) !== B.get(k));
    const at = differ.slice().sort((x, y) => A.get(x).length - A.get(y).length)[0];   // the innermost, as a rule
    check(`[${S.label}] a revisit drawn from the session cache matches a fresh run (whole page)`, viaFresh[0] > 0 && differ.length === 0,
          viaFresh[0] === 0 ? 'nothing was cached' : differ.length + ' elements differ, e.g. ' + differ.slice(0, 6).join(', ')
          + (at ? '\n      fresh ' + firstSpot(A.get(at), B.get(at)) : ''));
  }
  console.log(`\n${pass}/${pass + fail} stored-panel checks passed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
