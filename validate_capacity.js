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
    const rtSum = Math.round(Object.values(rt).reduce((a, b) => a + b, 0) * 10) / 10;
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
  const asAt = new Date((cap.meta && cap.meta.as_at) || '2026-03-31');
  const risky = [];
  for (const x of q) {
    if (!x.cod) continue;
    // COD is written as e.g. "August 2026" or "April 2026"
    const d = new Date(x.cod + (/\d{4}$/.test(x.cod) ? ' 01' : ''));
    if (!isNaN(d) && d <= asAt) risky.push(x);
  }
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

console.log(`\n${pass}/${pass + fail} checks passed` + (pending ? `, ${pending} pending` : ''));
if (fail) process.exit(1);
