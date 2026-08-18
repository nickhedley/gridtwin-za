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
  'preset: future mix': 'PRESET:Future electricity mix',
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
    if (R.rt !== null && R.storeIn > 100000)
      check(`[${label}] storage round-trip efficiency is physical`,
            R.rt > 0.3 && R.rt <= 1.0, `round trip = ${R.rt.toFixed(3)}`);

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
      if (R.battEnergyMWh > 1000) {
        const c = R.battOut / R.battEnergyMWh;
        check(`[${label}] battery fleet cycles plausibly`,
              c > 5, `${c.toFixed(1)} cycles/yr on ${(R.battEnergyMWh/1000).toFixed(1)} GWh ` +
                     `(${(R.battOut/1e6).toFixed(3)} TWh) — the fleet is sitting idle`);
      }
    }

    check(`[${label}] unserved energy is non-negative`, R.unserved >= 0, String(R.unserved));

    // Emissions must follow FUEL BURNED. This is the identity that was wrong
    // until 17 Aug 2026, when CO2 was computed from energy SOLD and so ignored
    // the part-load heat-rate penalty entirely.
    // CCS legitimately breaks this floor by capturing most of the stack, so the
    // check only applies with capture off. That is not a get-out: with CCS on,
    // the capture rate itself is swept by stress_deep's meaningful-zero guard.
    if (!R.ccsOn) {
      const co2Floor = R.coalTWh * R.emisCoal;
      check(`[${label}] CO2 >= coal energy x emission factor`,
            R.co2 >= co2Floor - 0.5,
            `co2 ${R.co2.toFixed(1)} Mt vs floor ${co2Floor.toFixed(1)} Mt`);
    }

    check(`[${label}] costs are non-negative`,
          R.fuelCost >= 0 && R.carbonCost >= 0 && R.newCapexR >= 0,
          `fuel ${R.fuelCost} carbon ${R.carbonCost} capex ${R.newCapexR}`);

    check(`[${label}] peak demand is positive and sane`,
          R.peak > 10000 && R.peak < 120000, `${(R.peak/1000).toFixed(1)} GW`);
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
