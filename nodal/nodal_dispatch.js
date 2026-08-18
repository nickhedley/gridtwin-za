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
  const DATA_V = '7';
  // Exposed so index.html versions its own data fetches from the SAME value -
  // two independent version strings would drift and defeat the purpose.
  try { window.DATA_V = DATA_V; } catch(e){}
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

  // WHEELED-SOLAR DOUBLE COUNT (fixed 15 Aug 2026, matching the national engine):
  // Eskom's rooftop series is contractual, so the ~488 MW of ground-mounted
  // wheeled solar in by_source.private sits INSIDE rooftop_mw_by_region.json as
  // well. It generates as supply from the capacity file, so leaving it in the
  // rooftop netting counts it twice. Subtract per region, sharing the same
  // sourced number the capacity identities use - the rooftop file itself stays
  // verbatim Eskom.
  const _priv = (cap.by_source && cap.by_source.private && cap.by_source.private.solar_mw) || {};
  Object.keys(rooftopMw).forEach(r => {
    if (typeof rooftopMw[r] !== 'number') return;   // skip the meta block
    rooftopMw[r] = Math.max(0, rooftopMw[r] - (_priv[r] || 0));
  });

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

/* ============================================================================
 * runNodalYear() IS NOT WIRED UP. IT HAS NEVER RUN IN PRODUCTION.
 * ============================================================================
 * Retired 17 Aug 2026 after an audit found it is defined here, referenced only
 * in comments, and never called from index.html. The live "nodal" capability is
 * getNodalMIPInputs() below, which feeds the regional build optimiser - an
 * OPTIMISER over representative days, not an hourly dispatch.
 *
 * WHY IT WAS NOT REVIVED, having been considered as the basis for regional VPP
 * siting:
 *
 *   COST. 8,760 hours x 10 regions with a Dijkstra shortest-path routing per
 *   hour over the corridor graph, and the GET path runs the whole year TWICE -
 *   once to find congested corridors, once for real. Seconds to tens of seconds;
 *   it would need its own worker.
 *
 *   DUPLICATION. It answers the same questions as the national engine in
 *   simulate(). Two engines that must agree, with no reconciliation test between
 *   them, is a standing source of the exact divergence bugs this project has
 *   spent a lot of effort finding.
 *
 *   SCOPE. What it adds over the live MIP is temporal granularity on corridor
 *   flows - which hour a corridor is congested. That is an OPERATIONS question.
 *   GridTwin is a planning and project-development tool, and the MIP's
 *   representative-day resolution is the right one for that.
 *
 *   ITS ONE REAL ADVANTAGE - transmission losses, which the national engine does
 *   not model - turned out to be a non-issue. The demand series is Eskom's
 *   TRANSMISSION-LEVEL demand and is already gross of downstream losses: our
 *   206 TWh of grid demand against Eskom's 183 TWh of billed sales implies ~11%,
 *   matching Eskom's reported 9.1%. Adding a loss factor would double-count.
 *
 * DO NOT call this expecting it to match the rest of the model. If an hourly
 * nodal view is ever genuinely wanted, treat it as its own project, starting
 * with a reconciliation test against simulate().
 * ========================================================================== */

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

  // LOCATIONAL PRICES. A single-node model has one national price, so it cannot
  // show the thing that actually makes a battery money in a constrained network:
  // a region spilling renewables while another pays for diesel. genLog already
  // carries what each generator did and where, so the marginal price per region
  // can be derived from it - the dearest carrier serving that region in that
  // hour, or zero where the region is spilling.
  // WHO CAN SET THE PRICE.
  // Only dispatchable thermal plant sets the marginal price. Everything else is
  // a price-taker, and treating them otherwise produced a large artefact:
  // pricing hydro at its R80/MWh fuel cost made Hydra Central - which has 600 MW
  // of hydro and no coal - look like it cleared 365 arbitrage cycles a year at
  // R584k/MW, against 26 cycles and R182k on the single-node model.
  //
  //  - NUCLEAR is inflexible baseload. It runs flat out whatever the price, so
  //    it never sets it. Koeberg at R120/MWh as a price-setter was nonsense.
  //  - HYDRO is ENERGY-limited, not fuel-limited. A dam operator chooses when to
  //    release, and will not sell at R80 when the water can displace R546 coal
  //    later. Its opportunity cost is what it substitutes, so it prices at the
  //    thermal plant it displaces rather than at its fuel cost.
  //  - STORAGE (pumped and battery) arbitrages the price; letting it set the
  //    price would make the battery benchmark circular.
  //  - RENEWABLES bid at zero and do set the price when they are the only thing
  //    running - that is what a spilling hour is.
  const PRICE_SETTING = { coal: 546, ccgt: 2800, ocgt: 6100, diesel: 6100, imports: 550 };
  const PRICE_TAKER = new Set(['nuclear', 'hydro', 'ps', 'pumped', 'battery', 'batt', 'rmippp']);
  const locPrice = {};   // region -> Float64Array of hourly marginal price
  const locSpill = {};   // region -> hours spilling
  REGIONS.forEach(r => { locPrice[r] = new Float64Array(8760); locSpill[r] = 0; });

  for (let h = 0; h < 8760; h++) {
    const r = nodalEngineInstance.dispatchHour(h);
    REGIONS.forEach(reg => {
      byRegion[reg].demand += r.demand[reg];
      byRegion[reg].unserved += r.unserved[reg];
    });

    // Marginal price per region this hour.
    const dearest = {}, spilling = {};
    REGIONS.forEach(reg => { dearest[reg] = 0; spilling[reg] = false; });
    for (const g of r.genLog){
      const reg = g.region;
      if (dearest[reg] === undefined) continue;
      if ((g.curtailed || 0) > 1) spilling[reg] = true;
      if ((g.homeTake || 0) > 1){
        const car = foldCarrier(g.carrier);
        if (PRICE_TAKER.has(car)) continue;          // runs regardless of price
        const cost = PRICE_SETTING[car];
        if (cost !== undefined && cost > dearest[reg]) dearest[reg] = cost;
      }
    }
    // System marginal cost this hour: the dearest carrier running anywhere.
    let systemMarginal = 0;
    for (const reg of REGIONS) if (dearest[reg] > systemMarginal) systemMarginal = dearest[reg];
    REGIONS.forEach(reg => {
      if ((r.unserved[reg] || 0) > 1) locPrice[reg][h] = 87000;      // scarcity
      else if (spilling[reg]) { locPrice[reg][h] = 0; locSpill[reg]++; }
      // A region with no local generator on the margin is importing, so it pays
      // the system price rather than nothing.
      else locPrice[reg][h] = dearest[reg] > 0 ? dearest[reg] : systemMarginal;
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

  // Locational battery benchmark: perfect-foresight daily arbitrage on EACH
  // region's own price. A battery sited where renewables spill can charge at
  // zero and sell into the local evening, which a national average hides.
  function bessAt(price, hours, eff){
    eff = eff || 0.88;
    let rev = 0, cycles = 0;
    for (let d = 0; d < 365; d++){
      const day = [];
      for (let hh = 0; hh < 24; hh++) day.push(price[d*24 + hh]);
      const s = day.slice().sort((a, b) => a - b);
      const cIn = s.slice(0, hours).reduce((a,b) => a+b, 0) / hours;
      const dOut = s.slice(-hours).reduce((a,b) => a+b, 0) / hours;
      // Cap at diesel (R6,100), matching the single-node benchmark. Diesel is a
      // real dispatchable cost a battery displaces, so it is fairly capturable.
      // Value of lost load (R87,000) is not: a battery cannot reliably be
      // available for a scarcity event, and letting those hours through would
      // make this a lottery on a handful of days rather than an arbitrage measure.
      const capped = Math.min(dOut, 6100);
      const spread = capped * eff - cIn;
      if (spread > 0){ rev += spread * hours; cycles++; }
    }
    return { rev, cycles };
  }
  const bessByRegion = {};
  REGIONS.forEach(reg => {
    const p = locPrice[reg];
    let sum = 0; for (let i = 0; i < p.length; i++) sum += p[i];
    // Median, not mean: a handful of value-of-lost-load hours drags the mean to
    // five figures and tells you nothing about what a battery trades against.
    const sortedP = Float64Array.from(p); sortedP.sort();
    const medianP = sortedP[Math.floor(sortedP.length / 2)];
    const b4 = bessAt(p, 4), b2 = bessAt(p, 2);
    bessByRegion[reg] = {
      avgPrice: sum / p.length,
      medianPrice: medianP,
      spillHours: locSpill[reg],
      rev4h: b4.rev, cycles4h: b4.cycles,
      rev2h: b2.rev, cycles2h: b2.cycles,
    };
  });

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
    bessByRegion,  // {region: {avgPrice, spillHours, rev4h, cycles4h, rev2h, cycles2h}}
    curtailmentByRegion, // [{region, curtailedGwh, potentialGwh, curtailmentRatePct}]
    getsEnabled: !!getsEnabled,
    getBoostedCorridorCount: boostedEdgeIndices ? boostedEdgeIndices.size : 0,
    weekStacks, // {W:{stack:{carrier:Float64Array(168)}, loadS:Float64Array(168)}, S:{...}}
    runtimeMs,
  };
}

/**
 * Assemble everything the MIP optimiser needs for a network-aware solve:
 * per-region net load, corridor limits, coal units tagged by region, and
 * storage tagged by region. Reuses the nodal engine's own scenario setup so
 * the optimiser sees exactly the same system the dispatch engine would.
 */
/**
 * SITE-BASED VIRTUAL POWER PLANTS.
 *
 * vppByRegion is {region: controllableMW} - the behind-the-meter load a VPP can
 * actually dispatch in that region. Two effects, applied where the optimiser can
 * see them:
 *
 *   1. Controllable geysers move WITHIN each day, out of that region's highest
 *      net-load hours into its lowest. Water-filled rather than dumped, or the
 *      returning load just builds a new peak in the small hours - the same
 *      rebound that dogged Eskom's ripple control.
 *   2. Enrolled household batteries are added to that region's storage through
 *      the existing extraBattByRegion hook.
 *
 * Crucially this happens on REGIONAL net load, so a VPP sited in the Western
 * Cape relieves the Western Cape and changes what flows over its corridors -
 * which is the question a municipality actually has, and the reason a national
 * slider could not answer it.
 *
 * The shift is strictly energy-neutral per region per day: nothing is created,
 * only moved.
 */
function applyVppToRegionLoad(regionLoad, regionNames, vppByRegion) {
  if (!vppByRegion) return { shifted: regionLoad, movedMwhByRegion: {} };
  const moved = {};
  const out = regionLoad.map((arr, ri) => {
    const mw = vppByRegion[regionNames[ri]] || 0;
    moved[regionNames[ri]] = 0;
    if (!(mw > 0)) return arr;
    const a = Array.from(arr);
    const days = Math.floor(a.length / 24);
    for (let d = 0; d < days; d++) {
      const h0 = d * 24;
      const idx = [];
      for (let k = 0; k < 24; k++) idx.push({ h: h0 + k, v: a[h0 + k] });
      idx.sort((x, y) => y.v - x.v);
      // take from the six highest net-load hours, capped so no hour is gutted
      let took = 0;
      for (let k = 0; k < 6; k++) {
        const t = Math.min(mw, Math.max(0, a[idx[k].h] * 0.45));
        a[idx[k].h] -= t; took += t;
      }
      // water-fill into the twelve lowest, levelling rather than dumping
      const cand = idx.slice().sort((x, y) => x.v - y.v).slice(0, 12).map(c => c.h);
      let left = took;
      for (let pass = 0; pass < 24 && left > 1e-6; pass++) {
        const lvl = Math.min(...cand.map(h => a[h]));
        const at = cand.filter(h => a[h] <= lvl + 1e-6);
        const nxt = Math.min(...cand.map(h => a[h] > lvl + 1e-6 ? a[h] : Infinity));
        const room = nxt === Infinity ? Infinity : (nxt - lvl) * at.length;
        const put = Math.min(left, room === Infinity ? left : room);
        at.forEach(h => { a[h] += put / at.length; });
        left -= put;
      }
      moved[regionNames[ri]] += took;
    }
    return a;
  });
  return { shifted: out, movedMwhByRegion: moved };
}

async function getNodalMIPInputs(coalEafPct, coalDecomMW, extraWindByRegion, extraSolarByRegion,
                                 newRooftopMW, newBattMW, extraCoalByRegion, extraCcgtByRegion,
                                 extraNuclearByRegion, extraBattByRegion, coalFlexPct,
                                 newWindMW, newPvMW, syncFloorMW = 6000, vppByRegion = null) {
  const data = await loadNodalData();
  if (!nodalEngineInstance) nodalEngineInstance = new NodalEngine(data);

  nodalEngineInstance.setScenario(
    coalEafPct, coalDecomMW, extraWindByRegion || {}, extraSolarByRegion || {},
    newRooftopMW || 0, newBattMW || 0, extraCoalByRegion || {}, extraCcgtByRegion || {},
    extraNuclearByRegion || {}, extraBattByRegion || {}, coalFlexPct || 0, false, null,
    newWindMW || 0, newPvMW || 0, syncFloorMW
  );

  const eng = nodalEngineInstance;
  const regionLoadObj = eng.getRegionalNetLoad();
  let regionLoad = REGIONS.map(r => Array.from(regionLoadObj[r]));

  // Site-based VPP: reshape the chosen regions' net load before the optimiser
  // sees it. Done on a COPY - regionLoadObj comes from the engine's cached data
  // and mutating it would contaminate every later run.
  const vppApplied = applyVppToRegionLoad(regionLoad, REGIONS, vppByRegion);
  regionLoad = vppApplied.shifted;
  // Renewable potential (wind+solar+CSP annual MWh) per region - only available as a
  // side effect of the getRegionalNetLoad() call just made, must be read straight after.
  const renewablePotentialObj = eng.getRenewablePotential();
  const renewablePotentialMwh = REGIONS.map(r => renewablePotentialObj[r] || 0);

  // Coal units, tagged with their region index and MIP parameters
  const units = eng.thermalFleet
    .filter(g => g.carrier === 'coal' && g.capacityMw > 1)
    .map(g => ({
      name: g.name,
      cap: g.capacityMw,
      region: REGIONS.indexOf(g.region),
      msl: g.minStableFrac > 0 ? g.minStableFrac : 0.5,
      min_up: g.minUpTime > 0 ? Math.round(g.minUpTime) : 8,
      min_dn: g.minDownTime > 0 ? Math.round(g.minDownTime) : 4,
      startup_cost: g.startUpCost > 0 ? g.startUpCost : 50000,
      marginal_cost: g.marginalCost > 0 ? g.marginalCost : 600,
    }))
    .filter(u => u.region >= 0);

  // Storage by region
  const sto = [];
  REGIONS.forEach((r, ri) => {
    const ps = (typeof PS_MW_BY_REGION !== 'undefined' ? PS_MW_BY_REGION[r] : 0) || 0;
    if (ps > 0) sto.push({ name: r + ' pumped storage', region: ri, power: ps,
                           energy: ps * 20, eff: 0.76 });
    const bt = (eng.battMw && eng.battMw[r]) || 0;
    if (bt > 0) sto.push({ name: r + ' batteries', region: ri, power: bt,
                           energy: bt * 4, eff: 0.88 });
  });

  return { regions: REGIONS.slice(), regionLoad, corridors: eng.getCorridors(), units, sto,
           renewablePotentialMwh,
           vppShiftedMwhByRegion: vppApplied.movedMwhByRegion };
}
