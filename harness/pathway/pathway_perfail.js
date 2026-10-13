// Least-cost pathway to 2040 from Today 2026 with per-failing-year stress windows (build 2026-10-06b): pathway_op's settings
// plus targetFrac (TF, default 0.5), testEvery 1, windowsPerPass 3 (WPP), windows bound from the failing year (LEAD, default 0),
// cap 14 passes (MAXP). 6 Oct 2026.
// TL: solve time limit in seconds (default 900); a solve that is not Optimal stops the run.
// SOLVER=native solves with native HiGHS via highs_native.py (needs: pip install highspy). Run from the parent of testroot.
// Assumptions applied to the build LP text: gas no earlier than 2030 (no import terminal before);
// new rooftop fixed at 1.2 GW a year from 2027 (16.8 GW by 2040, expected uptake, not a planner's choice).
const fs=require('fs'),path=require('path');const {JSDOM}=require('jsdom');const highsLoader=require('highs');
// GAS_CAP (7 Oct 2026): new CCGT MW a year from GAS_FIRST, replacing the rate cap; 0 allows no new gas.
// DISC (11 Oct 2026, TODO 14be step 3): discount rate for annuities and discounting (BLD_DISC), e.g. 0.113 for the
// IRP's 11.3% (inferred real); recorded in the output and applied by pathcheck.js.
// LI_EH (build 2026-10-12c): lithium energy built per year as hours of the power cap (default bldLiEnergyHours, 4; was 12).
// ADEQ_BASIS: the adequacy loop's demand, 'customer' (default from 2026-10-12c) or 'withCharging' (every run before c4).
// OCGT=1 (build 2026-10-11f, TODO 14bo item 5): new OCGT on LNG offered, sharing the gas cap with CCGT; TURB_CAP (MW a
// year, default 2000, build 2026-10-12a) caps every new turbine together when an OCGT option is on; OCGD=1 with
// OCGD_RATE (MW a year) and OCGD_FROM (first year): new OCGT on diesel, its own cap; OCGT_COST central or irp (capex).
// Recorded in the output (ocgt) and applied by pathcheck.js.
// NUC_FORCE (11 Oct 2026, TODO 14be step 7): new nuclear decided in advance, "year:MW,...", e.g. IRP 2025 Table 1
// 2036:1250,2037:1250,2038:1350,2039:1350 (bldNuclearAdd). Recorded in the output and applied by pathcheck.js.
// GAS_PREM (11 Oct 2026, TODO 14be step 3): added to the annuity rate of new gas only (bldGasFinPremium), e.g. 0.015;
// years are still weighted at BLD_DISC. Recorded in the output and applied by pathcheck.js.
// GASFLOOR (11 Oct 2026, TODO 14be step 4): 1 applies IRP 2025's 51% minimum gas capacity factor (2030-2040) in the
// optimiser (bldGasFloorOn) and the engine (ccgtForceLoad); recorded in the output and applied by pathcheck.js.
// GAS_FIRST (10 Oct 2026, TODO 14be step 2): first year new gas may come on line, default 2030 (the deliverability cap);
// the relaxed-cap diagnosis uses GAS_FIRST=2027 GAS_CAP=100000 and is labelled not deliverable.
const GAS_CAP=process.env.GAS_CAP!==undefined?+process.env.GAS_CAP:null;
// GAS_FORCE (11 Oct 2026, TODO 14be step 5): new CCGT decided in advance, as IRP 2025 Table 1 (p.42), e.g.
// "2029:3000,2030:3000,2031-2040:1000": exactly that many MW in each year named (no OCGT on LNG in those years),
// overriding GAS_FIRST and GAS_CAP there.
const byYear=(name)=>{ const o={}; for (const part of (process.env[name]||'').split(',').filter(Boolean)){ const [ys,mw]=part.split(':'); const [a,b]=ys.split('-').map(Number);
  if (!(a>2000) || !(+mw>=0)) throw new Error(name+': '+part); for (let y=a; y<=(b||a); y++) o[y]=+mw; } return o; };
