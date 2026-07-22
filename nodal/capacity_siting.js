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

/**
 * Evaluate a user's proposed deployment.
 * @param {string} region - e.g. "Northern Cape"
 * @param {string} tech - "wind" or "solar"
 * @param {number} requestedMw
 * @returns {object} result with headroom, shortfall, and grid-build charge if any
 */
async function evaluateDeployment(region, tech, requestedMw) {
  const lookup = await loadHeadroomLookup();
  const entry = lookup[region][tech];
  const
