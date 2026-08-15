// GridTwin ZA - Comprehensive stress-test suite for nodal_engine.js
// Run with: node stress_suite.js
// Checks: crashes, NaN/Infinity, negative energies, energy conservation, determinism,
// state-leakage between runs, monotonicity, and performance - across a wide battery of scenarios.

const fs = require('fs');
const path = require('path');
const { NodalEngine, REGIONS, CORRIDORS } = require('./nodal/nodal_engine.js');

function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const vals = line.split(',');
    const row = {};
    headers.forEach((h, j) => { row[h] = vals[j]; });
    return row;
  });
}

function loadData() {
  const demandRows = parseCSV(fs.readFileSync('nodal/demand_2025_regional.csv', 'utf8'));
  const demandByRegion = {};
  REGIONS.forEach(r => { demandByRegion[r] = new Float64Array(8760); });
  demandRows.forEach((row, i) => { REGIONS.forEach(r => { demandByRegion[r][i] = parseFloat(row[r + '_corrected']); }); });

  const profiles = JSON.parse(fs.readFileSync('nodal/profiles_regional.json', 'utf8'));
  const windPu = {}, solarPu = {};
  REGIONS.forEach(r => { windPu[r] = Float64Array.from(profiles.wind_pu[r]); solarPu[r] = Float64Array.from(profiles.solar_pu[r]); });

  const cap = JSON.parse(fs.readFileSync('nodal/regional_renewable_capacity.json', 'utf8'));
  const rooftopMw = JSON.parse(fs.readFileSync('nodal/rooftop_mw_by_region.json', 'utf8'));

  const fleetRows = parseCSV(fs.readFileSync('nodal/fleet_by_region_v2.csv', 'utf8'));
  const fleet = fleetRows.filter(r => r.Scenario === 'BASE').map(r => {
    const hr = parseFloat(r['Heat Rate (GJ/MWh)']) || 0;
    const fp = parseFloat(r['Fuel Price (R/GJ)']) || 0;
    const vom = parseFloat(r['Variable O&M Cost (R/MWh)']) || 0;
    const decomRaw = r['Decommissioning Date'];
    const decomYear = (decomRaw === '-' || !decomRaw) ? Infinity : parseInt(decomRaw, 10);
    return { name: r['Power Station Name'], region: r['region'], carrier: r['Carrier'],
             capacityMw: parseFloat(r['Capacity (MW)']), marginalCost: hr * fp + vom, decomYear };
  });

  return { demandByRegion, windPu, solarPu, windMw: cap.wind_mw, solarMw: cap.solar_mw, rooftopMw, fleet };
}

const data = loadData();
const engine = new NodalEngine(data);

let totalChecks = 0, totalFailures = 0;
const failures = [];

function check(condition, label, detail) {
  totalChecks++;
  if (!condition) {
    totalFailures++;
    failures.push({ label, detail });
    console.log(`  ❌ FAIL: ${label}${detail ? ' — ' + detail : ''}`);
  }
}

function runYear(coalEafPct, coalDecomMW, extraWind, extraSolar, newRooftopMW, newBattMW) {
  engine.setScenario(coalEafPct, coalDecomMW, extraWind || {}, extraSolar || {}, newRooftopMW || 0, newBattMW || 0);
  let totalDemand = 0, totalUnserved = 0, totalLosses = 0, totalCurtailed = 0, totalRooftop = 0;
  let psDis = 0, battDis = 0;
  const nanFound = [], negFound = [];
  for (let h = 0; h < 8760; h++) {
    const r = engine.dispatchHour(h);
    const d = Object.values(r.demand).reduce((a, b) => a + b, 0);
    const u = Object.values(r.unserved).reduce((a, b) => a + b, 0);
    totalDemand += d; totalUnserved += u;
    totalLosses += r.totalLosses; totalCurtailed += r.totalCurtailed;
    totalRooftop += Object.values(r.rooftopGen).reduce((a, b) => a + b, 0);
    psDis += r.storage.psDischargeTotal; battDis += r.storage.battDischargeTotal;

    if (!Number.isFinite(d) || !Number.isFinite(u) || !Number.isFinite(r.totalLosses) || !Number.isFinite(r.totalCurtailed)) nanFound.push(h);
    if (u < -1e-6 || r.totalLosses < -1e-6 || r.totalCurtailed < -1e-6) negFound.push(h);
    Object.values(r.demand).forEach(v => { if (v < -1e-6) negFound.push(h); });
    r.genLog.forEach(g => {
      if (!Number.isFinite(g.dispatched) || !Number.isFinite(g.curtailed)) nanFound.push(h);
      if (g.dispatched < -1e-6 || g.curtailed < -1e-6) negFound.push(h);
      if (g.dispatched > g.available + 1e-3) negFound.push(h); // dispatched can't exceed what was available
    });
  }
  return { totalDemand, totalUnserved, totalLosses, totalCurtailed, totalRooftop, psDis, battDis, nanFound, negFound };
}

