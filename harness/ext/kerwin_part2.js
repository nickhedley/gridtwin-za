// External scenario test, TODO 14p, part 2: our build optimiser on Kerwin et al. (2026)'s inputs, to 2040.
// Their demand (Table A4, single growth rate to 247.8 TWh in 2040), capex, fixed O&M and lives (A5, at
// R16.50/USD, 2026 interpolated, decline from their 2030-2040 path), residual coal (A8), and wind and
// utility-PV build caps (A13). Ours: battery cost, life and duration choice (BATT_POWER_SHARE is a
// constant, so their power cost cannot be set alone), coal fuel cost, 8% real discount rate, the
// legislated carbon tax path, existing non-coal fleet, gas no earlier than 2030. Rooftop is chosen
// freely under our rate cap. Vanadium, iron-air and offshore off (not in their model).
// LOOP=0: one solve, tested once (closest to their method). LOOP=1: the adequacy loop as pathway_op
// (all-year 14-day windows, draws 2, testEvery 2, up to 14 passes). Run from harness/ with
// SOLVER=native TL=3600 OUT=ext/kerwin_part2_loop0.json LOOP=0 node ext/kerwin_part2.js. 6 Oct 2026.
const fs=require('fs'),path=require('path');const {JSDOM}=require('jsdom');const highsLoader=require('highs');
const ROOT='testroot', OUT=process.env.OUT||'ext/kerwin_part2.json', GAS_FIRST=2030, LOOP=+(process.env.LOOP||0);
const FX=16.5, PJ=v=>v*277.78/1e3, PROF_TWH=200.6164115620006;
const DEM=(PJ(892.2)/PROF_TWH-1)*100;             // demandGrowthPct to their 2040 demand
const at26=(a20,a30)=>a20+(a30-a20)*0.6, decl=(a30,a40)=>1-Math.pow(a40/a30,0.1);
const COST={ wind:{c2026:at26(1047,1029)*FX, decl:decl(1029,1005)}, pv:{c2026:at26(877,774)*FX, decl:decl(774,661)},
  rooftop:{c2026:at26(1406,1258)*FX, decl:decl(1258,1110)}, ccgt:{c2026:at26(1248,1181)*FX, decl:decl(1181,1098)} };