const GAS_FORCE=byYear('GAS_FORCE');
// GAS_MIN (12 Oct 2026, user: committed procurement, section 34 determination of 7 Oct 2026): at least that many MW of
// new CCGT in each year named, e.g. "2030-2033:1200,2034:200" (5 GW at the 1.2 GW a year cap from 2030); the optimiser
// may add more up to the cap. Recorded in the output (gasMin). When the LP offers OCGT on LNG (OCGT=1), the minimum
// covers all new gas, CCGT plus OCGT on LNG, as gmin_<y> rows, and the optimiser chooses the type (user, 12 Oct 2026);
// OCGT on diesel is not gas-to-power and stays outside it.
const GAS_MIN=byYear('GAS_MIN');
const gasMinRows=lp=>{ if (!Object.keys(GAS_MIN).length || !/^ 0 <= b_ocgt_\d{4} <= /m.test(lp)) return lp;
  const i=lp.indexOf('\nBounds\n'); if (i<0) throw new Error('GAS_MIN: no Bounds');
  const rows=Object.entries(GAS_MIN).filter(([,mw])=>mw>0).map(([y,mw])=>{ const g=lp.match(new RegExp('^ gascap_'+y+': .* <= ([0-9.]+)$','m'));
    if (!g) throw new Error('GAS_MIN: no gascap_'+y); if (mw > +g[1]) throw new Error('GAS_MIN '+mw+' above the gas cap '+g[1]+' in '+y);
    return ' gmin_'+y+': b_ccgt_'+y+' + b_ocgt_'+y+' >= '+mw; });
  return lp.slice(0,i)+'\n'+rows.join('\n')+lp.slice(i); };
// LI_MIN (12 Oct 2026, user: committed procurement): "year:MW:MWh", at least that much new lithium power and energy built
// by that year (limin_/lemin_ rows), e.g. 2030:4600:18400 for the 4,600 MW of battery storage in the section 34
// determination at an assumed 4 hours (judgement). Not additive: it is a floor on the optimiser's own build.
const LI_MIN=(process.env.LI_MIN||'').split(',').filter(Boolean).map(q=>{ const [y,mw,mwh]=q.split(':').map(Number); if(!(y>2000&&mw>=0&&mwh>=0)) throw new Error('LI_MIN: '+q); return {y,mw,mwh}; });
const liMinRows=lp=>{ if (!LI_MIN.length) return lp; const i=lp.indexOf('\nBounds\n'); if (i<0) throw new Error('LI_MIN: no Bounds');
  const yrs=[...new Set((lp.match(/\bb_batt_(\d{4})\b/g)||[]).map(t=>+t.slice(-4)))].sort();
  const rows=LI_MIN.map(q=>{ const ys=yrs.filter(y=>y<=q.y); if(!ys.length) throw new Error('LI_MIN: no lithium years by '+q.y);
    return ' limin_'+q.y+': '+ys.map(y=>'b_batt_'+y).join(' + ')+' >= '+q.mw+'\n lemin_'+q.y+': '+ys.map(y=>'eb_batt_'+y).join(' + ')+' >= '+q.mwh; });
  return lp.slice(0,i)+'\n'+rows.join('\n')+lp.slice(i); };
