#!/usr/bin/env node
/**
 * validate_geo.js — the SA boundary clamp, and region assignment.
 *
 * WHY THIS EXISTS. On 30 Aug 2026 the SA_POLY boundary in index.html was found to
 * exclude NINE of eighteen real South African towns — all of Limpopo, plus
 * Rustenburg, Mahikeng and Gqeberha. Its northern edge ran as a single diagonal that
 * capped the country at -25.5 near Polokwane, roughly 180 km south of the town.
 *
 * Clicking those places did NOTHING. No error, no message, no console warning: the
 * point was rejected before any region was resolved, so the map simply looked dead.
 * It had been that way for months and no harness noticed, because until now nothing
 * in the suite looked at geography at all.
 *
 * TWO DIRECTIONS, and both matter. A clamp that accepts everything is not a clamp,
 * so the negative cases are as important as the positive ones — the easy "fix" for a
 * too-tight polygon is one that lets the ocean in.
 *
 *   node validate_geo.js [root]
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.argv[2] || '.';
let pass = 0, fail = 0;
const failures = [];
const check = (name, ok, detail) => {
  if (ok) pass++; else { fail++; failures.push(`  ${name}${detail ? '  —  ' + detail : ''}`); }
};

// Real places inside South Africa. Spread deliberately: Limpopo is over-represented
// because that is where the old polygon failed, and the coast is included because a
// boundary drawn too generously offshore is the opposite failure.
const INSIDE = [
  ['Polokwane', 29.45, -23.90], ['Musina', 30.04, -22.35], ['Thohoyandou', 30.48, -22.95],
  ['Mokopane', 29.01, -24.19], ['Lephalale', 27.74, -23.67], ['Tzaneen', 30.16, -23.83],
  ['Nelspruit', 30.97, -25.47], ['Emalahleni', 29.23, -25.87], ['Rustenburg', 27.24, -25.67],
  ['Mahikeng', 25.64, -25.86], ['Kimberley', 24.77, -28.74], ['Upington', 21.25, -28.45],
  ['Johannesburg', 28.05, -26.20], ['Durban', 31.02, -29.86], ['Cape Town', 18.42, -33.93],
  ['Gqeberha', 25.60, -33.96], ['Bloemfontein', 26.21, -29.12], ['Newcastle', 29.93, -27.75],
  ['Springbok', 17.89, -29.66], ['Richards Bay', 32.05, -28.78], ['Saldanha', 17.94, -33.01],
  // Places that matter to this model specifically
  ['De Aar (Hydra)', 24.01, -30.65], ['Noupoort (Koruson)', 24.95, -31.19],
  ['Humansdorp (Impofu)', 24.77, -34.03], ['Sutherland (Karoo)', 20.66, -32.40],
];

// Outside. Neighbours and open ocean.
const OUTSIDE = [
  ['Windhoek, Namibia', 17.08, -22.56], ['Gaborone, Botswana', 25.91, -24.65],
  ['Bulawayo, Zimbabwe', 28.58, -20.15], ['Maputo, Mozambique', 32.58, -25.97],
  ['Harare, Zimbabwe', 31.05, -17.83], ['Lusaka, Zambia', 28.28, -15.41],
  ['Walvis Bay, Namibia', 14.51, -22.96],
  ['Atlantic, 400 km west', 13.00, -32.00], ['Indian Ocean, east', 35.00, -30.00],
  ['Southern Ocean', 20.00, -38.00],
];

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

// Pull SA_POLY straight out of the source. Parsing rather than executing keeps this
// harness free of jsdom, so it runs in a second.
const i = html.indexOf('const SA_POLY');
if (i < 0) { console.log('\nFATAL: SA_POLY not found in index.html'); process.exit(1); }
const block = html.slice(i, html.indexOf('];', i));
const poly = [...block.matchAll(/\[\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\]/g)]
  .map(m => [parseFloat(m[1]), parseFloat(m[2])]);

function inside(lng, lat){
  let c = false;
  for (let a = 0, b = poly.length - 1; a < poly.length; b = a++){
    const [xi, yi] = poly[a], [xj, yj] = poly[b];
    if (((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)) c = !c;
  }
  return c;
}

console.log(`\nSA BOUNDARY CLAMP  (${poly.length} vertices)`);
check('SA_POLY has enough vertices to trace a border', poly.length >= 30,
      `${poly.length} vertices — a coarse outline is how Limpopo was excluded`);
check('SA_POLY is closed', poly.length > 2
      && poly[0][0] === poly[poly.length-1][0] && poly[0][1] === poly[poly.length-1][1],
      'first and last vertex differ');

let inFail = 0;
for (const [n, lng, lat] of INSIDE){
  const ok = inside(lng, lat);
  if (!ok) inFail++;
  check(`${n} is inside South Africa`, ok,
        `(${lng}, ${lat}) rejected — clicking here does NOTHING, silently`);
}
let outFail = 0;
for (const [n, lng, lat] of OUTSIDE){
  const ok = !inside(lng, lat);
  if (!ok) outFail++;
  check(`${n} is outside South Africa`, ok,
        `(${lng}, ${lat}) accepted — the clamp is too generous to be a clamp`);
}

console.log(`  ${INSIDE.length - inFail}/${INSIDE.length} real SA locations accepted`);
console.log(`  ${OUTSIDE.length - outFail}/${OUTSIDE.length} foreign and ocean points rejected`);
// ── SUBSTATION REGISTER COMPLETENESS ────────────────────────────────────────
// A CLOSED-LOOP TEST, needing no external data. Every transmission line records the
// substation at each end. Any endpoint NOT in substations_compact.json is a missing
// substation, and the two files come from different sources - the lines from Eskom TDP
// and SAPP planning data, the substations from DBSA, OSM, Eskom and shapefiles - so
// they do not share a blind spot by construction.
//
// WHY THIS EXISTS. On 28 Aug 2026 the nearest-substation method was falsified at
// Impofu: it returned Grassridge at 106.9 km when the line actually built runs to
// Chatty, which is NEARER at 93.3 km and was simply absent from the register. One
// missing substation had distorted the connection picture for 1.4 GW of Eastern Cape
// wind. The method is only as good as the register, so the register needs a test.
//
// WHAT IT PROVES AND DOES NOT. Necessary, not sufficient: a substation with no line in
// the line register would not be caught. It cannot prove the register is complete - it
// can only find a specific, common kind of gap, which is what it did for Chatty.
{
  const geo = JSON.parse(fs.readFileSync(path.join(ROOT, 'nodal/transmission_lines.geojson'), 'utf8'));
  const reg = JSON.parse(fs.readFileSync(path.join(ROOT, 'nodal/substations_compact.json'), 'utf8'));
  const have = new Set(reg.subs.map(x => String(x.n).toUpperCase().trim()));
  // Foreign endpoints and country names are correctly absent from a SOUTH AFRICAN
  // register - SAPP interconnectors stop at the border by design.
  // Foreign endpoints are correctly absent from a South African register - Sapp
  // interconnectors stop at the border by design.
  //
  // RASSONA GARCIA added 30 Aug 2026. It is Ressano Garcia, the Mozambique border town,
  // misspelled in the line register. It sat in the "missing substations" list purely
  // because the filter matched on spelling. A gap list is only as good as the filter in
  // front of it, and a misspelled foreign name looks exactly like a missing domestic one.
  const FOREIGN = /ZAMBIA|ZIMBABWE|BOTSWANA|NAMIBIA|MOZAMBIQUE|ANGOLA|LESOTHO|ESWATINI|SWAZILAND|CAHORA|MAPUTO|PHOKOJE|INSUKAMINI|HARIB|KOKERBOOM|EDWALENI|RASSONA|RESSANO|TANZANIA|MALAWI|^SOUTH AFRICA$/;
  // Generation sites named as an endpoint are plants, not substations.
  const PLANT = /PHEZUKOMOYA|SAN KRAAL|IMPOFU/;
  const box = c => c[0] >= 20.5 && c[0] <= 26.5 && c[1] >= -33.5 && c[1] <= -29.0;

  const scan = (filterKaroo) => {
    const miss = new Set();
    let nLines = 0;
    for (const f of geo.features){
      const g = f.geometry && f.geometry.coordinates; if (!g) continue;
      if (filterKaroo && !g.some(box)) continue;
      nLines++;
      for (const k of ['start', 'end']){
        const v = String(f.properties[k] || '').toUpperCase().trim();
        if (!v || FOREIGN.test(v) || PLANT.test(v)) continue;
        // NAME NORMALISATION. The line register uses suffixes the substation register
        // does not: "KAPPA (A)" is the Kappa substation, "ZWAVELPOORT EE1" is
        // Zwavelpoort. Comparing raw strings reported both as missing when one of them
        // is simply present under a shorter name. Strip a trailing bracketed unit
        // designator and common suffixes before deciding a substation is absent.
        const norm = x => x.replace(/\s*\([A-Z0-9]+\)\s*$/, '')
                           .replace(/\s+(EE\d+|MTS|DS|SS)$/, '').trim();
        if (!have.has(v) && !have.has(norm(v))) miss.add(v);
      }
    }
    return { miss: [...miss], nLines };
  };

  const karoo = scan(true);
  console.log(`\nSUBSTATION REGISTER  (${reg.subs.length} substations, ${geo.features.length} lines)`);
  console.log(`  Karoo box: ${karoo.nLines} lines crossing it`);
  check('every Karoo line endpoint is in the substation register', karoo.miss.length === 0,
        `missing: ${karoo.miss.join(', ')} — the Hydra Central split uses nearest-substation `
        + `matching over exactly this area, and Impofu showed what one absent substation costs`);

  // PLANNED FLAGS. Audited 30 Aug 2026 after an attempt to use `planned` as a matching
  // filter reassigned 205 REEA projects away from a substation that is almost certainly
  // built. The flag records what the DBSA register said AT INGEST, not whether the thing
  // exists. This asserts the meaning is documented, so the next person reads it before
  // reaching for the filter.
  {
    const planned = reg.subs.filter(x => x.planned);
    const disputed = planned.filter(x => x.planned_disputed);
    check('the meaning of the planned flag is documented in the data file',
          !!(reg.meta && reg.meta.planned_flag_meaning),
          'meta.planned_flag_meaning absent - without it `planned` reads as "does not exist"');
    console.log(`  planned flags: ${planned.length}, of which ${disputed.length} disputed`
      + (disputed.length ? ` (${disputed.map(x => x.n).join(', ')})` : ''));
  }

  const all = scan(false);
  // National coverage is reported, not asserted: the line register names endpoints this
  // project has no obligation to hold, and failing on those would be noise.
  // Reported, not asserted: the line register names endpoints this project has no
  // obligation to hold, and failing on those would be noise. Three remain, all real:
  // Durban South and Ottawa in KwaZulu-Natal, Zwavelpoort east of Pretoria. They are
  // outside the Karoo, so they do not affect the Hydra Central split - but they would
  // matter if nearest-substation matching is used nationally, which is exactly how
  // Impofu went wrong.
  console.log(`  national: ${all.miss.length} domestic endpoints absent from the register`
    + (all.miss.length ? ` — ${all.miss.slice(0, 8).join(', ')}` : ''));
  if (all.miss.length > 3)
    console.log('    more than expected — check whether a naming variant or foreign '
      + 'endpoint is being counted as a gap before hunting for coordinates');
  console.log(`  Karoo endpoints ${karoo.miss.length === 0 ? 'COMPLETE' : 'INCOMPLETE'} `
    + `against the line register — necessary, not sufficient`);
}

console.log(`\n${pass}/${pass + fail} geography checks passed`);
if (failures.length){ console.log('\nFAILURES:'); failures.forEach(f => console.log(f)); }
process.exit(fail ? 1 : 0);
