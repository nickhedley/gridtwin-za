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

// ── 7. LOSSES AND LEVIES ARE TRACED, NOT ROUND ─────────────────────────────
// Both were untraced round numbers until 10 Sep 2026. The loss figure was 0.10 described as
// "technical and non-technical", which was wrong in both directions: Eskom's non-technical
// losses alone are about 8% of sales, so a combined figure would be 15-17% - but a
// cost-reflective tariff does not gross up for theft, which is recovered inside the allowed
// revenue this panel already carries.
{
  const L = T.loss_and_levies || {};
  check('the loss gross-up is technical only and in range',
        L.retail_loss_pct >= 6 && L.retail_loss_pct <= 10,
        `${L.retail_loss_pct}% held. Technical losses are about 2.5% transmission plus 5-6% `
        + `distribution. Above 10% suggests non-technical loss has been folded in, which `
        + `would double-count theft against the allowed revenue.`);

  // The environmental levy reconciles two independent ways: from Eskom's revenue build-up,
  // and from the statutory 3.5 c/kWh on non-renewable generation.
  const A = T.allowed_revenue_2026_27 || {};
  const held = (A.components_r_per_kwh || {}).environmental_levy;
  const fromStatutory = 0.035 * 161 / (A.sales_twh || 209.55);
  check('the environmental levy matches the statutory rate on coal generation',
        Math.abs(held / fromStatutory - 1) < 0.15,
        `held R${held}/kWh against R${fromStatutory.toFixed(4)} derived from 3.5 c/kWh on `
        + `161 TWh of coal generation spread over ${A.sales_twh} TWh of sales.`);

  check('carbon is not counted twice',
        !!(L.carbon_note || '').match(/UNUSED/i),
        `carbon must come from the dispatch run OR the components table, not both. The `
        + `components entry is deliberately unused and that must stay documented.`);
}

// ── 8. THE REFERENCE BLOCKS AGAINST THEIR PEERS ────────────────────────────
// Added 10 Sep 2026. The City Power block structure came from a single CSV export and was
// the one input the whole reference household rests on. Rather than confirm one PDF was
// transcribed correctly, this checks the STRUCTURE against every other municipality in the
// same database: 24 of 28 residential tariff families rise with consumption, none fall.
//
// A transcription check tests whether a number was copied right. This tests whether the
// pattern the panel reports is real.
{
  const M = T.municipal || {};
  const pv = M.peer_block_validation || {};
  const ref = M.reference || {};
  const blocks = ref.blocks || [];
  const rates = blocks.map(b => b.rate_r_per_kwh);
  const rising = rates.every((r, i) => i === 0 || r >= rates[i - 1]) && rates[rates.length - 1] > rates[0];
  check('the reference tariff has inclining blocks, like its peers',
        rising && blocks.length >= 3,
        `City Power blocks ${rates.map(r => r.toFixed(2)).join(' -> ')}. `
        + `${pv.rising} of ${pv.families_with_parseable_blocks} municipal families rise and `
        + `${pv.falling} fall, so a falling or flat reference would be the outlier and worth `
        + `checking against the published schedule before trusting.`);
  check('the peer comparison found no falling-block municipality',
        pv.falling === 0,
        `${pv.falling} distributors price DOWN with consumption. If that changes, the finding `
        + `that municipal tariffs climb with volume no longer generalises and the panel's `
        + `framing needs revisiting.`);
}

