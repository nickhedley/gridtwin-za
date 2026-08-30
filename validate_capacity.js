// GridTwin ZA - capacity data reconciliation checks.
// Run with: node validate_capacity.js
//
// These exist because the existing suite (stress_suite 290, validate_outputs 26,
// audit 29, eng5 6) returned a full pass against regional_renewable_capacity.json
// while that file had solar and wind attributed to the wrong provinces. Nothing
// tested the capacity data itself, so the bug could have sat there indefinitely.

const fs = require('fs');
const path = require('path');
const ROOT = process.argv[2] || 'testroot';
const P = f => path.join(ROOT, 'nodal', f);

const cap = JSON.parse(fs.readFileSync(P('regional_renewable_capacity.json'), 'utf8'));
const pipe = JSON.parse(fs.readFileSync(P('ipp_pipeline.json'), 'utf8'));
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

let pass = 0, fail = 0, pending = 0;
const TOL = 1.0; // MW - published tables round to whole MW

function check(label, ok, detail) {
  if (ok) { pass++; console.log(`  PASS  ${label}${detail ? '   ' + detail : ''}`); }
  else { fail++; console.log(`  FAIL  ${label}${detail ? '   ' + detail : ''}`); }
}
function pend(label, detail) {
  pending++;
  console.log(`  PENDING  ${label}   ${detail}`);
}
const sum = o => Object.values(o).reduce((a, b) => a + b, 0);

console.log('\nIdentity 1 - IPP Office universe (REIPPPP BW1-6, reached financial close)');
{
  const r = cap.reconciliation;
  if (!r) check('regional_renewable_capacity.json carries a reconciliation block', false,
                'absent - the file predates the rebuild and cannot be reconciled');
  else {
  const lhs = r.online_actual_mw + r.under_delivery_mw + r.in_construction_mw;
  check('procured = online_actual + under_delivery + in_construction',
        Math.abs(lhs - r.procured_mw) < 1e-9,
        `${r.online_actual_mw} + ${r.under_delivery_mw} + ${r.in_construction_mw} = ${lhs} vs ${r.procured_mw}`);

  // The per-province table must reproduce the published national total. This is
  // the check that would have caught the original bug.
  const byTech = cap.by_source.reipppp;
  const provSum = Object.values(byTech).reduce((a, t) => a + sum(t), 0);
  check('sum(provincial online, all technologies) = published national online',
        Math.abs(provSum - r.online_actual_mw) <= TOL,
        `${provSum.toFixed(1)} vs ${r.online_actual_mw} (tolerance ${TOL} MW rounding)`);
  }
}

console.log('\nIdentity 2 - preferred bidders reconcile to financial close plus pre-FC');
{
  const r = pipe.reconciliation;
  if (!r) check('ipp_pipeline.json carries a reconciliation block', false,
                'absent - the file predates the rebuild and cannot be reconciled');
  else {
  const lhs = r.reached_financial_close_mw + r.pre_financial_close_mw;
  check('preferred_bidders = financial_close + pre_financial_close',
        Math.abs(lhs - r.preferred_bidders_net_of_cancellations_mw) < 1e-9,
        `${r.reached_financial_close_mw} + ${r.pre_financial_close_mw} = ${lhs} vs ${r.preferred_bidders_net_of_cancellations_mw}`);
  check('pre_financial_close detail sums to its own total',
        Math.abs(sum(r.pre_financial_close_detail) - r.pre_financial_close_mw) < 1e-9);
  const alloc = Object.values(pipe.by_region).reduce((a, v) => a + v.total_mw, 0);
  check('by_region + unallocated = pipeline total',
        Math.abs(alloc + pipe.unallocated.total_mw - r.pipeline_total_mw) < 1e-9,
        `${alloc} + ${pipe.unallocated.total_mw} = ${r.pipeline_total_mw}`);
  }
}

