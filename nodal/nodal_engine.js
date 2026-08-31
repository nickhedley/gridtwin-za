// GridTwin ZA - Nodal dispatch-with-flows engine (JS port of nodal_engine.py)
// Designed to run identically in Node (for testing/validation) and the browser.
// Takes pre-parsed plain data structures - no file I/O here, that's the caller's job.

const REGIONS = ['Eastern Cape','Limpopo','Mpumalanga','Gauteng','Western Cape',
                  'Northern Cape','Hydra Central','Kwazulu Natal','North West','Free State'];

// Same real corridor topology as nodal_engine.py (derived from actual line geometries)
const CORRIDORS = [
  ['Eastern Cape','Hydra Central', 1124, 295],
  ['Eastern Cape','Free State', 455, 408],
  ['Eastern Cape','Kwazulu Natal', 813, 167],
  ['Free State','Gauteng', 1446, 202],
  ['Free State','Kwazulu Natal', 427, 450],
  ['Free State','Mpumalanga', 2609, 347],
  ['Gauteng','Limpopo', 4041, 271],
  ['Gauteng','Mpumalanga', 13318, 102],
  ['Gauteng','North West', 5680, 84],
  ['Hydra Central','Northern Cape', 754, 187],
  ['Hydra Central','Western Cape', 2377, 278],
  ['Kwazulu Natal','Mpumalanga', 6552, 172],
  ['Limpopo','North West', 5922, 212],
  ['Mpumalanga','North West', 599, 268],
  ['North West','Western Cape', 233, 1139],
  ['Northern Cape','Western Cape', 823, 164],
  ['Limpopo','Mpumalanga', 5138, 121],
  ['Free State','Hydra Central', 2763, 310],
  ['Free State','Northern Cape', 2439, 90],
  ['North West','Northern Cape', 663, 229],
  ['Free State','North West', 651, 235],
];

const LOSS_BASE_RATE = 0.035; // 3.5% per 1000km at full rated flow (quadratic in loading)

function lossFraction(lengthKm, flowMw, limitMw) {
  if (limitMw <= 0) return 0;
  const loading = Math.min(Math.abs(flowMw) / limitMw, 1.0);
  return LOSS_BASE_RATE * (lengthKm / 1000.0) * (loading * loading);
}

// Real pumped-storage siting (verified via actual GCCA boundary polygons):
// Ingula (1332MW) + Drakensberg (1000MW) both land in KwaZulu Natal despite straddling the
// KZN/Free State escarpment - the real supply-area boundary, not the province line, decides it.
// Palmiet (400MW) + an estimate for the smaller municipally-owned Steenbras scheme -> Western Cape.
// Energy (MWh) split proportionally to power - individual schemes have different real durations
// (Drakensberg ~27.6h, Ingula ~4-5h, Palmiet less) but that detail isn't in our data; flagged.
const PS_MW_BY_REGION = { 'Kwazulu Natal': 2332, 'Western Cape': 568 };
const PS_ENERGY_MWH_BY_REGION = { 'Kwazulu Natal': 60000 * (2332/2900), 'Western Cape': 60000 * (568/2900) };
const PS_EFF = 0.76;

// Batteries: VERIFIED from Eskom's BESS Phase 1 per-site MW ratings. All eight sites
// are now publicly documented, so this is no longer an estimate:
//   Western Cape   114.5 MW - Skaapvlei 80, Hex 20, Paleisheuwel 9.5, Graafwater 5
//   Kwazulu Natal   48.0 MW - Pongola 40, Elandskop 8
//   Eastern Cape    35.0 MW - Melkhout 35
//   Northern Cape    1.5 MW - Rietfontein 1.5
// Totals to 199.0 MW / 833.2 MWh, matching Eskom's published "approximately 199 MW /
// 833 MWh" for Phase 1 - a useful completeness check. Sources: Engineering News
// (Nov 2023) per-site breakdown, corroborated by the World Bank Implementation Status
// Report (package listing) and Eskom's own BESS announcements.
//
// The previous split (WC 35 / EC 25 / NC 20 / KZN 20) was a flagged estimate weighted by
// the NUMBER of known sites rather than their MW, which badly misrepresented the fleet:
// Northern Cape has just one 1.5 MW site (0.8%, not 20%) while Western Cape holds 57.5%.
//
// Fleet-average duration is 4.19 h, consistent with BATT_HOURS = 4 below.
//
// Phase 2 (a further 144 MW / 616 MWh across four distribution sites and one transmission
// site) is on hold pending Treasury clarification, so it is excluded until sites are firm.
const BATT_SHARE_BY_REGION = { 'Western Cape': 0.5754, 'Kwazulu Natal': 0.2412, 'Eastern Cape': 0.1759, 'Northern Cape': 0.0075 };

// IPP battery storage procured under the DMRE's BESIPPPP programme - 1,744 MW /
// 6,980 MWh across three bid windows, versus Eskom's own 199 MW. This is now the
// overwhelming majority of South African grid storage, and it sits in COMPLETELY
// different regions to Eskom's fleet, so treating it as an extension of the Eskom
// split would have put nearly 1.8 GW in the wrong place.
//
// Every project is sited at a NAMED Eskom substation, so regions are derived from
// the substation register rather than estimated:
//   BW1 (513 MW): Garona 153, Ferrum 103, Nieuwehoop 103, Aggeneis 77 (Northern
//                 Cape); Mookodi 77 (North West)
//   BW2 (615 MW): 77 MW each at Ararat, Bighorn, Ngwedi, Marang, Carmel, Hermes,
//                 Midas and 76 MW at Mercury (North West supply area)
//   BW3 (616 MW): ~123 MW each at Harvard, Leander, Theseus, Everest, Merapi
//                 (Free State supply area)
// Each window's total reconciles exactly to the published figure, which is a
// useful completeness check. All projects are 4-hour storage, matching BATT_HOURS.
//
// Sources: Engineering News BW1/BW2/BW3 project updates, DMRE preferred-bidder
// media statements (Dec 2024, May 2025), Finergreen BW2 infographic.
const BESIPPPP_MW_BY_REGION = { 'North West': 692, 'Free State': 616, 'Northern Cape': 436 };
const BESIPPPP_TOTAL_MW = 1744;

// New-build storage is assumed to follow the BESIPPPP siting pattern rather than
// Eskom's, because that is where the procurement pipeline actually is: these
// substations were chosen by Eskom specifically to unlock constrained grid
// capacity, and further bid windows target the same corridors.
// GCCA 2025 connection headroom by region, MW. This is the CONNECTION constraint
// (what NTCSA will let you plug in), distinct from the corridor transfer limits
// used in the flow routing. Four of the best resource regions are already at
// zero for solar - Northern Cape, Hydra Central, Eastern Cape and Western Cape -
// which is precisely why new build cannot simply follow resource quality.
//
// Mirrors nodal/headroom_summary.json; the build optimiser already respects
// these, and as of 16 Aug 2026 the slider path does too.
const GCCA_HEADROOM_MW = {
  'Kwazulu Natal': { solar: 5500, wind: 5500, batt: 5500 },
  'Gauteng':       { solar: 4680, wind: 4680, batt: 4680 },
  'Limpopo':       { solar: 3360, wind: 3360, batt: 3360 },
  'Mpumalanga':    { solar: 3320, wind: 3320, batt: 3320 },
  'North West':    { solar: 1660, wind: 1660, batt: 1660 },
  'Free State':    { solar: 1420, wind: 1420, batt: 1420 },
  'Eastern Cape':  { solar: 0,    wind: 400,  batt: 0    },
  'Western Cape':  { solar: 0,    wind: 1180, batt: 0    },
  'Northern Cape': { solar: 0,    wind: 0,    batt: 0    },
  'Hydra Central': { solar: 0,    wind: 0,    batt: 0    },
};

/**
 * Distribute a national slider total across regions, respecting GCCA connection
 * headroom. Regions are filled in order of their EXISTING fleet share (a proxy
 * for resource quality and developer preference), each capped at its headroom;
 * whatever will not fit spills to the regions that still have room. If every
 * region is full the remainder is placed pro-rata anyway and reported as
 * over-headroom, because the user asked for that capacity and the honest answer
 * is "this needs grid build", not silently dropping it.
 *
 * Previously the remainder was spread pro-rata to existing fleet with no
 * headroom check at all, so a big "New utility solar PV" setting piled capacity
 * into the Northern Cape and Hydra Central - which have had zero solar headroom
 * since GCCA 2025. The build optimiser never did this; only the slider path did.
 */
function allocateWithHeadroom(totalMW, shareByRegion, tech) {
  const out = {}, over = {};
  REGIONS.forEach(r => { out[r] = 0; over[r] = 0; });
  if (!(totalMW > 0)) return { alloc: out, over, overTotal: 0 };

  const room = {};
  REGIONS.forEach(r => {
    const h = GCCA_HEADROOM_MW[r];
    room[r] = h ? (h[tech] != null ? h[tech] : 0) : 0;
  });

  let remaining = totalMW;
  // Up to a few passes: place pro-rata among regions that still have room,
  // then re-spread whatever did not fit.
  for (let pass = 0; pass < 6 && remaining > 1e-6; pass++) {
    const open = REGIONS.filter(r => room[r] - out[r] > 1e-6);
    if (!open.length) break;
    const wsum = open.reduce((s, r) => s + (shareByRegion[r] || 0), 0);
    let placed = 0;
    open.forEach(r => {
      const w = wsum > 0 ? (shareByRegion[r] || 0) / wsum : 1 / open.length;
      const want = remaining * w;
      const can = Math.max(0, room[r] - out[r]);
      const take = Math.min(want, can);
      out[r] += take; placed += take;
    });
    if (placed <= 1e-9) break;
    remaining -= placed;
  }
  // Anything still unplaced exceeds national headroom. Site it pro-rata and flag it.
  let overTotal = 0;
  if (remaining > 1e-6) {
    const wsum = REGIONS.reduce((s, r) => s + (shareByRegion[r] || 0), 0);
    REGIONS.forEach(r => {
      const w = wsum > 0 ? (shareByRegion[r] || 0) / wsum : 1 / REGIONS.length;
      const add = remaining * w;
      out[r] += add; over[r] += add;
    });
    overTotal = remaining;
  }
  return { alloc: out, over, overTotal };
}

