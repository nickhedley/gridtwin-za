// GridTwin ZA - Capacity siting tool (browser-side)
// Reads the precomputed region_headroom_lookup.json (wind/solar - built offline in Python, see
// nodal/capacity_siting.py) and firm_headroom_lookup.json (coal/CCGT/nuclear - built offline in
// Node, see nodal/build_firm_headroom.js), applying the same grid-build-charge formula either way.

const LINE_COST_PER_KM = 31_000_000;   // R, blended national average (DEE Minister, Apr 2025)
const LINE_LIFETIME_YEARS = 45;
// MW a single transmission circuit carries. From corridor_electrical.json, which gives MVA
// and line counts per corridor: 825 to 1,040 MVA a circuit across the network.
const LINE_MW_PER_CIRCUIT = 900;
const HOURS_PER_YEAR = 8760;
const FIRM_TECHS = ['coal', 'ccgt', 'nuclear', 'batt'];

let headroomLookup = null;
let firmHeadroomLookup = null;

async function loadHeadroomLookup() {
  if (headroomLookup) return headroomLookup;
  const res = await fetch('nodal/region_headroom_lookup.json');
  headroomLookup = await res.json();
  return headroomLookup;
}

async function loadFirmHeadroomLookup() {
  if (firmHeadroomLookup) return firmHeadroomLookup;
  const res = await fetch('nodal/firm_headroom_lookup.json');
  firmHeadroomLookup = await res.json();
  return firmHeadroomLookup;
}
// RETIRED 23 Sep 2026: gridBuildChargeFor and evaluateDeployment.
//
// Both priced a connection with their own arithmetic - corridor length times a cost per km over
// a line lifetime - while the engine and the siting panel priced the same megawatt with the
// tiered regional charge in index.html. Two formulas for one cost is how they drift apart, and
// neither had a caller left once the panel was wired to txTierCharge.
//
// What this file still provides, and what the page uses: loadHeadroomLookup,
// loadFirmHeadroomLookup, tdpHeadroomMW and the FIRM_TECHS list.


// ── HEADROOM GROWS. THE TDP BUILDS LINE. ─────────────────────────────────────────────────
// Added 20 Sep 2026. Until then the reinforcement charge used a 2025 GCCA snapshot for every
// scenario year, so a 2040 run paid to build transmission the Transmission Development Plan
// has already planned. 10,209 km of it, concentrated exactly where headroom is zero -
// Northern Cape 4,737 km, Western Cape 1,159, Eastern Cape 1,047.
//
// CIRCUIT CAPACITY, not route length. A 300 km line and a 30 km line each carry one circuit;
// kilometres drive COST, circuits drive CAPACITY. 400 kV at 900 MW matches LINE_MW_PER_CIRCUIT
// derived from corridor_electrical.json; 765 kV carries roughly three times that.
const TDP_KV_MW = { 400: 900, 765: 3000, 275: 600 };

// PHASE CONFIDENCE. The TDP's own metadata says it is explicitly NOT an investment decision:
// Execution is committed and under way, Definition is in detailed design, and Concept and
// Pre-Concept are indicative and likely to change, with NTCSA stating the first five years
// carry high certainty and beyond 2030 is more uncertain.
//
// Only 17% of the planned capacity is in Execution. Counting all 103 GW as delivered would be
// as wrong as ignoring it. These weights are a JUDGEMENT, not a published probability - they
// are here to be argued with, and the tdpConfidencePct control scales all of them at once.
const TDP_PHASE_CONF = { 'Execution':1.0, 'Definition':0.8, 'Planned':0.6,
                         'Concept':0.3, 'Pre-Concept':0.15 };

// Headroom a region has gained from TDP lines commissioned by `year`, MW.
function tdpHeadroomMW(projects, region, year, confidenceFrac) {
  if (!projects || !projects.length) return 0;
  const scale = (confidenceFrac == null ? 1 : confidenceFrac);
  let mw = 0;
  for (const p of projects) {
    if (p.kind !== 'line') continue;
    if (p.prov !== region) continue;
    if ((p.year || 9999) > year) continue;
    const cap  = TDP_KV_MW[p.kv] || TDP_KV_MW[400];
    const conf = TDP_PHASE_CONF[p.phase];
    mw += cap * (conf == null ? 0.6 : conf) * scale;
  }
  return mw;
}

// ── WHERE NATIONAL BUILD GOES ────────────────────────────────────────────────────────────
// Share of new capacity by province, from the 2,597 DFFE REEA environmental authorisations
// in nodal/reea_projects.json - where developers have actually applied to build.
//
// REVEALED PREFERENCE, NOT PLANNING. Allocating by headroom would assume perfect siting and
// make congestion vanish; developers chase resource, which is exactly why the Cape is full.
// 90% of authorised WIND is in the three Cape provinces, all with ZERO headroom. Solar is far
// more spread, and Free State, North West and Limpopo hold both pipeline and headroom.
//
// Computed 20 Sep 2026 from 56,848 MW of authorised wind and 160,212 MW of solar. Recompute
// when the REEA file is refreshed - shares, not absolutes, so the file growing does not
// invalidate them, but the distribution shifting does.
const REEA_SHARE = {
  wind: { 'Northern Cape':0.4563,'Western Cape':0.2530,'Eastern Cape':0.1950,'Mpumalanga':0.0472,
          'Limpopo':0.0211,'Kwazulu Natal':0.0168,'Free State':0.0073,'Gauteng':0.0018,
          'North West':0.0018 },
  solar:{ 'Northern Cape':0.3688,'Free State':0.1938,'North West':0.1180,'Western Cape':0.1178,
          'Limpopo':0.1023,'Gauteng':0.0414,'Mpumalanga':0.0276,'Eastern Cape':0.0239,
          'Kwazulu Natal':0.0064 },
};

/**
 * Evaluate a user's proposed deployment.
 * @param {string} region - e.g. "Northern Cape"
 * @param {string} tech - "wind", "solar", "coal", "ccgt", or "nuclear"
 * @param {number} requestedMw
 * @returns {object} result with headroom, shortfall, and grid-build charge if any
 */

// Example wiring for a simple form:
//
// <select id="regionSelect">...</select>
// <select id="techSelect"><option value="wind">Wind</option><option value="solar">Solar</option></select>
// <input id="mwInput" type="number" value="500">
// <button onclick="runDeployment()">Check</button>
// <div id="result"></div>
//
// async function runDeployment() {
//   const region = document.getElementById('regionSelect').value;
//   const tech = document.getElementById('techSelect').value;
//   const mw = parseFloat(document.getElementById('mwInput').value);
//   const result = await evaluateDeployment(region, tech, mw);
//   document.getElementById('result').innerText = result.note;
// }