const IA_CAP=process.env.IA_CAP?+process.env.IA_CAP:0, LI_CAP=process.env.LI_CAP!==undefined?+process.env.LI_CAP:3000, CAP_FROM=+(process.env.CAP_FROM||2028), WIND_CAP=process.env.WIND_CAP?+process.env.WIND_CAP:0, WIND_CAP_FROM=+(process.env.WIND_CAP_FROM||process.env.CAP_FROM||2028), LDES_NOCAP=process.env.LDES_NOCAP==='1';
// DEM: demand growth to the horizon year, %. Default 5 is the LEGACY, UNSOURCED setting inherited from the transition
// presets (a judgement, not a forecast; RESULTS 9 Oct 2026); label runs on it "demand +5% (legacy, unsourced)".
// IMP_END (user, 13 Oct 2026, TODO 14dv (6)): regional imports end after this year (importsEndYear, FIXED); 2030 for the
// no-imports-after-2030 sensitivity. Unset keeps imports in every year.
if (process.env.IMP_END!==undefined && !(+process.env.IMP_END===0 || (+process.env.IMP_END>=2026 && +process.env.IMP_END<=2050))) throw new Error('IMP_END: '+process.env.IMP_END);
const ROOT='testroot', OUT=process.env.OUT||'pathway.json', GAS_FIRST=+(process.env.GAS_FIRST||2030), ROOF_PER_YR=1200, DEM=+(process.env.DEM||5);
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
 const fix=lp=>{ const oc=/^ 0 <= b_ocgt_\d{4} <= /m.test(lp); return lp.replace(/^ 0 <= b_(ccgt|ocgt)_(\d{4}) <= ([0-9.]+)$/gm,(m,t,y,ub)=>{
                   if (t==='ccgt' && GAS_FORCE[y]!==undefined) return ` ${GAS_FORCE[y]} <= b_ccgt_${y} <= ${GAS_FORCE[y]}`;
                   const out = +y<GAS_FIRST ? ` 0 <= b_${t}_${y} <= 0` : (GAS_CAP!==null ? ` 0 <= b_${t}_${y} <= ${GAS_CAP}` : m);
                   if (t!=='ccgt' || !GAS_MIN[y] || oc) return out;   // unchanged text when no minimum applies; with OCGT, gasMinRows
                   const hi = +out.split('<= ').pop(); if (GAS_MIN[y] > hi) throw new Error('GAS_MIN '+GAS_MIN[y]+' above the cap '+hi+' in '+y);
                   return ` ${GAS_MIN[y]} <= b_ccgt_${y} <= ${hi}`; })
                 // One gas cap for CCGT and OCGT on LNG (gascap_<y>, build 2026-10-11f): rewritten as the bounds are.
                 .replace(/^ (gascap_(\d{4})): (.*) <= [0-9.]+$/gm,(m,nm,y,lhs)=> GAS_FORCE[y]!==undefined ? ` ${nm}: ${lhs} <= ${GAS_FORCE[y]}` : +y<GAS_FIRST ? ` ${nm}: ${lhs} <= 0` : (GAS_CAP!==null ? ` ${nm}: ${lhs} <= ${GAS_CAP}` : m))
                 .replace(/^ 0 <= b_rooftop_(\d{4}) <= [0-9.]+$/gm,(m,y)=>{const v=+y>=2027?ROOF_PER_YR:0; return ` ${v} <= b_rooftop_${y} <= ${v}`;})
                 // Gas infrastructure sensitivity, TODO 14ak (6 Oct 2026): GAS_FUEL_R sets costCcgt (R/MWh, replacing the flat regas
                 // adder), GAS_FOM_ADD adds the LNG terminal's fixed cost to new CCGT fixed O&M (R/kW-yr); same in pathcheck.js.
                 // LI_CAP default 3000 from 11 Oct 2026 (user): the central lithium pace is 3 GW a year from CAP_FROM (2028),
                 // 2 GW before; the 2 GW cap bound in 12 of 15 years on IRP demand. LI_CAP=2000 (or 0) restores the old central.
                 // Long-duration storage variants (user, 6 Oct 2026). IA_CAP and LI_CAP: iron-air and lithium MW a year
                 // from CAP_FROM (default 2028), lithium energy cap scaled with it (12 h x rate, as index.html).
                 // LDES_NOCAP=1: no yearly or cumulative cap on iron-air or pumped hydro, a bounding case.
                 .replace(/^ 0 <= b_ironair_(\d{4}) <= [0-9.]+$/gm,(m,y)=> LDES_NOCAP ? ` 0 <= b_ironair_${y} <= 200000` : (IA_CAP && +y>=CAP_FROM ? ` 0 <= b_ironair_${y} <= ${IA_CAP}` : m))
                 // WIND_CAP (11 Oct 2026, user): new wind MW a year from WIND_CAP_FROM (default CAP_FROM), e.g. 3500 for the
                 // wind pace sensitivity; unset keeps BLD_PACE (2,500 a year).
                 .replace(/^ 0 <= b_wind_(\d{4}) <= [0-9.]+$/gm,(m,y)=> WIND_CAP && +y>=WIND_CAP_FROM ? ` 0 <= b_wind_${y} <= ${WIND_CAP}` : m)
                 .replace(/^ 0 <= b_batt_(\d{4}) <= [0-9.]+$/gm,(m,y)=> LI_CAP && +y>=CAP_FROM ? ` 0 <= b_batt_${y} <= ${LI_CAP}` : m)
                 // Lithium energy per year: bldLiEnergyHours (default 4 from build 2026-10-12c; LI_EH overrides) x LI_CAP.
                 .replace(/^ 0 <= eb_batt_(\d{4}) <= [0-9.]+$/gm,(m,y)=> LI_CAP && +y>=CAP_FROM ? ` 0 <= eb_batt_${y} <= ${(+w.eval('state.bldLiEnergyHours ?? FIXED.bldLiEnergyHours ?? 12'))*LI_CAP}` : m)
                 .replace(/^ 0 <= b_phes_(\d{4}) <= ([0-9.]+)$/gm,(m,y,v)=> LDES_NOCAP && +v>0 ? ` 0 <= b_phes_${y} <= 200000` : m)
                 .replace(/^ (phescap_\d{4}): (.*) <= [0-9.]+$/gm,(m,nm,lhs)=> LDES_NOCAP ? ` ${nm}: ${lhs} <= 1000000` : m)
                 .replace(/^ 0 <= rc_(\d{4}) <= ([0-9.]+)$/gm,(m,y,ub)=> RC_MIN!==null && +y===+(process.env.HORIZON||2040) ? ` ${Math.min(RC_MIN,+ub).toFixed(1)} <= rc_${y} <= ${ub}` : m); };
 let last=null; w.__bldSolveOverride=async(lp)=>{ if (process.env.SOLVER==='native'){ const os=require('os'),cp=require('child_process'); const tmp=path.join(os.tmpdir(),'gtza_'+process.pid);
   // SOLVE CACHE (7 Oct 2026): the container restarts every few hours and a pass-2 solve takes one to three, so
   // each optimal solution is kept under lpcache/, keyed by a hash of the LP text. A restarted run replays the
   // solves it already finished (identical LP, identical answer) and only redoes the one that was cut off.
   const LPT=liMinRows(gasMinRows(fixBuild(fix(lp)))), key=require('crypto').createHash('sha1').update(LPT).digest('hex'), cdir=path.join(process.cwd(),'lpcache'), cf=path.join(cdir,key+'.json');
   // DUMP_LP=<prefix> (8 Oct 2026, diagnostics): write each LP to <prefix>_pass<n>.lp; DUMP_STOP=<n> exits after the n-th.
   if (process.env.DUMP_LP){ w.__dumpN=(w.__dumpN||0)+1; fs.writeFileSync(process.env.DUMP_LP+'_pass'+w.__dumpN+'.lp', LPT); console.log('dumped LP pass', w.__dumpN, key.slice(0,10)); if (process.env.DUMP_STOP && w.__dumpN>=+process.env.DUMP_STOP) process.exit(0); }
   // WARM=1 (11 Oct 2026): each pass starts from the previous pass's basis, kept beside its cached solution
   // (<key>.basis.json); a pass whose predecessor has no saved basis starts cold. Off by default.
   const WARM=process.env.WARM==='1', cfb=cf.replace(/\.json$/,'.basis.json');
   // RESUME=1 with JOB_DEADLINE (unix seconds) (12 Oct 2026, for jobs with a time limit, e.g. GitHub Actions' 6 hours):
   // a solve gets the time left before the deadline less 15 minutes; if it stops at that limit its basis is kept as
   // <key>.partial.basis.json beside the cache and the script exits with code 75; the next job replays the finished
   // passes from the cache and resumes this solve from that basis. Off by default.
   // JOB_PASSES=<n> with RESUME=1 (12 Oct 2026, user: one pass per job): after n solves in this job (a resumed solve
   // counts), the script exits with code 75 before starting the next, so the next job picks up from the cache.
   const RESUME=process.env.RESUME==='1', cfp=cf.replace(/\.json$/,'.partial.basis.json');
   const TLX=RESUME&&process.env.JOB_DEADLINE ? Math.max(600, Math.floor(+process.env.JOB_DEADLINE - Date.now()/1000 - 900)) : +(process.env.TL||900);
   if (fs.existsSync(cf)) { last=JSON.parse(fs.readFileSync(cf,'utf8')); console.log('cache hit', key.slice(0,10)); w.__prevBasis=fs.existsSync(cfb)?cfb:null; }
   else { if (RESUME && process.env.JOB_PASSES && (w.__jobSolves||0) >= +process.env.JOB_PASSES){ console.log('solves for this job done; next pass', key.slice(0,10), 'left to the next job'); process.exit(75); }
     fs.writeFileSync(tmp+'.lp',LPT);
     const bIn = RESUME && fs.existsSync(cfp) ? cfp : (WARM && w.__prevBasis ? w.__prevBasis : null);
     const benv=(WARM||RESUME)?{...process.env, HIGHS_BASIS_OUT:tmp+'.basis.json', ...(bIn?{HIGHS_BASIS_IN:bIn}:{})}:process.env;
     if (WARM||RESUME) console.log('start from basis', bIn||'none (cold)', 'time limit', TLX+'s');
     await require('util').promisify(cp.execFile)('python3',['highs_native.py',tmp+'.lp',tmp+'.json',String(TLX)],{maxBuffer:1<<26, env:benv}); last=JSON.parse(fs.readFileSync(tmp+'.json','utf8'));
     if (RESUME && last.Status==='Time limit reached' && fs.existsSync(tmp+'.basis.json')){ fs.mkdirSync(cdir,{recursive:true}); fs.renameSync(tmp+'.basis.json',cfp);
       console.log('stopped at the job deadline; basis kept for resume', key.slice(0,10)); process.exit(75); }
     if (last.Status==='Optimal'){ w.__jobSolves=(w.__jobSolves||0)+1; fs.mkdirSync(cdir,{recursive:true}); fs.renameSync(tmp+'.json',cf); try{ fs.unlinkSync(tmp+'.lp'); }catch(e){}
       if (WARM && fs.existsSync(tmp+'.basis.json')){ fs.renameSync(tmp+'.basis.json',cfb); w.__prevBasis=cfb; }
       if (RESUME){ try{ fs.unlinkSync(cfp); }catch(e){} } }
     else { fs.renameSync(tmp+'.lp', tmp+'.fail.lp'); console.log('kept the failed LP for diagnosis:', tmp+'.fail.lp'); } } }   // 7 Oct 2026: a failed solve keeps its LP (IIS)
   else { const highs=await newHighs(); last=highs.solve(liMinRows(gasMinRows(fixBuild(fix(lp)))),{time_limit:+(process.env.TL||900)}); }
   console.log('solved', last.Status, new Date().toISOString()); if (last.Status!=='Optimal') throw new Error('solve not optimal: '+last.Status); return last; };
 // COMMIT / PSE (6 Oct 2026): coal commitment and pumped-storage energy in the build LP; unset = FIXED defaults.
 w.eval(`applyState(PRESETS['Today 2026']); state.demandGrowthPct=${DEM}; bldSetHorizon(${+(process.env.HORIZON||2040)});`+(process.env.COMMIT!==undefined?` state.bldCoalCommit=${+process.env.COMMIT};`:'')+(process.env.IMP_END!==undefined?` state.importsEndYear=${+process.env.IMP_END};`:'')+(process.env.PSE!==undefined?` state.bldPsEnergy=${+process.env.PSE};`:'')+(process.env.GASFLOOR!==undefined?` if(!('bldGasFloorOn' in FIXED)) throw new Error('bldGasFloorOn missing'); state.bldGasFloorOn=${+process.env.GASFLOOR}; state.ccgtForceLoad=${+process.env.GASFLOOR};`:'')+(process.env.DISC!==undefined?` BLD_DISC=${+process.env.DISC};`:'')+(process.env.OCGT!==undefined?` state.bldOcgtOn=${+process.env.OCGT};`:'')+(process.env.OCGD!==undefined?` state.bldOcgdOn=${+process.env.OCGD}; ${process.env.OCGD_RATE!==undefined?'state.bldOcgdRateMW='+(+process.env.OCGD_RATE)+';':''} ${process.env.OCGD_FROM!==undefined?'state.bldOcgdFromYear='+(+process.env.OCGD_FROM)+';':''}`:'')+(process.env.LI_EH!==undefined?` state.bldLiEnergyHours=${+process.env.LI_EH};`:'')+(process.env.ADEQ_BASIS!==undefined?` state.bldAdequacyBasis=${JSON.stringify(process.env.ADEQ_BASIS)};`:'')+(process.env.TURB_CAP!==undefined?` state.bldTurbineCapMW=${+process.env.TURB_CAP};`:'')+(process.env.OCGT_COST!==undefined?` state.bldOcgtCostCase=${JSON.stringify(process.env.OCGT_COST)};`:'')+(process.env.NUC_FORCE!==undefined?` if(!('bldNuclearAdd' in FIXED)) throw new Error('bldNuclearAdd missing'); state.bldNuclearAdd=${JSON.stringify(Object.fromEntries(process.env.NUC_FORCE.split(',').map(q=>{ const [y,mw]=q.split(':'); if(!(+y>2000&&+mw>=0)) throw new Error('NUC_FORCE: '+q); return [y,+mw]; })))};`:'')+(process.env.GAS_PREM!==undefined?` if(!('bldGasFinPremium' in FIXED)) throw new Error('bldGasFinPremium missing'); state.bldGasFinPremium=${+process.env.GAS_PREM};`:'')+(process.env.PHES!==undefined?` state.bldPhesOn=${+process.env.PHES};`:'')+(process.env.PHES_H?` state.bldPhesHours=${+process.env.PHES_H};`:'')+(process.env.PHES_H2?` state.bldPhesHours2=${+process.env.PHES_H2};`:'')+(process.env.GAS_CAPEX?` if(!('ccgt' in BLD_COST)) throw new Error('BLD_COST.ccgt missing'); BLD_COST.ccgt.c2026=${+process.env.GAS_CAPEX};`:'')+(process.env.PHES_CAP?` state.bldPhesCap=${/^\[/.test(process.env.PHES_CAP)?process.env.PHES_CAP:JSON.stringify(process.env.PHES_CAP)}; bldPhesCumCapMW(state.bldPhesCap,2040);`:'')+(process.env.PHES_BASIS?` if(!('bldPhesCostBasis' in FIXED)) throw new Error('bldPhesCostBasis missing'); state.bldPhesCostBasis='${process.env.PHES_BASIS}';`:'')+(process.env.GAS_FUEL_R?` if(!('costCcgt' in state)) throw new Error('costCcgt missing'); state.costCcgt=${+process.env.GAS_FUEL_R};`:'')+(process.env.GAS_FOM_ADD?` if(!('ccgt' in BLD_FOM)) throw new Error('BLD_FOM.ccgt missing'); BLD_FOM.ccgt+=${+process.env.GAS_FOM_ADD}; BLD_FOM.ocgt+=${+process.env.GAS_FOM_ADD};`:''));
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
 // HSOC (9 Oct 2026): storage state of charge in the build LP (bldHourlySoc): 0 the daily balance of 07s and earlier,
 // 1 hourly (default from 2026-10-08c); to separate the storage fix from other changes.
 w.eval(`if(!('bldHourlySoc' in FIXED)) throw new Error('bldHourlySoc missing');`+(process.env.HSOC!==undefined?` state.bldHourlySoc=${+process.env.HSOC};`:''));
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
 // WIN_FROM=<run>_lp2040.json (11 Oct 2026, TODO 27): start from a recorded run's final stress windows (its periods,
 // with their coal availability) instead of none, so two settings can be compared on one window set. With MAXP=1 the
 // first solve is on exactly those windows; the same settings as the recorded run reproduce its final LP (same hash).
 if (process.env.WIN_FROM){ const WF=JSON.parse(fs.readFileSync(process.env.WIN_FROM,'utf8')).periods; if (!Array.isArray(WF) || !WF.length) throw new Error('WIN_FROM: no periods');
   w.eval(`{ const WF = ${JSON.stringify(WF)}; const _bw = bldBuildLP; bldBuildLP = function(o){ if (!window.__winFrom){ bldStressPeriods.length = 0; for (const p of WF) bldStressPeriods.push(p); window.__winFrom = WF.length; } return _bw(o); }; }`);
   console.log('windows from', process.env.WIN_FROM, WF.length); }
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
 // DEMAND (9 Oct 2026, user decision): central demand follows the IRP 2025 reference path year by year on the
 // measured 2026 base. 'irp_esrg' (default): public_data/esrg_irp_demand_ref.json (ESRG, CC BY 4.0), its
 // index_vs_2026 (domestic grid + distributed PV); 'rate:<pct>': a constant % a year (2.3 the IRP average, labelled
 // alternative; 1.39 NTCSA MTSAO moderate; 0 flat; 3.44 TDP high peak growth converted at constant load factor);
 // 'legacy': DEM to the horizon (5%, unsourced), the setting of every run before build 2026-10-09c.
 if (process.env.PHES_FIRST) throw new Error('PHES_FIRST was replaced by PHES_CAP (central, high or a [[year,MW],...] list), build 2026-10-09d');
 const DEMAND=process.env.DEMAND||'irp_esrg', YRS=JSON.parse(w.eval('JSON.stringify(BLD_YEARS)'));
 let DEM_INDEX=null;
 // GAS_CASE (build 2026-10-09f, TODO 14bo): a gas price case from public_data/gas_price_cases.json (low, central, brent100,
 // high, irp), applied by year to the optimiser and the engine check. Cases with a terminal take it as GAS_FOM_ADD
 // (R/kW-yr on new gas); 'irp' takes none.
 const GAS_CASE=process.env.GAS_CASE||null; let GAS_FUEL=null;
 if (GAS_CASE){ if (process.env.GAS_FUEL_R) throw new Error('GAS_CASE and GAS_FUEL_R are exclusive');
   const G=JSON.parse(fs.readFileSync(path.join(ROOT,'public_data','gas_price_cases.json'),'utf8')).cases[GAS_CASE];
   if (!G) throw new Error('gas_price_cases.json has no case '+GAS_CASE);
   if (!G.terminal && +(process.env.GAS_FOM_ADD||0)!==0) throw new Error('case '+GAS_CASE+' carries no terminal charge');
   if (G.terminal && process.env.GAS_FOM_ADD===undefined) throw new Error('case '+GAS_CASE+' needs GAS_FOM_ADD (R354-707/kW-yr)');
   GAS_FUEL=Object.fromEntries(YRS.map(y=>{ if(!G.years[y]) throw new Error('gas case '+GAS_CASE+' has no '+y); return [y, G.years[y].fuel_r_mwh]; }));
   console.log('gas', GAS_CASE, JSON.stringify(GAS_FUEL), 'terminal R/kW-yr', +(process.env.GAS_FOM_ADD||0)); }
 if (DEMAND==='irp_esrg'){ const J=JSON.parse(fs.readFileSync(path.join(ROOT,'public_data','esrg_irp_demand_ref.json'),'utf8')).years;
   DEM_INDEX=Object.fromEntries(YRS.map(y=>{ if(!J[y]) throw new Error('esrg_irp_demand_ref.json has no '+y); return [y, J[y].index_vs_2026]; })); }
 else if (DEMAND.startsWith('rate:')){ const r=+DEMAND.slice(5)/100; if(!isFinite(r)) throw new Error('DEMAND rate'); DEM_INDEX=Object.fromEntries(YRS.map(y=>[y, Math.pow(1+r, y-2026)])); }
 else if (DEMAND!=='legacy') throw new Error('DEMAND must be irp_esrg, rate:<pct> or legacy');
 if (DEM_INDEX && process.env.DEM) throw new Error('DEM applies only with DEMAND=legacy');
 if (DEM_INDEX) w.eval(`state.demandGrowthPct=${(DEM_INDEX[YRS[YRS.length-1]]-1)*100};`);   // the horizon year's level, for anything reading the slider
 console.log('demand', DEMAND, DEM_INDEX ? JSON.stringify(DEM_INDEX) : 'legacy +'+DEM+'% to the horizon');
 const t0=Date.now();
 const _dump=setInterval(()=>{ try{ fs.writeFileSync((process.env.OUT||'x')+'.progress', JSON.stringify(w.eval('JSON.stringify(bldStressLog.map(l=>({pass:l.pass,margin:l.margin,added:l.added,nAdded:Array.isArray(l.added)?l.added.length:l.added,fails:l.years.filter(q=>q.mean>q.limit).map(q=>[q.y,+q.mean.toFixed(2),+q.limit.toFixed(2)])})))'))); }catch(e){} }, 20000);
 await w.eval(`(async()=>{ const tg=1+(state.demandGrowthPct||0)/100;
   const opts={growth:${process.env.GROWTH_PA ? +process.env.GROWTH_PA : 'Math.pow(tg,1/Math.max(1,BLD_YEARS.length-1))-1'}, eaf:(state.coalEAFPct??FIXED.coalEAFPct)/100, rate:bldRates(), state:state, perYear:true, marginStepMW:1000, draws:2, stressDays:14, targetFrac:${+(process.env.TF||0.5)}, windowLeadYears:${+(process.env.LEAD||0)}, testEvery:1, windowsPerPass:${+(process.env.WPP||3)}, maxPasses:${+(process.env.MAXP||14)}${DEM_INDEX ? ', demandIndex:'+JSON.stringify(DEM_INDEX) : ''}${GAS_FUEL ? ', gasFuelR:'+JSON.stringify(GAS_FUEL) : ''}};
   window.__out=await bldStressLoop(opts, m=>{}); })()`);
 const out=w.__out, cols=out.res.Columns;
 const Y=JSON.parse(w.eval('JSON.stringify(BLD_YEARS)')), T=JSON.parse(w.eval('JSON.stringify(BLD_TECHS)'));
 const sched={}; for(const y of Y){ sched[y]={}; for(const t of T) sched[y][t]=Math.round((cols['b_'+t+'_'+y]||{Primal:0}).Primal);
   sched[y].battMWh=Math.round((cols['eb_batt_'+y]||{Primal:0}).Primal); sched[y].off=Math.round((cols['b_off_'+y]||{Primal:0}).Primal);
   sched[y].phes=Math.round((cols['b_phes_'+y]||{Primal:0}).Primal); sched[y].phel=Math.round((cols['b_phel_'+y]||{Primal:0}).Primal); sched[y].ocgt=Math.round((cols['b_ocgt_'+y]||{Primal:0}).Primal); sched[y].ocgd=Math.round((cols['b_ocgd_'+y]||{Primal:0}).Primal); sched[y].dslDecomMW=Math.round(w.eval(`bldPeakerDecomMW(${y},{...FIXED,...state},${JSON.stringify(Object.fromEntries(Object.entries(cols).filter(([c])=>c.startsWith('le_'))))})`)); sched[y].rp={}; for(const t of T.concat(['phes','phel'])){ const v=Math.round((cols['rp_'+t+'_'+y]||{Primal:0}).Primal); if(v) sched[y].rp[t]=v; } sched[y].earlyRetMW=Math.round((cols['rc_'+y]||{Primal:0}).Primal); sched[y].coalMW=Math.round(w.eval(`bldCoalMW(${y})`) - sched[y].earlyRetMW); }
 // DUMP (6 Oct 2026): the final LP's 2040 stress-window hours (d >= 1100) and the windows themselves,
 // for decomposing optimiser against engine supply line by line.
 if (process.env.DUMP!=='0'){ const DY=+(process.env.DUMPY||2040); const re=new RegExp('^([a-z]+)_'+DY+'_(\\d+)_(\\d+)$'); const lpv={};
   for (const [n,c] of Object.entries(cols)){ const m=n.match(re); if (m && +m[2]>=1100) lpv[n]=c.Primal; }
   const periods=JSON.parse(w.eval('JSON.stringify(bldStressPeriods)'));
   fs.writeFileSync(OUT.replace(/\.json$/,'')+'_lp'+DY+'.json', JSON.stringify({year:DY, periods, lpv})); }
 const peakerExt=Object.fromEntries(Object.entries(cols).filter(([c])=>c.startsWith('le_')).map(([c,v])=>[c.slice(3),Math.round(v.Primal||0)]));   // TODO 14as
 const build=Object.fromEntries(Object.entries(cols).filter(([n])=>/^(b_[a-z]+|eb_batt|rc|cc_[a-z]+)_20\d\d$/.test(n)).map(([n,c])=>[n,c.Primal]));   // exact, for FIX_FROM
 fs.writeFileSync(OUT, JSON.stringify({importsEndYear:+w.eval('state.importsEndYear ?? FIXED.importsEndYear')||null, demand:{spec:DEMAND, index:DEM_INDEX, legacyPct:DEM_INDEX?null:DEM}, gas:{case:GAS_CASE, fuelR:GAS_FUEL, fuelRFlat:process.env.GAS_FUEL_R?+process.env.GAS_FUEL_R:null, fomAdd:+(process.env.GAS_FOM_ADD||0)}, disc:+w.eval('BLD_DISC'), liEnergyHours:+w.eval('state.bldLiEnergyHours ?? FIXED.bldLiEnergyHours ?? 12'), adequacyBasis:w.eval('state.bldAdequacyBasis ?? FIXED.bldAdequacyBasis ?? "withCharging"'), nuclearAdd:JSON.parse(w.eval('JSON.stringify(state.bldNuclearAdd||null)')), gasForce:Object.keys(GAS_FORCE).length?GAS_FORCE:null, gasMin:Object.keys(GAS_MIN).length?GAS_MIN:null, gasMinCovers:Object.keys(GAS_MIN).length?(Object.keys(cols).some(c=>c.startsWith('b_ocgt_'))?'ccgt+ocgt':'ccgt'):null, liMin:LI_MIN.length?LI_MIN:null, ocgt:JSON.parse(w.eval(`JSON.stringify((()=>{ const S={...FIXED,...state}; return {lng:S.bldOcgtOn|0, diesel:S.bldOcgdOn|0, dieselRateMW:S.bldOcgdRateMW, dieselFrom:S.bldOcgdFromYear, turbineCapMW:S.bldTurbineCapMW, costCase:S.bldOcgtCostCase}; })())`)), gasFinPremium:+(+w.eval('bldAnnuityRate("ccgt")-BLD_DISC')).toFixed(6), liCap:LI_CAP, windCap:WIND_CAP||null, windCapFrom:WIND_CAP?WIND_CAP_FROM:null, liCapFrom:CAP_FROM, gasFloor:JSON.parse(w.eval(`(function(){ const S={...FIXED,...state}; return JSON.stringify({on:+(S.bldGasFloorOn||0), engine:+(S.ccgtForceLoad||0), pct:S.ccgtForceLoadPct, mw:S.ccgtForceLoadMW, from:S.ccgtForceFromYear, to:S.ccgtForceToYear}); })()`)), phes:JSON.parse(w.eval(`(function(){ const S={...FIXED,...state}; return JSON.stringify({on:+S.bldPhesOn, hours:S.bldPhesHours, hours2:S.bldPhesHours2||0, basis:S.bldPhesCostBasis, cap:S.bldPhesCap, rateMW:S.bldPhesRateMW}); })()`)), build, lpWindows:w.__lpWindows||null, mergeMismatch:w.__mergeMismatch||0, margin:out.margin, secs:(Date.now()-t0)/1000, verdict:out.verdict, log:out.log, sched, objective:out.res.ObjectiveValue, status:out.res.Status, peakerExt},null,1));
 console.log('done', out.verdict, ((Date.now()-t0)/1000).toFixed(0)+'s'); process.exit(0);
})();
