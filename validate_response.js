#!/usr/bin/env node
/**
 * validate_response.js — Session 2 of the bug hunt.
 *
 * Builds a full PARAMETER x OUTPUT response matrix: for every control, at six
 * points across its range, which outputs move and in which direction.
 *
 * Three things this catches that nothing else does:
 *
 *   1. FALSY-ZERO BUGS. `x || N` silently substitutes a default when x is 0, so
 *      a parameter set to zero behaves as if it were at its default. Seven of
 *      these were found in the CCS block on 15 Aug 2026 by sweeping to zero. A
 *      nudge test never finds them; only testing the EDGE does.
 *
 *   2. PARAMETERS THAT REACH ONE OUTPUT BUT NOT ANOTHER. The part-load heat rate
 *      moved cost but not CO2 or price, because it was applied in one place and
 *      read before it was written in another. A per-output matrix shows the hole.
 *
 *   3. WRONG-DIRECTION RESPONSES. Where theory fixes the sign, assert it. More
 *      solar cannot raise coal generation; a higher carbon price cannot raise
 *      emissions. These are the errors that survive review because the number
 *      still looks plausible.
 *
 * The matrix is written to response_matrix.json. Commit it: a future change that
 * alters the matrix without explanation is a regression, and diffing it is a far
 * faster review than re-reading the diff.
 *
 *   node validate_response.js [root] [--write-baseline]
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '.';
const WRITE = process.argv.includes('--write-baseline');
const BASELINE = path.join(ROOT, 'response_matrix.json');

let pass = 0, fail = 0;
const failures = [], notes = [];
const check = (name, ok, detail) => {
  if (ok) pass++; else { fail++; failures.push(`${name}${detail ? '  —  ' + detail : ''}`); }
};

// Outputs tracked for every parameter. Deliberately spans dispatch, cost,
// emissions, price and adequacy — a parameter that moves one but not its
// siblings is the signal we are hunting.
const OUTPUTS = ['coalTWh', 'co2', 'avgCost', 'replAvg', 'avgPrice', 'rePct', 'curtTWh', 'loleHrs'];

// Where theory fixes the sign, assert it. Only rules that are genuinely
// unambiguous — anything arguable is left to the matrix diff instead.
//   +1  raising the parameter must not DECREASE the output
//   -1  raising the parameter must not INCREASE the output
const SIGN_RULES = {
  newWindMW:      { coalTWh: -1, co2: -1 },
  newPvMW:        { coalTWh: -1, co2: -1 },
  newRooftopMW:   { coalTWh: -1, co2: -1 },
  newNuclearMW:   { coalTWh: -1, co2: -1 },
  demandGrowthPct:{ coalTWh: +1, co2: +1 },
  coalDecomMW:    { coalTWh: -1 },
  carbonTaxRPerT: { co2: -1 },
  coalEAFPct:     { loleHrs: -1 },
  // LCOE sliders are pure accounting: they must move replacement cost and must
  // NOT move dispatch. A dispatch response would mean cost had leaked into the
  // merit order.
  lcoePv:         { coalTWh: 0, co2: 0 },
  lcoeWind:       { coalTWh: 0, co2: 0 },
  lcoeBatt:       { coalTWh: 0, co2: 0 },
  lcoeNuclear:    { coalTWh: 0, co2: 0 },
};

// Parameters whose effect is invisible in the single-node dispatch engine —
// they act on the regional build optimiser instead. Excluded from "must move
// something", with the reason recorded so the exemption cannot rot into a
// dumping ground.
// A control can be perfectly correct and still move nothing at defaults, because
// the thing it governs is switched off or the system is not under the stress it
// applies to. Each entry says what must be true for the parameter to bite. Same
// discipline as stress_deep.js: an exemption always carries its reason, so the
// list cannot quietly become a place to hide dead controls.
const CONTEXT = {
  drInterruptMW:    { coalEAFPct: 55 },   // interruptible load only fires in a shortage
  drInterruptCostR: { coalEAFPct: 55, drInterruptMW: 2000 },
  vppGeyserPoolMW:  { vppEnrolPct: 50 },  // pool size is irrelevant at zero enrolment
  syncMinMW:        { newWindMW: 30000, newPvMW: 30000 }, // only binds when VRE displaces synchronous plant
  costCcgt:         { newCcgtMW: 4000, coalEAFPct: 55 },  // gas must actually run
  lcoeCcgt:         { newCcgtMW: 4000 },  // and must exist to be costed
  lcoeVrfb:         { newVrfbMW: 5000 },
  lcoeIronAir:      { newIronAirMW: 5000 },
  lcoeCsp:          { },                  // CSP exists in the base fleet
  ccgtForceLoad:    { newCcgtMW: 4000 },
  reserveContingencyMW: { reserveEnabled: 1, coalEAFPct: 55 },
  reserveRegulatingPct: { reserveEnabled: 1, coalEAFPct: 55 },
  reserveVrePct:        { reserveEnabled: 1, newWindMW: 30000 },
  outageForcedSharePct: { outageUnitLevel: 1, coalEAFPct: 55 },
  outageMttrH:          { outageUnitLevel: 1, coalEAFPct: 55 },
  ccsCaptureRatePct:{ ccsEnabled: 1 }, ccsPenaltyPct: { ccsEnabled: 1 },
  ccsOpexR: { ccsEnabled: 1 }, ccsCapexR: { ccsEnabled: 1 }, ccsTsR: { ccsEnabled: 1 },
  coalRampFlexPct:  { coalFlexPct: 1 },
  // Nothing to export without a surplus, and no price effect without capacity.
  exportCapMW:  { newWindMW: 45000, newPvMW: 52000, coalDecomMW: 27000 },
  // Paid for AVAILABILITY, not energy - acts on the build LP via bldNetAnnuity(),
  // so a dispatch sweep cannot see it. Verified in stress_deep F1b/F1c instead.
  capacityPaymentRkWyr: { __skip: true },
  // Revenue stream, not a dispatch signal - see stress_deep for the same note.
  asInertiaRkWyr: { __skip: true },
  // GATED BY TOGGLES (added 20 Aug 2026). All three market-design levers default
  // OFF, since South Africa procures none of them today. The slider cannot move
  // anything until its toggle is on, so the sweep must enable it first.
  asReserveRMWh: { asReserveOn: true, newBattMW: 4000, newWindMW: 30000 },
  // The toggles themselves are revenue/build levers, not dispatch signals - same
  // reason their sliders are skipped above.
  asInertiaOn:       { __skip: true },
  capacityPaymentOn: { __skip: true },
  exportPriceR: { exportCapMW: 3000, newWindMW: 45000, newPvMW: 52000, coalDecomMW: 27000 },
};

const BUILD_ONLY = {
  // Feeds runMC() - the Monte Carlo risk panel - and nothing in simulate(). It
  // is the VOLATILITY of the outage distribution, which only means anything
  // across repeated draws, so a single deterministic run cannot show it.
  outVolPct: 'drives the Monte Carlo risk panel only; simulate() is one deterministic draw',
  gridBeyondGccaPct: 'scales GCCA headroom in the build LP; the dispatch engine has no headroom concept',
  vppRegion:         'siting only matters regionally; the single-node engine has no geography',
  txRPerKWyr:        'transmission adder priced in the build LP',
  carbonCapEnabled:  'constrains the build LP only',
  carbonCapMt:       'constrains the build LP only',
  getsEnabled:       'grid-enhancing tech acts on corridors in the build LP',
  repurpose:         'connection reuse only affects the build LP transmission adder',
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

  const run = src => {
    const el = w.document.createElement('script');
    el.textContent = 'window.__rr = (() => { try { ' + src + ' } catch (e) { return { err: String(e) }; } })();';
    w.document.body.appendChild(el);
    return w.__rr;
  };

  // The sweep runs inside the page: one simulate() per point, six points per
  // parameter, roughly 250 runs. Doing it in a single injected script avoids
  // hundreds of DOM round-trips.
  const M = run(`
    const CONTEXT = ${JSON.stringify(CONTEXT)};
    const OUT = r => {
      const E = r.E;
      const dom_ = E.coal+E.nuclear+E.hydro+E.wind+E.pv+E.csp+(E.hybrid||0)+E.rooftop+E.ccgt+E.diesel;
      let lole = 0; for (let h = 0; h < 8760; h++) if (r.stack.unserved[h] > 1) lole++;
      return {
        coalTWh: +(E.coal/1e6).toFixed(3),
        co2:     +r.co2.toFixed(3),
        avgCost: +r.avgCost.toFixed(2),
        replAvg: +r.replAvg.toFixed(2),
        avgPrice:+r.priceStats.avg.toFixed(2),
        rePct:   +(100*(E.wind+E.pv+E.csp+(E.hybrid||0)+E.rooftop+E.hydro)/dom_).toFixed(3),
        curtTWh: +(E.curtailed/1e6).toFixed(3),
        loleHrs: lole,
      };
    };
    const base = OUT(simulate(state, PROFILES));
    const matrix = {}, errors = {}, defaults = {};

    // NON-SLIDER PARAMETERS. Several meaningful-zero constants live in FIXED and
    // are reachable only by URL, so iterating SLIDERS misses them entirely — as
    // this harness did on first run, when a deliberately reintroduced CCS
    // falsy-zero bug sailed through 65/65. These are the same constants
    // stress_deep's G0 guard sweeps, and they are exactly where x || N hides.
    const EXTRA = {
      ccsCaptureRatePct: { pts: [0, 45, 90], ctx: { ccsEnabled: 1 } },
      ccsPenaltyPct:     { pts: [0, 10, 25], ctx: { ccsEnabled: 1 } },
      ccsOpexR:          { pts: [0, 180, 400], ctx: { ccsEnabled: 1 } },
      coalInstalledMW:   { pts: [0, 20000, 42000], ctx: {} },
      battHours:         { pts: [0, 4, 12], ctx: { battPowerMW: 8000, newBattMW: 0 } },
      emisCoal:          { pts: [0, 0.5, 1.04], ctx: {} },
      psEff:             { pts: [0.5, 0.76, 0.95], ctx: {} },
    };
    for (const [id, spec] of Object.entries(EXTRA)) {
      const rows = {};
      for (const v of spec.pts) {
        try { rows[String(v)] = OUT(simulate({ ...state, ...spec.ctx, [id]: v }, PROFILES)); }
        catch (e) { errors[id] = String(e); }
      }
      matrix[id] = rows;
      defaults[id] = (typeof FIXED !== 'undefined' && FIXED[id] !== undefined) ? FIXED[id] : state[id];
    }

    for (const sl of SLIDERS) {
      // Readouts render a live summary line and write nothing to state, so they
      // cannot move an output. Excluded rather than exempted by name, so the
      // next readout does not fail the same way.
      if (sl.grp || !sl.id || sl.readout) continue;
      if ((CONTEXT[sl.id]||{}).__skip) continue;   // build-LP only; see note above
      const id = sl.id;
      let pts;
      if (sl.toggle)      pts = [0, 1];
      else if (sl.select) pts = sl.select.slice(0, 4);
      else {
        const lo = sl.min ?? 0, hi = sl.max ?? 1;
        // ZERO IS ALWAYS TESTED even when it is not the minimum: that is where
        // falsy-zero bugs live.
        pts = [...new Set([0, lo, lo+(hi-lo)*0.25, lo+(hi-lo)*0.5, lo+(hi-lo)*0.75, hi])];
      }
      const ctx = CONTEXT[id] || {};
      const rows = {};
      for (const v of pts) {
        try {
          const r = simulate({ ...state, ...ctx, [id]: v }, PROFILES);
          rows[String(v)] = OUT(r);
        } catch (e) { errors[id] = String(e); }
      }
      matrix[id] = rows;
      defaults[id] = state[id];
    }
    return { base, matrix, errors, defaults };
  `);

  if (!M || M.err) { console.log('FATAL:', M ? M.err : 'no result'); process.exit(1); }

  // ── analyse ───────────────────────────────────────────────────────────────
  const summary = {};
  for (const [id, rows] of Object.entries(M.matrix)) {
    const pts = Object.keys(rows);
    if (!pts.length) { check(`${id} produced results`, false, 'no successful runs'); continue; }

    const moved = {};
    for (const o of OUTPUTS) {
      const vals = pts.map(p => rows[p][o]).filter(v => typeof v === 'number');
      const lo = Math.min(...vals), hi = Math.max(...vals);
      const span = hi - lo;
      const rel = Math.abs(M.base[o]) > 1e-9 ? span / Math.abs(M.base[o]) : span;
      moved[o] = rel > 1e-4;
    }
    summary[id] = moved;

    // 1. every parameter must move SOMETHING, unless it is build-only
    const any = Object.values(moved).some(Boolean);
    if (!BUILD_ONLY[id])
      check(`${id} moves at least one dispatch output`, any,
            any ? '' : 'no output responded anywhere in its range — dead control or falsy-zero');
    else if (any)
      notes.push(`${id} is listed build-only but DID move a dispatch output — re-check the exemption`);

    // 2. sign rules
    const rules = SIGN_RULES[id];
    if (rules) for (const [o, want] of Object.entries(rules)) {
      const nums = pts.map(p => ({ x: parseFloat(p), y: rows[p][o] }))
                      .filter(d => !isNaN(d.x) && typeof d.y === 'number')
                      .sort((a, b) => a.x - b.x);
      if (nums.length < 2) continue;
      const first = nums[0].y, last = nums[nums.length-1].y;
      const tol = Math.max(1e-6, Math.abs(M.base[o]) * 2e-3);
      if (want === 0)
        check(`${id} must NOT move ${o}`, Math.abs(last - first) <= tol,
              `moved ${first} -> ${last}; an accounting slider is affecting dispatch`);
      else if (want > 0)
        check(`${id} raises ${o} (or holds)`, last >= first - tol, `${first} -> ${last}`);
      else
        check(`${id} lowers ${o} (or holds)`, last <= first + tol, `${first} -> ${last}`);
    }

    // 3. THE FALSY-ZERO DETECTOR, done properly.
    //
    // The signature of `x || N` is not "zero does nothing" - it is that ZERO
    // BEHAVES LIKE THE DEFAULT while the rest of the range behaves normally. So
    // compare zero against the sweep's OWN trend, not against a contextless base
    // run: an earlier version did the latter and flagged every parameter that has
    // an enabling context, burying the signal.
    const nz = pts.map(x => parseFloat(x)).filter(x => !isNaN(x) && x > 0).sort((a,b) => a-b);
    if (rows['0'] && nz.length >= 2 && !BUILD_ONLY[id]) {
      const loK = String(nz[0]), hiK = String(nz[nz.length-1]);
      if (rows[loK] && rows[hiK]) for (const o of OUTPUTS) {
        const z = rows['0'][o], lo = rows[loK][o], hi = rows[hiK][o];
        if ([z, lo, hi].some(v => typeof v !== 'number')) continue;
        const span = Math.abs(hi - lo);
        // MATERIALITY. A real falsy-zero bug is a STEP: the CCS capture rate at
        // zero reported 23.3 Mt instead of 220.7, an order of magnitude. Anything
        // under 1% of the base value is dispatch noise from a marginal unit
        // switching order, and reporting it drowns the signal — the first version
        // of this flagged nine sub-0.5% wiggles on the VPP controls alone.
        if (span < Math.abs(M.base[o]) * 0.01) continue;

        // ONLY MEANINGFUL WHERE THE RESPONSE IS MONOTONE. A falsy-zero bug shows
        // as zero sitting on the wrong side of the trend — but if there is no
        // trend, that test says nothing. The VPP controls are legitimately
        // non-monotonic (peak falls to about 50% enrolment, then the peak
        // relocates to the small hours and rises again), and the first version of
        // this detector reported eleven false positives on them.
        const seq = nz.map(x => rows[String(x)] && rows[String(x)][o])
                      .filter(v => typeof v === 'number');
        let up = 0, dn = 0;
        for (let i = 1; i < seq.length; i++) {
          const d = seq[i] - seq[i-1];
          if (d >  Math.abs(M.base[o]) * 1e-4) up++;
          if (d < -Math.abs(M.base[o]) * 1e-4) dn++;
        }
        if (up > 0 && dn > 0) continue;   // not monotone — the test cannot speak

        const trendUp = hi > lo;
        const ok = trendUp ? (z <= lo + span * 0.02) : (z >= lo - span * 0.02);
        if (!ok)
          notes.push(`FALSY-ZERO SUSPECT - ${id} -> ${o}: at 0 the value is ${z}, at ${loK} it is ` +
                     `${lo} and at ${hiK} it is ${hi}. Zero is not continuing the trend.`);
      }
    }
  }

  if (Object.keys(M.errors).length)
    for (const [id, e] of Object.entries(M.errors))
      check(`${id} sweeps without throwing`, false, e.slice(0, 120));

  // ── baseline diff ─────────────────────────────────────────────────────────
  if (WRITE) {
    fs.writeFileSync(BASELINE, JSON.stringify({ base: M.base, summary }, null, 1));
    console.log(`baseline written to ${BASELINE}`);
  } else if (fs.existsSync(BASELINE)) {
    const old = JSON.parse(fs.readFileSync(BASELINE, 'utf8'));
    let drift = 0;
    for (const id of Object.keys(summary)) {
      if (!old.summary[id]) { notes.push(`NEW control since baseline: ${id}`); continue; }
      for (const o of OUTPUTS)
        if (old.summary[id][o] !== summary[id][o]) {
          drift++;
          notes.push(`RESPONSE CHANGED: ${id} -> ${o} was ` +
                     `${old.summary[id][o] ? 'responsive' : 'inert'}, now ` +
                     `${summary[id][o] ? 'responsive' : 'inert'}`);
        }
    }
    for (const id of Object.keys(old.summary))
      if (!summary[id]) { check(`control ${id} still exists`, false, 'present in baseline, missing now'); }
    check('response matrix matches baseline', drift === 0, drift ? `${drift} cells changed` : '');
  } else {
    notes.push('No baseline found. Run with --write-baseline once the matrix looks right.');
  }

  // ── report ────────────────────────────────────────────────────────────────
  const controls = Object.keys(summary).length;
  console.log(`\n${pass}/${pass + fail} response checks passed across ${controls} controls ` +
              `x ${OUTPUTS.length} outputs`);
  if (failures.length) { console.log('\nFAILURES:'); failures.forEach(f => console.log('  ' + f)); }
  if (notes.length)    { console.log('\nNOTES:');    notes.forEach(n => console.log('  ' + n)); }
  process.exit(fail ? 1 : 0);
})();
