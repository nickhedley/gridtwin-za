// The engine against 2026's metered curtailment (message 686 (d), 687 (d), 689 (4); measurement only, no rule changed).
// Cases, January-August (model hours 0-5831) and March-August (1416-5831):
//   A   Today 2026 (scenario year 2026, the defaults: exports 745 MW) on the page's metered 2025 weather (profiles.json)
//   A1  as A with exports at the pre-Mozal 1,705 MW (the model holds one export level all year)
//   B   as A with ESK19679's 2026 wind for January-August (LOCAL file, never committed); solar stays 2025's metered profile, since
//       2026's solar meter is already curtailed and cannot stand for the resource
//   R   the 2025 replay ('2025, as modelled', as run2025AsModelled builds it), and R's settings moved one group at a time to Today 2026's
// Reported: utility PV curtailed (its potential output each hour, as the engine blends it, less stack.pv), total curtailed, by month, the mean PV curtailed at 11:00-14:00, coal at midday over its daily high, and per MW of utility PV.
// From harness/: NODE_PATH=node_modules node pathway/wx/curtail2026.js <out.json> [<local 2026 wind json>]
const fs = require('fs'), path = require('path'), { JSDOM } = require('jsdom');
const ROOT = 'testroot', OUT = process.argv[2], W26 = process.argv[3] || null;
(async () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, url: 'file://' + path.resolve(ROOT) + '/index.html',
    beforeParse(w){ w.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: () => () => ({ addColorStop(){}, data: [], width: 0, measureText: () => ({ width: 10 }) }) });
      const ch = () => new Proxy(function(){ return ch(); }, { get: () => ch() }); w.L = new Proxy({}, { get(){ return function(){ return ch(); }; } });
      w.onerror = () => {}; Object.defineProperty(w.history, 'replaceState', { value: () => {}, writable: true }); w.URL.createObjectURL = () => 'blob:x'; w.Worker = function(){ this.postMessage = () => {}; };
      w.fetch = async (u) => { try { const cl = String(u).split('?')[0].replace(/^file:.*?\/(?=nodal\/|profiles|config|public_data|stored)/, ''); const t = fs.readFileSync(path.join(path.resolve(ROOT), cl), 'utf8'); return { ok: true, json: async () => JSON.parse(t), text: async () => t }; } catch (e) { return { ok: false, json: async () => { throw e; }, text: async () => { throw e; } }; } }; } });
  await new Promise(r => setTimeout(r, 6000)); const w = dom.window;
  await w.eval('loadWeatherYears()');
  const wind26 = W26 ? JSON.parse(fs.readFileSync(W26, 'utf8')).pu : null;
  const res = JSON.parse(w.eval(`(function(){
    const MS = [0,31,59,90,120,151,181,212,243].map(d => d * 24);
    const metric = (x, p) => {
      const pvC = new Float64Array(HOURS); let tot = 0;
      // Utility PV's potential each hour, as the engine blends it (existing on the profile, new on its tracking twin when tracking is on;
      // the metered profile carries no own twin, so existing solar's share is 0), less what it delivered.
      const E0 = p.pvUtilityMW || 0, N0 = p.newPvMW || 0, trk = ((p.bldPvTracking ?? 0) | 0) > 0 && N0 > 0, prof = p.__prof || PROFILES, T = trk ? solarTrkOf(prof.solar) : null;
      for (let h = 0; h < HOURS; h++){ const pot = E0 * prof.solar[h] + N0 * (T ? T[h] : prof.solar[h]); pvC[h] = Math.max(0, pot - x.stack.pv[h]); }
      const sum = (a, h0, h1) => { let s = 0; for (let h = h0; h < h1; h++) s += a[h]; return s; };
      const byMonth = MS.slice(0, 8).map((m, i) => +(sum(pvC, m, MS[i + 1]) / 1e3).toFixed(1));
      let mid = 0, nm = 0; for (let h = 1416; h < 5832; h++){ const hh = h % 24; if (hh >= 11 && hh < 14){ mid += pvC[h]; nm++; } }
      const ratios = []; for (let d = 59; d < 243; d++){ let mx = 0, m = 0; for (let k = 0; k < 24; k++){ const c = x.stack.coal[d * 24 + k]; if (c > mx) mx = c; if (k >= 11 && k < 14) m += c / 3; } if (mx > 0) ratios.push(m / mx); }
      ratios.sort((a, b) => a - b);
      const pvMW = (p.pvUtilityMW || 0) + (p.newPvMW || 0);
      return { pvCurtJanAugTWh: sum(pvC, 0, 5832) / 1e6, pvCurtMarAugTWh: sum(pvC, 1416, 5832) / 1e6, allCurtJanAugTWh: sum(x.curtailMW, 0, 5832) / 1e6,
        pvCurtByMonthGWh: byMonth, pvCurtByHourMarAugMW: (() => { const s = new Float64Array(24), n = new Float64Array(24); for (let h = 1416; h < 5832; h++){ s[h % 24] += pvC[h]; n[h % 24]++; } return Array.from(s, (v, i) => Math.round(v / n[i])); })(), pvCurtMid11to14MW: mid / nm, coalMiddayOverDailyHigh_median: ratios[Math.floor(ratios.length / 2)],
        utilityPvMW: pvMW, pvCurtJanAugMWhPerMW: sum(pvC, 0, 5832) / pvMW, pvTWhJanAug: sum(x.stack.pv, 0, 5832) / 1e6, exportsMW: p.exportsMW ?? FIXED.exportsMW,
        annualAllCurtTWh: x.E.curtailed / 1e6, coalTWhJanAug: sum(x.stack.coal, 0, 5832) / 1e6,
        // March-August 11:00-13:59 means, MW, for the comparison with the meters
        midday: (() => { const o = {}, add = (k, a) => { if (!a) return; let s = 0, n = 0; for (let h = 1416; h < 5832; h++){ const hh = h % 24; if (hh >= 11 && hh < 14){ s += a[h]; n++; } } o[k] = Math.round(s / n); };
          add('loadS', x.loadS); add('coal', x.stack.coal); add('nuclear', x.stack.nuclear); add('imports', x.stack.imports); add('hydro', x.stack.hydro); add('psGen', x.stack.ps);
          add('psPump', x.chargePsMW); add('battCharge', x.chargeBattMW); add('wind', x.stack.wind); add('pv', x.stack.pv); add('csp', x.stack.csp); add('curtail', x.curtailMW);
          add('battGen', x.stack.batt); add('diesel', x.stack.diesel); add('pvPotential', (() => { const a = new Float64Array(HOURS); for (let h = 0; h < HOURS; h++) a[h] = x.stack.pv[h] + pvC[h]; return a; })()); return o; })() };
    };
    const out = {};
    applyState(PRESETS['Today 2026']); const T = { ...FIXED, ...state };
    out.A = metric(simulate({ ...state }, PROFILES), T);
    out.A1 = metric(simulate({ ...state, exportsMW: 1705 }, PROFILES), { ...T, exportsMW: 1705 });
    // Levers, by existing settings only (no rule changed): demand lowered so the engine's midday load (less pumping) meets 2026's metered
    // 22.4 GW; pumping power halved, a rough proxy for less midday pumping (it also cuts pumping at other hours); both.
    const dg = (state.demandGrowthPct ?? 0) - 4.3;
    out.A_dem = metric(simulate({ ...state, demandGrowthPct: dg }, PROFILES), T);
    out.A_ps = metric(simulate({ ...state, psPowerMW: 1362 }, PROFILES), T);
    out.A_both = metric(simulate({ ...state, demandGrowthPct: dg, psPowerMW: 1362 }, PROFILES), T);
    // Message 690 on Today 2026: (a) no flat congestion curtailment; (b) the flat 1.3%, as A; (c) the same energy by technology in its
    // recorded hours; (d) (a) with pumping from a surplus at 09:00-16:59 capped at 2026's metered midday mean (469 MW). And by hour of day.
    out.c690_a = metric(simulate({ ...state, congestionCurtailOn: false }, PROFILES), T);
    out.c690_c = metric(simulate({ ...state, congestionShape: 'tech' }, PROFILES), T);
    out.c690_d = metric(simulate({ ...state, congestionCurtailOn: false, psDayPumpMaxMW: 469 }, PROFILES), T);
    out.c690_d_dem = metric(simulate({ ...state, congestionCurtailOn: false, psDayPumpMaxMW: 469, demandGrowthPct: dg }, PROFILES), T);
    const W26 = ${wind26 ? JSON.stringify(wind26) : 'null'};
    if (W26){ const wnd = Float64Array.from(PROFILES.wind); for (let h = 0; h < W26.length; h++) wnd[h] = W26[h];
      out.B = metric(simulate({ ...state }, { ...PROFILES, wind: wnd }), { ...T, __prof: { ...PROFILES, wind: wnd } }); }
    // The 2025 replay, then its settings moved to Today 2026's one group at a time (cumulative).
    const o = PRESETS['2025, as modelled'], s = {};
    SLIDERS.forEach(x => { if (x.grp || !x.id) return; s[x.id] = (x.id in o) ? o[x.id] : (x.toggle ? (x.def ? 1 : 0) : x.def); });
    for (const k of PRESET_NON_SLIDER_KEYS) s[k] = (k in o) ? o[k] : FIXED[k];
    out.R = metric(simulate(s, PROFILES), { ...FIXED, ...s });
    const diff = Object.keys(T).filter(k => k in s && JSON.stringify(s[k]) !== JSON.stringify(T[k]));
    out.diffKeys = diff.map(k => [k, s[k], T[k]]);
    const groups = [['exports', k => /^export/.test(k)], ['demand year and growth', k => /^demand/.test(k)], ['solar and rooftop', k => /pv|rooftop|Pv|Rooftop/.test(k)],
      ['wind', k => /wind|Wind/.test(k)], ['coal', k => /coal|Coal/.test(k)], ['scenario year', k => k === 'scenarioYear'], ['the rest', k => true]];
    let cur = { ...s }; const used = new Set(); out.steps = [];
    for (const [name, f] of groups){ const ks = diff.filter(k => !used.has(k) && f(k)); if (!ks.length) continue; ks.forEach(k => { cur[k] = T[k]; used.add(k); });
      out.steps.push({ group: name, keys: ks, m: metric(simulate({ ...cur }, PROFILES), { ...FIXED, ...cur }) }); }
    return JSON.stringify(out); })()`));
  fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
  const f = (n, m) => console.log(n.padEnd(34), 'PV curtailed Jan-Aug %s TWh (Mar-Aug %s), all VRE %s; at 11-14h Mar-Aug %s MW; per MW %s MWh; coal midday/daily high %s; exports %s; months %s'
    .replace(/%s/g, () => '%s').split('%s').map((s, i, a) => s + (i < a.length - 1 ? [m.pvCurtJanAugTWh.toFixed(3), m.pvCurtMarAugTWh.toFixed(3), m.allCurtJanAugTWh.toFixed(3), m.pvCurtMid11to14MW.toFixed(0), m.pvCurtJanAugMWhPerMW.toFixed(1), m.coalMiddayOverDailyHigh_median.toFixed(3), m.exportsMW, m.pvCurtByMonthGWh.join('/')][i] : '')).join(''));
  for (const k of ['A', 'A1', 'B', 'R', 'A_dem', 'A_ps', 'A_both', 'c690_a', 'c690_c', 'c690_d', 'c690_d_dem']) if (res[k]) f(k, res[k]);
  for (const k of ['A', 'c690_a', 'c690_c', 'c690_d', 'c690_d_dem']) if (res[k]) console.log(k, 'PV curtailed by hour, Mar-Aug mean MW', res[k].pvCurtByHourMarAugMW.join(' '));
  for (const st of res.steps) f('R + ' + st.group, st.m);
  for (const k of ['A', 'A1', 'B', 'R', 'A_dem', 'A_ps', 'A_both']) if (res[k]) console.log(k, 'midday Mar-Aug 11-14h MW', JSON.stringify(res[k].midday));
  console.log('keys moved from R to Today 2026:', JSON.stringify(res.diffKeys).slice(0, 1500));
  process.exit(0);
})();
