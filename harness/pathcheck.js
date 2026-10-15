const fs=require('fs'),path=require('path');const {JSDOM}=require('jsdom');
// Effective carbon tax by year on the legislated Phase 2 path (matches CARBON_AT in bldBuildLP); CFLAT overrides.
// Effective carbon price by year (14 Oct 2026): the app's own carbonTaxAt on the run's recorded path (carbonPath, carbonFull),
// so engine and optimiser price carbon alike; a run that records none gets 'cut2027', the path every run before 14 Oct 2026
// used. CFLAT overrides with a flat rate.
let CTAX_W = null;
const CTAX = y => process.env.CFLAT ? +process.env.CFLAT : CTAX_W(y);
// Gas output (TWh), running hours (hours above 1 MW) and capacity factor, mean over runs (6 Oct 2026).
// SEED_BASE: outage draws independent of the loop's own test (index.html bldAdequacyTest uses 20260816
// + k*104729 + y*7919); SEED_BASE=20260816 reproduces the 5 Oct 2026 runs, which reused the loop's draws.
const SEED_BASE=+(process.env.SEED_BASE||71830529);
// DRAWS (8 Oct 2026, user): outage draws per weather year. Unset: batches of 10 until the 95% interval of the mean shed is
// within +/-20% of the target (TF, default 0.5, x the 0.002% standard), at most KMAX (40, i.e. 480 runs); each year
// reports nRuns, draws, ci95Half, ciPctOfTarget and ciWithin20. K=<n>: exactly n draws, as before (the old default was 2).
// YEARS=<y,y>: check only those years.
// LNG storage check settings: one floating storage unit (LNG_M3, m3), energy per m3 (LNG_GJ_M3, GJ HHV),
// unusable heel (LNG_HEEL), CCGT efficiency (CCGT_EFF). 170,000 m3: Zululand Energy Terminal phase 1 (Engineering News,
// 5 Jun 2026). 53.37 GJ/t: IRP 2025 additional assumptions (gas fuel energy content). 0.45 t/m3 and no heel: unsourced.
const LNG_M3=+(process.env.LNG_M3||170000), LNG_GJ_M3=+(process.env.LNG_GJ_M3||0.45*53.37), LNG_HEEL=+(process.env.LNG_HEEL||0), CCGT_EFF=+(process.env.CCGT_EFF||0.52);
// DEM: demand growth to 2040, %, as the pathway; default 5 is the legacy, unsourced setting (RESULTS 9 Oct 2026).
const ROOT='testroot', P=JSON.parse(fs.readFileSync(process.env.IN||'pathway.json')), K=+(process.env.K||2), DEM=+(process.env.DEM||5);
(async()=>{
 const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
 const dom=new JSDOM(html,{runScripts:'dangerously',resources:'usable',pretendToBeVisual:true,url:'file://'+path.resolve(ROOT)+'/index.html',
  beforeParse(w){ w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>({addColorStop(){},data:[],width:0,measureText:()=>({width:10})})});
   const ch=()=>new Proxy(function(){return ch();},{get:()=>ch()}); w.L=new Proxy({},{get(){return function(){return ch();};}});
   w.onerror=()=>{}; Object.defineProperty(w.history,'replaceState',{value:()=>{},writable:true}); w.URL.createObjectURL=()=>'blob:x'; w.Worker=function(){this.postMessage=()=>{};};
   w.fetch=async(u)=>{try{const cl=String(u).split('?')[0].replace(/^file:.*?\/(?=nodal\/|profiles|config)/,'');const t=fs.readFileSync(path.join(path.resolve(ROOT),cl),'utf8');return{ok:true,json:async()=>JSON.parse(t),text:async()=>t};}catch(e){return{ok:false,json:async()=>{throw e},text:async()=>{throw e}};}};}});
 await new Promise(r=>setTimeout(r,6000)); const w=dom.window;
 w.eval(`applyState(PRESETS['Today 2026']);`); await w.eval('loadWeatherYears()');
 // GRID (7 Oct 2026, TODO 14ar): the same grid-cost settings as the pathway run.
 w.eval(`if(!('bldGridCost' in FIXED)) throw new Error('bldGridCost missing');`+(process.env.GRID!==undefined?` state.bldGridCost=${+process.env.GRID};`:'')+(process.env.GRID_BEYOND!==undefined?` state.bldGridSpurBeyond=${+process.env.GRID_BEYOND};`:'')+(process.env.GRID_BATTHALF!==undefined?` state.bldGridBattHalf=${+process.env.GRID_BATTHALF};`:''));
 const GRID_ON=+w.eval('(state.bldGridCost??FIXED.bldGridCost)|0')>0, rpCum={};
 // PEAK (TODO 14as): the same peaker settings as the pathway run; each year's diesel retired comes from the schedule.
 w.eval(`if(!('bldPeakerRet' in FIXED)) throw new Error('bldPeakerRet missing');`+(process.env.PEAK!==undefined?` state.bldPeakerRet=${+process.env.PEAK};`:'')+(process.env.PEAK_EXT!==undefined?` state.bldPeakerLifeExt=${+process.env.PEAK_EXT};`:'')+(process.env.PEAK_EXT_R!==undefined?` state.bldPeakerExtRkW=${+process.env.PEAK_EXT_R};`:''));
 const PEAK_ON=+w.eval('(state.bldPeakerRet??FIXED.bldPeakerRet)|0')>0;
 // BATT_CAPEX (7 Oct 2026, TODO 14ax): lithium capex at 2026, R/kW at 4 h, for the low case (8105, a hardware-only
 // basis, so it does not include connection). Read by engine and optimiser alike.
 if (process.env.BATT_CAPEX) w.eval(`if(!('batt' in BLD_COST)) throw new Error('BLD_COST.batt missing'); BLD_COST.batt.c2026=${+process.env.BATT_CAPEX}; BLD_COST.batt.connIncl=false;`);
 // PVTRK (7 Oct 2026, TODO 14aw): new utility solar on the tracking profile at tracker capex.
 w.eval(`if(!('bldPvTracking' in FIXED)) throw new Error('bldPvTracking missing');`+(process.env.PVTRK!==undefined?` state.bldPvTracking=${+process.env.PVTRK};`:''));
 // BATT_CASE (7 Oct 2026): lithium cost case, central (BW3 aged to January 2026), high (BW3 as bid) or low (global turnkey).
 w.eval(`if(!('bldBattCase' in FIXED)) throw new Error('bldBattCase missing');`+(process.env.BATT_CASE!==undefined?` state.bldBattCase=${JSON.stringify(process.env.BATT_CASE)};`:''));
 // WINDMOD / WIND_CASE (7 Oct 2026): new wind on the modern-turbine profile with bid capex (1, default) or the previous
 // R21,000 on the current profile (0); wind cost case central, bw6, high or low; WIND_CORR the new-wind correction, none, farms or
 // bw6; PV_CASE tracking solar capex, central or bw6. Runs from 15 Oct 2026 record all three, and the run's own values apply (below).
 w.eval(`if(!('bldWindModern' in FIXED)) throw new Error('bldWindModern missing');`+(process.env.WINDMOD!==undefined?` state.bldWindModern=${+process.env.WINDMOD};`:'')+(process.env.WIND_CASE!==undefined?` state.bldWindCase=${JSON.stringify(process.env.WIND_CASE)};`:'')+(process.env.WIND_CORR!==undefined?` state.bldWindCorr=${JSON.stringify(process.env.WIND_CORR)};`:'')+(process.env.PV_CASE!==undefined?` state.bldPvCase=${JSON.stringify(process.env.PV_CASE)};`:''));
 // COSTSET (7 Oct 2026): the same cost set as the pathway run; see pathway/costset.js.
 require('./pathway/costset.js')(w, process.env.COSTSET);
 // The pathway's lithium capex decline (BATT_DECL, 13 Oct 2026) when it recorded one, so the check prices lithium as the optimiser did.
 if (P.battDecl!=null) { if (process.env.COSTSET) throw new Error('BATT_DECL with COSTSET: the cost set replaces the decline'); const d=+P.battDecl; if (!(d>-0.5 && d<0.5)) throw new Error('BATT_DECL out of range: '+d); w.eval(`for (const k of ['batt','batt_high','batt_low']){ if(!BLD_COST[k] || !('decl' in BLD_COST[k])) throw new Error('BLD_COST.'+k+'.decl missing'); BLD_COST[k].decl=${d}; }`); }
 // Gas infrastructure sensitivity, TODO 14ak (6 Oct 2026): the same overrides as pathway_perfail.js.
 // From build 2026-10-09f the pathway records its gas settings (P.gas): they are applied here, by year for a GAS_CASE,
 // and passing GAS_FUEL_R or GAS_FOM_ADD as well is refused, so the check cannot price gas differently from the optimiser.
 // The pathway's discount rate (TODO 14be step 3), so the check annualises capital as the optimiser did.
 if (P.disc!=null) w.eval(`BLD_DISC=${+P.disc};`);
 // The pathway's gas finance premium (bldGasFinPremium), so new gas capital is annualised as the optimiser did.
 if (P.gasFinPremium) w.eval(`if(!('bldGasFinPremium' in FIXED)) throw new Error('bldGasFinPremium missing'); state.bldGasFinPremium=${+P.gasFinPremium};`);
 // The 51% gas floor (TODO 14be step 4): if the pathway ran with it, the engine check applies it too.
 if (P.gasFloor && P.gasFloor.engine) w.eval(`if(!('ccgtForceLoad' in FIXED)) throw new Error('ccgtForceLoad missing'); state.ccgtForceLoad=1;`);
 // Its size (GASFLOOR_MW, message 104): the pathway records the MW of new CCGT its engine floored; older runs recorded the default.
 if (P.gasFloor && P.gasFloor.engine && P.gasFloor.mw > 0) w.eval(`state.ccgtForceLoadMW=${+P.gasFloor.mw};`);
 const PG=P.gas||null;
 if (PG && (process.env.GAS_FUEL_R || process.env.GAS_FOM_ADD)) throw new Error('the pathway recorded its gas settings (P.gas); do not pass GAS_FUEL_R or GAS_FOM_ADD');
 const GFR=PG ? PG.fuelRFlat : (process.env.GAS_FUEL_R ? +process.env.GAS_FUEL_R : null), GFA=PG ? PG.fomAdd : +(process.env.GAS_FOM_ADD||0);
 if (GFR!=null) w.eval(`if(!('costCcgt' in state)) throw new Error('costCcgt missing'); state.costCcgt=${GFR};`);
 if (GFA) w.eval(`if(!('ccgt' in BLD_FOM)) throw new Error('BLD_FOM.ccgt missing'); BLD_FOM.ccgt+=${GFA}; BLD_FOM.ocgt+=${GFA};`);
 const Y=Object.keys(P.sched).map(Number); const cum={wind:0,pv:0,rooftop:0,batt:0,battMWh:0,vrfb:0,ironair:0,ccgt:0,off:0,phes:0,phel:0,ocgt:0,ocgd:0};
 // Open-cycle gas (build 2026-10-11f): the pathway's capex case, so the engine charges what the optimiser charged.
 if (P.ocgt && P.ocgt.costCase) w.eval(`state.bldOcgtCostCase=${JSON.stringify(P.ocgt.costCase)};`);
 // GAS_CAPEX (7 Oct 2026): CCGT capex at 2026, R/kW, for the IRP-capex sensitivity; read by engine and optimiser alike.
 if (process.env.GAS_CAPEX) w.eval(`if(!('ccgt' in BLD_COST)) throw new Error('BLD_COST.ccgt missing'); BLD_COST.ccgt.c2026=${+process.env.GAS_CAPEX};`);
 // Imports end year (TODO 14dv (6)): the pathway's own, so the engine runs without imports where the optimiser did.
 if (P.importsEndYear) w.eval(`state.importsEndYear=${+P.importsEndYear};`);
 // Imports flow and the flat demand block (user, 14 Oct 2026, message 72): the pathway's own, where it recorded them.
 if (P.importsMW != null) w.eval(`state.importsMW=${+P.importsMW};`);
 if (P.importsCF != null) w.eval(`state.importsCF=${+P.importsCF};`);
 const BLK = (P.demand && P.demand.block) ? P.demand.block : null;
 if (BLK) console.log('demand block from the pathway:', JSON.stringify(BLK));
 // Cape wind allowance (14 Oct 2026): the pathway's curtailment share; each year's MW from sched[y].cw, cumulated below.
 if (P.capeWind) { w.eval(`state.bldCapeCurtPct=${+P.capeWind.curtPct};`); console.log('Cape wind allowance from the pathway:', JSON.stringify(P.capeWind)); }
 let cwCum=0;
 // Carbon path (user, 14 Oct 2026): the pathway's own (carbonPath; carbonFull for s_carbonfull). CFLAT cannot be given with
 // carbonFull.
 { const cPath = P.carbonPath ?? 'cut2027';
   if (P.carbonFull && process.env.CFLAT) throw new Error('CFLAT with a run made at the full statutory carbon rate (carbonFull)');
   w.eval(`if(typeof carbonTaxAt!=='function') throw new Error('carbonTaxAt missing'); state.carbonAllowancePath=${JSON.stringify(cPath)}; state.carbonTaxFull=${P.carbonFull ? 1 : 0};`);
   CTAX_W = y => +w.eval(`carbonTaxAt(${y}, {...FIXED, ...state})`);
   console.log('carbon path', cPath + (P.carbonFull ? ', full statutory rate' : ''), [2026, 2027, 2030, 2040].map(y => y + ' R' + CTAX(y).toFixed(1)).join(', ')); }
 // Tracking solar (TODO 14aw; 14 Oct 2026): the pathway's own setting, so new utility solar runs on the profile the
 // optimiser built it on. A PVTRK given here as well must agree. Runs made before 14 Oct record none: PVTRK alone, as before.
 if (P.pvTracking != null){
   if (process.env.PVTRK !== undefined && +process.env.PVTRK !== +P.pvTracking) throw new Error('PVTRK '+process.env.PVTRK+' disagrees with the run\'s pvTracking '+P.pvTracking);
   w.eval(`state.bldPvTracking=${+P.pvTracking};`); console.log('pvTracking from the pathway:', +P.pvTracking); }
 // Wind correction, wind and solar capex cases (15 Oct 2026, message 125): the pathway's own, as for tracking. An env value
 // given as well must agree. Runs made before 15 Oct record none: the env values alone, and the defaults changed that day
 // (correction none, tariff-calibrated capex), so an older run needs WIND_CORR=farms WIND_CASE=bw6 PV_CASE=bw6 to be checked as built.
 for (const [k, env, st] of [['windCorr', 'WIND_CORR', 'bldWindCorr'], ['windCase', 'WIND_CASE', 'bldWindCase'], ['pvCase', 'PV_CASE', 'bldPvCase']]){
   if (P[k] == null) continue;
   if (process.env[env] !== undefined && process.env[env] !== P[k]) throw new Error(env+' '+process.env[env]+' disagrees with the run\'s '+k+' '+P[k]);
   w.eval(`state.${st}=${JSON.stringify(P[k])};`); console.log(k+' from the pathway:', P[k]); }
 const rows=[];
 for (const y of Y){ for (const k of Object.keys(cum)) cum[k]+=P.sched[y][k]||0; cwCum+=P.sched[y].cw||0;
   // YEARS=2036,2037 (8 Oct 2026, TODO 14bk): check only these years; builds of the skipped years still accumulate.
   if (process.env.YEARS && !process.env.YEARS.split(',').map(Number).includes(y)) continue;
   // The pathway's own demand path when it recorded one (DEMAND, 9 Oct 2026); else the legacy DEM to 2040.
   const frac=(y-2026)/(2040-2026), dg=(P.demand && P.demand.index) ? (P.demand.index[y]-1)*100 : (Math.pow(1+DEM/100,frac)-1)*100;
   const over={...(PG && PG.fuelR ? {costCcgt:PG.fuelR[y]} : {}),newWindMW:cum.wind,newPvMW:cum.pv,newRooftopMW:cum.rooftop,newBattMW:cum.batt,newBattHours:cum.batt>0?Math.max(1,Math.min(20,cum.battMWh/cum.batt)):4,
     newVrfbMW:cum.vrfb,newIronAirMW:cum.ironair,newCcgtMW:cum.ccgt,newOcgtMW:cum.ocgt,newOcgdMW:cum.ocgd,newOffshoreMW:cum.off,newNuclearMW:+w.eval(`bldNuclearAddedMW({bldNuclearAdd:${JSON.stringify(P.nuclearAdd||null)}},${y})`),newPsMW:cum.phes,newPsHours:+(process.env.PH||14),coalDecomMW:Math.max(0,Math.round(w.eval('FIXED.coalInstalledMW')-P.sched[y].coalMW)),
     demandGrowthPct:dg,demandBlockMW:BLK ? +w.eval(`bldDemandBlockMW({demandBlock:${JSON.stringify(BLK)}},${y})`) : 0,windCapeMW:cwCum,scenarioYear:y, carbonTaxRPerT: CTAX(y)};
   if (PEAK_ON){ if (P.sched[y].dslDecomMW===undefined) throw new Error('PEAK set but the schedule has no dslDecomMW'); over.dieselDecomMW=P.sched[y].dslDecomMW; }
   // ASTR reserve after 2030/31 (user, message 86): the growth term is measured from this run's own 2030 wind and solar fleet,
   // as the pathway's adequacy test measures it (index.html bldAstrVreRef).
   if (y > 2030){ let w30=0, p30=0; for (const yy of Object.keys(P.sched)) if (+yy <= 2030){ w30 += +P.sched[yy].wind||0; p30 += +P.sched[yy].pv||0; }
     over.reserveVreRefWindMW=Math.round(+w.eval('FIXED.windMW')+w30); over.reserveVreRefPvMW=Math.round(+w.eval('FIXED.pvUtilityMW')+p30); }
   // New pumped hydro built by the optimiser (6 Oct 2026): charge what the optimiser charged, not the engine's
   // fixed Tubatse 14-hour acapPs. PHES_BASIS names the basis (bldPhesCapexKW); PH the hours (bldPhesHours).
   // Two durations (PH and PH2): the engine has one new pumped-storage block, so power adds, energy adds (hours
   // power-weighted) and the per-kW charge is the power-weighted mean of the two optimiser charges.
   // From build 2026-10-09d the pathway records its pumped-hydro settings (P.phes), which take precedence over PH, PH2
   // and PHES_BASIS, so the check cannot price a different duration from the one the optimiser built.
   if (cum.phes + cum.phel > 0){ const PS=P.phes||{}, H=+(PS.hours??(process.env.PH||w.eval('FIXED.bldPhesHours'))), H2=+(PS.hours2??(process.env.PH2||0)), B=PS.basis??(process.env.PHES_BASIS||w.eval('FIXED.bldPhesCostBasis'));
     const ann=h=>+w.eval(`bldAnnuity(bldPhesCapexKW('${B}',${h}),60)+FIXED.bldPhesFomRkW`), P1=cum.phes, P2=cum.phel;
     over.newPsMW=P1+P2; over.newPsHours=(H*P1+H2*P2)/(P1+P2); over.newPsMaxMW=1e7; over.acapPs=(ann(H)*P1+(P2>0?ann(H2)*P2:0))/(P1+P2); }
   const batch=(k0,k1)=>JSON.parse(w.eval(`(function(){ const o=[]; for (const yy of bldWeatherYears.meta.years){ const nat=weatherYearNational(String(yy));
      for(let k=${k0};k<${k1};k++){ const st={...state,...${JSON.stringify(over)},outageSeed:${SEED_BASE}+k*104729+yy*7919};
       const x=simulate(st,{demand:PROFILES.demand,solar:nat.solar,wind:nat.wind,csp:PROFILES.csp,real:true});
       let dem=0, chg=0; for(let i=0;i<x.loadS.length;i++){ dem+=x.loadS[i]; chg+=(x.chargePsMW?x.chargePsMW[i]||0:0)+(x.chargeBattMW?x.chargeBattMW[i]||0:0); }
       o.push([x.E.unserved/1e3,x.systemCostR/1e9,x.E.curtailed/1e6,dem*0.00002/1e3,x.co2,x.E.coal/1e6,x.E.diesel/1e6,(x.systemCostR-x.btmCapexR)/1e9,(x.E.ccgt||0)/1e6,(()=>{let n=0;for(let i=0;i<x.stack.ccgt.length;i++) if(x.stack.ccgt[i]>1) n++; return n;})(),x.caps.ccgtCap,(()=>{const g=x.stack.ccgt,W=14*24;let s=0,m=0;for(let i=0;i<g.length;i++){s+=g[i];if(i>=W)s-=g[i-W];if(s>m)m=s;}return m/1e3;})(),x.avgCost,x.gridServed/1e6,(dem-chg)*0.00002/1e3,{fl:x.ccgtFloorFleetMWh||0,tg:x.ccgtFloorTargetMWh||0,un:x.ccgtFloorUnmetMWh||0,gas:x.E.ccgt||0}]); } }
      return JSON.stringify(o); })()`));
   // REPORTED SHED, 8 Oct 2026 (user): K unset draws in batches of 10 (120 runs) until the 95% interval of the mean shed
   // is within +/-20% of the target (TF x the 0.002% standard), at most 40 draws (480 runs). K set: exactly K draws.
   // AVERAGE COST PER MWH SERVED (user, 11 Oct 2026): the engine's avgCost (grid cost, rooftop capex and the shed
   // penalty excluded, export revenue netted, as the app) over its gridServed, served-weighted across runs.
   const TFR=+(process.env.TF||0.5), KMAX=+(process.env.KMAX||40), KSTEP=10;
   const agg=(o)=>{      const n=o.length,m=i=>o.reduce((a,b)=>a+b[i],0)/n; return ({seMean:n>1?Math.sqrt(o.reduce((a,b)=>a+(b[0]-m(0))**2,0)/(n-1)/n):null,nRuns:n,mean:m(0),worst:Math.max(...o.map(a=>a[0])),cost:m(1),curt:m(2),std:m(3),co2:m(4),coal:m(5),diesel:m(6),gridCost:m(7),gasTWh:m(8),gasHours:m(9),gasCF:m(10)>0?m(8)*1e6/(m(10)*8760):0,gas14dMaxGWh:Math.max(...o.map(a=>a[11])),
     stdCust:m(14),servedTWh:m(13),avgCostRMWh:o.reduce((a,b)=>a+b[12]*b[13],0)/o.reduce((a,b)=>a+b[13],0)}); };
   let o=[], kk=0, r=null;
   for(;;){ const k1=process.env.K?K:Math.min(KMAX,kk+KSTEP); o=o.concat(batch(kk,k1)); kk=k1; r=agg(o);
     // STANDARD ON CUSTOMER DEMAND (user, 12 Oct 2026): from these runs the target is TFR x 0.002% of demand without
     // storage charging (loadS less pumped-storage and battery charging); the old basis, which counted charging as
     // demand, is kept as targetOld. A year above 90% of its target is flagged marginal.
     r.targetOld=TFR*r.std; r.target=TFR*r.stdCust; r.marginal=r.mean>0.9*r.target; r.ci95Half=1.96*(r.seMean||0); r.ciPctOfTarget=r.target>0?100*r.ci95Half/r.target:null; r.ciWithin20=r.ci95Half<=0.2*r.target; r.draws=kk;
     if (process.env.K || r.ciWithin20 || kk>=KMAX) break; }
   // GAS FLOOR OUTPUT (user, 13 Oct 2026, s_irpgas): gas output counted toward the engine's annual floor (the first
   // min(CCGT standing, ccgtForceLoadMW) MW of each hour's gas output, which includes OCGT on LNG and gas burnt to charge
   // storage), the floor's target and shortfall, and all gas output, TWh, mean over the runs. Zero when no floor applies.
   { const L=o[0].length-1, m=k=>o.reduce((a,b)=>a+(+b[L][k]||0),0)/o.length/1e6;
     r.gasFloorTWh={floored:m('fl'), target:m('tg'), unmet:m('un'), totalGas:m('gas'), unfloored:m('gas')-m('fl')}; }
   // LNG STORAGE ADEQUACY (user, 6 Oct 2026; LNG=1). Gas burned in each of the loop's own stress windows
   // that bind this model year (fromYear <= y), re-dispatched on that window's weather year and outage seed,
   // and in the worst 14 days of the runs above, against the energy one floating storage unit holds.
   // Fuel = electricity x 3.6 / CCGT_EFF (0.52 HHV, the efficiency costCcgt is derived with).
   if (process.env.LNG==='1' && over.newCcgtMW>0){
     const wins=[].concat(...P.log.map(l=>Array.isArray(l.added)?l.added:[])).filter(a=>a.seed!==undefined && (a.fromYear??a.forModelYear)<=y);
     r.lng=JSON.parse(w.eval(`(function(){ const W=${JSON.stringify(wins)}, out=[];
       for (const a of W){ const nat=weatherYearNational(String(a.year)); const st={...state,...${JSON.stringify(over)},outageSeed:a.seed};
         const x=simulate(st,{demand:PROFILES.demand,solar:nat.solar,wind:nat.wind,csp:PROFILES.csp,real:true});
         let g=0, sh=0; for(let h=a.start*24; h<(a.start+a.n)*24 && h<x.stack.ccgt.length; h++){ g+=x.stack.ccgt[h]; sh+=x.stack.unserved[h]; }
         out.push({wy:a.year, start:a.start, n:a.n, gasGWh:g/1e3, shedGWh:sh/1e3}); }
       return JSON.stringify(out); })()`));
     const fuelPerGWh=3.6/CCGT_EFF/1e3, cargoPJ=LNG_M3*LNG_GJ_M3*(1-LNG_HEEL)/1e6;   // PJ fuel per GWh(e); PJ per cargo
     for (const z of r.lng){ z.fuelPJ=z.gasGWh*fuelPerGWh; z.cargoes=z.fuelPJ/cargoPJ; }
     r.lngCargoPJ=cargoPJ; r.lng14dMaxCargoes=r.gas14dMaxGWh*fuelPerGWh/cargoPJ;
     r.lngWindowsOver=r.lng.filter(z=>z.cargoes>1).length; r.lngWorstCargoes=Math.max(0,...r.lng.map(z=>z.cargoes));
   }
   // OPTIMISER GRID COST (TODO 14ar): when GRID is set, the engine's own transmission charge on new wind, solar and
   // offshore (txChargeFor) is replaced by what the optimiser charged every technology, less repurposed MW.
   // costGrid is the system cost on that basis; cost stays the engine's own figure.
   if (GRID_ON){
     for (const [t,v] of Object.entries(P.sched[y].rp||{})) rpCum[t]=(rpCum[t]||0)+v;
     const ga=JSON.parse(w.eval(`JSON.stringify(Object.fromEntries(['wind','pv','batt','vrfb','ironair','ccgt','offshore','phes','phel','ocgt','ocgd'].map(t=>[t,bldGridAnn(t,{...FIXED,...state})])))`));
     const built={wind:cum.wind,pv:cum.pv,batt:cum.batt,vrfb:cum.vrfb,ironair:cum.ironair,ccgt:cum.ccgt,offshore:cum.off,phes:cum.phes,phel:cum.phel,ocgt:cum.ocgt,ocgd:cum.ocgd};
     let g=0; for (const t of Object.keys(built)) g+=Math.max(0,built[t]-(rpCum[t]||0))*ga[t]*1000;
     // Wind on the Cape curtailment allowance pays no integration charge (14 Oct 2026).
     g-=Math.min(cwCum, Math.max(0,cum.wind-(rpCum.wind||0)))*(+w.eval('state.txRPerKWyr ?? FIXED.txRPerKWyr'))*1000;
     const engTx=+w.eval(`txChargeFor(${cum.wind},${cum.pv},${cum.off},{...FIXED,...state,...${JSON.stringify(over)}})`);
     r.gridOptBn=g/1e9; r.engTxBn=engTx/1e9; r.costGrid=r.cost-r.engTxBn+r.gridOptBn; r.rpCumMW=Object.values(rpCum).reduce((a,b)=>a+b,0);
   }
   // Life-extension capex (TODO 14as): the engine charges fixed O&M on what is online; each extended plant's
   // annuity (extension capex over its end-of-life year to the IRP's date) is added here from that year on.
   if (PEAK_ON){
     const pk=JSON.parse(w.eval(`JSON.stringify(BLD_PEAKERS.map(p=>({id:p.id,eol:p.eol,irp:p.irp,on:bldPeakerExtOn(p,{...FIXED,...state},${y})})))`));
     const R=+w.eval('state.bldPeakerExtRkW??FIXED.bldPeakerExtRkW'); let e=0, kept=0;
     for (const p of pk) if (p.on){ const mw=(P.peakerExt||{})[p.id]||0; kept+=mw; e+=mw*1000*w.eval(`bldAnnuity(${R},${p.irp-p.eol})`); }
     r.peakerKeptMW=kept; r.peakerExtBn=e/1e9; r.dieselOnMW=+w.eval(`dieselAvailMW({...FIXED,...state,dieselDecomMW:${over.dieselDecomMW}})`);
   }
   // COMPLY (15 Oct 2026): the coal emissions compliance charge the pathway run recorded for this year (on the in-scope coal it kept),
   // reported beside the engine's cost; cost itself is unchanged. Only when the run carries one.
   if (P.comply && P.comply.years && P.comply.years[y]){ r.complyBn=P.comply.years[y].keptChargeR/1e9; r.costComply=r.cost+r.complyBn; }
   rows.push({y,...over,...r}); console.log(y, JSON.stringify(r));
 }
 fs.writeFileSync(process.env.OUTC||'pathcheck.json', JSON.stringify(rows)); process.exit(0);
})();