console.log('='.repeat(70));
console.log('SUITE 1: Boundary and extreme scenarios');
console.log('='.repeat(70));

const scenarios = [
  ['Default baseline', 64, 0, {}, {}, 0, 0],
  ['Zero EAF (total coal collapse)', 0, 0, {}, {}, 0, 0],
  ['100% EAF (best case)', 100, 0, {}, {}, 0, 0],
  ['Full coal decommissioned (42GW)', 64, 42000, {}, {}, 0, 0],
  ['Crisis (2023-like, 50% EAF)', 50, 0, {}, {}, 0, 0],
  ['Severe crisis (35% EAF + 20GW decom)', 35, 20000, {}, {}, 0, 0],
  ['Massive solar overbuild (+30GW Northern Cape)', 64, 0, {}, { 'Northern Cape': 30000 }, 0, 0],
  ['Massive wind overbuild (+30GW KZN, weak resource)', 64, 0, { 'Kwazulu Natal': 30000 }, {}, 0, 0],
  ['Zero new anything, zero decom, 0% EAF + massive overbuild', 0, 0, { 'Eastern Cape': 20000 }, { 'Western Cape': 20000 }, 0, 0],
  ['Max new rooftop (40GW)', 64, 0, {}, {}, 40000, 0],
  ['Max new batteries (huge)', 64, 0, {}, {}, 0, 50000],
  ['All allocations at once, every region', 64, 5000,
    Object.fromEntries(REGIONS.map(r => [r, 2000])),
    Object.fromEntries(REGIONS.map(r => [r, 2000])), 5000, 5000],
];

for (const [label, eaf, decom, ew, es, nr, nb] of scenarios) {
  console.log(`\n--- ${label} ---`);
  const t0 = Date.now();
  const res = runYear(eaf, decom, ew, es, nr, nb);
  const dt = Date.now() - t0;
  check(res.nanFound.length === 0, `${label}: no NaN/Infinity`, res.nanFound.length ? `hours: ${res.nanFound.slice(0,5).join(',')}` : '');
  check(res.negFound.length === 0, `${label}: no negative/impossible values`, res.negFound.length ? `hours: ${res.negFound.slice(0,5).join(',')}` : '');
  check(res.totalUnserved <= res.totalDemand + 1, `${label}: unserved never exceeds demand`, `unserved=${res.totalUnserved.toFixed(0)} demand=${res.totalDemand.toFixed(0)}`);
  check(dt < 10000, `${label}: completes in reasonable time`, `${dt}ms`);
  console.log(`  demand=${(res.totalDemand/1e6).toFixed(1)}TWh unserved=${(100*res.totalUnserved/res.totalDemand).toFixed(2)}% curtailed=${(res.totalCurtailed/1e3).toFixed(0)}GWh time=${dt}ms`);
}

