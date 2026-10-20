#!/usr/bin/env node
/**
 * validate_links.js: a link or a reload computes exactly what a click computes (user, 20 Oct 2026, message 263 (1)).
 *
 * On main 38edbbb a link with new wind (?newWindMW=1000) never computed: the page ran the link's scenario before the wind
 * files loaded, the run threw, and the throw stopped the page's start-up. A link also carried slider values only, so a 2035
 * preset reopened at 2026. Each case below loads the page afresh in jsdom, waits for every start-up file (GTZA_READY), and
 * compares the scenario (every key of state) and the main result (every number of simulate's output, hashed) with the same
 * scenario reached by clicking on a fresh start-up page:
 *   1. ?preset=<name> for every preset, against clicking that preset;
 *   2. a reload after each preset click (the address the click leaves), against the click;
 *   3. a preset, then one slider moved, then a reload, against the same two steps by hand;
 *   4. ?newWindMW=1000 and ?newPvMW=1000 compute, and equal the start-up page with that slider moved.
 * About 5 minutes.
 *
 *   node validate_links.js [root]
 */
const fs = require('fs'), path = require('path');
const { JSDOM, requestInterceptor } = require('jsdom');
const ROOT = path.resolve(process.argv[2] || 'testroot');

let pass = 0, fail = 0;
const check = (name, ok, detail) => { if (ok) pass++; else fail++; console.log((ok ? '  ok   ' : '  FAIL ') + name + (ok || !detail ? '' : '  -  ' + detail)); };
// An http address (jsdom refuses history.replaceState on file: pages, and the page writes the address on every run); the
// files are read from the repository.
const BASE = 'http://localhost/';
const rel = u => decodeURIComponent(String(u && u.url || u).split('?')[0]).replace(BASE, '').replace(/^\.?\//, '');
// The page's own script files, from the repository; anything on another site (the map library and the like) is left out,
// as the other harnesses run without it.
const local = {
  interceptors: [requestInterceptor(request => {
    if (!request.url.startsWith(BASE)) return new Response('', { status: 404 });
    try { return new Response(fs.readFileSync(path.join(ROOT, rel(request.url))), { status: 200, headers: { 'Content-Type': 'text/javascript' } }); }
    catch (e) { return new Response('', { status: 404 }); }
  })],
};

// A fresh page at index.html plus the query, with every start-up file settled.
async function load(query){
  const errors = [];
  const dom = new JSDOM(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), {
    runScripts: 'dangerously', resources: local, pretendToBeVisual: true,
    url: BASE + 'index.html' + (query || ''),
    beforeParse(w){
      w.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: () => () => ({ addColorStop(){}, data: [], width: 0 }) });
      const ch = () => new Proxy(function(){ return ch(); }, { get: () => ch() });
      w.L = new Proxy({}, { get(){ return function(){ return ch(); }; } });
      w.addEventListener('error', e => errors.push(String(e.error && e.error.message || e.message)));
      w.URL.createObjectURL = () => 'blob:x';
      w.Worker = function(){ this.postMessage = () => {}; };
      w.fetch = async u => { try { return new Response(fs.readFileSync(path.join(ROOT, rel(u)), 'utf8'), { status: 200 }); }
                            catch (e) { return new Response('', { status: 404 }); } };
    },
  });
  const w = dom.window, t0 = Date.now();
  while (!(w.GTZA_READY && w.lastRes) && Date.now() - t0 < 180000) await new Promise(r => setTimeout(r, 25));
  // The page's own panel runs are not part of this check.
  if (w.GTZA_READY) w.eval('scheduleMC = scheduleAdequacy = scheduleCaptureCurve = () => {}; cancelPanels();');
  return { w, dom, errors, ready: !!(w.GTZA_READY && w.lastRes) };
}
// The scenario and the main result, as text that differs if any key or any number differs.
const snap = w => w.eval(`JSON.stringify({ state: Object.fromEntries(Object.keys(state).sort().map(k => [k, state[k]])),
  result: gtzaHash(JSON.stringify(simulate(state, PROFILES), (k, v) => ArrayBuffer.isView(v) ? Array.from(v) : (typeof v === 'number' && !Number.isFinite(v) ? String(v) : v))) })`);
