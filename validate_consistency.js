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

  console.log(`\n${pass}/${pass + fail} cross-panel consistency checks passed`);
  if (failures.length) { console.log('\nFAILURES:'); failures.forEach(f => console.log('  ' + f)); }
  if (notes.length)    { console.log('\nNOTES:');    notes.forEach(n => console.log('  ' + n)); }
  process.exit(fail ? 1 : 0);
})();
