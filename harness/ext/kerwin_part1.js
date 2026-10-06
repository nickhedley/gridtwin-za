// External scenario test, TODO 14p, part 1. Kerwin, Fields, Martindale and Quiros-Tortos (2026),
// MAED-OSeMOSYS for South Africa (preprint doi 10.33774/coe-2026-15jfr, CC BY 4.0). Their baseline
// and Scenario 1 systems for 2030 and 2040, dispatched hourly on twelve weather years x two outage
// draws (pathcheck's independent seeds), then the extra 4 h lithium, or extra gas, that meets the
// 0.002% standard. Run from harness/: node ext/kerwin_part1.js   (OUT=ext/kerwin_part1.json)
// Fleet: their residual capacity (Table A8) replaces ours for coal, wind, utility PV, rooftop,
// nuclear, CSP and the 3.4 GW gas-turbine fleet; their new build is cumulative from 2024 (baseline
// digitised from Figure C8, Scenario 1 from Table C1). Hydro, pumped storage and imports are ours
// (their 3.3 GW "large hydro" is our 0.6 GW hydro plus 2.7 GW pumped storage). Scenario 1 coal is
// their own phase-out (Table C5), since the engine has no emissions cap. 5 Oct 2026.
const fs=require('fs'),path=require('path');const {JSDOM}=require('jsdom');
const ROOT='testroot', K=+(process.env.K||2), SEED_BASE=+(process.env.SEED_BASE||71830529), BATT_H=+(process.env.BATT_H||4);
const PJ=v=>v*277.78/1e3;   // PJ to TWh
const DEM={2030:PJ(746.5), 2040:PJ(892.2)};   // Table A4, MAED baseline
// Cumulative new build from 2024, MW. bio: biomass + small hydro (Table C1 columns), not represented.
const CASES={
 base_2030:{y:2030, res:{coal:30300,wind:3400,pv:2400,roof:5800,nuc:1900,csp:500,gt:3400}, nw:{wind:11200,pv:0,roof:0,batt:0,gas:700,nuc:0}},
 base_2040:{y:2040, res:{coal:21700,wind:2000,pv:1400,roof:5800,nuc:1500,csp:300,gt:2300}, nw:{wind:31200,pv:11030,roof:0,batt:1400,gas:6770,nuc:0}},
 s1_2030:  {y:2030, res:{coal:25200,wind:3400,pv:2400,roof:5800,nuc:1900,csp:500,gt:3400}, nw:{wind:11200,pv:7000,roof:3510,batt:0,gas:250,nuc:0,bio:130}},
 s1_2040:  {y:2040, res:{coal:12500,wind:2000,pv:1400,roof:5800,nuc:1500,csp:300,gt:2300}, nw:{wind:31200,pv:25700,roof:3640,batt:2750,gas:1910,nuc:930,bio:280}},
 // Sensitivity: Scenario 1 build on their residual coal, no phase-out (what the engine does without a cap).
 s1_2030_rescoal:{y:2030, res:{coal:30300,wind:3400,pv:2400,roof:5800,nuc:1900,csp:500,gt:3400}, nw:{wind:11200,pv:7000,roof:3510,batt:0,gas:250,nuc:0,bio:130}},
 s1_2040_rescoal:{y:2040, res:{coal:21700,wind:2000,pv:1400,roof:5800,nuc:1500,csp:300,gt:2300}, nw:{wind:31200,pv:25700,roof:3640,batt:2750,gas:1910,nuc:930,bio:280}},
};
(async()=>{
 const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
 const dom=new JSDOM(html,{runScripts:'dangerously',resources:'usable',pretendToBeVisual:true,url:'file://'+path.resolve(ROOT)+'/index.html',
  beforeParse(w){ w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>({addColorStop(){},data:[],width:0,measureText:()=>({width:10})})});
   const ch=()=>new Proxy(function(){return ch();},{get:()=>ch()}); w.L=new Proxy({},{get(){return function(){return ch();};}});
   w.onerror=()=>{}; Object.defineProperty(w.history,'replaceState',{value:()=>{},writable:true}); w.URL.createObjectURL=()=>'blob:x'; w.Worker=function(){this.postMessage=()=>{};};
   w.fetch=async(u)=>{try{const cl=String(u).split('?')[0].replace(/^file:.*?\/(?=nodal\/|profiles|config)/,'');const t=fs.readFileSync(path.join(path.resolve(ROOT),cl),'utf8');return{ok:true,json:async()=>JSON.parse(t),text:async()=>t};}catch(e){return{ok:false,json:async()=>{throw e},text:async()=>{throw e}};}};}});
 await new Promise(r=>setTimeout(r,6000)); const w=dom.window;
 w.eval(`applyState(PRESETS['Today 2026']);`); await w.eval('loadWeatherYears()');
 const profTWh=+w.eval('PROFILES.demand.reduce((a,b)=>a+b,0)/1e6'), coalInst=+w.eval('FIXED.coalInstalledMW');
 const stateFor=(c,extraBatt=0,extraGas=0)=>({scenarioYear:c.y, demandGrowthPct:(DEM[c.y]/profTWh-1)*100,
   coalDecomMW:Math.max(0,coalInst-c.res.coal), windMW:c.res.wind, pvUtilityMW:c.res.pv, rooftopMW:c.res.roof, nuclearMW:c.res.nuc, cspMW:c.res.csp, ocgtDieselMW:c.res.gt,
   newWindMW:c.nw.wind, newPvMW:c.nw.pv, newRooftopMW:c.nw.roof, newBattMW:c.nw.batt+extraBatt, newBattHours:BATT_H, newCcgtMW:c.nw.gas+extraGas, newNuclearMW:c.nw.nuc});
 const evalState=over=>JSON.parse(w.eval(`(function(){ const o=[]; for (const yy of bldWeatherYears.meta.years){ const nat=weatherYearNational(String(yy));
    for(let k=0;k<${K};k++){ const st={...state,...${JSON.stringify(over)},outageSeed:${SEED_BASE}+k*104729+yy*7919};
     const x=simulate(st,{demand:PROFILES.demand,solar:nat.solar,wind:nat.wind,csp:PROFILES.csp,real:true});
     let dem=0; for(let i=0;i<x.loadS.length;i++) dem+=x.loadS[i];
     o.push([x.E.unserved/1e3,dem*0.00002/1e3,x.E.curtailed/1e6,x.co2,x.E.coal/1e6,x.E.diesel/1e6,dem/1e6,(x.E.ccgt||0)/1e6]); } }
    const n=o.length,m=i=>o.reduce((a,b)=>a+b[i],0)/n; return JSON.stringify({mean:m(0),worst:Math.max(...o.map(a=>a[0])),std:m(1),curt:m(2),co2:m(3),coal:m(4),diesel:m(5),loadTWh:m(6),gas:m(7)}); })()`));
 // Smallest addition (step MW) meeting the standard: doubling then bisection.
 const search=(c,kind,step)=>{ const f=a=>evalState(stateFor(c,kind==='batt'?a:0,kind==='gas'?a:0));
   let lo=0, hi=step, r=f(hi); while(r.mean>r.std && hi<64000){ lo=hi; hi*=2; r=f(hi); }
   if (r.mean>r.std) return {mw:null};
   while(hi-lo>step){ const mid=Math.round((lo+hi)/2/step)*step; const q=f(mid); if(q.mean<=q.std){hi=mid;r=q;} else lo=mid; }
   return {mw:hi, ...r}; };
 const out={settings:{K,SEED_BASE,BATT_H,profTWh,coalInst,DEM}, cases:{}};
 for (const [name,c] of Object.entries(CASES)){
   const st=stateFor(c), r=evalState(st);
   const row={state:st, ...r};
   if (r.mean>r.std && !/rescoal/.test(name)){ row.addBatt=search(c,'batt',250); row.addGas=search(c,'gas',250); }
   out.cases[name]=row; console.log(name, JSON.stringify({mean:+r.mean.toFixed(2),std:+r.std.toFixed(2),worst:+r.worst.toFixed(1),curt:+r.curt.toFixed(1),co2:+r.co2.toFixed(1),addBatt:row.addBatt&&row.addBatt.mw,addGas:row.addGas&&row.addGas.mw}));
   fs.writeFileSync(process.env.OUT||'ext/kerwin_part1.json', JSON.stringify(out,null,1));
 }
 process.exit(0);
})();
