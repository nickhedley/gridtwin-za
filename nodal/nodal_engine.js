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

// Batteries: Eskom's BESS rollout spans Western Cape, Eastern Cape, Northern Cape and
// KwaZulu Natal, but no complete public per-site MW breakdown exists (only a few named
// sites: Hex/Graafwater/Paleisheuwel in WC, Elandskop in KZN). This split is a FLAGGED
// ESTIMATE weighted toward WC's larger number of confirmed sites, not verified like the rest.
const BATT_SHARE_BY_REGION = { 'Western Cape': 0.35, 'Eastern Cape': 0.25, 'Northern Cape': 0.20, 'Kwazulu Natal': 0.20 };
const BATT_HOURS = 4;
const BATT_EFF = 0.88;

const COAL_CARRIERS = ['coal', 'sasol_coal']; // carriers subject to the EAF/decommissioning sliders

// Real CSP plant siting (verified against actual GCCA supply-region boundaries):
// Northern Cape 450MW (KaXu, Bokpoort, Xina, Ilanga, Kathu), Hydra Central 50MW (Khi Solar One)
const CSP_MW_BY_REGION = { 'Northern Cape': 450, 'Hydra Central': 50 };

// Imports (Cahora Bassa HVDC) enter the grid at Apollo converter station, Ekurhuleni - Gauteng.
const IMPORTS_REGION = 'Gauteng';
const IMPORTS_MW = 1150;      // matches the single-node app's assumption
const IMPORTS_CF = 0.85;
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
   */
  setScenario(coalEafPct, coalDecomMW, extraWindByRegion = {}, extraSolarByRegion = {}, newRooftopMW = 0, newBattMW = 0) {
    this.thermalFleet = applyCoalScenario(this.rawFleet, coalEafPct, coalDecomMW)
      .sort((a, b) => a.marginalCost - b.marginalCost);
    this.windMw = {};
    this.solarMw = {};
    this.rooftopMw = {};
    this.battMw = {};
    this.psSoc = {};   // MWh, current state of charge per region - carried across dispatchHour() calls
    this.battSoc = {}; // MWh
    const totalBaseRooftop = REGIONS.reduce((s, r) => s + (this.baseRooftopMw[r] || 0), 0);
    REGIONS.forEach(r => {
      this.windMw[r] = (this.baseWindMw[r] || 0) + (extraWindByRegion[r] || 0);
      this.solarMw[r] = (this.baseSolarMw[r] || 0) + (extraSolarByRegion[r] || 0);
      const rooftopShare = totalBaseRooftop > 0 ? (this.baseRooftopMw[r] || 0) / totalBaseRooftop : 0;
      this.rooftopMw[r] = (this.baseRooftopMw[r] || 0) + newRooftopMW * rooftopShare;
      const battShare = BATT_SHARE_BY_REGION[r] || 0;
      this.battMw[r] = 800 * battShare + newBattMW * battShare; // 800MW = single-node app's existing total
      // start at the same fractions the single-node engine uses (70% pumped storage, 50% batteries)
      this.psSoc[r] = (PS_ENERGY_MWH_BY_REGION[r] || 0) * 0.7;
      this.battSoc[r] = (this.battMw[r] * BATT_HOURS) * 0.5;
    });
  }

  buildGenerators(hourIdx) {
    const gens = this.thermalFleet.map(g => ({
      name: g.name, region: g.region, carrier: g.carrier, cost: g.marginalCost,
      availableMw: g.capacityMw, isRenewable: false,
    }));
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
                    availableMw: cspMw * CSP_PROFILE[hourIdx], isRenewable: false }); // must-take, matches single-node treatment
      }
    }
    gens.push({ name: 'Cahora Bassa import', region: IMPORTS_REGION, carrier: 'imports', cost: IMPORTS_COST,
                availableMw: IMPORTS_MW * IMPORTS_CF, isRenewable: false }); // must-take, fixed CF, matches single-node treatment
    // Storage discharge as ordinary generators - this is what lets the existing, already-validated
    // network-flow routing carry discharged power to OTHER regions automatically, same as any
    // other generator. Priced between coal (~480-550) and gas/diesel (1750/6100), matching the
    // single-node engine's own dispatch order (coal first, then storage, then gas/diesel).
    for (const r of REGIONS) {
      const psAvail = Math.min(PS_MW_BY_REGION[r] || 0, this.psSoc[r] || 0);
      if (psAvail > 1e-6) gens.push({ name: r + ' Pumped storage', region: r, carrier: 'ps', cost: 600, availableMw: psAvail, isRenewable: false });
      const battAvail = Math.min(this.battMw[r] || 0, this.battSoc[r] || 0);
      if (battAvail > 1e-6) gens.push({ name: r + ' Battery', region: r, carrier: 'batt', cost: 700, availableMw: battAvail, isRenewable: false });
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
    const headroom = this.edgeMeta.map(e => e.limit);

    const gens = this.buildGenerators(hourIdx);
    let totalLosses = 0, totalCurtailed = 0;
    const genLog = []; // kept lightweight - only what the UI needs

    for (const gen of gens) {
      let avail = gen.availableMw;
      if (avail <= 1e-9) continue;
      const homeIdx = this.nodeIndex[gen.region];

      const localTake = Math.min(avail, Math.max(remainingDeficit[homeIdx], 0));
      remainingDeficit[homeIdx] -= localTake;
      avail -= localTake;

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
        for (const ei of edges) headroom[ei] -= sent;
      }

      if (avail > 1e-6 && gen.isRenewable) totalCurtailed += avail;
      genLog.push({ name: gen.name, region: gen.region, carrier: gen.carrier,
                    homeTake: localTake, curtailed: gen.isRenewable ? avail : 0,
                    dispatched: gen.availableMw - avail, available: gen.availableMw });
    }

    // --- Storage discharge: already dispatched as ordinary generators above (see buildGenerators),
    // so cross-region export already happened via the same validated flow-routing every other
    // generator uses. Just account for the resulting state-of-charge drop here.
    let psDischargeTotal = 0, battDischargeTotal = 0;
    genLog.forEach(g => {
      if (g.carrier === 'ps') { this.psSoc[g.region] -= g.dispatched; psDischargeTotal += g.dispatched; }
      if (g.carrier === 'batt') { this.battSoc[g.region] -= g.dispatched; battDischargeTotal += g.dispatched; }
    });

    // --- Off-peak coal charging (local only - matches the single-node engine's own national
    // version, using each region's own idle coal capacity, hours 23:00-05:00). Same gates and
    // power caps as the single-node engine: pumped storage up to 80% power while below 85% SoC,
    // batteries up to 60% power while below 80% SoC.
    let psCoalChargeTotal = 0, battCoalChargeTotal = 0;
    const hour = hourIdx % 24;
    if (hour <= 5 || hour >= 23) {
      const coalHeadroomByRegion = new Array(n).fill(0);
      genLog.forEach(g => {
        if (COAL_CARRIERS.includes(g.carrier)) coalHeadroomByRegion[this.nodeIndex[g.region]] += (g.available - g.dispatched);
      });
      for (let i = 0; i < n; i++) {
        const r = REGIONS[i];
        let head = coalHeadroomByRegion[i];
        const psPowerMw = PS_MW_BY_REGION[r] || 0, psEnergyMwh = PS_ENERGY_MWH_BY_REGION[r] || 0;
        if (head > 0 && this.psSoc[r] < psEnergyMwh * 0.85) {
          const w = Math.min(psPowerMw * 0.8, psEnergyMwh - this.psSoc[r], head);
          this.psSoc[r] += w * PS_EFF; head -= w; psCoalChargeTotal += w;
        }
        const battPowerMw = this.battMw[r] || 0, battEnergyMwh = battPowerMw * BATT_HOURS;
        if (head > 0 && this.battSoc[r] < battEnergyMwh * 0.8) {
          const w = Math.min(battPowerMw * 0.6, battEnergyMwh - this.battSoc[r], head);
          this.battSoc[r] += w * BATT_EFF; head -= w; battCoalChargeTotal += w;
        }
      }
    }

    // --- Charging from curtailed renewables, network-routed. Reuses the same Dijkstra/pathEdges
    // machinery as the main dispatch loop, continuing to deplete the SAME headroom array (so this
    // pass only uses whatever transmission capacity is left after the main dispatch). A region's
    // own storage is naturally preferred (Dijkstra finds distance-0 targets first), but power can
    // now also travel to a DIFFERENT region's storage if there's spare corridor capacity - this is
    // the piece that was local-only before.
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
        for (const ei of edges) headroom[ei] -= sent;
      }
      g.curtailed = avail; // update to reflect what charging actually absorbed
    }
    totalCurtailed -= renewChargeTotal;

    const psChargeTotal = psCoalChargeTotal + psRenewChargeTotal;
    const battChargeTotal = battCoalChargeTotal + battRenewChargeTotal;

    const unserved = {};
    for (let i = 0; i < n; i++) unserved[REGIONS[i]] = Math.max(remainingDeficit[i], 0);
    const rawDemandByName = {}, netDemandByName = {}, rooftopByName = {};
    for (let i = 0; i < n; i++) {
      rawDemandByName[REGIONS[i]] = rawDemand[i];   // true customer demand (what people consumed)
      netDemandByName[REGIONS[i]] = demand[i];       // grid-facing demand, after rooftop netting - what the network had to solve
      rooftopByName[REGIONS[i]] = rooftopGen[i];
    }

    return { hour: hourIdx, demand: rawDemandByName, netDemand: netDemandByName,
             rooftopGen: rooftopByName, unserved, totalLosses, totalCurtailed, genLog,
             storage: { psDischargeTotal, battDischargeTotal, psChargeTotal, battChargeTotal } };
  }
}

if (typeof module !== 'undefined') module.exports = { NodalEngine, REGIONS, CORRIDORS, lossFraction };
