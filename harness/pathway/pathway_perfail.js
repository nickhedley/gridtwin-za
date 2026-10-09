// Least-cost pathway to 2040 from Today 2026 with per-failing-year stress windows (build 2026-10-06b): pathway_op's settings
// plus targetFrac (TF, default 0.5), testEvery 1, windowsPerPass 3 (WPP), windows bound from the failing year (LEAD, default 0),
// cap 14 passes (MAXP). 6 Oct 2026.
// TL: solve time limit in seconds (default 900); a solve that is not Optimal stops the run.
// SOLVER=native solves with native HiGHS via highs_native.py (needs: pip install highspy). Run from the parent of testroot.
// Assumptions applied to the build LP text: gas no earlier than 2030 (no import terminal before);
// new rooftop fixed at 1.2 GW a year from 2027 (16.8 GW by 2040, expected uptake, not a planner's choice).
const fs=require('fs'),path=require('path');const {JSDOM}=require('jsdom');const highsLoader=require('highs');
// GAS_CAP (7 Oct 2026): new CCGT MW a year from GAS_FIRST, replacing the rate cap; 0 allows no new gas.
const GAS_CAP=process.env.GAS_CAP!==undefined?+process.env.GAS_CAP:null;
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
 const fix=lp=>lp.replace(/^ 0 <= b_ccgt_(\d{4}) <= [0-9.]+$/gm,(m,y)=> +y<GAS_FIRST ? ` 0 <= b_ccgt_${y} <= 0` : (GAS_CAP!==null ? ` 0 <= b_ccgt_${y} <= ${GAS_CAP}` : m))
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
                 .replace(/^ phescap: (.*) <= [0-9.]+$/gm,(m,lhs)=> LDES_NOCAP ? ` phescap: ${lhs} <= 1000000` : m)
                 .replace(/^ 0 <= rc_(\d{4}) <= ([0-9.]+)$/gm,(m,y,ub)=> RC_MIN!==null && +y===+(process.env.HORIZON||2040) ? ` ${Math.min(RC_MIN,+ub).toFixed(1)} <= rc_${y} <= ${ub}` : m);
 let last=null; w.__bldSolveOverride=async(lp)=>{ if (process.env.SOLVER==='native'){ const os=require('os'),cp=require('child_process'); const tmp=path.join(os.tmpdir(),'gtza_'+process.pid);
   // SOLVE CACHE (7 Oct 2026): the container restarts every few hours and a pass-2 solve takes one to three, so
   // each optimal solution is kept under lpcache/, keyed by a hash of the LP text. A restarted run replays the
   // solves it already finished (identical LP, identical answer) and only redoes the one that was cut off.
   const LPT=fixBuild(fix(lp)), key=require('crypto').createHash('sha1').update(LPT).digest('hex'), cdir=path.join(process.cwd(),'lpcache'), cf=path.join(cdir,key+'.json');
   // DUMP_LP=<prefix> (8 Oct 2026, diagnostics): write each LP to <prefix>_pass<n>.lp; DUMP_STOP=<n> exits after the n-th.
   if (process.env.DUMP_LP){ w.__dumpN=(w.__dumpN||0)+1; fs.writeFileSync(process.env.DUMP_LP+'_pass'+w.__dumpN+'.lp', LPT); console.log('dumped LP pass', w.__dumpN, key.slice(0,10)); if (process.env.DUMP_STOP && w.__dumpN>=+process.env.DUMP_STOP) process.exit(0); }
   if (fs.existsSync(cf)) { last=JSON.parse(fs.readFileSync(cf,'utf8')); console.log('cache hit', key.slice(0,10)); }
   else { fs.writeFileSync(tmp+'.lp',LPT); await require('util').promisify(cp.execFile)('python3',['highs_native.py',tmp+'.lp',tmp+'.json',String(process.env.TL||900)],{maxBuffer:1<<26}); last=JSON.parse(fs.readFileSync(tmp+'.json','utf8'));
     if (last.Status==='Optimal'){ fs.mkdirSync(cdir,{recursive:true}); fs.renameSync(tmp+'.json',cf); try{ fs.unlinkSync(tmp+'.lp'); }catch(e){} }
     else { fs.renameSync(tmp+'.lp', tmp+'.fail.lp'); console.log('kept the failed LP for diagnosis:', tmp+'.fail.lp'); } } }   // 7 Oct 2026: a failed solve keeps its LP (IIS)
   else { const highs=await newHighs(); last=highs.solve(fix(lp),{time_limit:+(process.env.TL||900)}); }
   console.log('solved', last.Status, new Date().toISOString()); if (last.Status!=='Optimal') throw new Error('solve not optimal: '+last.Status); return last; };
 // COMMIT / PSE (6 Oct 2026): coal commitment and pumped-storage energy in the build LP; unset = FIXED defaults.
 w.eval(`applyState(PRESETS['Today 2026']); state.demandGrowthPct=${DEM}; bldSetHorizon(${+(process.env.HORIZON||2040)});`+(process.env.COMMIT!==undefined?` state.bldCoalCommit=${+process.env.COMMIT};`:'')+(process.env.PSE!==undefined?` state.bldPsEnergy=${+process.env.PSE};`:'')+(process.env.PHES!==undefined?` state.bldPhesOn=${+process.env.PHES};`:'')+(process.env.PHES_H?` state.bldPhesHours=${+process.env.PHES_H};`:'')+(process.env.PHES_H2?` state.bldPhesHours2=${+process.env.PHES_H2};`:'')+(process.env.GAS_CAPEX?` if(!('ccgt' in BLD_COST)) throw new Error('BLD_COST.ccgt missing'); BLD_COST.ccgt.c2026=${+process.env.GAS_CAPEX};`:'')+(process.env.PHES_FIRST?` state.bldPhesFirstYear=${+process.env.PHES_FIRST};`:'')+(process.env.PHES_BASIS?` if(!('bldPhesCostBasis' in FIXED)) throw new Error('bldPhesCostBasis missing'); state.bldPhesCostBasis='${process.env.PHES_BASIS}';`:'')+(process.env.GAS_FUEL_R?` if(!('costCcgt' in state)) throw new Error('costCcgt missing'); state.costCcgt=${+process.env.GAS_FUEL_R};`:'')+(process.env.GAS_FOM_ADD?` if(!('ccgt' in BLD_FOM)) throw new Error('BLD_FOM.ccgt missing'); BLD_FOM.ccgt+=${+process.env.GAS_FOM_ADD};`:''));
 // GRID (7 Oct 2026, TODO 14ar): optimiser grid cost. GRID=1 central, 2 high; GRID_BEYOND=1 spur only beyond the
 // median; GRID_BATTHALF=1 storage pays half the integration charge. Unset = FIXED (off).
 w.eval(`if(!('bldGridCost' in FIXED)) throw new Error('bldGridCost missing');`+(process.env.GRID!==undefined?` state.bldGridCost=${+process.env.GRID};`:'')+(process.env.GRID_BEYOND!==undefined?` state.bldGridSpurBeyond=${+process.env.GRID_BEYOND};`:'')+(process.env.GRID_BATTHALF!==undefined?` state.bldGridBattHalf=${+process.env.GRID_BATTHALF};`:''));
 // PEAK (7 Oct 2026, TODO 14as): existing peakers. PEAK=1 end-of-life dates, 2 IRP 2025 dates; PEAK_EXT=0 offers no
 // life extension; PEAK_EXT_R the extension capex, R/kW. Unset = FIXED (off).
 w.eval(`if(!('bldPeakerRet' in FIXED)) throw new Error('bldPeakerRet missing');`+(process.env.PEAK!==undefined?` state.bldPeakerRet=${+process.env.PEAK};`:'')+(process.env.PEAK_EXT!==undefined?` state.bldPeakerLifeExt=${+process.env.PEAK_EXT};`:'')+(process.env.PEAK_EXT_R!==undefined?` state.bldPeakerExtRkW=${+process.env.PEAK_EXT_R};`:''));
 // BATT_CAPEX (7 Oct 2026, TODO 14ax): lithium capex at 2026, R/kW at 4 h, for the low case (8105, a hardware-only
 // basis, so it does not include connection). Read by engine and optimiser alike.
 if (process.env.BATT_CAPEX) w.eval(`if(!('batt' in BLD_COST)) throw new Error('BLD_COST.batt missing'); BLD_COST.batt.c2026=${+process.env.BATT_CAPEX}; BLD_COST.batt.connIncl=false;`);
 // PVTRK (7 Oct 2026, TODO 14aw): new utility solar on the tracking profile at tracker capex.
 w.eval(`if(!('bldPvTracking' in FIXED)) throw new Error('bldPvTracking missing');`+(process.env.PVTRK!==undefined?` state.bldPvTracking=${+process.env.PVTRK};`:''));
 // BATT_CASE (7 Oct 2026): lithium cost case, central (BW3 aged to January 2026), high (BW3 as bid) or low (global turnkey).
 w.eval(`if(!('bldBattCase' in FIXED)) throw new Error('bldBattCase missing');`+(process.env.BATT_CASE!==undefined?` state.bldBattCase=${JSON.stringify(process.env.BATT_CASE)};`:''));
 // PRESET PROPOSAL (7 Oct 2026, user): the build optimiser's proposal for a preset's year, as the second starting point
 // of the preset re-search. HORIZON ends the build in that year (demand reaches DEM there); DSL_DECOM retires that
 // diesel MW; COAL_DECOM forces coal retired by the final year to at least the preset's coalDecomMW (rc_ lower bound).
 if (process.env.DSL_DECOM) w.eval(`state.dieselDecomMW=${+process.env.DSL_DECOM};`);
 const COAL_DECOM = process.env.COAL_DECOM ? +process.env.COAL_DECOM : null;
 const RC_MIN = COAL_DECOM === null ? null : Math.max(0, +w.eval(`bldCoalMW(BLD_YEARS[BLD_YEARS.length-1]) - (FIXED.coalInstalledMW - ${COAL_DECOM})`));
 // WINDMOD / WIND_CASE (7 Oct 2026): new wind on the modern-turbine profile with bid capex (1, default) or the previous
 // R21,000 on the current profile (0); wind cost case central, high or low; WIND_CORR the new-wind correction, central or low.
 w.eval(`if(!('bldWindModern' in FIXED)) throw new Error('bldWindModern missing');`+(process.env.WINDMOD!==undefined?` state.bldWindModern=${+process.env.WINDMOD};`:'')+(process.env.WIND_CASE!==undefined?` state.bldWindCase=${JSON.stringify(process.env.WIND_CASE)};`:'')+(process.env.WIND_CORR!==undefined?` state.bldWindCorr=${JSON.stringify(process.env.WIND_CORR)};`:''));
 // STRESS_TARGET (8 Oct 2026, TODO 14bk): 1 plans the stress windows to the standard (bldStressTarget); unset = FIXED (0).
 w.eval(`if(!('bldStressTarget' in FIXED)) throw new Error('bldStressTarget missing');`+(process.env.STRESS_TARGET!==undefined?` state.bldStressTarget=${+process.env.STRESS_TARGET};`:''));
 // WPY (9 Oct 2026): 1 binds each loop window only in the years where it failed (bldWindowsPerYear), 0 from the first
 // failing year to the horizon; unset = FIXED (1 from build 2026-10-09a).
 w.eval(`if(!('bldWindowsPerYear' in FIXED)) throw new Error('bldWindowsPerYear missing');`+(process.env.WPY!==undefined?` state.bldWindowsPerYear=${+process.env.WPY};`:''));
 // CUMV (8 Oct 2026): 1 writes cumulative capacity as one variable per technology and year (bldCumVars), the same
 // model in a sparser LP; unset = FIXED (0).
 w.eval(`if(!('bldCumVars' in FIXED)) throw new Error('bldCumVars missing');`+(process.env.CUMV!==undefined?` state.bldCumVars=${+process.env.CUMV};`:''));
 // SHRINK TESTS (user, 8 Oct 2026: ways to shrink the pass-2 LP, each tested for its effect on cost and build).
 // REP_DAYS=<n>: n representative days instead of 12. MERGE_WIN=1: stress windows from the same weather year and outage
 // draw that overlap are solved as one window over their union of days, binding from the earliest of their years (the
 // loop's record of which runs are held is unchanged). WIN_YEARS=<y,y>: only windows from these weather years reach the
 // LP (to test MERGE_WIN on a small LP). FIX_FROM=<pathway json> FIX_TO=<year>: every build decision up to that year is
 // fixed at the file's exact value (five-year blocks, and re-costing a build on the full model). GROWTH_PA: annual demand
 // growth, so a block keeps the full path's rate.
 if (process.env.REP_DAYS) w.eval(`{ const _rd = bldRepDays; bldRepDays = n => _rd(n === 12 ? ${+process.env.REP_DAYS} : n); }`);
 if (process.env.MERGE_WIN==='1' || process.env.WIN_YEARS) w.eval(`{ const MERGE = ${process.env.MERGE_WIN==='1'}, KEEP = ${JSON.stringify((process.env.WIN_YEARS||'').split(',').filter(Boolean).map(Number))};
   const shrink = P => { let L = P.filter(p => !KEEP.length || KEEP.includes(p.year)); if (!MERGE) return L;
     const out = [], groups = {}; for (const p of L) (groups[p.year + '_' + p.seed] = groups[p.year + '_' + p.seed] || []).push(p);
     for (const g of Object.values(groups)){ g.sort((a, b) => a.start - b.start); let cur = null;
       for (const p of g){
         const end = Math.max(cur ? cur.start + cur.n : 0, p.start + p.n);
         if (cur && p.start < cur.start + cur.n && end - cur.start <= 30){
           const n = end - cur.start, cf = new Array(n * 24);
           for (const q of [cur, p]) for (let i = 0; i < q.n * 24; i++){ const k = (q.start - cur.start) * 24 + i; if (cf[k] === undefined) cf[k] = q.coalFrac[i]; else if (Math.abs(cf[k] - q.coalFrac[i]) > 1e-9) window.__mergeMismatch = (window.__mergeMismatch || 0) + 1; }
           cur = { ...cur, n, fromYear: Math.min(cur.fromYear, p.fromYear), coalFrac: cf, merged: (cur.merged || 1) + 1 };
         } else { if (cur) out.push(cur); cur = { ...p }; } }
       if (cur) out.push(cur); }
     return out; };
   const _b = bldBuildLP; bldBuildLP = function(o){ const keep = bldStressPeriods; bldStressPeriods = shrink(keep); window.__lpWindows = bldStressPeriods.map(p => [p.year, p.seed, p.start, p.n, p.fromYear, p.merged || 1]);
     try { return _b(o); } finally { bldStressPeriods = keep; } }; }`);
 const FIXB = process.env.FIX_FROM ? JSON.parse(fs.readFileSync(process.env.FIX_FROM,'utf8')).build : null, FIX_TO = +(process.env.FIX_TO||0);
 function fixBuild(lp){ if (!FIXB) return lp;
   const fx = Object.entries(FIXB).filter(([n]) => +n.slice(-4) <= FIX_TO), names = new Set(fx.map(([n]) => n));
   const i = lp.indexOf('\nBounds\n'), j = lp.lastIndexOf('\nEnd'); if (i < 0 || j < 0) throw new Error('fixBuild: no Bounds or End');
   const present = new Set(lp.slice(i, j).match(/[A-Za-z_][A-Za-z0-9_]*/g));
   const kept = lp.slice(i + 8, j).split('\n').filter(l => !(l.match(/[A-Za-z_][A-Za-z0-9_]*/g) || []).some(t => names.has(t)));
   const add = fx.filter(([n]) => lp.includes(' ' + n + ' ') || lp.includes(' ' + n + '\n') || present.has(n)).map(([n, v]) => ' ' + n + ' = ' + v);
   return lp.slice(0, i + 8) + kept.concat(add).join('\n') + lp.slice(j); }
 // COSTSET (7 Oct 2026): a whole cost set, e.g. COSTSET=irp2025; see costset.js.
 require('./costset.js')(w, process.env.COSTSET);
 await w.eval('loadWeatherYears()');
 const t0=Date.now();
 const _dump=setInterval(()=>{ try{ fs.writeFileSync((process.env.OUT||'x')+'.progress', JSON.stringify(w.eval('JSON.stringify(bldStressLog.map(l=>({pass:l.pass,margin:l.margin,added:l.added,nAdded:Array.isArray(l.added)?l.added.length:l.added,fails:l.years.filter(q=>q.mean>q.limit).map(q=>[q.y,+q.mean.toFixed(2),+q.limit.toFixed(2)])})))'))); }catch(e){} }, 20000);
 await w.eval(`(async()=>{ const tg=1+(state.demandGrowthPct||0)/100;
   const opts={growth:${process.env.GROWTH_PA ? +process.env.GROWTH_PA : 'Math.pow(tg,1/Math.max(1,BLD_YEARS.length-1))-1'}, eaf:(state.coalEAFPct??FIXED.coalEAFPct)/100, rate:bldRates(), state:state, perYear:true, marginStepMW:1000, draws:2, stressDays:14, targetFrac:${+(process.env.TF||0.5)}, windowLeadYears:${+(process.env.LEAD||0)}, testEvery:1, windowsPerPass:${+(process.env.WPP||3)}, maxPasses:${+(process.env.MAXP||14)}};
   window.__out=await bldStressLoop(opts, m=>{}); })()`);
 const out=w.__out, cols=out.res.Columns;
 const Y=JSON.parse(w.eval('JSON.stringify(BLD_YEARS)')), T=JSON.parse(w.eval('JSON.stringify(BLD_TECHS)'));
 const sched={}; for(const y of Y){ sched[y]={}; for(const t of T) sched[y][t]=Math.round((cols['b_'+t+'_'+y]||{Primal:0}).Primal);
   sched[y].battMWh=Math.round((cols['eb_batt_'+y]||{Primal:0}).Primal); sched[y].off=Math.round((cols['b_off_'+y]||{Primal:0}).Primal);
   sched[y].phes=Math.round((cols['b_phes_'+y]||{Primal:0}).Primal); sched[y].phel=Math.round((cols['b_phel_'+y]||{Primal:0}).Primal); sched[y].dslDecomMW=Math.round(w.eval(`bldPeakerDecomMW(${y},{...FIXED,...state},${JSON.stringify(Object.fromEntries(Object.entries(cols).filter(([c])=>c.startsWith('le_'))))})`)); sched[y].rp={}; for(const t of T.concat(['phes','phel'])){ const v=Math.round((cols['rp_'+t+'_'+y]||{Primal:0}).Primal); if(v) sched[y].rp[t]=v; } sched[y].earlyRetMW=Math.round((cols['rc_'+y]||{Primal:0}).Primal); sched[y].coalMW=Math.round(w.eval(`bldCoalMW(${y})`) - sched[y].earlyRetMW); }
 // DUMP (6 Oct 2026): the final LP's 2040 stress-window hours (d >= 1100) and the windows themselves,
 // for decomposing optimiser against engine supply line by line.
 if (process.env.DUMP!=='0'){ const DY=+(process.env.DUMPY||2040); const re=new RegExp('^([a-z]+)_'+DY+'_(\\d+)_(\\d+)$'); const lpv={};
   for (const [n,c] of Object.entries(cols)){ const m=n.match(re); if (m && +m[2]>=1100) lpv[n]=c.Primal; }
   const periods=JSON.parse(w.eval('JSON.stringify(bldStressPeriods)'));
   fs.writeFileSync(OUT.replace(/\.json$/,'')+'_lp'+DY+'.json', JSON.stringify({year:DY, periods, lpv})); }
 const peakerExt=Object.fromEntries(Object.entries(cols).filter(([c])=>c.startsWith('le_')).map(([c,v])=>[c.slice(3),Math.round(v.Primal||0)]));   // TODO 14as
 const build=Object.fromEntries(Object.entries(cols).filter(([n])=>/^(b_[a-z]+|eb_batt|rc|cc_[a-z]+)_20\d\d$/.test(n)).map(([n,c])=>[n,c.Primal]));   // exact, for FIX_FROM
 fs.writeFileSync(OUT, JSON.stringify({build, lpWindows:w.__lpWindows||null, mergeMismatch:w.__mergeMismatch||0, margin:out.margin, secs:(Date.now()-t0)/1000, verdict:out.verdict, log:out.log, sched, objective:out.res.ObjectiveValue, status:out.res.Status, peakerExt},null,1));
 console.log('done', out.verdict, ((Date.now()-t0)/1000).toFixed(0)+'s'); process.exit(0);
})();
