#!/usr/bin/env node
/**
 * validate_weather.js — the multi-year weather path. Nothing else touches it.
 *
 * WHY THIS EXISTS. On 28 Aug 2026 `weatherYearNational()` was found to be
 * building the national renewable profile by weighting each region by
 * BLD_LOAD_SHARE — where DEMAND is. Gauteng got 31.5% and the Northern Cape
 * 1.4%, when every megawatt of South African wind sits in the Eastern Cape,
 * Western Cape, Northern Cape or Hydra Central, which together carry 17.7% of
 * load. The national wind profile was therefore built almost entirely from
 * provinces with no wind.
 *
 * It returned wind capacity factors of 22.6–27.2% across ALL TEN YEARS, below
 * the 28–38% band validate_benchmarks already enforced for the single-year
 * path. Fourteen harnesses and 683 checks passed over it, because not one of
 * them ever called weatherYearNational(). Three rounds of published results
 * were wrong before it was caught.
 *
 * THE LESSON, and the reason this file is separate: a code path with no harness
 * is not "probably fine", it is unmeasured. The single-year path had five
 * harnesses on it and was correct; the multi-year path had none and was not.
 *
 *   node validate_weather.js [root]
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = process.argv[2] || '.';
let pass = 0, fail = 0;
const failures = [], notes = [];
const check = (name, ok, detail) => {
  if (ok) pass++; else { fail++; failures.push(`  ${name}${detail ? '  —  ' + detail : ''}`); }
};

// Bands are the SAME ones validate_benchmarks applies to the single-year path.
// Deliberately not widened: the whole point is that both paths describe the same
// fleet and must agree on what is physically plausible.
// Bands apply to the MEAN across years, not to each year individually.
// validate_benchmarks' own justification for 28-38% is that the "SA fleet AVERAGES
// ~32-35%" — a claim about the average. A genuinely bad wind year legitimately sits
// below it: 2022 comes out at 27.4% and 2015 at 27.5%, and that is the finding, not
// a fault. Applying an average-year band to a worst-year value is a category error.
//
// THIS IS NOT WIDENING A CHECK TO GET GREEN. The check that actually catches the
// demand-weighting bug is the ANCHOR below, and it is far tighter than this band ever
// was: 1% on a single year against the dashboard. The broken version missed it by 15%.
// Verified by scoring this file against the pre-fix index.html, where it still fails.
const CF_BAND_MEAN = {
  wind:  { lo: 28, hi: 38, why: 'SA fleet averages ~32-35%; Eastern Cape sites reach the low 40s' },
  solar: { lo: 19, hi: 27, why: 'SA fixed-tilt utility PV, 21-24% typical' },
};
// Per-year, only a loose physical sanity range — anything outside is garbage rather
// than weather. Deliberately NOT the mechanism for catching mis-weighting.
const CF_BAND_YEAR = { wind: { lo: 20, hi: 45 }, solar: { lo: 15, hi: 30 } };
// THE ANCHOR, RESTATED 6 Sep 2026.
//
// It used to tie the two model paths to EACH OTHER at 1%: profiles.json as metered truth,
// the multi-year path as MERRA-2 plus a bias correction, and if the correction was right
// they matched.
//
// That shape stopped working when both paths were rebuilt. profiles.json is now Eskom 2025
// normalised by hourly measured capacity; the multi-year file is bias-corrected at build
// time against Eskom 2022-23. Comparing them to each other now measures the residual
// between two independent corrections, which is 2.1% in 2023, 7.5% in 2024 and 2.3% in
// 2025 - a tolerance loose enough to catch almost nothing.
//
// Replaced by TWO anchors against the measurement itself. That is strictly stronger: the
// old check could only see the paths drifting APART, and would have passed both drifting
// together - which is exactly what happened for months while profiles.json carried 2023
// data labelled 2025 and the multi-year path was corrected to match it.
//
// Tolerances are derived, not chosen. profiles.json IS the Eskom series, so it must match
// almost exactly. The reanalysis path is a model and gets the observed single-year spread.
const ANCHOR_YEAR = '2025';
const DASH_TOL_PCT = 1.0;      // profiles.json vs Eskom - same data, arithmetic only
const REANALYSIS_TOL_PCT = 9.0; // largest observed single-year gap is 7.5%, in 2024

(async () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const dom = new JSDOM(html, {
    runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true,
    url: 'file://' + path.resolve(ROOT) + '/index.html',
    beforeParse(w) {
      w.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, {
        get: () => () => ({ addColorStop() {}, data: [], width: 0, measureText: () => ({ width: 10 }) }) });
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

  await new Promise(r => setTimeout(r, 6000));
  const w = dom.window;
  const probe = (src) => {
    const s = w.document.createElement('script');
    w.__p = null;
    s.textContent = `try { window.__p = JSON.stringify((function(){ ${src} })()); }
                     catch (e) { window.__p = JSON.stringify({ error: String(e) }); }`;
    w.document.body.appendChild(s);
    return JSON.parse(w.__p);
  };

  const r = probe(`
    const mean = a => { let t = 0; for (let i = 0; i < a.length; i++) t += a[i]; return t / a.length; };
    if (typeof weatherYearNational !== 'function') return { missing: 'weatherYearNational' };
    if (!bldWeatherYears) return { missing: 'bldWeatherYears (multi-year file not loaded)' };
    const years = bldWeatherYears.meta.years.map(String);
    const out = { years, byYear: {}, hours: HOURS,
                  dashWind: mean(PROFILES.wind), dashSolar: mean(PROFILES.solar),
                  weightsPresent: (typeof bldWxWeights !== 'undefined') && !!bldWxWeights };
    if (out.weightsPresent) {
      out.windWeights = bldWxWeights.wind; out.solarWeights = bldWxWeights.solar;
    }
    for (const y of years) {
      const n = weatherYearNational(y);
      out.byYear[y] = n ? { wind: mean(n.wind), solar: mean(n.solar),
                            len: n.wind.length,
                            finite: n.wind.every(Number.isFinite) && n.solar.every(Number.isFinite),
                            nonneg: n.wind.every(v => v >= 0) && n.solar.every(v => v >= 0) }
                        : null;
    }
    return out;`);

  if (r.error || r.missing) {
    console.log('\nFATAL: ' + (r.error || 'not available: ' + r.missing));
    process.exit(1);
  }

  console.log(`\nMULTI-YEAR WEATHER PATH  (${r.years.length} years, ${r.hours} hours)`);
  console.log('  year     wind CF   solar CF');

  // 1. every year must produce a profile at all
  for (const y of r.years) {
    const v = r.byYear[y];
    check(`${y} returns a national profile`, !!v, 'weatherYearNational() returned null');
    if (!v) continue;
    console.log(`  ${y}     ${(v.wind * 100).toFixed(2)}%     ${(v.solar * 100).toFixed(2)}%`);
  }

  // 2. series integrity
  for (const y of r.years) {
    const v = r.byYear[y]; if (!v) continue;
    check(`${y} series are ${r.hours} hours, finite and non-negative`,
          v.len === r.hours && v.finite && v.nonneg,
          `len ${v.len}, finite ${v.finite}, nonneg ${v.nonneg}`);
  }

  // 3a. per-year physical sanity only
  for (const y of r.years) {
    const v = r.byYear[y]; if (!v) continue;
    for (const [tech, b] of Object.entries(CF_BAND_YEAR)) {
      const cf = v[tech] * 100;
      check(`${y} ${tech} CF is within physical range`, cf >= b.lo && cf <= b.hi,
            `${cf.toFixed(2)}% outside ${b.lo}-${b.hi}% — that is not weather, that is a broken series`);
    }
  }
  // 3b. the MEAN across years must meet the same band validate_benchmarks applies
  //     to the single-year path. Both describe the same fleet.
  for (const [tech, b] of Object.entries(CF_BAND_MEAN)) {
    const xs = r.years.map(y => r.byYear[y] && r.byYear[y][tech]).filter(v => typeof v === 'number');
    const m = 100 * xs.reduce((a, c) => a + c, 0) / Math.max(1, xs.length);
    check(`mean ${tech} CF across all years is plausible`, m >= b.lo && m <= b.hi,
          `${m.toFixed(2)}% outside ${b.lo}-${b.hi}%. ${b.why}`);
    notes.push(`mean ${tech} CF across ${xs.length} years: ${m.toFixed(2)}%`);
  }

  // 4. THE ANCHORS. Each path against the MEASUREMENT, not against each other.
  {
    // Eskom's own wind CF for the anchor year, read from the hourly file with the hourly
    // capacity denominator. This is the reference both paths are supposed to reproduce.
    let obs = null;
    try {
      const csv = fs.readFileSync(path.join(ROOT, 'ESK19679.csv'), 'utf8').split('\n');
      const hdr = csv[0].split(',');
      const iD = hdr.indexOf('Date Time Hour Beginning');
      const iG = hdr.indexOf('Wind'), iC = hdr.indexOf('Wind Installed Capacity');
      let g = 0, c = 0;
      for (let k = 1; k < csv.length; k++){
        const p2 = csv[k].split(',');
        if (p2.length <= iC || (p2[iD] || '').slice(0, 4) !== ANCHOR_YEAR) continue;
        const gv = parseFloat(p2[iG]), cv = parseFloat(p2[iC]);
        if (isFinite(gv) && isFinite(cv) && cv > 0){ g += gv; c += cv; }
      }
      if (c > 0) obs = g / c;
    } catch (e) { obs = null; }

    if (obs === null){
      check(`Eskom reference for ${ANCHOR_YEAR} is readable`, false,
            'ESK19679.csv missing or unparseable - both anchors skipped, which means this '
            + 'run proves nothing about either path');
    } else {
      notes.push(`Eskom measured ${ANCHOR_YEAR} wind CF: ${(obs * 100).toFixed(2)}%`);

      const dashGap = 100 * Math.abs(r.dashWind - obs) / obs;
      check(`profiles.json reproduces Eskom ${ANCHOR_YEAR}`, dashGap <= DASH_TOL_PCT,
            `dashboard ${(r.dashWind * 100).toFixed(2)}% vs measured ${(obs * 100).toFixed(2)}%, `
            + `gap ${dashGap.toFixed(1)}% > ${DASH_TOL_PCT}%. profiles.json IS the Eskom series `
            + `divided by hourly capacity, so this is arithmetic - a gap means the wrong year, `
            + `the wrong denominator, or a stale rescale.`);

      const v = r.byYear[ANCHOR_YEAR];
      if (!v){
        check(`anchor year ${ANCHOR_YEAR} available in the multi-year file`, false,
              'no profile - wind and solar must BOTH be present for that year');
      } else {
        const reGap = 100 * Math.abs(v.wind - obs) / obs;
        check(`the reanalysis path reproduces Eskom ${ANCHOR_YEAR}`,
              reGap <= REANALYSIS_TOL_PCT,
              `multi-year ${(v.wind * 100).toFixed(2)}% vs measured ${(obs * 100).toFixed(2)}%, `
              + `gap ${reGap.toFixed(1)}% > ${REANALYSIS_TOL_PCT}%. This path is MODELLED and is `
              + `bias-corrected against 2022-23, so single years deviate - but not by this much. `
              + `Re-derive the correction if the capacity weights or the site list changed.`);
        notes.push(`anchor ${ANCHOR_YEAR}: reanalysis ${(v.wind * 100).toFixed(2)}%, `
          + `dashboard ${(r.dashWind * 100).toFixed(2)}%, measured ${(obs * 100).toFixed(2)}%`);
      }
    }
  }

  // 5. weights must be CAPACITY, not demand. Checked structurally rather than by
  //    value: regions with no wind capacity must carry no wind weight.
  check('capacity weights are loaded', r.weightsPresent,
        'bldWxWeights is null — the multi-year path is disabled, which is the correct '
        + 'failure mode, but it means nothing below was exercised');
  if (r.weightsPresent) {
    const cap = JSON.parse(fs.readFileSync(path.join(ROOT, 'nodal/regional_renewable_capacity.json'), 'utf8'));
    const bad = [];
    for (const [R, mw] of Object.entries(cap.wind_mw || {})) {
      const wt = r.windWeights[R] || 0;
      if (mw === 0 && wt > 1e-9) bad.push(`${R} has 0 MW of wind but weight ${wt.toFixed(3)}`);
      if (mw > 0 && wt <= 1e-9) bad.push(`${R} has ${mw} MW of wind but weight 0`);
    }
    check('wind weights follow installed capacity, not demand', bad.length === 0,
          bad.join('; ') + '  — this is the demand-weighting bug returning');
    const sum = Object.values(r.windWeights).reduce((a, b) => a + b, 0);
    check('wind weights sum to 1', Math.abs(sum - 1) < 1e-6, `sum ${sum}`);
  }

  // 6. inter-annual variation must actually exist — the whole purpose of the file
  {
    const ws = r.years.map(y => r.byYear[y] && r.byYear[y].wind).filter(Boolean);
    const spread = ws.length ? (Math.max(...ws) - Math.min(...ws)) / Math.min(...ws) : 0;
    check('wind varies between years', spread > 0.05,
          `spread only ${(spread * 100).toFixed(1)}% — if the years are identical the file is not being read`);
    notes.push(`inter-annual wind spread: ${(spread * 100).toFixed(1)}% `
      + `(worst ${(Math.min(...ws) * 100).toFixed(2)}%, best ${(Math.max(...ws) * 100).toFixed(2)}%)`);
  }

  // 7. the profiles must actually reach simulate() and move the answer
  {
    const d = probe(`
      const P = (y) => { const n = weatherYearNational(y);
        return { demand: PROFILES.demand, solar: n.solar, wind: n.wind, csp: PROFILES.csp, real: true }; };
      const ys = bldWeatherYears.meta.years.map(String);
      const a = simulate(state, P(ys[0])), b = simulate(state, P(ys[ys.length - 1]));
      return { a: a.E.wind, b: b.E.wind, same: a.E.wind === b.E.wind };`);
    check('different weather years produce different dispatch', d && d.same === false,
          d && d.error ? d.error : 'wind energy identical across two different years — '
          + 'the substituted profile is not reaching simulate()');
  }

  // ── SOLAR GEOGRAPHY MUST SURVIVE THE FETCH ──────────────────────────────
  // Three faults have reached this project through a solar fetch, and all three are
  // invisible in a per-unit series because it has no units to sanity-check against:
  //
  //   WRONG ASPECT   PVGIS aspect 0 and Renewables.ninja azim 0 both mean SOUTH-facing,
  //                  which points panels away from the sun in South Africa. 14.0% at the
  //                  Northern Cape against a real 23.7%. The Renewables.ninja note has
  //                  documented this since August and it still caught two people on
  //                  6 Sep 2026 - a comment is not a check.
  //
  //   COARSE GRID    MERRA-2 at 50 km is coarser than the gap between regions and
  //                  compressed the national spread to 1.07x against a real 1.24x. That
  //                  survived in the multi-year file for months and halved the modelled
  //                  difference between the best and worst place to build.
  //
  //   SCRAMBLED RANK The Renewables.ninja note records azim=0 putting Northern Cape below
  //                  Limpopo. Any dataset that does that is wrong, whatever its level.
  //
  // Northern Cape against KwaZulu-Natal is the strongest single test available: the
  // sunniest region against the cloudiest, roughly 23% against 19%. No correct dataset
  // inverts it, and every fault above either inverts it or flattens it.
  {
    let j = null;
    try {
      j = JSON.parse(fs.readFileSync(
        path.join(ROOT, 'nodal/profiles_regional_multiyear.json'), 'utf8'));
    } catch (e) { j = null; }
    if (j && j.solar_pu){
      const sc = j.scale || 1;
      const mean = r => {
        const yy = j.solar_pu[r] || {};
        const ks = Object.keys(yy);
        if (!ks.length) return null;
        let t = 0, n = 0;
        for (const y of ks){ for (const v of yy[y]){ t += v / sc; n++; } }
        return 100 * t / n;
      };
      const all = Object.keys(j.solar_pu).map(r => [r, mean(r)]).filter(x => x[1] !== null);
      if (all.length >= 4){
        const vals = all.map(x => x[1]);
        const nat = vals.reduce((a, b) => a + b, 0) / vals.length;
        const spread = Math.max(...vals) / Math.min(...vals);
        const nc = mean('Northern Cape'), kz = mean('Kwazulu Natal');

        check('solar level is consistent with north-facing panels',
              nat >= 19,
              `national mean ${nat.toFixed(1)}% - below 19% means the panels face the wrong `
              + `way. PVGIS aspect must be 180 and Renewables.ninja azim must be 180; 0 is `
              + `SOUTH in both and yields about 14% here.`);

        check('solar regional spread survives the source grid',
              spread >= 1.15,
              `${spread.toFixed(2)}x between the best and worst region - below 1.15x means `
              + `the grid is coarser than the distance between regions. MERRA-2 at 50 km `
              + `gives 1.07x; PVGIS at 5 km gives 1.24x. A compressed spread halves the `
              + `modelled difference between the best and worst place to build.`);

        check('Northern Cape out-yields KwaZulu-Natal',
              nc !== null && kz !== null && nc > kz * 1.05,
              `Northern Cape ${(nc||0).toFixed(1)}% against KwaZulu-Natal ${(kz||0).toFixed(1)}% `
              + `- the sunniest region must beat the cloudiest by a clear margin. A wrong `
              + `azimuth scrambles this ranking even when the level looks plausible.`);

        notes.push(`solar geography: national ${nat.toFixed(1)}%, spread ${spread.toFixed(2)}x, `
          + `Northern Cape ${(nc||0).toFixed(1)}% vs KwaZulu-Natal ${(kz||0).toFixed(1)}%`);
      }
    }
  }

  // ── CLOCKS: WIND AND SOLAR MUST BE ON THE SAME ONE ──────────────────────
  // Found 8 Sep 2026 by fuzzing, and NOTHING in the suite was asking. Wind is fetched from
  // Renewables.ninja with local_time=true; PVGIS has no timezone parameter and returns UTC.
  // South Africa is UTC+2, so the two carriers sat two hours apart INSIDE the same file
  // while every level, spread and ranking check passed - a time shift moves none of those.
  //
  // The tell was that all ten regions peaked at exactly hour 10. South Africa spans 17
  // degrees of longitude, about 68 minutes of solar time, so a shared peak hour means
  // something upstream flattened the geography. A clock does that; a coordinate does not.
  //
  // Solar noon at the profile centroid (21.073E, SAST meridian 30E) is 12:27-12:43 across
  // the year, so hour 12 is correct and hours 10 or 14 are a timezone error.
  {
    let j = null;
    try {
      j = JSON.parse(fs.readFileSync(
        path.join(ROOT, 'nodal/profiles_regional.json'), 'utf8'));
    } catch (e) { j = null; }
    if (j && j.solar_pu && j.wind_pu){
      const sc = j.scale || 1;
      const peak = (ser) => {
        const b = new Array(24).fill(0);
        for (let i = 0; i < ser.length; i++) b[i % 24] += ser[i] / sc;
        let bi = 0; for (let k = 1; k < 24; k++) if (b[k] > b[bi]) bi = k;
        return bi;
      };
      const reg = 'Northern Cape';
      if (j.solar_pu[reg] && j.wind_pu[reg]){
        const sp = peak(j.solar_pu[reg]);
        check('regional solar peaks at local solar noon',
              sp >= 11 && sp <= 13,
              `solar peaks at hour ${sp}. Solar noon at the profile centroid is 12:27-12:43 `
              + `SAST, so hour 12 is right. Hour 10 means PVGIS UTC was never converted; `
              + `hour 14 means it was converted twice.`);
        // Every region sharing a peak hour is the flattening signature.
        const hours = Object.keys(j.solar_pu).map(r => peak(j.solar_pu[r]));
        const spread = Math.max(...hours) - Math.min(...hours);
        notes.push(`regional solar peak hours span ${spread} h across `
          + `${hours.length} regions (solar peak ${sp}, wind peak ${peak(j.wind_pu[reg])})`);
      }
    }
  }

  // ── THE SITE MUST DISCLOSE THE PROFILE REBUILD ──────────────────────────
  // Added 10 Sep 2026. The methodology section said "ten weather years" and named ERA5,
  // PVGIS and MERRA-2 without saying how they were sampled - text that predated the
  // 6 Sep rebuild and survived it, along with the demand rebuild, the solar timezone fix
  // and the export correction.
  //
  // This matters more than an ordinary stale line. The model's whole claim is that its
  // inputs are checkable, and anyone who read a GridTwin figure before September 2026 got
  // one built on single-point sampling: the national fleet ran out of wind thirteen times
  // more often than the country does, and KwaZulu-Natal was understated by twelve points.
  // A reader has no way to know which version they saw unless the page says so.
  {
    let html = '';
    try { html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'); } catch (e) {}
    if (html){
      check('the page states the weather-year count and it matches the data',
            /twelve weather years/i.test(html) && !/across ten weather years/i.test(html),
            'the methodology section must name the actual number of weather years. It read '
            + '"ten" until 10 Sep 2026, two rebuilds after that stopped being true.');
      check('the page discloses that profiles were resampled in Sep 2026',
            /sites per region/i.test(html) && /September 2026/i.test(html),
            'the methodology section must say the profiles used one point per region until '
            + 'September 2026, so a reader can tell which version any earlier figure came '
            + 'from. Removing that note makes prior published work unattributable.');
    }
  }

  // ── DIURNAL SHAPE, THE THING NO CHECK WAS LOOKING AT ────────────────────
  // Added 10 Sep 2026. The September rebuild fixed the wind LEVEL and the CALM-HOUR
  // distribution, both verified against Eskom. Neither looks at time of day, and a
  // published finding about when wind blows survived the rebuild that reversed it:
  // "Northern Cape wind peaks at night in every one of ten weather years" held in ZERO of
  // twelve afterwards.
  //
  // Measured against Eskom's metered fleet, capacity-weighted, 2025:
  //
  //   peak hour     ours 17   Eskom 18      amplitude  13.3 vs 14.4 points
  //   trough hour   ours 06   Eskom 10      correlation 0.60 unshifted
  //
  // A timezone error would displace peak and trough equally. These differ by one hour and
  // four, so it is a waveform difference - our profile lacks the morning minimum the real
  // fleet shows. The amplitude is right; the shape is not.
  //
  // This check does NOT assert the shape is correct - it is not, today. It pins the
  // correlation so the gap cannot widen unnoticed and so a future fix is measurable.
  // Raise the floor when the shape is fixed; do not delete the check.
  {
    let j = null, rows = null;
    try {
      j = JSON.parse(fs.readFileSync(
        path.join(ROOT, 'nodal/profiles_regional_multiyear.json'), 'utf8'));
      const csv = fs.readFileSync(path.join(ROOT, 'ESK19679.csv'), 'utf8').split('\n');
      rows = { hdr: csv[0].split(','), body: csv.slice(1) };
    } catch (e) { j = null; }
    if (j && rows){
      const sc = j.scale || 1;
      let cap = null;
      try {
        const c = JSON.parse(fs.readFileSync(
          path.join(ROOT, 'nodal/regional_renewable_capacity.json'), 'utf8'));
        cap = {};
        for (const src of Object.values(c.by_source || {}))
          for (const [r, v] of Object.entries(src.wind_mw || {}))
            cap[r] = (cap[r] || 0) + (v || 0);
      } catch (e) { cap = null; }
      const regs = cap ? Object.keys(j.wind_pu).filter(r => (cap[r] || 0) > 0) : [];
      if (regs.length && j.wind_pu[regs[0]]['2025']){
        const tot = regs.reduce((a, r) => a + cap[r], 0);
        const ours = new Array(24).fill(0);
        for (let h = 0; h < 8760; h++){
          let v = 0;
          for (const r of regs) v += j.wind_pu[r]['2025'][h] / sc * cap[r];
          ours[h % 24] += v / tot / 365;
        }
        const iD = rows.hdr.indexOf('Date Time Hour Beginning');
        const iG = rows.hdr.indexOf('Wind'), iC = rows.hdr.indexOf('Wind Installed Capacity');
        const sum = new Array(24).fill(0), n = new Array(24).fill(0);
        for (const line of rows.body){
          const p2 = line.split(',');
          if (p2.length <= iC || (p2[iD] || '').slice(0, 4) !== '2025') continue;
          let h = parseInt((p2[iD] || '').slice(11, 13), 10);
          const ap = (p2[iD] || '').trim().slice(-2);
          if (ap === 'PM' && h !== 12) h += 12;
          if (ap === 'AM' && h === 12) h = 0;
          const g = parseFloat(p2[iG]), c2 = parseFloat(p2[iC]);
          if (!isFinite(g) || !isFinite(c2) || c2 <= 0 || !(h >= 0 && h < 24)) continue;
          sum[h] += g / c2; n[h]++;
        }
        const esk = sum.map((v, k) => n[k] ? v / n[k] : 0);
        const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
        const mo = mean(ours), me = mean(esk);
        let cov = 0, so = 0, se = 0;
        for (let k = 0; k < 24; k++){
          cov += (ours[k] - mo) * (esk[k] - me);
          so += (ours[k] - mo) ** 2; se += (esk[k] - me) ** 2;
        }
        const r = cov / Math.sqrt(so * se);
        check('the modelled diurnal wind shape has not drifted further from Eskom',
              r >= 0.55,
              `hour-of-day correlation with Eskom's metered fleet is ${r.toFixed(2)}, `
              + `measured at 0.60 on 10 Sep 2026. This is a FLOOR, not a pass mark - the `
              + `shape is known to be wrong, with our trough four hours early. Do not treat `
              + `a pass here as the shape being right.`);
        notes.push(`diurnal wind shape: correlation ${r.toFixed(2)} with Eskom 2025 `
          + `(known gap, morning minimum missing)`);
      }
    }
  }

  console.log(`\n${pass}/${pass + fail} weather checks passed`);
  if (failures.length) { console.log('\nFAILURES:'); failures.forEach(f => console.log(f)); }
  if (notes.length) { console.log('\nNOTES:'); notes.forEach(n => console.log('  ' + n)); }
  process.exit(fail ? 1 : 0);
})();