const FOM={ wind:51*FX, pv:24*FX, rooftop:38*FX, ccgt:at26(31,30)*FX }, LIFE={ wind:25, pv:24, rooftop:24, ccgt:30 };
const COAL={2020:37900,2030:30300,2040:21700}, coalAt=y=>y<=2030?COAL[2020]+(COAL[2030]-COAL[2020])*(y-2020)/10:COAL[2030]+(COAL[2040]-COAL[2030])*(y-2030)/10;
const CAP={ wind:y=>y<=2030?1600:2000, pv:y=>y<=2030?1000:2000 };
(async()=>{
 const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
 const dom=new JSDOM(html,{runScripts:'dangerously',resources:'usable',pretendToBeVisual:true,url:'file://'+path.resolve(ROOT)+'/index.html',
  beforeParse(w){ w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>({addColorStop(){},data:[],width:0,measureText:()=>({width:10})})});
   const ch=()=>new Proxy(function(){return ch();},{get:()=>ch()}); w.L=new Proxy({},{get(){return function(){return ch();};}});
   w.onerror=()=>{}; Object.defineProperty(w.history,'replaceState',{value:()=>{},writable:true}); w.URL.createObjectURL=()=>'blob:x'; w.Worker=function(){this.postMessage=()=>{};};
   w.fetch=async(u)=>{try{const cl=String(u).split('?')[0].replace(/^file:.*?\/(?=nodal\/|profiles|config)/,'');const t=fs.readFileSync(path.join(path.resolve(ROOT),cl),'utf8');return{ok:true,json:async()=>JSON.parse(t),text:async()=>t};}catch(e){return{ok:false,json:async()=>{throw e},text:async()=>{throw e}};}};}});
 await new Promise(r=>setTimeout(r,6000)); const w=dom.window;
 // Their inputs into the page's own tables. Confirm each key exists before overwriting it.
 for (const t of Object.keys(COST)){ if (!w.eval(`'${t}' in BLD_COST && '${t}' in BLD_LIFE && '${t}' in BLD_FOM`)) throw new Error('missing key '+t);
   w.eval(`BLD_COST.${t}.c2026=${COST[t].c2026}; BLD_COST.${t}.decl=${COST[t].decl}; BLD_FOM.${t}=${FOM[t]}; BLD_LIFE.${t}=${LIFE[t]};`); }
 w.eval(`bldCoalMW = function(y){ return y<=2030 ? ${COAL[2020]}+(${COAL[2030]}-${COAL[2020]})*(y-2020)/10 : ${COAL[2030]}+(${COAL[2040]}-${COAL[2030]})*(y-2030)/10; };`);
 const check={ coal2026:+w.eval('bldCoalMW(2026)'), coal2030:+w.eval('bldCoalMW(2030)'), coal2040:+w.eval('bldCoalMW(2040)'),
   windCapex2030:+w.eval('bldCapex("wind",2030)'), pvCapex2030:+w.eval('bldCapex("pv",2030)'), ccgtCapex2030:+w.eval('bldCapex("ccgt",2030)') };
 console.log('inputs', JSON.stringify(check));
 const newHighs=()=>highsLoader({locateFile:f=>path.join(process.cwd(),'node_modules/highs/build',f)});
 const fix=lp=>lp.replace(/^ 0 <= b_ccgt_(\d{4}) <= [0-9.]+$/gm,(m,y)=> +y<GAS_FIRST ? ` 0 <= b_ccgt_${y} <= 0` : m)
                 .replace(/^ 0 <= b_(wind|pv)_(\d{4}) <= [0-9.]+$/gm,(m,t,y)=>` 0 <= b_${t}_${y} <= ${CAP[t](+y)}`)
                 .replace(/^ 0 <= b_(vrfb|ironair|off)_(\d{4}) <= [0-9.]+$/gm,(m,t,y)=>` 0 <= b_${t}_${y} <= 0`);
 let last=null; w.__bldSolveOverride=async(lp)=>{ if (process.env.SOLVER==='native'){ const os=require('os'),cp=require('child_process'); const tmp=path.join(os.tmpdir(),'gtza_'+process.pid);
   fs.writeFileSync(tmp+'.lp',fix(lp)); cp.execFileSync('python3',['highs_native.py',tmp+'.lp',tmp+'.json',String(process.env.TL||900)],{stdio:'inherit'}); last=JSON.parse(fs.readFileSync(tmp+'.json','utf8')); }
   else { const highs=await newHighs(); last=highs.solve(fix(lp),{time_limit:+(process.env.TL||900)}); }
   console.log('solved', last.Status, new Date().toISOString()); if (last.Status!=='Optimal') throw new Error('solve not optimal: '+last.Status); return last; };
 w.eval(`applyState(PRESETS['Today 2026']); state.demandGrowthPct=${DEM}; bldSetHorizon(2040);`);
 await w.eval('loadWeatherYears()');
 const t0=Date.now();
 await w.eval(`(async()=>{ const tg=1+(state.demandGrowthPct||0)/100;
   const opts={growth:Math.pow(tg,1/Math.max(1,BLD_YEARS.length-1))-1, eaf:(state.coalEAFPct??FIXED.coalEAFPct)/100, rate:bldRates(), state:state, perYear:true,
     maxPasses:${LOOP?14:1}, marginStepMW:1000, draws:2, testEvery:2, stressDays:14, targetFrac:1, windowLeadYears:14};
   window.__out=await bldStressLoop(opts, m=>{}); })()`);
 const out=w.__out, cols=out.res.Columns;
 const Y=JSON.parse(w.eval('JSON.stringify(BLD_YEARS)')), T=JSON.parse(w.eval('JSON.stringify(BLD_TECHS)'));
 const sched={}; for(const y of Y){ sched[y]={}; for(const t of T) sched[y][t]=Math.round((cols['b_'+t+'_'+y]||{Primal:0}).Primal);
   sched[y].battMWh=Math.round((cols['eb_batt_'+y]||{Primal:0}).Primal); sched[y].off=Math.round((cols['b_off_'+y]||{Primal:0}).Primal);
   sched[y].earlyRetMW=Math.round((cols['rc_'+y]||{Primal:0}).Primal); sched[y].coalMW=Math.round(w.eval(`bldCoalMW(${y})`) - sched[y].earlyRetMW); }
 fs.writeFileSync(OUT, JSON.stringify({inputs:{DEM,COST,FOM,LIFE,COAL,check,LOOP}, margin:out.margin, secs:(Date.now()-t0)/1000, verdict:out.verdict, log:out.log, sched, objective:out.res.ObjectiveValue, status:out.res.Status},null,1));
 console.log('done', out.verdict, ((Date.now()-t0)/1000).toFixed(0)+'s'); process.exit(0);
})();