console.log('\nIdentity 3 - regional operational sums to the national constant, by source');
{
  const m = html.match(/pvUtilityMW\s*:\s*([0-9.]+)/);
  const pvConst = m ? parseFloat(m[1]) : null;
  if (!cap.by_source) {
    check('regional_renewable_capacity.json carries source tags', false,
          'no by_source block - operational capacity cannot be split by source');
  } else {
  const reipppp = sum(cap.by_source.reipppp.solar_mw);
  const priv = sum(cap.by_source.private.solar_mw);

  const coverage = (cap.meta || {}).private_coverage;

  // WIND: windMW is DERIVED from these components, so this equality is a
  // consistency check, not independent corroboration - it confirms the constant
  // and the file agree, and fails loudly if either is edited alone. It will also
  // fail if pre-2026 private WIND is later found, which is the correct behaviour:
  // the constant would then be understated and must be re-derived, not patched.
  {
    const wm = html.match(/windMW\s*:\s*([0-9.]+)/);
    const wConst = wm ? parseFloat(wm[1]) : null;
    const wR = sum(cap.by_source.reipppp.wind_mw);
    const wP = sum(cap.by_source.private.wind_mw);
    const wE = sum((cap.by_source.eskom || { wind_mw: {} }).wind_mw);
    const wTotal = wR + wP + wE;
    check('FIXED.windMW = sum(reipppp + private + eskom wind)',
          Math.abs(wTotal - wConst) <= TOL,
          `${wR} + ${wP} + ${wE} = ${wTotal} vs ${wConst}`);
  }

  // SOLAR: STRICT since 15 Aug 2026. The identity was PENDING while the constant
  // (4,974) carried an unexplained 1,823 MW residual; Eskom's Week 32 report
  // settled it - their NTCSA-contracted PV line (2,780.2, Aug) reproduces our
  // REIPPPP figure exactly after post-reporting-date CODs, proving the residual
  // was a wrong constant, not missing plant. The old coverage escape hatch is
  // deliberately GONE: with the constant derived, "coverage" can no longer
  // justify a gap, and any future mismatch is a real error.
  check('FIXED.pvUtilityMW = sum(reipppp solar) + sum(private solar)',
        Math.abs(reipppp + priv - pvConst) <= TOL,
        `${reipppp} + ${priv} = ${reipppp + priv} vs ${pvConst}`);

  // rooftopMW must equal the regional file it is derived from. Same discipline as
  // windMW: the constant and the file are one number in two places, so assert it.
  {
    const rt = JSON.parse(fs.readFileSync(path.join(ROOT, 'nodal/rooftop_mw_by_region.json'), 'utf8'));
    const rtSum = Math.round(Object.values(rt)
      .filter(v => typeof v === 'number')          // skip the meta block
      .reduce((a, b) => a + b, 0) * 10) / 10;
    const rm = html.match(/rooftopMW\s*:\s*([0-9.]+)/);
    const rConst = rm ? parseFloat(rm[1]) : null;
    // The constant is the Eskom table MINUS wheeled ground-mounted solar: Eskom's
    // rooftop bucket is contractual (their footnote: includes ground-mounted plant
    // without NTCSA contracts), so the wheeled 488 sat in BOTH rooftopMW and
    // pvUtilityMW - a live double count until 15 Aug 2026. The subtraction uses
    // by_source.private from the capacity file, so the two identities share one
    // sourced number and cannot drift apart.
    const wheeled = sum(cap.by_source.private.solar_mw);
    check('FIXED.rooftopMW = sum(rooftop_mw_by_region) - wheeled private solar',
          Math.abs(rtSum - wheeled - rConst) <= TOL,
          `${rtSum} - ${wheeled} = ${(rtSum - wheeled).toFixed(1)} vs ${rConst}`);
  }

  const cspM = html.match(/cspMW\s*:\s*([0-9.]+)/);
  check('FIXED.cspMW = sum(reipppp CSP)',
        Math.abs(sum(cap.by_source.reipppp.csp_mw) - parseFloat(cspM[1])) <= TOL,
        `${sum(cap.by_source.reipppp.csp_mw)} vs ${cspM[1]}`);
  }
}

console.log('\nStructural - derived fields recomputed, not hand-edited');
{
  let ok = true, bad = [];
  for (const [region, v] of Object.entries(pipe.by_region)) {
    if (!v.by_status) { ok = false; bad.push(region + ' (no by_status)'); continue; }
    const t = +v.projects.reduce((a, p) => a + p.mw, 0).toFixed(1);
    const s = +v.projects.filter(p => p.tech === 'solar').reduce((a, p) => a + p.mw, 0).toFixed(1);
    const st = +Object.values(v.by_status).reduce((a, e) => a + e.mw, 0).toFixed(1);
    if (t !== v.total_mw || s !== v.solar_mw || st !== v.total_mw) { ok = false; bad.push(region); }
  }
  check('every by_region derived field matches its project list', ok, bad.join(', '));

  const engineSolar = sum(cap.solar_mw), engineWind = sum(cap.wind_mw);
  if (cap.by_source) {
    check('engine-facing solar_mw = sum over sources',
          Math.abs(engineSolar - srcSum('solar_mw')) < 1e-9);
  // Sum a technology across EVERY source bucket, not a hardcoded pair. `eskom`
  // was added on 14 Aug 2026 and the old two-bucket form silently excluded it.
  function srcSum(tech){
    return Object.values(cap.by_source).reduce((t, b) => t + sum(b[tech] || {}), 0);
  }


    check('engine-facing wind_mw = sum over sources',
          Math.abs(engineWind - srcSum('wind_mw')) < 1e-9);
  }

  const REG = Object.keys(cap.wind_mw);
  check('solar_mw and wind_mw carry the same region keys',
        JSON.stringify(REG) === JSON.stringify(Object.keys(cap.solar_mw)));
  check("region keys use the 'Kwazulu Natal' spelling and include 'Hydra Central'",
        REG.includes('Kwazulu Natal') && REG.includes('Hydra Central'));
}

