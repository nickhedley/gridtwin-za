const fs=require('fs'),path=require('path');const {JSDOM}=require(process.cwd()+'/node_modules/jsdom');
// Run from harness/: IN=pathway_v_half_c1_p1.json LPD=pathway_v_half_c1_p1_lp2040.json YEAR=2040 OUTD=out.json node pathway/psboth.js
// Effective carbon tax by year on the legislated Phase 2 path (matches CARBON_AT in bldBuildLP); CFLAT overrides.
const CTAX = y => process.env.CFLAT ? +process.env.CFLAT : (y <= 2026 ? 46 : (y >= 2030 ? 462 : 308*Math.pow(462/308,(y-2026)/4)) * (1 - Math.max(0.75, 0.85 - 0.025*Math.min(4, y-2026))));
// SEED_BASE: outage draws independent of the loop's own test (index.html bldAdequacyTest uses 20260816
// + k*104729 + y*7919); SEED_BASE=20260816 reproduces the 5 Oct 2026 runs, which reused the loop's draws.
const SEED_BASE=+(process.env.SEED_BASE||71830529);
const ROOT=process.env.ROOT||'testroot', P=JSON.parse(fs.readFileSync(process.env.IN||'pathway.json')), K=+(process.env.K||2), DEM=+(process.env.DEM||5);
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
 const y=+(process.env.YEAR||2040); const D=JSON.parse(fs.readFileSync(process.env.LPD)); const cum2={wind:0,pv:0,rooftop:0,batt:0,battMWh:0,vrfb:0,ironair:0,ccgt:0,off:0,phes:0};
 for (const yy of Y) if (yy<=y) for (const k of Object.keys(cum2)) cum2[k]+=P.sched[yy][k]||0;
 const frac=(y-2026)/(2040-2026), dg=(Math.pow(1+DEM/100,frac)-1)*100;
 const over={newWindMW:cum2.wind,newPvMW:cum2.pv,newRooftopMW:cum2.rooftop,newBattMW:cum2.batt,newBattHours:cum2.batt>0?Math.max(1,Math.min(20,cum2.battMWh/cum2.batt)):4,
   newVrfbMW:cum2.vrfb,newIronAirMW:cum2.ironair,newCcgtMW:cum2.ccgt,newOffshoreMW:cum2.off,newPsMW:cum2.phes||0,coalDecomMW:Math.max(0,Math.round(w.eval('FIXED.coalInstalledMW')-P.sched[y].coalMW)),
   demandGrowthPct:dg,scenarioYear:y, carbonTaxRPerT: CTAX(y)};
 // PUMPED STORAGE, OPTIMISER AGAINST ENGINE, 7 Oct 2026 (TODO 26). The optimiser balances storage per day
 // (soc rows): each chain opens at half of psEnergyMWh and must end at least there. The engine runs hourly
 // from 70% at the start of the year. Same 2040 build, same windows, same weather year and outage seed.
 const PSE=+w.eval('FIXED.psEnergyMWh'), PSP=+w.eval('FIXED.psPowerMW'), PEFF=+w.eval('FIXED.psEff');
 const lp=(pre,d,h)=>D.lpv[pre+'_'+y+'_'+d+'_'+h]||0;
 const run=(wy,seed)=>JSON.parse(w.eval(`(function(){ const nat=weatherYearNational('${wy}'); const x=simulate({...state,...${JSON.stringify(over)},outageSeed:${seed}},{demand:PROFILES.demand,solar:nat.solar,wind:nat.wind,csp:PROFILES.csp,real:true});
   if(!x.chargePsMW) throw new Error('chargePsMW missing'); let soc=${PSE}*0.7; const socs=new Array(8760); for(let h=0;h<8760;h++){ soc=Math.min(${PSE},Math.max(0,soc+(x.chargePsMW[h]||0)*${PEFF}-(x.stack.ps[h]||0))); socs[h]=soc; }
   return JSON.stringify({shed:Array.from(x.stack.unserved), dis:Array.from(x.stack.ps), chg:Array.from(x.chargePsMW), socs}); })()`));
 console.log('PS', PSP,'MW', PSE/1e3,'GWh, eff',PEFF);
 const out=[];
 D.periods.forEach((sp,p)=>{ if (sp.fromYear>y) return;
   const d0=1100+30*p; if (!(('pdis_'+y+'_'+d0+'_0') in D.lpv)) return;
   const a=sp.start*24, e=run(sp.year,sp.seed);
   let lpE=PSE*0.5, lpMin=lpE, lpDis=0, lpChg=0, enDis=0, enChg=0, enShed=0, lpShed=0; const days=[];
   const enOpen=a>0?e.socs[a-1]:PSE*0.7; let enMin=enOpen;
   for(let j=0;j<sp.n;j++){ let dd=0,dc=0,ed=0,ec=0,es=0,ls=0; for(let h=0;h<24;h++){ dd+=lp('pdis',d0+j,h); dc+=lp('pchg',d0+j,h); ls+=lp('u',d0+j,h); const t=a+j*24+h; ed+=e.dis[t]; ec+=e.chg[t]||0; es+=e.shed[t]; enMin=Math.min(enMin,e.socs[t]); }
     lpE+=dc*PEFF-dd; lpMin=Math.min(lpMin,lpE); lpDis+=dd; lpChg+=dc; enDis+=ed; enChg+=ec; enShed+=es; lpShed+=ls;
     days.push({j, lpDis:dd/1e3, lpChg:dc/1e3, lpEnd:lpE/1e3, enDis:ed/1e3, enChg:ec/1e3, enEnd:e.socs[a+j*24+23]/1e3, enShed:es/1e3, lpShed:ls/1e3}); }
   const r={p, wy:sp.year, start:sp.start, lpOpen:PSE*0.5/1e3, lpEnd:lpE/1e3, lpMin:lpMin/1e3, lpDis:lpDis/1e3, lpChg:lpChg/1e3, lpShed:lpShed/1e3,
     enOpen:enOpen/1e3, enEnd:e.socs[a+sp.n*24-1]/1e3, enMin:enMin/1e3, enDis:enDis/1e3, enChg:enChg/1e3, enShed:enShed/1e3, days};
   out.push(r);
   console.log(`win ${p} ${sp.year} d${sp.start} | LP open ${r.lpOpen.toFixed(1)} min ${r.lpMin.toFixed(1)} end ${r.lpEnd.toFixed(1)} dis ${r.lpDis.toFixed(1)} chg ${r.lpChg.toFixed(1)} shed ${r.lpShed.toFixed(1)} | engine open ${r.enOpen.toFixed(1)} min ${r.enMin.toFixed(1)} end ${r.enEnd.toFixed(1)} dis ${r.enDis.toFixed(1)} chg ${r.enChg.toFixed(1)} shed ${r.enShed.toFixed(1)} GWh`);
 });
 fs.writeFileSync(process.env.OUTD||'psboth.json', JSON.stringify({year:y,PSE,PSP,PEFF,over,out},null,1));
 process.exit(0);
})();
