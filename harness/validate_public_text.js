#!/usr/bin/env node
/**
 * validate_public_text.js: the page's visible text carries no internal labels (user, 19 Oct 2026, message 235 (2)).
 *
 * Readers cannot decode the project's own shorthand, so none of it may reach the page: run names (c5, c5a-c5z), sensitivity
 * names (s_...), 'the note', 'provisional until', message numbers, TODO and RESULTS; and, from message 236 (5), change history
 * and provenance notes: 'Typed;', 'no source recorded', 'in the model since', 'until <date> 2026', and .json or .csv paths;
 * and, from message 241, a value that failed to reach its text: 'undefined', 'NaN' or 'null'.
 * Error messages that show only when a file fails to load are not on a fresh page, so they are not scanned (TODO 14gu lists
 * them). From message 377 (25 Oct 2026) Eskom Data Portal IDs are no longer exempt: the page cites 'Eskom data, analysis ours'. One sentence is exempt from one label
 * by its exact text (EXEMPT, with its reason); everything else on the page is held to every label.
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
  // Change history and provenance notes (message 236 (5)): what the page assumes now, not when or how it got there.
  ["'Typed;'", /\bTyped;/],
  ["'no source recorded'", /\bno source recorded\b/i],
  ["'in the model since'", /\bin the model since\b/i],
  ["'until <date> 2026'", /\buntil (?:\d{1,2} )?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.? 2026\b/i],
  ['.json or .csv paths', /[\w./-]+\.(?:json|csv)\b/i],
  // A value that failed to reach its text (message 241): a missing key or a failed sum prints as one of these.
  ["'undefined'", /\bundefined\b/],
  ["'NaN'", /\bNaN\b/],
  ["'null'", /\bnull\b/],
  // Internal identifiers and provenance (user, 25 Oct 2026, message 377 (a)): Eskom Data Portal IDs (the page cites data as 'Eskom
  // data, analysis ours' or by the dataset's public name; the IDs stay in SOURCES), code identifiers, and year-by-year provenance
  // lists in slider notes. camelCase needs two lower-case letters before its first capital, so units (kW, kWh) and place names
  // (eThekwini) pass.
  ['Eskom Data Portal IDs (ESK followed by digits)', /\bESK\d+\b/],
  ['code identifiers in camelCase', /\b[a-z]{2,}[A-Z][A-Za-z0-9]*\b/],
  ['code identifiers in CONSTANT_CASE', /\b[A-Z][A-Z0-9]*_[A-Z0-9_]+\b/],
  ['year-by-year provenance lists', /\d+(?:\.\d+)?% in 20\d\d\b.*?\d+(?:\.\d+)?% in 20\d\d\b.*?\d+(?:\.\d+)?% in 20\d\d\b/],
  // Stale, internal and tutorial wording (user, 28 Oct 2026, messages 470 (d) and 471 (n)): each was on the page at build 27f.
  ["'(no recorded source)'", /\(no recorded source\)/i],
  ["'Update these figures'", /\bUpdate these figures\b/i],
  ["'Read that carefully'", /\bRead that carefully\b/i],
  ["'Compare these carefully'", /\bCompare these carefully\b/i],
  ["'This is because'", /\bThis is because\b/],
  ["'no wholesale market' (SAWEM has traded inside Eskom since April 2026)", /\bno wholesale market\b/i],
  ["'smartest' (advice wording)", /\bsmartest\b/i],
  // Glitches (message 471 (m)): a label built for the first percentile, 'check the box in the Set the scenario box' (the page
  // splits that sentence across text nodes, so the check matches its opening), and a negative plant count in prose.
  ["'Top 0%'", /\bTop 0%/],
  ["'check the box in the'", /\bcheck the box in the\b/i],
  ['a negative MW count in prose', /(?:^|[^\w.])-\d[\d,]*(?:\.\d+)? MW of\b/],
];

// Exempt sentences, each by its exact text, for one label only, with the reason. The pattern itself stays as it is, so change
// history dated by month alone is still caught; an exemption that no longer matches the page fails its own check.
// The Mozal exports sentence (message 238 (1)) was exempt until the exports note was rewritten to the site-copy rule (message 378),
// 25 Oct 2026; the rewritten note says 'since February 2026', which the pattern does not catch.
const EXEMPT = [];

let npass = 0, nfail = 0; const fails = [];
function check(name, ok, detail){ if (ok) npass++; else { nfail++; fails.push(`  ${name}` + (detail ? `  -  ${detail}` : '')); } }

// The text itself comes from public_text_lib.js (message 378), so this check and diff_public_text.js read the same text.
const { collectPublicText, words } = require('./public_text_lib.js');
// SITE-COPY LENGTH (user, 25 Oct 2026, message 378 (b)): a slider note or a preset caption states the default and its basis in one
// or two sentences, about 40 words at most. Exemptions only with the user's written decision, recorded with its message.
const MAX_WORDS = 40;
const LONG_EXEMPT = [];

(async () => {
  const { items, captions: desc, notes } = await collectPublicText(ROOT);
  console.log(`scanned: ${items.length} pieces of text (${desc.length} preset captions)`);
  check('the page loaded and has text to scan', items.length > 100 && desc.length > 0, `${items.length} pieces, ${desc.length} captions`);

  for (const [name, re] of LABELS){
    const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    // The same text shown in several places (a caption is also its button's title) is listed once, with every place.
    const hits = new Map();
    const ex = EXEMPT.filter(e => e.label === name);
    for (const it of items){ const t = ex.reduce((x, e) => x.split(e.text).join(' '), it.t); const m = t.match(g); if (!m) continue;
      const i = t.search(re), key = `[${[...new Set(m)].join(', ')}] ...${t.slice(Math.max(0, i - 60), i + 60)}...`;
      if (!hits.has(key)) hits.set(key, []); hits.get(key).push(it.src); }
    const n = [...hits.values()].reduce((a, b) => a + b.length, 0);
    console.log(`\n${name}: ${hits.size} distinct text${hits.size === 1 ? '' : 's'}, ${n} place${n === 1 ? '' : 's'}`);
    for (const [k, v] of hits) console.log(`  ${k}\n      in ${v.join('; ')}`);
    check(`visible text carries no ${name}`, hits.size === 0, `${hits.size} distinct text${hits.size === 1 ? '' : 's'}, listed above`);
  }
  for (const [kind, list] of [['slider notes', notes], ['preset captions', desc]]){
    const long = list.filter(x => words(x.t) > MAX_WORDS && !LONG_EXEMPT.some(e => e.text === x.t));
    console.log(`\n${kind} over ${MAX_WORDS} words: ${long.length} of ${list.length}`);
    for (const x of long) console.log(`  ${words(x.t)} words, ${x.src}: ${x.t.slice(0, 120)}...`);
    check(`${kind} are at most about ${MAX_WORDS} words`, long.length === 0, `${long.length} of ${list.length}, listed above`);
  }
  for (const e of EXEMPT){
    const n = items.filter(it => it.t.includes(e.text)).length;
    console.log(`\nexempt from ${e.label} (${e.reason}): ${n} place${n === 1 ? '' : 's'}\n  ${e.text}`);
    check(`the exemption from ${e.label} still matches visible text`, n > 0, 'stale: remove it from EXEMPT or update its text');
  }
  console.log(`\n${npass}/${npass + nfail} public text checks pass`);
  if (fails.length){ console.log('\nFAILURES:'); fails.forEach(f => console.log(f)); }
  process.exit(nfail ? 1 : 0);
})();
