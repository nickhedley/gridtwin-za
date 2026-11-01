// preset_table.js (user, 30 Oct 2026, messages 523 (b), 528 and 529): the scenarios table for the reviewer Doc, from the page as
// merged: Deep decarbonisation 2035 and Fossil-free 2040, with Least-cost path 2035 for comparison, each in its own year (the presets
// are single-year systems; message 528's answer): new and remaining capacity by technology (GW), mean unserved energy, annual system
// cost (R bn, the engine's systemCostR, as pathcheck's cost), CO2 (Mt), average system cost per MWh served and the peaking plant
// capacity factor, each a mean over the preset check's runs (twelve weather years x K outage draws on twelveYearDemand, as
// preset_rescore.js). Cost of capital: the page's central case (bldCocCase 'central', c6e's basis); no preset overrides it.
// Definitions follow pathcheck.js: average cost is avgCost weighted by gridServed across runs; peaking plant is all open-cycle plant
// (diesel turbines, new open-cycle on diesel and on LNG), energy over capacity x 8,760.
// Seeds: in pairs, below (PRESETS_RUN); the two searched presets on PRESET_SCORES's seeds must reproduce PRESET_SCORES to its four
// decimals or the script stops. Output JSON only (OUT); the table is PRESET_TABLE.md, whose every
// figure is a packfill marker (preset.<code>.<metric>, harness/pathway/tables/packfill.js).
//   node harness/ext/preset_table.js   (from the repository root; K=20)
const fs=require('fs'),path=require('path');const {JSDOM}=require('jsdom');
const ROOT=process.env.ROOT||path.resolve(__dirname,'..','..'), K=+(process.env.K||20);
const OUT=process.env.OUT||path.join(ROOT,'harness/ext/preset_table.json'), SEED_FRESH=+(process.env.SEED_FRESH||260000011);
const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
const dom=new JSDOM(html,{runScripts:'dangerously',resources:'usable',pretendToBeVisual:true,url:'file://'+ROOT+'/index.html',
 beforeParse(w){ w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>({addColorStop(){},data:[],width:0,measureText:()=>({width:10})})});
  const ch=()=>new Proxy(function(){return ch();},{get:()=>ch()}); w.L=new Proxy({},{get(){return function(){return ch();};}});
  w.onerror=()=>{}; Object.defineProperty(w.history,'replaceState',{value:()=>{},writable:true}); w.URL.createObjectURL=()=>'blob:x'; w.Worker=function(){this.postMessage=()=>{};};
  w.fetch=async(u)=>{try{const cl=String(u).split('?')[0].replace(/^file:.*?\/(?=nodal\/|profiles|config|harness\/coal)/,'');const t=fs.readFileSync(path.join(ROOT,cl),'utf8');return{ok:true,json:async()=>JSON.parse(t),text:async()=>t};}catch(e){return{ok:false,json:async()=>{throw e},text:async()=>{throw e}};}};}});
// [code, preset (or a state module in harness/ext/), seed (null: PRESET_SCORES's), must reproduce PRESET_SCORES]. Each pair on the same
// seed, so the comparison is like for like (message 533 (b)): Deep decarbonisation 2035 and Least-cost path 2035 on Deep's PRESET_SCORES
// seed (120000017, a sample it was not topped up on); Fossil-free 2040 and Least-cost path 2040 on Fossil-free's PRESET_SCORES seed
// (71830529, the sample its top-up was confirmed on) and on SEED_FRESH (message 529, a sample it was not topped up on).
const PRESETS_RUN=[['deep','Deep decarbonisation 2035',null,true],['lcp35','Least-cost path 2035',120000017,false],
  ['ff','Fossil-free 2040',null,true],['lcp40','./preset_table_lcp2040.js',71830529,false],
  ['fffresh','Fossil-free 2040',SEED_FRESH,false],['lcp40fresh','./preset_table_lcp2040.js',SEED_FRESH,false],
  // Each preset on the pathway's rooftop for its year (message 534 (a)): rooftop is an input, and the presets carry 1.2 GW a year
  // from 2027 where c6e has the 2027 catch-up step, so their grid demand was higher; the override is the least-cost state's own.
  ['deeproof','Deep decarbonisation 2035',120000017,false,"{newRooftopMW:PRESETS['Least-cost path 2035'].newRooftopMW}"],
  ['ffroof','Fossil-free 2040',71830529,false,"{newRooftopMW:("+require('./preset_table_lcp2040.js').match(/newRooftopMW:(\d+)/)[1]+")}"]];