const firstDiff = (a, b) => { const A = JSON.parse(a), B = JSON.parse(b);
  const ks = [...new Set([...Object.keys(A.state), ...Object.keys(B.state)])].filter(k => JSON.stringify(A.state[k]) !== JSON.stringify(B.state[k]));
  return (ks.length ? 'state ' + ks.slice(0, 4).map(k => k + ' ' + JSON.stringify(A.state[k]) + ' against ' + JSON.stringify(B.state[k])).join(', ') : '')
       + (A.result !== B.result ? ' result differs' : ''); };
// A click on the preset's button, as a visitor makes it, then the run the click schedules.
const click = (w, name) => w.eval(`(function(){ const b = Array.from(presetsEl.querySelectorAll('button')).find(x => x.dataset.preset === ${JSON.stringify(name)});
  b.click(); run(); return location.search; })()`);
const moveSlider = (w, id, v) => w.eval(`(function(){ const el = document.getElementById('in_${id}'); el.value = ${v};
  el.dispatchEvent(new window.Event('input', { bubbles: true })); run(); return location.search; })()`);

(async () => {
  const home = await load('');
  check('the start-up page computes', home.ready, home.errors.join(' | '));
  const presets = home.w.eval('JSON.stringify([...PRESET_ORDER.filter(n => n in PRESETS), ...Object.keys(PRESETS).filter(n => !PRESET_ORDER.includes(n))])');
  home.dom.window.close();
  for (const name of JSON.parse(presets)){
    const a = await load('');
    const search = click(a.w, name), byClick = snap(a.w);
    a.dom.window.close();
    // 1.
    const b = await load('?preset=' + encodeURIComponent(name));
    check(`[${name}] ?preset= link computes`, b.ready, b.errors.join(' | '));
    if (b.ready){ const s = snap(b.w); check(`[${name}] ?preset= link equals the click`, s === byClick, firstDiff(s, byClick)); }
    b.dom.window.close();
    // 2.
    check(`[${name}] the click leaves the preset in the address`, new URLSearchParams(search).get('preset') === name, search);
    const c = await load(search);
    check(`[${name}] reload after the click computes`, c.ready, c.errors.join(' | '));
    if (c.ready){ const s = snap(c.w); check(`[${name}] reload after the click equals the click`, s === byClick, firstDiff(s, byClick)); }
    c.dom.window.close();
  }
  // 3. A preset, then a slider: the link keeps the preset's year and settings, and the moved slider.
  {
    const name = 'IRP path 2035';
    const a = await load(''); click(a.w, name);
    const search = moveSlider(a.w, 'demandGrowthPct', 10), byHand = snap(a.w);
    a.dom.window.close();
    const c = await load(search);
    check(`[${name} then demand growth 10%] reload computes`, c.ready, c.errors.join(' | '));
    if (c.ready){
      const s = snap(c.w);
      check(`[${name} then demand growth 10%] reload equals the two steps by hand (${search})`, s === byHand, firstDiff(s, byHand));
      check(`[${name} then demand growth 10%] the reload is at 2035`, c.w.eval('state.scenarioYear') === 2035, String(c.w.eval('state.scenarioYear')));
    }
    c.dom.window.close();
  }
  // 4. New wind and new solar from a link, against the start-up page with the slider moved.
  for (const [id, v] of [['newWindMW', 1000], ['newPvMW', 1000]]){
    const a = await load(''); moveSlider(a.w, id, v); const byHand = snap(a.w); a.dom.window.close();
    const c = await load(`?${id}=${v}`);
    check(`?${id}=${v} computes`, c.ready, c.errors.join(' | '));
    if (c.ready){ const s = snap(c.w); check(`?${id}=${v} equals the start-up page with the slider moved`, s === byHand, firstDiff(s, byHand)); }
    c.dom.window.close();
  }
  console.log(`\n${pass}/${pass + fail} link checks passed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