console.log('\n' + '='.repeat(70));
console.log('SUITE 2: Determinism (same inputs must always give same outputs)');
console.log('='.repeat(70));
{
  const a = runYear(58, 3000, { 'Eastern Cape': 2000 }, { 'Northern Cape': 3000 }, 1000, 500);
  const b = runYear(58, 3000, { 'Eastern Cape': 2000 }, { 'Northern Cape': 3000 }, 1000, 500);
  check(Math.abs(a.totalUnserved - b.totalUnserved) < 1e-6, 'Determinism: identical unserved across repeat runs', `${a.totalUnserved} vs ${b.totalUnserved}`);
  check(Math.abs(a.totalCurtailed - b.totalCurtailed) < 1e-6, 'Determinism: identical curtailed across repeat runs', `${a.totalCurtailed} vs ${b.totalCurtailed}`);
  check(Math.abs(a.psDis - b.psDis) < 1e-6, 'Determinism: identical storage discharge across repeat runs', `${a.psDis} vs ${b.psDis}`);
  console.log(`  Run A: unserved=${a.totalUnserved.toFixed(1)} curtailed=${a.totalCurtailed.toFixed(1)} psDis=${a.psDis.toFixed(1)}`);
  console.log(`  Run B: unserved=${b.totalUnserved.toFixed(1)} curtailed=${b.totalCurtailed.toFixed(1)} psDis=${b.psDis.toFixed(1)}`);
}

console.log('\n' + '='.repeat(70));
console.log('SUITE 3: State leakage between different scenario runs');
console.log('='.repeat(70));
{
  // Run baseline, then a totally different crisis scenario, then baseline again.
  // The THIRD run must exactly match the FIRST - proving setScenario() fully resets
  // internal state (SoC, thermalFleet, etc.) rather than carrying over side effects.
  const first = runYear(64, 0, {}, {}, 0, 0);
  const middle = runYear(35, 20000, { 'Kwazulu Natal': 10000 }, {}, 5000, 5000);
  const third = runYear(64, 0, {}, {}, 0, 0);
  check(Math.abs(first.totalUnserved - third.totalUnserved) < 1e-6, 'State leakage: baseline unserved unaffected by intervening run', `${first.totalUnserved} vs ${third.totalUnserved}`);
  check(Math.abs(first.totalCurtailed - third.totalCurtailed) < 1e-6, 'State leakage: baseline curtailed unaffected by intervening run', `${first.totalCurtailed} vs ${third.totalCurtailed}`);
  check(Math.abs(first.psDis - third.psDis) < 1e-6, 'State leakage: baseline storage discharge unaffected', `${first.psDis} vs ${third.psDis}`);
  console.log(`  First baseline:  unserved=${first.totalUnserved.toFixed(1)} psDis=${first.psDis.toFixed(1)}`);
  console.log(`  Middle (crisis): unserved=${middle.totalUnserved.toFixed(1)} psDis=${middle.psDis.toFixed(1)}`);
  console.log(`  Third baseline:  unserved=${third.totalUnserved.toFixed(1)} psDis=${third.psDis.toFixed(1)}`);
}

console.log('\n' + '='.repeat(70));
console.log('SUITE 4: Monotonicity (more capacity/EAF should never make things worse)');
console.log('='.repeat(70));
{
  const lowEaf = runYear(45, 10000, {}, {}, 0, 0);
  const higherEaf = runYear(55, 10000, {}, {}, 0, 0);
  check(higherEaf.totalUnserved <= lowEaf.totalUnserved + 1, 'Monotonicity: higher EAF never increases unserved energy',
    `45%EAF=${lowEaf.totalUnserved.toFixed(0)} vs 55%EAF=${higherEaf.totalUnserved.toFixed(0)}`);

  const noExtra = runYear(45, 15000, {}, {}, 0, 0);
  const withExtraWind = runYear(45, 15000, { 'Northern Cape': 5000 }, {}, 0, 0);
  check(withExtraWind.totalUnserved <= noExtra.totalUnserved + 1, 'Monotonicity: adding wind capacity never increases unserved energy',
    `no-extra=${noExtra.totalUnserved.toFixed(0)} vs with-extra=${withExtraWind.totalUnserved.toFixed(0)}`);
  console.log(`  45%EAF unserved=${(lowEaf.totalUnserved/1e3).toFixed(1)}GWh, 55%EAF unserved=${(higherEaf.totalUnserved/1e3).toFixed(1)}GWh`);
  console.log(`  No extra wind unserved=${(noExtra.totalUnserved/1e3).toFixed(1)}GWh, +5GW NC wind unserved=${(withExtraWind.totalUnserved/1e3).toFixed(1)}GWh`);
}