// ONLY=<code,...>: run those rows and merge them into the existing OUT, keeping the others.
const ONLY=(process.env.ONLY||'').split(',').filter(Boolean);
(async()=>{ for (let i=0;i<80 && !dom.window.GTZA_READY;i++) await new Promise(r=>setTimeout(r,250)); const w=dom.window; await w.eval('loadWeatherYears()');
 const out={stamp:w.eval('BUILD_STAMP'), K, presets:{}};
 if (ONLY.length && fs.existsSync(OUT)) Object.assign(out.presets, JSON.parse(fs.readFileSync(OUT,'utf8')).presets);
 for (const [code,name,seed0,mustMatch,over] of PRESETS_RUN){
  if (ONLY.length && !ONLY.includes(code)) continue;
  const sc=name.startsWith('./')?null:JSON.parse(w.eval(`JSON.stringify(PRESET_SCORES[${JSON.stringify(name)}]||null)`)), SEED=seed0??sc.seed;
  w.eval(name.startsWith('./')?`applyState(${require(name)});`:`applyState(PRESETS[${JSON.stringify(name)}]);`);
  if (over) w.eval(`Object.assign(state, ${over});`);
  const t0=Date.now();
  const r=JSON.parse(w.eval(`(function(){ const st0={...FIXED,...state}; let n=0,sh=0,co=0,cw=0,sv=0,ocE=0,ocC=0,cs=0,dm=0,cu=0;
    for (const yy of bldWeatherYears.meta.years){ const nat=weatherYearNational(String(yy));
     for (let k=0;k<${K};k++){ const st={...state,outageSeed:${SEED}+k*104729+yy*7919};
      const x=simulate(st,{demand:twelveYearDemand(),solar:nat.solar,wind:nat.wind,csp:PROFILES.csp,real:true});
      sh+=x.E.unserved/1e3; co+=x.co2; cw+=x.avgCost*x.gridServed; sv+=x.gridServed; cs+=x.systemCostR/1e9;
      let d0=0,c0=0; for(let i=0;i<x.loadS.length;i++){ d0+=x.loadS[i]; c0+=(x.chargePsMW?x.chargePsMW[i]||0:0)+(x.chargeBattMW?x.chargeBattMW[i]||0:0); } cu+=(d0-c0)*0.00002/1e3;
      ocE+=(x.E.diesel||0)+(x.ocgtMWh||0); ocC+=dieselAvailMW({...FIXED,...st})+Math.max(0,st.newOcgtMW||0); n++; } }
    const s=st0, y=s.scenarioYear, g=v=>(+v||0)/1000;
    const newGW={wind:g(s.newWindMW), windCape:g(s.windCapeMW), solar:g(s.newPvMW), offshore:g(s.newOffshoreMW), rooftop:g(s.newRooftopMW),
      lithium:g(s.newBattMW), lithiumHours:+s.newBattHours||0, ironAir:g(s.newIronAirMW), ironAirHours:+(s.newIronAirHours??FIXED.newIronAirHours), vrfb:g(s.newVrfbMW),
      pumpedStorage:g(s.newPsMW), ccgt:g(s.newCcgtMW), ocgtGas:g(s.newOcgtMW), ocgtDiesel:g(s.newOcgdMW), nuclear:g(s.newNuclearMW)};
    const remGW={coal:g(Math.max(0,s.coalInstalledMW-s.coalDecomMW)), nuclear:g(s.nuclearMW), hydro:g(s.hydroMW), pumpedStorage:g(s.psPowerMW),
      csp:g(s.cspMW), ocgtDiesel:g(Math.max(0,(s.ocgtDieselMW||0)-(s.dieselDecomMW||0))), wind:g(s.windMW), solar:g(s.pvUtilityMW),
      hybrid:g(s.hybridMW), rooftop:g(s.rooftopMW), lithium:g(s.battPowerMW),
      imports:(s.importsEndYear>0 && y>s.importsEndYear)?0:g(s.importsMW)};
    return JSON.stringify({year:y, n, unservedGWh:sh/n, targetGWh:0.5*cu/n, co2Mt:co/n, costBn:cs/n, avgCostRMWh:cw/sv, servedTWh:sv/n/1e6, peakerCF:ocC>0?ocE/(ocC*8760):null,
      peakerCapGW:ocC/n/1000, demandGrowthPct:s.demandGrowthPct, demandBlockMW:s.demandBlockMW||0, newGW, remGW}); })()`));
  r.preset=name; r.override=over||null; r.seed=SEED; r.secs=Math.round((Date.now()-t0)/1000); r.score=sc;
  // The page's own score must be what this loop reproduces; a mismatch means the table is not the page's preset check.
  if (mustMatch && sc && Math.abs(Math.round(r.unservedGWh*1e4)/1e4-sc.shed)>1e-9) throw new Error(`${name}: unserved ${r.unservedGWh} does not reproduce PRESET_SCORES ${sc.shed}`);
  out.presets[code]=r; console.log(code, JSON.stringify(r)); }
 fs.writeFileSync(OUT, JSON.stringify(out,null,1));
 process.exit(0); })();
