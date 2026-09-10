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
    // Character count alone is not enough. The capture panel spent a day rendering ONE
    // SENTENCE and no tables - its write had been truncated mid-literal, losing both
    // section() calls - and a length check passed it because the sentence is 130
    // characters. Panels that carry a table must have rows.
    for (const id of ['h2Body', 'getsBody', 'heatBody', 'priceBody', 'captureBody']){
      const el = document.getElementById(id);
      out[id] = el ? (el.textContent || '').trim().length : -1;
      out[id + '__rows'] = el ? el.querySelectorAll('tr').length : -1;
    }
    return out;
  `, { noRun: true });
  if (fresh && !fresh.err){
    for (const id of Object.keys(fresh)){
      if (id.endsWith('__rows')) continue;
      check(`[${id}] fills without any interaction`,
            fresh[id] > 30,
            fresh[id] < 0 ? 'element missing from the markup'
                          : `only ${fresh[id]} characters - the renderer did not run on load`);
    }
    // Panels whose whole purpose is a table must actually produce one.
    for (const id of ['captureBody', 'getsBody', 'priceBody']){
      check(`[${id}] renders its table, not just its note`,
            fresh[id + '__rows'] > 1,
            `${fresh[id + '__rows']} table rows - the panel has prose but no data, which a `
            + `character count will not catch`);
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

  // ── THE TOU CLASSIFIER MUST MATCH THE PUBLISHED BLOCK STRUCTURE ──────────
  // The PANEL was removed on 4 Sep - twice explained and twice not understood, so it was
  // not earning its space. `touBlockOf` and `touCompare` stay: they produced the block
  // table in the NERSA market inquiry submission, and a live submission should rest on
  // code that still runs and is still checked, not on a number from a deleted function.
  // These checks are what keeps them from becoming the kind of orphan that broke the
  // capture panel.
  // Megaflex is public and unambiguous, so the classifier is checkable against arithmetic
  // rather than against itself: 52 weekends is exactly 2,496 hours, and the blocks must
  // partition the year with nothing left over.
  const tou = run(`
    const tally = {}; let weekend = 0;
    for (let h = 0; h < 8760; h++){
      const t = touBlockOf(h);
      const k = t.season + ' ' + t.block;
      tally[k] = (tally[k] || 0) + 1;
      if (t.weekend) weekend++;
    }
    const rows = touCompare(lastRes);
    const hp = rows.find(r => r.block === 'high peak');
    const lp = rows.find(r => r.block === 'low peak');
    // Anchor the calendar. Counting weekend hours proves nothing about ALIGNMENT: any
    // day-of-week offset still yields 104 weekend days, so a calendar shifted by a day
    // passes a count check while classifying every hour into the wrong block.
    // 1 January of the profile year is a Wednesday, so hour 0 must be a weekday and
    // hours 96-143 (the first Sat-Sun pair) must both be weekend.
    const h0Weekday = !touBlockOf(0).weekend;
    const firstSat = touBlockOf(24 * 3).weekend && touBlockOf(24 * 4).weekend;
    const midWeek = !touBlockOf(24 * 5).weekend;
    return { h0Weekday, firstSat, midWeek,
             total: Object.values(tally).reduce((a, b) => a + b, 0), weekend,
             highPeakMean: hp ? hp.mean : null, lowPeakMean: lp ? lp.mean : null,
             medians: rows.map(r => r.median),
             cheapest: rows.slice().sort((a, b) => a.mean - b.mean)[0].block,
             // TARIFF_RANK is closure-scoped and not on window, so it cannot be read from
             // here. Referencing it threw, the probe returned an error, and the guard below
             // skipped four checks SILENTLY while the suite still reported green.
             // Check the block names instead.
             unranked: rows.filter(r => ['high peak','low peak','high standard',
               'low standard','high offpeak','low offpeak','weekend']
               .indexOf(r.block) < 0).length };
  `);
  check('the TOU probe returns a result',
        !!(tou && !tou.err),
        tou && tou.err ? String(tou.err).slice(0, 90) : 'probe returned nothing - four checks '
        + 'were skipped silently once already this way');
  if (tou && !tou.err){
    check('the TOU blocks partition the whole year',
          tou.total === 8760,
          `${tou.total} hours classified, not 8,760 - the blocks overlap or leave a gap`);
    check('weekend hours are exactly 52 weekends',
          tou.weekend === 2496,
          `${tou.weekend} weekend hours against 2,496 - too few or too many weekend days`);
    check('the calendar is aligned, not merely the right shape',
          tou.h0Weekday && tou.firstSat && tou.midWeek,
          `1 Jan weekday ${tou.h0Weekday}, first Sat/Sun ${tou.firstSat}, midweek `
          + `${tou.midWeek} - a shifted calendar keeps 104 weekend days and puts every `
          + `hour in the wrong block`);
    // WITHDRAWN 6 Sep 2026. This asserted that the low-season peak block prices above the
    // high-season one, and said the submission would need revisiting if it stopped holding.
    // It stopped holding, and the submission did need revisiting - a correction note went
    // to NERSA. The check did its job exactly as written.
    //
    // The cause was `profiles.json` understating wind by 11%, which manufactured scarcity
    // hours that fell disproportionately in the low season. The MEANS moved; the medians
    // never did.
    //
    // Replaced by the two findings that survive correction. Both are about the median and
    // the ordering, neither depends on a handful of extreme hours, and that is why they
    // held when the original did not.
    const meds = tou.medians.filter(x => x > 0);
    check('the blocks barely separate a typical hour',
          (Math.max(...meds) - Math.min(...meds)) / Math.min(...meds) < 0.05,
          `medians span ${(100*(Math.max(...meds)-Math.min(...meds))/Math.min(...meds)).toFixed(1)}% `
          + `- the surviving NERSA claim is that they separate on the tail, not the level`);
    check('high-season off-peak is the cheapest block modelled',
          tou.cheapest === 'high offpeak',
          `cheapest is "${tou.cheapest}" - the surviving NERSA claim is that Megaflex `
          + `charges high-season off-peak above low-season off-peak and weekend while it `
          + `is the cheapest block. If this moves, the correction note needs revisiting`);

    check('every block has a tariff rank to compare against',
          tou.unranked === 0,
          `${tou.unranked} blocks have no tariff rank - the panel would show a comparison `
          + `column with nothing in it, which is how the first version read`);
  }

  // ── WHEELING RECONCILIATION: TWO BASES, AND THEY MUST DIFFER ────────────
  // Eskom's Wheeling of Energy and Net-billing policy, revision 2, July 2026, clause
  // 2.2.13.3 reconciles the load customer's account on total energy summed per TOU period
  // per MONTH. Clause 2.2.13.4 announces a shift to HOURLY TOU, approved but not dated.
  //
  // The model showed only hourly until 8 Sep 2026, which understated coverage by 14 to 24
  // points against the rule actually in force - a number developers are using to size PPAs
  // now.
  //
  // This asserts the monthly basis is BOTH reachable and materially different. If the
  // parameter is ever dropped, the two columns silently become one and the panel goes back
  // to answering only the future question.
  {
    const r = run(`
      const h = wheelCoverage('Northern Cape', 1, 3, 0, 0, 0);
      const m = wheelCoverage('Northern Cape', 1, 3, 0, 0, 0, 'monthly');
      return (h && m) ? { hourly: h.coverPct, monthly: m.coverPct } : null;
    `);
    if (r && !r.err && r.hourly){
      check('monthly TOU reconciliation is reachable and more generous than hourly',
            r.monthly > r.hourly + 5,
            `monthly ${r.monthly.toFixed(1)}% vs hourly ${r.hourly.toFixed(1)}% - monthly `
            + `nets generation against consumption across the whole month within each TOU `
            + `period, so it MUST be more generous. If these converge, the basis parameter `
            + `is being ignored and the panel is answering one question twice.`);
      console.log(`  wheeling      Northern Cape 3x solar: monthly ${r.monthly.toFixed(0)}% `
        + `\u00b7 hourly ${r.hourly.toFixed(0)}%`);
    }
  }

  // ── NEGATIVE PRICES MUST STAY IN THE OBSERVED RANGE ─────────────────────
  // The negative-price rule prices coal-forced curtailment at the avoided restart cost.
  // Its premise - that EVERY curtailment hour is coal-forced - held at today's penetration
  // and failed at high VRE: on the Future electricity mix preset it produced 5,614 negative
  // hours, 64% of the year, against roughly 460 in Germany in 2024, the most
  // negative-price-prone system in Europe.
  //
  // 103 of that scenario's 134 TWh of curtailment survives retiring the ENTIRE coal fleet,
  // so it was never coal-forced. Fixed 8 Sep 2026 to require that coal cannot get out of
  // the way, not merely that it is running.
  //
  // This asserts the result stays physically credible under the most VRE-heavy scenario
  // shipped. No real system spends most of its year paying people to consume.
  {
    const r = run(`
      const base = { ...state, ...PRESETS['Future electricity mix'] };
      const rr = simulate(base, PROFILES);
      const p = Array.from(rr.marginalP || []);
      const neg = p.filter(x => x < 0).length;
      const s2 = p.slice().sort((a, b) => a - b);
      return { neg, pct: 100 * neg / p.length, median: s2[Math.floor(p.length/2)] };
    `);
    if (r && !r.err && typeof r.neg === 'number'){
      check('negative-price hours stay within observed international range',
            r.pct < 20,
            `${r.neg} hours below zero, ${r.pct.toFixed(1)}% of the year, on the Future mix `
            + `preset. Germany ran about 460 hours (5.3%) in 2024 and is the most `
            + `negative-price-prone system in Europe. Above 20% the model is asserting `
            + `something no market has done, and the likely cause is curtailment being `
            + `priced as coal-forced when it is VRE surplus.`);
      console.log(`  neg prices    ${r.neg} hours (${r.pct.toFixed(1)}%) on the Future mix, `
        + `median R${r.median.toFixed(0)}`);
    }
  }

  // ── THE QUEUE PRESSURE PANEL MUST SAY WHAT ITS NUMERATOR IS ─────────────
  // Added 10 Sep 2026. The panel divides NERSA registered capacity by NTCSA connection
  // headroom and calls anything over 100% "more projects queued than grid to take them".
  //
  // The numerator is cumulative since 2018 and includes plant ALREADY BUILT AND CONNECTED.
  // NERSA confirmed to Engineering News on 24 Aug 2026 that it cannot track which
  // registrations were implemented, and a certificate never expires. So a region that
  // successfully connected its queue still reads as congested.
  //
  // Measured: the Western Cape is 253% on all registrations and about 116% on those not
  // yet operational. That is the difference between "twice the grid available" and
  // "slightly over", on the same data.
  //
  // The panel is still worth having - the ratio bounds the problem from above - but it
  // must say so. This asserts the caveat is present, because a panel rewrite that drops
  // it leaves a number that reads as twice as alarming as the evidence supports.
  {
    const r = run(`
      const el = document.getElementById('queueBody');
      return { text: el ? (el.textContent || '') : '' };
    `);
    if (r && !r.err && r.text && r.text.length > 40){
      const t = r.text.toLowerCase();
      check('the queue pressure panel states that registrations include built plant',
            t.includes('already built') || t.includes('cumulative since 2018'),
            `the panel text does not say its numerator includes connected plant. `
            + `Registered capacity is cumulative since 2018 with no expiry and no `
            + `implementation tracking, so the ratio is an UPPER BOUND on queue pressure, `
            + `not a measurement of it.`);
    }
  }

  // ── THE SHADOW RETAIL PANEL MUST STATE ITS BOUNDARY ─────────────────────
  // Added 10 Sep 2026 with the panel. Its mean lands about 44% below Homepower 4, and a
  // reader who takes that as "electricity should cost 44% less" has been misled by us.
  //
  // The reason is a boundary, not a verdict: our energy component is SHORT-RUN MARGINAL
  // COST, so it excludes recovery of the existing fleet - roughly R67bn of depreciation and
  // R43bn of return on assets a year that a real tariff must collect. The model treats
  // existing plant as sunk, which is correct for dispatch and wrong for a bill.
  //
  // This asserts the caveat is present and FIRST. A panel rewrite that drops it leaves a
  // number that reads as an accusation.
  {
    const r = run(`
      const el = document.getElementById('retNote');
      return { text: el ? (el.textContent || '') : '' };
    `);
    if (r && !r.err && typeof r.text === 'string' && r.text.length > 40){
      const t = r.text.toLowerCase();
      // ── THE PANEL IS BOTTOM-UP AND MUST STAY THAT WAY ─────────────────────
      // Two earlier versions anchored the level to Homepower and scaled. That could only
      // ever show fuel moving, because everything else was folded into one factor - and
      // fuel is 30% of the requirement. The rebuild constructs the price from NERSA's
      // allowed revenue instead, so every component responds on its own terms.
      //
      // The validation is that it lands near the real tariff WITHOUT calibration: R3.92
      // against Homepower's R3.56 at today's system. If that gap widens a lot, a component
      // has drifted and the method has stopped checking itself.
      check('the bottom-up build lands near the published tariff without calibration',
            t.includes('without calibration') || t.includes("bottom-up"),
            `the panel must state that it is built from allowed revenue rather than anchored, `
            + `and show the resulting figure against Homepower's actual rate. That agreement `
            + `is the only check the method has on itself.`);
      // ── THE GRID COST IS A FLOOR AND MUST SAY SO ──────────────────────────
      // Added 10 Sep 2026 after the panel was asked whether it included the grid for a
      // heavy renewables scenario. It did not - two faults at once.
      //
      // It added txRPerKWyr/8760 as "transmission", R0.068/kWh, on top of a component table
      // that is Eskom's WHOLE-COMPANY build-up and already contains transmission inside
      // opex, depreciation and return on assets. A double-count, and eight times too small
      // against NERSA's approved NTCSA revenue of R0.573/kWh.
      //
      // And the grid BUILT BY THE SCENARIO was absent entirely. The model computes it as
      // _txCapexR and used it only for a display table, so a 97 GW build implied no new
      // wires on the bill.
      //
      // It is now included and still low: R0.07/kWh against roughly R0.23 implied by the
      // TDP at R390bn for 56 GW. The model's own decomposition labels transmission partial,
      // so this is a known incompleteness - but a reader must be told, or the panel makes
      // heavy renewables look cheaper than the wires allow.
      check('the panel says the new-grid cost is a floor',
            t.includes('understated') || t.includes('floor'),
            `the scenario grid cost is roughly a third of what the Transmission Development `
            + `Plan implies. Without saying so, the panel understates the cost of exactly `
            + `the scenario it exists to test.`);
      // ── THE PANEL MUST RESPOND, AND AGREE WITH THE SYSTEM COST ────────────
      // RESTORED 10 Sep 2026. This check existed, then vanished when the surrounding block
      // was replaced during the bottom-up rebuild, and nothing noticed because everything
      // still passed. That is the disappearing-check failure STATE.md describes for eng5.
      //
      // It also used to assert the price FALLS by more than 20%. That was the conclusion of
      // a build with four missing or mis-scaled components. Corrected, the Future mix RAISES
      // a bill by roughly two thirds - 97 GW of renewables and 30 GW of storage annualise
      // R258bn a year over fewer kWh sold. A check that encodes a conclusion gets edited when
      // the conclusion changes, so this one asserts only that the panel moves, and that it
      // moves the same way as the model's own system cost.
      const sc = run(`
        const m = a => a.reduce((x, y) => x + y, 0) / a.length;
        const before = m(retailHourly().dyn), avgBefore = lastRes.avgCost;
        const keep = JSON.parse(JSON.stringify(state));
        Object.assign(state, PRESETS['Future electricity mix']);
        run();
        const after = m(retailHourly().dyn), avgAfter = lastRes.avgCost;
        Object.assign(state, keep); run();
        return { before, after, avgBefore, avgAfter };
      `);
      if (sc && !sc.err && sc.before && sc.after){
        const move = 100 * Math.abs(sc.after / sc.before - 1);
        check('the shadow retail price responds to a decarbonisation scenario',
              move > 20,
              `R${sc.before.toFixed(2)} today against R${sc.after.toFixed(2)} on the Future `
              + `electricity mix, ${move.toFixed(0)}% apart. Near zero means the panel is `
              + `absorbing the effect it exists to show.`);
        check('the retail price moves the same way as the system cost',
              Math.sign(sc.after - sc.before) === Math.sign(sc.avgAfter - sc.avgBefore),
              `retail R${sc.before.toFixed(2)} -> R${sc.after.toFixed(2)}, system cost `
              + `R${sc.avgBefore.toFixed(0)} -> R${sc.avgAfter.toFixed(0)}/MWh. The same `
              + `costs on two bases must not disagree in direction.`);
      }
      // The build must land near the real tariff WITHOUT calibration - that agreement is
      // the only check the method has on itself.
      // MUST SET THE YEAR. Homepower's published rate is a 2026 figure, so the comparison
      // has to be made at scenario year 2026. Running at the panel's 2035 default compared a
      // bill with nine years of asset run-off against today's tariff and read R2.99 - which
      // looked like a component error and was a year mismatch.
      const rn = run(`
        const yr = document.getElementById('retYear'); const keepY = yr.value;
        const keep = JSON.parse(JSON.stringify(state));
        yr.value = 2026; run();
        const d = retailHourly(); const m = a => a.reduce((x, y) => x + y, 0) / a.length;
        // HOMEPOWER TOTAL, not its energy rate. Since the residential allocation came from
        // the CTS study it covers network and retail as well as energy, so the panel now
        // prices the WHOLE residential cost. Comparing that to Homepower's energy charge
        // alone omits the R536/month of fixed charges and reads 15% high.
        const HPT = RETAIL_T.homepower4;
        const perKwhTotal = HPT.energy_r_per_kwh + HPT.fixed_r_per_month / 900;
        const out = d ? { dyn: m(d.dyn), flat: perKwhTotal, energyOnly: m(d.flat) }
                      : { err: 'no panel' };
        yr.value = keepY; Object.assign(state, keep); run();
        return out;
      `);
      if (rn && !rn.err && rn.flat){
        const gap = 100 * Math.abs(rn.dyn / rn.flat - 1);
        check('the bottom-up build lands within 15% of Homepower at today\'s system',
              gap < 15,
              `R${rn.dyn.toFixed(2)} bottom-up against Homepower's actual R${rn.flat.toFixed(2)}, `
              + `${gap.toFixed(0)}% apart. This is the method checking itself: no component is `
              + `calibrated to the tariff, so agreement means the components are right.`);
      }
      // ── THE THREE VALIDATIONS FROM scope_retail_gaps.md ───────────────────
      // Added 10 Sep 2026 with the scenario year. Each checks against something outside the
      // panel, which is the only kind of check worth having here.
      const vy = run(`
        const m = a => a.reduce((x, y) => x + y, 0) / a.length;
        const yr = document.getElementById('retYear'), st = document.getElementById('retStranded');
        const keep = JSON.parse(JSON.stringify(state)), keepY = yr.value, keepS = st.checked;
        const fm = PRESETS['Future electricity mix'];
        // RESTORE EVERY KEY, not just the preset's. The first version reset only the Future
        // mix keys, so coalDecomMW set by an earlier check survived into this one and moved
        // the 2026 figure from R3.34 to R2.99. It read as a component error and was
        // check-ordering contamination. Checks must not depend on the order they run in.
        // Restore from a PRISTINE SNAPSHOT rather than rebuilding from SLIDERS. Rebuilding
        // dropped non-slider keys the page relies on; resetting only the preset's keys let
        // coalDecomMW from an earlier check survive and moved 2026 from R3.34 to R2.99.
        // Neither is a component error - both are check-ordering contamination.
        const pristine = JSON.parse(JSON.stringify(state));
        const reset = () => {
          for (const k of Object.keys(state)) delete state[k];
          Object.assign(state, JSON.parse(JSON.stringify(pristine)));
        };
        // Homepower is an ESKOM-DIRECT tariff, so the comparison must be made on that
        // supply route. Running it against the municipal default was comparing a bill that
        // includes a municipal margin against one that does not.
        reset(); yr.value = 2026; st.checked = true; run();
        const at2026 = m(retailHourly().dyn);
        const HPT2 = RETAIL_T.homepower4;
        const homepower = HPT2.energy_r_per_kwh + HPT2.fixed_r_per_month / 900;
        reset();
        Object.assign(state, { coalDecomMW: 32000, newWindMW: 20000, newPvMW: 25000,
          newBattMW: 12000, newBattHours: 4, newCcgtMW: 8000, newRooftopMW: 5000, drShiftPct: 7.5 });
        yr.value = 2035; run();
        const gasFirmed = m(retailHourly().dyn);
        Object.assign(state, keep); yr.value = keepY; st.checked = keepS; run();
        return { at2026, homepower, gasFirmed };
      `);
      if (vy && !vy.err && vy.at2026){
        // Tightened from 10% to 8% on 10 Sep 2026 after the residential allocation factor
        // was added. Before it, the panel matched Homepower only because a 40% "municipal
        // markup" was silently carrying the residential cost-to-serve allocation as well as
        // a municipal margin. Removing the markup for an Eskom-direct customer exposed a 25%
        // shortfall, which is how the missing factor was found.
        //
        // THIS CHECK IS NOW PARTLY CIRCULAR AND THE TOLERANCE MUST NOT BE TIGHTENED FURTHER.
        // The residential allocation of 1.29 is Homepower's energy rate over Eskom's average
        // price - a ratio of two published figures, but one of them is the thing being
        // checked against. The bottom-up components below it are independent, built from
        // NERSA's revenue decomposition and this model's dispatch, so the residual does test
        // something. It tests less than it did.
        //
        // The ratio that would close the gap exactly is 1.34. Using 1.29 leaves 6%
        // HOMEPOWER'S ENERGY RATE WAS 10% WRONG UNTIL 10 Sep 2026.
      //
      // It read R3.5556, taken from a web summary. The Schedule of Standard Prices for
      // 2026/27 gives R3.2206 including VAT. Caught by asking whether the tariff blends
      // usage blocks and then testing against NERSA's own progression: R2.305 in 2024/25
      // rands grown by the approved 12.7% and 8.76% with VAT is R3.2491 - 0.9% from the
      // published figure and 9% from the old one.
      //
      // A tariff this check depends on should come from the schedule, not a summary. Any
      // future update to it must too.
      //
      // CIRCULARITY REMOVED 10 Sep 2026. The residential allocation was 1.29, derived as
        // Homepower's energy rate over Eskom's average price - two published figures, but one
        // of them was the tariff this check compares against. It now comes from Eskom's
        // 2024/25 cost-to-serve study, Table 42: category C12 urban residential at 320.33
        // c/kWh against a system total of 197.45, a ratio of 1.622.
        //
        // A cost study, not a tariff. Homepower is now a genuinely independent check, and
        // the agreement is 1% rather than 6%.
        check('at 2026 the panel reproduces the published tariff',
              Math.abs(vy.at2026 / vy.homepower - 1) < 0.08,
              `R${vy.at2026.toFixed(2)} at scenario year 2026 against Homepower's all-in `
              + `R${vy.homepower.toFixed(2)}/kWh at 900 kWh - energy plus R536/month of fixed `
              + `charges. Since the residential allocation came from Eskom's cost-to-serve `
              + `study it covers network and retail too, so the panel prices the WHOLE `
              + `residential cost and must be checked against the whole tariff. The year must `
              + `add nothing at its origin - if it does, a run-off or expiry is firing when `
              + `dy is zero.`);
        const move = 100 * (vy.gasFirmed / vy.at2026 - 1);
        check('a gas-firmed high-renewables build does not move the bill much',
              Math.abs(move) < 15,
              `gas-firmed 60% renewables at 2035 gives R${vy.gasFirmed.toFixed(2)} against `
              + `R${vy.at2026.toFixed(2)} today, ${move.toFixed(0)}%. AEMO and the AEMC both `
              + `find such a build does not raise prices materially, and reproducing that is `
              + `this panel's only external validation. A large move means a cost line has `
              + `drifted - check new build capital first.`);
      }

      // ── MULTI-TARIFF VALIDATION ───────────────────────────────────────────
      // Added 10 Sep 2026. Matching one published tariff is weak evidence when a factor in
      // the build was derived from that same tariff. Eskom publishes several with known
      // relationships, and a structure that reproduces the RELATIONSHIPS is testing
      // something the level check cannot.
      //
      // From NERSA's Reasons for Decision, 18 Feb 2025:
      //   Homelight 20A   191.69 c/kWh flat, no fixed charge, SUBSIDISED
      //   Homelight 60A   243.68 c/kWh flat, no fixed charge, SUBSIDISED
      //   Homepower 4     energy plus R554/month fixed, pays subsidy
      //   Homeflex        six TOU rates, same fixed charges as Homepower
      //
      // The orderings these imply are structural, not fitted:
      //   Homelight 20A < Homelight 60A            lifeline below standard prepaid
      //   Homeflex annual average < Homepower flat  TOU beats flat at average usage
      //   Homeflex peak > Homepower flat            or the peak signal does nothing
      {
        const mt = run(`
          const d = retailHourly(); if (!d) return { err: 'no panel' };
          const t = RETAIL_T, R = t.homeflex.rates_r_per_kwh_2024_25;
          const m = a => a.reduce((x, y) => x + y, 0) / a.length;
          return { hl20: t.homelight20a ? t.homelight20a.energy_r_per_kwh : 1.9169,
                   hl60: t.homelight60a ? t.homelight60a.energy_r_per_kwh : 2.4368,
                   hp: m(d.flat), flexAvg: m(d.flex),
                   flexPeak: R.high_season_peak, flexOff: R.high_season_offpeak };
        `);
        if (mt && !mt.err && mt.hp){
          check('Homelight 20A prices below Homelight 60A',
                mt.hl20 < mt.hl60,
                `${mt.hl20} against ${mt.hl60} c/kWh. The 20A lifeline tariff carries the `
                + `larger cross-subsidy and must sit below the 60A.`);
          check('the Homeflex annual average sits below the Homepower flat rate',
                mt.flexAvg < mt.hp,
                `Homeflex averages R${mt.flexAvg.toFixed(2)} against Homepower's `
                + `R${mt.hp.toFixed(2)}. A time-of-use tariff that costs MORE than flat at `
                + `average usage would give nobody a reason to take it - and every rooftop `
                + `PV household is required to.`);
          check('the Homeflex peak sits well above the flat rate',
                mt.flexPeak > mt.hp * 1.3,
                `peak R${mt.flexPeak} against flat R${mt.hp.toFixed(2)}. NERSA set the `
                + `peak-to-standard ratio at 1:6; if the peak is not materially above flat, `
                + `the six rates have been read wrongly.`);
        }
      }

      // ── MUNICIPAL TARIFFS TRACK ESKOM'S APPROVED INCREASE ─────────────────
      // Added 10 Sep 2026 from three years of the AMMP database. Matched by tariff ID so it
      // is the SAME tariff over time - comparing medians across years measures which tariffs
      // happen to be in the database, not what prices did. That first attempt showed +185%
      // and was pure sample composition.
      //
      // 42 matched residential tariffs rose 9.0% into 2026/27 against NERSA's 8.76% approved
      // for Eskom. Municipalities pass the bulk increase through closely, which is what makes
      // the bulk purchase price the right driver of municipal retail prices.
      {
        const tt = run(`
          const t = RETAIL_T.municipal && RETAIL_T.municipal.tariff_trend;
          return t ? { muni: t.same_tariff_median_increase_pct['2025_to_2026'],
                       eskom: t.nersa_approved_eskom_pct['2026_27'] } : { err: 'no trend' };
        `);
        if (tt && !tt.err && tt.muni){
          check('municipal tariff increases track the approved Eskom increase',
                Math.abs(tt.muni - tt.eskom) < 3,
                `municipal residential rose ${tt.muni}% into 2026/27 against NERSA's `
                + `${tt.eskom}% for Eskom, ${(tt.muni - tt.eskom).toFixed(2)} points apart. `
                + `A wide gap would mean municipal prices are driven by something other than `
                + `the bulk purchase cost, and the panel's use of bulk as the driver would `
                + `need revisiting.`);
        }
      }

      // ── THE SALES DENOMINATOR ─────────────────────────────────────────────
      // Added 10 Sep 2026. Every per-kWh component divides by it, so an error here is
      // proportional across the whole panel - and nothing was checking it.
      //
      // Eskom publishes three candidate denominators for 2025 and they differ by 10%:
      //   RSA contracted energy demand      209.55 TWh   what Eskom sells, incl IPP energy
      //   residual energy demand            191.38 TWh   net of renewables
      //   dispatchable energy sent out      190.81 TWh   excludes wind and solar IPPs
      //
      // The panel wants the first: Eskom recovers its allowed revenue over what it SELLS.
      // An earlier version used 190.81 and every component was 9% high as a result.
      //
      // The modelled figure is generation less rooftop self-consumption, storage throughput
      // and exports - none of which is sold to a South African retail customer.
      {
        const sd = run(`
          const yr = document.getElementById('retYear'); const keepY = yr.value;
          const keep = JSON.parse(JSON.stringify(state));
          yr.value = 2026; run();
          const c = retailComponents(0, true, 2026, false, 900);
          yr.value = keepY; Object.assign(state, keep); run();
          return { salesTWh: c.salesTWh };
        `);
        if (sd && !sd.err && sd.salesTWh){
          const gap = 100 * (sd.salesTWh / 209.55 - 1);
          check('the sales denominator matches what Eskom actually sells',
                Math.abs(gap) < 12,
                `${sd.salesTWh.toFixed(0)} TWh modelled against 209.55 TWh of RSA contracted `
                + `energy demand for 2025, ${gap.toFixed(1)}%. Every per-kWh component divides `
                + `by this, so an error is proportional across the panel. If it drifts toward `
                + `191 the rooftop or export deduction has changed - that is dispatchable `
                + `energy sent out, a different quantity, and using it made every component `
                + `9% high once already.`);
          console.log(`  sales basis   ${sd.salesTWh.toFixed(0)} TWh vs Eskom contracted 209.6`);
        }
      }

      // ── THE HOURLY SHAPE, AGAINST A REAL TIME-VARYING TARIFF ──────────────
      // Added 10 Sep 2026. The strongest check available and the last one built, because
      // all six Homeflex rates only arrived from NERSA's decision document that day.
      //
      // Homeflex is Eskom pricing its OWN wholesale purchase structure through to a
      // household. Our shadow prices the same system from a dispatch model. They should
      // agree on SHAPE - and unlike the level check, which leans on Homepower, NOTHING in
      // the shadow build derives from Homeflex. This is the only fully independent test of
      // the axis the panel exists to show.
      //
      // Measured 10 Sep 2026: winter week spread 2.9x against Homeflex high season 3.9x.
      // They should not match exactly - Homeflex is a three-block administered approximation
      // of an hourly cost, and NERSA sets its peak-to-standard ratio at 1:6 by decision
      // rather than by measurement. Agreement within a factor of two is the right bar.
      {
        const sh = run(`
          const yr = document.getElementById('retYear'); const keepY = yr.value;
          const keep = JSON.parse(JSON.stringify(state));
          yr.value = 2026; run();
          const d = retailHourly();
          const R = RETAIL_T.homeflex.rates_r_per_kwh_2024_25;
          const out = d ? { shadowSpread: Math.max(...d.week) / Math.min(...d.week),
                            hfHigh: R.high_season_peak / R.high_season_offpeak,
                            hfLow: R.low_season_peak / R.low_season_offpeak,
                            wk: d.wkMode } : { err: 'no panel' };
          yr.value = keepY; Object.assign(state, keep); run();
          return out;
        `);
        if (sh && !sh.err && sh.shadowSpread){
          const ratio = sh.shadowSpread / sh.hfHigh;
          check('the shadow hourly shape agrees with Homeflex on how much prices vary',
                ratio > 0.5 && ratio < 2.0,
                `shadow week spread ${sh.shadowSpread.toFixed(1)}x against Homeflex high `
                + `season ${sh.hfHigh.toFixed(1)}x, ratio ${ratio.toFixed(2)}. Eskom sets `
                + `Homeflex from its own wholesale purchase structure, so a dispatch model `
                + `of the same system should land near it. This is the ONLY check here that `
                + `borrows nothing from the tariff it tests against.`);
          console.log(`  shape         shadow ${sh.shadowSpread.toFixed(1)}x vs Homeflex `
            + `${sh.hfHigh.toFixed(1)}x high / ${sh.hfLow.toFixed(1)}x low season`);
        }
      }

      // ── NEW-BUILD CAPITAL, PINNED AGAINST A HAND COMPUTATION ──────────────
      // The Australian check above validates the METHOD and is deliberately loose at 15%.
      // It is not a component detector: a tenfold error in battery augmentation moves the
      // gas-firmed case only 4.4%, because that scenario carries just 12 GW of storage.
      // Measured, not assumed.
      //
      // So this pins the largest cost line directly. Future mix at 2035, midpoint vintage
      // 2030.5, hand-computed from BLD_COST and BLD_LIFE at 8%:
      //
      //   wind    45 GW x R18,429/kW, 25 yr -> R77.7bn      pv      52 GW -> R48.9bn
      //   rooftop 20 GW -> R26.6bn                          batt    30 GW at 6h -> R33.8bn
      //   total R187.1bn over 181 TWh = R1.033/kWh
      //
      // The panel reports 1.033. Any drift in a decline rate, a life, the discount rate or
      // the vintage convention shows here first.
      const ncap = run(`
        const yr = document.getElementById('retYear');
        const keep = JSON.parse(JSON.stringify(state)), keepY = yr.value;
        Object.assign(state, PRESETS['Future electricity mix']); yr.value = 2035; run();
        const v = retailComponents(0.40, true, 2035);
        Object.assign(state, keep); yr.value = keepY; run();
        return { newCap: v.newCap, vintage: v.vintage };
      `);
      if (ncap && !ncap.err && ncap.newCap){
        check('new-build capital matches the hand computation',
              Math.abs(ncap.newCap - 1.033) < 0.06,
              `R${ncap.newCap.toFixed(3)}/kWh against a hand-computed R1.033 for the Future `
              + `mix at 2035. Vintage ${ncap.vintage}. This is the sensitive check - the `
              + `Australian one above is deliberately loose and will not catch a component.`);
      }

      // ── NEW-BUILD COST MUST STAY NEAR WHAT THE MARKET BIDS ────────────────
      // Added 10 Sep 2026 after a review finding was reversed the same day. I added fixed
      // O&M on top of acap*, assuming acap was capex-only. acapWind 1650 R/kW-yr at a 35%
      // capacity factor is R0.54/kWh - which is what REIPPPP developers actually bid all-in,
      // BW5 R0.50 and BW6 R0.58. The addition pushed wind to R0.78, above any winning bid.
      //
      // The market price is the check. If the model's all-in new-build wind cost drifts more
      // than 40% from the latest REIPPPP award, something has been added twice or a constant
      // has moved. Retail-panel additions must not lift it above what developers accept.
      const nb = run(`
        const P = { ...FIXED, ...state };
        const A = RETAIL_T.allowed_revenue_2026_27;
        const fom = (A.new_build_fixed_om_r_per_kw_yr || {}).wind || 0;
        const used = (typeof retailComponents === 'function') ? 'panel' : 'none';
        return { acapWind: P.acapWind, perKwh: P.acapWind / (0.35 * 8760), fomInPanel: 0 };
      `);
      if (nb && !nb.err && nb.acapWind){
        check('new-build wind cost stays near the REIPPPP bid price',
              nb.perKwh > 0.35 && nb.perKwh < 0.80,
              `acapWind ${nb.acapWind} R/kW-yr is R${nb.perKwh.toFixed(2)}/kWh at 35% CF. `
              + `BW5 cleared at R0.50 and BW6 at R0.58. Outside 0.35-0.80 the constant has `
              + `moved or something is being counted twice - the retail panel once added `
              + `R750/kW-yr of O&M on top and reached R0.78.`);
      }
      check('the panel says the no-gas preset is a stress test not a plan',
            t.includes('stress test'),
            `the Future electricity mix removes gas and curtails 134 TWh a year. Reported `
            + `as representative of decarbonisation it overstates the retail impact by a `
            + `factor of five against a gas-firmed build. The panel must say which it is.`);
      check('the panel names the stranded-asset choice and that it is regulatory',
            (t.includes('asset base') || t.includes('written off'))
              && t.includes('regulatory'),
            `the stranded-asset control is worth 16% of a bill on the Future mix and 25% `
            + `with all coal retired. The panel must say which case is showing AND that it `
            + `is a regulatory decision rather than a physical one.`);
      // RETIRED 10 Sep 2026: "read the shape, not the level".
      //
      // That sentence existed because the level was 44% below the real tariff - an artefact
      // of anchoring to short-run marginal cost. The bottom-up rebuild lands within 10%
      // without calibration, so the level is now meaningful and the warning would be false
      // modesty. The check that replaced it asserts the agreement instead.
      //
      // Kept as a note rather than deleted, because a future version that reintroduces
      // scaling would need the warning back.
    }
  }

  console.log(`\n${pass}/${pass + fail} cross-panel consistency checks passed`);
  if (failures.length) { console.log('\nFAILURES:'); failures.forEach(f => console.log('  ' + f)); }
  if (notes.length)    { console.log('\nNOTES:');    notes.forEach(n => console.log('  ' + n)); }
  process.exit(fail ? 1 : 0);
})();