// ============================================================
// SUITE 5-8: Single-node engine (simulate())
// These tests catch bugs in the national-aggregate dispatch
// that the nodal engine tests above would NEVER catch.
// The blank-chart SYNC_MIN_MW bug (August 2026) would have
// been caught here in < 1 second.
// ============================================================

console.log('\n' + '='.repeat(70));
console.log('Loading single-node engine (simulate)...');
console.log('='.repeat(70));

// Load simulate() from index.html's second <script> block
const html = fs.readFileSync('index.html', 'utf8');
// Use simple indexOf-based extraction since the regex matchAll may not find all blocks
const simBlocks = [];
let searchFrom = 0;
while(true){
  const start = html.indexOf('<script>', searchFrom);
  if(start < 0) break;
  const end = html.indexOf('</script>', start);
  if(end < 0) break;
  simBlocks.push(html.slice(start+8, end));
  searchFrom = end+9;
}
const simScript = simBlocks.find(s => s.includes('function simulate('));
if (!simScript) { console.log('ERROR: could not find simulate() in index.html'); process.exit(1); }

// Minimal DOM stubs so the script doesn't crash at load time
const domStub = () => ({ style:{}, dataset:{}, innerHTML:'', textContent:'', getAttribute:()=>null, setAttribute:()=>{}, querySelector:()=>null, querySelectorAll:()=>[], addEventListener:()=>{} });
// Can't use Object.assign on global due to read-only properties - set individually
const elStub = () => { const el = {}; el.style={}; el.dataset={}; el.innerHTML=''; el.textContent=''; el.className=''; el.classList={add:()=>{},remove:()=>{},contains:()=>false}; el.children=[]; el.childNodes=[]; el.getAttribute=()=>null; el.setAttribute=()=>{}; el.appendChild=()=>elStub(); el.querySelector=()=>elStub(); el.querySelectorAll=()=>[]; el.addEventListener=()=>{}; return el; };
global.document = { getElementById:()=>elStub(), querySelector:()=>elStub(), querySelectorAll:()=>[], createElement:()=>elStub(), body:{appendChild:()=>{},style:{}} };
global.window = { addEventListener:()=>{} };
global.location = { search:'', pathname:'/', href:'http://localhost/' };
global.history = { replaceState:()=>{} };
if(!global.URLSearchParams) global.URLSearchParams = class{ constructor(){} get(){return null;} toString(){return '';} };
global.performance = { now:()=>Date.now() };
global.fetch = ()=>Promise.resolve({json:()=>Promise.resolve({}),text:()=>Promise.resolve('')});
global.requestAnimationFrame = ()=>{};
global.localStorage = { getItem:()=>null, setItem:()=>{} };
// navigator already exists in Node, don't override it
// Truncate before startup code (let PROFILES=buildProfiles() calls fetch,
// and run() calls render() which touches the DOM). We only need the function
// definitions, which all come before line ~1424 in index.html.
const truncateMarker = 'let PROFILES=buildProfiles();';
const cutAt = simScript.indexOf(truncateMarker);
const simScriptClean = cutAt > 0 ? simScript.slice(0, cutAt) : simScript;
// Use vm.runInThisContext so function declarations land on the global object
const vm = require('vm');
// Inject constants that simulate() needs but are defined in nodal_engine.js
// (loaded as a separate <script src> in the browser but not available here)
const injectConsts = 'const IMPORTS_CF = 0.85;\n';
try {
  vm.runInThisContext(injectConsts + simScriptClean);
} catch(e) {
  if (typeof simulate === 'undefined') { console.log('vm eval error:', String(e).slice(0,150)); }
}

if (typeof simulate !== 'function') { console.log('ERROR: simulate() not found after eval'); process.exit(1); }
if (typeof genOutagePath !== 'function') { console.log('ERROR: genOutagePath() not found after eval'); process.exit(1); }
console.log('  simulate() and genOutagePath() loaded successfully');

