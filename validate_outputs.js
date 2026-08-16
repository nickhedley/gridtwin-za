/**
 * GridTwin ZA — output validation harness
 *
 * Checks the model's outputs against published, citable benchmarks rather than
 * against itself. Run after any change that could move the numbers:
 *
 *     node validate_outputs.js
 *
 * Each check states its SOURCE and the TOLERANCE it allows, so a failure tells
 * you which real-world figure the model has drifted away from. Tolerances are
 * deliberately wide where definitions differ between sources (see notes on the
 * generation-mix checks) and tight where the physics is unambiguous.
 *
 * A check that fails is not automatically a bug — it may mean a benchmark has
 * been updated. But it should always be explained, never ignored.
 */
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

// Model constants read straight out of index.html at MODULE scope, so any check
// can compare against what the model actually uses. Added 16 Aug 2026 after the
// rooftop capacity-factor check was found measuring against a hardcoded 9,100 MW
// that no longer matched FIXED.rooftopMW - a validator drifting from its own model
// is worse than no validator, because it reports green while checking nothing.
const ROOT_DIR = process.argv[2] || '.';
const INDEX_SRC = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
function readFixed(name, fallback){
  const m = INDEX_SRC.match(new RegExp('\\b' + name + '\\s*:\\s*([0-9.]+)'));
  return m ? parseFloat(m[1]) : fallback;
}

const ROOT = path.resolve('testroot');
const results = [];

function check(name, actual, expected, tol, source, unit = '') {
  const pass = Math.abs(actual - expected) <= tol;
  results.push({ name, actual, expected, tol, pass, source, unit });
}
function checkRange(name, actual, lo, hi, source, unit = '') {
  const pass = actual >= lo && actual <= hi;
  results.push({ name, actual, expected: `${lo}–${hi}`, tol: null, pass, source, unit });
}

function boot() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const dom = new JSDOM(html, {
    runScripts: 'dangerously', resources: 'usable',
    url: 'file://' + ROOT + '/index.html', pretendToBeVisual: true,
    beforeParse(w) {
      w.HTMLCanvasElement.prototype.getContext = () => ({
        clearRect(){},fillRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},fill(){},
        closePath(){},arc(){},save(){},restore(){},measureText(){return{width:0}},fillText(){},
        createLinearGradient(){return{addColorStop(){}}},setTransform(){},createPattern(){return null;},
        strokeRect(){},translate(){},scale(){},rotate(){},setLineDash(){},strokeText(){},
        getImageData(){return{data:[]}},transform(){},drawImage(){},putImageData(){},clip(){},
        quadraticCurveTo(){},bezierCurveTo(){},rect(){},
      });
      const chain = () => new Proxy(function(){ return chain(); }, { get: () => chain() });
      w.L = new Proxy({}, { get(t, p) {
        if (p === 'map') return () => ({ setView: chain, on: chain, invalidateSize: chain,
          addLayer: chain, removeLayer: chain, getContainer: () => ({ style: {} }),
          distance: () => 999, fitBounds: chain });
        if (p === 'tileLayer') return () => ({ addTo: chain });
        if (p === 'rectangle') return () => ({ bindTooltip(){ return this; }, addTo: chain });
        if (p === 'layerGroup') return () => ({ addTo: chain });
        if (['circleMarker','marker','polyline','polygon','geoJSON'].includes(p))
          return () => ({ addTo: chain, bindPopup: chain, bindTooltip: chain, on: chain,
                          setLatLng: chain, remove: chain });
        if (p === 'latLng') return (a, b) => ({ lat: a, lng: b });
        return chain();
      }});
      w.onerror = () => {};
      // jsdom throws on history.replaceState under file:// URLs, which aborts the
      // page script BEFORE it fetches profiles.json - leaving the model running on
      // synthetic fallback profiles (28.9% solar CF instead of the real 20.8%) and
      // silently invalidating every benchmark below. Stub it out.
      Object.defineProperty(w.history, 'replaceState', { value: () => {}, writable: true });
      Object.defineProperty(w.history, 'pushState',    { value: () => {}, writable: true });
    },
  });
  dom.window.fetch = async (u) => {
    const s = String(u);
    // Never call live services from a validation run
    if (s.includes('googleapis.com') || s.includes('nominatim') || s.includes('open-meteo')
        || s.includes('archive-api')) {
      return { ok: false, status: 404, json: async () => ({}) };
    }
    try {
      const clean = s.split('?')[0];
      const t = fs.readFileSync(path.join(ROOT, clean), 'utf8');
      return { ok: true, json: async () => JSON.parse(t), text: async () => t };
    } catch (e) { return { ok: false, json: async () => { throw e; } }; }
  };
  return dom;
}

