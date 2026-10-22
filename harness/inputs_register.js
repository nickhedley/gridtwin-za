#!/usr/bin/env node
// inputs_register.js <root> [--init | --add-missing]: the model's input register (user, 22 Oct 2026, messages 310, 312, 313).
//
// Every model input - FIXED, BLD_COST, BLD_FOM, BLD_LIFE, BLD_TARIFF, the page's other named constants, nodal_engine.js's
// constants and the data files the page reads - is listed with its live value (read from the page as it loads, in jsdom),
// the expression that sets it in the code, and what the hand-kept inputs_meta.json says about it: unit, rand year, basis,
// a pointer to its SOURCES.md entry (heading and page; the source text lives in SOURCES only), the date it was checked and
// its status. The script writes INPUTS.md from these; INPUTS.md is never edited by hand.
//
// Statuses (message 313; weakest first, the order 'derived' uses):
//   no recorded source            SOURCES has no entry for it (message 312 (b): never blank, never guessed)
//   not yet reviewed              the script cannot place it (a switch, a text setting, a value computed by a function)
//   benchmark only                set by hand: compared with a benchmark, not taken from a source
//   sourced (by name, unconfirmed) SOURCES names it, but the value there is not shown to match the code's value
//   sourced                       SOURCES names it and states the code's current value in the same entry
//   derived                       computed from other inputs: lists them and carries the weakest of their statuses
//
// --init writes inputs_meta.json from the code and SOURCES as they are today (an entry starts at the status they support,
// never higher). --add-missing adds entries for new inputs the same way and leaves existing entries alone. With neither,
// the script checks the register (validate_register.js runs the same checks) and writes INPUTS.md.
'use strict';
const fs = require('fs'), path = require('path');

const STATUS_ORDER = ['no recorded source', 'not yet reviewed', 'benchmark only', 'sourced (by name, unconfirmed)', 'sourced'];
const OBJECTS = ['FIXED', 'BLD_COST', 'BLD_FOM', 'BLD_LIFE', 'BLD_TARIFF'];

