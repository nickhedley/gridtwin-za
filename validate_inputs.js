// validate_inputs.js - do the tariff CONSTANTS agree with their published sources?
//
// WHY THIS EXISTS
//
// On 10 Sep 2026 the panel's Homepower energy rate was found to be 10% wrong. It had
// survived a full methodology review, a confidence assessment and six validation checks.
//
// None of them could catch it. Every one tested the MODEL against that number. Nothing
// tested the NUMBER against its source.
//
// Within the hour the same exercise found a second instance: Homeflex's six rates and both
// Homelight rates were held in 2024/25 rands and used as 2026/27 figures, each 22.6% low.
// NERSA's own document warns of it - "The proposed rates in the submission were based on
// 2024/25 revenues... would be adjusted as per the NERSA 2025/26 tariff increase decision" -
// and the warning was in a document already read.
//
// So this harness asks a different question from every other one in the suite. Not "is the
// model consistent" but "is this constant what the source says it is". Each check RECOMPUTES
// a held value from something published rather than trusting it was typed correctly.
//
// WHAT MAKES A CHECK BELONG HERE
//
// It must derive the held value from a DIFFERENT published quantity. A check that restates
// the constant proves nothing. The Homepower one works because NERSA published a 2024/25
// base and a set of approved increases, and the product of those is an independent route to
// the same number.
//
// Run: node validate_inputs.js <root>

const fs = require('fs');
const path = require('path');

const ROOT = process.argv[2] || '.';
let pass = 0, fail = 0;
const failures = [];

function check(name, ok, detail){
  if (ok){ pass++; console.log(`  PASS  ${name}`); }
  else { fail++; failures.push([name, detail]); console.log(`  FAIL  ${name}`); }
}

let T;
try {
  T = JSON.parse(fs.readFileSync(
    path.join(ROOT, 'nodal', 'eskom_tariff_components.json'), 'utf8'));
} catch (e) {
  console.error('cannot read nodal/eskom_tariff_components.json:', e.message);
  process.exit(1);
}

const E = T.escalation || {};
const G = (1 + (E.fy2025_26_pct || 0) / 100) * (1 + (E.fy2026_27_pct || 0) / 100);
const VAT = 1.15;

console.log('\nTariff constants against their published sources\n');

// ── 1. HOMEPOWER ENERGY ────────────────────────────────────────────────────
// NERSA Reasons for Decision Table 6 gives proposed monthly bills at consumption steps.
// The implied flat rate is R2.305/kWh in 2024/25 rands. Grown by the approved increases and
// with VAT, that is an independent route to the published schedule rate.
{
  const hp = T.homepower4 || {};
  const derived = 2.305 * G * VAT;
  const held = hp.energy_r_per_kwh;
  const gap = 100 * (held / derived - 1);
  check('Homepower energy matches the NERSA progression',
        Math.abs(gap) < 5,
        `held R${held}, derived R${derived.toFixed(4)} from NERSA's 2024/25 base of R2.305 `
        + `x ${G.toFixed(4)} x VAT. ${gap.toFixed(1)}% apart. This check exists because the `
        + `held value was R3.5556 until 10 Sep 2026 - a web summary rather than the Schedule `
        + `of Standard Prices - and was 10% wrong.`);
}

// ── 2. HOMEFLEX AND HOMELIGHT ARE IN CURRENT RANDS ─────────────────────────
// NERSA publishes its proposed rates in 2024/25 rand value and says so. Holding them
// unescalated understates by 22.6%. The test: a 2026/27 rate must exceed its 2024/25 base
// by the cumulative approved increase.
{
  const hf = T.homeflex || {};
  const now = hf.rates_r_per_kwh_2026_27 || {};
  const orig = hf.rates_r_per_kwh_2024_25_original || {};
  const keys = Object.keys(orig);
  const bad = keys.filter(k => Math.abs(now[k] / (orig[k] * G) - 1) > 0.02);
  check('Homeflex rates are escalated to the current financial year',
        keys.length > 0 && bad.length === 0,
        `${bad.length} of ${keys.length} rates are not the 2024/25 figure grown by `
        + `${G.toFixed(4)}: ${bad.join(', ')}. NERSA's proposed tariffs are in 2024/25 rand `
        + `value and its own document says they are adjusted through the ERTSA process.`);

  for (const k of ['homelight20a', 'homelight60a']){
    const t = T[k] || {};
    const base = t.energy_r_per_kwh_2024_25, held = t.energy_r_per_kwh;
    if (base){
      check(`${k} is escalated to the current financial year`,
            Math.abs(held / (base * G) - 1) < 0.02,
            `held R${held} against R${(base * G).toFixed(4)} = R${base} x ${G.toFixed(4)}.`);
    }
  }
}

