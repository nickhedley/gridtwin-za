// GridTwin ZA - browser-side loader/runner for the nodal dispatch engine (nodal_engine.js)
// Fetches the real regional data files on demand (not on page load) and runs a full year.

let nodalDataCache = null;

function parseCSVText(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',');
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(',');
    const row = {};
    headers.forEach((h, j) => { row[h] = vals[j]; });
    rows.push(row);
  }
  return rows;
}

async function loadNodalData() {
  if (nodalDataCache) return nodalDataCache;

  const [demandText, profiles, cap, fleetText] = await Promise.all([
    fetch('nodal/demand_2025_regional.csv').then(r => r.text()),
    fetch('nodal/profiles_regional.json').then(r => r.json()),
    fetch('nodal/regional_renewable_capacity.json').then(r => r.json()),
    fetch('nodal/fleet_by_region_v2.csv').then(r => r.text()),
  ]);

  const demandRows = parseCSVText(demandText);
  const demandByRegion = {};
  REGIONS.forEach(r => { demandByRegion[r] = new Float64Array(8760); });
  demandRows.forEach((row, i) => {
    REGIONS.forEach(r => { demandByRegion[r][i] = parseFloat(row[r + '_corrected']); });
  });

  const windPu = {}, solarPu = {};
  REGIONS.forEach(r => {
    windPu[r] = Float64Array.from(profiles.wind_pu[r]);
    solarPu[r] = Float64Array.from(profiles.solar_pu[r]);
  });

  const fleetRows = parseCSVText(fleetText);
  const fleet = fleetRows.filter(r => r.Scenario === 'BASE').map(r => {
    const hr = parseFloat(r['Heat Rate (GJ/MWh)']) || 0;
    const fp = parseFloat(r['Fuel Price (R/GJ)']) || 0;
    const vom = parseFloat(r['Variable O&M Cost (R/MWh)']) || 0;
    const decomRaw = r['Decommissioning Date'];
    const decomYear = (decomRaw === '-' || !decomRaw) ? Infinity : parseInt(decomRaw, 10);
    return {
      name: r['Power Station Name'], region: r['region'], carrier: r['Carrier'],
      capacityMw: parseFloat(r['Capacity (MW)']), marginalCost: hr * fp + vom, decomYear,
    };
  });

  nodalDataCache = { demandByRegion, windPu, solarPu, windMw: cap.wind_mw, solarMw: cap.solar_mw, fleet };
  return nodalDataCache;
}

let nodalEngineInstance = null;

/**
 * Run a full nodal year with the given scenario parameters. Loads data on first call
 * (cached after that - the engine object itself is also reused across calls).
 * @returns {object} summary: {unservedPct, lossesPct, curtailedGwh, byRegion, runtimeMs}
 */
async function runNodalYear(coalEafPct, coalDecomMW, extraWindByRegion, extraSolarByRegion) {
  const data = await loadNodalData();
  if (!nodalEngineInstance) nodalEngineInstance = new NodalEngine(data);
  nodalEngineInstance.setScenario(coalEafPct, coalDecomMW, extraWindByRegion || {}, extraSolarByRegion || {});

  const t0 = performance.now();
  let totalDemand = 0, totalUnserved = 0, totalLosses = 0, totalCurtailed = 0;
  const byRegion = {};
  REGIONS.forEach(r => { byRegion[r] = { demand: 0, unserved: 0 }; });

  for (let h = 0; h < 8760; h++) {
    const r = nodalEngineInstance.dispatchHour(h);
    REGIONS.forEach(reg => {
      byRegion[reg].demand += r.demand[reg];
      byRegion[reg].unserved += r.unserved[reg];
    });
    totalDemand += Object.values(r.demand).reduce((a, b) => a + b, 0);
    totalUnserved += Object.values(r.unserved).reduce((a, b) => a + b, 0);
    totalLosses += r.totalLosses;
    totalCurtailed += r.totalCurtailed;
  }
  const runtimeMs = performance.now() - t0;

  return {
    totalDemandTwh: totalDemand / 1e6,
    unservedGwh: totalUnserved / 1e3,
    unservedPct: 100 * totalUnserved / totalDemand,
    lossesPct: 100 * totalLosses / totalDemand,
    curtailedGwh: totalCurtailed / 1e3,
    byRegion,
    runtimeMs,
  };
}