// ---------- source text: comments out, strings kept ----------
function stripComments(s) {
  let o = '', i = 0, q = null;
  while (i < s.length) {
    const c = s[i], d = s[i + 1];
    if (q) { o += c; if (c === '\\') { o += d || ''; i += 2; continue; } if (c === q) q = null; i++; continue; }
    if (c === '"' || c === "'" || c === '`') { q = c; o += c; i++; continue; }
    if (c === '/' && d === '/') { while (i < s.length && s[i] !== '\n') i++; continue; }
    if (c === '/' && d === '*') { i += 2; while (i < s.length && !(s[i] === '*' && s[i + 1] === '/')) i++; i += 2; continue; }
    o += c; i++;
  }
  return o;
}
// From position i, the text up to the first top-level stop character (',' ';' or a closing bracket at depth 0).
function scanExpr(s, i, stops) {
  let depth = 0, q = null, j = i;
  for (; j < s.length; j++) {
    const c = s[j];
    if (q) { if (c === '\\') { j++; continue; } if (c === q) q = null; continue; }
    if (c === '"' || c === "'" || c === '`') { q = c; continue; }
    if ('([{'.includes(c)) depth++;
    else if (')]}'.includes(c)) { if (depth === 0) break; depth--; }
    else if (depth === 0 && stops.includes(c)) break;
    else if (depth === 0 && c === '\n' && /^\s*(const|let|var|function)\b/.test(s.slice(j + 1, j + 40))) break;
  }
  return [s.slice(i, j).trim(), j];
}
// Top-level 'const NAME = expr[, NAME2 = expr2];' declarations whose names are upper case (the page's constants).
function topConsts(src) {
  const s = stripComments(src), out = {};
  const re = /^const\s+/gm; let m;
  while ((m = re.exec(s))) {
    let i = m.index + m[0].length;
    for (;;) {
      const nm = /^([A-Za-z_$][\w$]*)\s*=\s*/.exec(s.slice(i)); if (!nm) break;
      const [expr, j] = scanExpr(s, i + nm[0].length, ',;');
      if (/^[A-Z][A-Z0-9_]+$/.test(nm[1])) out[nm[1]] = expr;
      if (s[j] !== ',') break;
      i = j + 1; while (/\s/.test(s[i])) i++;
    }
  }
  return out;
}
// An object literal's members, flattened to 'a.b.c' -> expression text. Methods and getters are left out.
function objectMembers(text, prefix, out) {
  const t = text.trim(); if (!t.startsWith('{')) return out;
  let i = 1;
  while (i < t.length) {
    while (i < t.length && /[\s,]/.test(t[i])) i++;
    if (t[i] === '}' || i >= t.length) break;
    if (t.startsWith('...', i)) { const [, j] = scanExpr(t, i, ','); i = j + 1; continue; }
    const km = /^(?:get\s+|set\s+)?(['"]?)([\w$]+)\1\s*(\(|:)?/.exec(t.slice(i));
    if (!km) { const [, j] = scanExpr(t, i, ','); i = j + 1; continue; }
    if (km[3] === '(' || /^(get|set)\s/.test(km[0])) { // method or accessor: skip its body
      let j = i + km[0].length - 1; const [, k] = scanExpr(t, j, '{'); j = k; const [, e] = scanExpr(t, j + 1, ''); i = e + 1; continue; }
    if (km[3] !== ':') { const [, j] = scanExpr(t, i, ','); i = j + 1; continue; } // shorthand property
    const [expr, j] = scanExpr(t, i + km[0].length, ',');
    const key = prefix + km[2];
    if (/^\{/.test(expr)) objectMembers(expr, key + '.', out); else out[key] = expr;
    i = j + 1;
  }
  return out;
}

// ---------- the page, loaded as the harness loads it ----------
// The page loaded as validate_stored_panels.js loads it (canvas, map and worker stubbed), recording every file it reads.
async function loadPage(root) {
  const { JSDOM } = require(path.join(__dirname, 'node_modules', 'jsdom'));
  const ROOT = path.resolve(root), read = new Set();
  const rel = u => decodeURIComponent(String(u && u.url || u).split('?')[0]).replace('file://' + ROOT + '/', '').replace(/^\.?\//, '');
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const dom = new JSDOM(html, {
    runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, url: 'file://' + ROOT + '/index.html',
    beforeParse(w) {
      w.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: () => () => ({ addColorStop() {}, data: [], width: 0 }) });
      const ch = () => new Proxy(function () { return ch(); }, { get: () => ch() });
      w.L = new Proxy({}, { get() { return function () { return ch(); }; } });
      w.onerror = () => {};
      Object.defineProperty(w.history, 'replaceState', { value: () => {}, writable: true });
      w.URL.createObjectURL = () => 'blob:x';
      w.Worker = function () { this.postMessage = () => {}; };
      w.fetch = async (u) => { const f = rel(u);
        try { const t = fs.readFileSync(path.join(ROOT, f), 'utf8'); read.add(f); return new Response(t, { status: 200 }); }
        catch (e) { return new Response('', { status: 404 }); } };
    },
  });
  const w = dom.window, t0 = Date.now();
  while (!w.GTZA_READY && Date.now() - t0 < 180000) await new Promise(r => setTimeout(r, 20));
  if (!w.GTZA_READY) throw new Error('page never reached GTZA_READY');
  return { w, html, read };
}
const fmtVal = v => v === null || v === undefined ? String(v) : Array.isArray(v) ? `array of ${v.length}` : typeof v === 'object' ? 'object'
  : typeof v === 'number' ? String(+v.toPrecision(10)) : typeof v === 'string' ? JSON.stringify(v.length > 60 ? v.slice(0, 57) + '...' : v) : String(v);

// ---------- the inputs ----------
async function extract(root) {
  const { w, html, read } = await loadPage(root);
  const items = {};
  const get = p => { try { return w.eval(p.split('.').map((k, i) => i ? (/^\w+$/.test(k) ? '.' + k : `[${JSON.stringify(k)}]`) : k).join('')); } catch (e) { return undefined; } };
  const pageConsts = topConsts(html);
  for (const o of OBJECTS) {
    if (!(o in pageConsts)) throw new Error(o + ' not found in index.html');
    const mem = objectMembers(pageConsts[o], o + '.', {});
    for (const [id, expr] of Object.entries(mem)) {
      const v = get(id); if (typeof v === 'function') continue;
      items[id] = { id, where: 'index.html', expr, value: v };
    }
  }
  for (const [n, expr] of Object.entries(pageConsts)) {
    if (OBJECTS.includes(n)) continue;
    const v = get(n);
    if (typeof v === 'function' || /^(\(|function\b|async\b|[\w$]+\s*=>)/.test(expr) || /^new\s+(Map|Set|Worker|Promise)/.test(expr)) continue;
    if (v === undefined) continue;
    items[n] = { id: n, where: 'index.html', expr, value: v };
  }
  const nodalSrc = fs.readFileSync(path.join(root, 'nodal', 'nodal_engine.js'), 'utf8');
  for (const [n, expr] of Object.entries(topConsts(nodalSrc))) {
    if (items[n]) continue; const v = get(n);
    if (typeof v === 'function' || v === undefined || /^(\(|function\b|[\w$]+\s*=>)/.test(expr)) continue;
    items[n] = { id: n, where: 'nodal/nodal_engine.js', expr, value: v };
  }
  // The data files the page reads on start-up (each fetch recorded while it loaded).
  for (const f of [...read].sort()) if (!/\.(html|js)$/.test(f) && f !== 'stored_panels.json')
    items['file:' + f] = { id: 'file:' + f, where: f, expr: '(data file)', value: 'file' };
  w.close();
  return items;
}

// ---------- SOURCES ----------
function readSources(root) {
  const lines = fs.readFileSync(path.join(root, 'SOURCES.md'), 'utf8').split('\n');
  const heads = new Set(), paras = []; let head = '(before the first heading)', buf = [];
  const flush = () => { if (buf.length) paras.push({ head, text: buf.join('\n') }); buf = []; };
  for (const l of lines) {
    const h = /^(#{1,6})\s+(.*\S)\s*$/.exec(l);
    if (h) { flush(); head = h[2]; heads.add(head); continue; }
    if (!l.trim() || /^\s*[-*]\s/.test(l)) flush();
    if (l.trim()) buf.push(l);
  }
  flush();
  return { heads, paras };
}
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function namesFor(id) {
  if (id.startsWith('file:')) return [id.slice(5), path.basename(id.slice(5))];
  const parts = id.split('.'), n = [id];
  if (parts[0] === 'FIXED' && parts.length === 2) n.push(parts[1]);
  if (parts.length === 3) n.push(parts.slice(0, 2).join('.'));
  return n.filter(x => x.length >= 5);
}
function valueForms(v) {
  if (typeof v !== 'number' || !isFinite(v)) return [];
  const f = new Set(), add = x => { if (x && x !== '0') f.add(x); };
  add(String(v)); add(v.toLocaleString('en-US', { maximumFractionDigits: 6 }));
  if (Math.abs(v) < 1 && v !== 0) { const p = +(v * 100).toPrecision(8); add(p + '%'); add(p + ' %'); }
  return [...f];
}
// The script never marks an input 'sourced' by itself (message 313 (a)): SOURCES often quotes the model's own value in order
// to criticise it ('costImports 550 has no recorded source'), so a value found beside the name is only a lead, noted for a
// person to confirm. An entry that says the input has no source sets 'no recorded source', pointing to where it says so.
const NO_SOURCE = /no recorded source|no source recorded|unsourced|has no source|no source given|no stated source/i;
function sourcesFor(id, value, S) {
  const names = namesFor(id), hits = [];
  for (const p of S.paras) if (names.some(n => new RegExp('(^|[^\\w.])' + esc(n) + '(?![\\w])').test(p.text))) hits.push(p);
  if (!hits.length) return { status: 'no recorded source', sources: [] };
  const gap = hits.find(p => NO_SOURCE.test(p.text));
  if (gap) return { status: 'no recorded source', sources: [{ heading: gap.head, page: null }], note: 'SOURCES records the gap under this heading' };
  const forms = valueForms(value);
  const match = hits.find(p => forms.some(x => new RegExp('(^|[^\\d.,])' + esc(x) + '(?![\\d])').test(p.text)));
  const heads = [...new Set((match ? [match] : hits).map(p => p.head))].slice(0, 3);
  return { status: 'sourced (by name, unconfirmed)', sources: heads.map(h => ({ heading: h, page: null })),
    note: match ? 'the code value ' + value + ' appears in this SOURCES entry: confirm by hand to mark sourced' : null };
}
// ---------- classification ----------
function parentsOf(it, items) {
  const ids = new Set(), e = it.expr;
  for (const m of e.matchAll(/\b(FIXED|BLD_COST|BLD_FOM|BLD_LIFE|BLD_TARIFF)((?:\.[A-Za-z_$][\w$]*)+)/g)) {
    let p = m[1] + m[2]; while (p.includes('.') && !items[p]) p = p.slice(0, p.lastIndexOf('.'));
    if (items[p] && p !== it.id) ids.add(p);
    else for (const k of Object.keys(items)) if (k.startsWith(m[1] + m[2] + '.') && k !== it.id) ids.add(k);
  }
  for (const m of e.matchAll(/\b([A-Z][A-Z0-9_]{2,})\b/g)) if (items[m[1]] && m[1] !== it.id && !OBJECTS.includes(m[1])) ids.add(m[1]);
  return [...ids].sort();
}
const isLiteral = e => /^-?[\d_.]+(e-?\d+)?$/.test(e) || /^\[[\s\d.,e\-\[\]]*\]$/.test(e) || /^['"`][^'"`]*['"`]$/.test(e) || /^(true|false|null)$/.test(e);
function autoEntry(it, items, S) {
  const parents = parentsOf(it, items);
  const base = { unit: null, randYear: null, basis: null, checked: null, note: null };
  if (it.id.startsWith('file:')) { const s = sourcesFor(it.id, null, S); return { ...base, status: s.status, sources: s.sources, note: s.note || null }; }
  if (parents.length) return { ...base, status: 'derived', parents, sources: [] };
  if (typeof it.value === 'boolean' || typeof it.value === 'string' || !isLiteral(it.expr) && typeof it.value !== 'number')
    return { ...base, status: 'not yet reviewed', sources: [], note: typeof it.value === 'number' ? null : 'switch, text or structure: an input or not, to decide by hand' };
  if (!isLiteral(it.expr)) return { ...base, status: 'not yet reviewed', sources: [], note: 'computed in code (' + it.expr.slice(0, 60) + '), not from a registered input' };
  const s = sourcesFor(it.id, it.value, S);
  return { ...base, status: s.status, sources: s.sources, note: s.note || null };
}
// The status a derived input carries: the weakest of its parents', recursively (cycles read as 'not yet reviewed').
function effective(id, meta, seen = new Set()) {
  const m = meta[id]; if (!m) return 'not yet reviewed';
  if (m.status !== 'derived') return m.status;
  if (seen.has(id)) return 'not yet reviewed'; seen.add(id);
  const ps = (m.parents || []).map(p => effective(p, meta, new Set(seen)));
  if (!ps.length) return 'not yet reviewed';
  return ps.reduce((a, b) => STATUS_ORDER.indexOf(a) <= STATUS_ORDER.indexOf(b) ? a : b);
}

// ---------- checks ----------
function check(items, meta, S, baseline) {
  const errs = [], ids = Object.keys(items);
  for (const id of ids) if (!meta[id]) errs.push(`no register entry for ${id} (run node inputs_register.js testroot --add-missing, then review it)`);
  for (const [id, m] of Object.entries(meta)) {
    if (!items[id]) errs.push(`register entry ${id} names no input in the code (removed or renamed?)`);
    if (![...STATUS_ORDER, 'derived'].includes(m.status)) errs.push(`${id}: unknown status '${m.status}'`);
    for (const s of m.sources || []) if (!S.heads.has(s.heading)) errs.push(`${id}: points to SOURCES heading '${String(s.heading).slice(0, 80)}', which does not exist`);
    if ((m.status === 'sourced' || m.status === 'sourced (by name, unconfirmed)') && !(m.sources || []).length) errs.push(`${id}: status '${m.status}' with no SOURCES pointer`);
    if (m.status === 'derived') {
      if (!(m.parents || []).length) errs.push(`${id}: derived with no parents listed`);
      for (const p of m.parents || []) if (!meta[p]) errs.push(`${id}: parent ${p} has no register entry`);
    }
    if (m.status === 'sourced' && items[id] && 'confirmedValue' in m && typeof items[id].value === 'number' && items[id].value !== m.confirmedValue)
      errs.push(`${id}: sourced at ${m.confirmedValue}, the code now reads ${items[id].value}; recheck the source or change the status`);
  }
  const counts = countStatuses(meta);
  if (baseline) for (const k of ['not yet reviewed', 'no recorded source'])
    if ((counts.effective[k] || 0) > baseline[k]) errs.push(`${counts.effective[k]} inputs at '${k}' against the baseline's ${baseline[k]} (inputs_baseline.json; raising it needs the user's say-so)`);
  return { errs, counts };
}
function countStatuses(meta) {
  const direct = {}, eff = {};
  for (const id of Object.keys(meta)) { const m = meta[id]; direct[m.status] = (direct[m.status] || 0) + 1; const e = effective(id, meta); eff[e] = (eff[e] || 0) + 1; }
  return { direct, effective: eff };
}

// ---------- INPUTS.md ----------
function writeMd(root, items, meta, counts) {
  const cell = s => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
  const L = ['# Model inputs', '',
    'Generated by harness/inputs_register.js from index.html, nodal/nodal_engine.js, the data files the page reads and',
    'harness/inputs_meta.json (hand-kept). Do not edit this file; edit inputs_meta.json and rerun the script. Sources live in',
    'SOURCES.md; an entry here points to its heading. Statuses: see the script\'s header.', '',
    '| Status | Inputs (own status) | Inputs (derived counted at their weakest parent) |', '|---|---|---|'];
  for (const s of [...STATUS_ORDER].reverse().concat(['derived'])) L.push(`| ${s} | ${counts.direct[s] || 0} | ${s === 'derived' ? '-' : counts.effective[s] || 0} |`);
  L.push(`| total | ${Object.keys(meta).length} | |`, '');
  const groups = {};
  for (const id of Object.keys(items).sort()) { const g = id.startsWith('file:') ? 'Data files' : OBJECTS.find(o => id.startsWith(o + '.')) || (items[id].where === 'index.html' ? 'Other constants, index.html' : 'nodal_engine.js'); (groups[g] = groups[g] || []).push(id); }
  for (const g of [...OBJECTS, 'Other constants, index.html', 'nodal_engine.js', 'Data files']) {
    if (!groups[g]) continue;
    L.push(`## ${g}`, '', '| Input | Value | Unit | Rand year | Basis | Status | Parents / source (SOURCES heading, page) | Checked | Code |', '|---|---|---|---|---|---|---|---|---|');
    for (const id of groups[g]) {
      const it = items[id], m = meta[id] || {};
      const st = m.status === 'derived' ? `derived (weakest parent: ${effective(id, meta)})` : m.status;
      const src = m.status === 'derived' ? (m.parents || []).join(', ') : (m.sources || []).map(s => s.heading + (s.page ? ', p.' + s.page : '')).join('; ');
      L.push(`| ${cell(id)} | ${cell(fmtVal(it.value))} | ${cell(m.unit)} | ${cell(m.randYear)} | ${cell(m.basis)} | ${cell(st)}${m.note ? ' – ' + cell(m.note) : ''} | ${cell(src)} | ${cell(m.checked)} | \`${cell(it.expr.length > 50 ? it.expr.slice(0, 47) + '...' : it.expr)}\` |`);
    }
    L.push('');
  }
  return L.join('\n');
}

module.exports = { scanExpr, topConsts, extract, readSources, check, countStatuses, writeMd, effective, STATUS_ORDER };

if (require.main === module) (async () => {
  const root = path.resolve(process.argv[2] || 'testroot'), mode = process.argv[3] || '';
  const META = path.join(__dirname, 'inputs_meta.json'), BASE = path.join(__dirname, 'inputs_baseline.json');
  const items = await extract(root), S = readSources(root);
  let meta = fs.existsSync(META) ? JSON.parse(fs.readFileSync(META, 'utf8')) : null;
  if (mode === '--init' || mode === '--add-missing') {
    if (mode === '--init' && meta) throw new Error('inputs_meta.json exists; use --add-missing');
    meta = meta || {}; let added = 0;
    for (const id of Object.keys(items).sort()) if (!meta[id]) { meta[id] = autoEntry(items[id], items, S); added++; }
    const sorted = Object.fromEntries(Object.keys(meta).sort().map(k => [k, meta[k]]));
    fs.writeFileSync(META, JSON.stringify(sorted, null, 1) + '\n'); meta = sorted;
    console.log(`${added} entries added to inputs_meta.json`);
    if (mode === '--init' && !fs.existsSync(BASE)) { const c = countStatuses(meta).effective;
      fs.writeFileSync(BASE, JSON.stringify({ 'not yet reviewed': c['not yet reviewed'] || 0, 'no recorded source': c['no recorded source'] || 0,
        note: 'Ratchet for validate_register.js (user, 22 Oct 2026, message 313 (c)): the counts may fall; raising them needs the user\'s say-so in a message.' }, null, 1) + '\n'); }
  }
  if (!meta) throw new Error('no inputs_meta.json: run with --init first');
  const baseline = fs.existsSync(BASE) ? JSON.parse(fs.readFileSync(BASE, 'utf8')) : null;
  const { errs, counts } = check(items, meta, S, baseline);
  fs.writeFileSync(path.join(root, 'INPUTS.md'), writeMd(root, items, meta, counts) + '\n');
  console.log('inputs:', Object.keys(items).length, '| own status:', JSON.stringify(counts.direct), '| derived at weakest parent:', JSON.stringify(counts.effective));
  for (const e of errs.slice(0, 40)) console.log('  FAIL ' + e);
  if (errs.length > 40) console.log(`  ... and ${errs.length - 40} more`);
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