const NEW_BATT_SHARE_BY_REGION = {
  'North West':    692 / 1744,
  'Free State':    616 / 1744,
  'Northern Cape': 436 / 1744,
};
const BATT_HOURS = 4;
const BATT_EFF = 0.88;

const COAL_CARRIERS = ['coal', 'sasol_coal']; // carriers subject to the EAF/decommissioning sliders
// Ramp-rate constants - same sourced figures as the single-node engine: SA's current coal fleet
// ramps 0.1-0.7%/min (Agora Energiewende 2017, via NREL's Greening the Grid), IRENA's post-
// flexibilisation range for hard coal is 3-6%/min. See index.html's FIXED.coalRampBasePct for
// the full sourcing note.
const COAL_RAMP_BASE_PCT = 24;
const COAL_RAMP_FLEX_PCT = 100;

// Grid Enhancing Technologies (dynamic line rating, advanced power flow control, topology
// optimisation): real, deployed technologies that increase existing corridor capacity without
// new line construction. Uplift: 10-30% is the consistently cited range across independent
// sources (DOE 2024 report; Oncor's actual deployment, 12% average/30% peak; NYPA corridor
// results, up to 15% in winter; WATT/AMP industry report, 10%+ for ~90% of the time) - using
// 20% as a representative midpoint. Cost: DOE 2024 (via Niskanen Center) states GETs cost
// "less than one-twentieth of what it would take to build a new line" - applied directly
// against this app's own real new-line cost (R31m/km, DEE Minister Apr 2025), giving a
// consistent, same-baseline-derived ~R1.55m/km rather than an unrelated absolute figure.
const GET_UPLIFT_FRAC = 0.20;

// Real CSP plant siting (verified against actual GCCA supply-region boundaries):
// Northern Cape 450MW (KaXu, Bokpoort, Xina, Ilanga, Kathu), Hydra Central 50MW (Khi Solar One)
const CSP_MW_BY_REGION = { 'Northern Cape': 450, 'Hydra Central': 50 };

// Imports (Cahora Bassa HVDC) enter the grid at Apollo converter station, Ekurhuleni - Gauteng.
const IMPORTS_REGION = 'Gauteng';
const IMPORTS_MW = 1150;      // matches the single-node app's assumption
// IMPORT UTILISATION. Corrected 0.85 -> 0.41 on 31 Aug 2026 from Eskom's audited energy
// balance: deliveries were 9,150 GWh FY2024, 7,570 FY2025, 4,090 FY2026. Cahora Bassa
// has more than halved in two years while the contract stayed at 1.15 GW firm.
//
// THIS IS A SECOND COPY of FIXED.importsCF in index.html and that is a rule 6 violation.
// THIS FILE OWNS THE VALUE, as of 31 Aug 2026. It is loaded as a plain script by four
// harnesses with no access to FIXED, so it cannot read the value from there - but it
// loads BEFORE index.html's constant block, so index.html can and now does read it:
// `importsCF: IMPORTS_CF`. One definition, and the dependency runs the only way the
// load order permits.
//
// Before that, the same number sat in both files plus two `?? 0.41` fallbacks - four
// copies. They never drifted, which was luck; a COMMENT about them did, still claiming
// 0.85 five hours after the value was corrected.
const IMPORTS_CF = 0.41;
const IMPORTS_COST = 550;     // R/MWh, matches the single-node app's costImports

// CSP has thermal storage in reality; like the single-node engine, treat its output as
// must-take (never curtailed) rather than a pure weather-driven renewable.
// Same synthetic evening-shifted shape the single-node engine uses (hour-of-day only, no
// real regional CSP dataset exists) - repeated across all 365 days.
function buildCspProfile() {
  const arr = new Float64Array(8760);
  for (let h = 0; h < 8760; h++) {
    const hour = h % 24;
    const eve = (hour >= 10 && hour <= 22) ? Math.exp(-Math.pow(hour - 17, 2) / 18) : 0;
    arr[h] = Math.min(1, 0.6 * eve);
  }
  return arr;
}
const CSP_PROFILE = buildCspProfile();

/**
 * Given the raw BASE-scenario fleet (with a parsed decomYear per unit) and the app's
 * coalEAFPct / coalDecomMW slider values, returns an adjusted fleet: coal-type units are
 * retired earliest-scheduled-first up to coalDecomMW removed (partial unit derating allowed
 * at the boundary), then EAF% is applied to whatever coal capacity remains. All other
 * carriers (nuclear, hydro, diesel OCGT, gas, etc.) are left at full nameplate for now -
 * their own sliders aren't wired into the nodal engine yet.
 */
function applyCoalScenario(rawFleet, coalEafPct, coalDecomMW) {
  const coalUnits = rawFleet.filter(g => COAL_CARRIERS.includes(g.carrier))
    .slice().sort((a, b) => a.decomYear - b.decomYear);
  const others = rawFleet.filter(g => !COAL_CARRIERS.includes(g.carrier));

  let toRemove = coalDecomMW;
  const adjustedCoal = [];
  for (const unit of coalUnits) {
    if (toRemove <= 0) { adjustedCoal.push({ ...unit }); continue; }
    if (unit.capacityMw <= toRemove) { toRemove -= unit.capacityMw; continue; } // fully retired
    adjustedCoal.push({ ...unit, capacityMw: unit.capacityMw - toRemove }); // partially retired
    toRemove = 0;
  }
  const eafFrac = coalEafPct / 100;
  adjustedCoal.forEach(u => { u.capacityMw *= eafFrac; });
  return [...others, ...adjustedCoal];
}

class NodalEngine {
  /**
   * @param {object} data
   * @param {object} data.demandByRegion - {region: Float64Array(8760)}
   * @param {object} data.windPu - {region: Float64Array(8760)}
   * @param {object} data.solarPu - {region: Float64Array(8760)}
   * @param {object} data.windMw - {region: number} base installed wind, before any nodal additions
   * @param {object} data.solarMw - {region: number} base installed solar, before any nodal additions
   * @param {Array}  data.fleet - RAW [{name, region, carrier, capacityMw, decomYear}], BASE scenario only,
   *                              unmodified by EAF/decommissioning - that's applied per-run via runYear()
   */
  constructor(data) {
    this.demandByRegion = data.demandByRegion;
    this.windPu = data.windPu;
    this.solarPu = data.solarPu;
    this.baseWindMw = data.windMw;
    this.baseSolarMw = data.solarMw;
    this.baseRooftopMw = data.rooftopMw || {};
    this.rawFleet = data.fleet;
    // Real CSP profile (Eskom 2021 measured, via profiles.json). If provided, replaces the
    // synthetic evening-shifted Gaussian that produced zero before 10:00.
    this.cspProfile = data.cspPu || CSP_PROFILE;

    this.nodeIndex = {};
    REGIONS.forEach((r, i) => { this.nodeIndex[r] = i; });
    this.adj = REGIONS.map(() => []);
    this.edgeMeta = [];
    CORRIDORS.forEach(([a, b, limit, length]) => {
      const ai = this.nodeIndex[a], bi = this.nodeIndex[b];
      const edgeIdx = this.edgeMeta.length;
      this.edgeMeta.push({ a: ai, b: bi, limit, length });
      this.adj[ai].push({ to: bi, edgeIdx });
      this.adj[bi].push({ to: ai, edgeIdx });
    });
  }

