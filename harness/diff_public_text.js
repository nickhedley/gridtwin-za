#!/usr/bin/env node
/**
 * diff_public_text.js: the page's visible text before and after a change (user, 25 Oct 2026, message 378 (a)). Every pull request
 * that changes index.html, or any text the page shows, carries its output as a "Visible text changed" section; the advisor reviews
 * it before any merge line.
 *
 * Same scope as validate_public_text.js (public_text_lib.js): every text node on a fresh load, collapsed and hidden panels included,
 * the hover and screen-reader attributes, and every preset caption. The base is a git revision of this repository, extracted to a
 * temporary folder (git archive); the head is ROOT as it stands. Text is split into sentences; the output lists every sentence
 * added or changed (in the head, not in the base) and every sentence removed, each with where it sits, as Markdown.
 *
 *   node diff_public_text.js [root] --base <git revision, default origin/main> [--out <file.md>]
 */
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const { collectPublicText, sentences } = require('./public_text_lib.js');
const args = process.argv.slice(2), opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const ROOT = args.find(a => !a.startsWith('--') && a !== opt('--base') && a !== opt('--out')) || 'testroot';
const BASE = opt('--base') || 'origin/main', OUT = opt('--out');
(async () => {
  const repo = cp.execSync('git rev-parse --show-toplevel', { cwd: path.resolve(ROOT) }).toString().trim();
  const rev = cp.execSync(`git rev-parse --short ${BASE}`, { cwd: repo }).toString().trim();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gtza_base_'));
  cp.execSync(`git archive ${rev} | tar -x -C ${tmp}`, { cwd: repo, maxBuffer: 1 << 30 });
  const bag = items => { const m = new Map(); for (const it of items) for (const s of sentences(it.t)) { if (!m.has(s)) m.set(s, new Set()); m.get(s).add(it.src); } return m; };
  const before = bag((await collectPublicText(tmp)).items), after = bag((await collectPublicText(ROOT)).items);
  fs.rmSync(tmp, { recursive: true, force: true });
  const added = [...after].filter(([s]) => !before.has(s)), removed = [...before].filter(([s]) => !after.has(s));
  const L = [`## Visible text changed`, ``, `Base ${BASE} (${rev}) against the working tree; ${before.size} sentences before, ${after.size} after (harness/diff_public_text.js).`, ``,
    `### Added or changed (${added.length})`, ``, ...added.map(([s, w]) => `- ${s}  \n  _in ${[...w].slice(0, 3).join('; ')}${w.size > 3 ? ` and ${w.size - 3} more` : ''}_`), ``,
    `### Removed (${removed.length})`, ``, ...removed.map(([s, w]) => `- ${s}  \n  _was in ${[...w].slice(0, 3).join('; ')}${w.size > 3 ? ` and ${w.size - 3} more` : ''}_`)];
  const md = L.join('\n') + '\n';
  if (OUT) fs.writeFileSync(OUT, md); else process.stdout.write(md);
  console.error(`added or changed ${added.length}, removed ${removed.length}`);
  process.exit(0);
})();
