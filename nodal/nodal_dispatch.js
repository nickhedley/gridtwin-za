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

  // Cache-buster on the DATA files, not just the scripts. Without it a browser happily serves a
  // stale profiles_regional.json or fleet CSV after the file has been replaced, so a data update
  // silently does nothing and looks like the deploy failed. Bump DATA_V whenever any of these change.
  const DATA_V = '6';
  const [demandText, profiles, cap, fleetText, rooftopMw, nationalProfiles] = await Promise.all([
    fetch(`nodal/demand_2025_regional.csv?v=${DATA_V}`).then(r => r.text()),
    fetch(`nodal/profiles_regional.json?v=${DATA_V}`).then(r => r.json()),
    fetch(`nodal/regional_renewable_capacity.json?v=${DATA_V}`).then(r => r.json()),
    fetch(`nodal/fleet_by_region_v2.csv?v=${DATA_V}`).then(r => r.text()),
    fetch(`nodal/rooftop_mw_by_region.json?v=${DATA_V}`).then(r => r.json()),
    fetch(`profiles.json?v=${DATA_V}`).then(r => r.json()),
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
      // Real per-unit unit-commitment parameters (PyPSA-RSA sourced, same fleet file). Defaults
      // are permissive so any unit missing a value behaves as it did before this was added.
      minStableFrac: parseFloat(r['Min Stable Level (%)']) || 0,
      rampUpFrac: parseFloat(r['Max Ramp Up (%/h)']) || 1,
      rampDownFrac: parseFloat(r['Max Ramp Down (%/h)']) || 1,
      minUpTime: parseFloat(r['Min Up Time (h)']) || 0,
      minDownTime: parseFloat(r['Min Down Time (h)']) || 0,
      startUpCost: parseFloat(r['Start Up Cost (R)']) || 0,
    };
  });

  // Real CSP from national profiles.json (Eskom 2021 measured data). Falls back to the engine's
  // own synthetic builder if unavailable, but that shape was materially wrong: zero output before
  // 10:00 while real SA CSP is at ~50% by 09:00.
  const cspPu = (nationalProfiles && nationalProfiles.csp_pu && nationalProfiles.csp_pu.length === 8760)
    ? Float64Array.from(nationalProfiles.csp_pu) : null;
  nodalDataCache = { demandByRegion, windPu, solarPu, windMw: cap.wind_mw, solarMw: cap.solar_mw, rooftopMw, fleet, cspPu };
  return nodalDataCache;
}

let nodalEngineInstance = null;

const WEEK_HOURS = { W: 3264, S: 7848 }; // same fixed representative-week offsets the single-node chart uses
const NODAL_DISP_ORDER = ['nuclear', 'hydro', 'imports', 'coal', 'ps', 'batt', 'ccgt', 'diesel', 'wind', 'pv', 'csp', 'unserved'];

// Same carrier-folding simplification used for the annual KPI merge (see index.html's
// nodalByCarrierToE): ocgt_avf->diesel, sasol_gas->ccgt, sasol_coal->coal. Applied per-hour here.
function foldCarrier(carrier) {
  if (carrier === 'sasol_coal') return 'coal';
  if (carrier === 'ocgt_avf') return 'diesel';
  // ocgt_diesel was missing here. Unmapped carriers fail the `if (ws.stack[k])` guard below and
  // are SILENTLY DROPPED from the chart stack - so every hour diesel OCGT ran (evening peaks,
  // 18:00-19:00) the stack fell short by exactly the diesel output, up to 2,072 MW. It also meant
  // diesel never appeared in the nodal chart at all, despite being dispatched.
  if (carrier === 'ocgt_diesel') return 'diesel';
  if (carrier === 'sasol_gas') return 'ccgt';
  if (carrier === 'solar') return 'pv';
  if (carrier === 'rmippp') return 'hydro';
  return carrier;
}

const GET_CONGESTION_THRESHOLD_PCT = 30; // avg utilisation above this = truly congested, worth a GET investment

/**
 * @returns {object} summary: {unservedPct, lossesPct, curtailedGwh, byRegion, byCarrier,
 *   corridorFlows, weekStacks: {W:{stack,loadS}, S:{stack,loadS}}, runtimeMs}
 */