console.log('\nFingerprints');
{
  // The fingerprint is defined over Python's json.dumps(sort_keys=True,
  // separators=(',',':')) canonicalisation. JSON.stringify renders 1570.0 as
  // 1570, so a JS reimplementation cannot reproduce it - verify through the same
  // interpreter that writes it rather than approximating it here.
  const { execFileSync } = require('child_process');
  const py = [
    'import json,hashlib,sys',
    'd=json.load(open(sys.argv[1]))',
    'body={k:v for k,v in d.items() if k!="meta"}',
    'print("gtza-"+hashlib.sha256(json.dumps(body,sort_keys=True,separators=(",",":")).encode()).hexdigest()[:16])',
    'print(d.get("meta",{}).get("fingerprint","(absent)"))',
  ].join('\n');
  for (const name of ['regional_renewable_capacity.json', 'ipp_pipeline.json']) {
    const out = execFileSync('python3', ['-c', py, P(name)], { encoding: 'utf8' }).trim().split('\n');
    check(name + ' fingerprint matches body', out[0] === out[1], out[0] + ' vs ' + out[1]);
  }
}

// ---- DATA FRESHNESS - is this file out of date? -----------------------------
// Ad-hoc spotting of project announcements is a lottery. This turns "am I
// stale?" into something the tooling answers on every run.
//
// The two anchor sources refresh on different cycles, and they behave very
// differently:
//
//   IPP Office IPPPP Quarterly Report - REIPPPP capacity online. Published
//   roughly 2-3 months after quarter end. This is the authoritative source and
//   it is the one to wait for.
//
//   PowerFutureLab (Alao & Kruger) IPP monitor - privately wheeled capacity.
//   HALF-YEARLY. This is the exposure: wheeled plant is the fastest-growing
//   category in South Africa and its only systematic source refreshes twice a
//   year, so this file can be six months behind on the very segment that is
//   moving quickest.
//
// See the SOURCE CALENDAR printed below for what to check and when.
{
  const asAt = new Date((cap.meta && cap.meta.as_at) || '2026-03-31');
  const now = new Date();
  const days = Math.floor((now - asAt) / 86400000);
  console.log(`\nData freshness - capacity file as at ${asAt.toISOString().slice(0,10)}, ${days} days ago`);

  // A quarterly report lands ~75 days after its quarter ends. If more than one
  // quarter-end has passed plus that lag, a newer edition should exist.
  const qEnds = [ '2026-06-30', '2026-09-30', '2026-12-31', '2027-03-31' ].map(d => new Date(d));
  const due = qEnds.filter(q => q > asAt && (now - q) / 86400000 > 75);
  if (due.length) {
    const qLabel = due[due.length - 1].toISOString().slice(0,10);
    console.log(`  STALE  A newer IPP Office quarterly should be out: the ${qLabel} edition is ~${Math.floor((now-due[due.length-1])/86400000)} days past its quarter end.`);
    console.log('         Check https://www.ipp-projects.co.za for the current IPPPP Quarterly Report.');
  } else {
    console.log('  ok     No newer IPP Office quarterly is due yet.');
  }

  // The private monitor is the weak link and deserves a louder warning.
  const privCov = (cap.meta && cap.meta.private_coverage) || 'unknown';
  if (days > 180) {
    console.log(`  STALE  Private/wheeled coverage is "${privCov}" and this file is ${days} days old.`);
    console.log('         Wheeled capacity is the fastest-moving category and its only systematic');
    console.log('         source is HALF-YEARLY, so assume this understates it. See SOURCE CALENDAR.');
  } else if (days > 120) {
    console.log(`  WATCH  Private/wheeled coverage is "${privCov}", ${days} days old. Wheeled plant`);
    console.log('         commissioned since then will NOT be in this file - queue anything you see.');
  }

  // Known pipeline: plant already financed that WILL commission.
  const ic = cap.reconciliation && cap.reconciliation.in_construction_mw;
  if (ic > 0)
    console.log(`  NOTE   ${ic} MW of REIPPPP capacity was in construction at the file date and will`);
    console.log('         commission into a future quarterly. That is expected, not missing data.');

  console.log('\n  SOURCE CALENDAR');
  console.log('    Oxpeckers #PowerTracker       EVENT-DRIVEN alerts   powertracker.oxpeckers.org  WHEELED commissioning - subscribe');
  console.log('    IPP Office IPPPP Quarterly    quarterly, ~75d lag   ipp-projects.co.za          REIPPPP online capacity');
  console.log('    Eskom Weekly System Status    WEEKLY                eskom.co.za                 totals by technology - see drift note');
  console.log('    PowerFutureLab IPP monitor    half-yearly           powerfutureslab.co.za       privately wheeled, authoritative but slow');
  console.log('    NERSA registrations           ~quarterly            nersa.org.za                registered private generation');
  console.log('\n  WHEELED PLANT - USE POWERTRACKER. Oxpeckers #PowerTracker carries an explicit');
  console.log('  "Energy Wheeling" category and sends EMAIL ALERTS on point changes, so a wheeled');
  console.log('  commissioning arrives the week it happens rather than waiting six months for the');
  console.log('  next PowerFutureLab monitor. Subscribe at powertracker.oxpeckers.org. This closes');
  console.log('  the gap that previously made trade press the fastest available signal.');
  console.log('\n  LICENCE. PowerTracker content is CC BY-SA 4.0; our data files are CC BY-NC-ND 4.0.');
  console.log('  Those do NOT compose - Share-Alike would require our derivative to be BY-SA too.');
  console.log('  So use PowerTracker to DISCOVER and VERIFY a commissioning, record the underlying');
  console.log('  FACTS (name, MW, technology, location, COD - not copyrightable) in our own');
  console.log('  compilation with attribution, and do NOT ingest their dataset wholesale.');
  console.log('\n  DRIFT DETECTOR. Eskom\'s weekly report publishes installed totals by technology, so a');
  console.log('  jump in its Wind or PV line means something commissioned. BUT it counts only');
  console.log('  NTCSA-CONTRACTED plant - wheeled projects never appear in it. That is what');
  console.log('  PowerTracker is for.');
}

