// Least-cost pathway to 2040 from Today 2026 with per-failing-year stress windows (build 2026-10-06b): pathway_op's settings
// plus targetFrac (TF, default 0.5), testEvery 1, windowsPerPass 3 (WPP), windows bound from the failing year (LEAD, default 0),
// cap 14 passes (MAXP). 6 Oct 2026.
// TL: solve time limit in seconds (default 900); a solve that is not Optimal stops the run.
// SOLVER=native solves with native HiGHS via highs_native.py (needs: pip install highspy). Run from the parent of testroot.
// Assumptions applied to the build LP text: gas no earlier than 2030 (no import terminal before);
// new rooftop fixed at 1.2 GW a year from 2027 (16.8 GW by 2040, expected uptake, not a planner's choice).
const fs=require('fs'),path=require('path');const {JSDOM}=require('jsdom');const highsLoader=require('highs');
const IA_CAP=process.env.IA_CAP?+process.env.IA_CAP:0, LI_CAP=process.env.LI_CAP?+process.env.LI_CAP:0, CAP_FROM=+(process.env.CAP_FROM||2028), LDES_NOCAP=process.env.LDES_NOCAP==='1';
const ROOT='testroot', OUT=process.env.OUT||'pathway.json', GAS_FIRST=2030, ROOF_PER_YR=1200, DEM=+(process.env.DEM||5);
(async()=>{
 const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
 const dom=new JSDOM(html,{runScripts:'dangerously',resources:'usable',pretendToBeVisual:true,url:'file://'+path.resolve(ROOT)+'/index.html',
  beforeParse(w){ w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>({addColorStop(){},data:[],width:0,measureText:()=>({width:10})})});
   const ch=()=>new Proxy(function(){return ch();},{get:()=>ch()}); w.L=new Proxy({},{get(){return function(){return ch();};}});
   w.onerror=()=>{}; Object.defineProperty(w.history,'replaceState',{value:()=>{},writable:true}); w.URL.createObjectURL=()=>'blob:x'; w.Worker=function(){this.postMessage=()=>{};};
   w.fetch=async(u)=>{try{const cl=String(u).split('?')[0].replace(/^file:.*?\/(?=nodal\/|profiles|config)/,'');const t=fs.readFileSync(path.join(path.resolve(ROOT),cl),'utf8');return{ok:true,json:async()=>JSON.parse(t),text:async()=>t};}catch(e){return{ok:false,json:async()=>{throw e},text:async()=>{throw e}};}};}});
 await new Promise(r=>setTimeout(r,6000)); const w=dom.window;
 // A fresh HiGHS instance per solve: one shared instance aborted (out of WASM memory) after several passes, 5 Oct 2026.
 const newHighs=()=>highsLoader({locateFile:f=>path.join(process.cwd(),'node_modules/highs/build',f)});
 const fix=lp=>lp.replace(/^ 0 <= b_ccgt_(\d{4}) <= [0-9.]+$/gm,(m,y)=> +y<GAS_FIRST ? ` 0 <= b_ccgt_${y} <= 0` : m)
                 .replace(/^ 0 <= b_rooftop_(\d{4}) <= [0-9.]+$/gm,(m,y)=>{const v=+y>=2027?ROOF_PER_YR:0; return ` ${v} <= b_rooftop_${y} <= ${v}`;})
                 // Gas infrastructure sensitivity, TODO 14ak (6 Oct 2026): GAS_FUEL_R sets costCcgt (R/MWh, replacing the flat regas
                 // adder), GAS_FOM_ADD adds the LNG terminal's fixed cost to new CCGT fixed O&M (R/kW-yr); same in pathcheck.js.
                 // Long-duration storage variants (user, 6 Oct 2026). IA_CAP and LI_CAP: iron-air and lithium MW a year
                 // from CAP_FROM (default 2028), lithium energy cap scaled with it (12 h x rate, as index.html).
                 // LDES_NOCAP=1: no yearly or cumulative cap on iron-air or pumped hydro, a bounding case.
                 .replace(/^ 0 <= b_ironair_(\d{4}) <= [0-9.]+$/gm,(m,y)=> LDES_NOCAP ? ` 0 <= b_ironair_${y} <= 200000` : (IA_CAP && +y>=CAP_FROM ? ` 0 <= b_ironair_${y} <= ${IA_CAP}` : m))
                 .replace(/^ 0 <= b_batt_(\d{4}) <= [0-9.]+$/gm,(m,y)=> LI_CAP && +y>=CAP_FROM ? ` 0 <= b_batt_${y} <= ${LI_CAP}` : m)
                 .replace(/^ 0 <= eb_batt_(\d{4}) <= [0-9.]+$/gm,(m,y)=> LI_CAP && +y>=CAP_FROM ? ` 0 <= eb_batt_${y} <= ${12*LI_CAP}` : m)
                 .replace(/^ 0 <= b_phes_(\d{4}) <= ([0-9.]+)$/gm,(m,y,v)=> LDES_NOCAP && +v>0 ? ` 0 <= b_phes_${y} <= 200000` : m)
                 .replace(/^ phescap: (.*) <= [0-9.]+$/gm,(m,lhs)=> LDES_NOCAP ? ` phescap: ${lhs} <= 1000000` : m);
 let last=null; w.__bldSolveOverride=async(lp)=>{ if (process.env.SOLVER==='native'){ const os=require('os'),cp=require('child_process'); const tmp=path.join(os.tmpdir(),'gtza_'+process.pid);
   fs.writeFileSync(tmp+'.lp',fix(lp)); await require('util').promisify(cp.execFile)('python3',['highs_native.py',tmp+'.lp',tmp+'.json',String(process.env.TL||900)],{maxBuffer:1<<26}); last=JSON.parse(fs.readFileSync(tmp+'.json','utf8')); }
   else { const highs=await newHighs(); last=highs.solve(fix(lp),{time_limit:+(process.env.TL||900)}); }
   console.log('solved', last.Status, new Date().toISOString()); if (last.Status!=='Optimal') throw new Error('solve not optimal: '+last.Status); return last; };
 // COMMIT / PSE (6 Oct 2026): coal commitment and pumped-storage energy in the build LP; unset = FIXED defaults.
 w.eval(`applyState(PRESETS['Today 2026']); state.demandGrowthPct=${DEM}; bldSetHorizon(2040);`+(process.env.COMMIT!==undefined?` state.bldCoalCommit=${+process.env.COMMIT};`:'')+(process.env.PSE!==undefined?` state.bldPsEnergy=${+process.env.PSE};`:'')+(process.env.PHES!==undefined?` state.bldPhesOn=${+process.env.PHES};`:'')+(process.env.PHES_BASIS?` if(!('bldPhesCostBasis' in FIXED)) throw new Error('bldPhesCostBasis missing'); state.bldPhesCostBasis='${process.env.PHES_BASIS}';`:'')+(process.env.GAS_FUEL_R?` if(!('costCcgt' in state)) throw new Error('costCcgt missing'); state.costCcgt=${+process.env.GAS_FUEL_R};`:'')+(process.env.GAS_FOM_ADD?` if(!('ccgt' in BLD_FOM)) throw new Error('BLD_FOM.ccgt missing'); BLD_FOM.ccgt+=${+process.env.GAS_FOM_ADD};`:''));
 await w.eval('loadWeatherYears()');
 const t0=Date.now();
 const _dump=setInterval(()=>{ try{ fs.writeFileSync((process.env.OUT||'x')+'.progress', JSON.stringify(w.eval('JSON.stringify(bldStressLog.map(l=>({pass:l.pass,margin:l.margin,added:l.added,nAdded:Array.isArray(l.added)?l.added.length:l.added,fails:l.years.filter(q=>q.mean>q.limit).map(q=>[q.y,+q.mean.toFixed(2),+q.limit.toFixed(2)])})))'))); }catch(e){} }, 20000);
 await w.eval(`(async()=>{ const tg=1+(state.demandGrowthPct||0)/100;
   const opts={growth:Math.pow(tg,1/Math.max(1,BLD_YEARS.length-1))-1, eaf:(state.coalEAFPct??FIXED.coalEAFPct)/100, rate:bldRates(), state:state, perYear:true, marginStepMW:1000, draws:2, stressDays:14, targetFrac:${+(process.env.TF||0.5)}, windowLeadYears:${+(process.env.LEAD||0)}, testEvery:1, windowsPerPass:${+(process.env.WPP||3)}, maxPasses:${+(process.env.MAXP||14)}};
   window.__out=await bldStressLoop(opts, m=>{}); })()`);
 const out=w.__out, cols=out.res.Columns;
 const Y=JSON.parse(w.eval('JSON.stringify(BLD_YEARS)')), T=JSON.parse(w.eval('JSON.stringify(BLD_TECHS)'));
 const sched={}; for(const y of Y){ sched[y]={}; for(const t of T) sched[y][t]=Math.round((cols['b_'+t+'_'+y]||{Primal:0}).Primal);
   sched[y].battMWh=Math.round((cols['eb_batt_'+y]||{Primal:0}).Primal); sched[y].off=Math.round((cols['b_off_'+y]||{Primal:0}).Primal);
   sched[y].phes=Math.round((cols['b_phes_'+y]||{Primal:0}).Primal); sched[y].earlyRetMW=Math.round((cols['rc_'+y]||{Primal:0}).Primal); sched[y].coalMW=Math.round(w.eval(`bldCoalMW(${y})`) - sched[y].earlyRetMW); }
 // DUMP (6 Oct 2026): the final LP's 2040 stress-window hours (d >= 1100) and the windows themselves,
 // for decomposing optimiser against engine supply line by line.
 if (process.env.DUMP!=='0'){ const DY=+(process.env.DUMPY||2040); const re=new RegExp('^([a-z]+)_'+DY+'_(\\d+)_(\\d+)$'); const lpv={};
   for (const [n,c] of Object.entries(cols)){ const m=n.match(re); if (m && +m[2]>=1100) lpv[n]=c.Primal; }
   const periods=JSON.parse(w.eval('JSON.stringify(bldStressPeriods)'));
   fs.writeFileSync(OUT.replace(/\.json$/,'')+'_lp'+DY+'.json', JSON.stringify({year:DY, periods, lpv})); }
 fs.writeFileSync(OUT, JSON.stringify({margin:out.margin, secs:(Date.now()-t0)/1000, verdict:out.verdict, log:out.log, sched, objective:out.res.ObjectiveValue, status:out.res.Status},null,1));
 console.log('done', out.verdict, ((Date.now()-t0)/1000).toFixed(0)+'s'); process.exit(0);
})();
