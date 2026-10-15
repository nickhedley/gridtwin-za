// Single-node engine (index.html simulate(), c4's engine-check code, scratch copy with a read-only hourly hook):
// one fixed draw of the baseline (Today 2026), records each hour's inputs and cumulative costs for a week.
// usage (cwd = harness dir with node_modules): node sn_run.js <rootDir> <startHour> <hours> <outageSeed> <out.json>
const fs=require('fs'),path=require('path');const {JSDOM}=require('jsdom');
const [ROOT, S0, N0, SEED, OUT]=process.argv.slice(2); const START=+S0||3264, N=+N0||168;
(async()=>{
 const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
 const dom=new JSDOM(html,{runScripts:'dangerously',resources:'usable',pretendToBeVisual:true,url:'file://'+path.resolve(ROOT)+'/index.html',
  beforeParse(w){ w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>({addColorStop(){},data:[],width:0,measureText:()=>({width:10})})});
   const ch=()=>new Proxy(function(){return ch();},{get:()=>ch()}); w.L=new Proxy({},{get(){return function(){return ch();};}});
   w.onerror=()=>{}; Object.defineProperty(w.history,'replaceState',{value:()=>{},writable:true}); w.URL.createObjectURL=()=>'blob:x'; w.Worker=function(){this.postMessage=()=>{};};
   w.fetch=async(u)=>{try{const cl=String(u).split('?')[0].replace(/^file:.*?\/(?=nodal\/|profiles|config)/,'');const t=fs.readFileSync(path.join(path.resolve(ROOT),cl),'utf8');return{ok:true,json:async()=>JSON.parse(t),text:async()=>t};}catch(e){return{ok:false,json:async()=>{throw e},text:async()=>{throw e}};}};}});
 await new Promise(r=>setTimeout(r,6000)); const w=dom.window;
 w.eval(`applyState(PRESETS['Today 2026']);`); await w.eval('loadWeatherYears()');
 const hours={}; let consts=null;
 w.__SNH=(h,o)=>{ if (h>=START-1 && h<START+N) hours[h]=JSON.parse(JSON.stringify(o)); };
 w.__SNC=(o)=>{ consts=JSON.parse(JSON.stringify(o)); };
 const res=JSON.parse(w.eval(`(function(){ const st={...state,outageSeed:${+SEED||12345}};
   const x=simulate(st,{demand:PROFILES.demand,solar:PROFILES.solar,wind:PROFILES.wind,csp:PROFILES.csp,real:true});
   return JSON.stringify({E:x.E, fuelCost:x.fuelCost, carbonCost:x.carbonCost, startUpCostR:x.startUpCostR, unservedCostR:x.unservedCostR, systemCostR:x.systemCostR,
     coalAvailableMW:Array.from(x.coalAvailableMW||[]).slice(${START},${START+N}), reserveMW:Array.from(x.reserveMW||[]).slice(${START},${START+N}),
     partLoadF:Array.from(x.partLoadF||[]).slice(${START},${START+N}), socAtWeekStart:x.socAtWeekStart||null});})()`));
 const uc=JSON.parse(w.eval('JSON.stringify(UC_FLEET)')); const fx=JSON.parse(w.eval(`JSON.stringify((()=>{const S={...FIXED,...state}; return {coalInstalledMW:S.coalInstalledMW, coalEAFPct:S.coalEAFPct, minStableMW:S.minStableMW, rampPct:S.coalRampPct, ccgtMW:S.ccgtMW, ocgtMW:S.ocgtMW, dieselMW:S.dieselMW, battPowerMW:S.battPowerMW, battHours:S.battHours, battEff:S.battEff, psPowerMW:S.psPowerMW, psEnergyMWh:S.psEnergyMWh, psEff:S.psEff, drOn:S.drOn, nuclearMW:S.nuclearMW, hydroMW:S.hydroMW, importsMW:S.importsMW};})())`));
 fs.writeFileSync(OUT, JSON.stringify({START,N,SEED:+SEED||12345,consts,hours,res,uc,fx}));
 console.log('hours captured', Object.keys(hours).length, 'consts', !!consts); process.exit(0);
})();
