// RENDERED TEXT for audit.py's caption-tone check (user, 16 Oct 2026, message 156 item 26). Loads the page in jsdom with its own
// start-up run, opens every <details>, runs the curtailment and capture price forecasts, and prints JSON {text, titles}: the
// body's text and every title attribute, so text built at run time is covered as well as the source's static text.
//   node render_text.js testroot
const fs = require('fs'), path = require('path'); const { JSDOM, VirtualConsole } = require('jsdom');
const ROOT = process.argv[2] || 'testroot';
(async () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true,
    virtualConsole: new VirtualConsole(),   // the page's own console output stays out of the JSON
    url: 'file://' + path.resolve(ROOT) + '/index.html',
    beforeParse(w){
      w.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: () => () => ({ addColorStop(){}, data: [], width: 0, measureText: () => ({ width: 10 }) }) });
      const ch = () => new Proxy(function(){ return ch(); }, { get: () => ch() }); w.L = new Proxy({}, { get(){ return function(){ return ch(); }; } });
      w.onerror = () => {}; Object.defineProperty(w.history, 'replaceState', { value: () => {}, writable: true });
      w.URL.createObjectURL = () => 'blob:x'; w.Worker = function(){ this.postMessage = () => {}; };
      w.fetch = async u => { try { const f = String(u).split('?')[0].replace(/^file:.*?\/(?=nodal\/|profiles|config|public_data)/, '');
        const t = fs.readFileSync(path.join(path.resolve(ROOT), f), 'utf8'); return { ok: true, json: async () => JSON.parse(t), text: async () => t }; }
        catch (e) { return { ok: false, json: async () => null, text: async () => '' }; } };
    } });
  const w = dom.window; const t0 = Date.now();
  while (!w.GTZA_READY && Date.now() - t0 < 120000) await new Promise(r => setTimeout(r, 500));
  await new Promise(r => setTimeout(r, 3000));
  const run = name => { try { if (typeof w[name] === 'function') w[name](); } catch (e) { /* a forecast that cannot run here leaves its text out */ } };
  run('renderCurtailmentForecast'); run('runCaptureForecast');
  await new Promise(r => setTimeout(r, 4000));
  w.document.querySelectorAll('details').forEach(d => d.open = true);
  // Text nodes only, outside script, style and template elements.
  const walk = w.document.createTreeWalker(w.document.body, 4 /* NodeFilter.SHOW_TEXT */), parts = [];
  for (let n = walk.nextNode(); n; n = walk.nextNode()){
    if (n.parentElement && n.parentElement.closest('script,style,template,noscript')) continue;
    parts.push(n.nodeValue);
  }
  const text = parts.join(' ').replace(/\s+/g, ' ');
  const titles = [...w.document.querySelectorAll('[title]')].map(e => e.getAttribute('title'));
  // Exit only once the write has flushed: to a pipe it is asynchronous, and an early exit truncates the JSON.
  process.stdout.write(JSON.stringify({ ready: !!w.GTZA_READY, text, titles }), () => process.exit(0));
})().catch(e => { process.stdout.write(JSON.stringify({ error: e.message }), () => process.exit(1)); });