async function runNodalYear(coalEafPct, coalDecomMW, extraWindByRegion, extraSolarByRegion, newRooftopMW, newBattMW,
                             extraCoalByRegion, extraCcgtByRegion, extraNuclearByRegion, extraBattByRegion, coalFlexPct, getsEnabled,
                             newWindMW, newPvMW, syncFloorMW = 6000) {
  const data = await loadNodalData();
  if (!nodalEngineInstance) nodalEngineInstance = new NodalEngine(data);

  let boostedEdgeIndices = null;
  if (getsEnabled) {
    // Baseline (no-GET) pass first, to find which corridors are ACTUALLY congested - GETs get
    // targeted only at those, not blanket-applied nationally (deploying dynamic line rating on
    // an already-idle corridor would be a real-world waste of money for zero benefit). This is a
    // lightweight pass: only edgeFlow is tracked, none of the full metric collection below, to
    // keep the added runtime reasonable. Includes newWindMW/newPvMW so congestion is detected
    // against the REAL, full scenario (auto-distributed wind/solar included), not one missing it.
    nodalEngineInstance.setScenario(coalEafPct, coalDecomMW, extraWindByRegion || {}, extraSolarByRegion || {}, newRooftopMW || 0, newBattMW || 0,
      extraCoalByRegion || {}, extraCcgtByRegion || {}, extraNuclearByRegion || {}, extraBattByRegion || {}, coalFlexPct || 0, false, null, newWindMW || 0, newPvMW || 0, syncFloorMW);
    const edgeMetaBaseline = nodalEngineInstance.edgeMeta;
    const baselineAnnualFlow = new Array(edgeMetaBaseline.length).fill(0);
    for (let h = 0; h < 8760; h++) {
      const r = nodalEngineInstance.dispatchHour(h);
      r.edgeFlow.forEach((f, i) => { baselineAnnualFlow[i] += f; });
    }
    boostedEdgeIndices = new Set();
    edgeMetaBaseline.forEach((e, i) => {
      const avgUtilPct = e.limit > 0 ? 100 * (baselineAnnualFlow[i] / 8760) / e.limit : 0;
      if (avgUtilPct >= GET_CONGESTION_THRESHOLD_PCT) boostedEdgeIndices.add(i);
    });
  }

  nodalEngineInstance.setScenario(coalEafPct, coalDecomMW, extraWindByRegion || {}, extraSolarByRegion || {}, newRooftopMW || 0, newBattMW || 0,
    extraCoalByRegion || {}, extraCcgtByRegion || {}, extraNuclearByRegion || {}, extraBattByRegion || {}, coalFlexPct || 0, getsEnabled || false, boostedEdgeIndices, newWindMW || 0, newPvMW || 0, syncFloorMW);

  const t0 = performance.now();
  let totalDemand = 0, totalUnserved = 0, totalLosses = 0, totalCurtailed = 0, totalRooftop = 0;
  let psDischarge = 0, battDischarge = 0;
  const byRegion = {};
  REGIONS.forEach(r => { byRegion[r] = { demand: 0, unserved: 0, curtailed: 0, renewablePotential: 0 }; });
  const byCarrier = {}; // annual MWh dispatched per carrier, national
  const edgeMeta = nodalEngineInstance.edgeMeta;
  const annualFlow = new Array(edgeMeta.length).fill(0);
  const peakFlow = new Array(edgeMeta.length).fill(0);

  // hourly capture for the two representative weeks (same shape the single-node dispatch chart uses)
  const weekStacks = {};
  ['W', 'S'].forEach(m => {
    const stack = {}; NODAL_DISP_ORDER.forEach(k => { stack[k] = new Float64Array(168); });
    weekStacks[m] = { stack, loadS: new Float64Array(168) };
  });

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
    totalRooftop += Object.values(r.rooftopGen).reduce((a, b) => a + b, 0);
    psDischarge += r.storage.psDischargeTotal;
    battDischarge += r.storage.battDischargeTotal;
    r.genLog.forEach(g => {
      byCarrier[g.carrier] = (byCarrier[g.carrier] || 0) + g.dispatched;
      if (g.carrier === 'wind' || g.carrier === 'solar') {
        byRegion[g.region].curtailed += g.curtailed;
        byRegion[g.region].renewablePotential += g.available;
      }
    });
    r.edgeFlow.forEach((f, i) => { annualFlow[i] += f; if (f > peakFlow[i]) peakFlow[i] = f; });

    // capture this hour if it falls in either representative week (168h windows)
    for (const mode of ['W', 'S']) {
      const idx = h - WEEK_HOURS[mode];
      if (idx < 0 || idx >= 168) continue;
      const ws = weekStacks[mode];
      // Demand line = grid demand + storage charging + network losses. Proven by single-hour
      // audit: at 07:00 baseline, dispatched 25,590 = netDemand 22,783 + charging 2,800 +
      // losses 7, exactly. This is correct accounting and reduces chart mismatches from 66/168
      // to 53/168 at baseline.
      // The RESIDUAL 53 hours are NOT a charting problem - they are an energy-conservation
      // violation in the engine. On any hour where storage both charges and discharges, total
      // generation exceeds netDemand + charging + losses by exactly the discharge amount (hour
      // 3272: fuelGen 26,215 = 23,403 + 2,800 + 12 exactly, yet storage also discharged 804 MW
      // with no matching sink). The discharge is not reducing the fuel requirement. Until that
      // is fixed the stack cannot balance on those hours, and storage charging should not be
      // added to this chart as a visible layer.
      // Demand line = netDemand + storage charging + losses + forced-coal curtailment.
      // forcedCurtailed is the surplus from the ramp-down and sync-floor passes where coal was
      // forced to generate but couldn't be absorbed — that generation IS in genLog.dispatched
      // so it's in the stack, but the demand line must also include it to balance.
      // Renewable curtailment is NOT included: those generators' dispatched figures already
      // exclude the curtailed portion, so they don't appear in the stack either.
      ws.loadS[idx] = Object.values(r.netDemand).reduce((a, b) => a + b, 0)
        + (r.storage ? (r.storage.psChargeTotal || 0) + (r.storage.battChargeTotal || 0) : 0)
        + (r.totalLosses || 0)
        + (r.forcedCurtailed || 0);
      ws.stack.unserved[idx] = Object.values(r.unserved).reduce((a, b) => a + b, 0);
      r.genLog.forEach(g => {
        const k = foldCarrier(g.carrier);
        if (ws.stack[k]) ws.stack[k][idx] += g.dispatched;
      });
    }
  }
  const runtimeMs = performance.now() - t0;

  const corridorFlows = edgeMeta.map((e, i) => {
    const isBoosted = nodalEngineInstance.getsEnabled && nodalEngineInstance.boostedEdgeIndices && nodalEngineInstance.boostedEdgeIndices.has(i);
    const effLimit = e.limit * (isBoosted ? 1.20 : 1); // 1.20 matches GET_UPLIFT_FRAC in nodal_engine.js
    return {
      regionA: REGIONS[e.a], regionB: REGIONS[e.b], limitMw: effLimit, baseLimitMw: e.limit, getBoosted: isBoosted, lengthKm: e.length,
      annualGwh: annualFlow[i] / 1e3, peakMw: peakFlow[i],
      peakUtilPct: effLimit > 0 ? 100 * peakFlow[i] / effLimit : 0,
      avgUtilPct: effLimit > 0 ? 100 * (annualFlow[i] / 8760) / effLimit : 0,
    };
  });

  // Curtailment rate (curtailed / potential renewable generation) per region - a rate, not raw
  // GWh, so a small region with little renewable capacity doesn't look artificially "fine" next
  // to a large one, and a heavily-built-out region's real severity is visible regardless of scale.
  const curtailmentByRegion = REGIONS.map(reg => {
    const b = byRegion[reg];
    return {
      region: reg,
      curtailedGwh: b.curtailed / 1e3,
      potentialGwh: b.renewablePotential / 1e3,
      curtailmentRatePct: b.renewablePotential > 0 ? 100 * b.curtailed / b.renewablePotential : 0,
    };
  });

  return {
    totalDemandTwh: totalDemand / 1e6,
    unservedGwh: totalUnserved / 1e3,
    unservedPct: 100 * totalUnserved / totalDemand,
    lossesPct: 100 * totalLosses / totalDemand,
    curtailedGwh: totalCurtailed / 1e3,
    rooftopTwh: totalRooftop / 1e6,
    storageGwh: (psDischarge + battDischarge) / 1e3,
    byRegion,
    byCarrier, // {carrier: annual MWh}
    corridorFlows, // [{regionA, regionB, limitMw, baseLimitMw, getBoosted, annualGwh, peakMw, peakUtilPct, avgUtilPct}]
    curtailmentByRegion, // [{region, curtailedGwh, potentialGwh, curtailmentRatePct}]
    getsEnabled: !!getsEnabled,
    getBoostedCorridorCount: boostedEdgeIndices ? boostedEdgeIndices.size : 0,
    weekStacks, // {W:{stack:{carrier:Float64Array(168)}, loadS:Float64Array(168)}, S:{...}}
    runtimeMs,
  };
}