  /**
   * @param {number} coalEafPct - 0-100
   * @param {number} coalDecomMW
   * @param {object} extraWindByRegion - {region: MW}, e.g. from the "Where To Build" portfolio
   * @param {object} extraSolarByRegion - {region: MW}
   * @param {number} newRooftopMW - national new-build rooftop, allocated across regions
   *                                proportionally to each region's existing rooftop share
   * @param {number} newBattMW - national new-build battery power, allocated across regions
   *                             using the same flagged BATT_SHARE_BY_REGION estimate
   * @param {object} extraCoalByRegion - {region: MW}, from "Where To Build" - same EAF applied
   *                                     as existing coal (SA's own new-build coal history -
   *                                     Medupi/Kusile - suggests new plants aren't automatically
   *                                     more reliable than the existing fleet here)
   * @param {object} extraCcgtByRegion - {region: MW}, dispatchable, no EAF derating
   * @param {object} extraNuclearByRegion - {region: MW}, treated at the same 90% CF as existing nuclear
   * @param {object} extraBattByRegion - {region: MW}, from "Where To Build" - sited on top of
   *                                     whatever the national newBattMW slider already allocated
   *                                     there via BATT_SHARE_BY_REGION
   * @param {number} coalFlexPct - 0-100, same national "Coal fleet flexibilised" slider as the
   *                               single-node engine, applied per-region here (RAMP-UP only -
   *                               see the note in buildGenerators() for what's not yet modelled)
   * @param {boolean} getsEnabled - deploys Grid Enhancing Technologies (dynamic line rating,
   *                                advanced power flow control, topology optimisation) - boosts
   *                                every corridor's transfer limit by GET_UPLIFT_FRAC (20%,
   *                                sourced from real DOE/utility deployments) instead of needing
   *                                full new-line construction. Only applied to corridors in
   *                                boostedEdgeIndices (see below), not blanket-applied nationally.
   * @param {Set<number>} boostedEdgeIndices - which edgeMeta indices actually get the GET uplift
   *                                           when getsEnabled is true. Identified by a baseline
   *                                           (no-GET) pass in nodal_dispatch.js's runNodalYear,
   *                                           which finds truly congested corridors first -
   *                                           deploying GETs on an already-idle corridor would be
   *                                           a real-world waste, so this isn't a blanket national
   *                                           toggle. Pass null/undefined for "not yet determined"
   *                                           (the baseline pass itself, which runs with no boost).
   * @param {number} newWindMW - national "New wind" slider total. Previously this was silently
   *                             dropped by the nodal engine entirely unless explicitly sited via
   *                             "Where To Build" - a real gap, since a user could set 30GW on the
   *                             national slider and the nodal simulation would run as if none of
   *                             it existed. Whatever's already explicitly sited (extraWindByRegion)
   *                             is subtracted first; the remainder is auto-distributed proportional
   *                             to each region's real existing wind capacity - same methodology
   *                             already used for newRooftopMW above, extended to wind/solar.
   * @param {number} newPvMW - national "New utility solar PV" slider total, same treatment as newWindMW
   */
  setScenario(coalEafPct, coalDecomMW, extraWindByRegion = {}, extraSolarByRegion = {}, newRooftopMW = 0, newBattMW = 0,
              extraCoalByRegion = {}, extraCcgtByRegion = {}, extraNuclearByRegion = {}, extraBattByRegion = {}, coalFlexPct = 0, getsEnabled = false, boostedEdgeIndices = null,
              newWindMW = 0, newPvMW = 0, syncFloorMW = 6000) {
    this.getsEnabled = getsEnabled;
    this.syncFloorMW = syncFloorMW; // 0 = grid-forming future, 6000 = current grid code
    this.boostedEdgeIndices = boostedEdgeIndices;
    // Per-unit commitment state (Tier 1+2 unit commitment). Each real coal unit is separately
    // synchronised or offline, carries its own real Min Stable Level / ramp rates / min up-down
    // times / start-up cost from the fleet data, and cannot violate them. Start assumed online
    // so the year doesn't open with a fleet-wide cold start.
    this.unitState = {};
    this.startUpCostAccrued = 0;
    this.thermalFleet = applyCoalScenario(this.rawFleet, coalEafPct, coalDecomMW)
      .sort((a, b) => a.marginalCost - b.marginalCost);
    this.thermalFleet.forEach(g => {
      if (COAL_CARRIERS.includes(g.carrier)) {
        this.unitState[g.name] = { committed: true, hoursInState: 999, prevOut: g.capacityMw * 0.7 };
      }
    });
    // extra region-sited firm capacity from the siting tool - not part of the real fleet data,
    // added alongside it. Coal gets the same EAF derating as the existing fleet; CCGT and
    // nuclear are treated as fully dispatchable / fixed-CF respectively, matching how the
    // single-node engine treats them.
    const eafFrac = coalEafPct / 100;
    REGIONS.forEach(r => {
      const extraCoalMw = extraCoalByRegion[r] || 0;
      if (extraCoalMw > 0) this.thermalFleet.push({ name: r + ' New Coal', region: r, carrier: 'coal',
        capacityMw: extraCoalMw * eafFrac, marginalCost: 480, decomYear: Infinity, isNewBuild: true });
      const extraCcgtMw = extraCcgtByRegion[r] || 0;
      if (extraCcgtMw > 0) this.thermalFleet.push({ name: r + ' New CCGT', region: r, carrier: 'ccgt',
        capacityMw: extraCcgtMw, marginalCost: 1750, decomYear: Infinity });
      const extraNuclearMw = extraNuclearByRegion[r] || 0;
      if (extraNuclearMw > 0) this.thermalFleet.push({ name: r + ' New Nuclear', region: r, carrier: 'nuclear',
        capacityMw: extraNuclearMw * 0.90, marginalCost: 160, decomYear: Infinity });
    });
    this.thermalFleet.sort((a, b) => a.marginalCost - b.marginalCost);

    this.windMw = {};
    this.solarMw = {};
    this.rooftopMw = {};
    this.battMw = {};
    this.psSoc = {};   // MWh, current state of charge per region - carried across dispatchHour() calls
    this.battSoc = {}; // MWh
    const totalBaseRooftop = REGIONS.reduce((s, r) => s + (this.baseRooftopMw[r] || 0), 0);
    const totalBaseWind = REGIONS.reduce((s, r) => s + (this.baseWindMw[r] || 0), 0);
    const totalBaseSolar = REGIONS.reduce((s, r) => s + (this.baseSolarMw[r] || 0), 0);
    // whatever's already explicitly sited via "Where To Build" is real, user-chosen placement -
    // only the REMAINDER of the national slider (if any) gets auto-distributed, so explicit
    // siting always takes precedence and nothing gets double-counted
    const explicitWindTotal = REGIONS.reduce((s, r) => s + (extraWindByRegion[r] || 0), 0);
    const explicitSolarTotal = REGIONS.reduce((s, r) => s + (extraSolarByRegion[r] || 0), 0);
    const remainderWindMW = Math.max(0, newWindMW - explicitWindTotal);
    const remainderSolarMW = Math.max(0, newPvMW - explicitSolarTotal);
    // Headroom-aware distribution of the national slider remainder. Explicit
    // "Where To Build" placements are untouched - the user chose those, and the
    // Where To Build tool already prices the grid-build charge for exceeding
    // headroom. Only the auto-distributed remainder is constrained here.
    const windShareBy = {}, solarShareBy = {};
    REGIONS.forEach(r => {
      windShareBy[r]  = totalBaseWind  > 0 ? (this.baseWindMw[r]  || 0) / totalBaseWind  : 0;
      solarShareBy[r] = totalBaseSolar > 0 ? (this.baseSolarMw[r] || 0) / totalBaseSolar : 0;
    });
    const windAlloc  = allocateWithHeadroom(remainderWindMW,  windShareBy,  'wind');
    const solarAlloc = allocateWithHeadroom(remainderSolarMW, solarShareBy, 'solar');
    // Published so the UI can say when a scenario has outrun the grid.
    this.headroomOverflow = {
      wind:  windAlloc.overTotal,
      solar: solarAlloc.overTotal,
      byRegion: REGIONS.reduce((o, r) => {
        o[r] = { wind: windAlloc.over[r] || 0, solar: solarAlloc.over[r] || 0 }; return o;
      }, {}),
    };

    REGIONS.forEach(r => {
      const windShare = windShareBy[r];
      const solarShare = solarShareBy[r];
      this.windMw[r] = (this.baseWindMw[r] || 0) + (extraWindByRegion[r] || 0) + (windAlloc.alloc[r] || 0);
      this.solarMw[r] = (this.baseSolarMw[r] || 0) + (extraSolarByRegion[r] || 0) + (solarAlloc.alloc[r] || 0);
      const rooftopShare = totalBaseRooftop > 0 ? (this.baseRooftopMw[r] || 0) / totalBaseRooftop : 0;
      this.rooftopMw[r] = (this.baseRooftopMw[r] || 0) + newRooftopMW * rooftopShare;
      // Existing storage follows Eskom's own BESS siting. New build follows the
      // BESIPPPP pattern instead, because that is where procurement is actually
      // directed - those substations were selected by Eskom to unlock constrained
      // grid capacity, and successive bid windows target the same corridors.
      //
      // The 1,744 MW BESIPPPP pipeline is deliberately NOT added to existing
      // capacity: almost none of it is operational. Only two BW1 projects
      // (180 MW) reach commercial operation in late 2026, Red Sands (153 MW) in
      // about 2027, and BW2/BW3 are still pre-financial-close. Adding it to the
      // "Today 2026" baseline would overstate present-day storage roughly ninefold.
      // It is exposed as a preset instead, so users can model it explicitly.
      const battShare = BATT_SHARE_BY_REGION[r] || 0;
      const ippShare = NEW_BATT_SHARE_BY_REGION[r] || 0;
      this.battMw[r] = 800 * battShare        // Eskom BESS (800MW = single-node app's existing total)
                     + newBattMW * ippShare   // slider-driven new build, sited per BESIPPPP
                     + (extraBattByRegion[r] || 0);
      // start at the same fractions the single-node engine uses (70% pumped storage, 50% batteries)
      this.psSoc[r] = (PS_ENERGY_MWH_BY_REGION[r] || 0) * 0.7;
      this.battSoc[r] = (this.battMw[r] * BATT_HOURS) * 0.5;
    });

    // Ramp-rate setup (RAMP-UP only for now - see the note in buildGenerators() for what's not
    // yet modelled). Existing coal fleet gets the flexibilisation-slider-blended rate; new-build
    // coal is assumed inherently flexible from construction, matching the single-node engine's
    // own treatment - a plant built today wouldn't be designed to match SA's aging fleet's limits.
    const rampPct = COAL_RAMP_BASE_PCT + (COAL_RAMP_FLEX_PCT - COAL_RAMP_BASE_PCT) * (coalFlexPct / 100);
    this.coalCapacityByRegion = {};
    this.rampAllowedByRegion = {};
    this.prevCoalGenByRegion = {};
    REGIONS.forEach(r => {
      let oldCap = 0, newCap = 0;
      this.thermalFleet.forEach(g => {
        if (g.region === r && COAL_CARRIERS.includes(g.carrier)) {
          if (g.isNewBuild) newCap += g.capacityMw; else oldCap += g.capacityMw;
        }
      });
      this.coalCapacityByRegion[r] = oldCap + newCap;
      this.rampAllowedByRegion[r] = oldCap * rampPct / 100 + newCap * COAL_RAMP_FLEX_PCT / 100;
      this.prevCoalGenByRegion[r] = this.coalCapacityByRegion[r] * 0.5; // reasonable starting assumption, matching psSoc/battSoc's own convention
    });

    this.buildForecastNeed();
  }

