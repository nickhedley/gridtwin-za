// Single-node engine (index.html simulate(), c4's engine-check code, scratch copy with a read-only hourly hook) on c4's 2040
// build with its 1,000 MW top-up (state as pathcheck builds it, from the 2040 diagnostic), weather from weatherYearNational
// as the engine check uses it. Two modes:
//   scan: node sn_run40.js <root> scan <over.json> <out.json>            worst 168 h of shed per weather year, first draw
//   week: node sn_run40.js <root> week <over.json> <out.json> <wy> <start> <hours> <seed>
// cwd: a harness dir with node_modules. SEED_BASE as pathcheck.js (71830529); first draw k = 0: seed = SEED_BASE + wy*7919.
const fs=require('fs'),path=require('path');const {JSDOM}=require('jsdom');
const [ROOT, MODE, OVER, OUT, WY, S0, N0, SEED]=process.argv.slice(2);
const SEED_BASE=71830529, over=JSON.parse(fs.readFileSync(OVER,'utf8'));
(async()=>{
 const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
 const dom=new JSDOM(html,{runScripts:'dangerously',resources:'usable',pretendToBeVisual:true,url:'file://'+path.resolve(ROOT)+'/index.html',
  beforeParse(w){ w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>({addColorStop(){},data:[],width:0,measureText:()=>({width:10})})});
   const ch=()=>new Proxy(function(){return ch();},{get:()=>ch()}); w.L=new Proxy({},{get(){return function(){return ch();};}});
   w.onerror=()=>{}; Object.defineProperty(w.history,'replaceState',{value:()=>{},writable:true}); w.URL.createObjectURL=()=>'blob:x'; w.Worker=function(){this.postMessage=()=>{};};
   w.fetch=async(u)=>{try{const cl=String(u).split('?')[0].replace(/^file:.*?\/(?=nodal\/|profiles|config)/,'');const t=fs.readFileSync(path.join(path.resolve(ROOT),cl),'utf8');return{ok:true,json:async()=>JSON.parse(t),text:async()=>t};}catch(e){return{ok:false,json:async()=>{throw e},text:async()=>{throw e}};}};}});
 await new Promise(r=>setTimeout(r,6000)); const w=dom.window;
 w.eval(`applyState(PRESETS['Today 2026']);`); await w.eval('loadWeatherYears()');
 if (MODE==='scan'){
   const r=JSON.parse(w.eval(`(function(){ const o=[]; for (const yy of bldWeatherYears.meta.years){ const nat=weatherYearNational(String(yy));
     const st={...state,...${JSON.stringify(over)},outageSeed:${SEED_BASE}+yy*7919};
     const x=simulate(st,{demand:PROFILES.demand,solar:nat.solar,wind:nat.wind,csp:PROFILES.csp,real:true});
     const u=x.stack.unserved; let s=0,best=-1,bh=0; for(let h=0;h<u.length;h++){ s+=u[h]||0; if(h>=168) s-=u[h-168]||0; if(h>=167 && s>best){best=s; bh=h-167;} }
     o.push({wy:yy, seed:${SEED_BASE}+yy*7919, shedGWh:x.E.unserved/1e3, worst168GWh:best/1e3, worstStart:bh, costBn:x.systemCostR/1e9}); }
     return JSON.stringify(o); })()`));
   fs.writeFileSync(OUT, JSON.stringify(r,null,1)); console.log(JSON.stringify(r)); process.exit(0);
 }
 const START=+S0, N=+N0, sd=+SEED; const hours={}; let consts=null;
 w.__SNH=(h,o)=>{ if (h>=START-1 && h<START+N) hours[h]=JSON.parse(JSON.stringify(o)); };
 w.__SNC=(o)=>{ consts=JSON.parse(JSON.stringify(o)); };
 const res=JSON.parse(w.eval(`(function(){ const nat=weatherYearNational(String(${+WY})); const st={...state,...${JSON.stringify(over)},outageSeed:${sd}};
   const x=simulate(st,{demand:PROFILES.demand,solar:nat.solar,wind:nat.wind,csp:PROFILES.csp,real:true});
   const sl=(a)=>a?Array.from(a).slice(${START-1},${START+N}):null;
   const p={...FIXED,...st};
   return JSON.stringify({E:x.E, fuelCost:x.fuelCost, carbonCost:x.carbonCost, startUpCostR:x.startUpCostR, unservedCostR:x.unservedCostR, systemCostR:x.systemCostR,
     socLi:sl(x.socByTier&&x.socByTier.li), socFe:sl(x.socByTier&&x.socByTier.fe), disLi:sl(x.battByTier&&x.battByTier.li), disFe:sl(x.battByTier&&x.battByTier.fe),
     chargeBatt:sl(x.chargeBattMW), chargePs:sl(x.chargePsMW), battTierTWh:x.battTierTWh,
     tiers:{li:{mw:p.battPowerMW+p.newBattMW, mwh:p.battPowerMW*p.battHours+p.newBattMW*p.newBattHours, eff:p.battEff??0.88},
            fe:{mw:Math.max(0,p.newIronAirMW||0), mwh:Math.max(0,p.newIronAirMW||0)*(p.newIronAirHours??100), eff:p.newIronAirEff??0.45},
            vrfb:{mw:Math.max(0,p.newVrfbMW||0)}, vppB:p.vppBattMW||0}});})()`));
 const uc=JSON.parse(w.eval('JSON.stringify(UC_FLEET)'));
 fs.writeFileSync(OUT, JSON.stringify({START,N,SEED:sd,WY:+WY,over,consts,hours,res,uc}));
 console.log('hours captured', Object.keys(hours).length, 'consts', !!consts, 'tiers', JSON.stringify(res.tiers)); process.exit(0);
})();
