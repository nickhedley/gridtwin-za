#!/usr/bin/env node
/**
 * validate_consistency.js — Session 3 of the bug hunt.
 *
 * Asserts that every quantity appearing in more than one place AGREES with
 * itself. This is where the worst bug of the project lived: the adequacy panel
 * counted 2.9 GW of pumped storage as firm capacity while the dispatch produced
 * 0.04 TWh from it. Both numbers were displayed, both looked reasonable, and
 * nothing compared them.
 *
 * The rule being enforced: a quantity should have exactly ONE authoritative
 * computation and every display should read it. Where two computations exist,
 * either delete one or assert they agree. Anything this file finds is a place
 * where the site can contradict itself in front of a user.
 *
 * Unlike sessions 1 and 2 this reads the RENDERED DOM, because the bug class is
 * specifically "the engine is right but the panel shows something else".
 *
 *   node validate_consistency.js [root]
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = process.argv[2] || '.';
let pass = 0, fail = 0;
const failures = [], notes = [];
const check = (name, ok, detail) => {
  if (ok) pass++; else { fail++; failures.push(`${name}${detail ? '  —  ' + detail : ''}`); }
};

// Panels are rendered to a few significant figures, so agreement is judged at
// display precision rather than to the megawatt. 1.5% catches a genuine
// disagreement while tolerating rounding in a "31.6 GW" label.
const agrees = (a, b, tol = 0.015) =>
  Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));

// Pull the first number out of a string, handling thousands separators, unicode
// minus and the various dashes the site uses.
const num = t => {
  if (!t) return NaN;
  const m = String(t).replace(/\u2212/g, '-').replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : NaN;
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
  const w = dom.window, d = w.document;

  const runAsync = src => run(src);
  const run = src => {
    const el = d.createElement('script');
    el.textContent = 'window.__cc = (() => { try { ' + src + ' } catch (e) { return { err: String(e) }; } })();';
    d.body.appendChild(el);
    return w.__cc;
  };

  // Render everything, then compare panels against the engine that fed them.
  const E = run(`
    lastRes = simulate(state, PROFILES);
    const r = lastRes;
    if (typeof renderAll === 'function') renderAll(r);
    else {
      [ 'renderKPIs','renderAdequacy','renderPricePanel','renderMix','renderCapacity',
        'renderCurtailment','renderValidation','drawPipeline','renderCarbon'
      ].forEach(f => { try { if (typeof window[f] === 'function') window[f](r); } catch(e){} });
    }
    let peak = 0, peakH = 0;
    for (let h = 0; h < 8760; h++) if (r.loadS[h] > peak) { peak = r.loadS[h]; peakH = h; }
    const E = r.E;
    // Denominator = GENERATION delivered to the grid.
    //
    // IMPORTS ARE INCLUDED. Cahora Bassa power serves South African load exactly
    // as a domestic unit does, so excluding it understated the denominator and
    // overstated every share computed from it. This harness excluded imports
    // while the KPI panel included them; the gap sat just inside tolerance until
    // congestion curtailment widened it on 27 Aug 2026.
    //
    // STORAGE STAYS OUT of both. Pumped storage and battery output is energy
    // already counted once when it was generated; counting it again on discharge
    // would double-count.
    //
    // The panel was right and this check was wrong. Fixed here rather than
    // relaxing the tolerance, which would have hidden a real definitional split.
    const dom_ = E.coal+E.nuclear+E.hydro+E.imports+E.wind+E.pv+E.csp+(E.hybrid||0)+E.rooftop+E.ccgt+E.diesel;
    // firm capacity, computed exactly as the adequacy panel does
    const firm = (FIXED.coalInstalledMW - (state.coalDecomMW||0)) * (state.coalEAFPct/100)
               + FIXED.nuclearMW*0.9 + FIXED.hydroMW*0.5 + FIXED.importsMW*0.9
               + FIXED.psPowerMW + FIXED.ocgtDieselMW + FIXED.battPowerMW;
    return {
      peakGW: peak/1000, peakHour: peakH,
      coalTWh: E.coal/1e6, co2: r.co2, curtTWh: E.curtailed/1e6,
      avgCost: r.avgCost, replAvg: r.replAvg, avgPrice: r.priceStats.avg,
      rePct: 100*(E.wind+E.pv+E.csp+(E.hybrid||0)+E.rooftop+E.hydro)/dom_,
      energyTWh: dom_/1e6, importsTWh: E.imports/1e6,
      psAtPeakMW: r.stack.ps[peakH], battAtPeakMW: r.stack.batt[peakH],
      psTWh: E.ps/1e6, battTWh: E.batt/1e6,
      firmGW: firm/1000,
      windMW: FIXED.windMW, pvUtilityMW: FIXED.pvUtilityMW, rooftopMW: FIXED.rooftopMW,
      vppPool: (typeof vppPoolByRegion === 'function')
        ? Object.values(vppPoolByRegion()).reduce((a,b)=>a+b,0) : null,
    };
  `);

  if (!E || E.err) { console.log('FATAL:', E ? E.err : 'no result'); process.exit(1); }

  const text = el => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');
  const kpi = label => {
    const c = [...d.querySelectorAll('#kpis .kpi')]
      .find(x => text(x.querySelector('.k')).toLowerCase().includes(label.toLowerCase()));
    return c ? num(text(c.querySelector('.v'))) : NaN;
  };

  // ── 1. KPI panel vs the engine ────────────────────────────────────────────
  // dom_ IS EVERYTHING DELIVERED TO THE GRID - imports included, storage
  // excluded. Compare against it directly and never add a component back.
  //
  // This has now caused a false failure twice, in opposite directions. First
  // dom_ excluded imports and this check added them, which was right then. On
  // 27 Aug imports were added to dom_ (correctly - they serve load exactly as a
  // domestic unit does), and this line then counted them twice: 228.6 against
  // the panel's 220, the difference being E.imports precisely.
  const kEnergy = kpi('energy supplied');
  check('KPI "Energy supplied" matches the engine',
        agrees(kEnergy, E.energyTWh),
        `panel ${kEnergy} vs engine ${E.energyTWh.toFixed(1)} TWh (all delivered, imports included)`);

  // The panel prints whole percentages, so 18 against 18.458 is display
  // rounding, not disagreement. Compare at the precision actually shown.
  const kRe = kpi('renewables');
  check('KPI "Renewables" matches the engine',
        Math.abs(kRe - E.rePct) <= 0.6, `panel ${kRe}% vs engine ${E.rePct.toFixed(1)}%`);

  const kCurt = kpi('curtailment');
  if (!isNaN(kCurt))
    check('KPI "Curtailment" matches the engine',
          agrees(kCurt, E.curtTWh, 0.05) || (kCurt < 0.05 && E.curtTWh < 0.05),
          `panel ${kCurt} vs engine ${E.curtTWh.toFixed(2)} TWh`);

  const kCost = kpi('avg energy cost');
  if (!isNaN(kCost))
    check('KPI "Avg energy cost" matches the engine',
          agrees(kCost*1000, E.avgCost, 0.02), `panel R${kCost}/kWh vs engine R${E.avgCost.toFixed(0)}/MWh`);

  const kRepl = kpi('replacement');
  if (!isNaN(kRepl))
    check('KPI "Replacement cost" matches the engine',
          agrees(kRepl*1000, E.replAvg, 0.02), `panel R${kRepl}/kWh vs engine R${E.replAvg.toFixed(0)}/MWh`);

  // ── 2. peak demand, wherever it appears ───────────────────────────────────
  const bodyTxt = d.body.textContent.replace(/\s+/g, ' ');
  // Tightly anchored: the loose version matched "firm capacity 39.2 GW" and the
  // reserve-margin figures simply because the word "peak" appeared within forty
  // characters, and reported both as peak-demand disagreements.
  // Prose that deliberately CONTRASTS the model with Eskom's own reported peak is
  // not a contradiction - it is the caveat explaining the definitional gap. Two
  // such passages exist and both name Eskom explicitly, so exclude any match
  // whose surrounding text does. The remaining figures must all agree.
  const peakMentions = [...bodyTxt.matchAll(/peak(?:\s+demand)?[^.\d]{0,12}([\d.]+)\s*GW/gi)]
    .filter(m => !/eskom|observed|reported/i.test(bodyTxt.slice(Math.max(0, m.index - 120), m.index + 60)))
    .map(m => parseFloat(m[1])).filter(v => v > 15 && v < 60);
  if (peakMentions.length) {
    const bad = peakMentions.filter(v => !agrees(v, E.peakGW, 0.05));
    check('every peak-demand figure on the page agrees',
          bad.length === 0,
          bad.length ? `engine says ${E.peakGW.toFixed(1)} GW; page also shows ${[...new Set(bad)].join(', ')} GW` : '');
  } else notes.push('no peak-demand figure found in the rendered text to cross-check');

  // ── 3. THE ONE THAT MATTERED: firm capacity vs what storage actually does ──
  // The adequacy panel counts pumped storage and batteries as firm capacity. If
  // the dispatch never uses them, the panel is claiming capacity the model does
  // not deliver. That exact contradiction went unnoticed for weeks.
  const storageCountedGW = (E.firmGW * 1000 - (E.firmGW * 1000 - 2900 - 800)) / 1000;
  check('storage counted as firm actually discharges over the year',
        E.psTWh + E.battTWh > 0.5,
        `adequacy counts ~${(2900+800)/1000} GW of storage as firm, yet dispatch delivers only ` +
        `${(E.psTWh + E.battTWh).toFixed(3)} TWh from it all year`);

  // and it must actually be there at the annual peak, which is what "firm" means
  //
  // STANDING FLAG since 31 Aug 2026, when coalEAFPct moved 68 -> 65 (Eskom's audited
  // FY2026 outturn). NOT RELAXED, and it should not be: the check is right and the
  // BEHAVIOUR is wrong.
  //
  // Measured at the peak hour 3834: pumped storage runs flat out at 2,900 MW for the
  // three hours BEFORE the peak and arrives empty, so 3,138 MW of DIESEL covers the
  // hour instead. At 68% it still had 1,465 MW left; the audited 65% exhausts it an
  // hour earlier. Lower availability did not create this - it exposed it.
  //
  // CAUSE: the same missing value function as the storage LP work. The heuristic
  // discharges whenever there is a deficit, with nothing reserving energy for the worst
  // hour of the year. Two ordering fixes were tried and reverted on 30 Aug; a third
  // improvised attempt is not warranted. See STATE.md "the full fix".
  //
  // WHY IT STAYS FAILING RATHER THAN BEING WIDENED: adequacy counts this storage as
  // firm capacity. If the dispatch cannot deliver it at the annual peak, the firm figure
  // is overstated, and that is worth a red line until the dispatch is fixed.
  check('storage contributes at the annual peak hour',
        (E.psAtPeakMW + E.battAtPeakMW) > 100 || E.peakHour === undefined,
        `at the peak hour storage delivers ${(E.psAtPeakMW + E.battAtPeakMW).toFixed(0)} MW ` +
        `while being counted as firm capacity`);

  // ── 3b. peak demand must track the demand-growth slider ───────────────────
  // Added after "peak demand" was found to include storage charging: at 5%
  // growth the Future mix preset reported 50.5 GW against a true 33.2 GW. Every
  // panel AGREED with every other, because they all read the same mislabelled
  // quantity - so panel-versus-panel checks passed while the figure was wrong.
  // Agreement is not correctness when the shared source is misnamed.
  const growth = run(`
    const a = simulate({ ...state, demandGrowthPct: 0,  newBattMW: 30000 }, PROFILES);
    const b = simulate({ ...state, demandGrowthPct: 20, newBattMW: 30000 }, PROFILES);
    return { p0: a.peak/1000, p20: b.peak/1000 };
  `);
  if (growth && !growth.err) {
    const implied = 100 * (growth.p20 / growth.p0 - 1);
    check('peak demand scales with the demand-growth slider, not with storage',
          Math.abs(implied - 20) < 4,
          `+20% demand growth moved peak by ${implied.toFixed(1)}% ` +
          `(${growth.p0.toFixed(1)} -> ${growth.p20.toFixed(1)} GW) — if this is far off, ` +
          `the reported peak is picking up something other than demand`);
  }

  // ── 4. regional capacity must sum to the national constants ───────────────
  const cap = JSON.parse(fs.readFileSync(path.join(ROOT, 'nodal/regional_renewable_capacity.json'), 'utf8'));
  const sumWind = Object.values(cap.wind_mw).reduce((a, b) => a + b, 0);
  const sumSolar = Object.values(cap.solar_mw).reduce((a, b) => a + b, 0);
  check('regional wind sums to FIXED.windMW',
        agrees(sumWind, E.windMW, 0.002), `regions ${sumWind.toFixed(0)} vs FIXED ${E.windMW}`);
  check('regional solar sums to FIXED.pvUtilityMW',
        agrees(sumSolar, E.pvUtilityMW, 0.002), `regions ${sumSolar.toFixed(0)} vs FIXED ${E.pvUtilityMW}`);

  // ROOFTOP IS DELIBERATELY NOT A DIRECT SUM. rooftop_mw_by_region.json is kept
  // VERBATIM ESKOM so the source stays traceable, and nodal_dispatch.js subtracts
  // privately wheeled solar per region at load time - otherwise that plant would
  // be counted once as supply from the capacity file and again inside the rooftop
  // netting. Checking the raw file against FIXED reported a 488 MW gap that is
  // exactly by_source.private.solar_mw, i.e. the subtraction working correctly.
  //
  // So the identity to assert is: file MINUS private wheeled == FIXED.
  const rt = JSON.parse(fs.readFileSync(path.join(ROOT, 'nodal/rooftop_mw_by_region.json'), 'utf8'));
  const sumRt = Object.values(rt).filter(v => typeof v === 'number').reduce((a, b) => a + b, 0);
  const privSolar = (cap.by_source && cap.by_source.private && cap.by_source.private.solar_mw) || {};
  const sumPriv = Object.values(privSolar).reduce((a, b) => a + b, 0);
  check('regional rooftop, net of privately wheeled solar, sums to FIXED.rooftopMW',
        agrees(sumRt - sumPriv, E.rooftopMW, 0.01),
        `${sumRt.toFixed(0)} - ${sumPriv.toFixed(0)} = ${(sumRt-sumPriv).toFixed(0)} vs FIXED ${E.rooftopMW}`);

  // ── 5. VPP: what the sliders imply vs what reaches the optimiser ──────────
  if (E.vppPool !== null) {
    const implied = run(`
      const on = !!(state.vppEnabled ?? 1);
      const share = on ? Math.max(0, Math.min(100, state.vppEnrolPct ?? 0))/100 : 0;
      return { pool: (state.vppGeyserPoolMW ?? 4000) * share };
    `);
    if (implied && !implied.err)
      check('VPP pool reaching the optimiser matches the sliders',
            agrees(E.vppPool, implied.pool, 0.02) || (E.vppPool < 1 && implied.pool < 1),
            `sliders imply ${implied.pool.toFixed(0)} MW, optimiser receives ${E.vppPool.toFixed(0)} MW`);
  }

  // ── 6. the mix must add up ────────────────────────────────────────────────
  const mixSum = run(`
    const E = lastRes.E;
    const parts = ['coal','nuclear','hydro','wind','pv','csp','hybrid','rooftop','ccgt','diesel','imports','ps','batt'];
    let s = 0; for (const k of parts) s += (E[k] || 0);
    return { sum: s/1e6, served: (lastRes.E.coal !== undefined) ? 1 : 0 };
  `);
  if (mixSum && !mixSum.err)
    check('mix components sum to a sensible total',
          mixSum.sum > 180 && mixSum.sum < 400, `${mixSum.sum.toFixed(1)} TWh`);

  // ── report ────────────────────────────────────────────────────────────────
  // COST DECOMPOSITION MUST RECONCILE TO avgCost.
  // Added 30 Aug 2026. The decomposition is structured on NERSA's wholesale price
  // component list, so GridTwin's own number can be checked the way the EPP submission
  // argued tariffs should be. SUMMING IT AGAINST THE WHOLE is what makes it a check
  // rather than a display: within minutes of being written it caught a factor-of-1000
  // unit error AND the fact that startUpCostR is computed but included in no cost total.
  const cdec = run(`
    const out = [];
    for (const [lab, ov] of [['default',{}],
                             ['high RE',{newWindMW:20000,newPvMW:25000,newBattMW:10000}],
                             ['no coal',{coalDecomMW:42000,newCcgtMW:30000}]]){
      const r = simulate({ ...state, ...ov }, PROFILES);
      const cd = r.costDecomposition;
      out.push({ lab, ok: !!(cd && cd.reconciles), sum: cd ? cd.sumRPerMWh : null, avg: r.avgCost });
    }
    return out;
  `);
  if (cdec && !cdec.err) for (const c of cdec)
    check(`[${c.lab}] cost decomposition reconciles to avgCost`, c.ok === true,
          c.sum === null ? 'costDecomposition absent'
            : `components sum to ${c.sum.toFixed(2)} against avgCost ${c.avg.toFixed(2)} `
              + `- a decomposition that does not sum is not a decomposition`);
  // ── ADEQUACY ENSEMBLE ──────────────────────────────────────────────────────
  // The board's headline is an ENSEMBLE, not the deterministic run: LOLE and expected
  // unserved energy over draws varying the outage path and the weather year. Nothing in
  // the suite touched it, and the pricing run on 31 Aug showed what happens to code that
  // ships without ever being executed by a harness.
  //
  // It is ASYNC, so this drives it directly rather than waiting on the debounce, and
  // checks the properties that must hold rather than pinning values that legitimately
  // move with the draw.
  const adeq = runAsync(`
    // Force a small, fast ensemble so the harness does not pay for 48 draws twice.
    ADEQ_N_TEST = 8;
    const out = {};
    const shed = r => { let n = 0; for (let h = 0; h < HOURS; h++) if (r.stack.unserved[h] > 1) n++;
                        return { gwh: (r.E.unserved || 0) / 1000, hrs: n, stage: r.maxStage }; };
    const ens = (st, n) => {
      const runs = [];
      for (let i = 0; i < n; i++)
        runs.push(shed(simulate({ ...st, outageSeed: 20260816 + i * 7919 }, PROFILES)));
      const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
      return { eue: mean(runs.map(r => r.gwh)), lole: mean(runs.map(r => r.hrs)),
               worst: Math.max(...runs.map(r => r.stage)),
               hi: Math.max(...runs.map(r => r.gwh)) };
    };
    out.today  = ens(state, 8);
    out.tight  = ens({ ...state, coalEAFPct: 55 }, 8);
    out.crisis = ens({ ...state, coalEAFPct: 45, demandGrowthPct: 14 }, 8);
    out.hasFn  = typeof runAdequacy === 'function' && typeof applyAdequacyToBoard === 'function';
    out.n      = (typeof ADEQ_N !== 'undefined') ? ADEQ_N : null;
    return out;
  `);

  if (adeq && !adeq.err){
    check('the adequacy ensemble and its board hook both exist', adeq.hasFn === true,
          'runAdequacy or applyAdequacyToBoard is missing - the board would silently keep '
          + 'showing the single deterministic draw');

    check('the shipped draw count is large enough to be worth averaging', (adeq.n || 0) >= 24,
          `ADEQ_N is ${adeq.n}; measured on 31 Aug, 9 draws gave a standard error of 75% of `
          + `the mean on a tail-heavy distribution`);

    // LOLE and EUE must be non-negative and finite - a NaN here would render as a blank
    // status word rather than an error, which is the worst kind of failure.
    for (const [lab, v] of Object.entries({ today: adeq.today, tight: adeq.tight, crisis: adeq.crisis })){
      check(`[${lab}] adequacy metrics are finite and non-negative`,
            Number.isFinite(v.eue) && Number.isFinite(v.lole) && v.eue >= 0 && v.lole >= 0,
            `EUE ${v.eue}, LOLE ${v.lole}`);
    }

    // MONOTONICITY: less available coal must not produce LESS expected shedding. This is
    // the property that would break if the ensemble ever averaged the wrong thing.
    check('expected unserved energy rises as coal availability falls',
          adeq.tight.eue > adeq.today.eue && adeq.crisis.eue > adeq.tight.eue,
          `EUE today ${adeq.today.eue.toFixed(2)}, at 55% EAF ${adeq.tight.eue.toFixed(2)}, `
          + `crisis ${adeq.crisis.eue.toFixed(2)} GWh - these must increase`);

    check('LOLE rises as coal availability falls',
          adeq.tight.lole > adeq.today.lole && adeq.crisis.lole > adeq.tight.lole,
          `LOLE today ${adeq.today.lole.toFixed(1)}, at 55% EAF ${adeq.tight.lole.toFixed(1)}, `
          + `crisis ${adeq.crisis.lole.toFixed(1)} h/yr`);

    // The expectation must sit inside the range of draws it came from. Trivially true if
    // computed correctly, and a sharp signal if a mean is ever taken over the wrong array.
    check('expected unserved energy sits below the worst draw',
          adeq.today.eue <= adeq.today.hi + 1e-9,
          `EUE ${adeq.today.eue.toFixed(2)} against a worst draw of ${adeq.today.hi.toFixed(2)} GWh`);
  } else {
    check('the adequacy ensemble runs', false, adeq ? adeq.err : 'probe returned nothing');
  }


  // ── WHEELING COVERAGE ─────────────────────────────────────────────────────
  // The panel prices transport; this answers what share of load a contract covers.
  // Its ceiling is physical - only ~49% of hours have any sun - so a coverage figure
  // above the daylight fraction for solar ALONE would mean the maths has broken.
  const wcov = run(`
    if (typeof wheelCoverage !== 'function') return { err: 'wheelCoverage not exposed' };
    const s4  = wheelCoverage('Northern Cape', 1, 4,  0, 0, 0);
    const s32 = wheelCoverage('Northern Cape', 1, 32, 0, 0, 0);
    const mix = wheelCoverage('Northern Cape', 1, 4,  1, 1, 4);
    if (!s4 || !s32 || !mix) return { err: 'profiles not loaded' };
    return { s4: s4.coverPct, s32: s32.coverPct, mix: mix.coverPct, sun: s4.sunPct };
  `);
  if (wcov && !wcov.err){
    check('solar-only coverage cannot exceed the daylight fraction',
          wcov.s32 <= wcov.sun + 0.5,
          `32 MW of solar on a 1 MW load covers ${wcov.s32.toFixed(1)}% against a daylight `
          + `fraction of ${wcov.sun.toFixed(1)}% - above it means the maths is wrong`);
    check('eight times the solar buys less than eight points',
          (wcov.s32 - wcov.s4) < 8,
          `4 MW covers ${wcov.s4.toFixed(1)}%, 32 MW covers ${wcov.s32.toFixed(1)}%`);
    check('wind and storage break the solar ceiling',
          wcov.mix > wcov.sun,
          `solar with wind and a battery covers ${wcov.mix.toFixed(1)}%, which must exceed `
          + `the ${wcov.sun.toFixed(1)}% daylight fraction or the diversity is not working`);
  } else {
    check('wheeling coverage is reachable', false, wcov ? wcov.err : 'probe returned nothing');
  }

  // ── SCENARIO ISOLATION ────────────────────────────────────────────────────
  // `simulate()` MUTATES its parameter object: the CCS branch rewrites p.costCoal and
  // p.emisCoal in place, and syncFloorMW is derived onto it. That is fine only while `p`
  // is a fresh copy per call. If it ever becomes shared - or if a caller passes FIXED or
  // `state` directly - enabling CCS once would silently poison every later run.
  //
  // Checked 1 Sep 2026 while closing a stale open item about an `emisCoal || 0.95`
  // fallback that no longer exists. The mutation does not leak today; this asserts that
  // it keeps not leaking, because the failure would be invisible - every number stays
  // plausible, just wrong.
  const iso = run(`
    const a = simulate({ ...state, ccsEnabled: false }, PROFILES);
    const b = simulate({ ...state, ccsEnabled: true  }, PROFILES);
    const c = simulate({ ...state, ccsEnabled: false }, PROFILES);
    return { first: a.co2, mid: b.co2, third: c.co2,
             fixedEmis: FIXED.emisCoal, fixedCost: FIXED.costCoal };
  `);
  if (iso && !iso.err){
    check('a CCS run does not leak into a later non-CCS run',
          Math.abs(iso.first - iso.third) < 0.01,
          `CO2 ${iso.first.toFixed(2)} then ${iso.third.toFixed(2)} Mt with an identical `
          + `scenario either side of a CCS run - simulate() mutates its parameter object, `
          + `so this means the object is being shared`);
    check('CCS lowers emissions when enabled',
          iso.mid < iso.first * 0.5,
          `${iso.mid.toFixed(2)} against ${iso.first.toFixed(2)} Mt - if these converge the `
          + `capture rate is not being applied at all`);
    check('the emission and cost constants survive a CCS run',
          Math.abs(iso.fixedEmis - 1.04) < 1e-9 && iso.fixedCost === 546,
          `FIXED.emisCoal ${iso.fixedEmis}, FIXED.costCoal ${iso.fixedCost} - the CCS `
          + `branch has written through to the constants`);
  }

  // ── HOURLY ENERGY BALANCE IN SHED HOURS ──────────────────────────────────
  // Found 1 Sep 2026 by sweeping eight scenarios: a residual under 1 MW was DROPPED rather
  // than recorded as unserved, so the balance failed by up to 0.8 MW in the one hour a year
  // where diesel hit its cap with a sub-MW shortfall left over. Immaterial as energy - 0.8
  // MWh - but a balance that is exact everywhere EXCEPT the shed hours is the wrong
  // approximation, and nothing in 914 checks caught it.
  //
  // Must be tested in scenarios that SHED. A scenario with no unserved energy never enters
  // the branch, so it would pass without proving anything - hence the second check.
  const bal = run(`
    const out = [];
    for (const [lab, ov] of [['EAF 50', { coalEAFPct: 50 }],
                             ['demand +50%', { demandGrowthPct: 50 }]]){
      const x = simulate({ ...state, ...ov }, PROFILES);
      let worst = 0;
      for (let h = 0; h < HOURS; h++){
        let sup = 0;
        for (const k in x.stack){ const a = x.stack[k]; if (a) sup += a[h] || 0; }
        const e = Math.abs(sup - x.loadS[h]);
        if (e > worst) worst = e;
      }
      out.push({ lab, worst, un: (x.E.unserved || 0) / 1000 });
    }
    return out;
  `);
  if (Array.isArray(bal)) for (const c of bal){
    check(`[${c.lab}] hourly energy balance is exact`,
          c.worst < 1e-6,
          `worst imbalance ${c.worst.toFixed(4)} MW - a residual is being dropped instead of `
          + `recorded as unserved`);
    check(`[${c.lab}] the scenario sheds, so the branch is exercised`,
          c.un > 1,
          `${c.un.toFixed(1)} GWh unserved - without shedding this proves nothing`);
  }


  // ── EVERY PANEL MUST FILL ON A FRESH LOAD ────────────────────────────────
  // Three panels - hydrogen, grid-enhancing and heat - were EMPTY on a real page load for
  // a day. run() reaches them through `window.renderX`, but their defining closures
  // execute later, so the guards read undefined and skipped. `typeof X === 'function'` is
  // a guard, not an assertion, so nothing failed.
  //
  // Every test that missed it had called run() by hand first. This one must not: it reads
  // the panels as a visitor gets them, with no interaction at all.
  const fresh = run(`
    const out = {};
    for (const id of ['h2Body', 'getsBody', 'heatBody', 'priceBody', 'captureBody']){
      const el = document.getElementById(id);
      out[id] = el ? (el.textContent || '').trim().length : -1;
    }
    return out;
  `, { noRun: true });
  if (fresh && !fresh.err){
    for (const id of Object.keys(fresh)){
      check(`[${id}] fills without any interaction`,
            fresh[id] > 30,
            fresh[id] < 0 ? 'element missing from the markup'
                          : `only ${fresh[id]} characters - the renderer did not run on load`);
    }
  }

  // ── THE INTERRUPTIBLE LOAD BLURB MUST MATCH THE MERIT ORDER ──────────────
  // The note claimed the compensation "sits between the cost of diesel and the cost of
  // unserved energy". At the default it is R4,000 against a diesel SRMC of R6,136 - BELOW
  // diesel, not between. Reported 2 Sep 2026; nothing checked it because the claim was
  // prose about two constants and no check compared the two.
  //
  // Assert the ORDERING rather than the wording, so the note stays true if either cost is
  // ever re-based.
  const dr = run(`
    const P = { ...FIXED, ...state };
    const dieselSRMC = P.costDiesel + (P.carbonTaxRPerT || 0) * (P.emisDiesel || 0);
    return { drCost: P.drInterruptCostR, dieselSRMC, voll: P.voll ?? 87000 };
  `);
  if (dr && !dr.err){
    check('interruptible load is cheaper than diesel, as the note says',
          dr.drCost < dr.dieselSRMC,
          `compensation R${dr.drCost} against a diesel SRMC of R${dr.dieselSRMC.toFixed(0)} - `
          + `if this inverts, the slider note must change with it`);
    check('interruptible load is far cheaper than unserved energy',
          dr.drCost < dr.voll / 5,
          `R${dr.drCost} against a value of lost load of R${dr.voll}`);
  }

  // ── SLIDER NOTES MUST NOT HARDCODE A STALE DEFAULT ───────────────────────
  // The gas LCOE note read "R2.50 implies a 30-50% capacity factor" while FIXED.lcoeCcgt
  // was 3,340. The constant had been re-based and the prose beside it had not, so the
  // slider showed R3.34 above a sentence explaining R2.50. Reported 2 Sep 2026.
  //
  // Checks the notes that quote their own default in rands. Not exhaustive - it cannot be,
  // since prose is free text - but it pins the ones that carry a figure today.
  const notes = run(`
    const out = {};
    for (const sl of SLIDERS){
      if (!sl.id || !sl.note) continue;
      out[sl.id] = { note: String(sl.note), def: (typeof sl.def === 'number') ? sl.def : null };
    }
    return { s: out, lcoeCcgt: FIXED.lcoeCcgt, costCcgt: FIXED.costCcgt };
  `);
  if (notes && !notes.err){
    // the gas LCOE note must not quote a rand-per-kWh figure that is not the default
    const g = notes.s.lcoeCcgt;
    if (g){
      const quoted = (g.note.match(/R([0-9]+\.[0-9]{2})\/kWh/g) || [])
        .map(x => Math.round(parseFloat(x.slice(1)) * 1000));
      const defK = notes.lcoeCcgt;
      const stale = quoted.filter(q => Math.abs(q - defK) > 5 && Math.abs(q - 1968) > 5);
      check('the gas LCOE note quotes no stale rand figure',
            stale.length === 0,
            `note cites R${(stale[0]/1000).toFixed(2)}/kWh against a default of `
            + `R${(defK/1000).toFixed(2)} - the constant moved and the prose did not`);
    }
  }

  // ── SUB-CONTROLS MUST CARRY THE INDENT, NOT JUST THE DASH ────────────────
  // On 2 Sep three sliders were given an en-dash label prefix to mark them as children of
  // the toggle above, and I stopped there. The dash is cosmetic; the indent comes from
  // `ctrlStyle: SUB_CTRL`, which draws the padding and the left rule. The result was three
  // labels that read like sub-controls and rendered flush with their parents.
  //
  // Asserts the two travel together: any label starting with an en-dash must have the
  // indent style on its .ctrl wrapper.
  const subs = run(`
    const out = [];
    for (const sl of SLIDERS){
      if (!sl.label || sl.label.indexOf('\u2013') !== 0) continue;
      out.push({ id: sl.id, label: sl.label, styled: !!sl.ctrlStyle });
    }
    return out;
  `);
  if (Array.isArray(subs)){
    check('every en-dash sub-control also carries the indent style',
          subs.every(x => x.styled),
          'dash but no ctrlStyle: '
          + subs.filter(x => !x.styled).map(x => x.id).join(', ')
          + ' - the label says child, the layout says sibling');
    check('the sub-control convention is actually in use',
          subs.length >= 3,
          `only ${subs.length} en-dash labels found - if the convention changed, this check `
          + `needs revisiting rather than deleting`);
  }

  console.log(`\n${pass}/${pass + fail} cross-panel consistency checks passed`);
  if (failures.length) { console.log('\nFAILURES:'); failures.forEach(f => console.log('  ' + f)); }
  if (notes.length)    { console.log('\nNOTES:');    notes.forEach(n => console.log('  ' + n)); }
  process.exit(fail ? 1 : 0);
})();