  /**
   * Cheap, local-only forecast of near-term stress per region, used so storage can reserve
   * some of its own capacity for itself before exporting to help a neighbour (see dispatchHour).
   * Deliberately simple to avoid circularity: it never looks at storage or network imports,
   * just "raw local demand minus this region's own firm + weather-driven generation" - a
   * conservative proxy, not a real dispatch simulation. Since the whole year's demand and
   * renewable profiles are already fully known upfront (this is a batch simulation, not a
   * live one), a real 24h-ahead lookahead is legitimate here, unlike a real grid operator
   * who only has forecasts.
   */
  /**
   * Per-region net load (MW) for every hour: regional demand less rooftop and
   * all variable generation sited in that region. This is the input the MIP
   * optimiser needs — the residual each region must cover from thermal plant,
   * storage, or imports across a corridor.
   * Uses the same derates as the dispatch engine so the two stay consistent.
   */
  getRegionalNetLoad() {
    // Nuclear and hydro capacity live per-unit in thermalFleet (tagged by region and
    // carrier), not as separate lookup tables - aggregate them once up front, the same
    // way the national aggregate does it elsewhere in this class.
    const nuclearMwByRegion = {}, hydroMwByRegion = {};
    REGIONS.forEach(r => { nuclearMwByRegion[r] = 0; hydroMwByRegion[r] = 0; });
    this.thermalFleet.forEach(g => {
      if (g.carrier === 'nuclear') nuclearMwByRegion[g.region] = (nuclearMwByRegion[g.region] || 0) + g.capacityMw;
      if (g.carrier === 'hydro')   hydroMwByRegion[g.region]   = (hydroMwByRegion[g.region]   || 0) + g.capacityMw;
    });

    const out = {};
    // Annual sum of each region's own VARIABLE renewable generation (wind+solar+CSP -
    // the curtailable pool). Nuclear, hydro and imports are firm/dispatch-like and are
    // excluded here, same distinction the curtailment feature needs: "how much of this
    // region's own renewable potential went to waste", not its whole supply mix.
    const renewablePotentialMwh = {};
    REGIONS.forEach(r => { out[r] = new Float64Array(8760); renewablePotentialMwh[r] = 0; });
    for (let h = 0; h < 8760; h++) {
      for (const r of REGIONS) {
        const rawD = this.demandByRegion[r][h];
        const rooftop = Math.min((this.rooftopMw[r] || 0) * this.solarPu[r][h] * 0.94, rawD * 0.9);
        const windGen  = (this.windMw[r]  || 0) * this.windPu[r][h];
        const solarGen = (this.solarMw[r] || 0) * this.solarPu[r][h];
        const cspGen   = (CSP_MW_BY_REGION[r] || 0) * this.cspProfile[h];
        renewablePotentialMwh[r] += windGen + solarGen + cspGen;
        const variableAvail =
            windGen + solarGen + cspGen
          + (r === IMPORTS_REGION ? IMPORTS_MW * IMPORTS_CF : 0)
          + nuclearMwByRegion[r] * 0.90
          + hydroMwByRegion[r] * 0.55;
        out[r][h] = rawD - rooftop - variableAvail;
      }
    }
    this._lastRenewablePotentialMwh = renewablePotentialMwh; // cached for getRenewablePotential()
    return out;
  }

  /**
   * Each region's annual variable-renewable (wind+solar+CSP) generation total, in MWh.
   * Used as the denominator for "% of this region's own renewable potential curtailed".
   * Must be called after getRegionalNetLoad(), which computes it as a side effect of the
   * same hourly loop (avoids a second 8,760-hour pass just for this).
   */
  getRenewablePotential() {
    return this._lastRenewablePotentialMwh || {};
  }

  /** Corridor list with transfer limits, for the optimiser. */
  getCorridors() {
    return this.edgeMeta.map(e => ({ a: e.a, b: e.b, limit: e.limit, km: e.length }));
  }

  buildForecastNeed() {
    const n = REGIONS.length;
    const firmCapacityByRegion = {};
    REGIONS.forEach(r => { firmCapacityByRegion[r] = 0; });
    this.thermalFleet.forEach(g => { firmCapacityByRegion[g.region] = (firmCapacityByRegion[g.region] || 0) + g.capacityMw; });

    const deficitProxy = {};
    REGIONS.forEach(r => { deficitProxy[r] = new Float64Array(8760); });
    for (let h = 0; h < 8760; h++) {
      for (const r of REGIONS) {
        const rawD = this.demandByRegion[r][h];
        const rooftop = Math.min((this.rooftopMw[r] || 0) * this.solarPu[r][h] * 0.94, rawD * 0.9);
        const netD = rawD - rooftop;
        const variableAvail = (this.windMw[r] || 0) * this.windPu[r][h] + (this.solarMw[r] || 0) * this.solarPu[r][h]
          + (CSP_MW_BY_REGION[r] || 0) * this.cspProfile[h] + (r === IMPORTS_REGION ? IMPORTS_MW * IMPORTS_CF : 0);
        const rawDeficit = Math.max(0, netD - firmCapacityByRegion[r] - variableAvail);
        // cap by what this region's OWN storage could plausibly address in an hour - otherwise
        // a region's entire multi-GW shortfall (which storage could never fully cover anyway)
        // saturates the reserve fraction to ~100% almost permanently, making the signal useless.
        const storageScale = Math.max(PS_MW_BY_REGION[r] || 0, this.battMw[r] || 0);
        deficitProxy[r][h] = Math.min(rawDeficit, storageScale);
      }
    }
    this.hourlyStress = deficitProxy; // kept for the storage-reservation feature elsewhere

    // National net load (demand minus renewable+baseload output) as a price proxy - this is the
    // real economic mechanism behind wholesale electricity pricing: abundant midday solar drives
    // net load low (cheap - this is what produces California's "duck curve"), no-sun evening
    // peaks drive it high (expensive, since more thermal generation is needed). Storage arbitrage
    // (see dispatchHour) buys low and sells high against this real signal, replacing the
    // earlier clock-time/relative-demand heuristic entirely. Nuclear/hydro (true must-run
    // baseload) subtract from net load same as renewables; coal/gas/diesel don't, since their
    // need is exactly what net load is meant to represent - subtracting them would be circular.
    let nuclearHydroMw = 0;
    this.thermalFleet.forEach(g => { if (g.carrier === 'nuclear' || g.carrier === 'hydro') nuclearHydroMw += g.capacityMw; });
    this.netLoad = new Float64Array(8760);
    for (let h = 0; h < 8760; h++) {
      let demand = 0, renewableAvail = 0;
      for (const r of REGIONS) {
        const rawD = this.demandByRegion[r][h];
        const rooftop = Math.min((this.rooftopMw[r] || 0) * this.solarPu[r][h] * 0.94, rawD * 0.9);
        demand += rawD - rooftop;
        renewableAvail += (this.windMw[r] || 0) * this.windPu[r][h] + (this.solarMw[r] || 0) * this.solarPu[r][h]
          + (CSP_MW_BY_REGION[r] || 0) * this.cspProfile[h] + (r === IMPORTS_REGION ? IMPORTS_MW * IMPORTS_CF : 0);
      }
      this.netLoad[h] = demand - renewableAvail - nuclearHydroMw;
    }
    // DAILY-relative thresholds, not a single year-wide one: a real battery doesn't care whether
    // today is worse than winter - it cares whether there's a cheap-to-expensive spread worth
    // capturing TODAY. A year-wide threshold is dominated by winter's scale, so on most summer
    // days even a real, meaningful midday-to-evening solar ramp never clears the bar - batteries
    // would fire on only a handful of "exceptional" days instead of every evening, unlike
    // real-world CAISO batteries which reliably cycle daily against California's own summer duck
    // curve regardless of how that day compares to winter. Using each day's own min-max range
    // instead means every day with a real daily swing gets its own evening peak correctly
    // identified as relatively expensive (and midday dip as relatively cheap) for THAT day.
    // Uses each day's own 25th/75th PERCENTILE, not dMin + f*(dMax-dMin). The range-based version
    // breaks at high solar: a huge midday surplus drags the day's minimum deeply negative while
    // the evening peak is unchanged, collapsing the thresholds so that far too many hours count
    // as "expensive". Storage then spreads its energy thinly instead of saving it for the real
    // peak - which made adding more solar perversely INCREASE load shedding. A percentile is
    // robust to that skew: the top quarter of hours is always the top quarter.
    this.cheapThresholdByHour = new Float64Array(8760);
    this.expensiveThresholdByHour = new Float64Array(8760);
    for (let day = 0; day < 365; day++) {
      const start = day * 24, end = Math.min(8760, start + 24);
      const vals = [];
      for (let h = start; h < end; h++) vals.push(this.netLoad[h]);
      vals.sort((a, b) => a - b);
      const cheap = vals[Math.floor(vals.length * 0.25)], expensive = vals[Math.floor(vals.length * 0.75)];
      for (let h = start; h < end; h++) { this.cheapThresholdByHour[h] = cheap; this.expensiveThresholdByHour[h] = expensive; }
    }

    // Forward-looking coal-sufficiency signal. The cheap-hour gate above ("is net load in the
    // bottom 25% of today's range") is a price proxy - it says renewables/baseload are plentiful
    // right NOW, but says nothing about whether coal will actually fall short LATER. Cross-
    // validation against a real PyPSA/HiGHS optimum on the same data found this mattered a lot:
    // in a baseline scenario where national coal peaks at ~93% of capacity and never binds, the
    // real optimum charges storage from coal essentially zero, while a cheap-hour-only gate
    // generated ~142 GWh of coal in one week purely to fill storage - ~31 GWh of that lost
    // outright to round-trip efficiency, for no benefit, since coal always had the headroom to
    // serve that demand directly. Charging from coal only pays off if coal is genuinely going to
    // run short soon (or if the energy is free curtailed renewables, which has its own pass and
    // is deliberately NOT gated by this). So: sum, over the next 24h, how much national net load
    // exceeds what coal can actually supply. Zero means coal copes fine and this pathway should
    // stay shut; positive means storage will really be needed and pre-charging earns its losses.
    let coalCapacityNational = 0;
    this.thermalFleet.forEach(g => { if (COAL_CARRIERS.includes(g.carrier)) coalCapacityNational += g.capacityMw; });
    this.anticipatedCoalShortfall = new Float64Array(8760);
    for (let h = 0; h < 8760; h++) {
      let sum = 0;
      const end = Math.min(8760, h + 25);
      for (let k = h + 1; k < end; k++) {
        const gap = this.netLoad[k] - coalCapacityNational;
        if (gap > 0) sum += gap;
      }
      this.anticipatedCoalShortfall[h] = sum;
    }

    // rolling 24h-ahead sum (truncated at year boundary - a minor edge effect in the last 24h only)
    this.forecastNeed = {};
    REGIONS.forEach(r => { this.forecastNeed[r] = new Float64Array(8760); });
    for (const r of REGIONS) {
      for (let h = 0; h < 8760; h++) {
        let sum = 0;
        const end = Math.min(8760, h + 25);
        for (let k = h + 1; k < end; k++) sum += deficitProxy[r][k];
        this.forecastNeed[r][h] = sum;
      }
    }
  }

