#!/usr/bin/env node
/**
 * validate_benchmarks.js — Session 4 of the bug hunt.
 *
 * Reconciles EVERY CARRIER against published data, not just the national total.
 * We already matched Ember on the total to 0.02%, but a total can match while
 * two carriers are wrong in opposite directions — and that is precisely how the
 * wind nameplate (3,466 against a real 4,044 MW) and the nuclear capacity factor
 * (applied gross when the model is sent-out) survived for months.
 *
 * THE RULE THIS ENFORCES: a gap with a documented reason is fine; a gap without
 * one is a bug you have not found yet. Every entry below therefore carries both
 * a tolerance AND the reason the gap exists. If a reconciliation drifts outside
 * its band, either the model changed or the explanation was wrong.
 *
 * BASIS. The model produces SENT-OUT energy throughout. Ember publishes GROSS.
 * Converting Ember down at each carrier's own auxiliary rate — coal 7.7%,
 * nuclear 5%, renewables nil — is what closed the apparent 11% coal gap on
 * 16 Aug 2026, and is applied per carrier here rather than as one national
 * factor.
 *
 *   node validate_benchmarks.js [root]
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = process.argv[2] || '.';
let pass = 0, fail = 0;
const rows = [], failures = [], notes = [];

// ── the benchmark set ───────────────────────────────────────────────────────
// value      : the published figure, on the SAME BASIS as the model (sent-out)
// tolPct     : how far the model may sit from it before this is a finding
// why        : why a gap exists at all, and why that tolerance is right
//
// Anything with a wide tolerance must justify it. A wide band with a vague
// reason is how a real error hides.
const BENCH = {
  coal: {
    value: 164.0, tolPct: 6, unit: 'TWh',
    source: 'Ember 2025 gross 177.7 TWh, converted at 7.7% station auxiliary',
    why: 'The model is sent-out and Ember is gross. Converting per carrier closed what looked ' +
         'like an 11% shortfall on 16 Aug 2026. Residual is dispatch timing, not level.',
  },
  nuclear: {
    value: 10.95, tolPct: 8, unit: 'TWh',
    source: 'Ember 2025 gross 11.5 TWh at 5% auxiliary',
    why: 'Koeberg output swings with refuelling outages, so a single year is a poor benchmark. ' +
         'CF was corrected 0.90 -> 0.75 -> 0.70 on 16 Aug once the sent-out basis was applied.',
  },
  wind: {
    value: 11.60, tolPct: 15, unit: 'TWh',
    source: 'Ember 12 months to May 2026, NTCSA-metered fleet',
    why: 'The model INCLUDES privately wheeled wind that Ember does not count, so the model ' +
         'should read ABOVE this. A model figure BELOW the benchmark would be the real alarm.',
  },
  solarUtility: {
    value: 6.5, tolPct: 20, unit: 'TWh',
    source: 'Ember utility-scale PV, 12 months to May 2026',
    why: 'Wide band: the utility/rooftop split differs between sources, and wheeled plant sits ' +
         'on the model side only.',
  },
  hydro: {
    value: 2.9, tolPct: 25, unit: 'TWh',
    source: 'Eskom hydro plus SAPP hydro imports attributed to domestic hydro',
    why: 'Small carrier, highly rainfall-dependent, and the import/domestic boundary is drawn ' +
         'differently by different sources.',
  },
  imports: {
    value: 4.09, tolPct: 12, unit: 'TWh',
    source: 'Eskom integrated report FY2026, audited energy balance',
    why: 'REBASED 31 Aug 2026 from 8.56 TWh. The old figure came from CONTRACT capacity - ' +
         '1.15 GW firm at high availability - which is an assumption about utilisation, not a ' +
         'measurement. Eskom now publishes three years of audited imports: 9,150 GWh FY2024, ' +
         '7,570 FY2025, 4,090 FY2026. Deliveries have MORE THAN HALVED in two years. ' +
         'This is not a relaxed check: it moves from an assumed utilisation to an audited one, ' +
         'and the tolerance is 12% rather than 5% only because imports are visibly trending, ' +
         'so a year-on-year move is expected rather than a fault. If it fails, check whether ' +
         'a newer Eskom energy balance has been published before touching the constant.',
  },
  co2: {
    value: 175, tolPct: 12, unit: 'Mt',
    source: 'Ember 2025 power-sector CO2 for South Africa',
    // CROSS-CHECKED 1 Sep 2026 against Eskom's own coal burn, after EDMSA Scenario A put
    // 2025 emissions at 195 Mt against our 174.5. Eskom FY2026 burnt 96.5 Mt of coal for
    // about 165 TWh. The implied emission factor depends entirely on calorific value:
    //
    //   CV 19 GJ/t   ->  173.4 Mt   1.049 t/MWh     our emisCoal is 1.040
    //   CV 20 GJ/t   ->  182.6 Mt   1.104 t/MWh
    //   CV 21 GJ/t   ->  191.7 Mt   1.159 t/MWh
    //
    // Our 1.04 corresponds to roughly 19 GJ/t, which is a defensible figure for Eskom's
    // low-grade burn. Eskom's reported 184.5 MtCO2e is a different quantity again - group
    // Scope 1, all greenhouse gases, not power-sector CO2 - so it is not the comparator.
    //
    // THREE NUMBERS, THREE BOUNDARIES. Anyone challenging this should be asked which they
    // mean before the constant is touched. Ember's power-sector CO2 is the right
    // comparator for a power-system model and we sit within 0.3% of it.
    why: 'Follows the coal reconciliation, plus the part-load heat-rate penalty added 17 Aug ' +
         'which raises emissions per MWh by ~1.5% at default.',
  },
};

// Capacity factors are a SEPARATE test from energy: a carrier can hit its energy
// target with the wrong capacity and the wrong CF, and the two errors cancel.
// That is exactly what the wind nameplate bug did — energy matched Ember to 0.2%
// while the nameplate was 578 MW light and the CF correspondingly overstated.
const CF_BENCH = {
  cfWind:    { lo: 28, hi: 38, why: 'SA fleet averages ~32-35%; Eastern Cape sites reach the low 40s' },
  // RENEWABLE SHARE, added 31 Aug 2026 from Eskom's FY2026 annual results: renewables
  // at 11.7% of power supplied. Checked on the RESIDUAL basis - rooftop removed from
  // numerator AND denominator - because Eskom cannot see behind-the-meter generation,
  // so 'power supplied' is a residual figure by construction. The model returns 12.0%.
  //
  // Band is +/-2 points rather than tight: Eskom's exact treatment of hydro, imports
  // and IPP output is not stated in the results presentation, and any of those would
  // move it by a point. It is a SANITY CHECK against a published national figure, not
  // a precision test - but it is the closest external corroboration this model has for
  // its headline mix.
  reShareResid: { lo: 9.7, hi: 13.7, why: 'Eskom FY2026 annual results: renewables 11.7% of power supplied' },
  // DEMAND BASIS. Added 31 Aug 2026 after nearly adding a distribution-loss term the
  // model did not need. profiles.json is built on `gross grid demand + est rooftop`,
  // which is Eskom's ENERGY AVAILABLE FOR DISTRIBUTION - before the 23,921 GWh of
  // technical losses. So the model's grid generation should track 206.0 TWh, NOT the
  // 178.0 TWh of sales.
  //
  // This check exists to stop the basis being changed by accident. If it fails high by
  // roughly 17%, someone has compared against sales; if it drops by roughly 12%,
  // someone has added a loss term that double-counts what is already in the demand.
  // SURPLUS CAPACITY AT THE ANNUAL PEAK. Added 31 Aug 2026 against Eskom's FY2026
  // statement: "improved generation availability has created an estimated 2-3 GW surplus
  // capacity, positioning Eskom to attract new demand rather than ration it".
  //
  // ESKOM DOES NOT PUBLISH ITS METHOD, so this band covers the defensible definitions
  // rather than picking the one that fits best:
  //     less operating reserve only                        3.4 GW
  //     less reserve and contracted imports                2.9 GW
  //     less reserve, imports and VRE credit at peak       2.2 GW
  // Two of the three sit inside Eskom's range. Band is 1.8-4.0 GW: tight enough to catch
  // a real adequacy drift, loose enough not to fail on a definition nobody published.
  //
  // WHAT IT GUARDS: this is the first check on the ADEQUACY side against a published
  // national figure. If the model ever reports a system that is comfortable when Eskom
  // says it is tight, or vice versa, this is where it shows.
  // PEAKER SEASONALITY, not level. Added 31 Aug 2026 from Eskom's own hourly file:
  // peakers run 8.5x more in Jan-Mar than Jul-Sep, because maintenance is scheduled away
  // from the winter peak. The model reproduces Jan and Feb to within half a point.
  //
  // The LEVEL is deliberately NOT benchmarked. 63% of Eskom's peaker output runs below
  // 25 GW of demand with ~25.8 GW of coal available - reserve, network support and
  // ramping, none of which an energy merit order prices. A model that dispatches on
  // economics cannot reproduce it, and a level benchmark would invite tuning availability
  // to fit the right total for the wrong reason. That mistake was made and withdrawn
  // twice on 31 Aug; this comment exists so it is not made a third time.
  peakerSeasonRatio: { lo: 2.0, hi: 12.0, unit: 'x', why: 'Eskom hourly 2025 (ESK19243): '
    + 'Jan-Mar peaker output is 8.5x Jul-Sep. Band is wide because the model reproduces '
    + 'the shape, not the level' },
  surplusGW: { lo: 1.8, hi: 4.0, unit: 'GW', why: 'Eskom FY2026: an estimated 2-3 GW surplus '
    + 'capacity, first time in over a decade. Method not published - band spans the '
    + 'defensible definitions' },
  gridGenTWh: { lo: 190, hi: 222, unit: 'TWh', why: 'Eskom FY2026 audited: energy available for distribution '
    + '206.0 TWh. NOT sales, which are 178.0 TWh - losses of 23.9 TWh sit between them' },
  cfPv:      { lo: 19, hi: 27, why: 'SA fixed-tilt utility PV, 21-24% typical; tracking reaches 26-28%' },
  cfRooftop: { lo: 14, hi: 22, why: 'Below utility PV: mixed orientation, shading, no tracking, urban siting' },
  cfNuclear: { lo: 60, hi: 85, why: 'Koeberg between refuelling outages; sent-out basis, not gross' },
  cfCoal:    { lo: 35, hi: 60, why: 'Constrained by EAF, not by demand. At 68% EAF and partial loading, ~44%' },
};

const check = (name, ok, detail) => {
  if (ok) pass++; else { fail++; failures.push(`${name}${detail ? '  —  ' + detail : ''}`); }
};

(async () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const dom = new JSDOM(html, {
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
  const w = dom.window;
  const el = w.document.createElement('script');
  el.textContent = `window.__bm = (() => { try {
    const r = simulate(state, PROFILES); const E = r.E;
    const cf = (twh, mw) => mw > 0 ? twh*1e6/(mw*8760)*100 : 0;
    return {
      coal: E.coal/1e6, nuclear: E.nuclear/1e6, wind: E.wind/1e6,
      solarUtility: E.pv/1e6, rooftop: E.rooftop/1e6, csp: E.csp/1e6,
      hybrid: (E.hybrid||0)/1e6, hydro: E.hydro/1e6, imports: E.imports/1e6,
      ps: E.ps/1e6, batt: E.batt/1e6, ccgt: E.ccgt/1e6, diesel: E.diesel/1e6,
      co2: r.co2,
      cfWind: cf(E.wind/1e6, FIXED.windMW), cfPv: cf(E.pv/1e6, FIXED.pvUtilityMW),
      // Existing-fleet constants, for the Eskom Integrated Report 2026 p10 checks below.
      fleetCoal: FIXED.coalInstalledMW, fleetNuclear: FIXED.nuclearMW,
      fleetPs: FIXED.psPowerMW, fleetHydro: FIXED.hydroMW,
      // Residual basis: rooftop out of numerator and denominator, matching how Eskom
      // reports 'power supplied' - it cannot meter behind the customer's meter.
      // Surplus at the annual peak: what could still have run, less the reserve held.
      peakerSeasonRatio: (() => {
        const MD = [31,28,31,30,31,30,31,31,30,31,30,31];
        const bym = new Array(12).fill(0);
        let h = 0;
        for (let m = 0; m < 12; m++){
          const n = MD[m] * 24;
          for (let k = 0; k < n && h < 8760; k++, h++)
            bym[m] += (r.stack.ccgt[h] || 0) + (r.stack.diesel[h] || 0);
        }
        const q1 = bym[0] + bym[1] + bym[2], q3 = bym[6] + bym[7] + bym[8];
        return q3 > 0 ? q1 / q3 : null;
      })(),
      surplusGW: (() => {
        const L = r.loadS; let ph = 0, pk = -1;
        for (let h = 0; h < L.length; h++) if (L[h] > pk){ pk = L[h]; ph = h; }
        const st = r.stack;
        const avail = (FIXED.coalInstalledMW - (st._decom || 0)) * FIXED.coalEAFPct / 100
          + FIXED.nuclearMW * 0.9 + FIXED.hydroMW + FIXED.psPowerMW + FIXED.battPowerMW
          + FIXED.ocgtDieselMW + FIXED.importsMW * FIXED.importsCF;
        const vre = st.wind[ph] + st.pv[ph] + st.csp[ph];
        const res = (r.reserveMW || [])[ph] || r.resReqMeanMW || 0;
        return (avail + vre - pk - res) / 1000;
      })(),
      // Grid generation excluding rooftop, which is behind the meter and never reaches
      // the distribution network. Compare against energy AVAILABLE, not sales.
      gridGenTWh: (E.coal + E.nuclear + E.ccgt + E.diesel + E.hydro + E.ps + E.wind
                   + E.pv + E.csp + (E.hybrid || 0) + E.imports) / 1e6,
      reShareResid: (() => {
        const gen = E.wind + E.pv + E.csp + (E.hybrid || 0) + E.rooftop + E.hydro;
        const tot = Object.keys(E).filter(k => !['curtailed','unserved','exported'].includes(k))
                          .reduce((a, k) => a + E[k], 0);
        return 100 * (gen - E.rooftop) / Math.max(1, tot - E.rooftop);
      })(),
      cfRooftop: cf(E.rooftop/1e6, FIXED.rooftopMW),
      cfNuclear: cf(E.nuclear/1e6, FIXED.nuclearMW),
      cfCoal: cf(E.coal/1e6, FIXED.coalInstalledMW),
      windMW: FIXED.windMW, pvMW: FIXED.pvUtilityMW, rooftopMW: FIXED.rooftopMW,
      nuclearMW: FIXED.nuclearMW, coalMW: FIXED.coalInstalledMW,
      domestic: (E.coal+E.nuclear+E.hydro+E.wind+E.pv+E.csp+(E.hybrid||0)+E.rooftop+E.ccgt+E.diesel)/1e6,
    };
  } catch (e) { return { err: String(e) }; } })();`;
  w.document.body.appendChild(el);
  const M = w.__bm;
  if (!M || M.err) { console.log('FATAL:', M ? M.err : 'no result'); process.exit(1); }

  console.log('\nPER-CARRIER RECONCILIATION, sent-out basis');
  console.log('  carrier          model    bench     gap    band');
  for (const [k, b] of Object.entries(BENCH)) {
    const v = M[k];
    if (typeof v !== 'number') { notes.push(`${k}: no model value`); continue; }
    const gapPct = 100 * (v - b.value) / b.value;
    const ok = Math.abs(gapPct) <= b.tolPct;
    console.log(`  ${k.padEnd(14)} ${v.toFixed(2).padStart(7)} ${b.value.toFixed(2).padStart(8)} ` +
                `${(gapPct >= 0 ? '+' : '') + gapPct.toFixed(1) + '%'} `.padStart(9) +
                `  ±${b.tolPct}%${ok ? '' : '   <-- OUTSIDE'}`);
    check(`${k} reconciles with ${b.source.split(',')[0]}`, ok,
          ok ? '' : `model ${v.toFixed(2)} vs ${b.value} ${b.unit} = ${gapPct.toFixed(1)}%, band ±${b.tolPct}%. ${b.why}`);
    rows.push({ carrier: k, model: +v.toFixed(2), bench: b.value, gapPct: +gapPct.toFixed(1) });
  }

  // Wind must read ABOVE Ember, not merely near it: the model counts privately
  // wheeled plant that Ember excludes. Being below would mean capacity is missing.
  check('wind reads ABOVE the NTCSA-metered benchmark, as wheeling implies',
        M.wind >= BENCH.wind.value,
        `model ${M.wind.toFixed(2)} TWh vs Ember-comparable ${BENCH.wind.value} TWh — ` +
        `the model includes wheeled wind that Ember does not, so below is wrong`);

  console.log('\nCAPACITY FACTORS — a separate test, because energy and CF errors can cancel');
  console.log('  metric           model     plausible band');
  for (const [k, b] of Object.entries(CF_BENCH)) {
    const v = M[k];
    const ok = v >= b.lo && v <= b.hi;
    // Unit-aware. This block assumed every RANGE band was a percentage, so a TWh band
    // printed as "210.2%    190-222%". Harmless to the check, misleading to read - and
    // the first band added in another unit was the one asserting a DEMAND BASIS, where
    // a wrong unit is exactly the confusion it exists to prevent.
    const u = b.unit || '%';
    console.log(`  ${k.padEnd(14)} ${v.toFixed(1).padStart(7)} ${u}   ${b.lo}–${b.hi} ${u}${ok ? '' : '   <-- OUTSIDE'}`);
    check(`${k} is physically plausible`, ok, ok ? '' : `${v.toFixed(1)} ${u} outside ${b.lo}-${b.hi} ${u}. ${b.why}`);
  }

  // The national identity that closed the Ember reconciliation on 16 Aug. If this
  // drifts, one of the carriers above moved without its benchmark moving.
  const totalWithImports = M.domestic + M.imports;
  check('domestic + imports reconciles with the Ember-equivalent total',
        Math.abs(totalWithImports - 218.8) / 218.8 < 0.05,
        `${totalWithImports.toFixed(2)} TWh vs 218.8 TWh Ember-equivalent`);

  // Carriers with no benchmark are still worth bounding: a silent collapse to
  // zero, or a tenfold jump, is a bug whatever the published figure.
  const SANITY = { csp: [1.0, 3.5], hybrid: [0.5, 4.0], ps: [1.5, 6.0], diesel: [0, 3.0] };
  for (const [k, [lo, hi]] of Object.entries(SANITY))
    check(`${k} is within a sane range`, M[k] >= lo && M[k] <= hi,
          `${M[k].toFixed(3)} TWh outside ${lo}-${hi} TWh`);


  // ── ESKOM INTEGRATED REPORT 2026, PAGE 10 ────────────────────────────────
  // The primary source for the existing fleet. Checked 2 Sep 2026: coal was exactly right
  // at 39,692 MW, three others were not - nuclear 1,860 against 1,880, pumped storage
  // 2,900 against 2,724, hydro 600 against 602.
  //
  // OCGT is deliberately NOT asserted. The report gives 2,380 MW, which is Eskom-only;
  // the model's 3,400 is a system total including the Avon and Dedisa IPP peakers. A
  // different boundary, not an error, and a check ignoring that would force a wrong fix.
  for (const [k, want, lab] of [['fleetCoal', 39692, 'coal-fired stations'],
                                ['fleetNuclear', 1880, 'nuclear'],
                                ['fleetPs', 2724, 'pumped storage'],
                                ['fleetHydro', 602, 'hydro']]){
    check(`[Eskom IR2026 p10] ${lab} ${want.toLocaleString()} MW`,
          Math.abs(M[k] - want) < 1,
          `model holds ${M[k]} against ${want} in the Integrated Report 2026`);
  }

  console.log(`\n${pass}/${pass + fail} benchmark checks passed`);
  if (failures.length) { console.log('\nFAILURES:'); failures.forEach(f => console.log('  ' + f)); }
  if (notes.length) { console.log('\nNOTES:'); notes.forEach(n => console.log('  ' + n)); }
  process.exit(fail ? 1 : 0);
})();
