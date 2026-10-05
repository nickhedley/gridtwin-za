// Least-cost pathway to 2040 from Today 2026. Run from the parent of testroot. 4 Oct 2026.
// Assumptions applied to the build LP text: gas no earlier than 2030 (no import terminal before);
// new rooftop fixed at 1.2 GW a year from 2027 (16.8 GW by 2040, expected uptake, not a planner's choice).
const fs=require('fs'),path=require('path');const {JSDOM}=require('jsdom');const highsLoader=require('highs');
const ROOT='testroot', OUT=process.env.OUT||'pathway.json', GAS_FIRST=2030, ROOF_PER_YR=1200, DEM=+(process.env.DEM||5);
(async()=>{
 const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
 const dom=new JSDOM(html,{runScripts:'dangerously',resources:'usable',pretendToBeVisual:true,url:'file://'+path.resolve(ROOT)+'/index.html',
  beforeParse(w){ w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>({addColorStop(){},data:[],width:0,measureText:()=>({width:10})})});
   const ch=()=>new Proxy(function(){return ch();},{get:()=>ch()}); w.L=new Proxy({},{get(){return function(){return ch();};}});
   w.onerror=()=>{}; Object.defineProperty(w.history,'replaceState',{value:()=>{},writable:true}); w.URL.createObjectURL=()=>'blob:x'; w.Worker=function(){this.postMessage=()=>{};};
   w.fetch=async(u)=>{try{const cl=String(u).split('?')[0].replace(/^file:.*?\/(?=nodal\/|profiles|config)/,'');const t=fs.readFileSync(path.join(path.resolve(ROOT),cl),'utf8');return{ok:true,json:async()=>JSON.parse(t),text:async()=>t};}catch(e){return{ok:false,json:async()=>{throw e},text:async()=>{throw e}};}};}});
 await new Promise(r=>setTimeout(r,6000)); const w=dom.window;
 const highs=await highsLoader({locateFile:f=>path.join(__dirname,'node_modules/highs/build',f)});
 const fix=lp=>lp.replace(/^ 0 <= b_ccgt_(\d{4}) <= [0-9.]+$/gm,(m,y)=> +y<GAS_FIRST ? ` 0 <= b_ccgt_${y} <= 0` : m)
                 .replace(/^ 0 <= b_rooftop_(\d{4}) <= [0-9.]+$/gm,(m,y)=>{const v=+y>=2027?ROOF_PER_YR:0; return ` ${v} <= b_rooftop_${y} <= ${v}`;});
 let last=null; w.__bldSolveOverride=(lp)=>{ last=highs.solve(fix(lp),{time_limit:900}); return last; };
 w.eval(`applyState(PRESETS['Today 2026']); state.demandGrowthPct=${DEM}; bldSetHorizon(2040);`);
 await w.eval('loadWeatherYears()');
 const t0=Date.now();
 await w.eval(`(async()=>{ const tg=1+(state.demandGrowthPct||0)/100;
   const opts={growth:Math.pow(tg,1/Math.max(1,BLD_YEARS.length-1))-1, eaf:(state.coalEAFPct??FIXED.coalEAFPct)/100, rate:bldRates(), state:{...state, bldPvRateGrowthPct:15}, perYear:true, maxPasses:14, marginStepMW:1000, draws:2, testEvery:2};
   window.__out=await bldStressLoop(opts, m=>{}); })()`);
 const out=w.__out, cols=out.res.Columns;
 const Y=JSON.parse(w.eval('JSON.stringify(BLD_YEARS)')), T=JSON.parse(w.eval('JSON.stringify(BLD_TECHS)'));
 const sched={}; for(const y of Y){ sched[y]={}; for(const t of T) sched[y][t]=Math.round((cols['b_'+t+'_'+y]||{Primal:0}).Primal);
   sched[y].battMWh=Math.round((cols['eb_batt_'+y]||{Primal:0}).Primal); sched[y].off=Math.round((cols['b_off_'+y]||{Primal:0}).Primal);
   sched[y].earlyRetMW=Math.round((cols['rc_'+y]||{Primal:0}).Primal); sched[y].coalMW=Math.round(w.eval(`bldCoalMW(${y})`) - sched[y].earlyRetMW); }
 fs.writeFileSync(OUT, JSON.stringify({margin:out.margin, secs:(Date.now()-t0)/1000, verdict:out.verdict, log:out.log, sched, objective:out.res.ObjectiveValue, status:out.res.Status},null,1));
 console.log('done', out.verdict, ((Date.now()-t0)/1000).toFixed(0)+'s'); process.exit(0);
})();
