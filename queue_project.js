#!/usr/bin/env node
/**
 * queue_project.js — intake for renewable projects spotted in trade press
 *
 * WHY THIS EXISTS. Finding articles is easy; a Google Alert does it free. The
 * hard part is turning a press announcement into a data point you can trust,
 * because announcements are marketing documents. On 17 Aug 2026 a commissioning
 * story reported "more than 140 GWh a year" from a 50 MW solar plant — a 32 %
 * capacity factor, which is not physically credible in the Free State. Anyone
 * entering that figure unchecked would have poisoned the model.
 *
 * So this tool does the checking that a scraper cannot: it validates announced
 * figures against physics, classifies the bucket correctly, refuses duplicates,
 * and warns about double-counting before anything reaches the queue.
 *
 * USAGE
 *   node queue_project.js --name "Ummbila Emoyeni phase 1" --mw 155 --tech wind \
 *        --area Mpumalanga --cod "August 2026" --bucket private \
 *        --developer "Seriti Green" --gwh 480 --turbines 25 \
 *        --source "https://..." [--commit]
 *
 * Without --commit it reports and changes nothing. Always dry-run first.
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.env.GTZA_ROOT || '.';
const QUEUE = path.join(ROOT, 'nodal', 'supply_area_split_draft.json');
const CAP   = path.join(ROOT, 'nodal', 'regional_renewable_capacity.json');

// ── plausible capacity factors, from our own regional profiles ───────────────
// These are the ranges a South African project can actually achieve. An
// announcement outside them is a marketing figure, a different definition
// (DC vs AC), or an error — and in every case should not be used.
const CF_RANGE = {
  solar: { lo: 0.16, hi: 0.28, note: 'SA fixed-tilt ~21-23 %; single-axis tracking reaches 26-28 %' },
  wind:  { lo: 0.25, hi: 0.48, note: 'SA fleet ~32 %; a very good Eastern Cape site reaches mid-40s' },
  csp:   { lo: 0.25, hi: 0.55, note: 'depends entirely on storage hours' },
};
const REGIONS = ['Eastern Cape','Limpopo','Mpumalanga','Gauteng','Western Cape',
                 'Northern Cape','Hydra Central','Kwazulu Natal','North West','Free State'];

function arg(k, d) {
  const i = process.argv.indexOf('--' + k);
  return i > -1 && process.argv[i+1] && !process.argv[i+1].startsWith('--')
    ? process.argv[i+1] : d;
}
const has = k => process.argv.includes('--' + k);

const p = {
  name:      arg('name'),
  mw:        parseFloat(arg('mw')),
  tech:      (arg('tech') || '').toLowerCase(),
  area:      arg('area'),
  cod:       arg('cod'),
  bucket:    (arg('bucket') || 'private').toLowerCase(),
  developer: arg('developer'),
  gwh:       arg('gwh') ? parseFloat(arg('gwh')) : null,
  turbines:  arg('turbines') ? parseInt(arg('turbines')) : null,
  panels:    arg('panels') ? parseInt(arg('panels')) : null,
  source:    arg('source'),
};

const problems = [], warnings = [], notes = [];

// ── 1. required fields ──────────────────────────────────────────────────────
if (!p.name) problems.push('--name is required');
if (!(p.mw > 0)) problems.push('--mw must be a positive number');
if (!['solar','wind','csp','battery'].includes(p.tech))
  problems.push('--tech must be solar, wind, csp or battery');
if (!REGIONS.includes(p.area))
  problems.push(`--area must be one of: ${REGIONS.join(', ')}`);
if (!p.cod) problems.push('--cod is required, e.g. "August 2026"');
if (!['private','reipppp'].includes(p.bucket))
  problems.push('--bucket must be private (wheeled/PPA) or reipppp (public programme)');
if (!p.source) warnings.push('No --source URL given. Record where this came from.');

// ── 2. THE CAPACITY FACTOR CHECK — the reason this tool exists ──────────────
if (p.gwh && p.mw > 0 && CF_RANGE[p.tech]) {
  const cf = (p.gwh * 1000) / (p.mw * 8760);
  const R = CF_RANGE[p.tech];
  const pct = (cf * 100).toFixed(1);
  if (cf > R.hi) {
    warnings.push(
      `ANNOUNCED ENERGY IS NOT CREDIBLE. ${p.gwh} GWh over ${p.mw} MW implies a ${pct} % ` +
      `capacity factor. ${R.note}. Use the NAMEPLATE, not the announced energy — and treat ` +
      `other figures in the same announcement with suspicion.`);
  } else if (cf < R.lo) {
    warnings.push(
      `Announced energy looks LOW: ${pct} % capacity factor. ${R.note}. Possibly a part-year ` +
      `figure, or the plant is phased — check what period the number covers.`);
  } else {
    notes.push(`Announced energy checks out: ${pct} % capacity factor, within the plausible range.`);
  }
}

// ── 3. equipment sanity ─────────────────────────────────────────────────────
if (p.turbines && p.mw) {
  const per = p.mw / p.turbines;
  if (per < 1.5 || per > 8)
    warnings.push(`${p.turbines} turbines for ${p.mw} MW implies ${per.toFixed(1)} MW machines — ` +
                  `outside the 1.5-8 MW range of plausible modern units. Check the phase boundary.`);
  else notes.push(`${p.turbines} turbines implies ${per.toFixed(1)} MW machines — plausible.`);
}
if (p.panels && p.mw) {
  const w = (p.mw * 1e6) / p.panels;
  if (w < 250 || w > 800)
    warnings.push(`${p.panels} panels for ${p.mw} MW implies ${w.toFixed(0)} W panels — outside ` +
                  `the plausible 250-800 W range. The MW figure may be AC while panels are DC.`);
  else notes.push(`${p.panels} panels implies ${w.toFixed(0)} W each — plausible.`);
}

// ── 4. bucket classification, which decides everything downstream ───────────
if (p.bucket === 'private') {
  notes.push('PRIVATE/WHEELED: goes to by_source.private. Eskom does NOT meter this plant, so ' +
             'it will not appear in the weekly report and does not affect the Eskom reconciliation.');
} else {
  notes.push('REIPPPP: goes to by_source.reipppp and DOES feed the Eskom weekly reconciliation.');
}

// ── 5. duplicate and double-count checks ────────────────────────────────────
let split = null, cap = null;
try { split = JSON.parse(fs.readFileSync(QUEUE, 'utf8')); }
catch (e) { problems.push(`Cannot read ${QUEUE} — run from the repo root or set GTZA_ROOT.`); }
try { cap = JSON.parse(fs.readFileSync(CAP, 'utf8')); } catch (e) {}

if (split) {
  const q = split.pending_next_quarterly || [];
  const norm = s => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
  const dup = q.find(x => norm(x.name) === norm(p.name));
  if (dup) problems.push(`ALREADY QUEUED: "${dup.name}" (${dup.mw} MW, COD ${dup.cod}).`);

  if (cap && cap.meta && cap.meta.as_at) {
    const asAt = new Date(cap.meta.as_at);
    const d = new Date(p.cod + (/\d{4}$/.test(p.cod || '') ? ' 01' : ''));
    if (!isNaN(d) && d <= asAt)
      problems.push(
        `DOUBLE-COUNT RISK: COD ${p.cod} is on or before the capacity file date ` +
        `(${cap.meta.as_at}), so the source should already include this project. ` +
        `Verify before queuing — adding it would count it twice.`);
  }
}

// ── report ──────────────────────────────────────────────────────────────────
console.log(`\n  ${p.name || '(unnamed)'}  ${p.mw || '?'} MW ${p.tech || '?'}, ${p.area || '?'}`);
console.log(`  COD ${p.cod || '?'} · ${p.bucket} · ${p.developer || 'developer not given'}\n`);
notes.forEach(n => console.log('  ok    ' + n));
warnings.forEach(w => console.log('  WARN  ' + w));
problems.forEach(e => console.log('  FAIL  ' + e));

if (problems.length) {
  console.log('\n  Not queued. Fix the above and re-run.\n');
  process.exit(1);
}

if (!has('commit')) {
  console.log('\n  Dry run — nothing written. Re-run with --commit to add to the queue.\n');
  process.exit(0);
}

const entry = {
  name: p.name, mw: p.mw, tech: p.tech, area: p.area, cod: p.cod,
  bucket: p.bucket,
  ...(p.developer ? { developer: p.developer } : {}),
  ...(p.source ? { source: p.source } : {}),
  note: [
    warnings.length ? 'CAUTION: ' + warnings.join(' ') : '',
    `Queued ${new Date().toISOString().slice(0,10)} from trade press.`,
  ].filter(Boolean).join(' '),
};
split.pending_next_quarterly = split.pending_next_quarterly || [];
split.pending_next_quarterly.push(entry);
fs.writeFileSync(QUEUE, JSON.stringify(split, null, 1));
console.log(`\n  Queued. ${split.pending_next_quarterly.length} projects now pending.`);
console.log('  Remember: on the next source refresh, REPLACE the bucket and CLEAR the queue —');
console.log('  never add queued MW on top of a refreshed source.\n');