// ── 9. VAT BASIS IS STATED, NOT ASSUMED ────────────────────────────────────
// Added 10 Sep 2026 after City Power's published schedule turned out to say "All charges are
// exclusive of VAT" while the panel treated them as final prices and compared them against a
// VAT-inclusive Eskom rate. Every municipal figure was 15% low; the Johannesburg premium over
// Eskom read +4% when it is +38%.
//
// The transcription was PERFECT - all five blocks and both fixed charges matched to the cent.
// The basis was wrong. No peer-structure check reaches that, and no amount of agreement
// between 21 municipalities would have caught it.
{
  const ref = (T.municipal || {}).reference || {};
  check('the municipal reference states its VAT basis',
        typeof ref.rates_exclude_vat === 'boolean',
        `rates_exclude_vat must be set explicitly. A tariff compared against another tariff `
        + `on a different VAT basis is 15% wrong and looks entirely plausible.`);

  const hp = T.homepower4 || {};
  const hpInclusive = /includ/i.test(JSON.stringify(hp));
  check('the Eskom comparison tariff states its VAT basis',
        hpInclusive,
        `Homepower's entry must say whether its rate includes VAT. It is the target of the `
        + `panel's level check, and the municipal comparison is made against it.`);

  check('unverified charges are not carried',
        (ref.additional_energy_charge_r_per_kwh || 0) === 0
          || /source|schedule/i.test(ref.additional_charge_removed || ''),
        `an 'Additional Energy Charge' of R0.06/kWh was carried from a database export with `
        + `no explanation and did not appear in the published schedule. Worth R62/month at `
        + `900 kWh. Anything reinstated needs its source.`);
}

// ── 10. THE DISTRIBUTOR COMPARISON KNOWS ITS OWN VAT BASIS ─────────────────
// The -39% to +113% spread across municipalities was computed against a VAT-inclusive Eskom
// tariff from municipal rates that are VAT-exclusive. Audited 10 Sep 2026: of 34 distributors
// with residential tariffs, five state ex-VAT, NONE state inclusive, 29 say nothing.
//
// The working assumption is that all are ex-VAT. That is an inference for the 29, and it must
// stay visible rather than harden into a fact.
{
  const a = (T.municipal || {}).vat_basis_audit || {};
  check('the distributor VAT audit is recorded and no distributor claims VAT-inclusive',
        a.distributors > 0 && a.state_vat_inclusive === 0,
        `${a.state_ex_vat} of ${a.distributors} state ex-VAT, ${a.state_vat_inclusive} state `
        + `inclusive, ${a.state_nothing} say nothing. If a distributor turns up stating `
        + `VAT-inclusive, the uniform assumption breaks and the spread must be recomputed `
        + `per distributor rather than shifted as a block.`);
}

// ── 11. THE RETAIL MARGIN HAS A SOUTH AFRICAN SOURCE ───────────────────────
// It was imported from European dynamic tariffs and was the last constant in the panel with
// no local corroboration. Eskom's cost-to-serve study has it: Table 42 gives R9.24/POD/day of
// retail cost for category C12 urban residential, which at 900 kWh is R0.312/kWh against the
// R0.30 held.
//
// The constant is deliberately NOT tuned to 0.312 - moving it to match a single source would
// be fitting rather than checking. The check asserts they agree within 20%.
{
  const sp = T.shadow_tariff_parameters || {};
  const v = sp.retail_margin_sa_verified || {};
  const derived = (v.cts_retail_r_per_pod_day || 0) * 30.4 / 900;
  const held = sp.retail_margin_r_per_kwh;
  check('the retail margin agrees with the CTS residential retail cost',
        held > 0 && derived > 0 && Math.abs(held / derived - 1) < 0.20,
        `held R${held}/kWh against R${derived.toFixed(3)} derived from `
        + `R${v.cts_retail_r_per_pod_day}/POD/day at 900 kWh. The CTS retail column is the `
        + `retail function only - metering, billing, vending, customer service - which is the `
        + `like-for-like. What municipalities add over Eskom bulk, a median R1.86/kWh, also `
        + `covers their network and surplus and is an upper bound, not a measure.`);
}

console.log(`\n${pass}/${pass + fail} input checks passed`);
if (failures.length){
  console.log('\nFAILURES:');
  for (const [n, d] of failures) console.log(`  ${n}  —  ${d}`);
  process.exit(1);
}