// ---- PENDING ADDITIONS - print, never pass silently -------------------------
// Known-future capacity lives in the split file's pending_next_quarterly, not in
// the capacity file, because the capacity file must match its published source
// table (currently IPP Office Q4, 31 Mar 2026). Hand-adding a known COD ahead of
// its table is exactly how pvUtilityMW became a wrong constant. This block makes
// the queue impossible to forget: every validation run prints it until the next
// quarterly rollforward consumes it.
try {
  const split = JSON.parse(fs.readFileSync(path.join(ROOT, 'nodal/supply_area_split_draft.json'), 'utf8'));
  const q = split.pending_next_quarterly || [];

// ---- DOUBLE-COUNT GUARD ------------------------------------------------------
// THE RULE, and the reason for it.
//
// When a new PowerFutureLab monitor or IPP Office quarterly lands, it will
// ALREADY CONTAIN the projects sitting in our queue - that is the whole point of
// a later reporting date. So the update procedure is REPLACE, never ADD:
//
//     1. Replace by_source.private (or .reipppp) wholesale with the new edition
//     2. Re-derive FIXED.windMW / FIXED.pvUtilityMW from the rebuilt file
//     3. THEN delete the queue entries the new edition now covers
//
// Adding queued megawatts on top of a refreshed source counts them twice. This
// is not hypothetical: FIXED.pvUtilityMW carried 1,823 phantom MW for exactly
// this reason until 15 Aug 2026, because 488 MW of wheeled plant sat in both the
// utility and rooftop buckets at once.
//
// The check below fires when a queued project's COD is on or before the file's
// as_at date - meaning the source should already include it, and leaving it
// queued invites someone to add it a second time.
{
  // THE TWO BUCKETS HAVE DIFFERENT EFFECTIVE DATES, and conflating them nearly
  // caused a 380 MW double count on 17 Aug 2026.
  //
  //   reipppp : anchored to meta.as_at, the IPP Office quarterly basis (31 Mar)
  //   private : anchored to the PFL monitor, which covers H1 2026 - i.e. through
  //             30 JUNE, three months LATER than meta.as_at
  //
  // Comparing a wheeled project's COD against 31 March would clear anything
  // commissioned April-June as "not yet counted", when the PFL monitor has
  // almost certainly already got it. Mooi Plaats (240 MW) and Umsobomvu (140 MW)
  // were both queued on that mistaken basis and were already in
  // by_source.private the whole time.
  const asAtReipppp = new Date((cap.meta && cap.meta.as_at) || '2026-03-31');
  const privCov = String((cap.meta && cap.meta.private_coverage) || '');
  // "h1-2026-only" means commercial operations through 30 June 2026.
  const mH = privCov.match(/h([12])-(\d{4})/i);
  const asAtPrivate = mH
    ? new Date(`${mH[2]}-${mH[1] === '1' ? '06-30' : '12-31'}`)
    : asAtReipppp;

  // Named projects already in the private source - the definitive check, because
  // a name match beats any date arithmetic.
  let privNames = new Set();
  try {
    const pfl = JSON.parse(fs.readFileSync(path.join(ROOT, 'nodal', 'pfl_private_h1_2026.json'), 'utf8'));
    (pfl.projects || []).forEach(pr => privNames.add(String(pr.name).toLowerCase().replace(/[^a-z0-9]/g,'')));
  } catch (e) {}

  const risky = [], named = [], undated = [];
  for (const x of q) {
    const nm = String(x.name).toLowerCase().replace(/[^a-z0-9]/g,'');
    const hit = [...privNames].find(n => n.length > 4 && nm.includes(n));
    // BUCKET RESTRICTION REMOVED 29 Aug 2026. A name match against the private
    // source is definitive evidence the megawatts are already counted, whatever
    // bucket the QUEUE entry happens to carry - the queue's own bucket label is a
    // guess about where the project belongs, not a fact about where it is counted.
    // Restricting the match to bucket==='private' meant a mislabelled queue entry
    // sailed past the one check that beats date arithmetic.
    if (hit) { named.push(x); continue; }
    // UNDATED PROJECTS. Previously skipped in silence by `if (!x.cod) continue`,
    // which is the guard's blind spot: the whole mechanism keys on COD, so a
    // project with no verified date gets NO double-count scrutiny at all. That is
    // exactly the ARM Platinum case - 100 MW, already inside by_source.private,
    // and invisible to every dated test.
    // Now collected and reported rather than dropped. Not a failure: an undated
    // project is a sourcing gap, not an error. But it must be VISIBLE, because the
    // reader's natural inference from a silent pass is that everything was checked.
    if (!x.cod) { undated.push(x); continue; }
    const d = new Date(x.cod + (/\d{4}$/.test(x.cod) ? ' 01' : ''));
    const basis = x.bucket === 'private' ? asAtPrivate : asAtReipppp;
    if (!isNaN(d) && d <= basis) risky.push(x);
  }
  if (undated.length) {
    console.log('\n  UNDATED - NOT ASSESSABLE FOR DOUBLE COUNTING');
    console.log('    The guard keys on COD. These carry none, so no dated test can speak for');
    console.log('    them. Each is EITHER already inside a source aggregate OR genuinely missing,');
    console.log('    and only a source can say which. Do NOT invent a date to make one testable.');
    undated.forEach(x => console.log(`    ${x.name} (${x.mw} MW, bucket ${x.bucket || '?'})`
      + ` - resolve via the source that lists it, then re-run.`));
  }
  if (named.length) {
    console.log('\n  *** ALREADY IN THE PRIVATE SOURCE - NAME MATCH ***');
    named.forEach(x => console.log(`    ${x.name} (${x.mw} MW) appears in pfl_private_h1_2026.json projects[]`));
    console.log('  Delete these queue entries. They are counted already.');
  }
  console.log(`\n  Bucket basis dates: reipppp ${asAtReipppp.toISOString().slice(0,10)} · ` +
              `private ${asAtPrivate.toISOString().slice(0,10)} (coverage "${privCov}")`);
  if (risky.length) {
    console.log('\n  *** DOUBLE-COUNT RISK ***');
    console.log('  These queued projects have a COD on or before the capacity file date, so the');
    console.log('  file should ALREADY include them. Adding them again would double count:');
    risky.forEach(x => console.log(`    ${x.name} (COD ${x.cod}) vs file as at ${asAt.toISOString().slice(0,10)}`));
    console.log('  Verify against the source, then DELETE these queue entries rather than adding them.');
  } else if (q.length) {
    console.log(`\n  Double-count guard: all ${q.length} queued projects post-date the file (${asAt.toISOString().slice(0,10)}), so none are`);
    console.log('  in it yet. On the next refresh, REPLACE the bucket from source and then clear');
    console.log('  the queue - never add queued MW on top of a refreshed source.');
  }
}

  if (q.length) {
    console.log('\nPending next quarterly rollforward (IPP Office Q1 2026/27, 30 Jun basis):');
    for (const x of q) {
      // The instruction differs by BUCKET. REIPPPP additions land in by_source.reipppp
      // and feed the Eskom reconciliation; privately wheeled plant lands in
      // by_source.private and does NOT, because Eskom does not meter it. Printing
      // one instruction for both was wrong and would have sent the next person to
      // the wrong bucket.
      const priv = x.bucket === 'private';
      console.log(`  QUEUED  ${x.name} - ${x.mw} MW ${x.tech}, ${x.area} (COD ${x.cod})` +
                  (x.developer ? `, ${x.developer}` : '') + '.');
      console.log('            ' + (priv
        ? 'PRIVATE WHEELED: add to by_source.private, then re-derive ' +
          (x.tech === 'wind' ? 'FIXED.windMW' : 'FIXED.pvUtilityMW') +
          '. Eskom does not meter this plant, so the Week-32 reconciliation is UNAFFECTED - ' +
          'but the validation panel note explaining why we read above Ember will need its number updated.'
        : 'REIPPPP: add to by_source.reipppp, re-derive ' +
          (x.tech === 'wind' ? 'FIXED.windMW' : 'FIXED.pvUtilityMW') +
          ', and re-anchor the Eskom Week-32 reconciliation comments, which use this project as a bridge.'));
      if (x.note) console.log('            NOTE: ' + x.note);
    }
  }
} catch (e) { /* split file optional in older checkouts */ }