// Build synthetic profiles (real ones need a fetch; these are sufficient for testing)
const SN_HOURS = 8760;
const snProfiles = {
  demand: Float64Array.from({length:SN_HOURS}, (_,h) => 20000 + 5000*Math.sin((h%24-14)*Math.PI/12)),
  solar:  Float64Array.from({length:SN_HOURS}, (_,h) => { const hod=h%24; return (hod>=6&&hod<=18)?0.8*Math.sin((hod-6)*Math.PI/12):0; }),
  wind:   Float64Array.from({length:SN_HOURS}, () => 0.30 + 0.10*Math.random()),
  csp:    Float64Array.from({length:SN_HOURS}, (_,h) => { const hod=h%24; return (hod>=9&&hod<=20)?0.5*Math.sin((hod-9)*Math.PI/11):0; }),
  real: false,
};

const BASE_SN = {demandGrowthPct:0,coalEAFPct:64,coalDecomMW:0,newWindMW:0,newPvMW:0,newRooftopMW:0,newBattMW:0,newCcgtMW:0,newCoalMW:0,newNuclearMW:0,coalFlexPct:0,repurpose:false,carbonTaxRPerT:308,syncMinEnabled:true};

function runSN(params) {
  const r = simulate({...BASE_SN,...params}, snProfiles);
  // 'hybrid' added 14 Aug 2026 (RMIPPPP firm dispatchable renewables). A new
  // carrier must be added to EVERY hardcoded list like this one, or the energy
  // balance silently reports the new carrier's output as an unexplained gap.
  const keys = ['nuclear','hydro','imports','hybrid','coal','ps','batt','ccgt','diesel','wind','pv','csp','unserved'];
  let nanCount=0, negCount=0, chartMism=0;
  for(let h=0;h<SN_HOURS;h++){
    keys.forEach(k=>{ const v=r.stack[k]?.[h]||0; if(!Number.isFinite(v))nanCount++; if(v<-1e-6)negCount++; });
    if(!Number.isFinite(r.loadS[h]))nanCount++;
    if(!Number.isFinite(r.coalGenTotal[h]))nanCount++;
  }
  // chart integrity: stack = loadS (generation serving load = demand + storage charging).
  // curtailMW is separately tracked surplus that went nowhere — it is NOT in the stack
  // and should NOT be subtracted from loadS. The check is simply stack ≈ loadS.
  for(let h=0;h<SN_HOURS;h++){
    const s=keys.reduce((a,k)=>a+(r.stack[k]?r.stack[k][h]:0),0);
    if(Math.abs(s-r.loadS[h])>r.loadS[h]*0.02+5) chartMism++;
  }
  return { ...r.E, shedMWh:r.E.unserved, nanCount, negCount, chartMism,
           peakCoal:Math.max(...Array.from({length:SN_HOURS},(_,h)=>r.coalGenTotal[h])),
           minCoal:Math.min(...Array.from({length:SN_HOURS},(_,h)=>r.coalGenTotal[h])),
           _raw: r }; // full simulate result for energy balance checks
}