// ── 3. THE FIXED CHARGE MATCHES ITS PHASE-IN ───────────────────────────────
// Eskom states the phase-in percentages and the daily charges separately. They are two
// statements of one fact, so each can be derived from the other.
{
  const hp = T.homepower4 || {};
  const f = hp.fixed_r_per_day || {}, ps = hp.phase_in_status || {};
  const daily = (f.network_capacity || 0) + (f.service_and_admin || 0) + (f.generation_capacity || 0);
  check('Homepower fixed charges reconcile daily to monthly',
        Math.abs(daily * 30 - (hp.fixed_r_per_month || 0)) < 2,
        `R${daily.toFixed(2)}/day x 30 = R${(daily * 30).toFixed(0)} against a held `
        + `R${hp.fixed_r_per_month}. Eskom bills per DAY.`);
  const saFull = (f.service_and_admin || 0) / ((ps.service_and_admin_fixed_pct || 100) / 100);
  check('the service charge matches its stated phase-in percentage',
        saFull > 9 && saFull < 11,
        `R${(f.service_and_admin || 0).toFixed(2)}/day at `
        + `${ps.service_and_admin_fixed_pct}% implies a full charge of R${saFull.toFixed(2)}, `
        + `and Eskom states R9.90. A mismatch means one of the two was updated alone.`);
}

// ── 4. ALLOWED REVENUE COMPONENTS SUM TO THE TOTAL ─────────────────────────
{
  const A = T.allowed_revenue_2026_27 || {};
  const C = A.components_r_per_kwh || {};
  const sum = Object.values(C).reduce((a, b) => a + b, 0);
  check('the allowed-revenue components sum to the stated total',
        Math.abs(sum - (A.total_r_per_kwh || 0)) < 0.01,
        `components sum to R${sum.toFixed(3)} against a stated R${A.total_r_per_kwh}. `
        + `If a component is edited alone this is where it shows.`);
  const implied = (A.approved_total_r_bn || 0) * 1e9 / ((A.sales_twh || 1) * 1e9);
  check('the total per kWh matches approved revenue over sales',
        Math.abs(implied - (A.total_r_per_kwh || 0)) < 0.05,
        `R${(A.approved_total_r_bn || 0)}bn over ${A.sales_twh} TWh is `
        + `R${implied.toFixed(3)}/kWh against a stated R${A.total_r_per_kwh}.`);
}

// ── 5. THE CTS ALLOCATION IS THE RATIO IT CLAIMS ───────────────────────────
{
  const A = T.allowed_revenue_2026_27 || {};
  const c = A.cts_residential_detail || {};
  if (c.total_avg_unit_cost_c_per_kwh){
    const derived = c.total_avg_unit_cost_c_per_kwh / c.system_total_c_per_kwh;
    check('the residential allocation is the CTS ratio it claims to be',
          Math.abs(derived - (A.residential_allocation_factor || 0)) < 0.01,
          `${c.total_avg_unit_cost_c_per_kwh} / ${c.system_total_c_per_kwh} = `
          + `${derived.toFixed(3)} against a held ${A.residential_allocation_factor}. `
          + `Eskom cost-to-serve study Table 42, category ${c.category}.`);
  }
}

// ── 6. EVERY TARIFF CARRIES A SOURCE AND A YEAR ────────────────────────────
// The Homepower error was a number without a traceable source. Any tariff the panel uses
// must name where it came from, so the next person can check it rather than trust it.
{
  const need = ['homepower4', 'homeflex', 'homelight20a', 'homelight60a'];
  const missing = need.filter(k => {
    const t = T[k] || {};
    const blob = JSON.stringify(t).toLowerCase();
    return !(blob.includes('nersa') || blob.includes('schedule of standard prices'));
  });
  check('every residential tariff names its source',
        missing.length === 0,
        `${missing.join(', ')} carry no source reference. A tariff a validation depends on `
        + `must be traceable to a published schedule - the Homepower rate was wrong for `
        + `weeks because it came from a summary nobody could check.`);
}

console.log(`\n${pass}/${pass + fail} input checks passed`);
if (failures.length){
  console.log('\nFAILURES:');
  for (const [n, d] of failures) console.log(`  ${n}  —  ${d}`);
  process.exit(1);
}