  /**
   * Decide which coal units are synchronised this hour. Greedy cheapest-first against expected
   * need, but a unit can only shut down once it has met its Min Up Time, and can only restart
   * once it has met its Min Down Time (48h for several real units) - which is exactly why real
   * SA coal often runs through the midday solar trough at minimum rather than shutting off.
   */
  commitUnits(hourIdx) {
    const coalUnits = this.thermalFleet.filter(g => COAL_CARRIERS.includes(g.carrier));
    if (!coalUnits.length) return;
    // National net load is what coal, gas and storage together must cover - a good proxy for the
    // commitment decision. Look across the next 12 hours, not just this one: a purely myopic
    // view decommits half the fleet during the midday solar trough and then cannot restart for
    // the evening peak (several units have 48h minimum down times), which is both unrealistic
    // and enormously expensive. Real operators commit day-ahead against the coming peak, which
    // is precisely why coal stays synchronised at minimum through the middle of the day.
    let need = 0;
    for (let k = hourIdx; k < Math.min(8760, hourIdx + 12); k++) {
      if (this.netLoad[k] > need) need = this.netLoad[k];
    }
    let cumulative = 0;
    for (const u of coalUnits) { // already sorted cheapest-first in setScenario
      const st = this.unitState[u.name];
      if (!st) continue;
      const wantOn = cumulative < need;
      if (wantOn && !st.committed && st.hoursInState >= (u.minDownTime || 0)) {
        st.committed = true; st.hoursInState = 0;
        // prevOut intentionally NOT reset. A unit being recommitted may have been offline only
        // briefly (or was ramping down) and still has a real physical output level that the ramp
        // ceiling/floor must reference. Setting prevOut=0 here let units snap from 655 MW to 0
        // and back, violating their own ramp rate at up to 5x (Kendal: 1,024 MW/hr against
        // a 205 MW/hr allowance). The ramp-up limit already constrains how fast a recommitted
        // unit can climb from its current level; zeroing prevOut removes that constraint.
        this.startUpCostAccrued += (u.startUpCost || 0);
      } else if (!wantOn && st.committed && st.hoursInState >= (u.minUpTime || 0)) {
        // A unit going offline must first ramp down to zero over real time, not snap off. Keeping
        // prevOut means buildGenerators' minMw (which uses prevOut - rampDown) correctly floors
        // the unit at its ramp-constrained minimum during the wind-down hours. Setting prevOut=0
        // here was what let Kendal ramp down at 6x its physical rate on decommit.
        st.committed = false; st.hoursInState = 0;
        // prevOut intentionally NOT reset - the unit carries its last output into the offline
        // period, and buildGenerators will produce a [min] block at (prevOut - rampDown) until
        // it reaches zero, at which point commitUnits stops seeing it.
      }
      if (st.committed) cumulative += u.capacityMw;
      st.hoursInState++;
    }
  }

  buildGenerators(hourIdx) {
    // Per-unit coal dispatch limits (replaces the old region-aggregate ramp scaling). Each
    // synchronised unit is split into two entries: a MUST-RUN block at its Min Stable Level,
    // priced far below everything else so merit order always takes it first (a real unit cannot
    // go below min stable while synchronised), and a flexible block above that at its real
    // marginal cost. Offline units contribute nothing. Ramp limits are now per-unit and apply in
    // BOTH directions, using each unit's own real rate rather than one fleet-wide average.
    const gens = [];
    this.thermalFleet.forEach(g => {
      const st = COAL_CARRIERS.includes(g.carrier) ? this.unitState[g.name] : null;
      if (!st) {
        gens.push({ name: g.name, region: g.region, carrier: g.carrier, cost: g.marginalCost,
                    availableMw: g.capacityMw, isRenewable: false });
        return;
      }
      if (!st.committed) return; // handled post-dispatch as forced generation (see below)
      const cap = g.capacityMw;
      const rampUp = (g.rampUpFrac != null ? g.rampUpFrac : 1) * cap;
      const rampDown = (g.rampDownFrac != null ? g.rampDownFrac : 1) * cap;
      const maxMw = Math.min(cap, st.prevOut + rampUp);
      const minMw = Math.min(maxMw, Math.max((g.minStableFrac || 0) * cap, st.prevOut - rampDown));
      if (minMw > 1e-6) {
        gens.push({ name: g.name + ' [min]', region: g.region, carrier: g.carrier, cost: -1e6,
                    availableMw: minMw, isRenewable: false });
      }
      const flexible = Math.max(0, maxMw - Math.max(0, minMw));
      if (flexible > 1e-6) {
        gens.push({ name: g.name, region: g.region, carrier: g.carrier, cost: g.marginalCost,
                    availableMw: flexible, isRenewable: false });
      }
    });

    // Ramp-up cap: coal generators in a region can't collectively exceed what ramping allows
    // this hour, regardless of raw EAF-adjusted capacity - the "no ramp up time" fix. Scaled
    // down proportionally across that region's coal units (a simplification - doesn't
    // distinguish which specific unit would ramp fastest, matching the single-node engine's own
    // aggregate treatment). Ramp-DOWN (forcing coal to keep running into a local surplus, which
    // forces additional curtailment) is NOT yet modelled here - see setScenario()'s doc comment -
    // that needs remainingDeficit to go negative to represent forced local surplus, a bigger
    // change than this ceiling-only version.


    for (const r of REGIONS) {
      const wMw = this.windMw[r] || 0;
      if (wMw > 0) {
        const cf = this.windPu[r][hourIdx];
        gens.push({ name: r + ' Wind', region: r, carrier: 'wind', cost: 0,
                    availableMw: wMw * cf, isRenewable: true });
      }
      const sMw = this.solarMw[r] || 0;
      if (sMw > 0) {
        const cf = this.solarPu[r][hourIdx];
        gens.push({ name: r + ' Solar', region: r, carrier: 'solar', cost: 0,
                    availableMw: sMw * cf, isRenewable: true });
      }
      const cspMw = CSP_MW_BY_REGION[r] || 0;
      if (cspMw > 0) {
        gens.push({ name: r + ' CSP', region: r, carrier: 'csp', cost: 0,
                    availableMw: cspMw * this.cspProfile[hourIdx], isRenewable: false }); // must-take, matches single-node treatment
      }
    }
    gens.push({ name: 'Cahora Bassa import', region: IMPORTS_REGION, carrier: 'imports', cost: IMPORTS_COST,
                availableMw: IMPORTS_MW * IMPORTS_CF, isRenewable: false }); // must-take, fixed CF, matches single-node treatment
    // Storage discharge as ordinary generators - this is what lets the existing, already-validated
    // network-flow routing carry discharged power to OTHER regions automatically, same as any
    // other generator. Off-peak/normal: priced between coal (~480-550) and gas/diesel
    // (1750/6100), matching the single-node engine's own dispatch order. During truly
    // EXPENSIVE hours - top 25% of national net load, a real price proxy (see buildForecastNeed)
    // - storage is given priority ahead of coal: this is real arbitrage, selling stored energy
    // when the system is tightest, not a clock-time or relative-demand heuristic. "Cost" here is
    // a dispatch-priority device, not a real marginal cost - storage's actual economics are
    // opportunity-cost/arbitrage, which a merit-order-by-cost model can't natively represent;
    // this net-load-based version is a real (if simplified) approximation of that, not a
    // proxy for it.
    const isExpensiveHour = this.netLoad[hourIdx] >= this.expensiveThresholdByHour[hourIdx];
    for (const r of REGIONS) {
      const psAvail = Math.min(PS_MW_BY_REGION[r] || 0, this.psSoc[r] || 0);
      if (psAvail > 1e-6) gens.push({ name: r + ' Pumped storage', region: r, carrier: 'ps', cost: isExpensiveHour ? 50 : 600, availableMw: psAvail, isRenewable: false });
      const battAvail = Math.min(this.battMw[r] || 0, this.battSoc[r] || 0);
      if (battAvail > 1e-6) gens.push({ name: r + ' Battery', region: r, carrier: 'batt', cost: isExpensiveHour ? 60 : 700, availableMw: battAvail, isRenewable: false });
    }
    gens.sort((a, b) => a.cost - b.cost);
    return gens;
  }

  // Single-source Dijkstra from `homeIdx` over edges with headroom > eps, returns
  // {dist[], prevEdge[]} - replaces the Python version's per-target shortest_path calls.
  dijkstra(homeIdx, headroom) {
    const n = REGIONS.length;
    const dist = new Array(n).fill(Infinity);
    const prevEdge = new Array(n).fill(-1);
    const visited = new Array(n).fill(false);
    dist[homeIdx] = 0;
    for (let iter = 0; iter < n; iter++) {
      let u = -1, best = Infinity;
      for (let i = 0; i < n; i++) if (!visited[i] && dist[i] < best) { best = dist[i]; u = i; }
      if (u === -1) break;
      visited[u] = true;
      for (const { to, edgeIdx } of this.adj[u]) {
        if (headroom[edgeIdx] <= 1e-6) continue;
        const alt = dist[u] + this.edgeMeta[edgeIdx].length;
        if (alt < dist[to]) { dist[to] = alt; prevEdge[to] = edgeIdx; }
      }
    }
    return { dist, prevEdge };
  }

  pathEdges(targetIdx, prevEdge) {
    const edges = [];
    let cur = targetIdx;
    while (prevEdge[cur] !== -1) {
      edges.push(prevEdge[cur]);
      const e = this.edgeMeta[prevEdge[cur]];
      cur = (e.a === cur) ? e.b : e.a;
    }
    return edges.reverse();
  }

