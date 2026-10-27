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
// STALL=<share> with STALL_FROM=<pass> (user, 14 Oct 2026, c5's stopping rule): from that pass on, stop when a pass cuts the
// worst year's shed above target by less than that share of the pass before (c5: STALL=0.1, STALL_FROM=4, with MAXP=6).
// The verdict records what stopped the run: adequate, stall stop or pass limit reached. Unset: no change.
const STALL=process.env.STALL!==undefined?+process.env.STALL:0, STALL_FROM=process.env.STALL_FROM!==undefined?+process.env.STALL_FROM:4;
if (!(STALL>=0 && STALL<1) || !(Number.isInteger(STALL_FROM) && STALL_FROM>=2)) throw new Error('STALL must be 0-1 and STALL_FROM a pass of 2 or more');
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
// GAS_CUM (user, 14 Oct 2026, message 104: s_detgas): "year:MW,...", a cumulative floor on new gas, at least that many MW of
// new CCGT plus OCGT on LNG built by that year (gcum_<y> rows over every gas build year up to it), e.g. the Energy Storage and
// Gas determination's 5,000 MW spread over 2032-37. OCGT on diesel stays outside it, as with GAS_MIN. Where the LP offers no
// OCGT on LNG the floor covers CCGT alone, and the log says so. Recorded in the output (gasCum, gasCumCovers). Unset: no change.
const GAS_CUM=byYear('GAS_CUM'); let GAS_CUM_COVERS=null;
const gasCumRows=lp=>{ if (!Object.keys(GAS_CUM).length) return lp; const i=lp.indexOf('\nBounds\n'); if (i<0) throw new Error('GAS_CUM: no Bounds');
  const yrs=t=>[...new Set((lp.match(new RegExp('\\bb_'+t+'_(\\d{4})\\b','g'))||[]).map(x=>+x.slice(-4)))].sort();
  const cc=yrs('ccgt'), oc=yrs('ocgt'); if (!cc.length) throw new Error('GAS_CUM: no CCGT build years');
  const cov=oc.length?'ccgt+ocgt':'ccgt'; if (GAS_CUM_COVERS!==cov){ GAS_CUM_COVERS=cov; console.log('GAS_CUM covers '+(oc.length?'CCGT and OCGT on LNG':'CCGT only (no OCGT on LNG in the LP)')); }
  const rows=Object.entries(GAS_CUM).map(([y,mw])=>{ const terms=[...cc.filter(v=>v<=+y).map(v=>'b_ccgt_'+v), ...oc.filter(v=>v<=+y).map(v=>'b_ocgt_'+v)];
    if (!terms.length) throw new Error('GAS_CUM: no gas build years by '+y); return ' gcum_'+y+': '+terms.join(' + ')+' >= '+mw; });
  return lp.slice(0,i)+'\n'+rows.join('\n')+lp.slice(i); };
// LI_MIN (12 Oct 2026, user: committed procurement): "year:MW:MWh", at least that much new lithium power and energy built
// by that year (limin_/lemin_ rows), e.g. 2030:4600:18400 for the 4,600 MW of battery storage in the section 34
// determination at an assumed 4 hours (judgement). Not additive: it is a floor on the optimiser's own build.
const LI_MIN=(process.env.LI_MIN||'').split(',').filter(Boolean).map(q=>{ const [y,mw,mwh]=q.split(':').map(Number); if(!(y>2000&&mw>=0&&mwh>=0)) throw new Error('LI_MIN: '+q); return {y,mw,mwh}; });
const liMinRows0=lp=>{ if (!LI_MIN.length) return lp; const i=lp.indexOf('\nBounds\n'); if (i<0) throw new Error('LI_MIN: no Bounds');
  const yrs=[...new Set((lp.match(/\bb_batt_(\d{4})\b/g)||[]).map(t=>+t.slice(-4)))].sort();
  const rows=LI_MIN.map(q=>{ const ys=yrs.filter(y=>y<=q.y); if(!ys.length) throw new Error('LI_MIN: no lithium years by '+q.y);
    return ' limin_'+q.y+': '+ys.map(y=>'b_batt_'+y).join(' + ')+' >= '+q.mw+'\n lemin_'+q.y+': '+ys.map(y=>'eb_batt_'+y).join(' + ')+' >= '+q.mwh; });
  return lp.slice(0,i)+'\n'+rows.join('\n')+lp.slice(i); };
// STOR_CUM (user, 17 Oct 2026, message 185 (3)): "year:MW,...", a cap on cumulative new battery storage (lithium, vanadium flow
// and iron-air together) built by that year (stcum_ rows), never below the year's committed lithium floor (LI_MIN). Used for
// s_be6 on IRP 2025 Table 1's storage column, Eskom BESS included. Unset: no rows, every LP as before.
const STOR_CUM=(process.env.STOR_CUM||'').split(',').filter(Boolean).map(q=>{ const [y,mw]=q.split(':').map(Number); if(!(y>2000&&mw>=0)) throw new Error('STOR_CUM: '+q); return {y,mw}; });
const storCumRows=lp=>{ if (!STOR_CUM.length) return lp; const i=lp.indexOf('\nBounds\n'); if (i<0) throw new Error('STOR_CUM: no Bounds');
  const yrsOf=t=>[...new Set((lp.match(new RegExp('\\bb_'+t+'_(\\d{4})\\b','g'))||[]).map(x=>+x.slice(-4)))].sort((a,b)=>a-b);
  const rows=STOR_CUM.map(q=>{ const terms=['batt','vrfb','ironair'].flatMap(t=>yrsOf(t).filter(y=>y<=q.y).map(y=>'b_'+t+'_'+y)); if(!terms.length) throw new Error('STOR_CUM: no storage years by '+q.y);
    const floor=Math.max(0,...LI_MIN.filter(f=>f.y<=q.y).map(f=>f.mw)); return ' stcum_'+q.y+': '+terms.join(' + ')+' <= '+Math.max(q.mw,floor); });
  return lp.slice(0,i)+'\n'+rows.join('\n')+lp.slice(i); };
const liMinRows=lp=>storCumRows(minBuildRows(liMinRows0(lp)));   // MIN_BUILD and STOR_CUM rows ride with LI_MIN's
const IA_CAP=process.env.IA_CAP?+process.env.IA_CAP:0, LI_CAP=process.env.LI_CAP!==undefined?+process.env.LI_CAP:3000, CAP_FROM=+(process.env.CAP_FROM||2028), WIND_CAP=process.env.WIND_CAP?+process.env.WIND_CAP:0, WIND_CAP_FROM=+(process.env.WIND_CAP_FROM||process.env.CAP_FROM||2028), LDES_NOCAP=process.env.LDES_NOCAP==='1';
// DEM: demand growth to the horizon year, %. Default 5 is the LEGACY, UNSOURCED setting inherited from the transition
// presets (a judgement, not a forecast; RESULTS 9 Oct 2026); label runs on it "demand +5% (legacy, unsourced)".
// IMP_END (user, 13 Oct 2026, TODO 14dv (6)): regional imports end after this year (importsEndYear, FIXED); 2030 for the
// no-imports-after-2030 sensitivity. Unset keeps the page's default (from build 2026-10-23a, c6 PR B: 2030); IMP_END=0 keeps imports
// in every year (s_imp). The run records the year it used, 0 included.
if (process.env.IMP_END!==undefined && !(+process.env.IMP_END===0 || (+process.env.IMP_END>=2026 && +process.env.IMP_END<=2050))) throw new Error('IMP_END: '+process.env.IMP_END);
// GAS_LIFT=1 (user, 13 Oct 2026, s_irpgas): where a year's forced (GAS_FORCE) or minimum (GAS_MIN) new gas is above the
// LNG gas cap (gascap_<y>) or the turbine cap (tcap_<y>), that row's limit is raised to the forced or minimum amount, in
// that year only (not beyond it); each lifted row is logged and recorded in the output (gasLift). Unset: no change.
// GASFLOOR_VINT=<y1>-<y2> (user, 13 Oct 2026): with GASFLOOR=1, the optimiser's annual gas floor (gasfloor_<y>) covers only
// new CCGT built in those years (2029-2030: the 6 GW forced there), not later CCGT. The engine floors min(CCGT standing,
// ccgtForceLoadMW 6,000 MW) already. Unset: the floor covers all new CCGT, as before.
// PV_CAP_YR (user, 13 Oct 2026, s_pvirp): "year:MW,...", new utility solar at most that many MW in each year named, in place
// of the default limit (2,500 MW a year rising 7% a year); years not named unchanged.
// ROOF_MW (user, 13 Oct 2026, s_roof2): new rooftop solar fixed at that many MW a year from 2027 (default 1,200).
// TCAP_YR (user, 13 Oct 2026, s_irpgas): "year:MW,...", the turbine cap (tcap_<y>: new CCGT + OCGT on LNG + diesel
// open-cycle) set to that many MW in each year named, after GAS_LIFT (2029-2030: 4,000 = the forced 3,000 MW of CCGT plus
// diesel open-cycle's usual 1,000 MW). Each change is logged and recorded in the output (tcapYr). Unset: no change.
// GAS_COMMIT (user, 26 Oct 2026, message 386 (a), s_gascommit): a committed gas round forced into the build, "tech:year:MW,...",
// tech ccgt (combined cycle on LNG), ocgt (open-cycle on LNG, needs OCGT=1) or ocgd (open-cycle on diesel, needs OCGD=1): at
// least that many MW of that technology built in that year (b_<tech>_<year>), the rest of the build re-optimised around it; the
// optimiser may add more. Where the commitment is above that year's build limit, LNG gas cap (gascap_<y>, CCGT and OCGT on LNG)
// or turbine cap (tcap_<y>), that limit is raised to the commitment in that year only; each raise is logged and recorded
// (gasCommitLift). Combined cycle on diesel is not a technology in the model. Recorded in the output (gasCommit). Unset: no change.
const GAS_COMMIT=(process.env.GAS_COMMIT||'').split(',').filter(Boolean).map(q=>{ const [t,y,mw]=q.split(':');
  if (!(['ccgt','ocgt','ocgd'].includes(t) && Number.isInteger(+y) && +y>2000 && +mw>0)) throw new Error('GAS_COMMIT: '+q+' (tech ccgt, ocgt or ocgd)'); return {t,y:+y,mw:+mw}; });