// ── EVERY COMMISSIONED PROJECT IS ACCOUNTED FOR SOMEWHERE ───────────────────
// A project that reached commercial operation must appear in EITHER the
// operational capacity file OR the pipeline file marked online. Appearing in
// neither means it was silently dropped between an IPP Office cutoff and the
// next compile.
//
// This is not hypothetical. Mulilo Total Hydra Storage reached commercial
// operation in H1 2026, is in neither file, and was found only because someone
// happened to read a PDF on 27 Aug 2026. Doornhoek hit the same gap and was
// caught by hand. This makes the catch automatic.
//
// Storage and hybrid projects are checked on CONTRACTED capacity, not
// installed: Mulilo's 216 is MWp of solar behind a 75 MW dispatchable output,
// and counting the larger figure would treble Northern Cape solar.
try {
  // EVERY register, not one file. When an H2 register lands, the natural move
  // is to repoint this at the newer file - which would silently drop H1
  // coverage and any unresolved H1 gap with it. That is how Mulilo went missing
  // in the first place, so this accumulates rather than replaces.
  const regs = fs.readdirSync(path.join(ROOT, 'nodal'))
    .filter(f => /^pfl_cod_.*\.json$/.test(f)).sort();
  if (!regs.length) throw Object.assign(new Error('no registers'), { code: 'ENOENT' });
  const cod = { projects: [], sources: regs };
  for (const f of regs){
    const j = JSON.parse(fs.readFileSync(P(f), 'utf8'));
    for (const pr of (j.projects || [])) cod.projects.push({ ...pr, register: f });
  }

  // Everything named anywhere in either file. Names vary slightly between
  // sources, so match on a normalised form and accept a containment match.
  const norm = t => String(t).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const haystack = norm(JSON.stringify(cap) + ' ' + JSON.stringify(pipe));

  // THE CUTOFF DIFFERS BY ROUTE. Public capacity comes from the IPP Office
  // quarterly at 31 March 2026; private comes from the PFL monitor, which runs
  // to 30 June. So a private project commissioned in April is inside its
  // aggregate while a public one on the same date is not.
  //
  // Umsobomvu made this visible: COD April 2026, private. A single 31 March
  // cutoff would have flagged it as missing when it is properly covered.
  const asAtPublic  = (cap.meta && cap.meta.as_at) || '2026-03-31';
  const asAtPrivate = (cap.meta && cap.meta.private_coverage === 'h1-2026-only')
    ? '2026-06-30' : asAtPublic;

  const missing = [], captive = [], aggregated = [], undated = [];
  for (const pr of cod.projects) {
    // Captive plant is deliberately excluded from supply totals - it suppresses
    // demand rather than adding generation - so absence is correct, not a gap.
    if (pr.method === 'captive') { captive.push(pr.name); continue; }

    // No verified COD means we cannot say which side of the cutoff it falls,
    // so it is reported rather than judged. Better an honest gap in the check
    // than a confident wrong answer.
    if (!pr.cod) { undated.push(pr.name); continue; }

    // Commissioned before the cutoff: inside the provincial aggregate, and it
    // will never appear by name. Absence is expected.
    const cutoff = (pr.route === 'private' ? asAtPrivate : asAtPublic).slice(0, 7);
    if (pr.cod <= cutoff) { aggregated.push(pr.name); continue; }

    const key = norm(pr.name).split(' ').filter(w => w.length > 3);
    const found = key.length && key.every(w => haystack.includes(w));
    if (!found) missing.push(pr);
  }

  check('every commissioned project in every register is accounted for',
        missing.length === 0,
        missing.length
          ? missing.map(m => `${m.name} (${m.mw_contracted} MW contracted)`).join('; ')
          : `${aggregated.length} inside aggregates, ${captive.length} captive, `
            + `${undated.length} undated, rest named`);

  if (missing.length) {
    console.log('\n      MISSING FROM BOTH FILES - each of these reached commercial');
    console.log('      operation but is counted nowhere:');
    for (const m of missing) {
      console.log(`        ${m.name}  ${m.mw_contracted} MW contracted`
                  + (m.mw_installed !== m.mw_contracted
                      ? `, ${m.mw_installed} MW installed - USE THE CONTRACTED FIGURE` : ''));
      if (m.note) console.log(`          ${m.note}`);
    }
    console.log('      Add to ipp_pipeline.json with status "online" and a cod date,');
    console.log('      as Doornhoek was, or to by_source in the capacity file.');
  }
  if (undated.length)
    console.log('      NO VERIFIED COD, so not checked: ' + undated.join(', ')
                + '. Find the dates and this check gets stronger.');

  // The register must also reconcile to PFL's own published subtotals, or the
  // transcription is wrong and every check above it is measuring the wrong list.
  // Scoped to the H1 register, whose published subtotals these are. An H2
  // register brings its own, and would need its own assertion.
  const h1 = cod.projects.filter(x => x.register === 'pfl_cod_h1_2026.json');
  const sum = (r) => h1.filter(x => x.route === r)
                       .reduce((a, x) => a + x.mw_installed, 0);
  if (h1.length)
    check('H1 2026 register reconciles to PFL subtotals',
          sum('private') === 1046 && sum('public') === 874,
          `private ${sum('private')} (1046), public ${sum('public')} (874)`);
} catch (e) {
  if (e.code !== 'ENOENT') throw e;
  // Register absent in older checkouts - not a failure.
}

