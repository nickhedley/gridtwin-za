#!/usr/bin/env node
/**
 * verify_deploy.js — check a LIVE deployment, not a local copy.
 *
 * Every other harness in this project tests the files on disk. This one fetches
 * what GitHub Pages is actually serving, because the failure modes after a
 * deploy are different from the failure modes in the code:
 *
 *   - a file was never uploaded, so fetch 404s and the feature degrades silently
 *   - a file was uploaded to the wrong directory (repo root instead of nodal/)
 *   - GitHub Pages has not rebuilt yet, so the old file is still being served
 *   - DATA_V was not bumped, so returning visitors get cached stale data
 *
 * None of those show up locally. All of them look like "the deploy worked".
 *
 *   node verify_deploy.js [base-url]
 *   node verify_deploy.js https://nickhedley.github.io/gridtwin-za
 */
const BASE = (process.argv[2] || 'https://nickhedley.github.io/gridtwin-za').replace(/\/$/, '');

let pass = 0, fail = 0;
const failures = [], notes = [];
const check = (name, ok, detail) => {
  if (ok) { pass++; console.log('  ok    ' + name); }
  else { fail++; failures.push(name + (detail ? '  —  ' + detail : ''));
         console.log('  FAIL  ' + name + (detail ? '  —  ' + detail : '')); }
};

// Files that must exist, and a marker that must appear inside each. The marker
// matters more than the 200: a stale file also returns 200, so presence alone
// proves nothing about whether the NEW version is live.
const FILES = [
  { path: '/index.html',                         marker: 'Capture rate by region',
    why: 'the capture panel added 18 Aug' },
  { path: '/index.html',                         marker: 'Curtailment forecast',
    why: 'the forecast panel added 18 Aug' },
  { path: '/index.html',                         marker: 'New lithium-ion batteries',
    why: 'the storage relabel' },
  { path: '/index.html',                         marker: 'Grid built beyond current plan',
    why: 'the headroom multiplier' },
  { path: '/index.html',                         marker: "font-family:'Archivo'",
    why: 'the KPI font change' },
  { path: '/nodal/nodal_dispatch.js',            marker: "DATA_V = '7'",
    why: 'the cache-buster bump — if this still says 6, returning visitors get stale data' },
  { path: '/nodal/corridor_electrical.json',     marker: 'series_compensation',
    why: 'the DC power flow parameters, a NEW file' },
  { path: '/nodal/regional_renewable_capacity.json', marker: 'Doornhoek',
    why: 'the Doornhoek addition' },
  { path: '/nodal/regional_renewable_capacity.json', marker: 'fingerprint',
    why: 'the recomputed fingerprint — a better staleness test than any text marker, '
       + 'since it changes on every edit' },
  { path: '/nodal/rooftop_mw_by_region.json',    marker: 'by-nc-nd',
    why: 'licence on a file that previously had no meta block at all' },
  { path: '/nodal/supply_area_split_draft.json', marker: 'Hartebeesthoek',
    why: 'the resolved queue' },
  { path: '/nodal/transmission_lines.geojson',   marker: 'sapp_planned',
    why: 'the SAPP planned interconnectors' },
  { path: '/gridtwin-3d.html',                   marker: 'Planned',
    why: 'the 3D map legend for planned links' },
];

// Files that must NOT exist. A stale copy in the wrong place is the runNodalYear
// trap: it reads as authoritative, nothing loads it, and editing it does nothing.
const SHOULD_NOT_EXIST = [
  { path: '/regional_renewable_capacity.json',
    why: 'belongs in nodal/ only — a root copy is stale and misleading' },
];

(async () => {
  console.log('\nverifying ' + BASE + '\n');

  for (const f of FILES) {
    try {
      const r = await fetch(BASE + f.path + '?cachebust=' + Date.now());
      if (!r.ok){ check(`${f.path} → ${f.marker}`, false, `HTTP ${r.status} — file missing or wrong path`); continue; }
      const t = await r.text();
      check(`${f.path} → ${f.marker}`, t.includes(f.marker),
            t.includes(f.marker) ? '' : `served, but ${f.why} is absent — old version still live, or Pages has not rebuilt`);
    } catch (e) {
      check(`${f.path} → ${f.marker}`, false, String(e).slice(0, 90));
    }
  }

  for (const f of SHOULD_NOT_EXIST) {
    try {
      const r = await fetch(BASE + f.path + '?cachebust=' + Date.now());
      check(`${f.path} is absent`, !r.ok, r.ok ? f.why : '');
    } catch { check(`${f.path} is absent`, true, ''); }
  }

  // Every data file the page fetches must actually resolve. A 404 here is the
  // quietest failure of all: the catch handler leaves the feature off and nothing
  // on screen says so.
  try {
    const idx = await fetch(BASE + '/index.html?cachebust=' + Date.now()).then(r => r.text());
    const nod = await fetch(BASE + '/nodal/nodal_dispatch.js?cachebust=' + Date.now()).then(r => r.text());
    const paths = [...new Set([...(idx + nod).matchAll(/fetch\(\s*[`'"]([^`'"?]+\.(?:json|csv|geojson))/g)]
      .map(m => m[1]).filter(p => !/^https?:/.test(p)))];
    let missing = [];
    for (const p of paths) {
      const r = await fetch(BASE + '/' + p.replace(/^\//, '') + '?cachebust=' + Date.now());
      if (!r.ok) missing.push(p + ' (' + r.status + ')');
    }
    check(`all ${paths.length} data files referenced by the page resolve`,
          missing.length === 0, missing.join(', '));
  } catch (e) {
    notes.push('could not enumerate data fetches: ' + String(e).slice(0, 80));
  }

  console.log(`\n${pass}/${pass + fail} deploy checks passed`);
  if (failures.length){
    console.log('\nWHAT TO DO:');
    console.log('  HTTP 404          the file was not uploaded, or went to the wrong folder');
    console.log('  marker absent     the old version is still live. GitHub Pages takes a minute');
    console.log('                    or two to rebuild — wait, then re-run. If it persists, the');
    console.log('                    upload did not replace the file.');
  }
  if (notes.length) notes.forEach(n => console.log('  note: ' + n));
  process.exit(fail ? 1 : 0);
})();