const GC_LIFT=new Set();
const gasCommit=lp=>{ if (!GAS_COMMIT.length) return lp; let out=lp; const lng={}, tur={};
  for (const q of GAS_COMMIT){ const re=new RegExp('^ ([0-9.]+) <= (b_'+q.t+'_'+q.y+') <= ([0-9.]+)$','m'), m=out.match(re);
    if (!m) throw new Error('GAS_COMMIT: no b_'+q.t+'_'+q.y+' in the LP'+(q.t==='ccgt'?'':' (open-cycle needs OCGT=1 or OCGD=1)'));
    const hi=Math.max(+m[3],q.mw); out=out.replace(re,' '+Math.max(+m[1],q.mw)+' <= $2 <= '+hi); if (hi>+m[3]) GC_LIFT.add(m[2]+': '+m[3]+' -> '+hi);
    if (q.t!=='ocgd') lng[q.y]=(lng[q.y]||0)+q.mw; tur[q.y]=(tur[q.y]||0)+q.mw; }
  for (const [row,need] of [['gascap',lng],['tcap',tur]]) for (const [y,mw] of Object.entries(need)){
    const re=new RegExp('^ ('+row+'_'+y+'): (.*) <= ([0-9.]+)$','m'), m=out.match(re);
    if (m && mw>+m[3]+1e-9){ out=out.replace(re,' $1: $2 <= '+mw); GC_LIFT.add(row+'_'+y+': '+m[3]+' -> '+mw); } }
  return out; };
// FLEET_2026 (user, 26 Oct 2026, message 391 (a), c6a): the existing fleet in 2026 counted for its share of the year in service,
// "key:deltaMW,...", keys windMW, pvUtilityMW, rooftopMW or hybridMW, e.g. "windMW:-187,pvUtilityMW:-115" (private H1 2026 plants from their
// commercial operation, REIPPPP plants from January-February; RESULTS 'c6's 2026 fleet, plant by plant'). Recorded in the output
// (fleet2026); pathcheck.js applies it to scenario year 2026 only. Not applied in the build LP: its 2026 decisions are the committed
// floors (MIN_BUILD, LI_MIN). Later years run every plant all year. Unset: no change.
const FLEET_2026=(process.env.FLEET_2026||'').split(',').filter(Boolean).reduce((o,q)=>{ const [k,d]=q.split(':');
  if (!['windMW','pvUtilityMW','rooftopMW','hybridMW'].includes(k) || !isFinite(+d)) throw new Error('FLEET_2026: '+q); o[k]=+d; return o; },{});
if (process.env.GAS_LIFT!==undefined && !['0','1'].includes(process.env.GAS_LIFT)) throw new Error('GAS_LIFT must be 0 or 1');
const GAS_LIFT=process.env.GAS_LIFT==='1', LIFTED=new Set();
// GASFLOOR_MW=<MW> (user, 14 Oct 2026, message 104: s_detgas): with GASFLOOR=1, the engine floors at most that many MW of new
// CCGT (ccgtForceLoadMW; default 6,000, IRP 2025's 6 GW), so the engine and the optimiser's vintage floor (GASFLOOR_VINT) cover
// the same plant; s_detgas: 3000. Recorded in the output (gasFloor.mw) and applied by pathcheck.js. Unset: no change.
if (process.env.GASFLOOR_MW!==undefined && (!(+process.env.GASFLOOR_MW>0) || process.env.GASFLOOR!=='1')) throw new Error('GASFLOOR_MW needs GASFLOOR=1 and a positive MW');
const GF_VINT=(()=>{ const v=process.env.GASFLOOR_VINT; if (!v) return null; const [a,b]=v.split('-').map(Number);
  if (!(a>2000) || (b!==undefined && !(b>=a))) throw new Error('GASFLOOR_VINT: '+v); if (process.env.GASFLOOR!=='1') throw new Error('GASFLOOR_VINT needs GASFLOOR=1'); return [a,b||a]; })();
const PV_CAP_YR=byYear('PV_CAP_YR');
const TCAP_YR=byYear('TCAP_YR'), TCAPSET=new Set();
if (process.env.ROOF_MW!==undefined && !(+process.env.ROOF_MW>=0)) throw new Error('ROOF_MW: '+process.env.ROOF_MW);
// DEM_BLOCK (user, 14 Oct 2026, message 72): a flat demand block, MW added to every hour after growth, as start-year:MW pairs,
// each holding until the next (FIXED.demandBlockMW, bldDemandBlockMW). c5b: 2027:930 (the ferrochrome smelters' return);
// the Glencore-Merafe-ends sensitivity steps it down from 2029. Recorded as demand.block.
const DEM_BLOCK=process.env.DEM_BLOCK ? Object.fromEntries(process.env.DEM_BLOCK.split(',').map(q=>{ const [y,mw]=q.split(':'); if(!(+y>=2026&&+y<=2050&&+mw>=0&&mw!==undefined&&mw!=='')) throw new Error('DEM_BLOCK: '+q); return [+y,+mw]; })) : null;
// IMP_AVG_MW (user, 14 Oct 2026, message 72): the average imported flow, MW; sets importsCF = IMP_AVG_MW / importsMW so the
// contract capacity (importsMW) stays as it is. c5b: 1066, the measured April-August 2026 mean (ESK19679, local; a single
// calibration constant). Recorded as importsMW and importsCF. From build 2026-10-19d (message 234 (1)) the page's default is
// that mean (nodal_engine.js IMPORTS_AVG_MW, read here through FIXED.importsCF), so unset runs on it; set it for a sensitivity.
if (process.env.IMP_AVG_MW!==undefined && !(+process.env.IMP_AVG_MW>0)) throw new Error('IMP_AVG_MW: '+process.env.IMP_AVG_MW);
// CAPE_WIND (user, 14 Oct 2026, messages 68 and 71): "MW[:pct]", new wind on the Cape curtailment allowance (FIXED.bldCapeWindMW,
// bldCapeCurtPct; c5b 1580:4, s_cape10 3470:10). Recorded as capeWind; each year's MW on it as sched[y].cw.
const CAPE=process.env.CAPE_WIND ? (()=>{ const [mw,pc]=process.env.CAPE_WIND.split(':'); if(!(+mw>=0&&(pc===undefined||+pc>=0))) throw new Error('CAPE_WIND: '+process.env.CAPE_WIND); return {mw:+mw, curtPct:pc===undefined?null:+pc}; })() : null;
// RP_EXCL (user, 14 Oct 2026, message 74): technologies barred from connections freed by retired coal (FIXED.bldRpExclude),
// comma separated; c5b: wind. Recorded as rpExclude.
const RP_EXCL=process.env.RP_EXCL ? process.env.RP_EXCL.split(',').filter(Boolean) : null;
if (RP_EXCL && RP_EXCL.some(t=>!/^[a-z]+$/.test(t))) throw new Error('RP_EXCL: '+process.env.RP_EXCL);
// MIN_BUILD (user, 14 Oct 2026, message 74: committed projects): "tech:year:MW", at least that much new wind or utility solar
// built by that year (mbmin_ rows), a floor on the optimiser's own build, as LI_MIN is for lithium. Recorded as minBuild.
const MIN_BUILD=(process.env.MIN_BUILD||'').split(',').filter(Boolean).map(q=>{ const [t,y,mw]=q.split(':'); if(!(['wind','pv'].includes(t)&&+y>2000&&+mw>=0)) throw new Error('MIN_BUILD: '+q); return {t,y:+y,mw:+mw}; });
const minBuildRows=lp=>{ if (!MIN_BUILD.length) return lp; const i=lp.indexOf('\nBounds\n'); if (i<0) throw new Error('MIN_BUILD: no Bounds');
  const rows=MIN_BUILD.map(q=>{ const ys=[...new Set((lp.match(new RegExp('\\bb_'+q.t+'_(\\d{4})\\b','g'))||[]).map(x=>+x.slice(-4)))].sort().filter(y=>y<=q.y);
    if(!ys.length) throw new Error('MIN_BUILD: no '+q.t+' years by '+q.y);
    return ' mbmin_'+q.t+'_'+q.y+': '+ys.map(y=>'b_'+q.t+'_'+y).join(' + ')+' >= '+q.mw; });
  return lp.slice(0,i)+'\n'+rows.join('\n')+lp.slice(i); };