// ---------------------------------------------------------------------------
// DERIVED ROLLUPS MUST MATCH THE THINGS THEY ARE DERIVED FROM.
//
// Added 28 Aug 2026. The handover claimed this file already asserted it. It did
// not, and two rollups were found stale on the same day:
//
//   regional_renewable_capacity.json
//     reconciliation.totals_by_technology_mw.solar_mw read 2663 while the
//     by_source.reipppp.solar_mw regions summed to 2783 - a 120 MW gap, exactly
//     Doornhoek.
//   ipp_pipeline.json
//     Doornhoek's own entry read status "online" while the derived by_status
//     block still counted it under construction.
//
// Both were the signature of a hand edit: the named value updated, the rollup
// not. Neither is caught by a fingerprint, because the fingerprint is recomputed
// over whatever the file happens to contain.
// ---------------------------------------------------------------------------
{
  const rec = cap.reconciliation || {};
  const tb = rec.totals_by_technology_mw;
  const src = (cap.by_source || {}).reipppp;
  if (tb && src) {
    for (const k of Object.keys(tb)) {
      if (!src[k]) continue;
      const derived = sum(src[k]);
      const ok = Math.abs(derived - tb[k]) <= TOL;
      check(`reconciliation.totals_by_technology_mw.${k} matches by_source.reipppp`, ok,
            ok ? '' : `rollup says ${tb[k]}, regions sum to ${derived} - the rollup is stale, `
            + `which is what a hand edit looks like. Recompute, do not adjust the rollup.`);
    }
  } else {
    check('reconciliation.totals_by_technology_mw is present', false,
          'absent - it is the only cross-check on the by_source regional split');
  }
}

