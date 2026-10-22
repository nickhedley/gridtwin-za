// Provenance (19 Oct 2026, messages 214 (2), 230 (3), 231): the rescore that wrote harness/ext/rescore_page_19c.json (VARIANTS=page),
// run with the repository at build 2026-10-19c; from 19e it reads the repository it sits in (or ROOT) and writes OUT (default
// harness/ext/rescore.json).
// Message 214 (2) / 227 (4): Deep decarbonisation 2035 and Fossil-free 2040 rescored on the aligned defaults (build 19b) and
// the c5f base: twelve weather years x K independent outage draws (seeds 71830529 + k*104729 + year*7919, as pathcheck.js and
// the preset check), mean unserved energy against half the 0.002% standard on customer demand (pathcheck's target), and cost.
// Variants: page (as the page runs the preset); c5f5 (c5f's settings that are state, at the preset's own +5% demand); c5f
// (the same with c5f's demand path for the preset's year and its smelter block).
const fs=require('fs'),path=require('path');const {JSDOM}=require('jsdom');
// The repository this script sits in (harness/ext/), unless ROOT is set.
const ROOT=process.env.ROOT||path.resolve(__dirname,'..','..'), K=+(process.env.K||20), SEED=+(process.env.SEED||71830529), ONLY=process.env.ONLY||'';
const P=JSON.parse(fs.readFileSync(path.join(ROOT,'harness/pathway/c5f/pathway_c5f.json'),'utf8'));
const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
const dom=new JSDOM(html,{runScripts:'dangerously',resources:'usable',pretendToBeVisual:true,url:'file://'+ROOT+'/index.html',
 beforeParse(w){ w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>({addColorStop(){},data:[],width:0,measureText:()=>({width:10})})});
  const ch=()=>new Proxy(function(){return ch();},{get:()=>ch()}); w.L=new Proxy({},{get(){return function(){return ch();};}});
  w.onerror=()=>{}; Object.defineProperty(w.history,'replaceState',{value:()=>{},writable:true}); w.URL.createObjectURL=()=>'blob:x'; w.Worker=function(){this.postMessage=()=>{};};
  w.fetch=async(u)=>{try{const cl=String(u).split('?')[0].replace(/^file:.*?\/(?=nodal\/|profiles|config|harness\/coal)/,'');const t=fs.readFileSync(path.join(ROOT,cl),'utf8');return{ok:true,json:async()=>JSON.parse(t),text:async()=>t};}catch(e){return{ok:false,json:async()=>{throw e},text:async()=>{throw e}};}};}});
(async()=>{ for (let i=0;i<80 && !dom.window.GTZA_READY;i++) await new Promise(r=>setTimeout(r,250)); const w=dom.window; await w.eval('loadWeatherYears()');
 const S=P.sched, cum=(k,to)=>Object.keys(S).filter(y=>+y<=to).reduce((a,y)=>a+(S[y][k]||0),0);
 const base=Y=>({importsMW:P.importsMW, importsCF:P.importsCF, carbonAllowancePath:P.carbonPath, carbonTaxFull:P.carbonFull?1:0,
   carbonTaxRPerT:+w.eval(`carbonTaxAt(${Y}, {...FIXED, carbonAllowancePath:${JSON.stringify(P.carbonPath)}, carbonTaxFull:${P.carbonFull?1:0}})`),
   costCcgt:P.gas.fuelR[Y], bldCapeCurtPct:P.capeWind.curtPct, bldGridCost:1, bldGridIntVreShare:P.gridIntVreShare, bldTariffCfBasis:P.tariffCfBasis,
   reserveVreRefWindMW:Math.round(+w.eval('FIXED.windMW')+cum('wind',2030)), reserveVreRefPvMW:Math.round(+w.eval('FIXED.pvUtilityMW')+cum('pv',2030))});
 const dem=Y=>({demandGrowthPct:(P.demand.index[Y]-1)*100, demandBlockMW:P.demand.block['2027']});
 const out={stamp:w.eval('BUILD_STAMP'), seed:SEED, decl:+w.eval('BLD_COST.batt.decl'), terminal:+w.eval('bldGasTerminalRkW()'), K, presets:{}};
 for (const [name,Y] of [['Deep decarbonisation 2035',2035],['Fossil-free 2040',2040]]){
  if (ONLY && !name.startsWith(ONLY)) continue; out.presets[name]={};
  for (const [v,over] of [['page',{}],['c5f5',base(Y)],['c5f',{...base(Y),...dem(Y)}]].filter(([v])=>!process.env.VARIANTS||process.env.VARIANTS.split(',').includes(v))){
   w.eval(`applyState(PRESETS[${JSON.stringify(name)}]); Object.assign(state, ${JSON.stringify(over)});`);
   const t0=Date.now();
   const r=JSON.parse(w.eval(`(function(){ let sh=0,c=0,cu=0,co=0,n=0; for (const yy of bldWeatherYears.meta.years){ const nat=weatherYearNational(String(yy));
     for (let k=0;k<${K};k++){ const x=simulate({...state,outageSeed:${SEED}+k*104729+yy*7919},{demand:PROFILES.demand,solar:nat.solar,wind:nat.wind,csp:PROFILES.csp,real:true});
       let dem=0,chg=0; for(let i=0;i<x.loadS.length;i++){ dem+=x.loadS[i]; chg+=(x.chargePsMW?x.chargePsMW[i]||0:0)+(x.chargeBattMW?x.chargeBattMW[i]||0:0); }
       sh+=x.E.unserved/1e3; c+=x.systemCostR/1e9; cu+=(dem-chg)*0.00002/1e3; co+=x.co2; n++; } }
     return JSON.stringify({n, shed:sh/n, cost:c/n, target:0.5*cu/n, co2:co/n, demandGrowthPct:state.demandGrowthPct, carbon:state.carbonTaxRPerT}); })()`));
   r.secs=Math.round((Date.now()-t0)/1000); r.pass=r.shed<=r.target; out.presets[name][v]=r;
   console.log(name, v, JSON.stringify(r)); } }
 fs.writeFileSync(process.env.OUT||path.join(__dirname,'rescore.json'), JSON.stringify(out,null,1)); process.exit(0); })();
