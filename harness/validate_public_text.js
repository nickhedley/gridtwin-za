#!/usr/bin/env node
/**
 * validate_public_text.js: the page's visible text carries no internal labels (user, 19 Oct 2026, message 235 (2)).
 *
 * Readers cannot decode the project's own shorthand, so none of it may reach the page: run names (c5, c5a-c5z), sensitivity
 * names (s_...), 'the note', 'provisional until', message numbers, TODO and RESULTS.
 *
 * What is scanned, on a fresh load (the page opens on Today 2026):
 *   - every text node in the document body outside script, style, noscript and template elements, collapsed and hidden
 *     panels included (slider notes, the About text, tables, labels);
 *   - the attributes a reader sees on hover or with a screen reader: title, placeholder, aria-label, alt;
 *   - every preset caption (PRESET_DESC), shown under the preset buttons when one is clicked.
 * Text written only after a later action (a build run, an export) is not scanned.
 *
 * Each label is one check; a failing check lists every hit with where it sits.
 *
 *   node validate_public_text.js [root]
 */
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');
const ROOT = process.argv[2] || 'testroot';

const LABELS = [
  ['run names (c5, c5a-c5z)', /\bc5[a-z]?\b/],
  ['sensitivity names (s_...)', /\bs_[A-Za-z0-9]+/],
  ["'the note'", /\bthe note\b/i],
  ["'provisional until'", /\bprovisional until\b/i],
  ['message numbers', /\bmessages? \d+/i],
  ['TODO', /\bTODO\b/],
  ['RESULTS', /\bRESULTS\b/],
];

let npass = 0, nfail = 0; const fails = [];
function check(name, ok, detail){ if (ok) npass++; else { nfail++; fails.push(`  ${name}` + (detail ? `  -  ${detail}` : '')); } }

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, url: 'file://' + path.resolve(ROOT) + '/index.html',
  beforeParse(w){ w.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: () => () => ({ addColorStop(){}, data: [], width: 0, measureText: () => ({ width: 10 }) }) });
    const ch = () => new Proxy(function(){ return ch(); }, { get: () => ch() }); w.L = new Proxy({}, { get(){ return function(){ return ch(); }; } });
    w.onerror = () => {}; Object.defineProperty(w.history, 'replaceState', { value: () => {}, writable: true }); w.URL.createObjectURL = () => 'blob:x'; w.Worker = function(){ this.postMessage = () => {}; };
    w.fetch = async (u) => { try { const cl = String(u).split('?')[0].replace(/^file:.*?\/(?=nodal\/|profiles|config|harness\/coal)/, ''); const t = fs.readFileSync(path.join(path.resolve(ROOT), cl), 'utf8');
      return { ok: true, json: async () => JSON.parse(t), text: async () => t }; } catch (e) { return { ok: false, json: async () => { throw e; }, text: async () => { throw e; } }; } }; } });

(async () => {
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
  const desc = JSON.parse(w.eval('JSON.stringify(Object.entries(PRESET_DESC))'));
  for (const [k, v] of desc) items.push({ src: `caption '${k}'`, t: String(v) });
  console.log(`scanned: ${items.length} pieces of text (${desc.length} preset captions)`);
  check('the page loaded and has text to scan', items.length > 100 && desc.length > 0, `${items.length} pieces, ${desc.length} captions`);

  for (const [name, re] of LABELS){
    const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    // The same text shown in several places (a caption is also its button's title) is listed once, with every place.
    const hits = new Map();
    for (const it of items){ const m = it.t.match(g); if (!m) continue;
      const i = it.t.search(re), key = `[${[...new Set(m)].join(', ')}] ...${it.t.slice(Math.max(0, i - 60), i + 60)}...`;
      if (!hits.has(key)) hits.set(key, []); hits.get(key).push(it.src); }
    const n = [...hits.values()].reduce((a, b) => a + b.length, 0);
    console.log(`\n${name}: ${hits.size} distinct text${hits.size === 1 ? '' : 's'}, ${n} place${n === 1 ? '' : 's'}`);
    for (const [k, v] of hits) console.log(`  ${k}\n      in ${v.join('; ')}`);
    check(`visible text carries no ${name}`, hits.size === 0, `${hits.size} distinct text${hits.size === 1 ? '' : 's'}, listed above`);
  }
  console.log(`\n${npass}/${npass + nfail} public text checks pass`);
  if (fails.length){ console.log('\nFAILURES:'); fails.forEach(f => console.log(f)); }
  process.exit(nfail ? 1 : 0);
})();