{
  // by_status in the pipeline must be derivable from the project list itself.
  let bad = [];
  for (const [region, v] of Object.entries(pipe.by_region || {})) {
    if (!v.by_status || !Array.isArray(v.projects)) continue;
    const recount = {};
    for (const pr of v.projects) {
      const st = pr.status || 'unknown';
      recount[st] = recount[st] || { mw: 0, n: 0 };
      recount[st].mw += pr.mw; recount[st].n += 1;
    }
    for (const st of new Set([...Object.keys(v.by_status), ...Object.keys(recount)])) {
      const a = v.by_status[st] || { mw: 0, n: 0 }, b = recount[st] || { mw: 0, n: 0 };
      if (Math.abs((a.mw || 0) - b.mw) > TOL || (a.n || 0) !== b.n)
        bad.push(`${region}/${st}: file ${a.mw || 0} MW n=${a.n || 0}, projects ${b.mw} MW n=${b.n}`);
    }
  }
  check('ipp_pipeline by_status matches the project lists', bad.length === 0, bad.join('; '));
}

// ---------------------------------------------------------------------------
// A PROJECT WITH A PUBLISHED PROVINCE MUST NOT SIT IN unallocated.
//
// Added 28 Aug 2026 after Mulilo Total Hydra was very nearly committed to the
// unallocated list while carrying province_confidence "published". Every identity
// still held - by_region + unallocated = total either way - so nothing would have
// flagged it. Only the allocated subtotal failing to move gave it away.
//
// unallocated is for capacity with NO published provincial split. Putting a
// sourced project there quietly discards the source.
// ---------------------------------------------------------------------------
{
  // unallocated is an OBJECT with an items[] array, not a bare array.
  const unalloc = Array.isArray(pipe.unallocated) ? pipe.unallocated
                : ((pipe.unallocated || {}).items || []);
  const bad = unalloc
    .filter(pr => pr.region || pr.province_confidence === 'published')
    .map(pr => `${pr.name} (${pr.mw} MW${pr.region ? ', region ' + pr.region : ''}`
             + `${pr.province_confidence ? ', confidence ' + pr.province_confidence : ''})`);
  check('no project with a published province sits in unallocated', bad.length === 0,
        bad.length ? bad.join('; ') + '  - move it into by_region, or drop the province claim' : '');
}

