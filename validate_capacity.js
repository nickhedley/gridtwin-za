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
    const wTotal = sum(cap.by_source.reipppp.wind_mw) + sum(cap.by_source.private.wind_mw);
    check('FIXED.windMW = sum(reipppp wind) + sum(private wind)',
          Math.abs(wTotal - wConst) <= TOL,
          `${sum(cap.by_source.reipppp.wind_mw)} + ${sum(cap.by_source.private.wind_mw)} = ${wTotal} vs ${wConst}`);
  }

  // SOLAR: still PENDING. Private coverage is H1 2026 only, so the residual is
  // real missing plant rather than an error. Do NOT widen the tolerance to pass.
  if (coverage !== 'complete') {
    pend('FIXED.pvUtilityMW = sum(reipppp solar) + sum(private solar)',
         `by_source.private coverage is "${coverage}", not complete. ` +
         `reipppp = ${reipppp} MW + private = ${priv} MW = ${reipppp + priv} MW, ` +
         `constant = ${pvConst} MW, unexplained gap = ${(pvConst - reipppp - priv).toFixed(0)} MW.`);
  } else {
    check('FIXED.pvUtilityMW = sum(reipppp solar) + sum(private solar)',
          Math.abs(reipppp + priv - pvConst) <= TOL,
          `${reipppp} + ${priv} = ${reipppp + priv} vs ${pvConst}`);
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
          Math.abs(engineSolar - (sum(cap.by_source.reipppp.solar_mw) + sum(cap.by_source.private.solar_mw))) < 1e-9);
    check('engine-facing wind_mw = sum over sources',
          Math.abs(engineWind - (sum(cap.by_source.reipppp.wind_mw) + sum(cap.by_source.private.wind_mw))) < 1e-9);
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

console.log(`\n${pass}/${pass + fail} checks passed` + (pending ? `, ${pending} pending` : ''));
if (fail) process.exit(1);
