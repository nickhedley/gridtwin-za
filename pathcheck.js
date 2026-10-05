const fs=require('fs'),path=require('path');const {JSDOM}=require('jsdom');
// Effective carbon tax by year on the legislated Phase 2 path (matches CARBON_AT in bldBuildLP); CFLAT overrides.
const CTAX = y => process.env.CFLAT ? +process.env.CFLAT : (y <= 2026 ? 46 : (y >= 2030 ? 462 : 308*Math.pow(462/308,(y-2026)/4)) * (1 - Math.max(0.75, 0.85 - 0.025*Math.min(4, y-2026))));
const ROOT='testroot', P=JSON.parse(fs.readFileSync(process.env.IN||'pathway.json')), K=+(process.env.K||2), DEM=+(process.env.DEM||5);
(async()=>{
 const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
 const dom=new JSDOM(html,{runScripts:'dangerously',resources:'usable',pretendToBeVisual:true,url:'file://'+path.resolve(ROOT)+'/index.html',
  beforeParse(w){ w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>({addColorStop(){},data:[],width:0,measureText:()=>({width:10})})});
   const ch=()=>new Proxy(function(){return ch();},{get:()=>ch()}); w.L=new Proxy({},{get(){return function(){return ch();};}});
   w.onerror=()=>{}; Object.defineProperty(w.history,'replaceState',{value:()=>{},writable:true}); w.URL.createObjectURL=()=>'blob:x'; w.Worker=function(){this.postMessage=()=>{};};
   w.fetch=async(u)=>{try{const cl=String(u).split('?')[0].replace(/^file:.*?\/(?=nodal\/|profiles|config)/,'');const t=fs.readFileSync(path.join(path.resolve(ROOT),cl),'utf8');return{ok:true,json:async()=>JSON.parse(t),text:async()=>t};}catch(e){return{ok:false,json:async()=>{throw e},text:async()=>{throw e}};}};}});
 await new Promise(r=>setTimeout(r,6000)); const w=dom.window;
 w.eval(`applyState(PRESETS['Today 2026']);`); await w.eval('loadWeatherYears()');
 const Y=Object.keys(P.sched).map(Number); const cum={wind:0,pv:0,rooftop:0,batt:0,battMWh:0,vrfb:0,ironair:0,ccgt:0,off:0,phes:0};
 const rows=[];
 for (const y of Y){ for (const k of Object.keys(cum)) cum[k]+=P.sched[y][k]||0;
   const frac=(y-2026)/(2040-2026), dg=(Math.pow(1+DEM/100,frac)-1)*100;
   const over={newWindMW:cum.wind,newPvMW:cum.pv,newRooftopMW:cum.rooftop,newBattMW:cum.batt,newBattHours:cum.batt>0?Math.max(1,Math.min(20,cum.battMWh/cum.batt)):4,
     newVrfbMW:cum.vrfb,newIronAirMW:cum.ironair,newCcgtMW:cum.ccgt,newOffshoreMW:cum.off,newPsMW:cum.phes,newPsHours:+(process.env.PH||14),coalDecomMW:Math.max(0,Math.round(w.eval('FIXED.coalInstalledMW')-P.sched[y].coalMW)),
     demandGrowthPct:dg,scenarioYear:y, carbonTaxRPerT: CTAX(y)};
   const r=JSON.parse(w.eval(`(function(){ const o=[]; for (const yy of bldWeatherYears.meta.years){ const nat=weatherYearNational(String(yy));
      for(let k=0;k<${K};k++){ const st={...state,...${JSON.stringify(over)},outageSeed:20260816+k*104729+yy*7919};
       const x=simulate(st,{demand:PROFILES.demand,solar:nat.solar,wind:nat.wind,csp:PROFILES.csp,real:true});
       let dem=0; for(let i=0;i<x.loadS.length;i++) dem+=x.loadS[i];
       o.push([x.E.unserved/1e3,x.systemCostR/1e9,x.E.curtailed/1e6,dem*0.00002/1e3,x.co2,x.E.coal/1e6,x.E.diesel/1e6,(x.systemCostR-x.btmCapexR)/1e9]); } }
      const n=o.length,m=i=>o.reduce((a,b)=>a+b[i],0)/n; return JSON.stringify({mean:m(0),worst:Math.max(...o.map(a=>a[0])),cost:m(1),curt:m(2),std:m(3),co2:m(4),coal:m(5),diesel:m(6),gridCost:m(7)}); })()`));
   rows.push({y,...over,...r}); console.log(y, JSON.stringify(r));
 }
 fs.writeFileSync(process.env.OUTC||'pathcheck.json', JSON.stringify(rows)); process.exit(0);
})();
