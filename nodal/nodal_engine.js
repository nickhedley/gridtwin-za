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

const COAL_CARRIERS = ['coal', 'sasol_coal']; // carriers subject to the EAF/decommissioning sliders

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
   *                                (rooftop tends to grow where it's already concentrated)
   */
  setScenario(coalEafPct, coalDecomMW, extraWindByRegion = {}, extraSolarByRegion = {}, newRooftopMW = 0) {
    this.thermalFleet = applyCoalScenario(this.rawFleet, coalEafPct, coalDecomMW)
      .sort((a, b) => a.marginalCost - b.marginalCost);
    this.windMw = {};
    this.solarMw = {};
    this.rooftopMw = {};
    const totalBaseRooftop = REGIONS.reduce((s, r) => s + (this.baseRooftopMw[r] || 0), 0);
    REGIONS.forEach(r => {
      this.windMw[r] = (this.baseWindMw[r] || 0) + (extraWindByRegion[r] || 0);
      this.solarMw[r] = (this.baseSolarMw[r] || 0) + (extraSolarByRegion[r] || 0);
      const rooftopShare = totalBaseRooftop > 0 ? (this.baseRooftopMw[r] || 0) / totalBaseRooftop : 0;
      this.rooftopMw[r] = (this.baseRooftopMw[r] || 0) + newRooftopMW * rooftopShare;
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
                    homeTake: localTake, curtailed: gen.isRenewable ? avail : 0 });
    }

    const unserved = {};
    for (let i = 0; i < n; i++) unserved[REGIONS[i]] = Math.max(remainingDeficit[i], 0);
    const rawDemandByName = {}, netDemandByName = {}, rooftopByName = {};
    for (let i = 0; i < n; i++) {
      rawDemandByName[REGIONS[i]] = rawDemand[i];   // true customer demand (what people consumed)
      netDemandByName[REGIONS[i]] = demand[i];       // grid-facing demand, after rooftop netting - what the network had to solve
      rooftopByName[REGIONS[i]] = rooftopGen[i];
    }

    return { hour: hourIdx, demand: rawDemandByName, netDemand: netDemandByName,
             rooftopGen: rooftopByName, unserved, totalLosses, totalCurtailed, genLog };
  }
}

if (typeof module !== 'undefined') module.exports = { NodalEngine, REGIONS, CORRIDORS, lossFraction };
