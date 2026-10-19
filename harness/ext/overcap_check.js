// Provenance (19 Oct 2026, message 243): the script that wrote harness/ext/overcap_19e.json, run from harness/ on build 2026-10-19e
// in four parts (SHAPE flat and day, BLOCKS 0-3000 and 3500-6000). Reads the repository it sits in unless ROOT is set.
// Message 243: a check of the claim of 3-5 GW of overcapacity. Today 2026 with an added load block, BLOCKS (MW, comma list),
// SHAPE flat (every hour, the engine's demandBlockMW) or day (the same MW from 08:00 to 16:59 only, added to the demand series
// passed to the engine; no engine change); twelve weather years x K independent outage draws (seeds 71830529 + k*104729 +
// year*7919, as the preset checks). Unserved energy against the 0.002% standard on customer demand (load less storage charging,
// as harness/ext/preset_rescore.js), and system cost and CO2. Prints one JSON line per block.
const fs=require('fs'),path=require('path');const {JSDOM}=require('jsdom');
const ROOT=process.env.ROOT||path.resolve(__dirname,'..','..'), K=+(process.env.K||20), SEED=71830529, SHAPE=process.env.SHAPE||'flat';
const BLOCKS=(process.env.BLOCKS||'0').split(',').map(Number);
const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
const dom=new JSDOM(html,{runScripts:'dangerously',resources:'usable',pretendToBeVisual:true,url:'file://'+ROOT+'/index.html',
 beforeParse(w){ w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>({addColorStop(){},data:[],width:0,measureText:()=>({width:10})})});
  const ch=()=>new Proxy(function(){return ch();},{get:()=>ch()}); w.L=new Proxy({},{get(){return function(){return ch();};}});
  w.onerror=()=>{}; Object.defineProperty(w.history,'replaceState',{value:()=>{},writable:true}); w.URL.createObjectURL=()=>'blob:x'; w.Worker=function(){this.postMessage=()=>{};};
  w.fetch=async(u)=>{try{const cl=String(u).split('?')[0].replace(/^file:.*?\/(?=nodal\/|profiles|config|harness\/coal)/,'');const t=fs.readFileSync(path.join(ROOT,cl),'utf8');return{ok:true,json:async()=>JSON.parse(t),text:async()=>t};}catch(e){return{ok:false,json:async()=>{throw e;},text:async()=>{throw e;}};}}; }});
(async()=>{ for (let i=0;i<80 && !dom.window.GTZA_READY;i++) await new Promise(r=>setTimeout(r,250)); const w=dom.window; await w.eval('loadWeatherYears()');
 w.eval("applyState(PRESETS['Today 2026'])");
 for (const B of BLOCKS){ const t0=Date.now();
  const r=JSON.parse(w.eval(`(function(){ let sh=0,c=0,cu=0,co=0,n=0,worst=0,served=0;
    const base=PROFILES.demand, dem=${SHAPE==='day'?`Float64Array.from(base,(v,h)=>v+((h%24)>=8&&(h%24)<=16?${B}:0))`:'base'};
    const st={...state, demandBlockMW:${SHAPE==='flat'?B:0}};
    for (const yy of bldWeatherYears.meta.years){ const nat=weatherYearNational(String(yy)); let ys=0;
      for (let k=0;k<${K};k++){ const x=simulate({...st,outageSeed:${SEED}+k*104729+yy*7919},{demand:dem,solar:nat.solar,wind:nat.wind,csp:PROFILES.csp,real:true});
        let d=0,chg=0; for(let i=0;i<x.loadS.length;i++){ d+=x.loadS[i]; chg+=(x.chargePsMW?x.chargePsMW[i]||0:0)+(x.chargeBattMW?x.chargeBattMW[i]||0:0); }
        sh+=x.E.unserved/1e3; ys+=x.E.unserved/1e3; c+=x.systemCostR/1e9; cu+=(d-chg)/1e6; co+=x.co2; n++; }
      worst=Math.max(worst, ys/${K}); }
    return JSON.stringify({n, shed:sh/n, standard:0.00002*cu/n*1e3, half:0.5*0.00002*cu/n*1e3, custTWh:cu/n, cost:c/n, co2:co/n, worstYearShed:worst}); })()`));
  console.log(JSON.stringify({stamp:w.eval('BUILD_STAMP'), shape:SHAPE, blockMW:B, ...r, meets:r.shed<=r.standard, meetsHalf:r.shed<=r.half, secs:Math.round((Date.now()-t0)/1000)}));
 }
 process.exit(0); })();
