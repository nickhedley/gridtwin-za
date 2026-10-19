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
        + `x ${G.toFixed(4)} x VAT. ${gap.toFixed(1)}% apart. The held figure is the energy charge `
        + `alone; Homepower's three per-kWh charges are R3.5556 (Tariffs and Charges Booklet `
        + `2026/27, p.27), which is what the panel compares against.`);
  // MESSAGE CORRECTED 18 Oct 2026 (user, message 203 (7)). It said the R3.5556 held until 10 Sep 2026 was 10% wrong. The
  // booklet shows R3.5556 is the sum of the per-kWh charges and R3.2206 the energy charge; the logic is unchanged, and whether
  // NERSA's implied R2.305 includes network demand is not known (JSON homepower4.reconciliation_gap).
}

// ── 2. HOMEFLEX AND HOMELIGHT ARE IN CURRENT RANDS ─────────────────────────
// NERSA publishes its proposed rates in 2024/25 rand value and says so. Holding them
// unescalated understates by 22.6%. The test: a 2026/27 rate must exceed its 2024/25 base
// by the cumulative approved increase.
{
  // REPLACED 18 Oct 2026 (user, message 203 (7); Eskom Tariffs and Charges Booklet 2026/27, p.29). This required each rate to
  // equal NERSA's 2024/25 proposal grown by the approved increases, to within 2%. The booklet's published rates differ from
  // that derivation: the Homeflex high-season peak is 11% above it (R8.4710 against R7.5386), and Homelight's held figures sat
  // at the booklet's excluding-VAT rates while labelled inclusive. The check pinned a derived input, so it now tests what the
  // booklet figures must satisfy: each rate is above its 2024/25 proposal (nothing was left unescalated) and within 25% of the
  // proposal grown by the approved increases (no unit or VAT slip of that size). Looser than the old 2%, because the derivation
  // was the error; the rates themselves are the booklet's.
  const hf = T.homeflex || {};
  const now = hf.rates_r_per_kwh_2026_27 || {};
  const orig = hf.rates_r_per_kwh_2024_25_original || {};
  const keys = Object.keys(orig);
  const inBand = (held, base) => held > base && Math.abs(held / (base * G) - 1) < 0.25;
  const bad = keys.filter(k => !inBand(now[k], orig[k]));
  check('Homeflex rates are the current year\'s, above their 2024/25 proposals',
        keys.length > 0 && bad.length === 0 && /Booklet 2026\/2027/.test(hf.source || ''),
        `${bad.length} of ${keys.length} rates fall outside (2024/25 proposal, proposal x ${G.toFixed(4)} x 1.25): `
        + `${bad.join(', ')}; the source must name the 2026/27 booklet.`);

  for (const k of ['homelight20a', 'homelight60a']){
    const t = T[k] || {};
    const base = t.energy_r_per_kwh_2024_25, held = t.energy_r_per_kwh;
    if (base){
      check(`${k} holds the current year's rate, above its 2024/25 proposal`,
            inBand(held, base) && /Booklet 2026\/2027/.test(t.source || ''),
            `held R${held} against a 2024/25 proposal of R${base} (x ${G.toFixed(4)} = R${(base * G).toFixed(4)}).`);
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
  const A = T.allowed_revenue_2025_26 || {};
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
  const A = T.allowed_revenue_2025_26 || {};
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
  const A = T.allowed_revenue_2025_26 || {};
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

// ── 12. THE PRICE CAP IS BUILT ON ITS STATED METHOD ────────────────────────
// REPLACED 18 Oct 2026 (user, message 203 (5a); retail audit items 27 and 6, 'checks that would block a correct fix').
// Recorded 10 Sep 2026 as 'the price cap sits above the dearest hour the panel produces', requiring cap > R11.5: that pinned
// R12.84, built on Agile's earlier 100p cap and on Homepower's energy charge read as R3.5556. Octopus cut the cap to 70p from
// July 2026, so the rebuilt cap (R9.46) fails it by construction. Clipping is not hidden: the panel already says when the cap
// binds (THE CAP ANNOUNCES ITSELF in index.html). The check now asserts the held cap equals its stated derivation, Agile's cap
// over Ofgem's in the same quarter times Homepower's per-kWh charges, within 0.5%.
{
  const sp = T.shadow_tariff_parameters || {};
  const ci = sp.cap_inputs || {};
  const hpPerKwh = Object.values((T.homepower4 || {}).per_kwh_charges_r_per_kwh || {}).reduce((x, y) => x + y, 0);
  // As paid: Agile's pre-VAT cap while UK electricity VAT is zero (cap_inputs.vat_basis; message 205 (6)).
  const derived = (ci.agile_cap_as_paid_p_per_kwh / ci.ofgem_cap_p_per_kwh) * hpPerKwh;
  const cap = sp.cap_r_per_kwh;
  check('the price cap is Agile\'s cap over Ofgem\'s, applied to Homepower',
        cap > 0 && derived > 0 && Math.abs(cap / derived - 1) < 0.005,
        `held R${cap}/kWh against ${ci.agile_cap_as_paid_p_per_kwh}p / ${ci.ofgem_cap_p_per_kwh}p x R${hpPerKwh.toFixed(4)} = `
        + `R${derived.toFixed(2)}. Rebuild the held figure from cap_inputs when any of the three moves.`);
}

// ── 13. CANVAS SIZING IS IDEMPOTENT ────────────────────────────────────────
// Added 10 Sep 2026 after the retail charts grew on every redraw. Setting cv.height IS
// setting the height attribute, so a draw function that reads its logical height back from
// that attribute doubles the canvas each time it runs: 150, 300, 600, 1200. The first render
// looked correct because the HTML value was still in place, and toggling the week revealed it.
//
// The fix is to read from data-h, which nothing writes. This check asserts the source file
// never reads getAttribute('height') to size a canvas it is about to resize.
{
  const fsx = require('fs'), pth = require('path');
  let html = '';
  try { html = fsx.readFileSync(pth.join(ROOT, 'index.html'), 'utf8'); } catch (e) {}
  const bad = /getAttribute\('height'\)/.test(html);
  check('no canvas reads its logical height from the attribute it overwrites',
        !bad,
        `index.html reads getAttribute('height') to size a canvas. That value is overwritten `
        + `by cv.height = H * dpr, so the next render reads the scaled figure back and the `
        + `chart compounds. Use a data attribute nothing writes.`);
}

// ── 14. THE REAL-TERMS BASIS IS CONSISTENT AND DECLARED ────────────────────
// Asked 10 Sep 2026 whether the panel should inflation-link its 2040 projections. It should
// not: everything is already in constant 2026 rands. BLD_COST declines are real, BLD_DISC is
// a real discount rate, and every comparison tariff is 2026/27 - so a 2035 scenario is real
// against real.
//
// Mixing a nominal figure in would be silent and serious: it would make a scenario look
// dearer for reasons that have nothing to do with the electricity system.
{
  const rt = T.real_terms_basis || {};
  check('the real-terms basis is recorded',
        /constant 2026 rands/i.test(rt.description || ''),
        `the panel must state that it works in constant rands. A figure labelled "costed at `
        + `2035" reads as a 2035 price otherwise - at 4.5% inflation the nominal equivalent `
        + `is about 50% higher.`);
  check('the flat counterfactual is recorded as conservative',
        /conservative/i.test(JSON.stringify(rt.the_real_issue || {})),
        `the panel compares a decarbonised 2035 against a FLAT real 2026 tariff, while Eskom's `
        + `approved increases have run 4-8 points above inflation. Against a 2% real trend the `
        + `gas-firmed build goes from +6% to -12%. The distortion runs AGAINST decarbonisation `
        + `and must be stated, since choosing an escalation would embed a view.`);
}

// ── 15. THE APPROVED PATH IS SEPARATED FROM EXTRAPOLATION ──────────────────
// NERSA has approved increases only to 2027/28. MYPD7 covers FY2029 onward and has not been
// filed. The panel's scenario year of 2035 sits well past any approved determination, so the
// distinction between "approved" and "extrapolated" has to survive in the data.
{
  const e = T.escalation || {};
  const ap = e.approved_path || {};
  check('the approved tariff path names its limit',
        /HAS NOT BEEN FILED/i.test(ap.beyond_2027_28 || ''),
        `the data must record that nothing is approved beyond 2027/28. Without that, an `
        + `extrapolated figure reads as a regulatory decision.`);
  check('the secondary-source warning survives',
        /Schedule of Standard Prices/i.test(e.secondary_source_warning || ''),
        `aggregator sites disagree with Eskom on the size of the April 2026 increase - one `
        + `claims 13.67% against Eskom's official 8.76% - and one of them is where the `
        + `Homepower rate came from. The rate holds because NERSA's progression confirms it, `
        + `not because the site said so. That distinction must stay written down.`);
}

// ── 16. CURTAILMENT REACHES THE BILL THROUGH THE DENOMINATOR ───────────────
// Curtailment is not a line item. Capital and fixed obligations are recovered over SALES, and
// curtailed energy never becomes a sale - so the rands stay and the kWh shrink. On the Future
// mix that is worth about R0.25/kWh, roughly 22% of the bill, and it is invisible.
//
// The check is that the mechanism survives: if sales ever stop shrinking when curtailment
// rises, the denominator has been changed to something that does not respond and the effect
// has been silently removed.
{
  const cr = T.curtailment_and_retail || {};
  check('the curtailment mechanism is recorded',
        /DENOMINATOR/i.test(cr.mechanism || ''),
        `curtailment must be documented as a denominator effect. It has no line of its own, so `
        + `nothing on the panel would show if it stopped working.`);
  check('take-or-pay treatment of IPP obligations is recorded',
        /take-or-pay/i.test(cr.take_or_pay || ''),
        `REIPPPP contracts are take-or-pay, so curtailing an IPP does not save the payment. The `
        + `obligation is a fixed number of rands and must scale with the sales base - holding it `
        + `at a flat R/kWh quietly assumed the opposite.`);
}

// ── 17. CURTAILMENT COMPENSATION HAS A SOURCED THRESHOLD ───────────────────
// Recorded as unmodellable until 10 Sep 2026, wrongly. REIPPPP BW1-6 treat curtailment as a
// system event with a right to claim deemed energy, and the March 2024 Addendum removed the
// grid-unavailability gate in exchange for Eskom holding a 10% curtailment right.
//
// The threshold is what makes this modellable rather than a guess. If it ever goes to zero the
// panel starts charging for every curtailed kWh, which is not what the PPAs say.
{
  // REPLACED 18 Oct 2026 (user, message 205 (5); retail audit M8 and section 6, 'checks that would block a correct fix'). The two
  // checks here required a 10% threshold traced to the March 2024 Addendum and a price of R0.45-0.65/kWh. The 10% right is BW7's,
  // not BW1-6's (Cliffe Dekker Hofmeyr, 20 Mar 2024), and BW1-6's own contract prices are R1.4-1.9/kWh in the model's REIPPPP table,
  // so both pinned a wrong input. They now check the rule the panel applies: BW1-6 compensated beyond the allowable grid
  // unavailability period, recorded as not published and taken as zero; the price from the contract windows, not a held
  // constant; and no deemed energy for new build, with its reason.
  const cc = T.curtailment_compensation || {};
  check('BW1-6 deemed energy is gated by the allowable grid unavailability period, recorded as unpublished',
        cc.allowable_grid_unavailability_hours === 0 && /Not published/.test(cc.allowable_grid_unavailability_basis || '')
          && /Cliffe Dekker Hofmeyr/.test(cc.rule || ''),
        `held ${cc.allowable_grid_unavailability_hours} hours. Zero is an upper bound until the period is sourced from the PPAs; `
        + `a positive figure needs its source in allowable_grid_unavailability_basis.`);
  check('deemed energy is priced at the contract windows and new build gets none',
        /REIPPPP_WINDOWS/.test(cc.ppa_price_status || '') && cc.new_build_deemed_energy === false
          && /double count|twice/.test(cc.new_build_basis || ''),
        `the panel prices curtailed BW1-6 output at each window's own contract price (reipppRate), and new build's capital `
        + `already pays for its curtailed output; a held price or a new-build payment would undo either.`);
  check('the real-world check on curtailment payments survives',
        /backlog/i.test(cc.real_world_check || ''),
        `H1 2026 has IPPs reporting revenue 9-10% below budget and an Eskom backlog approaching `
        + `R1bn. That is the evidence the mechanism is live and material, not theoretical.`);
}

// ── 18. SCENARIOS ARE CHECKED AGAINST THE OFFICIAL PLAN ────────────────────
// Added 10 Sep 2026. The no-gas case has been called a stress test on the strength of its
// curtailment. IRP 2025 is Cabinet-approved and commits to 59 GW of new wind and solar by
// 2039 - so there is now a published plan to say it against.
//
// The gas-firmed case builds 45 GW by 2035, roughly the same trajectory. The no-gas case
// builds 97 GW, 64% above the IRP and four years earlier.
{
  const irp = T.irp2025_anchor || {};
  check('the IRP anchor is recorded with both scenarios',
        irp.irp_new_wind_and_solar_gw > 0 && !!(irp.comparison || {}).gas_firmed_60pct_re,
        `IRP 2025 commits to ${irp.irp_new_wind_and_solar_gw} GW of new wind and solar by 2039. `
        + `Without this the claim that one scenario is a stress test rests on curtailment alone.`);
  check('the sales-decline risk is recorded',
        /death spiral/i.test((T.sales_decline_risk || {}).why_it_matters || ''),
        `Eskom grid sales fell 5.6% in Q1 2026. Every fixed cost here is recovered over sales, `
        + `so a shrinking base raises the per-kWh figure for the same rands. Held flat `
        + `deliberately, alongside a flat real tariff - doubly conservative, and both must stay `
        + `written down.`);
}

// ── GAS: THE PAGE DEFAULTS ARE THE CENTRAL GAS CASE (user, 19 Oct 2026, message 227 (1)) ─────────────────
// FIXED.costCcgt is the central case's fuel cost and FIXED.bldGasTerminalRkW the midpoint of the terminal range, both from
// public_data/gas_price_cases.json (build_gas_cases.py). The fuel cost is recomputed from the case's coast price, the
// regasification and exchange rate in the file's meta and the page's efficiency, not restated.
{
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const num = re => { const m = html.match(re); return m ? +m[1] : NaN; };
  const held = num(/\n\s*costCcgt:([0-9.]+),/), eff = num(/effCcgtHHV:([0-9.]+)/), term = num(/\n\s*bldGasTerminalRkW:([0-9.]+),/);
  const G = JSON.parse(fs.readFileSync(path.join(ROOT, 'public_data', 'gas_price_cases.json'), 'utf8'));
  const what = G.meta.what || '', usd = +G.meta.conversions['R per USD'];
  const regas = +((what.match(/add USD ([0-9.]+)\/MMBtu variable regasification/) || [])[1]);
  const rng = (what.match(/R([0-9]+)-([0-9]+)\/kW-yr/) || []).slice(1).map(Number);
  const c = G.cases.central.years, ys = Object.keys(c);
  const derived = (c['2026'].coast_usd_mmbtu + regas) * usd / 0.293071 / eff;
  check('the central gas case\'s fuel cost follows from its coast price, regasification and exchange rate',
        Math.abs(derived - c['2026'].fuel_r_mwh) < 0.01, `derived R${derived.toFixed(2)}, file R${c['2026'].fuel_r_mwh}`);
  check('the page\'s gas fuel default (costCcgt) is the central case, flat in every year',
        ys.every(y => Math.abs(c[y].fuel_r_mwh - held) < 0.005), `costCcgt R${held} against the case's R${c['2026'].fuel_r_mwh}`);
  check('the page\'s LNG terminal charge is the midpoint of the sourced range',
        rng.length === 2 && Math.abs(term - (rng[0] + rng[1]) / 2) < 1e-9, `bldGasTerminalRkW R${term} against R${rng.join('-')}`);
}

console.log(`\n${pass}/${pass + fail} input checks passed`);
if (failures.length){
  console.log('\nFAILURES:');
  for (const [n, d] of failures) console.log(`  ${n}  —  ${d}`);
  process.exit(1);
}