function readMix(doc) {
  const txt = doc.getElementById('mix').textContent.replace(/\s+/g, ' ');
  const out = {};
  for (const m of txt.matchAll(/([A-Za-z ]+):\s*([\d.]+)\s*TWh\s*\(([\d.]+)%\)/g)) {
    out[m[1].trim()] = { twh: parseFloat(m[2]), pct: parseFloat(m[3]) };
  }
  return out;
}
function readKpis(doc) {
  const t = doc.getElementById('kpis').textContent.replace(/\s+/g, ' ');
  const num = (label, unit) => {
    const m = t.match(new RegExp('([\\d.,]+)\\s*' + unit + '\\s*' + label));
    return m ? parseFloat(m[1].replace(/,/g, '')) : null;
  };
  return {
    energyTwh:  (t.match(/([\d.,]+)\s*TWh\/yr/) || [])[1],
    carbon:     (t.match(/([\d.,]+)\s*gCO/) || [])[1],
    renewPct:   (t.match(/([\d.,]+)\s*%\s*Non-fossil/) || [])[1],
    raw: t,
  };
}

(async () => {
  const dom = boot();
  await new Promise(r => setTimeout(r, 4000));
  const w = dom.window, doc = w.document;
  w.history.replaceState = () => {}; w.history.pushState = () => {};

  // ───────────────────────────────────────────────────────────────────────────
  // 1. NATIONAL ENERGY BALANCE (baseline "Today 2026")
  // ───────────────────────────────────────────────────────────────────────────
  // GUARD: everything below is meaningless if the model is running on synthetic
  // fallback profiles rather than real Eskom data. Check this FIRST.
  const badge = doc.getElementById('bdData');
  const onRealData = badge && /Eskom/i.test(badge.textContent);
  results.push({ name: 'Running on real Eskom profiles', actual: badge ? badge.textContent.trim() : 'none',
    expected: 'YYYY Eskom', tol: null, pass: !!onRealData,
    source: 'profiles.json must load; synthetic fallback overstates solar CF by ~39%', unit: '' });
  if (!onRealData) {
    console.log('\n*** ABORTING: model is on synthetic profiles, benchmarks would be invalid ***\n');
    process.exit(1);
  }

  const mix = readMix(doc);
  const kpiText = doc.getElementById('kpis').textContent.replace(/\s+/g, ' ');

  const totalTwh = Object.values(mix).reduce((a, b) => a + b.twh, 0);
  // Eskom MTSAO 2026-30 puts national demand at 243 TWh (2024) rising to 264 TWh
  // by 2030. The app reports GRID-SERVED energy plus behind-the-meter rooftop,
  // so it should land somewhat below the national demand figure but in the same
  // order. A wide band: this is a sanity check, not a precision test.
  checkRange('Total energy supplied', totalTwh, 170, 250,
    'Eskom MTSAO 2026-30: 243 TWh (2024) → 264 TWh (2030)', 'TWh/yr');

  // Sharper test: Eskom publishes RESIDUAL demand - what the grid actually serves,
  // net of behind-the-meter rooftop. 191.4 TWh over calendar 2025; the first 29
  // weeks of 2026 ran 9.1% below the equivalent 2025 period, annualising to about
  // 177 TWh. Subtract rooftop from the app's total to compare like with like.
  // This is falling fast as rooftop displaces grid purchases, so the band is wide.
  const rooftopTwh = mix['Rooftop PV'] ? mix['Rooftop PV'].twh : 0;
  const gridServed = totalTwh - rooftopTwh;
  checkRange('Grid-served demand (net of rooftop)', gridServed, 170, 215,
    'Eskom residual demand: 191.4 TWh (2025), ~177 TWh annualised (2026)', 'TWh/yr');

  // Rooftop generation must be consistent with the model's own installed
  // capacity at a physically realistic capacity factor.
  //
  // TWO CORRECTIONS, 16 Aug 2026. The denominator was hardcoded 9,100 MW - the
  // NTCSA figure BEFORE the 488 MW of ground-mounted wheeled plant was moved to
  // utility supply - so it no longer matched FIXED.rooftopMW and the check was
  // measuring against a fleet the model does not have. It now reads the constant.
  //
  // The range was also justified by "SA fixed-tilt PV CF ~20.8%", which is the
  // very conflation the rooftop audit corrected: a ROOFTOP fleet is not an
  // optimally-sited fixed-tilt plant. It takes whatever orientation the roof has,
  // is shaded, is never cleaned, does not track, and sits in Gauteng and the
  // Western Cape rather than the Northern Cape. 14-20% is the defensible band for
  // a distributed fleet; anything at or above utility PV's ~22% is a red flag.
  const rooftopMwConst = readFixed('rooftopMW', 8619.4);
  const rooftopCF = rooftopTwh * 1e6 / (rooftopMwConst * 8760) * 100;
  checkRange('Rooftop implied capacity factor', rooftopCF, 14, 20,
    `over FIXED.rooftopMW = ${rooftopMwConst} MW; distributed fleets run well below utility PV`, '%');

  // StatsSA reports LOCAL generation, excluding imports and behind-the-meter
  // rooftop. Recompute on that basis or the comparison is meaningless.
  const localKeys = Object.keys(mix).filter(k => !['Imports', 'Rooftop PV'].includes(k));
  const localTot = localKeys.reduce((a, k) => a + mix[k].twh, 0);
  const coalLocalPct = mix['Coal'] ? mix['Coal'].twh / localTot * 100 : 0;
  // StatsSA 2024: coal drove 83% of local generation. The app models 2026, by
  // which point more renewables are built, so a few points lower is expected.
  checkRange('Coal share (local generation basis)', coalLocalPct, 72, 85,
    'Ember 2025: coal ~80% full-year (StatsSA 83% for 2024 excludes rooftop)', '%');

  // Ember's basis INCLUDES behind-the-meter rooftop, which StatsSA omits - and
  // rooftop is now ~7% of SA generation on its own, so the two give very
  // different answers. Test on Ember's basis too.
  const cleanAll = ['Rooftop PV','Wind','Utility PV','CSP','Nuclear','Hydro']
    .reduce((a, k) => a + (mix[k] ? mix[k].twh : 0), 0) / totalTwh * 100;
  checkRange('Clean share (Ember basis, incl. rooftop)', cleanAll, 20, 35,
    'Ember: SA clean generation 29% (Dec 2025), up from 19% (Dec 2024)', '%');

  const renLocal = ['Wind', 'Utility PV', 'CSP', 'Hydro']
    .reduce((a, k) => a + (mix[k] ? mix[k].twh : 0), 0) / localTot * 100;
  // StatsSA 2024: renewables 9% of local production. Higher here for 2026.
  checkRange('Renewables (local generation basis)', renLocal, 8, 20,
    'StatsSA 2024: 9% of local production (excludes rooftop - see Ember check)', '%');

  // Carbon intensity. Eskom's reported grid emission factor has run ~1.0-1.09
  // tCO2/MWh SENT OUT from its own coal-heavy fleet; the national average across
  // all sources including nuclear, hydro and renewables is materially lower.
  const carbon = parseFloat((kpiText.match(/([\d.,]+)\s*gCO/) || [])[1]);
  checkRange('Carbon intensity', carbon, 550, 800,
    'Derived: Eskom fleet ~1.0 tCO2/MWh coal, diluted by ~34% non-fossil', 'gCO2/kWh');

  // Total CO2 implied should be in the region of Eskom's reported annual total.
  const impliedMt = carbon / 1000 * totalTwh * 1e6 / 1e6;
  checkRange('Implied annual CO2', impliedMt, 110, 210,
    'Eskom reports ~206.8 Mt CO2/yr (all stations, incl. own use)', 'Mt/yr');

  // ───────────────────────────────────────────────────────────────────────────
  // 2. PHYSICAL CONSISTENCY (must hold regardless of any external source)
  // ───────────────────────────────────────────────────────────────────────────
  const nuclearTwh = mix['Nuclear'] ? mix['Nuclear'].twh : 0;
  // Koeberg is 1.86 GW. At a realistic 75-95% capacity factor that is 12-16 TWh.
  checkRange('Nuclear output vs Koeberg capacity', nuclearTwh, 11, 16,
    'Koeberg 1.86 GW at 75-95% CF = 12.2-15.5 TWh/yr', 'TWh/yr');

  // Imports: Cahora Bassa supplies ~1.15 GW under contract to at least Mar 2030.
  const importsTwh = mix['Imports'] ? mix['Imports'].twh : 0;
  checkRange('Imports vs Cahora Bassa contract', importsTwh, 6, 11,
    'Cahora Bassa 1.15 GW firm (Eskom MTSAO) = ~8-10 TWh/yr at high availability', 'TWh/yr');

  // Coal implied capacity factor must be physically possible.
  // Fleet ~42 GW nameplate; EAF baseline 64%.
  const coalTwh = mix['Coal'] ? mix['Coal'].twh : 0;
  const coalCF = coalTwh * 1e6 / (42000 * 8760) * 100;
  checkRange('Coal implied capacity factor', coalCF, 25, 70,
    'Fleet 42 GW at ~64% EAF; utilisation below availability', '%');

  // ───────────────────────────────────────────────────────────────────────────
  // 3. LCOE ASSUMPTIONS vs published cost benchmarks
  // ───────────────────────────────────────────────────────────────────────────
  const lcoe = doc.getElementById('lcoe').textContent.replace(/\s+/g, ' ');
  const lc = (label) => {
    const m = lcoe.match(new RegExp(label + '\\s*R([\\d.]+)/kWh'));
    return m ? parseFloat(m[1]) : null;
  };
  // REIPPPP Bid Window 7 solar bids averaged R0.46/kWh; the model anchors above
  // that to reflect unsubsidised, non-BW7 conditions.
  checkRange('Utility solar LCOE', lc('Utility solar PV'), 0.40, 0.75,
    'REIPPPP BW7 solar bids averaged R0.46/kWh', 'R/kWh');
  checkRange('Wind LCOE', lc('Wind'), 0.55, 1.00,
    'REIPPPP BW7: wind bid above solar', 'R/kWh');
  // Diesel OCGT is the system's most expensive dispatchable source. The band was
  // 3.50-7.00 while lcoeDiesel sat at 5500 - a figure BELOW diesel's own SRMC and
  // so definitionally impossible (see the LCOE>=SRMC invariant above). Corrected
  // to 9000 on 14 Aug 2026 = SRMC 6,206 + R13,000/kW capex over 25yr at 8% spread
  // over a 5% capacity factor. Band widened to span 2%-10% CF (7.6-13.2), with a
  // hard floor at its own SRMC. Do NOT narrow this back without changing the CF
  // assumption at the constant.
  checkRange('Diesel OCGT LCOE', lc('Diesel OCGT'), 7.00, 13.50,
    'SRMC R6,206/MWh + OCGT capex at 2-10% capacity factor', 'R/kWh');

  // Merit order must be monotonic where the physics demands it.
  const solar = lc('Utility solar PV'), wind = lc('Wind'), diesel = lc('Diesel OCGT');
  results.push({ name: 'Merit order: solar < wind < diesel', actual: `${solar} < ${wind} < ${diesel}`,
    expected: 'ascending', tol: null, pass: solar < wind && wind < diesel,
    source: 'Structural: cheapest renewables below peaking plant', unit: '' });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. SUBSTATION DATASET INTEGRITY
  // ───────────────────────────────────────────────────────────────────────────
  const subs = JSON.parse(fs.readFileSync(path.join(ROOT, 'nodal/substations_compact.json'), 'utf8')).subs;
  const inSA = subs.filter(s => s.lat >= -35.5 && s.lat <= -22 && s.lng >= 16 && s.lng <= 33.5);
  check('Substations within SA bounds', inSA.length, subs.length, 0,
    'Geographic: all SA substations lie within the national bounding box', 'of ' + subs.length);
  check('Substations with voltage', subs.filter(s => s.kv).length, subs.length, 0,
    'Data completeness: every record should carry a kV rating', 'of ' + subs.length);
  // ---- LCOE >= SRMC, a definitional invariant --------------------------------
  // LCOE = SRMC + annuitised capex / capacity factor, so a technology's LCOE can
  // never be below its own short-run marginal cost. lcoeDiesel sat at 5500 against
  // an SRMC of 6206 until 14 Aug 2026 - impossible, and nothing was watching.
  // SRMC here is fuel + VOM + carbon at the model's own default carbon price.
  {
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const num = (k) => { const m = html.match(new RegExp('\\b' + k + '\\s*:\\s*([0-9.]+)')); return m ? parseFloat(m[1]) : null; };
    const carbon = num('carbonTaxRPerT');
    const pairs = [
      ['Coal',   num('lcoeCoalNew'), num('costCoal')   + num('vomCoal')    + carbon * num('emisCoal')],
      ['CCGT',   num('lcoeCcgt'),    num('costCcgt')   + num('vomCcgt')    + carbon * num('emisCcgt')],
      ['Diesel', num('lcoeDiesel'),  num('costDiesel') + num('vomDiesel')  + carbon * num('emisDiesel')],
      ['Nuclear',num('lcoeNuclear'), num('costNuclear')+ num('vomNuclear')],
    ];
    for (const [nm, lcoe, srmc] of pairs)
      check(`${nm}: LCOE >= its own SRMC`, lcoe >= srmc ? 1 : 0, 1, 0,
        'Definitional: LCOE = SRMC + capex/CF, so it cannot be lower',
        `LCOE ${Math.round(lcoe)} vs SRMC ${Math.round(srmc)}`);
  }

  // Supply-area labels. Nothing validated these before, which is how Juno sat in
  // the wrong area and Gariep/Van der Kloof/Lethabo disagreed with the fleet.
  const AREAS = new Set(Object.keys(JSON.parse(
    fs.readFileSync(path.join(ROOT, 'nodal/headroom_summary.json'), 'utf8')).headroom));
  check('Substations with a supply area', subs.filter(s => s.area).length, subs.length, 0,
    'Every substation must carry an area label', 'of ' + subs.length);
  check('Supply areas match headroom_summary keys',
    subs.filter(s => AREAS.has(s.area)).length, subs.length, 0,
    'Vocabulary: substation areas must be the same set headroom is keyed by', 'of ' + subs.length);
  check('No substation still uses the old `r` field',
    subs.filter(s => s.r !== undefined).length, 0, 0,
    'Renamed r -> area on 14 Aug 2026; a stray `r` means a stale file', '');
  const verified = subs.filter(s => s.src && s.src !== 'centroid').length;
  checkRange('Substations with verified coordinates', verified / subs.length * 100, 95, 100,
    'Sourced from NTCSA shapefile, DBSA register, Eskom GPS file and OSM', '%');

  // ───────────────────────────────────────────────────────────────────────────
  // 5. ROOFTOP CALCULATOR — against a real installation
  // ───────────────────────────────────────────────────────────────────────────
  // Anchor: a real SA installation of 6.2 kWp + 10.5 kWh battery on roughly
  // 800 kWh/month, reporting 90-95% grid independence in practice.
  const set = (id, v) => { const el = doc.getElementById(id); if (el) el.value = String(v); };
  set('rt_area', 37.6); set('rt_share', 100); set('rt_bill', 2000);
  set('rt_tariff', 2.50); set('rt_tilt', 1.05); set('rt_shading', 0.80);
  set('rt_batt', 10.5);
  w.rtCalc();
  const rtHtml = doc.getElementById('rt_result').innerHTML;
  const cov = parseFloat((rtHtml.match(/([\d.]+)%<\/div><div style="font-size:9\.5px;color:var\(--ink2\)">of monthly demand covered/) || [])[1]);
  checkRange('Rooftop coverage vs real installation', cov, 75, 95,
    'Real SA system: 6.2 kWp + 10.5 kWh, ~800 kWh/month, reports 90-95%', '%');

  // Same system with no battery must be far lower - solar cannot serve night load.
  set('rt_batt', 0); w.rtCalc();
  const covNoBatt = parseFloat((doc.getElementById('rt_result').innerHTML
    .match(/([\d.]+)%<\/div><div style="font-size:9\.5px;color:var\(--ink2\)">of monthly demand covered/) || [])[1]);
  checkRange('Rooftop coverage, no battery', covNoBatt, 25, 50,
    'Physical: SA homes draw ~30-35% of demand in the 09:00-16:00 solar window', '%');
  results.push({ name: 'Battery materially raises coverage', actual: `${covNoBatt}% → ${cov}%`,
    expected: 'increase', tol: null, pass: cov > covNoBatt + 20,
    source: 'Physical: storage shifts midday surplus into the evening peak', unit: '' });

  // ───────────────────────────────────────────────────────────────────────────
  // 6. SCENARIO RESPONSES — direction of travel must be right
  // ───────────────────────────────────────────────────────────────────────────
  const pressPreset = (name) => {
    const b = [...doc.querySelectorAll('#presets button')].find(x => x.textContent === name);
    if (!b) return null;
    b.click();
    try { if (w.run) w.run(); } catch (e) {}
    return readMix(doc);
  };

  const baseShed = doc.getElementById('shed').textContent.replace(/\s+/g,' ');
  const crisis = pressPreset('Crisis 2023');
  if (crisis) {
    // Crisis 2023 sets EAF to 50% AND demand +14%. Coal OUTPUT can legitimately
    // rise in absolute terms (higher demand pulls harder on a less available
    // fleet), so testing for a fall was wrong. What must rise is unserved energy
    // and diesel running - the system is being stressed from both sides.
    const crisisShed = doc.getElementById('shed').textContent.replace(/\s+/g,' ');
    const num = t => parseFloat((t.match(/([\d.]+)\s*GWh/) || [0,'0'])[1]);
    const dieselBase = 0;   // baseline diesel is zero in the mix above
    const dieselCrisis = crisis['Diesel OCGT'] ? crisis['Diesel OCGT'].twh : 0;
    results.push({ name: 'Crisis 2023 forces diesel peaking',
      actual: `${dieselCrisis.toFixed(2)} TWh diesel`, expected: '> 0',
      tol: null, pass: dieselCrisis > 0,
      source: 'Structural: EAF 50% + demand +14% must pull in expensive peaking', unit: '' });
    // Coal must be working harder relative to its reduced availability.
    const cfCrisis = crisis['Coal'].twh * 1e6 / (42000 * 0.50 * 8760) * 100;
    checkRange('Crisis coal utilisation of available fleet', cfCrisis, 60, 100,
      'Structural: at 50% EAF the remaining fleet should run near flat out', '%');
  }
  // A high-renewables scenario must actually shift the mix. "Future electricity
  // mix" retires 21 GW of coal and builds 28.5 GW wind + 42.5 GW solar, so wind
  // and solar together should dominate and coal should fall well below today's
  // ~80%. This replaces a check against a since-removed PyPSA preset.
  const future = pressPreset('Future electricity mix');
  if (future) {
    const vre = ['Wind','Utility PV','Rooftop PV','CSP']
      .reduce((a, k) => a + (future[k] ? future[k].pct : 0), 0);
    checkRange('High-renewables scenario shifts the mix', vre, 45, 85,
      'Structural: 28.5 GW wind + 42.5 GW solar added, 21 GW coal retired', '%');
    const coalPct = future['Coal'] ? future['Coal'].pct : 0;
    results.push({ name: 'High-renewables scenario cuts coal share',
      actual: `${coalPct}%`, expected: '< 45%', tol: null, pass: coalPct < 45,
      source: 'Structural: half the coal fleet retired', unit: '' });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // REPORT
  // ───────────────────────────────────────────────────────────────────────────
  const pass = results.filter(r => r.pass).length;
  console.log('\nGRIDTWIN ZA — OUTPUT VALIDATION');
  console.log('='.repeat(96));
  for (const r of results) {
    const a = typeof r.actual === 'number' ? r.actual.toFixed(1) : r.actual;
    console.log(`${r.pass ? ' PASS' : '*FAIL'}  ${r.name.padEnd(44)} ${String(a).padStart(11)} ${r.unit}`);
    console.log(`        expected ${r.expected}${r.tol ? ' ±' + r.tol : ''}   ${r.source}`);
  }
  console.log('='.repeat(96));
  console.log(`${pass}/${results.length} checks passed\n`);
  process.exit(pass === results.length ? 0 : 1);
})();