const gasLift=lp=>{ if (!GAS_LIFT) return lp; const need={};
  for (const [y,mw] of Object.entries(GAS_FORCE)) need[y]=Math.max(need[y]||0,mw);
  for (const [y,mw] of Object.entries(GAS_MIN)) need[y]=Math.max(need[y]||0,mw);
  let out=lp; for (const [y,mw] of Object.entries(need)) for (const row of ['gascap','tcap']){
    const re=new RegExp('^ ('+row+'_'+y+'): (.*) <= ([0-9.]+)$','m'), m=out.match(re);
    if (!m){ if (row==='gascap') throw new Error('GAS_LIFT: no gascap_'+y); continue; }
    if (mw > +m[3]+1e-9){ out=out.replace(re,' $1: $2 <= '+mw); LIFTED.add(row+'_'+y+': '+m[3]+' -> '+mw); } }
  return out; };
const tcapYr=lp=>{ if (!Object.keys(TCAP_YR).length) return lp; let out=lp;
  for (const [y,mw] of Object.entries(TCAP_YR)){ const re=new RegExp('^ (tcap_'+y+'): (.*) <= ([0-9.]+)$','m'), m=out.match(re);
    if (!m) throw new Error('TCAP_YR: no tcap_'+y); if (mw < (GAS_FORCE[y]||0)) throw new Error('TCAP_YR: tcap_'+y+' '+mw+' below GAS_FORCE '+GAS_FORCE[y]);
    out=out.replace(re,' $1: $2 <= '+mw); TCAPSET.add('tcap_'+y+': '+m[3]+' -> '+mw); }
  return out; };
const gasFloorVint=lp=>{ if (!GF_VINT) return lp; let n=0;
  const out=lp.replace(/^ (gasfloor_\d{4}): (.*) >= 0$/gm,(m,nm,lhs)=>{ n++;
    const kept=lhs.replace(/ - [0-9.]+ b_ccgt_(\d{4})/g,(t,y)=>(+y>=GF_VINT[0] && +y<=GF_VINT[1]) ? t : '');
    if (!/ - [0-9.]+ b_ccgt_\d{4}/.test(kept)) throw new Error('GASFLOOR_VINT: '+nm+' keeps no CCGT term'); return ' '+nm+': '+kept+' >= 0'; });
  if (!n) throw new Error('GASFLOOR_VINT: no gasfloor rows'); return out; };
const pvCap=lp=>{ if (!Object.keys(PV_CAP_YR).length) return lp; let out=lp;
  for (const [y,mw] of Object.entries(PV_CAP_YR)){ const re=new RegExp('^ 0 <= b_pv_'+y+' <= ([0-9.]+)$','m');
    if (!re.test(out)) throw new Error('PV_CAP_YR: no b_pv_'+y+' bound'); out=out.replace(re,' 0 <= b_pv_'+y+' <= '+mw); }
  return out; };