// Helper: check annual energy balance for a simulate() result
function checkEnergyBalance(result, label) {
  const r = result._raw || result; // accept both runSN return and raw simulate return
  const E = r.E;
  // Total annual generation (all carriers — excludes unserved which is deficit, not generation)
  const genTotal = E.rooftop + E.wind + E.pv + E.csp + E.nuclear + E.hydro
    + E.imports + (E.hybrid || 0) + E.coal + E.ps + E.batt + E.ccgt + E.diesel;
  // stackSum includes unserved (in stack for chart balance) but excludes rooftop (nets off demand)
  // So: genTotal + E.unserved = stackSum + E.rooftop
  // Rearranged: genTotal = stackSum + E.rooftop - E.unserved
  let stackSum = 0;
  // 'hybrid' added 14 Aug 2026 (RMIPPPP firm dispatchable renewables). A new
  // carrier must be added to EVERY hardcoded list like this one, or the energy
  // balance silently reports the new carrier's output as an unexplained gap.
  const keys = ['nuclear','hydro','imports','hybrid','coal','ps','batt','ccgt','diesel','wind','pv','csp','unserved'];
  for(let h=0;h<8760;h++) keys.forEach(k=>{ stackSum += (r.stack[k]?r.stack[k][h]:0); });
  const expected = stackSum + E.rooftop - E.unserved;
  const gap = Math.abs(expected - genTotal);
  const pct = genTotal > 0 ? gap / genTotal * 100 : 0;
  check(pct < 0.5, `SN ${label}: annual energy balance (genTotal = stack+rooftop-unserved within 0.5%)`,
    `gap=${gap.toFixed(0)} MWh (${pct.toFixed(3)}%)`);

  // Check: loadS = demand + charging (hourly)
  let loadSsum = 0, chargeSum = 0;
  for(let h=0;h<8760;h++){ loadSsum += r.loadS[h]; chargeSum += r.chargeMW[h]; }
  const demandServed = loadSsum - chargeSum;
  // genTotal = demandServed + charging + storage_losses + curtailed(forced)
  // curtailMW includes forced-coal curtailed (in stack) so:
  // stackSum (gen serving demand+charging) + forced_curtail = loadSsum + forced_curtail
  // just check stack sums to loadS within tolerance (already done per hour, sum it annually)
  const loadSgap = Math.abs(stackSum - loadSsum);
  const loadSpct = loadSgap / loadSsum * 100;
  check(loadSpct < 0.1, `SN ${label}: annual stack = annual loadS within 0.1%`,
    `gap=${loadSgap.toFixed(0)} MWh (${loadSpct.toFixed(3)}%)`);

  // Check: curtailed >= 0 and consistent with E.curtailed
  let curtailSum = 0;
  for(let h=0;h<8760;h++) curtailSum += (r.curtailMW?r.curtailMW[h]:0);
  // curtailMW is forced-coal curtailment only; E.curtailed includes renewable curtailment too
  check(E.curtailed >= curtailSum - 1, `SN ${label}: E.curtailed >= curtailMW sum`,
    `E.curtailed=${(E.curtailed/1e3).toFixed(0)}GWh curtailMW_sum=${(curtailSum/1e3).toFixed(0)}GWh`);
  check(E.unserved >= 0 && Number.isFinite(E.unserved), `SN ${label}: E.unserved non-negative finite`);

  return { genTotal, stackSum, demandServed, pct };
}

console.log('\n' + '='.repeat(70));
console.log('SUITE 5: Single-node boundary and extreme scenarios');
console.log('='.repeat(70));
const snScenarios = [
  ['baseline',                {}],
  ['zero EAF',                {coalEAFPct:0}],
  ['100% EAF',                {coalEAFPct:100}],
  ['10GW decom',              {coalDecomMW:10000}],
  ['+50GW solar',             {newPvMW:50000}],
  ['+40GW wind',              {newWindMW:40000}],
  ['+34GW batteries',         {newBattMW:34000}],
  ['syncFloor OFF',           {syncMinEnabled:false}],
  ['syncFloor ON',            {syncMinEnabled:true}],
  ['coalFlex ON',             {coalFlexPct:1}],
  ['crisis+bigbuild',         {coalEAFPct:52,coalDecomMW:15000,newWindMW:25000,newPvMW:35000,newBattMW:8000}],
  ['decom+solar+batt',        {coalDecomMW:20000,newPvMW:40000,newBattMW:18000}],
];
for(const [lbl,p] of snScenarios){
  const r=runSN(p);
  check(r.nanCount===0, `SN ${lbl}: no NaN/Infinity in output arrays`, r.nanCount?r.nanCount+' found':'');
  check(r.negCount===0, `SN ${lbl}: no negative stack values`, r.negCount?r.negCount+' found':'');
  check(r.chartMism===0, `SN ${lbl}: chart integrity (stack+curtail=loadS)`, r.chartMism?r.chartMism+'/8760':'');
  check(Number.isFinite(r.shedMWh) && r.shedMWh>=0, `SN ${lbl}: shed is finite non-negative`);
  check(Number.isFinite(r.curtailed) && r.curtailed>=0, `SN ${lbl}: curtailed is finite non-negative`);
  const bal = checkEnergyBalance(r, lbl);
  console.log(`  ${lbl}: shed=${(r.shedMWh/1e3).toFixed(1)}GWh curtail=${(r.curtailed/1e3).toFixed(0)}GWh balance_gap=${bal.pct.toFixed(3)}%`);
}