// ---------------------------------------------------------------------------
// THE GENERATOR MUST REPRODUCE THE COMMITTED FILES.
//
// Added 28 Aug 2026. On 27 Aug a stale copy of build_capacity.py destroyed the
// Hydra Central split and dropped the eskom bucket, then rewrote its own
// fingerprint so the damage looked consistent. Separately, the ROOT generator was
// one edit behind the data for ten days because Doornhoek was applied by hand.
//
// "Recompute, never hand-edit" is only a safe rule while the generator actually
// reproduces what is committed. This asserts that. Runs in a TEMPORARY COPY, so
// it can never touch the real files.
//
// Skipped, not failed, when the generator or python3 is unavailable - this file
// must still be runnable in a checkout without them.
// ---------------------------------------------------------------------------
{
  const { execFileSync } = require('child_process');
  const os = require('os');
  const gen = path.join(ROOT, 'build_capacity.py');
  if (!fs.existsSync(gen)) {
    pending++;
    console.log('  PEND  generator reproduction   build_capacity.py not found at the repo root - '
      + 'this check is the only thing standing between you and a silent regeneration');
  } else {
    let tmp = null;
    try {
      tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gtza-gen-'));
      fs.cpSync(path.join(ROOT, 'nodal'), path.join(tmp, 'nodal'), { recursive: true });
      fs.copyFileSync(gen, path.join(tmp, 'build_capacity.py'));
      execFileSync('python3', ['build_capacity.py'], { cwd: tmp, stdio: 'ignore' });
      for (const f of ['regional_renewable_capacity.json', 'ipp_pipeline.json']) {
        const before = JSON.parse(fs.readFileSync(P(f), 'utf8'));
        const after = JSON.parse(fs.readFileSync(path.join(tmp, 'nodal', f), 'utf8'));
        // Compare the BODY, excluding meta. The fingerprint is recomputed over
        // whatever the file contains, so two files can differ in substance while
        // both carry a self-consistent fingerprint - which is exactly how the
        // stale-rollup faults hid. Report the first differing path, not the
        // fingerprints, because identical fingerprints alongside "mismatch" reads
        // as a broken harness.
        const body = o => { const c = { ...o }; delete c.meta; return c; };
        const firstDiff = (a, b, p = '') => {
          if (a === b) return null;
          if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null)
            return `${p || '(root)'}: committed ${JSON.stringify(a)}, regenerated ${JSON.stringify(b)}`;
          for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
            const d = firstDiff(a[k], b[k], p ? p + '.' + k : k);
            if (d) return d;
          }
          return null;
        };
        const diff = firstDiff(body(before), body(after));
        check(`build_capacity.py reproduces ${f}`, diff === null,
              diff === null ? '' : `first difference at ${diff}. Either the generator is behind the `
                + `data (a hand edit was never written back) or the data is behind the generator. `
                + `DIFF BEFORE REGENERATING - running it blind is how the Hydra Central split was `
                + `destroyed on 27 Aug.`);
      }
    } catch (e) {
      pending++;
      console.log('  PEND  generator reproduction   could not run: ' + String(e.message).slice(0, 120));
    } finally {
      if (tmp) { try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) {} }
    }
  }
}

console.log(`\n${pass}/${pass + fail} checks passed` + (pending ? `, ${pending} pending` : ''));
if (fail) process.exit(1);