  dispatchHour(hourIdx) {
    const n = REGIONS.length;
    const rawDemand = new Array(n);
    const demand = new Array(n);
    const rooftopGen = new Array(n);
    for (let i = 0; i < n; i++) {
      const r = REGIONS[i];
      rawDemand[i] = this.demandByRegion[r][hourIdx];
      // same formula as the single-node engine: 94% derate, capped at 90% of that region's demand
      const potential = (this.rooftopMw[r] || 0) * this.solarPu[r][hourIdx] * 0.94;
      rooftopGen[i] = Math.min(potential, rawDemand[i] * 0.9);
      demand[i] = rawDemand[i] - rooftopGen[i]; // net (grid-facing) demand - this is what the network sees
    }
    const remainingDeficit = demand.slice();
    // GETs only boost corridors actually identified as congested (see this.boostedEdgeIndices,
    // set by the two-pass process in nodal_dispatch.js's runNodalYear) - not a blanket national
    // multiplier. Deploying dynamic line rating or power flow control on a corridor that's
    // already sitting at 10% utilisation would be a real-world waste of money for zero benefit;
    // real utilities target specific congested lines (DOE/WATT Coalition case studies), which is
    // what this now reflects.
    const headroom = this.edgeMeta.map((e, i) =>
      e.limit * (this.getsEnabled && this.boostedEdgeIndices && this.boostedEdgeIndices.has(i) ? (1 + GET_UPLIFT_FRAC) : 1));
    const edgeFlow = new Array(this.edgeMeta.length).fill(0); // MW sent this hour, per corridor - for the flows-on-map feature

    this.commitUnits(hourIdx); // decide which units are synchronised before building their limits
    const gens = this.buildGenerators(hourIdx);
    let totalLosses = 0, totalCurtailed = 0, forcedCurtailed = 0;
    const genLog = []; // kept lightweight - only what the UI needs

    for (const gen of gens) {
      let avail = gen.availableMw;
      if (avail <= 1e-9) continue;
      const homeIdx = this.nodeIndex[gen.region];
      let reservedMw = 0; // storage held back by the forecast reservation - NOT generated

      const localTake = Math.min(avail, Math.max(remainingDeficit[homeIdx], 0));
      remainingDeficit[homeIdx] -= localTake;
      avail -= localTake;

      // Forecast-aware reservation: before storage exports to help ANOTHER region, hold back
      // some of its own remaining capacity if its own region looks stressed over the next 24h.
      // Reserved MW simply isn't dispatched this hour (never enters the export loop below), so
      // it stays banked in SoC for whenever the home region's own forecast need materialises.
      if ((gen.carrier === 'ps' || gen.carrier === 'batt') && avail > 1e-6) {
        const energyCap = gen.carrier === 'ps'
          ? (PS_ENERGY_MWH_BY_REGION[gen.region] || 0)
          : (this.battMw[gen.region] || 0) * BATT_HOURS;
        const need = (this.forecastNeed[gen.region] && this.forecastNeed[gen.region][hourIdx]) || 0;
        // capped at 50%, not 100%: an early attempt using the full 0-100% range saturated near-
        // permanently under sustained stress (any lasting shortfall summed over 24h tends to exceed
        // a modest plant's own energy capacity), which stopped being a real signal and just
        // blocked exports almost always. This bound keeps it directionally responsive - reserve
        // more when the region's own near-term outlook is worse - without ever fully shutting
        // off exports, which a more careful, iterated calibration could probably improve on.
        const reserveFrac = energyCap > 0 ? Math.min(0.5, need / energyCap) : 0;
        reservedMw = avail * reserveFrac;
        avail -= reservedMw;
      }

      let guard = 0;
      while (avail > 1e-6 && guard++ < n) {
        const { dist, prevEdge } = this.dijkstra(homeIdx, headroom);
        let target = -1, bestDist = Infinity;
        for (let i = 0; i < n; i++) {
          if (i !== homeIdx && remainingDeficit[i] > 1e-6 && dist[i] < bestDist) {
            bestDist = dist[i]; target = i;
          }
        }
        if (target === -1) break;
        const edges = this.pathEdges(target, prevEdge);
        if (edges.length === 0) break;
        let bottleneck = Infinity;
        for (const ei of edges) bottleneck = Math.min(bottleneck, headroom[ei]);
        const sent = Math.min(avail, remainingDeficit[target], bottleneck);
        if (sent <= 1e-9) break;

        let totalLossFrac = 0;
        for (const ei of edges) {
          const e = this.edgeMeta[ei];
          const lf = lossFraction(e.length, sent, e.limit);
          totalLossFrac = 1 - (1 - totalLossFrac) * (1 - lf);
        }
        const delivered = sent * (1 - totalLossFrac);
        remainingDeficit[target] -= delivered;
        avail -= sent;
        totalLosses += sent - delivered;
        for (const ei of edges) { headroom[ei] -= sent; edgeFlow[ei] += sent; }
      }

      if (avail > 1e-6 && gen.isRenewable) totalCurtailed += avail;
      genLog.push({ name: gen.name, region: gen.region, carrier: gen.carrier,
                    homeTake: localTake, curtailed: gen.isRenewable ? avail : 0,
                    // Subtract reservedMw. The forecast reservation lowers `avail` to hold storage
                    // back from exporting, but dispatched was computed as availableMw - avail, so
                    // that held-back energy was recorded as GENERATED. It never left the plant and
                    // served no demand - phantom generation that broke energy conservation by
                    // exactly the reserved amount, and inflated coal, cost and CO2 on every hour
                    // the reservation bit. Storage showed dispatched = half of available with
                    // homeTake 0 and nothing exported, which is what gave it away.
                    dispatched: gen.availableMw - avail - reservedMw, available: gen.availableMw });
    }

    // --- Storage discharge: already dispatched as ordinary generators above (see buildGenerators),
    // so cross-region export already happened via the same validated flow-routing every other
    // generator uses. Just account for the resulting state-of-charge drop here.
    let psDischargeTotal = 0, battDischargeTotal = 0;
    genLog.forEach(g => {
      if (g.carrier === 'ps') { this.psSoc[g.region] -= g.dispatched; psDischargeTotal += g.dispatched; }
      if (g.carrier === 'batt') { this.battSoc[g.region] -= g.dispatched; battDischargeTotal += g.dispatched; }
    });

    // --- Cheap-hour thermal-headroom charging, NETWORK-ROUTED. A region with idle local coal
    // capacity can charge ANY region's storage via the real network, not just its own - this
    // matters a lot in practice: KZN's pumped storage has almost no local coal fleet to draw
    // from (SA's coal is concentrated in Mpumalanga/Limpopo/Free State), so a local-only version
    // leaves it with no way to ever recharge once its starting charge is used up. Gated by the
    // same real net-load price signal as discharge (bottom 25% - see buildForecastNeed),
    // not a fixed overnight clock window: this is real arbitrage - buying while cheap, wherever
    // and whenever that truly is, which on a strong solar day can include parts of the
    // afternoon, not just 23:00-05:00. Separately, actual curtailed renewable surplus (the
    // strongest, literally-free form of "cheap solar") is captured by its own charging pass
    // below regardless of this price gate, since wasted generation is worth capturing any time.
    // Same conservative gates as the single-node engine, applied at the RECEIVING region: pumped
    // storage only charges this way below 85% SoC (up to 80% of its own power rating),
    // batteries below 80% SoC (up to 60% of their own power rating).
    let psCoalChargeTotal = 0, battCoalChargeTotal = 0;
    // Two conditions now, not one: cheap right now (price proxy) AND coal actually running short
    // within 24h (real need - see anticipatedCoalShortfall in buildForecastNeed for why). The
    // curtailed-renewable charging pass further below is deliberately NOT gated this way: free
    // wasted energy is worth capturing whether or not coal is under stress.
    const isCheapHour = this.netLoad[hourIdx] <= this.cheapThresholdByHour[hourIdx];
    const coalWillFallShort = this.anticipatedCoalShortfall[hourIdx] > 0;
    if (isCheapHour && coalWillFallShort) {
      const coalHeadroomByRegion = new Array(n).fill(0);
      genLog.forEach(g => {
        if (COAL_CARRIERS.includes(g.carrier)) coalHeadroomByRegion[this.nodeIndex[g.region]] += (g.available - g.dispatched);
      });
      const psCapOffpeak = REGIONS.map(r => {
        const psEnergyMwh = PS_ENERGY_MWH_BY_REGION[r] || 0;
        if (this.psSoc[r] >= psEnergyMwh * 0.85) return 0;
        return Math.max(0, Math.min((PS_MW_BY_REGION[r] || 0) * 0.8, psEnergyMwh - this.psSoc[r]));
      });
      const battCapOffpeak = REGIONS.map(r => {
        const battEnergyMwh = (this.battMw[r] || 0) * BATT_HOURS;
        if (this.battSoc[r] >= battEnergyMwh * 0.8) return 0;
        return Math.max(0, Math.min((this.battMw[r] || 0) * 0.6, battEnergyMwh - this.battSoc[r]));
      });
      const offpeakHeadroom = REGIONS.map((r, i) => psCapOffpeak[i] + battCapOffpeak[i]);
      const creditOffpeak = (i, mwh) => {
        const toPs = Math.min(mwh, psCapOffpeak[i]);
        this.psSoc[REGIONS[i]] += toPs * PS_EFF; psCapOffpeak[i] -= toPs; psCoalChargeTotal += toPs;
        const toBatt = Math.min(mwh - toPs, battCapOffpeak[i]);
        this.battSoc[REGIONS[i]] += toBatt * BATT_EFF; battCapOffpeak[i] -= toBatt; battCoalChargeTotal += toBatt;
        offpeakHeadroom[i] -= (toPs + toBatt);
      };
      // Tracks how much EXTRA coal was actually generated per source region for this charging -
      // real generation, real for ramp-tracking purposes, even though it never appears against
      // any single generator's own dispatched total (it's routed from a REGION's pooled headroom,
      // not one specific unit). Without this, prevCoalGenByRegion next hour would understate what
      // coal actually produced, letting the ramp ceiling allow an unrealistic jump the following hour.
      const coalOffpeakSentByRegion = new Array(n).fill(0);
      for (let srcIdx = 0; srcIdx < n; srcIdx++) {
        let avail = coalHeadroomByRegion[srcIdx];
        if (avail <= 1e-6) continue;
        let guard = 0;
        while (avail > 1e-6 && guard++ < n) {
          const { dist, prevEdge } = this.dijkstra(srcIdx, headroom);
          let target = -1, bestDist = Infinity;
          for (let i = 0; i < n; i++) { if (offpeakHeadroom[i] > 1e-6 && dist[i] < bestDist) { bestDist = dist[i]; target = i; } }
          if (target === -1) break;
          const edges = this.pathEdges(target, prevEdge);
          let bottleneck = Infinity;
          for (const ei of edges) bottleneck = Math.min(bottleneck, headroom[ei]);
          const sent = Math.min(avail, offpeakHeadroom[target], bottleneck);
          if (sent <= 1e-9) break;
          let totalLossFrac = 0;
          for (const ei of edges) { const e = this.edgeMeta[ei]; totalLossFrac = 1 - (1 - totalLossFrac) * (1 - lossFraction(e.length, sent, e.limit)); }
          creditOffpeak(target, sent * (1 - totalLossFrac));
          avail -= sent;
          coalOffpeakSentByRegion[srcIdx] += sent;
          totalLosses += sent - sent * (1 - totalLossFrac);
          for (const ei of edges) { headroom[ei] -= sent; edgeFlow[ei] += sent; }
        }
      }
      // Attribute the extra coal back to the individual units that produced it. Without this,
      // genLog understates coal by exactly the amount generated for off-peak charging: the energy
      // was routed from a REGION's pooled headroom and never written to any generator's own
      // dispatched figure. That left the per-carrier totals wrong and made it impossible to put
      // storage charging on the dispatch chart, because the generation backing it was missing.
      // Distributed cheapest-first within each region, in proportion to remaining headroom, which
      // matches the merit order the main dispatch loop already used.
      REGIONS.forEach((region, i) => {
        let toAttribute = coalOffpeakSentByRegion[i];
        if (toAttribute <= 1e-9) return;
        const units = genLog.filter(g => g.region === region && COAL_CARRIERS.includes(g.carrier)
                                      && (g.available - g.dispatched) > 1e-9);
        // genLog is built in merit order, so iterating in place keeps cheapest-first
        for (const g of units) {
          if (toAttribute <= 1e-9) break;
          const room = g.available - g.dispatched;
          const take = Math.min(room, toAttribute);
          g.dispatched += take;
          toAttribute -= take;
        }
      });
      this._coalOffpeakSentByRegion = coalOffpeakSentByRegion; // read by the ramp-tracking update below
    }

    // --- Charging from curtailed renewables, network-routed. Reuses the same Dijkstra/pathEdges
    // machinery as the main dispatch loop, continuing to deplete the SAME headroom array (so this
    // pass only uses whatever transmission capacity is left after the main dispatch and the
    // off-peak coal charging above). A region's own storage is naturally preferred (Dijkstra
    // finds distance-0 targets first), but power can travel to a DIFFERENT region's storage too.
    const psCap = REGIONS.map(r => Math.max(0, Math.min(PS_MW_BY_REGION[r] || 0, (PS_ENERGY_MWH_BY_REGION[r] || 0) - this.psSoc[r])));
    const battCap = REGIONS.map(r => Math.max(0, Math.min(this.battMw[r] || 0, (this.battMw[r] || 0) * BATT_HOURS - this.battSoc[r])));
    const chargeHeadroom = REGIONS.map((r, i) => psCap[i] + battCap[i]);
    let psRenewChargeTotal = 0, battRenewChargeTotal = 0;
    const creditCharge = (i, mwh) => {
      const toPs = Math.min(mwh, psCap[i]);
      this.psSoc[REGIONS[i]] += toPs * PS_EFF; psCap[i] -= toPs; psRenewChargeTotal += toPs;
      const toBatt = Math.min(mwh - toPs, battCap[i]);
      this.battSoc[REGIONS[i]] += toBatt * BATT_EFF; battCap[i] -= toBatt; battRenewChargeTotal += toBatt;
      chargeHeadroom[i] -= (toPs + toBatt);
      return toPs + toBatt;
    };

    let renewChargeTotal = 0;
    for (const g of genLog) {
      if (g.curtailed <= 1e-6) continue;
      let avail = g.curtailed;
      const homeIdx = this.nodeIndex[g.region];
      let guard = 0;
      while (avail > 1e-6 && guard++ < n) {
        const { dist, prevEdge } = this.dijkstra(homeIdx, headroom);
        let target = -1, bestDist = Infinity;
        for (let i = 0; i < n; i++) {
          if (chargeHeadroom[i] > 1e-6 && dist[i] < bestDist) { bestDist = dist[i]; target = i; }
        }
        if (target === -1) break;
        const edges = this.pathEdges(target, prevEdge);
        let bottleneck = Infinity;
        for (const ei of edges) bottleneck = Math.min(bottleneck, headroom[ei]);
        const sent = Math.min(avail, chargeHeadroom[target], bottleneck);
        if (sent <= 1e-9) break;
        let totalLossFrac = 0;
        for (const ei of edges) { const e = this.edgeMeta[ei]; totalLossFrac = 1 - (1 - totalLossFrac) * (1 - lossFraction(e.length, sent, e.limit)); }
        const delivered = sent * (1 - totalLossFrac);
        const credited = creditCharge(target, delivered);
        avail -= sent;
        totalLosses += sent - delivered;
        renewChargeTotal += credited;
        for (const ei of edges) { headroom[ei] -= sent; edgeFlow[ei] += sent; }
      }
      // Energy that went from this generator into storage was dispatched, not curtailed. Only
      // reducing g.curtailed left it missing from g.dispatched, so genLog understated renewable
      // output by exactly the amount used for charging.
      g.dispatched += (g.curtailed - avail);
      g.curtailed = avail; // update to reflect what charging actually absorbed
    }
    totalCurtailed -= renewChargeTotal;

    // --- Synchronous generation floor. Ensures minimum synchronous online capacity for inertia,
    // fault current and voltage stability. Non-coal synchronous sources (nuclear, hydro, imports)
    // are already must-take; only shortfall requiring coal is forced here. Distributed cheapest-
    // first (already merit-ordered), absorbing surplus into storage or curtailment.
    if (this.syncFloorMW > 0) {
      let syncOnline = 0;
      genLog.forEach(g => {
        if (['nuclear','hydro','imports','coal','sasol_coal','sasol_gas','ocgt_diesel','ocgt_avf','rmippp'].includes(g.carrier))
          syncOnline += g.dispatched;
      });
      let syncShortfall = this.syncFloorMW - syncOnline;
      if (syncShortfall > 1) {
        // Force additional coal, cheapest-first, into regions with spare available capacity
        for (const g of this.thermalFleet) {
          if (syncShortfall <= 1) break;
          if (!COAL_CARRIERS.includes(g.carrier)) continue;
          const st = this.unitState[g.name];
          if (!st || !st.committed) continue;
          const rampUp = (g.rampUpFrac != null ? g.rampUpFrac : 1) * g.capacityMw;
          const already = genLog.filter(x => x.name === g.name || x.name === g.name+' [min]')
                                 .reduce((a,x) => a + x.dispatched, 0);
          const ceiling = Math.min(g.capacityMw, st.prevOut + rampUp);
          const room = Math.max(0, ceiling - already);
          if (room < 1) continue;
          const take = Math.min(room, syncShortfall);
          const homeIdx = this.nodeIndex[g.region];
          const usedByDemand = Math.min(take, Math.max(0, remainingDeficit[homeIdx]));
          remainingDeficit[homeIdx] -= usedByDemand;
          let surplus = take - usedByDemand;
          const psRoom = Math.max(0,(PS_ENERGY_MWH_BY_REGION[g.region]||0)-this.psSoc[g.region]);
          const psTake = Math.min(surplus,PS_MW_BY_REGION[g.region]||0,psRoom);
          if(psTake>0){this.psSoc[g.region]+=psTake*PS_EFF;surplus-=psTake;psCoalChargeTotal+=psTake;}
          const battRoom=Math.max(0,(this.battMw[g.region]||0)*BATT_HOURS-this.battSoc[g.region]);
          const battTake=Math.min(surplus,this.battMw[g.region]||0,battRoom);
          if(battTake>0){this.battSoc[g.region]+=battTake*BATT_EFF;surplus-=battTake;battCoalChargeTotal+=battTake;}
          totalCurtailed += surplus; forcedCurtailed += surplus;
          genLog.push({name:g.name,region:g.region,carrier:g.carrier,
                       homeTake:usedByDemand,curtailed:0,dispatched:take,available:take});
          syncShortfall -= take;
        }
      }
    }

    // --- Forced ramp-down generation for ALL coal units (committed or decommitting) whose
    // physical output floor wasn't met by the dispatch loop. The dispatch loop only takes what
    // the deficit needs, so when a region's deficit is already covered, a unit's [min] block
    // gets skipped and its dispatched reads as zero. That snapped prevOut to zero, letting
    // units violate their ramp-down limit at up to 5x (Kendal: 1,024 MW drop against a
    // 205 MW/hr allowance). The fix: force the missing generation, absorb the surplus into
    // storage or curtail it - the same mechanism the single-node engine uses with its
    // coalFloor in the surplus branch.
    const perUnitDispatched = {};
    genLog.forEach(g => {
      if (!COAL_CARRIERS.includes(g.carrier)) return;
      const base = g.name.replace(/ \[min\]$/, '');
      perUnitDispatched[base] = (perUnitDispatched[base] || 0) + g.dispatched;
    });
    this.thermalFleet.forEach(g => {
      if (!COAL_CARRIERS.includes(g.carrier)) return;
      const st = this.unitState[g.name];
      if (!st || st.prevOut < 1e-6) return;
      const rampDown = (g.rampDownFrac != null ? g.rampDownFrac : 1) * g.capacityMw;
      const floor = Math.max(0, st.prevOut - rampDown);
      const alreadyDispatched = perUnitDispatched[g.name] || 0;
      const shortfall = floor - alreadyDispatched;
      if (shortfall < 1e-6) return; // dispatch loop already met the floor
      // Force the shortfall
      const homeIdx = this.nodeIndex[g.region];
      const usedByDemand = Math.min(shortfall, Math.max(0, remainingDeficit[homeIdx]));
      remainingDeficit[homeIdx] -= usedByDemand;
      let surplus = shortfall - usedByDemand;
      const psRoom = Math.max(0, (PS_ENERGY_MWH_BY_REGION[g.region] || 0) - this.psSoc[g.region]);
      const psTake = Math.min(surplus, PS_MW_BY_REGION[g.region] || 0, psRoom);
      if (psTake > 0) { this.psSoc[g.region] += psTake * PS_EFF; surplus -= psTake; psCoalChargeTotal += psTake; }
      const battRoom = Math.max(0, (this.battMw[g.region] || 0) * BATT_HOURS - this.battSoc[g.region]);
      const battTake = Math.min(surplus, this.battMw[g.region] || 0, battRoom);
      if (battTake > 0) { this.battSoc[g.region] += battTake * BATT_EFF; surplus -= battTake; battCoalChargeTotal += battTake; }
      totalCurtailed += surplus; forcedCurtailed += surplus;
      genLog.push({ name: g.name, region: g.region, carrier: g.carrier,
                    homeTake: usedByDemand, curtailed: 0,
                    dispatched: shortfall, available: shortfall });
    });

    const psChargeTotal = psCoalChargeTotal + psRenewChargeTotal;
    const battChargeTotal = battCoalChargeTotal + battRenewChargeTotal;

    // Update ramp reference for next hour from genLog, which now already includes the off-peak
    // charging generation (attributed back to individual units above). It previously had to be
    // added separately here because genLog didn't carry it; doing both would double-count.
    const coalDispatchedByRegion = {};
    REGIONS.forEach(r => { coalDispatchedByRegion[r] = 0; });
    genLog.forEach(g => { if (COAL_CARRIERS.includes(g.carrier)) coalDispatchedByRegion[g.region] += g.dispatched; });
    this._coalOffpeakSentByRegion = null;
    REGIONS.forEach(r => { this.prevCoalGenByRegion[r] = coalDispatchedByRegion[r]; });
    // per-unit output for next hour's ramp reference (merge the [min] and flexible blocks back)
    const perUnitOut = {};
    genLog.forEach(g => {
      if (!COAL_CARRIERS.includes(g.carrier)) return;
      const base = g.name.replace(/ \[min\]$/, '');
      perUnitOut[base] = (perUnitOut[base] || 0) + g.dispatched;
    });
    this.thermalFleet.forEach(g => {
      if (!COAL_CARRIERS.includes(g.carrier)) return;
      const st = this.unitState[g.name];
      if (!st) return;
      const dispatched = perUnitOut[g.name] || 0;
      if (!st.committed && dispatched < 1e-6) {
        // Decommitting unit whose forced generation wasn't dispatched (or has finished ramping
        // down): walk prevOut down by rampDown, but no further than zero
        const rampDown = (g.rampDownFrac != null ? g.rampDownFrac : 1) * g.capacityMw;
        st.prevOut = Math.max(0, st.prevOut - rampDown);
      } else {
        // Normal case: prevOut = what was dispatched, but NEVER below the ramp-constrained
        // floor. A committed unit still physically runs at [min] even if its [min] block was
        // only partially dispatched because the region had no deficit. Without this floor,
        // prevOut could drop to a fraction of [min] in one hour (Kendal* went from 245 to 39),
        // then next hour's ramp ceiling starts from that artificially low base.
        const rampDown = (g.rampDownFrac != null ? g.rampDownFrac : 1) * g.capacityMw;
        const floor = Math.max(0, st.prevOut - rampDown);
        st.prevOut = Math.max(dispatched, floor);
      }
    });

    const unserved = {};
    for (let i = 0; i < n; i++) unserved[REGIONS[i]] = Math.max(remainingDeficit[i], 0);
    const rawDemandByName = {}, netDemandByName = {}, rooftopByName = {};
    for (let i = 0; i < n; i++) {
      rawDemandByName[REGIONS[i]] = rawDemand[i];   // true customer demand (what people consumed)
      netDemandByName[REGIONS[i]] = demand[i];       // grid-facing demand, after rooftop netting - what the network had to solve
      rooftopByName[REGIONS[i]] = rooftopGen[i];
    }

    return { hour: hourIdx, demand: rawDemandByName, netDemand: netDemandByName,
             rooftopGen: rooftopByName, unserved, totalLosses, totalCurtailed, forcedCurtailed, genLog,
             storage: { psDischargeTotal, battDischargeTotal, psChargeTotal, battChargeTotal },
             edgeFlow };
  }
}