let ROOF_STEP27=0; const ROOT='testroot', OUT=process.env.OUT||'pathway.json', GAS_FIRST=+(process.env.GAS_FIRST||2030), ROOF_PER_YR=process.env.ROOF_MW!==undefined?+process.env.ROOF_MW:1200, DEM=+(process.env.DEM||5);
(async()=>{
 const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
 const dom=new JSDOM(html,{runScripts:'dangerously',resources:'usable',pretendToBeVisual:true,url:'file://'+path.resolve(ROOT)+'/index.html',
  beforeParse(w){ w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>({addColorStop(){},data:[],width:0,measureText:()=>({width:10})})});
   const ch=()=>new Proxy(function(){return ch();},{get:()=>ch()}); w.L=new Proxy({},{get(){return function(){return ch();};}});
   w.onerror=()=>{}; Object.defineProperty(w.history,'replaceState',{value:()=>{},writable:true}); w.URL.createObjectURL=()=>'blob:x'; w.Worker=function(){this.postMessage=()=>{};};
   w.fetch=async(u)=>{try{const cl=String(u).split('?')[0].replace(/^file:.*?\/(?=nodal\/|profiles|config)/,'');const t=fs.readFileSync(path.join(path.resolve(ROOT),cl),'utf8');return{ok:true,json:async()=>JSON.parse(t),text:async()=>t};}catch(e){return{ok:false,json:async()=>{throw e},text:async()=>{throw e}};}};}});
 await new Promise(r=>setTimeout(r,6000)); const w=dom.window;
 // ROOF12=1 (messages 391 (b), 392 (c)): rooftop add-back on the twelve-year mean solar (pathway/roof12.js); recorded as roofAddback12.
 const ROOF12K = process.env.ROOF12==='1' ? require('./roof12.js')(w) : null; if (ROOF12K) console.log('ROOF12: rooftop add-back scaled by', ROOF12K.toFixed(4));
 // ROOF_FROM_END2026=1 (user, 26 Oct 2026, message 392 (b)): FIXED.rooftopMW is the 2026 mean; the trajectory starts from the
 // latest installed level, so 2027's new rooftop is ROOF_MW plus the end-2026 level (nodal/rooftop_ntcsa_2026.json, latest NTCSA
 // point plus the recent pace; build_rooftop_2026.py) less the 2026 mean. Recorded as roofStep2027. Unset: 2027 adds ROOF_MW only.
 ROOF_STEP27 = process.env.ROOF_FROM_END2026==='1' ? +(JSON.parse(fs.readFileSync(path.join(ROOT,'nodal/rooftop_ntcsa_2026.json'),'utf8')).end_2026_mw - +w.eval('FIXED.rooftopMW')).toFixed(1) : 0;
 if (ROOF_STEP27) console.log('ROOF_FROM_END2026: 2027 rooftop', ROOF_PER_YR, '+', ROOF_STEP27, 'MW');
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
                 .replace(/^ 0 <= b_rooftop_(\d{4}) <= [0-9.]+$/gm,(m,y)=>{const v=+y>=2027?ROOF_PER_YR+(+y===2027?ROOF_STEP27:0):0; return ` ${v} <= b_rooftop_${y} <= ${v}`;})
                 // Gas infrastructure sensitivity, TODO 14ak (6 Oct 2026): GAS_FUEL_R sets costCcgt (R/MWh, replacing the flat regas
                 // adder), GAS_FOM_ADD sets the LNG terminal's fixed charge on new gas (state.bldGasTerminalRkW, R/kW-yr; from build
                 // 2026-10-19b the page default is R530.5, so it is set, not added, and nothing counts twice); same in pathcheck.js.
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
                 .replace(/^ 0 <= rc_(\d{4}) <= ([0-9.]+)$/gm,(m,y,ub)=> RC_FROM && +y<RC_FROM ? ` 0 <= rc_${y} <= 0` : RC_MIN!==null && +y===+(process.env.HORIZON||2040) ? ` ${Math.min(RC_MIN,+ub).toFixed(1)} <= rc_${y} <= ${ub}` : m); };
 let last=null; w.__bldSolveOverride=async(lp)=>{ if (process.env.SOLVER==='native'){ const os=require('os'),cp=require('child_process'); const tmp=path.join(os.tmpdir(),'gtza_'+process.pid); require(path.join(__dirname,'..','tmp_cleanup.js'))(tmp);
   // SOLVE CACHE (7 Oct 2026): the container restarts every few hours and a pass-2 solve takes one to three, so
   // each optimal solution is kept under lpcache/ (or LPCACHE, a run's own folder, so it can be deleted after the run's check;
   // message 371 (b)), keyed by a hash of the LP text. A restarted run replays the
   // solves it already finished (identical LP, identical answer) and only redoes the one that was cut off.
   const LPT=liMinRows(gasCumRows(gasMinRows(gasFloorVint(pvCap(tcapYr(gasCommit(gasLift(fixBuild(fix(lp)))))))))), key=require('crypto').createHash('sha1').update(LPT).digest('hex'), cdir=process.env.LPCACHE?path.resolve(process.env.LPCACHE):path.join(process.cwd(),'lpcache'), cf=path.join(cdir,key+'.json');
   // DUMP_LP=<prefix> (8 Oct 2026, diagnostics): write each LP to <prefix>_pass<n>.lp; DUMP_STOP=<n> exits after the n-th.
   if (w.__coalAvailSum && !w.__coalAvailPrinted){ w.__coalAvailPrinted=1; console.log('COAL_AVAIL: stress-window coal limit = available coal; per window: weather year, start day, days, seed, recorded mean / min, available mean / min (fraction of standing coal), hours equal / hours');
     for (const r of w.__coalAvailSum) console.log('  '+r[0]+' '+r[1]+' '+r[2]+' '+r[3]+'  recorded '+r[4].toFixed(4)+' / '+r[5].toFixed(4)+'  available '+r[6].toFixed(4)+' / '+r[7].toFixed(4)+'  equal '+r[8]+' / '+r[9]); }
   if ((LIFTED.size || TCAPSET.size || GC_LIFT.size) && !w.__liftPrinted){ w.__liftPrinted=1; if (LIFTED.size) console.log('GAS_LIFT: '+[...LIFTED].join('; ')); if (GC_LIFT.size) console.log('GAS_COMMIT raised: '+[...GC_LIFT].join('; ')); if (TCAPSET.size) console.log('TCAP_YR: '+[...TCAPSET].join('; ')); }
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
   else { const highs=await newHighs(); last=highs.solve(liMinRows(gasCumRows(gasMinRows(gasFloorVint(pvCap(tcapYr(gasCommit(gasLift(fixBuild(fix(lp)))))))))),{time_limit:+(process.env.TL||900)}); }
   console.log('solved', last.Status, new Date().toISOString()); if (last.Status!=='Optimal') throw new Error('solve not optimal: '+last.Status); return last; };
 // COMMIT / PSE (6 Oct 2026): coal commitment and pumped-storage energy in the build LP; unset = FIXED defaults.
 w.eval(`applyState(PRESETS['Today 2026']); state.demandGrowthPct=${DEM}; bldSetHorizon(${+(process.env.HORIZON||2040)});`+(process.env.COMMIT!==undefined?` state.bldCoalCommit=${+process.env.COMMIT};`:'')+(process.env.IMP_END!==undefined?` state.importsEndYear=${+process.env.IMP_END};`:'')+(CAPE?` if(!('bldCapeWindMW' in FIXED)) throw new Error('bldCapeWindMW missing'); state.bldCapeWindMW=${CAPE.mw};${CAPE.curtPct!=null?' state.bldCapeCurtPct='+CAPE.curtPct+';':''}`:'')+(RP_EXCL?` if(!('bldRpExclude' in FIXED)) throw new Error('bldRpExclude missing'); state.bldRpExclude=${JSON.stringify(RP_EXCL)};`:'')+(process.env.IMP_AVG_MW!==undefined?` { const m=state.importsMW ?? FIXED.importsMW; if(!(m>0)) throw new Error('importsMW missing'); if(${+process.env.IMP_AVG_MW}>m) throw new Error('IMP_AVG_MW above importsMW'); state.importsCF=${+process.env.IMP_AVG_MW}/m; }`:'')+(process.env.PSE!==undefined?` state.bldPsEnergy=${+process.env.PSE};`:'')+(process.env.GASFLOOR!==undefined?` if(!('bldGasFloorOn' in FIXED)) throw new Error('bldGasFloorOn missing'); state.bldGasFloorOn=${+process.env.GASFLOOR}; state.ccgtForceLoad=${+process.env.GASFLOOR};`+(process.env.GASFLOOR_MW!==undefined?` if(!('ccgtForceLoadMW' in FIXED)) throw new Error('ccgtForceLoadMW missing'); state.ccgtForceLoadMW=${+process.env.GASFLOOR_MW};`:''):'')+(process.env.DISC!==undefined?` BLD_DISC=${+process.env.DISC};`:'')+(process.env.OCGT!==undefined?` state.bldOcgtOn=${+process.env.OCGT};`:'')+(process.env.OCGD!==undefined?` state.bldOcgdOn=${+process.env.OCGD}; ${process.env.OCGD_RATE!==undefined?'state.bldOcgdRateMW='+(+process.env.OCGD_RATE)+';':''} ${process.env.OCGD_FROM!==undefined?'state.bldOcgdFromYear='+(+process.env.OCGD_FROM)+';':''}`:'')+(process.env.LI_EH!==undefined?` state.bldLiEnergyHours=${+process.env.LI_EH};`:'')+(process.env.ADEQ_BASIS!==undefined?` state.bldAdequacyBasis=${JSON.stringify(process.env.ADEQ_BASIS)};`:'')+(process.env.TURB_CAP!==undefined?` state.bldTurbineCapMW=${+process.env.TURB_CAP};`:'')+(process.env.OCGT_COST!==undefined?` state.bldOcgtCostCase=${JSON.stringify(process.env.OCGT_COST)};`:'')+(process.env.NUC_FORCE!==undefined?` if(!('bldNuclearAdd' in FIXED)) throw new Error('bldNuclearAdd missing'); state.bldNuclearAdd=${JSON.stringify(Object.fromEntries(process.env.NUC_FORCE.split(',').map(q=>{ const [y,mw]=q.split(':'); if(!(+y>2000&&+mw>=0)) throw new Error('NUC_FORCE: '+q); return [y,+mw]; })))};`:'')+(process.env.GAS_PREM!==undefined?` if(!('bldGasFinPremium' in FIXED)) throw new Error('bldGasFinPremium missing'); state.bldGasFinPremium=${+process.env.GAS_PREM};`:'')+(process.env.PHES!==undefined?` state.bldPhesOn=${+process.env.PHES};`:'')+(process.env.PHES_H?` state.bldPhesHours=${+process.env.PHES_H};`:'')+(process.env.PHES_H2?` state.bldPhesHours2=${+process.env.PHES_H2};`:'')+(process.env.GAS_CAPEX?` if(!('ccgt' in BLD_COST)) throw new Error('BLD_COST.ccgt missing'); BLD_COST.ccgt.c2026=${+process.env.GAS_CAPEX};`:'')+(process.env.PHES_CAP?` state.bldPhesCap=${/^\[/.test(process.env.PHES_CAP)?process.env.PHES_CAP:JSON.stringify(process.env.PHES_CAP)}; bldPhesCumCapMW(state.bldPhesCap,2040);`:'')+(process.env.PHES_BASIS?` if(!('bldPhesCostBasis' in FIXED)) throw new Error('bldPhesCostBasis missing'); state.bldPhesCostBasis='${process.env.PHES_BASIS}';`:'')+(process.env.GAS_FUEL_R?` if(!('costCcgt' in state)) throw new Error('costCcgt missing'); state.costCcgt=${+process.env.GAS_FUEL_R};`:'')+(process.env.GAS_FOM_ADD!==undefined?` if(!('bldGasTerminalRkW' in FIXED)) throw new Error('FIXED.bldGasTerminalRkW missing'); state.bldGasTerminalRkW=${+process.env.GAS_FOM_ADD};`:''));
 // COAL_STATE (user, 24 Oct 2026, messages 359 (j), 363 (c); PR C): a JSON object of coal settings for the coal sensitivities, e.g.
 // '{"coalMinDownH":24}' or '{"bldCoalCommitHours":48}'. Each key must be one of COAL_PRE_C's (the page's coal settings); unset = FIXED.
 const COAL_STATE = process.env.COAL_STATE ? JSON.parse(process.env.COAL_STATE) : {};
 for (const k of Object.keys(COAL_STATE)) if (!w.eval(`(${JSON.stringify(k)} in COAL_PRE_C) && (${JSON.stringify(k)} in FIXED)`)) throw new Error('COAL_STATE: ' + k + ' is not a coal setting');
 if (Object.keys(COAL_STATE).length) w.eval(`Object.assign(state, ${JSON.stringify(COAL_STATE)});`);
 // GRID (7 Oct 2026, TODO 14ar): optimiser grid cost. GRID=1 central, 2 high; GRID_BEYOND=1 spur only beyond the
 // median; GRID_BATTHALF=1 storage pays half the integration charge. Unset = FIXED (off).
 w.eval(`if(!('bldGridCost' in FIXED)) throw new Error('bldGridCost missing');`+(process.env.GRID!==undefined?` state.bldGridCost=${+process.env.GRID};`:'')+(process.env.GRID_BEYOND!==undefined?` state.bldGridSpurBeyond=${+process.env.GRID_BEYOND};`:'')+(process.env.GRID_BATTHALF!==undefined?` state.bldGridBattHalf=${+process.env.GRID_BATTHALF};`:''));
 // COMPLY (15 Oct 2026, messages 119 and 122 (4)): coal emissions compliance cost, none (default), compromise or full (COMPLY_MES in
 // index.html). Unset or none: nothing here runs and the LP is unchanged. Recorded in the output as comply, with each year's charge.
 if (process.env.COMPLY!==undefined){ w.eval(`if(!('bldComply' in FIXED)) throw new Error('bldComply missing'); state.bldComply=${JSON.stringify(process.env.COMPLY)}; complyCase(state);`); }
 // PEAK (7 Oct 2026, TODO 14as): existing peakers. PEAK=1 end-of-life dates, 2 IRP 2025 dates; PEAK_EXT=0 offers no
 // life extension; PEAK_EXT_R the extension capex, R/kW. Unset = FIXED (off).
 w.eval(`if(!('bldPeakerRet' in FIXED)) throw new Error('bldPeakerRet missing');`+(process.env.PEAK!==undefined?` state.bldPeakerRet=${+process.env.PEAK};`:'')+(process.env.PEAK_EXT!==undefined?` state.bldPeakerLifeExt=${+process.env.PEAK_EXT};`:'')+(process.env.PEAK_EXT_R!==undefined?` state.bldPeakerExtRkW=${+process.env.PEAK_EXT_R};`:''));
 // BATT_CAPEX (7 Oct 2026, TODO 14ax): lithium capex at 2026, R/kW at 4 h, for the low case (8105, a hardware-only
 // basis, so it does not include connection). Read by engine and optimiser alike.
 if (process.env.BATT_CAPEX) w.eval(`if(!('batt' in BLD_COST)) throw new Error('BLD_COST.batt missing'); BLD_COST.batt.c2026=${+process.env.BATT_CAPEX}; BLD_COST.batt.connIncl=false;`);
 // CTAX_FULL=1 (user, 14 Oct 2026, s_carbonfull): carbon at the full statutory rate with no allowances (carbonTaxFull,
 // CARBON_TAX_LAW: R308/t in 2026 to R462/t in 2030 in law, stated in 2026 rands, held after). Recorded in the output (carbonFull); pathcheck.js applies it.
 if (process.env.CTAX_FULL!==undefined && !['0','1'].includes(process.env.CTAX_FULL)) throw new Error('CTAX_FULL must be 0 or 1');
 w.eval(`if(!('carbonTaxFull' in FIXED)) throw new Error('carbonTaxFull missing');`+(process.env.CTAX_FULL!==undefined?` state.carbonTaxFull=${+process.env.CTAX_FULL};`:''));
 // CARBON_PATH (14 Oct 2026): the allowance path; recorded as carbonPath. treasury (default, central from c6b, message 421),
 // law2031, kept2030 (central c5 to c6a; s_carbonlegis) or cut2027 (c4's). See FIXED.carbonAllowancePath.
 if (process.env.CARBON_PATH!==undefined && !['treasury','law2031','kept2030','cut2027'].includes(process.env.CARBON_PATH)) throw new Error('CARBON_PATH must be treasury, law2031, kept2030 or cut2027');
 w.eval(`if(!('carbonAllowancePath' in FIXED)) throw new Error('carbonAllowancePath missing');`+(process.env.CARBON_PATH!==undefined?` state.carbonAllowancePath=${JSON.stringify(process.env.CARBON_PATH)};`:''));
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
// RC_FROM (user, 17 Oct 2026, messages 185 (2) and 187 (1)): no coal retired ahead of its dates before this year (rc_ upper bound
// 0), since IRP 2025 Figure 3 and NTCSA's MTSAO 2026-2030 phase closures from 2029. Default 2029 from 17 Oct 2026 (message 187 (1));
// RC_FROM=0 allows early retirement from the first year, as every run recorded before then did.
const RC_FROM = process.env.RC_FROM !== undefined && process.env.RC_FROM !== '' ? +process.env.RC_FROM : 2029;
 // WINDMOD / WIND_CASE (7 Oct 2026): new wind on the modern-turbine profile with bid capex (1, default) or the previous
 // R21,000 on the current profile (0); wind cost case central, bw6, high or low; WIND_CORR the new-wind correction, none (central
 // from 15 Oct 2026), farms or bw6. PV_CASE (15 Oct 2026): tracking solar capex, central (BW7 tariffs) or bw6. REPDAYS_RULE: the
 // optimiser's calendar days, matched (default) or even. All four are recorded in the output for the engine check.
 w.eval(`if(!('bldWindModern' in FIXED)) throw new Error('bldWindModern missing');`+(process.env.WINDMOD!==undefined?` state.bldWindModern=${+process.env.WINDMOD};`:'')+(process.env.WIND_CASE!==undefined?` state.bldWindCase=${JSON.stringify(process.env.WIND_CASE)};`:'')+(process.env.WIND_CORR!==undefined?` state.bldWindCorr=${JSON.stringify(process.env.WIND_CORR)};`:'')+(process.env.PV_CASE!==undefined?` state.bldPvCase=${JSON.stringify(process.env.PV_CASE)};`:'')+(process.env.PS_RES_ONCE!==undefined?` state.psResOnce=${+process.env.PS_RES_ONCE};`:'')+(process.env.REPDAYS_RULE!==undefined?` state.bldRepDaysRule=${JSON.stringify(process.env.REPDAYS_RULE)};`:''));
 // TARIFF_CF (16 Oct 2026, message 158 (4)): run (the default from build 2026-10-16h, c5e) or bid (c5d), the capacity factor at
 // which wind and solar capex are backed out of their tariffs (bldTariffCfBasis). Recorded in the output for the engine check.
 w.eval(`if(!('bldTariffCfBasis' in FIXED)) throw new Error('bldTariffCfBasis missing');`+(process.env.TARIFF_CF!==undefined?` state.bldTariffCfBasis=${JSON.stringify(process.env.TARIFF_CF)};`:''));
 // STRESS_TARGET (8 Oct 2026, TODO 14bk): 1 plans the stress windows to the standard (bldStressTarget); unset = FIXED (0).
 w.eval(`if(!('bldStressTarget' in FIXED)) throw new Error('bldStressTarget missing');`+(process.env.STRESS_TARGET!==undefined?` state.bldStressTarget=${+process.env.STRESS_TARGET};`:''));
// GRID_INT_VRE (16 Oct 2026): share of the integration charge new wind and utility solar pay in the build LP
// (bldGridIntVreShare; 1 central, 0 s_grid0, 0.5 s_grid50). Recorded as gridIntVreShare.
w.eval(`if(!('bldGridIntVreShare' in FIXED)) throw new Error('bldGridIntVreShare missing');`+(process.env.GRID_INT_VRE!==undefined?` state.bldGridIntVreShare=${+process.env.GRID_INT_VRE};`:''));
// PRM (16 Oct 2026, message 133): the build LP's planning reserve margin, % (bldPlanMarginPct; default 0, no res_ row). PRM=10
// is sensitivity s_prm10, the margin every run before build 2026-10-16a carried. Recorded in the output as planMarginPct.
w.eval(`if(!('bldPlanMarginPct' in FIXED)) throw new Error('bldPlanMarginPct missing');`+(process.env.PRM!==undefined?` state.bldPlanMarginPct=${+process.env.PRM};`:''));
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
 // COAL_AVAIL=1 (user, 13 Oct 2026, TODO 14cx; run s_coalavail): on stress-window days the LP's coal limit is the engine
 // draw's AVAILABLE coal for that hour (after outages, switched on or not) instead of the window's recorded coalFrac, which
 // is the lower of available and what the draw's unit commitment had switched on. Re-derived from each window's own outage
 // draw (its seed, on the run's base state) as simulate's coalAvailableMW over the standing fleet; every hour is checked to
 // be at least the recorded fraction, or the run stops. Applied while each LP is built: the recorded windows and the _lp
 // file keep coalFrac. Only the stress-window hours' coal limit (cmax) and the reserve row that reads it (resv) change; the
 // ramp rows (cru, crd) read the year's mean and do not. Unset or 0: no change.
 if (process.env.COAL_AVAIL!==undefined && !['0','1'].includes(process.env.COAL_AVAIL)) throw new Error('COAL_AVAIL must be 0 or 1: '+process.env.COAL_AVAIL);
 if (process.env.COAL_AVAIL==='1') w.eval(`{ const cache = {};
   const availOf = p => { const key = p.year + '_' + p.seed; if (!cache[key]){
       const nat = weatherYearNational(String(p.year)); if (!nat) throw new Error('COAL_AVAIL: no weather year ' + p.year);
       const st = { ...state, outageSeed: p.seed }, eaf = (st.coalEAFPct ?? FIXED.coalEAFPct) / 100;
       const x = simulate(st, { demand: PROFILES.demand, solar: nat.solar, wind: nat.wind, csp: PROFILES.csp, real: true });
       const inst = x.coalAvail / eaf;
       if (!(inst > 0) || !x.coalAvailableMW) throw new Error('COAL_AVAIL: no standing coal or no coalAvailableMW in the base state');
       cache[key] = Array.from(x.coalAvailableMW, v => v / inst); }
     return cache[key]; };
   const _bc = bldBuildLP; bldBuildLP = function(o){ const keep = bldStressPeriods, sum = [];
     bldStressPeriods = keep.map(p => { if (!p.coalFrac || p.seed === undefined) return p;
       // A window made from build 14i on carries availFrac, recorded by the same engine run as coalFrac. Without it the
       // available coal is re-derived on the base state, which matches the recorded draw only when outages are drawn over
       // all units in every year: with outageStandingUnits on (14dr) a later year draws over its own standing units, so
       // the re-derivation is refused (14 Oct 2026: it stopped a run when available came out below recorded).
       const OSU = !!(state.outageStandingUnits ?? FIXED.outageStandingUnits);
       if (!p.availFrac && OSU) throw new Error('COAL_AVAIL: window ' + p.year + ' day ' + p.start + ' has no availFrac and outageStandingUnits is on; windows must come from build 14i or later');
       const A = p.availFrac ? null : availOf(p), cf = new Array(p.coalFrac.length); let eq = 0, mr = 1, ma = 1, sr = 0, sa = 0;
       for (let i = 0; i < cf.length; i++){ const a = p.availFrac ? p.availFrac[i] : A[p.start * 24 + i], c = p.coalFrac[i];
         if (!(a >= c - 1e-6)) throw new Error('COAL_AVAIL: available below recorded, window ' + p.year + ' day ' + p.start + ' seed ' + p.seed + ' hour ' + i + ': ' + a + ' < ' + c);
         cf[i] = a; if (Math.abs(a - c) < 1e-6) eq++; mr = Math.min(mr, c); ma = Math.min(ma, a); sr += c; sa += a; }
       sum.push([p.year, p.start, p.n, p.seed, sr / cf.length, mr, sa / cf.length, ma, eq, cf.length]);
       return { ...p, coalFrac: cf }; });
     if (!window.__coalAvailSum) window.__coalAvailSum = sum;
     try { return _bc(o); } finally { bldStressPeriods = keep; } }; }`);
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
 // BATT_DECL (13 Oct 2026, user: battery cost decline sensitivity s_battdecl): annual real decline of lithium capex from 2026,
 // on BLD_COST.batt and its high and low cases (lithium fixed O&M, 2.5% of capex, follows), for the optimiser and, through the
 // recorded battDecl, the engine check. Unset: the engine's own rate (LI_DECL, 0.03 from build 2026-10-19b; 0.05 before), the
 // LP unchanged; from 19b the run records the rate it used either way, so a check never falls back on a later default.
 // Refused with COSTSET, whose table replaces the decline. For sensitivities only from 19b (s_batt5: BATT_DECL=0.05).
 if (process.env.BATT_DECL!==undefined) { if (process.env.COSTSET) throw new Error('BATT_DECL with COSTSET: the cost set replaces the decline'); const d=+process.env.BATT_DECL; if (!(d>-0.5 && d<0.5)) throw new Error('BATT_DECL out of range: '+d); w.eval(`for (const k of ['batt','batt_high','batt_low']){ if(!BLD_COST[k] || !('decl' in BLD_COST[k])) throw new Error('BLD_COST.'+k+'.decl missing'); BLD_COST[k].decl=${d}; }`); }
 // COAL_DATES=<file under harness/> (12 Oct 2026, TODO 14cr): per-unit coal decommissioning years for a sensitivity, e.g. the
 // IRP 2025 timing (coal_dates_irp2025.json). A listed unit is gone from the start of its year; groups not listed keep
 // UC_FLEET's date. Only the build LP's coal standing changes (bldCoalRawMW, and through it bldCoalMW and the coalMW
 // written by year); the engine check reads coalMW from this run's output. Unset, nothing here runs and the LP is unchanged.
 if (process.env.COAL_DATES){ const CD=JSON.parse(fs.readFileSync(process.env.COAL_DATES,'utf8')).units;
   w.eval(`{ const CD = ${JSON.stringify(CD)};
     for (const [k, v] of Object.entries(CD)){ const g = UC_FLEET.find(q => q.name === k);
       if (!g) throw new Error('COAL_DATES: no fleet group ' + k);
       if (!Array.isArray(v) || v.length !== Math.max(1, g.n || 1) || v.some(y => !(y > 2000))) throw new Error('COAL_DATES: ' + k + ' needs ' + (g.n || 1) + ' unit years'); }
     // From build 2026-10-15c the app reads the unit dates itself (BLD_COAL_UNIT_DATES, the same rule and summation order as the
     // function this used to replace), so compliance (COMPLY) can see which units stand.
     if (typeof BLD_COAL_UNIT_DATES === 'undefined') throw new Error('COAL_DATES: this build has no BLD_COAL_UNIT_DATES');
     BLD_COAL_UNIT_DATES = CD; }`);
   console.log('coal dates from', process.env.COAL_DATES, JSON.stringify(Object.fromEntries([2026,2027,2028,2029,2030,2031,2032,2033,2034,2035,2036,2037,2038,2039,2040].map(y=>[y, Math.round(+w.eval('bldCoalMW('+y+')'))])))); }
 await w.eval('loadWeatherYears()');
 // NUC_SHAPE (message 376 (b), s_koeberg_winter): Koeberg's monthly shape, a JSON array of 12 factors with hour-weighted mean 1
 // (nuclearMonthlyShape), in the optimiser and the loop's engine tests; recorded (nuclearShape) for pathcheck.js. OC_CF_MAX (message
 // 376 (d), s_ntcsa_both): NTCSA's open-cycle criterion as a build constraint (bldOcCfMax, e.g. 0.06); recorded (ocCfMax).
 const NUC_SHAPE=process.env.NUC_SHAPE?JSON.parse(process.env.NUC_SHAPE):null, OC_CF_MAX=process.env.OC_CF_MAX!==undefined?+process.env.OC_CF_MAX:null;
 if (NUC_SHAPE){ if (!Array.isArray(NUC_SHAPE)||NUC_SHAPE.length!==12) throw new Error('NUC_SHAPE: 12 monthly factors');
   const mh=[31,28,31,30,31,30,31,31,30,31,30,31], mean=NUC_SHAPE.reduce((a,v,k)=>a+v*mh[k]*24,0)/8760;
   if (Math.abs(mean-1)>1e-6) throw new Error('NUC_SHAPE: hour-weighted mean '+mean+', not 1');
   w.eval(`state.nuclearMonthlyShape=${JSON.stringify(NUC_SHAPE)};`); console.log('Koeberg monthly shape', JSON.stringify(NUC_SHAPE)); }
 if (OC_CF_MAX!=null){ w.eval(`if(!('bldOcCfMax' in FIXED)) throw new Error('bldOcCfMax missing'); state.bldOcCfMax=${OC_CF_MAX};`); console.log('open-cycle capacity factor cap', OC_CF_MAX); }
 // STD (user decision, 25 Oct 2026, message 373): the reliability standard the loop plans to. 'ntcsa' (the c6 central): NTCSA's
 // medium-term adequacy test, mean unserved energy at most NTCSA_ADEQUACY_GWH (20 GWh) a year; 'strict': half the 0.002% standard
 // on customer demand (targetFrac 0.5, every run before message 373); 'nem': the 0.002% standard itself (targetFrac 1.0). Unset:
 // TF as before (targetFrac, default 0.5). STD and TF are exclusive. The run records it (standard), and pathcheck.js judges by it.
 const STD=process.env.STD||null;
 if (STD && process.env.TF!==undefined) throw new Error('STD and TF are exclusive');
 if (STD && !['ntcsa','strict','nem'].includes(STD)) throw new Error('STD must be ntcsa, strict or nem');
 const STD_GWH=STD==='ntcsa'?+w.eval('NTCSA_ADEQUACY_GWH'):null, STD_FRAC=STD==='nem'?1:STD?0.5:+(process.env.TF||0.5);
 console.log('standard', STD||'TF', STD_GWH!=null?STD_GWH+' GWh a year':'targetFrac '+STD_FRAC);
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
   if (!G.terminal) w.eval(`state.bldGasTerminalRkW=0;`);   // the page default carries one (build 2026-10-19b); this case has none
   if (G.terminal && process.env.GAS_FOM_ADD===undefined) throw new Error('case '+GAS_CASE+' needs GAS_FOM_ADD (R354-707/kW-yr)');
   GAS_FUEL=Object.fromEntries(YRS.map(y=>{ if(!G.years[y]) throw new Error('gas case '+GAS_CASE+' has no '+y); return [y, G.years[y].fuel_r_mwh]; }));
   console.log('gas', GAS_CASE, JSON.stringify(GAS_FUEL), 'terminal R/kW-yr', +(process.env.GAS_FOM_ADD||0)); }
 if (DEMAND==='irp_esrg'){ const J=JSON.parse(fs.readFileSync(path.join(ROOT,'public_data','esrg_irp_demand_ref.json'),'utf8')).years;
   DEM_INDEX=Object.fromEntries(YRS.map(y=>{ if(!J[y]) throw new Error('esrg_irp_demand_ref.json has no '+y); return [y, J[y].index_vs_2026]; })); }
 else if (DEMAND.startsWith('rate:')){ const r=+DEMAND.slice(5)/100; if(!isFinite(r)) throw new Error('DEMAND rate'); DEM_INDEX=Object.fromEntries(YRS.map(y=>[y, Math.pow(1+r, y-2026)])); }
 // 'index:<file>' (message 224, ported for c6's IRP pair, message 363 (c)): a year -> index JSON ({"years":{"2026":x,...}}), e.g. the
 // IRP's demand path (harness/pathway/gen_irp_index.py); every model year must be present.
 else if (DEMAND.startsWith('index:')){ const J=JSON.parse(fs.readFileSync(DEMAND.slice(6),'utf8')).years;
   DEM_INDEX=Object.fromEntries(YRS.map(y=>{ if(!(J[y]>0)) throw new Error('DEMAND index file has no '+y); return [y, +J[y]]; })); }
 else if (DEMAND!=='legacy') throw new Error('DEMAND must be irp_esrg, rate:<pct>, index:<file> or legacy');
 if (DEM_INDEX && process.env.DEM) throw new Error('DEM applies only with DEMAND=legacy');
 if (DEM_INDEX) w.eval(`state.demandGrowthPct=${(DEM_INDEX[YRS[YRS.length-1]]-1)*100};`);   // the horizon year's level, for anything reading the slider
 console.log('demand', DEMAND, DEM_INDEX ? JSON.stringify(DEM_INDEX) : 'legacy +'+DEM+'% to the horizon', DEM_BLOCK ? 'block '+JSON.stringify(DEM_BLOCK) : 'no block');
 console.log('imports', w.eval('state.importsMW ?? FIXED.importsMW'), 'MW x', w.eval('(state.importsCF ?? FIXED.importsCF).toFixed(4)'));
 const t0=Date.now();
 const _dump=setInterval(()=>{ try{ fs.writeFileSync((process.env.OUT||'x')+'.progress', JSON.stringify(w.eval('JSON.stringify(bldStressLog.map(l=>({pass:l.pass,margin:l.margin,added:l.added,nAdded:Array.isArray(l.added)?l.added.length:l.added,fails:l.years.filter(q=>q.mean>q.limit).map(q=>[q.y,+q.mean.toFixed(2),+q.limit.toFixed(2)])})))'))); }catch(e){} }, 20000);
 await w.eval(`(async()=>{ const tg=1+(state.demandGrowthPct||0)/100;
   const opts={growth:${process.env.GROWTH_PA ? +process.env.GROWTH_PA : 'Math.pow(tg,1/Math.max(1,BLD_YEARS.length-1))-1'}, eaf:(state.coalEAFPct??FIXED.coalEAFPct)/100, rate:bldRates(), state:state, perYear:true, marginStepMW:1000, draws:2, stressDays:14, targetFrac:${STD_FRAC}${STD_GWH!=null?', targetGWh:'+STD_GWH:''}, windowLeadYears:${+(process.env.LEAD||0)}, testEvery:1, windowsPerPass:${+(process.env.WPP||3)}, maxPasses:${+(process.env.MAXP||14)}, stallFrac:${STALL}, stallFrom:${STALL_FROM}${DEM_INDEX ? ', demandIndex:'+JSON.stringify(DEM_INDEX) : ''}${DEM_BLOCK ? ', demandBlock:'+JSON.stringify(DEM_BLOCK) : ''}${GAS_FUEL ? ', gasFuelR:'+JSON.stringify(GAS_FUEL) : ''}};
   window.__out=await bldStressLoop(opts, m=>{}); })()`);
 const out=w.__out, cols=out.res.Columns;
 const Y=JSON.parse(w.eval('JSON.stringify(BLD_YEARS)')), T=JSON.parse(w.eval('JSON.stringify(BLD_TECHS)'));
 const sched={}; for(const y of Y){ sched[y]={}; for(const t of T) sched[y][t]=Math.round((cols['b_'+t+'_'+y]||{Primal:0}).Primal);
   sched[y].battMWh=Math.round((cols['eb_batt_'+y]||{Primal:0}).Primal); if (CAPE) sched[y].cw=Math.round((cols['cw_'+y]||{Primal:0}).Primal); sched[y].off=Math.round((cols['b_off_'+y]||{Primal:0}).Primal);
   sched[y].phes=Math.round((cols['b_phes_'+y]||{Primal:0}).Primal); sched[y].phel=Math.round((cols['b_phel_'+y]||{Primal:0}).Primal); sched[y].ocgt=Math.round((cols['b_ocgt_'+y]||{Primal:0}).Primal); sched[y].ocgd=Math.round((cols['b_ocgd_'+y]||{Primal:0}).Primal); sched[y].dslDecomMW=Math.round(w.eval(`bldPeakerDecomMW(${y},{...FIXED,...state},${JSON.stringify(Object.fromEntries(Object.entries(cols).filter(([c])=>c.startsWith('le_'))))})`)); sched[y].rp={}; for(const t of T.concat(['phes','phel'])){ const v=Math.round((cols['rp_'+t+'_'+y]||{Primal:0}).Primal); if(v) sched[y].rp[t]=v; } sched[y].earlyRetMW=Math.round((cols['rc_'+y]||{Primal:0}).Primal); sched[y].coalMW=Math.round(w.eval(`bldCoalMW(${y})`) - sched[y].earlyRetMW); }
 // COMPLY: each year's compliance charge on what the run keeps (COMPLY_MES), recorded only when it is on, for the engine check.
 const COMPLY_OUT = (()=>{ const c=w.eval('complyCase(state)'); if (c==='none') return null; const yrs={};
   for (const y of Y){ const q=JSON.parse(w.eval(`JSON.stringify(complyYear(state, ${y}))`)); if (!(q.mwA>0)) continue;
     const rca=(cols['rca_'+y]||{Primal:0}).Primal; yrs[y]={chargeR:q.chargeR, mwA:q.mwA, rateR:q.rateR, rcaMW:rca, keptChargeR:q.chargeR-q.rateR*rca}; sched[y].rcaMW=Math.round(rca); }
   return {case:c, stations:JSON.parse(w.eval('JSON.stringify(complyStations(state).map(x=>({name:x.name,mw:x.mw,close:x.close,life:x.life,capexR:x.capexR,annR:x.annR,opexR:x.opexR})))')), years:yrs}; })();
 // DUMP (6 Oct 2026): the final LP's 2040 stress-window hours (d >= 1100) and the windows themselves,
 // for decomposing optimiser against engine supply line by line.
 if (process.env.DUMP!=='0'){ const DY=+(process.env.DUMPY||2040); const re=new RegExp('^([a-z]+)_'+DY+'_(\\d+)_(\\d+)$'); const lpv={};
   for (const [n,c] of Object.entries(cols)){ const m=n.match(re); if (m && +m[2]>=1100) lpv[n]=c.Primal; }
   const periods=JSON.parse(w.eval('JSON.stringify(bldStressPeriods)'));
   fs.writeFileSync(OUT.replace(/\.json$/,'')+'_lp'+DY+'.json', JSON.stringify({year:DY, periods, lpv})); }
 const peakerExt=Object.fromEntries(Object.entries(cols).filter(([c])=>c.startsWith('le_')).map(([c,v])=>[c.slice(3),Math.round(v.Primal||0)]));   // TODO 14as
 const build=Object.fromEntries(Object.entries(cols).filter(([n])=>/^(b_[a-z]+|eb_batt|rc|cc_[a-z]+)_20\d\d$/.test(n)).map(([n,c])=>[n,c.Primal]));   // exact, for FIX_FROM
 fs.writeFileSync(OUT, JSON.stringify({planMarginPct:+w.eval('state.bldPlanMarginPct ?? FIXED.bldPlanMarginPct'), gridIntVreShare:+w.eval('state.bldGridIntVreShare ?? FIXED.bldGridIntVreShare'), ...(COMPLY_OUT?{comply:COMPLY_OUT}:{}), importsEndYear:+w.eval('state.importsEndYear ?? FIXED.importsEndYear'), coal:JSON.parse(w.eval(`JSON.stringify(Object.fromEntries(Object.keys(COAL_PRE_C).map(k => [k, state[k] ?? FIXED[k]])))`)), pvTracking:+w.eval('state.bldPvTracking ?? FIXED.bldPvTracking')||0, windCorr:w.eval('state.bldWindCorr ?? FIXED.bldWindCorr'), windCase:w.eval('state.bldWindCase ?? FIXED.bldWindCase'), pvCase:w.eval('state.bldPvCase ?? FIXED.bldPvCase'),tariffCfBasis:w.eval('state.bldTariffCfBasis ?? FIXED.bldTariffCfBasis'), repDaysRule:w.eval('state.bldRepDaysRule ?? FIXED.bldRepDaysRule'), capex2026:{wind:+w.eval("bldCapex('wind', 2026)"), pv:+w.eval("bldCapex('pv', 2026)")}, carbonFull:+w.eval('state.carbonTaxFull ?? FIXED.carbonTaxFull')||0, carbonPath:w.eval('state.carbonAllowancePath ?? FIXED.carbonAllowancePath'), demand:{spec:DEMAND, index:DEM_INDEX, legacyPct:DEM_INDEX?null:DEM, block:DEM_BLOCK}, importsMW:+w.eval('state.importsMW ?? FIXED.importsMW'), importsCF:+w.eval('state.importsCF ?? FIXED.importsCF'), capeWind:CAPE?{mw:CAPE.mw, curtPct:+w.eval('state.bldCapeCurtPct ?? FIXED.bldCapeCurtPct')}:null, rpExclude:RP_EXCL, minBuild:MIN_BUILD.length?MIN_BUILD:null, existingBatt:{mw:+w.eval('FIXED.battPowerMW'), hours:+w.eval('FIXED.battHours')}, battDecl:+w.eval('BLD_COST.batt.decl'), gasLift:GAS_LIFT?[...LIFTED]:null, tcapYr:TCAPSET.size?[...TCAPSET]:null, gasFloorVint:GF_VINT, pvCapYr:Object.keys(PV_CAP_YR).length?PV_CAP_YR:null, roofMW:process.env.ROOF_MW!==undefined?+process.env.ROOF_MW:null, coalAvail:process.env.COAL_AVAIL==='1'?1:null, gas:{case:GAS_CASE, fuelR:GAS_FUEL, fuelRFlat:process.env.GAS_FUEL_R?+process.env.GAS_FUEL_R:null, fomAdd:+w.eval('bldGasTerminalRkW()')}, disc:+w.eval('BLD_DISC'), liEnergyHours:+w.eval('state.bldLiEnergyHours ?? FIXED.bldLiEnergyHours ?? 12'), adequacyBasis:w.eval('state.bldAdequacyBasis ?? FIXED.bldAdequacyBasis ?? "withCharging"'), standard:{basis:STD||'tf', targetFrac:STD_GWH!=null?null:STD_FRAC, targetGWh:STD_GWH}, nuclearShape:NUC_SHAPE, ocCfMax:OC_CF_MAX, nuclearAdd:JSON.parse(w.eval('JSON.stringify(state.bldNuclearAdd||null)')), gasForce:Object.keys(GAS_FORCE).length?GAS_FORCE:null, gasMin:Object.keys(GAS_MIN).length?GAS_MIN:null,fleet2026:Object.keys(FLEET_2026).length?FLEET_2026:null,roofAddback12:ROOF12K,roofStep2027:ROOF_STEP27||null,gasCommit:GAS_COMMIT.length?GAS_COMMIT:null,gasCommitLift:GC_LIFT.size?[...GC_LIFT]:null,gasCum:Object.keys(GAS_CUM).length?GAS_CUM:null,gasCumCovers:GAS_CUM_COVERS, gasMinCovers:Object.keys(GAS_MIN).length?(Object.keys(cols).some(c=>c.startsWith('b_ocgt_'))?'ccgt+ocgt':'ccgt'):null, rcFrom:RC_FROM||null, storCum:STOR_CUM.length?STOR_CUM:null, liMin:LI_MIN.length?LI_MIN:null, ocgt:JSON.parse(w.eval(`JSON.stringify((()=>{ const S={...FIXED,...state}; return {lng:S.bldOcgtOn|0, diesel:S.bldOcgdOn|0, dieselRateMW:S.bldOcgdRateMW, dieselFrom:S.bldOcgdFromYear, turbineCapMW:S.bldTurbineCapMW, costCase:S.bldOcgtCostCase}; })())`)), gasFinPremium:+(+w.eval('bldAnnuityRate("ccgt")-BLD_DISC')).toFixed(6), liCap:LI_CAP, windCap:WIND_CAP||null, windCapFrom:WIND_CAP?WIND_CAP_FROM:null, liCapFrom:CAP_FROM, gasFloor:JSON.parse(w.eval(`(function(){ const S={...FIXED,...state}; return JSON.stringify({on:+(S.bldGasFloorOn||0), engine:+(S.ccgtForceLoad||0), pct:S.ccgtForceLoadPct, mw:S.ccgtForceLoadMW, from:S.ccgtForceFromYear, to:S.ccgtForceToYear}); })()`)), phes:JSON.parse(w.eval(`(function(){ const S={...FIXED,...state}; return JSON.stringify({on:+S.bldPhesOn, hours:S.bldPhesHours, hours2:S.bldPhesHours2||0, basis:S.bldPhesCostBasis, cap:S.bldPhesCap, rateMW:S.bldPhesRateMW}); })()`)), build, lpWindows:w.__lpWindows||null, mergeMismatch:w.__mergeMismatch||0, margin:out.margin, secs:(Date.now()-t0)/1000, verdict:out.verdict, stall:STALL>0?{frac:STALL, from:STALL_FROM}:null, log:out.log, sched, objective:out.res.ObjectiveValue, status:out.res.Status, peakerExt},null,1));
 console.log('done', out.verdict, ((Date.now()-t0)/1000).toFixed(0)+'s'); process.exit(0);
})();
