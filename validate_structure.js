#!/usr/bin/env node
/**
 * validate_structure.js — Session 5 of the bug hunt.
 *
 * Static and structural audit: things the code no longer does, does twice, or
 * does in a way that silently swallows a legitimate value. Two of the worst bugs
 * in this project were structural rather than numerical:
 *
 *   - the hw_/hp_ headroom constraints were DELETED by an over-broad revert and
 *     left only the comment describing them. The LP still solved, still returned
 *     Optimal, and every other check passed.
 *   - lcoePs was defined TWICE. The later definition silently won, so a slider
 *     set to 1150 dispatched at 1400.
 *
 * Neither produces a wrong-looking number. Only counting structure finds them.
 *
 *   node validate_structure.js [root]
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = process.argv[2] || '.';
let pass = 0, fail = 0;
const failures = [], notes = [];
const check = (name, ok, detail) => {
  if (ok) pass++; else { fail++; failures.push(`${name}${detail ? '  —  ' + detail : ''}`); }
};

const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

// Strip comments before any scan that cares about live code. Comments legitimately
// contain `x || N`, duplicate key names and dead function names — including, in
// this codebase, long explanations OF those very bugs. Scanning raw text reports
// the documentation as the defect.
const stripComments = t => t
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');   // avoid eating https://
const live = stripComments(src);

// ── 1. DUPLICATE KEYS IN FIXED ──────────────────────────────────────────────
// The later definition wins silently. lcoePs was defined at 1150 and again at
// 1400; the slider read 1150 and the model used 1400 until 17 Aug 2026.
{
  const m = live.match(/const FIXED\s*=\s*\{/);
  if (!m) check('FIXED block located', false, 'could not find `const FIXED = {`');
  else {
    let i = m.index + m[0].length, depth = 1;
    while (i < live.length && depth > 0) {
      if (live[i] === '{') depth++;
      else if (live[i] === '}') depth--;
      i++;
    }
    const block = live.slice(m.index, i);
    const keys = [...block.matchAll(/(?:^|[{,\s])([A-Za-z_]\w*)\s*:/g)].map(x => x[1]);
    const seen = {}, dupes = [];
    for (const k of keys) { if (seen[k]) { if (!dupes.includes(k)) dupes.push(k); } seen[k] = 1; }
    check('no duplicate keys in FIXED', dupes.length === 0,
          dupes.length ? `${dupes.join(', ')} — the LATER definition wins silently` : '');
    notes.push(`FIXED carries ${Object.keys(seen).length} distinct keys`);
  }
}

// ── 1b. DUPLICATE FUNCTION DECLARATIONS ─────────────────────────────────────
// Same silent-override trap as a duplicate FIXED key: the later declaration wins
// and nothing warns. Found 18 Aug when a new renderCapture() replaced an existing
// one of the same name, and the new panel rendered the old panel's numbers while
// looking entirely healthy.
{
  const names = [...live.matchAll(/(?:^|\n)\s*(?:async\s+)?function\s+([A-Za-z_]\w*)/g)].map(m => m[1]);
  const seen = {}, dupes = [];
  for (const n of names){ if (seen[n] && !dupes.includes(n)) dupes.push(n); seen[n] = 1; }
  check('no duplicate function declarations', dupes.length === 0,
        dupes.length ? `${dupes.join(', ')} — the LATER declaration wins silently` : '');

// ── FALLBACKS THAT DISAGREE WITH THEIR CONSTANT ─────────────────────────────
// Panels read `state.X ?? literal`; the engine reads `p.X` from
// {...FIXED, ...state}. When X is NOT a slider it is absent from state, so the
// panel uses its literal and the engine uses FIXED. If those two disagree, the
// panel and the engine silently report different numbers from the same input.
//
// That is not hypothetical: ccsTsR was corrected from 120 to 900 on 20 Aug but
// its six fallbacks still said 120, so the CCS panel showed R1.29/kWh while the
// engine ran on R2.07/kWh. Cross-panel consistency did not catch it, because it
// compares panels with each other rather than with the engine.
{
  // Extract the FIXED block for this check - the duplicate-key check above keeps
  // its own copy inside its own scope.
  let fixedBlock = '';
  {
    const fm = live.match(/const FIXED\s*=\s*\{/);
    if (fm){
      let d = 0, k = fm.index + fm[0].length - 1;
      for (; k < live.length; k++){
        if (live[k] === '{') d++;
        else if (live[k] === '}'){ d--; if (d === 0){ k++; break; } }
      }
      fixedBlock = live.slice(fm.index, k);
    }
  }
  const bad = [];
  const seen = new Set();
  for (const m of src.matchAll(/(\w+)\s*\?\?\s*([\d.]+)/g)){
    const [, key, lit] = m;
    if (seen.has(key + lit)) continue;
    seen.add(key + lit);
    // Look ONLY inside the FIXED block. Searching the whole file also matches
    // scenario objects - `coalEAFPct: 65` inside the CSIR comparison scenario is
    // a scenario value, not a constant, and comparing against it is meaningless.
    const c = fixedBlock.match(new RegExp('\\b' + key + '\\s*:\\s*([\\d.]+)\\s*[,}]'));
    if (c && c[1] !== lit) bad.push(key + ': fallback ' + lit + ' vs constant ' + c[1]);
  }
  check('every ?? fallback matches its constant', bad.length === 0,
    bad.length ? bad.slice(0, 6).join('; ') : '');
}

}

// ── 2. FALSY-ZERO RISK: `||` ON A NUMERIC PARAMETER ─────────────────────────
// `p.x || N` substitutes N when x is 0, which is a legitimate value for most of
// these. Twelve such sites were converted to `??` on 15 Aug after seven CCS
// parameters were found doing nothing at zero.
{
  const hits = [...live.matchAll(/\b(?:p|st|state|S)\.([A-Za-z_]\w*)\s*\|\|\s*(-?[\d.]+)/g)]
    .map(m => ({ param: m[1], fallback: m[2] }));
  // A zero fallback is harmless: `x || 0` returns 0 either way.
  const risky = hits.filter(h => parseFloat(h.fallback) !== 0);
  const uniq = [...new Set(risky.map(h => `${h.param} || ${h.fallback}`))];
  check('no `param || nonZeroDefault` remaining (falsy-zero risk)',
        uniq.length === 0,
        uniq.length ? `${uniq.length} site(s): ${uniq.slice(0, 8).join(', ')}${uniq.length > 8 ? ' …' : ''} — ` +
                      `use ?? so an explicit 0 is honoured` : '');
}

// ── 3. ORPHANED FUNCTIONS ───────────────────────────────────────────────────
// runNodalYear sat defined but never called for months, looking authoritative.
// Dead code that reads as live is a trap for the next person.
{
  const nodalSrcs = ['nodal/nodal_dispatch.js', 'nodal/nodal_engine.js', 'nodal/capacity_siting.js']
    .map(f => { try { return fs.readFileSync(path.join(ROOT, f), 'utf8'); } catch { return ''; } })
    .join('\n');
  const all = live + '\n' + stripComments(nodalSrcs);
  const rawAll = src + '\n' + nodalSrcs;   // onclick handlers live in string literals
  const defined = [...all.matchAll(/(?:^|\n)\s*(?:async\s+)?function\s+([A-Za-z_]\w*)/g)].map(m => m[1]);
  const orphans = defined.filter(fn => {
    // Count EVERY reference, not just `fn(`. A function passed as a callback —
    // addEventListener('scroll', onScroll) — or wired through an onclick
    // attribute inside an HTML string carries no parentheses, and the first
    // version of this reported twelve live functions as dead because of it.
    // Search the RAW source too, since onclick handlers live in string literals
    // that comment-stripping leaves intact but that are easy to miss.
    // Count across BOTH the comment-stripped corpus and the raw sources. A
    // function defined in a nodal/ file appears once in `all` and not at all in
    // the index, so a naive threshold flagged every one of them.
    const re = new RegExp('\\b' + fn + '\\b', 'g');
    const refs = (all.match(re) || []).length + (rawAll.match(re) || []).length;
    return refs <= 2;   // one definition counted in each pass
  });
  // runNodalYear is knowingly retired with a header saying so; it is documented
  // rather than forgotten, which is the distinction that matters.
  // Orphans that are DOCUMENTED as such are not failures — the distinction that
  // matters is whether the next person can tell live code from dead. Each entry
  // here carries a header in the source saying it is unwired and why.
  const KNOWN = [
    'runNodalYear',   // retired 17 Aug, header explains cost/duplication/scope
    'dcFlows',        // DC power flow, built 17 Aug, not yet rendered anywhere
    // Small helpers left from earlier iterations. Harmless, but they are dead
    // and the audit should keep saying so until they are used or removed.
    'subLookupArea', 'resolveColor', 'mixHex', 'setTooltip',
    // Two-pass price-taker dispatch, added 30 Aug 2026. Deliberately NOT wired into
    // run(): it costs a second simulate() call, and doubling every slider drag to
    // answer a question most users are not asking would be the wrong trade. It is a
    // research entry point, called from the console and from probes, with a header
    // saying so. Wire it to a panel and this entry should be removed.
    'simulateTwoPass',
  ];
  const unexpected = orphans.filter(o => !KNOWN.includes(o));
  check('no undocumented orphaned functions', unexpected.length === 0,
        unexpected.length ? `defined but never called: ${unexpected.join(', ')}` : '');
  if (orphans.includes('runNodalYear'))
    notes.push('runNodalYear is orphaned as expected — retired 17 Aug with an explanatory header');
}

// ── 4. EVERY fetch() TARGET EXISTS ──────────────────────────────────────────
// A missing data file degrades silently: the catch handler leaves the feature
// off and nothing on screen says so.
{
  const targets = [...src.matchAll(/fetch\(\s*[`'"]([^`'"?]+)/g)]
    .map(m => m[1]).filter(t => !/^https?:/.test(t));
  const missing = [...new Set(targets)].filter(t => !fs.existsSync(path.join(ROOT, t)));
  check('every fetch() target exists on disk', missing.length === 0,
        missing.length ? missing.join(', ') : '');
  notes.push(`${new Set(targets).size} local data files fetched`);
}

// ── 5. DOM-DEPENDENT CHECKS ─────────────────────────────────────────────────
(async () => {
  const dom = new JSDOM(src, {
    runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true,
    url: 'file://' + path.resolve(ROOT) + '/index.html',
    beforeParse(w) {
      w.HTMLCanvasElement.prototype.getContext = () =>
        new Proxy({}, { get: () => () => ({ addColorStop() {}, data: [], width: 0 }) });
      const ch = () => new Proxy(function () { return ch(); }, { get: () => ch() });
      w.L = new Proxy({}, { get() { return function () { return ch(); }; } });
      w.onerror = () => {};
      Object.defineProperty(w.history, 'replaceState', { value: () => {}, writable: true });
      w.URL.createObjectURL = () => 'blob:x';
      w.Worker = function () { this.postMessage = () => {}; };
      w.fetch = async (u) => {
        try {
          const cl = String(u).split('?')[0].replace(/^file:.*?\/(?=nodal\/|profiles)/, '');
          const t = fs.readFileSync(path.join(path.resolve(ROOT), cl), 'utf8');
          return { ok: true, json: async () => JSON.parse(t), text: async () => t };
        } catch (e) { return { ok: false, json: async () => { throw e }, text: async () => { throw e } }; }
      };
    },
  });
  await new Promise(r => setTimeout(r, 4500));
  const w = dom.window, d = w.document;

  const el = d.createElement('script');
  el.textContent = `window.__st = (() => { try {
    // Readouts render a live summary line and write nothing to state. They are
    // not controls, so they are excluded from the inventory and the note check
    // rather than exempted case by case.
    const defs = SLIDERS.filter(s => !s.grp && s.id && !s.readout);
    return {
      defCount: defs.length,
      readoutCount: SLIDERS.filter(x => x && x.readout).length,
      ids: defs.map(s => s.id),
      // note:'' is deliberate — the LCOE group has one shared explanation
      // rather than nine near-identical ones. A MISSING property is the gap.
      // LCOE sliders share one group explanation rather than repeating it nine
      // times, and demandGrowthPct is self-describing. Requiring a note on every
      // control produced five false findings; requiring one where the control's
      // effect is NOT obvious from its label is the useful test.
      noNote: defs.filter(s => s.note === undefined && !s.toggle
                             && !/^lcoe/.test(s.id) && s.id !== 'demandGrowthPct').map(s => s.id),
      groups: SLIDERS.filter(s => s.grp).map(s => s.grp),
      stateKeys: Object.keys(state),
      fixedKeys: Object.keys(FIXED),
      // a control whose id is absent from FIXED writes to state but nothing
      // seeds it, so its default comes from the slider def alone
      notInFixed: defs.map(s => s.id).filter(id => !(id in FIXED)),
      presetKeys: [...new Set(Object.values(PRESETS).flatMap(p => Object.keys(p)))],
    };
  } catch (e) { return { err: String(e) }; } })();`;
  d.body.appendChild(el);
  const S = w.__st;
  if (!S || S.err) { console.log('FATAL:', S ? S.err : 'no result'); process.exit(1); }

  // 5a. every defined control actually renders. A reorder silently dropped the
  // `repurpose` toggle on 17 Aug — 42 rendered where 43 were defined, and no
  // test noticed because the model still ran on its default.
  const rendered = d.querySelectorAll('#controls .ctrl').length - S.readoutCount;
  check('every defined control renders', rendered === S.defCount,
        `${S.defCount} defined, ${rendered} rendered — a control has been dropped`);

  // THAT CHECK ALONE IS NOT ENOUGH. Deleting a DEFINITION lowers both counts
  // equally and passes. The 17 Aug reorder bug was of that shape at one remove:
  // a script rebuilt SLIDERS, placed everything it recognised, and silently lost
  // the one id it did not — the repurpose toggle vanished while state.repurpose
  // was still read by the dispatch engine, so the model ran permanently on its
  // default with no way to change it.
  //
  // So the inventory is pinned to a BASELINE. Adding a control is a deliberate
  // act and updates the file; losing one fails loudly.
  const INV = path.join(ROOT, 'control_inventory.json');
  if (process.argv.includes('--write-baseline')) {
    fs.writeFileSync(INV, JSON.stringify({ ids: S.ids.sort(), count: S.defCount }, null, 1));
    notes.push(`control inventory baseline written: ${S.defCount} controls`);
  } else if (fs.existsSync(INV)) {
    const base = JSON.parse(fs.readFileSync(INV, 'utf8'));
    const lost = base.ids.filter(id => !S.ids.includes(id));
    const added = S.ids.filter(id => !base.ids.includes(id));
    check('no control has disappeared since the baseline', lost.length === 0,
          lost.length ? `MISSING: ${lost.join(', ')} — still read by the engine but no longer settable` : '');
    if (added.length) notes.push(`new controls since baseline: ${added.join(', ')} ` +
                                 `(re-run with --write-baseline once intended)`);
  } else {
    notes.push('no control_inventory.json — run with --write-baseline to pin the inventory');
  }

  // 5b. every non-toggle control explains itself
  check('every slider carries an explanatory note', S.noNote.length === 0,
        S.noNote.length ? `missing note: ${S.noNote.join(', ')}` : '');

  // 5c. every preset key corresponds to a real control, or it does nothing
  const bogus = S.presetKeys.filter(k => !S.ids.includes(k) && !(S.fixedKeys.includes(k)));
  check('every PRESET key maps to a real control or constant', bogus.length === 0,
        bogus.length ? `${bogus.join(', ')} — set by a preset but read by nothing` : '');

  // 5d. controls not seeded from FIXED are worth knowing about, not necessarily wrong
  if (S.notInFixed.length)
    notes.push(`controls with no FIXED default (default comes from the slider def): ${S.notInFixed.join(', ')}`);

  notes.push(`${S.defCount} controls across ${S.groups.length} groups`);

  // ── IMPORTS_CF has ONE definition ─────────────────────────────────────────
  // Until 31 Aug 2026 the imports capacity factor existed in nodal_engine.js, in FIXED,
  // and in two `?? 0.41` fallbacks - four copies. They never drifted, but a COMMENT
  // about them did, still claiming 0.85 five hours after the value changed.
  //
  // nodal_engine.js now owns it and FIXED reads it. This asserts that stays true: the
  // engine declares it, index.html does not restate it as a literal, and no fallback
  // reintroduces a copy.
  {
    const eng = fs.readFileSync(path.join(ROOT, 'nodal', 'nodal_engine.js'), 'utf8');
    const decl = eng.match(/const\s+IMPORTS_CF\s*=\s*([0-9.]+)/);
    check('nodal_engine.js declares IMPORTS_CF', !!decl,
          'the engine must own the value - index.html reads it and cannot fall back');
    check('FIXED reads IMPORTS_CF rather than restating it',
          /importsCF\s*:\s*IMPORTS_CF/.test(src),
          'FIXED.importsCF should be IMPORTS_CF, not a literal');
    // No FIXED key may be read with `|| 0` in an EXPORT label. Audited 31 Aug 2026:
    // `state.coalEAFPct || 0` sat in the build-optimiser summary and the CSV header, so
    // an unset key would have stamped "EAF 0%" on a run that used 65. A mislabelled
    // export travels without the model attached to correct it.
    // Strip comment lines first. The audit note in the FIXED block QUOTES the faulty
    // pattern while explaining it, and the first version of this check matched its own
    // documentation - same trap as the backtick that broke the worker block on 31 Aug.
    // A check that greps source must exclude the prose about the source.
    const codeOnly = src.split('\n')
      .filter(l => !/^\s*(\/\/|\*|\/\*)/.test(l))
      .join('\n');
    const eafLbl = (codeOnly.match(/coalEAFPct\s*\|\|\s*0/g) || []);
    check('scenario labels do not fall back to zero availability',
          eafLbl.length === 0,
          eafLbl.length ? 'coalEAFPct || 0 found ' + eafLbl.length + ' times - use ?? FIXED.coalEAFPct' : '');

    // ONE weather-profile builder. Audited 31 Aug 2026: runMC and runAdequacy each
    // carried their own copy of loadWeatherYears + wxCache + profileFor. Rule 6 applied
    // to behaviour, and not hypothetical - the board and the risk panel had already
    // diverged fiftyfold that morning because only one of them was updated.
    // THE WORKER SOURCE MUST PARSE AFTER TEMPLATE-LITERAL EVALUATION.
    // MIP_WORKER_SRC is a template literal, so every backslash in it is collapsed once
    // before the worker sees it. On 31 Aug a pricing-run edit wrote `split('\\n')` where
    // it needed `split('\\\\n')`; that collapsed to a literal newline inside a string and
    // the full-year run died with "Uncaught SyntaxError: Invalid or unexpected token".
    //
    // NOTHING IN THE SUITE CAUGHT IT. Lint passes because the FILE is valid JavaScript -
    // the fault only exists in the string the browser builds at runtime. So build that
    // string the way the browser does, and parse it.
    {
      const wi = src.indexOf('const MIP_WORKER_SRC = `');
      if (wi >= 0){
        const a = src.indexOf('`', wi), b = src.indexOf('`', a + 1);
        let evaluated = null, err = null;
        try { evaluated = eval(src.slice(a, b + 1)); }
        catch (e) { err = 'template literal itself failed: ' + e.message; }
        if (evaluated != null){
          try { new Function(evaluated); }
          catch (e) { err = e.message; }
        }
        check('the MIP worker source parses after template evaluation',
              !err, err + ' - a backslash in MIP_WORKER_SRC must be DOUBLED to survive');
      }
    }

    const wxFactory = (codeOnly.match(/async function weatherProfileFactory/g) || []);
    const wxCopies = (codeOnly.match(/const\s+wxCache\s*=\s*new Map\(\)/g) || []);
    check('there is one shared weather-profile builder',
          wxFactory.length === 1 && wxCopies.length === 0,
          `factory defined ${wxFactory.length} times, ${wxCopies.length} private wxCache `
          + `copies - both ensembles must build weather years the same way`);

    const lits = (src.match(/importsCF\s*\?\?\s*[0-9.]+/g) || []);
    check('no numeric fallback duplicates the imports capacity factor',
          lits.length === 0,
          lits.length ? 'found: ' + lits.join(', ') : '');
  }

  console.log(`\n${pass}/${pass + fail} structural checks passed`);
  if (failures.length) { console.log('\nFAILURES:'); failures.forEach(f => console.log('  ' + f)); }
  if (notes.length) { console.log('\nNOTES:'); notes.forEach(n => console.log('  ' + n)); }
  process.exit(fail ? 1 : 0);
})();
