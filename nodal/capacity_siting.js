// GridTwin ZA - Capacity siting tool (browser-side)
// Reads the precomputed region_headroom_lookup.json (built offline in Python -
// see nodal/capacity_siting.py for the full method) and applies the same
// grid-build-charge formula, in plain JS with no dependencies.

const LINE_COST_PER_KM = 31_000_000;   // R, blended national average (DEE Minister, Apr 2025)
const LINE_LIFETIME_YEARS = 45;
const HOURS_PER_YEAR = 8760;

let headroomLookup = null;

async function loadHeadroomLookup() {
  if (headroomLookup) return headroomLookup;
  const res = await fetch('nodal/region_headroom_lookup.json');
  headroomLookup = await res.json();
  return headroomLookup;
}

async function evaluateDeployment(region, tech, requestedMw) {
  const lookup = await loadHeadroomLookup();
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
  const lengthKm = entry.corridor_length_km || 300;
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
