#!/usr/bin/env node
/**
 * validate_external.js — comparison against OTHER PUBLISHED MODELS.
 *
 * validate_benchmarks.js checks the model against Eskom's published OUTTURN:
 * what the system actually did. This checks something different and weaker but
 * still worth knowing — whether GridTwin lands in the same territory as the
 * established South African planning studies when asked the same question.
 *
 * WHAT THIS IS NOT. It is not validation. Nobody has run GridTwin and PLEXOS on
 * identical inputs and compared line by line; that would require the commercial
 * model and its full assumption set. What this does is bracket: given the same
 * installed capacity, does GridTwin produce an energy mix in the region the
 * published studies report? A model that lands far outside has a problem worth
 * finding. A model that lands inside has not been proved right.
 *
 * WHY THE BANDS ARE WIDE. The published studies each carry their own demand
 * forecast, EAF assumption and retirement schedule, none of which are fully
 * reproducible from the published figures. Demand alone moves coal share by
 * several points. A tight band here would be false precision — it would fail on
 * assumption differences rather than on model error. The bands are set to catch
 * a model that is structurally wrong, not one that disagrees at the margin.
 *
 * THE RULE, same as validate_benchmarks: a gap with a documented reason is
 * fine; a gap without one is a finding.
 *
 *   node validate_external.js [root]
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = process.argv[2] || '.';
let pass = 0, fail = 0;
const rows = [], failures = [], notes = [];

// ── the comparison set ──────────────────────────────────────────────────────
// Each entry states the published result, the scenario that reproduces the
// question it answered, the band, and WHY the band is that wide.
const EXTERNAL = {

  csir2030CoalShare: {
    source: 'CSIR least-cost study (PLEXOS), extended IRP analysis',
    published: 55,           // % of generated energy from coal by 2030
    band: 6,                 // percentage points - tightened once demand and
                             // EAF were sourced; see why, below
    scenario: {              // CSIR low end of its own 2030 capacity range
      newPvMW: 15000 - 3271, // to 15 GW total utility solar
      newWindMW: 20000 - 4612, // to 20 GW total wind
      demandGrowthPct: 30,   // 285 TWh by 2030 - CSIR Table 1, Least-cost scenario
      coalEAFPct: 65,        // CSIR Table 1: 65% EAF in 2030
    },
    why: 'CSIR reports coal at roughly 55% of energy by 2030 in its least-cost '
       + 'case, with solar 15-40 GW and wind 20-45 GW installed. This runs '
       + 'GridTwin at the LOW end of that capacity range. The band is wide '
       + 'because CSIR used its own demand forecast and retirement schedule, '
       + 'neither fully recoverable from the published figures. '
       + 'DEMAND AND EAF ARE SET TO CSIR\u2019S OWN PUBLISHED FIGURES, not '
       + 'today\u2019s: 285 TWh by 2030 and 65% EAF, both from Table 1 of the '
       + 'report. That matters more than anything else here \u2014 measured '
       + 'sensitivity is 0.45 points of coal share per 1% of demand, so running '
       + 'this at present-day demand (~219 TWh) shows an 8-point gap that is '
       + 'entirely an artefact of the comparison. At CSIR\u2019s assumptions the '
       + 'gap is under 2 points.',
  },

  csir2030ReShare: {
    source: 'CSIR least-cost study — renewable share implied by the coal figure',
    published: 40,           // % renewable, implied complement
    band: 8,
    scenario: {
      newPvMW: 15000 - 3271,
      newWindMW: 20000 - 4612,
      demandGrowthPct: 30,   // 285 TWh by 2030 - CSIR Table 1, Least-cost scenario
      coalEAFPct: 65,        // CSIR Table 1: 65% EAF in 2030
    },
    why: 'The complement of the coal figure, less nuclear, hydro and imports. '
       + 'Stated separately because coal share and RE share can both drift '
       + 'while their sum stays right — the same failure mode that hid the '
       + 'wind nameplate error from the national total.',
  },

};

function check(name, ok, detail) {
  if (ok) { pass++; } else { fail++; failures.push(`  ${name}  —  ${detail}`); }
}

(async () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const dom = new JSDOM(html, {
    runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true,
    url: 'file://' + path.resolve(ROOT) + '/index.html',
    beforeParse(w) {
      w.HTMLCanvasElement.prototype.getContext = () =>
        new Proxy({}, { get: () => () => ({ addColorStop(){}, data: [], width: 0, measureText: () => ({ width: 10 }) }) });
      const ch = () => new Proxy(function () { return ch(); }, { get: () => ch() });
      w.L = new Proxy({}, { get() { return function () { return ch(); }; } });
      w.onerror = () => {};
      Object.defineProperty(w.history, 'replaceState', { value: () => {}, writable: true });
      w.URL.createObjectURL = () => 'blob:x';
      w.Worker = function () { this.postMessage = () => {}; };
      w.fetch = async (u) => {
        try {
          const cl = String(u).split('?')[0].replace(/^file:.*?\/(?=nodal\/|profiles|config)/, '');
          const t = fs.readFileSync(path.join(path.resolve(ROOT), cl), 'utf8');
          return { ok: true, json: async () => JSON.parse(t), text: async () => t };
        } catch (e) { return { ok: false, json: async () => { throw e; }, text: async () => { throw e; } }; }
      };
    },
  });

  await new Promise(r => setTimeout(r, 4500));
  const w = dom.window;

  const run = (overrides) => {
    const s = w.document.createElement('script');
    s.textContent = `
      { const r = simulate({ ...state, ...${JSON.stringify(overrides || {})} }, PROFILES);
        const dom_ = r.E.coal + r.E.nuclear + r.E.hydro + r.E.wind + r.E.pv
                   + r.E.csp + (r.E.hybrid || 0) + r.E.rooftop + r.E.ccgt
                   + r.E.diesel + r.E.ps + r.E.batt;
        window.__x = JSON.stringify({
          coalShare: 100 * r.E.coal / dom_,
          reShare: 100 * (r.E.wind + r.E.pv + r.E.csp + (r.E.hybrid || 0)
                          + r.E.rooftop + r.E.hydro) / dom_,
          co2: r.co2, cost: r.avgCost });
      }`;
    w.document.body.appendChild(s);
    return JSON.parse(w.__x);
  };

  // ── CSIR coal and RE share ────────────────────────────────────────────────
  const csir = run(EXTERNAL.csir2030CoalShare.scenario);

  for (const [key, metric] of [['csir2030CoalShare', csir.coalShare],
                               ['csir2030ReShare',   csir.reShare]]) {
    const e = EXTERNAL[key];
    const gap = metric - e.published;
    const ok = Math.abs(gap) <= e.band;
    rows.push({ name: key, model: metric, pub: e.published, gap, band: e.band, ok });
    check(`${key} within ${e.band} points of ${e.source}`, ok,
      `model ${metric.toFixed(1)}% vs published ${e.published}% (gap ${gap.toFixed(1)} pts, band ±${e.band})`);
  }

  // ── WHY THERE IS NO COST COMPARISON HERE ──────────────────────────────────
  // PyPSA-ZA reports a 95% CO2 reduction costing about 20% more than the
  // unconstrained case. That looked like an obvious third check, and it is not
  // one this model can make.
  //
  // PyPSA-ZA CO-OPTIMISES investment and operation: it chooses the cheapest mix
  // and compares two OPTIMISED builds, both carrying capex. GridTwin dispatches
  // a build the user specifies. Comparing today's system (no new capex) against
  // a hand-set high-renewables build (127 GW of capex) produced +90%, which is
  // not a cost result at all - it is the capex of a build programme measured
  // against a system that has not built one.
  //
  // Widening the band until that passed would be exactly the failure this
  // harness warns about: a wide band with a vague reason. The comparison is
  // left out until the build optimiser can be run to a CO2 constraint and
  // compared like for like. Recorded here so the next person does not re-add it.
  notes.push('Run at CSIR\u2019s published assumptions: 285 TWh demand and 65% EAF '
    + 'by 2030, both from Table 1 of the report (their Least-cost scenario; the '
    + 'IRP 2019 scenario used 306 TWh). Measured sensitivity is 0.45 points of coal '
    + 'share per 1% of demand, so this assumption dominates the comparison.');
  notes.push('None of these are validation. They bracket: a model landing far '
    + 'outside published territory has a problem worth finding; one landing '
    + 'inside has not been proved right.');
  notes.push('No cost comparison against PyPSA-ZA: it co-optimises investment '
    + 'and operation, so its +20% figure compares two optimised builds. '
    + 'GridTwin dispatches a specified build, which is not the same question. '
    + 'See the comment above for what would make it comparable.');

  // ── report ────────────────────────────────────────────────────────────────
  console.log('\nCOMPARISON AGAINST PUBLISHED SOUTH AFRICAN STUDIES');
  console.log('  metric                    model   published      gap     band');
  rows.forEach(r => {
    console.log('  ' + r.name.padEnd(24)
      + (r.model.toFixed(1) + '%').padStart(8)
      + (r.pub + '%').padStart(12)
      + ((r.gap >= 0 ? '+' : '') + r.gap.toFixed(1)).padStart(9)
      + ('±' + r.band).padStart(9)
      + (r.ok ? '' : '   <-- OUTSIDE'));
  });

  console.log(`\n${pass}/${pass + fail} external comparison checks passed`);
  if (failures.length) { console.log('\nFAILURES:'); failures.forEach(f => console.log(f)); }
  if (notes.length) { console.log('\nNOTES:'); notes.forEach(n => console.log('  ' + n)); }
  process.exit(fail ? 1 : 0);
})();