if (typeof module !== 'undefined') module.exports = { NodalEngine, REGIONS, CORRIDORS, lossFraction };

// CLI: called as `node nodal_engine.js <startHour> <coalEafPct> <newBattMw>`
// Runs the engine from hour 0 to startHour-1 and prints SoC as JSON to stdout.
// Used by pypsa_crossval_uc.py to get reproducible storage initial conditions.
if (typeof require !== 'undefined' && require.main === module) {
  const fs = require('fs');
  const startHour = parseInt(process.argv[2] || '3264');
  const coalEafPct = parseFloat(process.argv[3] || '64');
  const newBattMw  = parseFloat(process.argv[4] || '0');

  function parseCSV(text) {
    const lines = text.trim().split('\n'), headers = lines[0].split(',');
    return lines.slice(1).map(line => { const v=line.split(','),r={}; headers.forEach((h,j)=>{r[h]=v[j];}); return r; });
  }

  const demandRows = parseCSV(fs.readFileSync('demand_2025_regional.csv','utf8'));
  const demandByRegion = {};
  REGIONS.forEach(r=>{ demandByRegion[r]=new Float64Array(8760); });
  demandRows.forEach((row,i)=>{ if(i<8760) REGIONS.forEach(r=>{ const v=row[r+'_corrected']; demandByRegion[r][i]=v&&v!=='-'?parseFloat(v)||0:0; }); });

  const profiles = JSON.parse(fs.readFileSync('profiles_regional.json','utf8'));
  const windPu={}, solarPu={};
  REGIONS.forEach(r=>{ windPu[r]=Float64Array.from(profiles.wind_pu[r]); solarPu[r]=Float64Array.from(profiles.solar_pu[r]); });

  const cap = JSON.parse(fs.readFileSync('regional_renewable_capacity.json','utf8'));
  const rooftopMw = JSON.parse(fs.readFileSync('rooftop_mw_by_region.json','utf8'));

  // WHEELED-SOLAR DOUBLE COUNT (fixed 15 Aug 2026, matching the national engine):
  // Eskom's rooftop series is contractual, so the ~488 MW of ground-mounted
  // wheeled solar in by_source.private sits INSIDE rooftop_mw_by_region.json as
  // well. It generates as supply from the capacity file, so leaving it in the
  // rooftop netting counts it twice. Subtract per region, sharing the same
  // sourced number the capacity identities use - the rooftop file itself stays
  // verbatim Eskom.
  const _priv = (cap.by_source && cap.by_source.private && cap.by_source.private.solar_mw) || {};
  Object.keys(rooftopMw).forEach(r => { rooftopMw[r] = Math.max(0, rooftopMw[r] - (_priv[r] || 0)); });

  // fleet: parse CSV keeping quotes/commas correctly via manual field split
  const fleetRaw = fs.readFileSync('fleet_by_region_v2.csv','utf8').trim().split('\n');
  // strip surrounding quotes from each field (the CSV uses quoted fields throughout)
  const unq = s => s ? s.replace(/^"+|"+$/g,'').trim() : '';
  const fHdr = fleetRaw[0].split(',').map(unq);
  const fleet = fleetRaw.slice(1).map(line=>{
    const v=line.split(','), row={};
    fHdr.forEach((h,j)=>{ row[h]=unq(v[j]||''); }); return row;
  }).filter(r=>r.Scenario==='BASE').map(r=>{
    const f=k=>{const v=r[k]; return(!v||v==='-')?0:(parseFloat(v)||0);};
    return { name:r['Power Station Name'], region:r['region'], carrier:r['Carrier'],
             capacityMw:f('Capacity (MW)'),
             marginalCost:f('Heat Rate (GJ/MWh)')*f('Fuel Price (R/GJ)')+f('Variable O&M Cost (R/MWh)'),
             decomYear:Infinity, minStableFrac:f('Min Stable Level (%)'),
             rampUpFrac:f('Max Ramp Up (%/h)')||1, rampDownFrac:f('Max Ramp Down (%/h)')||1,
             minUpTime:f('Min Up Time (h)'), minDownTime:f('Min Down Time (h)'),
             startUpCost:f('Start Up Cost (R)') };
  });

  const nat = JSON.parse(fs.readFileSync('profiles.json','utf8'));
  const cspPu = nat.csp_pu ? Float64Array.from(nat.csp_pu) : null;

  const e = new NodalEngine({ demandByRegion, windPu, solarPu, windMw:cap.wind_mw, solarMw:cap.solar_mw, rooftopMw, fleet, cspPu });
  // Cyclic initialisation: run a full year from the default starting SoC, then use
  // the end-of-year SoC as the starting point for a second pass. The SoC at startHour
  // in the second pass is self-consistent with the dispatch logic - it reflects how
  // storage actually behaves in this scenario rather than an arbitrary 50%/70% assumption.
  // This replaces the hardcoded SoC values that were only valid for one specific scenario.
  e.setScenario(coalEafPct, 0, {},{}, 0, newBattMw, {},{},{},{}, 0, false, null, 0, 0);
  for (let h = 0; h < 8760; h++) e.dispatchHour(h); // warmup year

  // capture end-of-warmup SoC and re-initialise for the real run
  const warmupPsSoc = { ...e.psSoc };
  const warmupBattSoc = { ...e.battSoc };
  e.setScenario(coalEafPct, 0, {},{}, 0, newBattMw, {},{},{},{}, 0, false, null, 0, 0);
  REGIONS.forEach(r => { e.psSoc[r] = warmupPsSoc[r] || 0; e.battSoc[r] = warmupBattSoc[r] || 0; });
  for (let h = 0; h < startHour; h++) e.dispatchHour(h);

  const soc = {};
  REGIONS.forEach(r => { soc[r] = { ps: Math.round((e.psSoc[r]||0)*100)/100, batt: Math.round((e.battSoc[r]||0)*100)/100 }; });
  process.stdout.write(JSON.stringify(soc)+'\n');
}
