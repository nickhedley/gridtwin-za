// The page's visible text, as a reader meets it on a fresh load (user, 19 Oct 2026, message 235 (2); shared from 25 Oct 2026, message
// 378, by validate_public_text.js and diff_public_text.js, so the check and the PR's visible-text diff read the same text).
// What is collected (the page opens on Today 2026):
//   - every text node in the document body outside script, style, noscript and template elements, collapsed and hidden panels
//     included (slider notes, the About text, tables, labels);
//   - the attributes a reader sees on hover or with a screen reader: title, placeholder, aria-label, alt;
//   - every preset caption (PRESET_DESC), shown under the preset buttons when one is clicked;
//   - each slider note whole (the <small> beside a control in #controls), for the word cap.
// Text written only after a later action (a build run, an export) is not collected.
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');
async function collectPublicText(ROOT){
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, url: 'file://' + path.resolve(ROOT) + '/index.html',
    beforeParse(w){ w.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: () => () => ({ addColorStop(){}, data: [], width: 0, measureText: () => ({ width: 10 }) }) });
      const ch = () => new Proxy(function(){ return ch(); }, { get: () => ch() }); w.L = new Proxy({}, { get(){ return function(){ return ch(); }; } });
      w.onerror = () => {}; Object.defineProperty(w.history, 'replaceState', { value: () => {}, writable: true }); w.URL.createObjectURL = () => 'blob:x'; w.Worker = function(){ this.postMessage = () => {}; };
      w.fetch = async (u) => { try { const cl = String(u).split('?')[0].replace(/^file:.*?\/(?=nodal\/|profiles|config|harness\/coal)/, ''); const t = fs.readFileSync(path.join(path.resolve(ROOT), cl), 'utf8');
        return { ok: true, json: async () => JSON.parse(t), text: async () => t }; } catch (e) { return { ok: false, json: async () => { throw e; }, text: async () => { throw e; } }; } }; } });
  const w = dom.window;
  for (let i = 0; i < 80 && !w.GTZA_READY; i++) await new Promise(r => setTimeout(r, 250));
  await new Promise(r => setTimeout(r, 3000));
  const doc = w.document;
  // Where a piece of text sits: the nearest element with an id, else the nearest heading or label before it.
  // A slider note sits beside its control, so the control's id is named when no ancestor has an id of its own.
  const where = el => { const ids = []; let ctl = null;
    for (let e = el; e && e !== doc.body; e = e.parentElement){
      if (!ids.length && !ctl && !e.id){ const c = e.querySelector('input[id],select[id]'); if (c) ctl = '#' + c.id; }
      if (e.id){ ids.push('#' + e.id); if (ids.length === 2) break; } }
    if (ctl) ids.unshift(ctl);
    return ids.length ? ids.reverse().join(' ') : (el ? el.tagName.toLowerCase() : 'body'); };
  const items = [];
  const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE']);
  const tw = doc.createTreeWalker(doc.body, w.NodeFilter.SHOW_TEXT);
  for (let n = tw.nextNode(); n; n = tw.nextNode()){
    let skip = false; for (let e = n.parentElement; e; e = e.parentElement) if (SKIP.has(e.tagName)){ skip = true; break; }
    const t = n.nodeValue.replace(/\s+/g, ' ').trim(); if (!skip && t) items.push({ src: 'text ' + where(n.parentElement), t });
  }
  for (const el of doc.body.querySelectorAll('[title],[placeholder],[aria-label],[alt]'))
    for (const a of ['title', 'placeholder', 'aria-label', 'alt']) { const v = el.getAttribute(a); if (v && v.trim()) items.push({ src: `${a} ${where(el)}`, t: v.replace(/\s+/g, ' ').trim() }); }
  const captions = JSON.parse(w.eval('JSON.stringify(Object.entries(PRESET_DESC))')).map(([k, v]) => ({ src: `caption '${k}'`, t: String(v).replace(/\s+/g, ' ').trim() }));
  for (const c of captions) items.push(c);
  const notes = [...doc.querySelectorAll('#controls small')].map(el => ({ src: 'note ' + where(el), t: el.textContent.replace(/\s+/g, ' ').trim() })).filter(n => n.t);
  return { items, captions, notes };
}
// Sentences of a piece of text, for the diff: split after . ! ? followed by a space and a capital or a digit.
const sentences = t => t.split(/(?<=[.!?])\s+(?=[A-Z0-9‘“(])/).map(s => s.trim()).filter(Boolean);
const words = t => (t.match(/\S+/g) || []).length;
module.exports = { collectPublicText, sentences, words };