console.log('\n' + '='.repeat(70));
console.log('SUITE 6: Single-node determinism and state leakage');
console.log('='.repeat(70));
{
  const a=runSN({coalEAFPct:58,coalDecomMW:3000,newPvMW:15000,newBattMW:500});
  const b=runSN({coalEAFPct:35,coalDecomMW:20000,newWindMW:30000});
  const c2=runSN({coalEAFPct:58,coalDecomMW:3000,newPvMW:15000,newBattMW:500});
  check(Math.abs(a.shedMWh-c2.shedMWh)<1e-6,'SN State leakage: baseline unserved unaffected by intervening run',`\${a.shedMWh} vs \${c2.shedMWh}`);
  check(Math.abs(a.curtailed-c2.curtailed)<1e-6,'SN State leakage: curtailed unaffected',`\${a.curtailed} vs \${c2.curtailed}`);
  console.log(`  Run A: shed=\${(a.shedMWh/1e3).toFixed(1)}GWh  Middle: shed=\${(b.shedMWh/1e3).toFixed(1)}GWh  Run C: shed=\${(c2.shedMWh/1e3).toFixed(1)}GWh`);
}

console.log('\n' + '='.repeat(70));
console.log('SUITE 7: Single-node monotonicity');
console.log('='.repeat(70));
{
  const pairs=[
    ['EAF 45% vs 55%', {coalEAFPct:45,coalDecomMW:10000}, {coalEAFPct:55,coalDecomMW:10000}],
    ['+wind reduces shed', {coalEAFPct:45,coalDecomMW:15000}, {coalEAFPct:45,coalDecomMW:15000,newWindMW:15000}],
    ['+batteries never increases shed (small batt)', {coalDecomMW:20000,newPvMW:40000,newBattMW:3750}, {coalDecomMW:20000,newPvMW:40000,newBattMW:18000}],
  ];
  for(const [lbl,worse,better] of pairs){
    const w=runSN(worse), b2=runSN(better);
    check(b2.shedMWh<=w.shedMWh+100,`SN Monotonicity: ${lbl}`,`worse=${(w.shedMWh/1e3).toFixed(1)} better=${(b2.shedMWh/1e3).toFixed(1)}`);
    console.log(`  ${lbl}: ${(w.shedMWh/1e3).toFixed(1)} → ${(b2.shedMWh/1e3).toFixed(1)} GWh`);
  }
}

console.log('\n' + '='.repeat(70));
console.log('SUITE 8: Single-node Monte Carlo smoke test');
console.log('='.repeat(70));
{
  // Run 20 MC paths and check none crashes, all produce finite results, and P(shed) is monotone with EAF
  function mcP(params, n=20){
    const eaf=({...BASE_SN,...params}).coalEAFPct/100;
    let shedRuns=0;
    for(let j=0;j<n;j++){
      const path=genOutagePath(eaf,0.015,1000+j*7919);
      check(path.length===365,'MC path length is 365 days');
      check(Array.from(path).every(v=>Number.isFinite(v)&&v>=0&&v<=1),'MC path all values in [0,1]');
      const r=simulate({...BASE_SN,...params},snProfiles,path);
      check(Number.isFinite(r.E.unserved)&&r.E.unserved>=0,`MC run \${j}: finite non-negative unserved`);
      if(r.shedMWh>100000) shedRuns++;
    }
    return shedRuns/n;
  }
  const p_bad=mcP({coalEAFPct:45,coalDecomMW:15000});
  const p_good=mcP({coalEAFPct:70,coalDecomMW:0});
  check(p_bad>=p_good,'MC: lower EAF + decom gives higher P(shed)',`p_bad=${p_bad.toFixed(2)} p_good=${p_good.toFixed(2)}`);
  console.log(`  P(shed|crisis)=${(p_bad*100).toFixed(0)}%  P(shed|good)=${(p_good*100).toFixed(0)}%`);
}

console.log('\n' + '='.repeat(70));
console.log(`RESULT: ${totalChecks - totalFailures}/${totalChecks} checks passed`);
if (totalFailures > 0) {
  console.log(`\n${totalFailures} FAILURE(S):`);
  failures.forEach(f => console.log(`  - ${f.label}${f.detail ? ' — ' + f.detail : ''}`));
  process.exit(1);
} else {
  console.log('All checks passed.');
}
console.log('='.repeat(70));
