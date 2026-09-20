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

// ── SHARED GRID-BUILD FORMULA ────────────────────────────────────────────────────────────
// Extracted 20 Sep 2026. The same arithmetic existed in evaluateDeployment below and in
// index.html's evaluateAgainstRemaining, and the engine needed a third copy to cost national
// slider capacity. Rule 6: no constant appears twice, and that applies to formulas.
//
// PURE AND SYNCHRONOUS. The async in the callers is only the data fetch; the logic never
// needed to be. simulate() cannot await, so it needs this shape.
//
// @param entry  a region/tech record from region_headroom_lookup.json
// @param mw     capacity seeking connection
// @param opts   { alreadyMw, getsOn, getUpliftFrac, getCostPerKm, getLifeYears }
function gridBuildChargeFor(entry, mw, opts) {
  opts = opts || {};
  if (!entry || !(mw > 0)) return { shortfallMw: 0, getPortionMw: 0, annualR: 0, chargeRPerMWh: 0 };
  const remaining = Math.max(0, (entry.headroom_mw || 0) - (opts.alreadyMw || 0));
  const uplift    = opts.getsOn ? (opts.getUpliftFrac || 0) : 0;
  const boosted   = remaining * (1 + uplift);
  const km        = entry.corridor_length_km || 300;
  const cf        = entry.avg_capacity_factor || 0.3;

  if (mw <= remaining) return { shortfallMw: 0, getPortionMw: 0, annualR: 0, chargeRPerMWh: 0 };

  const getPortionMw = opts.getsOn ? Math.min(mw, boosted) - remaining : 0;
  const shortfallMw  = Math.max(0, mw - boosted);

  // Grid-enhancing technologies are cheap uplift on an existing corridor; beyond them the
  // corridor needs new line at LINE_COST_PER_KM over LINE_LIFETIME_YEARS.
  //
  // LINES SCALE WITH THE SHORTFALL, from 20 Sep 2026. This charged exactly ONE line however
  // large the shortfall, which is right for a single siting request of a few hundred MW and
  // absurd for a national build: Deep decarbonisation and Fossil-free 2040 came out with an
  // identical R1.21bn despite one putting 77 GW beyond headroom and the other 130 GW.
  //
  // LINE_MW_PER_CIRCUIT is derived from the model's own corridor data rather than assumed:
  // corridor_electrical.json gives MVA and line counts together - Hydra to Northern Cape
  // 3,300 MVA on 4 lines, Gauteng to North West 6,800 on 7, Gauteng to Mpumalanga 14,600 on
  // 14 - which is 825 to 1,040 MVA a circuit. 900 is the middle.
  //
  // Fractional circuits are kept rather than rounded up: a national figure is a blend of many
  // corridors, so rounding every one up would overstate systematically.
  const circuits = shortfallMw / LINE_MW_PER_CIRCUIT;
  const getAnnualR  = getPortionMw > 0
    ? km * (opts.getCostPerKm || 0) / (opts.getLifeYears || 1) : 0;
  const lineAnnualR = shortfallMw > 0
    ? circuits * km * LINE_COST_PER_KM / LINE_LIFETIME_YEARS : 0;
  const annualR = getAnnualR + lineAnnualR;

  const energyMwh = (getPortionMw + shortfallMw) * cf * HOURS_PER_YEAR;
  return { shortfallMw, getPortionMw, annualR,
           chargeRPerMWh: energyMwh > 0 ? annualR / energyMwh : 0 };
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
async function evaluateDeployment(region, tech, requestedMw) {
  const lookup = FIRM_TECHS.includes(tech) ? await loadFirmHeadroomLookup() : await loadHeadroomLookup();
  const entry = lookup[region][tech];
  const headroom = entry.headroom_mw;

  if (requestedMw <= headroom) {
    return {
      region, tech, requestedMw, headroomMw: headroom,
      gridBuildNeeded: false,
      shortfallMw: 0,
      gridBuildChargeRPerMWh: 0,
      note: `Fits within existing grid headroom (${headroom} MW available) - no new transmission needed.`
    };
  }

  const shortfallMw = requestedMw - headroom;
  const lengthKm = entry.corridor_length_km || 300; // fallback if no corridor identified
  const capex = lengthKm * LINE_COST_PER_KM;
  const annualCapex = capex / LINE_LIFETIME_YEARS;
  const annualEnergyMwh = shortfallMw * entry.avg_capacity_factor * HOURS_PER_YEAR;
  const gridChargePerMwh = annualEnergyMwh > 0 ? annualCapex / annualEnergyMwh : NaN;

  return {
    region, tech, requestedMw, headroomMw: headroom,
    gridBuildNeeded: true,
    shortfallMw,
    bindingCorridor: entry.binding_corridor,
    corridorLengthKm: lengthKm,
    newLineCapexR: Math.round(capex),
    annualisedCapexRPerYear: Math.round(annualCapex),
    gridBuildChargeRPerMWh: Math.round(gridChargePerMwh * 10) / 10,
    note: `${shortfallMw.toFixed(0)} MW exceeds headroom on ${entry.binding_corridor || 'the export path'}. ` +
          `Reinforcing that corridor (~${lengthKm} km) costs an estimated R${(capex/1e6).toFixed(0)}m, ` +
          `adding R${gridChargePerMwh.toFixed(1)}/MWh to the shortfall portion's generation cost.`
  };
}

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
