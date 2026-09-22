#!/usr/bin/env node
/**
 * validate_invariants.js — Session 1 of the bug hunt.
 *
 * Asserts things that must be true in EVERY ONE of the 8,760 hours, across a
 * matrix of scenarios. No benchmarks, no judgement, no tolerance for opinion:
 * just arithmetic that cannot legitimately fail.
 *
 * This class of check is the cheapest there is and it is where the storage-idle
 * bug lived undetected for weeks — the adequacy panel counted 2.9 GW of pumped
 * storage as firm while the dispatch produced 0.04 TWh from it. Nothing asserted
 * that the two agreed, and nothing asserted storage was cycling at all.
 *
 *   node validate_invariants.js [root]
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = process.argv[2] || '.';
let pass = 0, fail = 0;
const failures = [];

function check(name, ok, detail) {
  if (ok) { pass++; }
  else { fail++; failures.push(`${name}${detail ? '  —  ' + detail : ''}`); }
}

// Floating point: an 8,760-hour sum of megawatt figures accumulates error, so
// equality is relative. 1e-6 is far tighter than any real bug would be.
const REL = 1e-6;
const close = (a, b, rel = REL) => Math.abs(a - b) <= rel * Math.max(1, Math.abs(a), Math.abs(b));

// ── the scenario matrix ─────────────────────────────────────────────────────
// Invariants must hold everywhere, not just at defaults. These deliberately
// include the corners where things break: everything off, everything maxed, a
// fleet that cannot meet load, and a system drowning in surplus.
const SCENARIOS = {
  'default':            {},
  'preset: deep decarbonisation': 'PRESET:Deep decarbonisation 2035',
  'coal retired 27 GW': { coalDecomMW: 27000, coalFlexPct: 1 },
  'high VRE':           { newWindMW: 50000, newPvMW: 50000, newRooftopMW: 20000 },
  'high VRE + storage': { newWindMW: 50000, newPvMW: 50000, newBattMW: 30000,
                          newPsMW: 5000, newVrfbMW: 8000, newIronAirMW: 8000 },
  'fleet collapse':     { coalEAFPct: 40 },
  'no storage at all':  { battPowerMW: 0, newBattMW: 0, psPowerMW: 0, psEnergyMWh: 0 },
  'zero everything':    { newWindMW: 0, newPvMW: 0, newRooftopMW: 0, newBattMW: 0,
                          newCcgtMW: 0, coalDecomMW: 0, carbonTaxRPerT: 0,
                          drInterruptMW: 0, drShiftPct: 0, vppEnrolPct: 0,
                          coalPartLoadK: 0, reserveEnabled: 0 },
  'everything on':      { reserveEnabled: 1, outageUnitLevel: 1, coalFlexPct: 1,
                          vppEnrolPct: 100, drShiftPct: 20, ccsEnabled: 1,
                          carbonTaxRPerT: 1000, coalPartLoadK: 0.25 },
  'demand +40%':        { demandGrowthPct: 40 },
  'demand −20%':        { demandGrowthPct: -20 },
};

// EVERY PRESET THIS HARNESS NAMES MUST EXIST. Added 22 Sep 2026. A missing preset spreads as
// undefined and runs the defaults, or its button lookup returns null and the checks are
// skipped - either way with no error. Deleting Crisis 2023 took validate_outputs from 40/40 to
// 36/36 while it still reported green.
{
  const _src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const _i = _src.indexOf('const PRESETS={');
  const _blk = _src.slice(_i, _src.indexOf('\n};', _i));
  const _have = new Set([..._blk.matchAll(/^\s*'((?:[^'\\]|\\.)+)'\s*:\s*\{/gm)].map(m => m[1].replace(/\\'/g, "'")));
  const _miss = ['Today 2026', 'Deep decarbonisation 2035', 'Fossil-free 2040'].filter(n => !_have.has(n));
  check('every preset this harness uses exists', _miss.length === 0, 'missing: ' + _miss.join(', '));
}
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
        } catch (e) { return { ok: false, json: async () => { throw e; }, text: async () => { throw e; } }; }
      };
    },
  });

  await new Promise(r => setTimeout(r, 4500));
  const w = dom.window;

  for (const [label, override] of Object.entries(SCENARIOS)) {
    const probe = w.document.createElement('script');
    probe.textContent = `
      (() => {
        try {
          const ov = ${JSON.stringify(override)};
          const st = (typeof ov === 'string' && ov.startsWith('PRESET:'))
            ? { ...state, ...PRESETS[ov.slice(7)] }
            : { ...state, ...ov };
          const r = simulate(st, PROFILES);
          const S = r.stack, H = 8760;
          const carriers = Object.keys(S);

          // per-hour scan, reporting the FIRST offending hour of each kind so a
          // failure points at something reproducible rather than a count
          let balMax = 0, balHour = -1;
          let neg = null, capEx = null, socLo = null, socHi = null;
          let plLow = null, plIdle = null, curtEx = null;
          let chgMax = 0, disMax = 0;

          const capOf = {
            wind:  r.caps ? r.caps.windCap    : Infinity,
            pv:    r.caps ? r.caps.pvCap      : Infinity,
            rooftop: r.caps ? r.caps.rooftopCap : Infinity,
            ccgt:  r.caps ? r.caps.ccgtCap    : Infinity,
          };

          for (let h = 0; h < H; h++) {
            // 1. supply == demand, every hour
            let sup = 0;
            for (const k of carriers) sup += (S[k][h] || 0);
            const d = Math.abs(sup - r.loadS[h]);
            if (d > balMax) { balMax = d; balHour = h; }

            // 2. nothing negative
            if (neg === null) for (const k of carriers)
              if ((S[k][h] || 0) < -1e-6) { neg = k + ' @ h' + h + ' = ' + S[k][h]; break; }

            // 3. nothing exceeds its capacity
            if (capEx === null) for (const k of Object.keys(capOf))
              if (k !== 'rooftop' && S[k] && S[k][h] > capOf[k] * 1.0001 + 1)
                { capEx = k + ' @ h' + h + ': ' + S[k][h].toFixed(0) + ' > cap ' + capOf[k].toFixed(0); break; }

            // 4. curtailment cannot exceed what was available to curtail.
            // NOTE rooftop is deliberately absent from stack: it is behind the
            // meter, so it reduces grid demand rather than appearing as grid
            // supply. It shows up in E.rooftop but never in stack.rooftop, and
            // assuming otherwise is what broke the first version of this check.
            if (curtEx === null && r.curtailMW) {
              const vre = (S.wind[h]||0) + (S.pv[h]||0) + (S.csp ? S.csp[h]||0 : 0);
              if (r.curtailMW[h] > 1 && vre + r.curtailMW[h] > (capOf.wind + capOf.pv) * 1.05 + 1)
                curtEx = 'h' + h + ': curtail ' + r.curtailMW[h].toFixed(0) + ' + gen ' + vre.toFixed(0);
            }

            // 5. part-load multiplier: >= 1 when coal runs, exactly 1 when it does not
            if (r.partLoadF) {
              const f = r.partLoadF[h];
              if (plLow === null && f < 1 - 1e-9) plLow = 'h' + h + ' = ' + f;
              if (plIdle === null && (S.coal[h] || 0) <= 1 && Math.abs(f - 1) > 1e-9)
                plIdle = 'h' + h + ' = ' + f + ' with coal idle';
            }

            if (r.chargeMW && r.chargeMW[h] > chgMax) chgMax = r.chargeMW[h];
            const dis = (S.batt[h]||0) + (S.ps[h]||0);
            if (dis > disMax) disMax = dis;
          }

          // annual identities
          const E = r.E;
          const totalGen = Object.keys(E).reduce((s,k)=> s + (k==='curtailed' ? 0 : (E[k]||0)), 0);
          const storeIn  = r.chargeMW ? r.chargeMW.reduce((s,v)=>s+v,0) : 0;
          const storeOut = (E.batt||0) + (E.ps||0);
          const rt = storeIn > 0 ? storeOut / storeIn : null;

          return {
            ok: true,
            balMax, balHour, neg, capEx, socLo, socHi, plLow, plIdle, curtEx,
            chgMax, disMax,
            battPower: r.caps ? r.caps.battPower : null,
            storeIn, storeOut, rt,
            unserved: E.unserved || 0,
            curtailedTWh: (E.curtailed || 0) / 1e6,
            psEnergyMWh: (st.psEnergyMWh ?? FIXED.psEnergyMWh)
              + (st.newPsMW || 0) * (st.newPsHours ?? 14),
            battEnergyMWh: (st.battPowerMW ?? FIXED.battPowerMW) * (st.battHours ?? FIXED.battHours)
              + (st.newBattMW || 0) * (st.newBattHours ?? 4)
              + (st.newVrfbMW || 0) * (st.newVrfbHours ?? 8)
              + (st.newIronAirMW || 0) * (st.newIronAirHours ?? 100),
            psOut: E.ps || 0, battOut: E.batt || 0,
            unservedHours: (() => { let n = 0; for (let h = 0; h < 8760; h++) if (S.unserved[h] > 1) n++; return n; })(),
            ccsOn: !!(st.ccsEnabled),
            co2: r.co2, coalTWh: (E.coal||0)/1e6,
            emisCoal: st.emisCoal ?? FIXED.emisCoal,
            avgCost: r.avgCost, totalCost: r.totalCost,
            fuelCost: r.fuelCost, carbonCost: r.carbonCost,
            newCapexR: r.newCapexR, gridCapexR: r.gridCapexR, btmCapexR: r.btmCapexR,
            peak: r.peak,
          };
        } catch (e) { return { ok: false, err: String(e) }; }
      })()`;
    probe.textContent = 'window.__inv = ' + probe.textContent + ';';
    w.document.body.appendChild(probe);
    const R = w.__inv;

    if (!R || !R.ok) {
      check(`[${label}] simulate() runs`, false, R ? R.err : 'no result');
      continue;
    }

    // ── the invariants ──────────────────────────────────────────────────────
    check(`[${label}] supply == demand every hour`,
          R.balMax < 1, R.balMax >= 1 ? `worst gap ${R.balMax.toFixed(2)} MW at hour ${R.balHour}` : '');

    check(`[${label}] no negative generation`, R.neg === null, R.neg || '');

    check(`[${label}] nothing exceeds installed capacity`, R.capEx === null, R.capEx || '');

    check(`[${label}] curtailment <= available VRE`, R.curtEx === null, R.curtEx || '');

    check(`[${label}] part-load multiplier >= 1 when coal runs`,
          R.plLow === null, R.plLow || '');
    check(`[${label}] part-load multiplier == 1 when coal is idle`,
          R.plIdle === null, R.plIdle || '');

    if (R.battPower != null)
      check(`[${label}] discharge <= storage power rating`,
            R.disMax <= (R.battPower + 6000) * 1.02 + 1,
            `max discharge ${R.disMax.toFixed(0)} MW vs battery ${R.battPower.toFixed(0)} + PS`);

    // Round-trip must sit inside the physically possible band. Above 1.0 would be
    // energy from nowhere.
    //
    // Only meaningful when charging is MATERIAL. In a system with no surplus at
    // all — retire 27 GW of coal and build nothing, and it is short 8,063 hours
    // of 8,760 — storage simply drains its opening state and sits empty. The
    // ratio of a large discharge to a near-zero charge is arithmetic noise, not
    // a physics violation, and the first version of this check flagged it.
    // REFINED 31 Aug 2026. The guard above is a volume threshold, which is a PROXY for
    // the real condition. The engine is NOT state-of-charge cyclic: storage opens at
    // psSoc 70% and battSoc 50% of capacity, so over a year it can legitimately
    // discharge MORE than it charges by exactly the opening stock it never replaces.
    // That is a real energy source, not energy from nowhere.
    //
    // At coalEAFPct 40 the system charges heavily AND drains its opening stock, so it
    // passed the volume guard while the ratio reached 1.053. The correct condition
    // compares discharge against charge PLUS the opening stock available to it.
    //
    // Storage opening energy: psEnergyMWh*0.7 + battEnergy*0.5, capped generously since
    // the harness cannot see the tier split. If the engine is ever made SOC-cyclic this
    // allowance should go back to zero and the ratio must sit under 1.0 outright.
    // FIXED is a page global and is NOT in scope here - this harness reads RESULTS, not
    // the page. The probe already returns both figures; use those.
    const openingStock = (R.psEnergyMWh || 0) * 0.7 + (R.battEnergyMWh || 0) * 0.5;
    const rtAdj = (R.rt !== null && R.storeIn > 0)
      ? R.storeOut / (R.storeIn + openingStock) : null;
    if (rtAdj !== null && R.storeIn > 100000)
      check(`[${label}] storage round-trip efficiency is physical`,
            R.rt > 0.3 && rtAdj <= 1.0,
            `raw round trip ${R.rt.toFixed(3)}, adjusted for opening stock ${rtAdj.toFixed(3)} `
            + `- above 1.0 adjusted IS energy from nowhere`);

    // THE CHECK THAT WOULD HAVE CAUGHT THE STORAGE-IDLE BUG, measured in CYCLES
    // PER YEAR rather than absolute energy.
    //
    // Until 16 Aug 2026 pumped storage produced 0.04 TWh against a real 3-4 TWh,
    // because a target ceiling collapsed to zero whenever the system had no
    // anticipated shortfall. On 2.9 GW / 60 GWh that is 0.7 cycles a year, where
    // a real scheme does fifty or more.
    //
    // A first version of this check keyed on CURTAILMENT being present, which was
    // wrong: the default scenario curtails nothing, so the check never ran and
    // the reintroduced bug sailed through 132/132. Storage utilisation against
    // its own energy capacity is the signal that does not depend on the system
    // being in surplus by some other measure.
    //
    // Skipped only when the system is in near-permanent deficit, where there is
    // genuinely nothing to charge from.
    //
    // CHECKED PER TECHNOLOGY, NOT IN AGGREGATE. A first attempt summed pumped
    // storage and batteries, and the reintroduced bug passed at 11.8 cycles a
    // year: pumped storage collapsed to 0.7 cycles while the battery picked up
    // the slack and rose from 0.27 to 0.70 TWh. Aggregating hid exactly the bug
    // the check exists to find. Each fleet has to answer for itself.
    if (R.unservedHours < 4000) {
      if (R.psEnergyMWh > 1000) {
        const c = R.psOut / R.psEnergyMWh;
        check(`[${label}] pumped storage cycles plausibly`,
              c > 5, `${c.toFixed(1)} cycles/yr on ${(R.psEnergyMWh/1000).toFixed(1)} GWh ` +
                     `(${(R.psOut/1e6).toFixed(3)} TWh) — the fleet is sitting idle`);
      }
      // The battery-class fleet is checked against a DIFFERENT question, because
      // "it did not cycle" is not automatically a fault. If the system is
      // over-built, most of a very large fleet correctly sits idle.
      //
      // The pathology worth flagging is storage idle WHILE coal runs AND surplus
      // is being thrown away: that combination means storage could have charged
      // on the surplus and discharged against coal, and did not. Investigated
      // 17 Aug 2026 — the dispatch only discharges storage to meet a DEFICIT,
      // never to DISPLACE coal, so in a high-VRE system where coal cannot turn
      // down the fleet fills once and stops. See HANDOVER.
      // NO BATTERY-FLEET CYCLING CHECK, and the reason matters.
      //
      // Investigated fully on 17 Aug 2026. A 987 GWh fleet doing 0.02 TWh while
      // 116 TWh was curtailed looked damning, and two plausible-sounding fixes
      // were written before the diagnosis was actually correct. The truth:
      //
      //   5,744 hours had coal generating 18 TWh while 116 TWh was curtailed
      //   SIMULTANEOUSLY. Coal was at its MUST-RUN floor - minimum stable level,
      //   ramp-readiness for the next peak, and the synchronous floor - so it
      //   was already serving the load. There was no deficit for storage to
      //   discharge into, and storage cannot displace plant that cannot turn
      //   down.
      //
      // Retire 35 GW of that coal and the same fleet does 3.4 TWh over 883
      // hours. Storage was never broken; coal was in the way.
      //
      // So idle storage is NOT a reliable bug signal - it is often the correct
      // answer, and asserting otherwise would have driven a wrong "fix" into the
      // dispatch. The pumped-storage check above stays, because PS has an
      // explicit daily cycling discipline and its collapse WAS a real bug.
    }

    check(`[${label}] unserved energy is non-negative`, R.unserved >= 0, String(R.unserved));

    // Curtailment non-negativity. Added 28 Aug 2026: the annual total was coming out
    // at -7.3e-12 MWh in high-storage scenarios and rendering as "-0.00 TWh", which
    // reads as a fault. The cause was float accumulation in tierCharge() returning
    // marginally more than it was handed; the accumulation site is now clamped, and
    // that clamp is only defensible because THIS check would still fail on a material
    // negative. Tolerance is deliberately tight - anything past a microwatt-hour is
    // arithmetic, not rounding.
    check(`[${label}] curtailment is non-negative`, R.curtailedTWh >= -1e-12,
          `${R.curtailedTWh} TWh - a negative here means energy was un-spilled, which `
          + `is not a thing. Check the clamp at the curtailment accumulation site and `
          + `whether tierCharge is over-returning.`);

    // Emissions must follow FUEL BURNED. This is the identity that was wrong
    // until 17 Aug 2026, when CO2 was computed from energy SOLD and so ignored
    // the part-load heat-rate penalty entirely.
    // CCS legitimately breaks this floor by capturing most of the stack, so the
    // check only applies with capture off. That is not a get-out: with CCS on,
    // the capture rate itself is swept by stress_deep's meaningful-zero guard.
    if (!R.ccsOn) {
      // NAMED FOR WHAT IT ACTUALLY PROVES. Both sides derive from `emisCoal`, so halving
      // that constant halves the reported CO2 and the floor together and this holds
      // regardless. Verified 6 Sep by halving it: 147/147 still passed here, while
      // validate_benchmarks, validate_response, validate_consistency and validate_findings
      // all failed - so the constant IS pinned, just not here.
      //
      // What this does prove: reported CO2 is not computed from a different factor than
      // the one in FIXED, and nothing subtracts coal's contribution away. Both are real
      // structural faults. It is not a check on the VALUE, and the old name implied it was.
      const co2Floor = R.coalTWh * R.emisCoal;
      check(`[${label}] CO2 is consistent with FIXED.emisCoal (not a check on its value)`,
            R.co2 >= co2Floor - 0.5,
            `co2 ${R.co2.toFixed(1)} Mt vs floor ${co2Floor.toFixed(1)} Mt`);
    }

    check(`[${label}] costs are non-negative`,
          R.fuelCost >= 0 && R.carbonCost >= 0 && R.newCapexR >= 0,
          `fuel ${R.fuelCost} carbon ${R.carbonCost} capex ${R.newCapexR}`);

    check(`[${label}] peak demand is positive and sane`,
          R.peak > 10000 && R.peak < 120000, `${(R.peak/1000).toFixed(1)} GW`);
  }

  // ── pricing reserve does not change how much is held ────────────────────
  // Added 21 Sep 2026, tightened the same day. Reserve is held every hour whether or
  // not it is priced; the price decides who is paid. So unserved energy must be the
  // same priced and unpriced. Before this, pricing withheld 15% of storage in every
  // hour and raised unserved energy in Deep decarbonisation 2035 from 84 to 134 GWh.
  {
    const CASES = {
      'Today 2026': 'PRESET:Today 2026',
      // Was the Crisis 2023 preset, deleted 22 Sep 2026; the same settings inline.
      'stress, 2023 conditions': { coalEAFPct: 50, demandGrowthPct: 15, nuclearCF: 0.49, outageForcedSharePct: 73, importsMW: 1400, exportsMW: 1300, dieselBudgetTWh: 5.25 },
      'Deep decarbonisation 2035': 'PRESET:Deep decarbonisation 2035',
      'Deep decarbonisation 2035, 4,000 MW reserve': ['PRESET:Deep decarbonisation 2035', { reserveOperatingMW: 4000 }],
      'Fossil-free 2040': 'PRESET:Fossil-free 2040',
      'fleet collapse': { coalEAFPct: 40 },
    };
    for (const [label, spec] of Object.entries(CASES)) {
      const probe = w.document.createElement('script');
      probe.textContent = `window.__rsv = (() => { try {
        const spec = ${JSON.stringify(spec)};
        const base0 = Array.isArray(spec) ? spec[0] : spec, extra = Array.isArray(spec) ? spec[1] : {};
        const base = (typeof base0 === 'string') ? { ...state, ...PRESETS[base0.slice(7)], ...extra }
                                                 : { ...state, ...base0, ...extra };
        const rate = base.asReserveRMWh || 150;
        const off = simulate({ ...base, asReserveOn: 0, asReserveRMWh: rate }, PROFILES).E.unserved || 0;
        const on  = simulate({ ...base, asReserveOn: 1, asReserveRMWh: rate }, PROFILES).E.unserved || 0;
        return { off, on };
      } catch (e) { return { err: String(e) }; } })();`;
      w.document.body.appendChild(probe);
      const R = w.__rsv;
      const name = `[${label}] pricing reserve does not change unserved energy`;
      if (!R || R.err) { check(name, false, R ? R.err : 'no result'); continue; }
      check(name, Math.abs(R.on - R.off) <= 1,
            `unserved ${(R.off/1000).toFixed(1)} GWh unpriced, ${(R.on/1000).toFixed(1)} GWh priced`);
    }
  }

  // ── a larger reserve requirement cannot reduce unserved energy ──────────
  // Holding more reserve can only leave more demand unserved where the requirement binds.
  // A requirement that is not being read would make all three values equal and pass
  // silently, so the top of the range must also bind.
  //
  // Moved 22 Sep 2026 from Deep decarbonisation 2035 to Today 2026 at 55% EAF. The
  // requirement also sizes unit commitment, so on Deep decarbonisation more reserve
  // commits more coal and can LOWER shedding: 2.1 / 0.0 / 0.0 GWh at 0 / 2,200 / 6,000 MW
  // after the 2026 demand re-anchor. Not a defect, and not a case this check can assert on.
  {
    const probe = w.document.createElement('script');
    probe.textContent = `window.__flr = (() => { try {
      const base = { ...state, coalEAFPct: 55 };
      return [0, 2200, 6000].map(f => simulate({ ...base, reserveOperatingMW: f }, PROFILES).E.unserved || 0);
    } catch (e) { return { err: String(e) }; } })();`;
    w.document.body.appendChild(probe);
    const F = w.__flr;
    const ok = Array.isArray(F) && F[0] <= F[1] + 1 && F[1] <= F[2] + 1 && F[2] > F[0] + 1;
    check('[Today 2026, 55% EAF] unserved energy rises with the reserve requirement', ok,
          Array.isArray(F) ? `requirement 0 / 2,200 / 6,000 MW: ${F.map(x => (x/1000).toFixed(1)).join(' / ')} GWh`
                           : (F ? F.err : 'no result'));
  }

  // ── system cost carries the cost of energy shed ─────────────────────────
  // Added 22 Sep 2026. Supply cost alone fell when a crisis shed more, so a worse run
  // looked cheaper. systemCostR must equal totalCost plus shed energy at costUnservedR.
  {
    const probe = w.document.createElement('script');
    probe.textContent = `window.__use = (() => { try {
      const r = simulate({ ...state, ...{ coalEAFPct: 50, demandGrowthPct: 15, nuclearCF: 0.49, outageForcedSharePct: 73, importsMW: 1400, exportsMW: 1300, dieselBudgetTWh: 5.25 } }, PROFILES);
      return { u: r.E.unserved, uc: r.unservedCostR, sc: r.systemCostR, tc: r.totalCost, rate: FIXED.costUnservedR };
    } catch (e) { return { err: String(e) }; } })();`;
    w.document.body.appendChild(probe);
    const U = w.__use;
    const ok = U && !U.err && U.u > 0 && Math.abs(U.uc - U.u * U.rate) < 1 && Math.abs(U.sc - U.tc - U.uc) < 1;
    check('[stress, 2023 conditions] system cost includes shed energy at costUnservedR', ok,
          U && !U.err ? `unserved ${(U.u/1e6).toFixed(1)} TWh, cost R${(U.uc/1e9).toFixed(1)}bn, system R${(U.sc/1e9).toFixed(1)}bn`
                      : (U ? U.err : 'no result'));
  }

  // ── the ORDC reads available reserve, not the requirement ───────────────
  // Added 22 Sep 2026. marketPriceSeries compared the engine's reserve REQUIREMENT, read as
  // availability, against 6% of peak through a key that does not exist, and priced scarcity
  // in every hour of Deep decarbonisation 2035 and Fossil-free 2040 (R12.36/kWh mean on
  // Fossil-free against an engine marginal price of R0.11). A system with ample reserve must
  // price scarcity in few hours, and its market price must sit close to the engine's.
  for (const pre of ['Today 2026', 'Deep decarbonisation 2035', 'Fossil-free 2040']) {
    const probe = w.document.createElement('script');
    probe.textContent = `window.__ordc = (() => { try {
      const st = { ...state, ...PRESETS[${JSON.stringify(pre)}] };
      const r = simulate(st, PROFILES);
      const m = marketPriceSeries(r, { ...FIXED, ...st });
      if (!m) return { err: 'marketPriceSeries returned null' };
      const eng = Array.from(r.marginalP).reduce((a, b) => a + b, 0) / 8760 / 1000;
      const mkt = m.p.reduce((a, b) => a + b, 0) / 8760;
      return { hours: m.scarcityHours, voll: m.vollHours, eng, mkt };
    } catch (e) { return { err: String(e) }; } })();`;
    w.document.body.appendChild(probe);
    const O = w.__ordc;
    if (!O || O.err) { check(`[${pre}] ORDC prices scarcity in few hours`, false, O ? O.err : 'no result'); continue; }
    check(`[${pre}] ORDC prices scarcity in few hours`, O.hours <= 438,
          `${O.hours} hours with a scarcity adder, limit 438 (5% of the year)`);
    // Deep decarbonisation was excluded while its preset shed load by design; from 22 Sep 2026
    // both high-renewables presets meet the NEM reliability standard, so all are checked.
    {
      check(`[${pre}] market price mean is close to the engine's marginal price`,
            Math.abs(O.mkt - O.eng) <= 0.05 * Math.max(O.eng, 0.1),
            `market R${O.mkt.toFixed(3)}/kWh against engine R${O.eng.toFixed(3)}/kWh`);
    }
  }

  // ── THE ENGINE'S INPUTS ARE COMPLETE BEFORE THE PAGE REPORTS ───────────────
  // Added 22 Sep 2026. New-build cost depended on whether the transmission-cost curve had been
  // built: R180.1bn or R169.7bn for the same build, by load timing. The curve is now built at
  // start-up and the page runs once every input has settled, then sets GTZA_READY.
  {
    const probe = w.document.createElement('script');
    probe.textContent = `window.__rd = { ready: !!window.GTZA_READY, tx: typeof bldTxCurve !== 'undefined' && !!bldTxCurve };`;
    w.document.body.appendChild(probe);
    const R = w.__rd || {};
    check('the engine inputs are loaded and the transmission curve is built', R.ready && R.tx,
          `GTZA_READY ${R.ready}, transmission curve ${R.tx ? 'built' : 'missing'}`);
  }

  // ── A PRESET BUTTON APPLIES EVERY KEY OF ITS PRESET ────────────────────────
  // Added 22 Sep 2026. applyState set sliders only, so the page dropped scenarioYear from the two
  // high-renewables presets and showed 2026 costs, while every harness - which builds its state
  // as { ...state, ...PRESETS[name] } - measured the scenario year. Page and harness disagreed.
  {
    const probe = w.document.createElement('script');
    probe.textContent = `window.__ap = (function(){ try {
      const bad = [];
      const ry = document.getElementById('retYear');
      for (const [n, p] of Object.entries(PRESETS)) {
        applyState(p);
        for (const [k, v] of Object.entries(p)) if (state[k] !== v) bad.push(n + '.' + k + '=' + state[k]);
        // The retail panel must price the scenario's own year (22 Sep 2026: it sat at 2035).
        const want = p.scenarioYear ?? FIXED.scenarioYear;
        if (ry && +ry.value !== want) bad.push(n + ' retail year=' + ry.value);
      }
      applyState(PRESETS['Today 2026']);
      return { bad };
    } catch (e) { return { err: String(e) }; } })();`;
    w.document.body.appendChild(probe);
    const A = w.__ap;
    check('a preset button applies every key of its preset', A && !A.err && A.bad.length === 0,
          A ? (A.err || (A.bad.length ? 'not applied: ' + A.bad.join(', ') : 'all keys applied')) : 'no result');
  }

  // ── THE RESIDENTIAL PREMIUM IS APPLIED BY COMPONENT ────────────────────────
  // Added 22 Sep 2026. One factor of 1.622 multiplied the whole stack, so every rand of new
  // generation cost reached a household at the low-voltage network premium, and a R0.30/kWh
  // retail margin counted the cost-to-serve retail cost a second time. Factors now come from
  // the CTS Table 41 by component, and a zero-cost stack must price at zero.
  {
    const probe = w.document.createElement('script');
    probe.textContent = `window.__rf = (function(){ try {
      return { gen: RES_FACTOR_GEN, net: RES_FACTOR_NET, tx: RES_FACTOR_TX,
               zero: residentialRate(0, 0, 0, 0, 0) };
    } catch (e) { return { err: String(e) }; } })();`;
    w.document.body.appendChild(probe);
    const F = w.__rf;
    check('the residential premium is applied by component', F && !F.err
          && Math.abs(F.gen - 1.258) < 0.005 && Math.abs(F.net - 4.02) < 0.01 && F.zero === 0,
          F ? (F.err || `generation ${F.gen.toFixed(3)}, network and retail ${F.net.toFixed(3)}, `
                      + `transmission ${F.tx.toFixed(3)}; zero stack prices at R${F.zero.toFixed(2)}`) : 'no result');
  }

  // ── RETAIL SALES EQUAL ENERGY SERVED ───────────────────────────────────────
  // Added 22 Sep 2026. The retail denominator subtracted storage discharge as well as charging,
  // so energy delivered from storage was never sold: 172.1 TWh against 183.3 served on Deep
  // decarbonisation 2035. Every fixed cost per kWh was inflated by the storage throughput.
  {
    const probe = w.document.createElement('script');
    probe.textContent = `window.__sl = (function(){ try {
      applyState(PRESETS['Fossil-free 2040']); run();
      const c = retailComponents(0, true, 2040, false), r = lastRes;
      let served = 0; for (let h = 0; h < 8760; h++) served += r.loadS[h] - (r.chargeMW[h] || 0);
      served -= (r.E.unserved || 0);
      applyState(PRESETS['Today 2026']); run();
      return { sales: c.salesMWh / 1e6, served: served / 1e6 };
    } catch (e) { return { err: String(e) }; } })();`;
    w.document.body.appendChild(probe);
    const S = w.__sl;
    if (!S || S.err) check('retail sales equal energy served', false, S ? S.err : 'no result');
    else check('retail sales equal energy served', Math.abs(S.sales / S.served - 1) < 0.01,
               `sales ${S.sales.toFixed(1)} TWh against ${S.served.toFixed(1)} TWh served on Fossil-free 2040`);
  }

  // ── CURTAILMENT COMPENSATION IS A REIPPPP TERM ─────────────────────────────
  // Added 22 Sep 2026. Deemed energy was paid on all curtailed wind and solar, including new
  // build whose capital newCap already recovers in full: R0.43/kWh on Fossil-free 2040. REIPPPP
  // is under a tenth of that fleet's wind and solar, so its compensation is a few cents at most.
  {
    const probe = w.document.createElement('script');
    probe.textContent = `window.__cc = (function(){ try {
      applyState(PRESETS['Fossil-free 2040']); run();
      const c = retailComponents(0, true, 2040, false);
      return { cc: c.curtComp, frac: c.curtFrac };
    } catch (e) { return { err: String(e) }; } })();`;
    w.document.body.appendChild(probe);
    const C = w.__cc;
    if (!C || C.err) check('curtailment compensation is confined to REIPPPP', false, C ? C.err : 'no result');
    else check('curtailment compensation is confined to REIPPPP', C.cc < 0.05,
               `R${C.cc.toFixed(3)}/kWh on Fossil-free 2040 at ${(100 * C.frac).toFixed(0)}% curtailment, limit R0.05`);
  }

  // ── MARKET-BASIS RETAIL RECOVERS THE COST OF THE BUILD ─────────────────────
  // Added 22 Sep 2026. The market basis priced energy at the hourly wholesale price and kept
  // 33% of every other line, so on Fossil-free 2040 it came to R3.14 against R7.86 regulated:
  // the wholesale market recovered 9% of system cost and the contracts that built the system
  // went unpaid. A market-indexed tariff must still pay for the contracted plant. Fails on the
  // previous build.
  for (const [pre, yr] of [['Deep decarbonisation 2035', 2035], ['Fossil-free 2040', 2040]]) {
    const probe = w.document.createElement('script');
    probe.textContent = `window.__rb = (function(){ try {
      applyState(PRESETS[${JSON.stringify(pre)}]); run();
      const el = document.getElementById('retBasis'); if (!el) return { err: 'no retBasis control' };
      const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
      el.value = 'reg'; const reg = mean(retailRaw(lastRes.marginalP, 0, true, ${yr}, false).hourly);
      el.value = 'mkt'; const mkt = mean(retailRaw(lastRes.marginalP, 0, true, ${yr}, false).hourly);
      el.value = 'reg';
      return { reg, mkt, levy: (typeof out_mktParts !== 'undefined' && out_mktParts) ? out_mktParts.levy : null };
    } catch (e) { return { err: String(e) }; } })();`;
    w.document.body.appendChild(probe);
    const R = w.__rb;
    if (!R || R.err) { check(`[${pre}] market-basis retail recovers contracted costs`, false, R ? R.err : 'no result'); continue; }
    check(`[${pre}] market-basis retail recovers contracted costs`,
          R.mkt >= 0.8 * R.reg && R.levy != null && R.levy > 0,
          `market R${R.mkt.toFixed(2)} against regulated R${R.reg.toFixed(2)}/kWh; contract levy `
          + `${R.levy == null ? 'absent' : 'R' + R.levy.toFixed(2)}`);
  }

  // ── report ────────────────────────────────────────────────────────────────

  console.log(`\n${pass}/${pass + fail} invariant checks passed across ` +
              `${Object.keys(SCENARIOS).length} scenarios`);
  if (failures.length) {
    console.log('\nFAILURES:');
    failures.forEach(f => console.log('  ' + f));
  }
  process.exit(fail ? 1 : 0);
})();
