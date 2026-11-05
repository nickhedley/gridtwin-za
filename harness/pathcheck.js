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
 // The run's rooftop add-back on the twelve-year mean (messages 391 (b), 392 (c)), as its build LP had it.
 if (!P.roofAddback12) w.eval("if ('bldRoof12' in FIXED) FIXED.bldRoof12 = 0;");   // a run that did not record the scaling is checked on the unscaled series (build 2026-10-30a)
 if (P.roofAddback12){ const K=require('./pathway/roof12.js')(w); if (Math.abs(K-P.roofAddback12)>1e-9) throw new Error('roof12: K '+K+' differs from the run\'s '+P.roofAddback12); console.log('ROOF12: rooftop add-back scaled by', K.toFixed(4)); }
 w.eval(`applyState(PRESETS['Today 2026']);`); await w.eval('loadWeatherYears()');
 // WEATHER (message 683 (a), (c); measurement only; unset, the twelve modelled years as before): 'metered', the page's own 2025 wind and
 // solar (profiles.json, Eskom's metered 2025, ESK19679) as one weather year with modelled 2025's outage seeds; '<y,y,...>', only those
 // modelled years; 'metered_trk12', metered as above with new tracking solar rescaled to its twelve-year mean (the engine derives new
 // tracking solar from the profile it is given, and on the metered fleet, already 53-58% on trackers, that applies the tracker gain a
 // second time: 0.342 against 0.286; a test variant, not a series). Demand is 2025's in every case, as before. Recorded in each year's
 // output (weather).
 const WX=process.env.WEATHER||null, WXL=(WX==='metered'||WX==='metered_trk12')?[WX]:WX?WX.split(',').map(s=>s.trim()):null;
 if (WXL && WX!=='metered' && WX!=='metered_trk12'){ const have=JSON.parse(w.eval('JSON.stringify(bldWeatherYears.meta.years.map(String))')); for (const yy of WXL) if (!have.includes(yy)) throw new Error('WEATHER: no modelled year '+yy); }
 w.eval(`window.__wxYears=()=>${WXL?JSON.stringify(WXL):'bldWeatherYears.meta.years'}; window.__wxTrk12=(()=>{ let c=null; return ()=>{ if (c) return c; let s=0,n=0; for (const y of bldWeatherYears.meta.years){ const t=solarTrkOf(weatherYearNational(String(y)).solar); for (let h=0;h<t.length;h++){ s+=t[h]; n++; } } const t=solarTrkOf(PROFILES.solar), m=t.reduce((a,v)=>a+v,0)/t.length, k=(s/n)/m, o=new Float64Array(t.length); for (let h=0;h<t.length;h++) o[h]=Math.min(1,k*t[h]); o.k=k; o.from=m; o.to=s/n; return (c=o); }; })(); window.__wxNat=yy=>yy==='metered'?{solar:PROFILES.solar,wind:PROFILES.wind}:yy==='metered_trk12'?{solar:PROFILES.solar,wind:PROFILES.wind,solarTrk:__wxTrk12()}:weatherYearNational(String(yy)); window.__wxSeed=yy=>(yy==='metered'||yy==='metered_trk12')?2025:+yy;`);
 // WX_WINDCORR=1 (message 684 (d)): the modelled years' wind through nodal/wind_corr_table.json (FIXED.wxWindCorr); recorded in weather.
 // On by default from message 696 (a) (FIXED.wxWindCorr 1); WX_WINDCORR=0 runs the stored, uncorrected series (the sensitivity).
 if (process.env.WX_WINDCORR!==undefined && !['0','1'].includes(process.env.WX_WINDCORR)) throw new Error('WX_WINDCORR must be 0 or 1');
 if (process.env.WX_WINDCORR==='0'){ w.eval('state.wxWindCorr=0;'); console.log('WX_WINDCORR: off (stored series)'); }
 const WXC=!!w.eval('wxWindCorrOn()'); if (WXC){ if (process.env.WX_WINDCORR==='1') w.eval('state.wxWindCorr=1;'); if (!w.eval('!!WIND_CORR_TABLE')) throw new Error('WX_WINDCORR: nodal/wind_corr_table.json not loaded'); console.log('WX_WINDCORR: on'); }
 // WX_WINDCORR_TABLE=<json> (message 686 (b); test only): an alternative table in nodal/wind_corr_table.json's format (e.g. the six-constant
 // calm-preserving fit), loaded in its place; needs WX_WINDCORR=1. Recorded in weather.
 const WXT=process.env.WX_WINDCORR_TABLE||null; if (WXT && process.env.WX_WINDCORR!=='1') throw new Error('WX_WINDCORR_TABLE needs WX_WINDCORR=1');
 if (WXT){ const TT=JSON.parse(fs.readFileSync(WXT,'utf8')); if (!(TT.table&&TT.table.length===12&&TT.table.every(r=>r.length===TT.grid.n))) throw new Error('WX_WINDCORR_TABLE: 12 rows of grid.n values');
   w.eval(`WIND_CORR_TABLE = ${JSON.stringify({t:TT.table,n:TT.grid.n})};`); console.log('WX_WINDCORR_TABLE:', WXT, JSON.stringify(TT.constants||{})); }
// THE RUN'S RECORDED SETTINGS (message 707 (a) 5; the data-path review, finding 6): every setting the run recorded that changes the
// engine's result is applied here, before anything reads the weather means, so the check runs on the run's own basis. An environment
// value that disagrees with the recorded one stops the check, unless CHECK_ON names the setting (a deliberate cross-check, e.g. a build
// checked on the stored weather: CHECK_ON=wxWindCorr), which is logged and recorded in every row (recordedSettings). A run that did not
// record a setting is checked on the environment or the page default, as before, and says so.
if (process.env.PAGE_BASIS!==undefined && !['0','1'].includes(process.env.PAGE_BASIS)) throw new Error('PAGE_BASIS must be 0 or 1');
const PAGE_BASIS=process.env.PAGE_BASIS==='1';
const CHECK_ON=(process.env.CHECK_ON||'').split(',').map(x=>x.trim()).filter(Boolean), RECSET={};
const _congRec=(()=>{ try { return P.congestion!=null ? (typeof P.congestion==='string' ? JSON.parse(P.congestion) : P.congestion) : null; } catch(e){ throw new Error('congestion: unreadable recorded value '+P.congestion); } })();
const _trkShRec=(()=>{ try { return P.existPvTrackShare!=null ? (typeof P.existPvTrackShare==='string' ? JSON.parse(P.existPvTrackShare) : P.existPvTrackShare) : null; } catch(e){ throw new Error('existPvTrackShare: unreadable recorded value'); } })();
const recSet=(key, rec, envVal, apply)=>{
  if (rec===undefined||rec===null){ RECSET[key]='not recorded'; return; }
  if (envVal!==undefined && String(envVal)!==String(rec)){
    if (!CHECK_ON.includes(key)) throw new Error(key+': the environment gives '+envVal+', the run recorded '+rec+'; set CHECK_ON='+key+' to check on the environment\'s value');
    RECSET[key]={recorded:rec, checkedOn:envVal}; console.log('CHECK_ON '+key+': checked on '+envVal+', the run recorded '+rec); return; }
  w.eval(apply(rec)); RECSET[key]=rec; };
recSet('wxWindCorr', P.wxWindCorr, process.env.WX_WINDCORR!==undefined?+process.env.WX_WINDCORR:undefined, v=>`state.wxWindCorr=${+v};`);
recSet('solarTrkBasis', P.solarTrkBasis, process.env.SOLAR_TRK_BASIS, v=>`state.solarTrkMeteredBasis=${JSON.stringify(v)}; if (typeof applySolarTrkBasis==='function') applySolarTrkBasis();`);
recSet('existPvMeteredCF', P.existPvMeteredCF, undefined, v=>`state.existPvMeteredCF=${+v};`);
if (_trkShRec && _trkShRec[0]!=null) recSet('existPvTrackShare', _trkShRec[0], undefined, v=>`state.bldExistPvTrackShare=${+v};`); else RECSET.existPvTrackShare='not recorded (page default)';
recSet('coalMslDesignFromYear', P.coalMslDesignFromYear, process.env.COAL_MSL_DESIGN_FROM!==undefined?+process.env.COAL_MSL_DESIGN_FROM:undefined, v=>`state.coalMslDesignFromYear=${+v};`);
recSet('adequacyBasis', P.adequacyBasis, process.env.ADEQ_BASIS, v=>`state.bldAdequacyBasis=${JSON.stringify(v)};`);
if (_congRec){
  recSet('congestionOn', _congRec[0], process.env.CONG_OFF==='1'?false:undefined, v=>`state.congestionCurtailOn=${!!v};`);
  recSet('congestionPct', _congRec[1], undefined, v=>`state.congestionCurtailPct=${+v};`);
  recSet('congestionShape', _congRec[2], process.env.CONG_SHAPE, v=>`state.congestionShape=${JSON.stringify(v)};`);
  recSet('psDayPumpMaxMW', _congRec[3], undefined, v=>`state.psDayPumpMaxMW=${v==null?'null':+v};`);
} else RECSET.congestion='not recorded';
console.log('recorded settings:', JSON.stringify(RECSET));
// PV_TRK_CF=<target> (message 700 (b); a test, not a page setting): new tracking solar scaled hour by hour, clipped at 1, so its
// twelve-year mean equals the target (0.3013: BW6 tracker bids' typical capacity factor, BW6_PV_TRK_BID_CF), the modelled years' twins
// (weatherYearNational) and the metered twin (SOLAR_TRK_K) alike; existing utility solar's tracker share is re-derived, so its level stays
// at existPvMeteredCF. Here: the run's recorded pvTrkCf.target, or PV_TRK_CF; recorded in weather.
 const PVT=process.env.PV_TRK_CF?+process.env.PV_TRK_CF:(P.pvTrkCf?P.pvTrkCf.target:null);
 if (PVT){ w.eval(`{ const T = ${PVT};
  const years = bldWeatherYears.meta.years.map(String), arrs = years.map(y => Float64Array.from(weatherYearNational(y).solar.trk));
  const meanAt = f => { let s = 0, n = 0; for (const a of arrs){ for (let h = 0; h < a.length; h++) s += Math.min(1, f * a[h]); n += a.length; } return s / n; };
  const m0 = meanAt(1); let lo = 0.2, hi = 5; for (let i = 0; i < 60; i++){ const mid = (lo + hi) / 2; if (meanAt(mid) < T) lo = mid; else hi = mid; }
  const f = (lo + hi) / 2, _wyn = weatherYearNational;
  weatherYearNational = function(y){ const r = _wyn(y); if (r && r.solar && r.solar.trk){ const t = r.solar.trk; for (let h = 0; h < t.length; h++) t[h] = Math.min(1, f * t[h]); } return r; };
  SOLAR_TRK_K = SOLAR_TRK_K * f; if (typeof SOLAR_TRK_MAPS !== 'undefined') SOLAR_TRK_MAPS[solarTrkBasis()].K = SOLAR_TRK_K; if (typeof PROFILES !== 'undefined' && PROFILES.solar && PROFILES.solar.trk) delete PROFILES.solar.trk;
  for (const k in _twelveYearCache) delete _twelveYearCache[k]; for (const k in _twelveAllCache) delete _twelveAllCache[k]; _existPvX = null;
  window.__pvTrk = { target: T, f: +f.toFixed(6), m0: +m0.toFixed(6), m1: +bldTwelveYearMeans(1, true).solar.toFixed(6), x: existPvTrackShareAt({ ...FIXED, ...state }) }; }`); console.log('PV_TRK_CF:', w.eval('JSON.stringify(window.__pvTrk)')); }
 // SOLAR_SHIFT_MIN=<minutes> (message 701 (b); a measurement, not a change): the PVGIS years' solar (2014-2023, or SOLAR_SHIFT_YEARS=a-b),
 // fixed tilt and its tracking twin, moved earlier by that many minutes (each hourly value at its interval's centre, linear
 // interpolation), for the lag found against the metered fleet. Recorded in weather.
 const SSHIFT=process.env.SOLAR_SHIFT_MIN?+process.env.SOLAR_SHIFT_MIN:0, SSY=(process.env.SOLAR_SHIFT_YEARS||'2014-2023').split('-').map(Number);
 if (SSHIFT){ w.eval(`{ const S = ${SSHIFT} / 60, Y0 = ${SSY[0]}, Y1 = ${SSY[1]}, _wy = weatherYearNational;
   const mv = a => { const n = a.length, o = new Float64Array(n); for (let h = 0; h < n; h++){ const t = h + S, i = Math.floor(t), f = t - i;
     o[h] = i + 1 < n ? a[i] * (1 - f) + a[i + 1] * f : a[n - 1]; } return o; };
   weatherYearNational = function(y){ const r = _wy(y); if (r && +y >= Y0 && +y <= Y1){ const trk = r.solar.trk, own = r.solar.trkOwn, s2 = mv(r.solar);
       if (trk){ s2.trk = mv(trk); s2.trkOwn = own; } r.solar = s2; } return r; };
   for (const k in _twelveYearCache) delete _twelveYearCache[k]; for (const k in _twelveAllCache) delete _twelveAllCache[k]; _existPvX = null; }`);
   console.log('SOLAR_SHIFT_MIN:', SSHIFT, 'earlier, years', SSY.join('-')); }
 // LULL=<local json> LULL_EVENT=<n> (message 687 (b), 688 (b); a stress test, not probability-weighted, reported apart): one of
 // ESK19679's long metered calms (per unit of the existing fleet, kept out of the repository) written over every modelled year's wind
 // at its own calendar hours; new wind in those hours from the national modern-turbine map of the metered values. Solar, demand and
 // the other hours are the year's own. Recorded in weather.
 const LUL=process.env.LULL||null, LEV=+(process.env.LULL_EVENT||0); let LNAME='';
 if (LUL){ const ev=JSON.parse(fs.readFileSync(LUL,'utf8')).events[LEV]; if (!ev) throw new Error('LULL_EVENT: no event '+LEV); LNAME=ev.name;
   w.eval(`window.__wxNat=(raw=>yy=>{ if (yy==='metered'||yy==='metered_trk12') return raw(yy); const n=raw(yy), E=${JSON.stringify(ev.pu)}, i0=${ev.i0};
     const W=Float64Array.from(n.wind), M=n.wind.mod?Float64Array.from(n.wind.mod):null, EM=windModOf(Float64Array.from(E));
     for (let k=0;k<E.length && i0+k<W.length;k++){ W[i0+k]=E[k]; if (M) M[i0+k]=EM[k]; } if (M) W.mod=M;
     return {...n, wind:W}; })(window.__wxNat);`);
   console.log('LULL:', LNAME, ev.hours+' h from model hour '+ev.i0); }
 if (WX) console.log('WEATHER:', WX);
 // WX_FIX (message 683 (b), (c); measurement only, unset as before): applied to every modelled year the check reads. 'fixed': the two plain
 // errors found on 3 Nov 2026, as an interim. Leap years (2016, 2020, 2024): the fetch scripts kept the first 8,760 hours (ser[:8760]),
 // so 29 February is in and 31 December out; here 29 February is removed and 30 December repeated as 31 December, for wind, the
 // modern-turbine twin, solar and the tracking twin. Clock: Renewables.ninja wind rows are UTC and were read as SAST; wind and its twin
 // move 2 hours later, the first two hours from the previous year's last two (2014 repeats its first hour). 'corrected': 'fixed' plus
 // the wind correction tabulated in WX_TABLE (corrected per-unit output by calendar month on a 0-1 grid; 683 (b)), with new wind on
 // the page's national modern-turbine map of the corrected series. A test variant, not a series; recorded in the output.
 const WXF=process.env.WX_FIX||null; if (WXF && !['fixed','corrected'].includes(WXF)) throw new Error('WX_FIX must be fixed or corrected');
 if (WXF==='corrected' && !process.env.WX_TABLE) throw new Error('WX_FIX=corrected needs WX_TABLE');
 if (WXF){ const TB=WXF==='corrected'?JSON.parse(fs.readFileSync(process.env.WX_TABLE,'utf8')):null;
   if (TB && !(TB.table.length===12 && TB.table.every(r=>r.length===TB.grid.n))) throw new Error('WX_TABLE: 12 rows of grid.n values');
   require('./pathway/wx/wxfix.js')(w, WXF, TB);
   w.eval(`window.__wxNat=(raw=>yy=>(yy==='metered'||yy==='metered_trk12')?raw(yy):__wxFixNat(yy))(window.__wxNat);`);
   console.log('WX_FIX:', WXF, TB?JSON.stringify(TB.constants):'');
   console.log('WX_FIX means (wind, new wind, solar, tracking), twelve years:', w.eval(`(()=>{ const m=a=>a.reduce((s,v)=>s+v,0)/a.length; let W=0,N=0,S=0,T=0; const ys=bldWeatherYears.meta.years.map(String); for (const y of ys){ const n=__wxNat(y); W+=m(n.wind); N+=m(windModOf(n.wind)); S+=m(n.solar); T+=m(solarTrkOf(n.solar)); } return [W,N,S,T].map(v=>(v/ys.length).toFixed(4)).join(', '); })()`)); }
 if (WX==='metered_trk12') console.log('new tracking solar on metered: '+w.eval('(()=>{const t=__wxTrk12(); return t.from.toFixed(4)+" -> "+t.to.toFixed(4)+", x "+t.k.toFixed(4);})()'));
 // GRID (7 Oct 2026, TODO 14ar): the same grid-cost settings as the pathway run.
 w.eval(`if(!('bldGridCost' in FIXED)) throw new Error('bldGridCost missing');`+(process.env.GRID!==undefined?` state.bldGridCost=${+process.env.GRID};`:'')+(process.env.GRID_BEYOND!==undefined?` state.bldGridSpurBeyond=${+process.env.GRID_BEYOND};`:'')+(process.env.GRID_BATTHALF!==undefined?` state.bldGridBattHalf=${+process.env.GRID_BATTHALF};`:''));
 // The share of the integration charge new wind and solar paid in the optimiser (bldGridIntVreShare, 16 Oct 2026), so costGrid
 // carries the same charge. Runs made before 16 Oct record none: the default (1).
 if (P.gridIntVreShare != null) w.eval(`state.bldGridIntVreShare=${+P.gridIntVreShare};`);
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
 // PS_RES_ONCE (message 127 (1)): 1 counts pumped-storage units once in reserve (psResOnce).
 w.eval(`if(!('bldWindModern' in FIXED)) throw new Error('bldWindModern missing');`+(process.env.WINDMOD!==undefined?` state.bldWindModern=${+process.env.WINDMOD};`:'')+(process.env.WIND_CASE!==undefined?` state.bldWindCase=${JSON.stringify(process.env.WIND_CASE)};`:'')+(process.env.WIND_CORR!==undefined?` state.bldWindCorr=${JSON.stringify(process.env.WIND_CORR)};`:'')+(process.env.PV_CASE!==undefined?` state.bldPvCase=${JSON.stringify(process.env.PV_CASE)};`:'')+(process.env.PS_RES_ONCE!==undefined?` state.psResOnce=${+process.env.PS_RES_ONCE};`:''));
 // COSTSET (7 Oct 2026): the same cost set as the pathway run; see pathway/costset.js.
 require('./pathway/costset.js')(w, process.env.COSTSET);
 // The pathway's lithium capex decline (BATT_DECL, 13 Oct 2026) when it recorded one, so the check prices lithium as the optimiser did.
 // From build 2026-10-19b the page's own rate is 3% (was 5%) and runs record the rate they used. A run recorded before 19b
 // with no battDecl was built at 5%: give BATT_DECL so the check prices lithium as its optimiser did (refused otherwise,
 // unless COSTSET, whose table replaces the decline).
 if (P.battDecl==null && !process.env.COSTSET){ if (process.env.BATT_DECL===undefined) throw new Error('the run records no battDecl: it was built at the page default of its build (5% before 2026-10-19b); pass BATT_DECL'); P.battDecl=+process.env.BATT_DECL; }
 else if (P.battDecl!=null && process.env.BATT_DECL!==undefined && +process.env.BATT_DECL!==+P.battDecl) throw new Error('BATT_DECL '+process.env.BATT_DECL+' disagrees with the run\'s battDecl '+P.battDecl);
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
 // From build 2026-10-19b the page's gas defaults are the central case (costCcgt R1,298.42, terminal R530.5/kW-yr); a run with no
 // P.gas (before build 2026-10-09f) was built at R2,003 and no terminal, so both must be given to check it as built.
 if (!PG && (process.env.GAS_FUEL_R===undefined || process.env.GAS_FOM_ADD===undefined)) throw new Error('the run records no gas settings (before build 2026-10-09f): pass GAS_FUEL_R and GAS_FOM_ADD (2003 and 0 as it was built)');
 const GFR=PG ? PG.fuelRFlat : (process.env.GAS_FUEL_R ? +process.env.GAS_FUEL_R : null), GFA=PG ? PG.fomAdd : +(process.env.GAS_FOM_ADD||0);
 if (GFR!=null) w.eval(`if(!('costCcgt' in state)) throw new Error('costCcgt missing'); state.costCcgt=${GFR};`);
 // The LNG terminal charge is the page constant bldGasTerminalRkW from build 2026-10-19b (was an addition to BLD_FOM): set to
 // the run's own, 0 included, so a run without one is not charged the new default.
 w.eval(`if(!('bldGasTerminalRkW' in FIXED)) throw new Error('FIXED.bldGasTerminalRkW missing'); state.bldGasTerminalRkW=${+GFA};`);
 const Y=Object.keys(P.sched).map(Number); const cum={wind:0,pv:0,rooftop:0,batt:0,battMWh:0,vrfb:0,ironair:0,ccgt:0,off:0,phes:0,phel:0,ocgt:0,ocgd:0,gfm:0,scc:0,scn:0};
 // Open-cycle gas (build 2026-10-11f): the pathway's capex case, so the engine charges what the optimiser charged.
 if (P.ocgt && P.ocgt.costCase) w.eval(`state.bldOcgtCostCase=${JSON.stringify(P.ocgt.costCase)};`);
 // GAS_CAPEX (7 Oct 2026): CCGT capex at 2026, R/kW, for the IRP-capex sensitivity; read by engine and optimiser alike.
 // The pathway's cost-of-capital case (build 2026-10-28a, messages 468 and 469), so capital is charged at the rates the optimiser
 // used. A run file without one was built before 2026-10-28a, at one rate for all and no interest during construction: check it
 // on its own commit. NUC_CAPEX_USD (nuclear's high capex case, USD 12,000) and NUC_LIFE (its 60-year sensitivity) recompute new
 // nuclear's capital charge in that case.
 if (P.cocCase==null) throw new Error('the run records no cocCase: it was built before build 2026-10-28a; check it on its own commit');
 // The case applied is the page's case whose rates equal the run's recorded cocRates for every technology (user, 4 Nov 2026, message
 // 692 (a)): build 2026-11-02r renamed the cases (the old 'central', solar and wind at 5.5%, is today's 'allbids'), so a run recorded
 // before it under 'central' is checked at the rates it was built on, not today's 'central' (6.0%). The recorded name is tried first;
 // a run whose rates no case reproduces is refused. A run recorded without cocRates keeps its recorded name, as before. NUC_LIFE
 // (nuclear's life sensitivity) changes nuclear's rate on purpose, so nuclear is left out of the comparison when it is set.
 const NUC_ARGS=`${process.env.NUC_CAPEX_USD?+process.env.NUC_CAPEX_USD:'undefined'}, ${process.env.NUC_LIFE?+process.env.NUC_LIFE:'undefined'}`;
 let COC_USED=P.cocCase;
 if (P.cocRates){ const CASES=['central','private','high','low','planning','blended','blendedhigh','allbids'];
   const off=c=>JSON.parse(w.eval(`(()=>{ bldApplyCocCase(${JSON.stringify(c)}, ${NUC_ARGS}); const R=${JSON.stringify(P.cocRates)}, bad=[];
     for (const t of Object.keys(R)){ if (${process.env.NUC_LIFE?'true':'false'} && t==='nuclear') continue; if (!(t in BLD_COC_GROUP)){ bad.push(t+' not on the page'); continue; }
       const v=+bldAnnuityRate(t).toFixed(4); if (Math.abs(v-R[t])>1e-9) bad.push(t+' '+v+' against '+R[t]); } return JSON.stringify(bad); })()`));
   const first=off(P.cocCase); if (first.length){ COC_USED=null;
     for (const c of CASES.filter(c=>c!==P.cocCase)) if (!off(c).length){ COC_USED=c; break; }
     if (!COC_USED) throw new Error('no cost-of-capital case reproduces the run\'s recorded cocRates (as recorded, '+P.cocCase+': '+first.join('; ')+'); check it on its own commit');
     console.log('cost of capital: the run recorded '+P.cocCase+' at rates today\'s '+P.cocCase+' does not give ('+first.join('; ')+'); applying '+COC_USED+', whose rates equal the recorded ones'); } }
 if (process.env.COC!==undefined && process.env.COC!==P.cocCase && process.env.COC!==COC_USED) throw new Error('COC '+process.env.COC+' disagrees with the run\'s cocCase '+P.cocCase);
 w.eval(`bldApplyCocCase(${JSON.stringify(COC_USED)}, ${NUC_ARGS});`);
 if (process.env.NUC_CAPEX_USD||process.env.NUC_LIFE) console.log('nuclear capital charge', w.eval('state.acapNuclear'), 'R/kW-yr');
 // NUC_ACAP (message 415 (a)): new nuclear's capital charge, R/kW-yr, for the IRP pair's high-cost nuclear check (no LP: the
 // build is the run file's own).
 if (process.env.NUC_ACAP) w.eval(`if(!('acapNuclear' in FIXED)) throw new Error('acapNuclear missing'); FIXED.acapNuclear=${+process.env.NUC_ACAP}; if (typeof state!=='undefined') state.acapNuclear=${+process.env.NUC_ACAP};`), console.log('NUC_ACAP', process.env.NUC_ACAP);
 if (process.env.GAS_CAPEX) w.eval(`if(!('ccgt' in BLD_COST)) throw new Error('BLD_COST.ccgt missing'); BLD_COST.ccgt.c2026=${+process.env.GAS_CAPEX};`);
 // Imports end year (TODO 14dv (6)): the pathway's own, so the engine runs without imports where the optimiser did.
 // From build 2026-10-23a (c6 PR B) the page's default is 2030 and a run records its year, 0 included; a run recorded before then
 // has null for 'no end year', its default then, so null means 0 here rather than the page's new default.
 w.eval(`state.importsEndYear=${P.importsEndYear == null ? 0 : +P.importsEndYear};`);
 // NTCSA MTSAO inputs (user, 2 Nov 2026, message 618/619; TODO 14me): the run's coal availability path, Avon and Dedisa's removal year
 // and REIPPPP retirements (pathway_perfail.js COAL_EAF_PATH, AVDED_OFF_AFTER, REIPPP_RETIRE), applied by the engine through each
 // year's scenarioYear. A run recorded before build 2026-11-02h has none of the three keys and predates the options: all off.
 { const has = ['coalEafByYear', 'avonDedisaRemoveAfter', 'reipppRetireByYear'].filter(k => k in P);
   if (has.length && has.length !== 3) throw new Error('the run records only some of coalEafByYear, avonDedisaRemoveAfter, reipppRetireByYear: '+has.join(', '));
   w.eval(`if(!('coalEafByYear' in FIXED) || !('avonDedisaRemoveAfter' in FIXED) || !('reipppRetireByYear' in FIXED)) throw new Error('coalEafByYear, avonDedisaRemoveAfter or reipppRetireByYear missing');`
     +` state.coalEafByYear=${JSON.stringify(P.coalEafByYear ?? null)}; state.avonDedisaRemoveAfter=${+(P.avonDedisaRemoveAfter || 0)}; state.reipppRetireByYear=${JSON.stringify(P.reipppRetireByYear ?? null)};`);
   if (P.coalEafByYear || P.avonDedisaRemoveAfter || P.reipppRetireByYear) console.log('MTSAO inputs from the pathway: coal availability', JSON.stringify(P.coalEafByYear), 'Avon and Dedisa out after', P.avonDedisaRemoveAfter || 'never', 'REIPPPP retired', JSON.stringify(P.reipppRetireByYear)); }
 // Behind-the-meter batteries and the virtual power plant (HANDOVER 'Behind-the-meter batteries and virtual power plants, minimum
 // version: design'; messages 621-625): the run's own settings, recorded by pathway_perfail.js (P.btm). A run recorded before build
 // 2026-11-02i has none and ran with both off, the page default, so nothing is set. With the virtual power plant on, each year's
 // enrolled energy is the run's sched[y].vppGWh (below).
 const BTM_VPP = !!(P.btm && (P.btm.vppBuildOn | 0) > 0);
 // vppEvents and vppEventHours (withdrawn in build 2026-11-02s, message 637) are dropped from a run made with the virtual power plant
 // off; a run made with it on used the event rule and is refused (check it on its own commit).
 if (P.btm){ const BT={...P.btm}; for (const k of ['vppEvents','vppEventHours']) if (k in BT){ if ((BT.vppBuildOn|0)>0) throw new Error('the run used the withdrawn VPP event rule ('+k+'): check it on its own commit'); delete BT[k]; }
   // A run recorded before build 2026-11-02v (message 645) has no vppCostCase and carried the participant cost as vppCostUsdKwYr:
   // checked as it ran, under 'participant' (that cost, no wear beyond the LP's own).
   if ('vppCostUsdKwYr' in BT && !('vppCostCase' in BT)){ BT.vppCostCase = 'participant';
     if (Math.abs(+BT.vppCostUsdKwYr - +w.eval('VPP_COST_USD_KW_YR.participant')) < 1e-9) BT.vppCostUsdKwYr = null; }
   w.eval(`for (const k of ${JSON.stringify(Object.keys(BT))}) if (!(k in FIXED)) throw new Error('FIXED.'+k+' missing: build 2026-11-02i or later'); Object.assign(state, ${JSON.stringify(BT)});`);
   console.log('behind-the-meter batteries and virtual power plant from the pathway:', JSON.stringify(P.btm)); }
 // Geyser control (messages 633-635): the run's own settings (P.geyser), recorded by pathway_perfail.js; a run recorded before build
 // 2026-11-02q has none and ran with it off. With it on, each year's enrolled MW is the run's sched[y].gyMW (below).
 const GY_RUN = !!(P.geyser && (P.geyser.gyBuildOn | 0) > 0);
 if (P.geyser){ w.eval(`for (const k of ${JSON.stringify(Object.keys(P.geyser))}) if (!(k in FIXED)) throw new Error('FIXED.'+k+' missing: build 2026-11-02q or later'); Object.assign(state, ${JSON.stringify(P.geyser)});`);
   console.log('geyser control from the pathway:', JSON.stringify(P.geyser)); }
 // Coal settings (PR C, build 2026-10-24a; messages 359, 363): the pathway's own; a run recorded before PR C has none and replays with
 // COAL_PRE_C, the coal rules its optimiser and engine had.
 w.eval(`Object.assign(state, ${JSON.stringify(P.coal || null)} || COAL_PRE_C);`);
 // Congestion and pumping tests (message 690; off by default): CONG_OFF=1 no flat congestion curtailment; CONG_SHAPE=tech the same energy
 // in its recorded hours by technology; PS_DAY_CAP=<MW> pumped storage's pumping from a surplus at 09:00-16:59 capped. Recorded in weather.
 const C690=[]; if (process.env.CONG_OFF==='1'){ w.eval('state.congestionCurtailOn=false;'); C690.push('congestion off'); }
 if (process.env.CONG_SHAPE){ if (process.env.CONG_SHAPE!=='tech') throw new Error('CONG_SHAPE must be tech'); w.eval("state.congestionShape='tech';"); C690.push('congestion shaped'); }
 if (process.env.PS_DAY_CAP){ const c=+process.env.PS_DAY_CAP; if (!(c>=0)) throw new Error('PS_DAY_CAP: MW'); w.eval(`state.psDayPumpMaxMW=${c};`); C690.push('daytime pumping <= '+c+' MW'); }
 // COAL_MSL_DESIGN_FROM=<year> (message 688 (a); a sensitivity, test only): the coal practice floor ends before this year instead of the
 // run's recorded coalMslDesignFromYear (2030), e.g. 2027 or 2028 for a market start in April 2027. Recorded in weather.
 const CMD=process.env.COAL_MSL_DESIGN_FROM?+process.env.COAL_MSL_DESIGN_FROM:null; if (CMD){ if (!(CMD>=2026&&CMD<=2040)) throw new Error('COAL_MSL_DESIGN_FROM: a year'); w.eval(`state.coalMslDesignFromYear=${CMD};`); console.log('COAL_MSL_DESIGN_FROM:', CMD); }
 // System strength (build 2026-11-02a; FIXED.ssMode): the run's own mode and settings (P.ss, pathway_perfail.js SS, ROCOF, SS_FLAT_GWS,
 // GFM_H, SS_LIFT, SS_FC, FAULT); a run recorded before has none and is checked on 'sync6', the 6 GW floor it was built with. Under 'inertia'
 // each year's grid-forming MW and condenser MVA built to it reach the engine (ssGfmMW, ssCondMVA), and the row reports the floor.
 // Grid-forming H is the run's recorded effective value (gfmH): a run recorded before build 2026-11-02n with ssGfmH null was built on
 // 1.891 s, the central then (11 s from 2026-11-02n, message 631 (b)).
 const SSR = P.ss || { mode: 'sync6', fault: 'off' };
 w.eval(`if(!('ssMode' in FIXED)) throw new Error('ssMode missing'); state.ssMode=${JSON.stringify(SSR.mode)}; state.ssFault=${JSON.stringify(SSR.fault || 'off')};`
   + (SSR.mode === 'inertia' ? ` state.ssRocofHz=${+SSR.rocofHz}; state.ssFlatGWs=${SSR.flatGWs == null ? 'null' : +SSR.flatGWs}; state.ssGfmH=${SSR.gfmH != null ? +SSR.gfmH : SSR.gfmHSet == null ? 'null' : JSON.stringify(SSR.gfmHSet)}; state.ssCoalLift=${SSR.coalLift == null ? 1 : +SSR.coalLift};` + (SSR.liftForecast ? ` state.ssLiftForecast=${JSON.stringify(SSR.liftForecast)};` : '') : ''));
 const SS_ON = SSR.mode === 'inertia';
 // SS_FC=prev|mustspin (user, 1 Nov 2026, message 610 (c)): check a run under another lift forecast than it recorded, the engine's only;
 // the build LP does not read it. 'reservecoal' is c7's central (FIXED, message 616), 'mustspin' the cautious sensitivity. Recorded in each row (ssLiftForecast).
 if (process.env.SS_FC !== undefined){ if (!SS_ON) throw new Error('SS_FC needs an inertia run'); if (!['prev','mustspin','reserve','reservecoal'].includes(process.env.SS_FC)) throw new Error('SS_FC must be prev, mustspin, reserve or reservecoal: '+process.env.SS_FC);
   w.eval(`state.ssLiftForecast=${JSON.stringify(process.env.SS_FC)};`); console.log('lift forecast for this check:', process.env.SS_FC); }
 const SS_FC_USED = SS_ON ? w.eval('state.ssLiftForecast ?? FIXED.ssLiftForecast') : null;
 if (SS_ON || SSR.fault !== 'off') console.log('system strength from the pathway:', JSON.stringify(SSR));
 if (SS_ON && !SSR.reqTripped && SSR.flatGWs == null) console.log('note: the run was built on a requirement without the inertia of the units lost (before build 2026-11-02n); this check uses the page\'s, which includes it (message 631 (a))');
 if (SS_ON && SSR.lambda && JSON.stringify(SSR.lambda) !== w.eval('JSON.stringify(SS_COAL_LAMBDA)')) console.log('note: the run\'s SS_COAL_LAMBDA', JSON.stringify(SSR.lambda), 'differs from the page\'s (the build LP\'s coal credit; the engine does not read it)');
 // Imports flow and the flat demand block (user, 14 Oct 2026, message 72): the pathway's own, where it recorded them.
 // Koeberg's monthly shape (message 376 (b)): the run's own, so s_koeberg_winter is checked on the shape it was built on.
 if (P.nuclearShape){ w.eval(`state.nuclearMonthlyShape=${JSON.stringify(P.nuclearShape)};`); console.log('Koeberg monthly shape from the pathway:', JSON.stringify(P.nuclearShape)); }
 if (P.importsMW != null) w.eval(`state.importsMW=${+P.importsMW};`);
 if (P.importsCF != null) w.eval(`state.importsCF=${+P.importsCF};`);
 const BLK = (P.demand && P.demand.block) ? P.demand.block : null;
 if (BLK) console.log('demand block from the pathway:', JSON.stringify(BLK));
 // Coal sustaining capital (s_coalsustain, message 429): the pathway's own add-on to fomCoal, R/kW-yr.
 // Coal cost paths (messages 651 and 653): the run's own coalFuelEscPct, coalFomEscPct and coalFomAgeOn (P.coalCost, from build
 // 2026-11-02x); the engine escalates coal fuel and the base fixed cost to each check year. A run without them ran flat.
 if (P.coalCost){ w.eval(`for (const k of ${JSON.stringify(Object.keys(P.coalCost))}) if (!(k in FIXED)) throw new Error('FIXED.'+k+' missing: build 2026-11-02x or later'); Object.assign(state, ${JSON.stringify(P.coalCost)});`); console.log('coal cost paths from the pathway:', JSON.stringify(P.coalCost)); }
 if (P.coalFomAdd) { w.eval(`if(!('fomCoal' in FIXED)) throw new Error('fomCoal missing'); state.fomCoal=FIXED.fomCoal+${+P.coalFomAdd};`); console.log('coal fixed cost add-on from the pathway:', P.coalFomAdd); }
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
 // tariffCfBasis (message 158 (4)): the capacity factor wind and solar capex were backed out at; runs before 16 Oct record none (bid).
 for (const [k, env, st] of [['windCorr', 'WIND_CORR', 'bldWindCorr'], ['windCase', 'WIND_CASE', 'bldWindCase'], ['pvCase', 'PV_CASE', 'bldPvCase'], ['tariffCfBasis', 'TARIFF_CF', 'bldTariffCfBasis']]){
   if (P[k] == null) continue;
   if (process.env[env] !== undefined && process.env[env] !== P[k]) throw new Error(env+' '+process.env[env]+' disagrees with the run\'s '+k+' '+P[k]);
   w.eval(`state.${st}=${JSON.stringify(P[k])};`); console.log(k+' from the pathway:', P[k]); }
 // Runs recorded before build 2026-10-16f carry no tariffCfBasis and were all built on 'bid'; from 16h the default is 'run', so
 // they are checked on 'bid' (or on TARIFF_CF if given), never on the new default (message 161).
 if (P.tariffCfBasis == null){ const b = process.env.TARIFF_CF || 'bid'; w.eval(`state.bldTariffCfBasis=${JSON.stringify(b)};`); console.log('tariffCfBasis: none recorded, checked on', b); }
 // The 2026 wind and solar capex the check prices new build at (message 127 (2)), set beside the optimiser's in each row.
 const CAPEX26={wind:+w.eval("bldCapex('wind', 2026)"), pv:+w.eval("bldCapex('pv', 2026)")};
 console.log('capex 2026, engine check:', JSON.stringify(CAPEX26), 'optimiser:', JSON.stringify(P.capex2026||null));
 if (P.capex2026 && (Math.abs(P.capex2026.wind-CAPEX26.wind)>0.01 || Math.abs(P.capex2026.pv-CAPEX26.pv)>0.01)) throw new Error('capex differs from the optimiser\'s: '+JSON.stringify(CAPEX26)+' against '+JSON.stringify(P.capex2026));
 // LCOE=1 (29 Oct 2026, message 487 (2)): the LCOE anchor notes' run-based figures (LCP_2030_*), per run: lithium discharge (E.batt,
 // MWh) over the lithium energy in service (new MW x hours plus the existing fleet); diesel output over the diesel fleet
 // (FIXED.ocgtDieselMW plus new diesel open-cycle) x 8,760; new-wind output as the engine's wind output split pro rata between
 // the new fleet's uncurtailed potential on its profile (the modern twin with the run's correction, capped at 1 per unit) and the
 // existing fleet's on the national profile, over new wind MW x 8,760. Written to the row as r.lcoe; nothing else changes.
 const LCOE_ON=process.env.LCOE?'true':'false';
 const rows=[];
 for (const y of Y){ for (const k of Object.keys(cum)) cum[k]+=P.sched[y][k]||0; cwCum+=P.sched[y].cw||0; for (const [t,v] of Object.entries(P.sched[y].rp||{})) rpCum[t]=(rpCum[t]||0)+v;   // every year to y, before the YEARS filter, as cum (message 693 (h); was in the GRID block, after it)
   // YEARS=2036,2037 (8 Oct 2026, TODO 14bk): check only these years; builds of the skipped years still accumulate.
   if (process.env.YEARS && !process.env.YEARS.split(',').map(Number).includes(y)) continue;
   // The pathway's own demand path when it recorded one (DEMAND, 9 Oct 2026); else the legacy DEM to 2040.
   const frac=(y-2026)/(2040-2026), dg=(P.demand && P.demand.index) ? (P.demand.index[y]-1)*100 : (Math.pow(1+DEM/100,frac)-1)*100;
   const over={...(PG && PG.fuelR ? {costCcgt:PG.fuelR[y]} : {}),newWindMW:cum.wind,newPvMW:cum.pv,newRooftopMW:cum.rooftop,newBattMW:cum.batt,newBattHours:cum.batt>0?Math.max(1,Math.min(20,cum.battMWh/cum.batt)):4,
     newVrfbMW:cum.vrfb,newIronAirMW:cum.ironair,newCcgtMW:cum.ccgt,newOcgtMW:cum.ocgt,newOcgdMW:cum.ocgd,newOffshoreMW:cum.off,newNuclearMW:+w.eval(`bldNuclearAddedMW({bldNuclearAdd:${JSON.stringify(P.nuclearAdd||null)}},${y})`),newPsMW:cum.phes,newPsHours:+(process.env.PH||14),coalDecomMW:Math.max(0,Math.round(w.eval('FIXED.coalInstalledMW')-P.sched[y].coalMW)),
     demandGrowthPct:dg,demandBlockMW:BLK ? +w.eval(`bldDemandBlockMW({demandBlock:${JSON.stringify(BLK)}},${y})`) : 0,windCapeMW:cwCum,scenarioYear:y, carbonTaxRPerT: CTAX(y)};
   if (SS_ON){ over.ssGfmMW=cum.gfm; over.ssCondMVA=cum.scc+cum.scn; }
   // The engine's grid charge on the LP's basis (message 710 (c)): with the optimiser's grid cost on, the run's own use of connections
   // freed by retired coal (rp, by technology) and its wind on the Cape allowance; and its new build by vintage (710 (e)), each year's MW
   // as the schedule built them, so the engine prices each at its own year's capex.
   // PAGE_BASIS=1 (message 710 (e)): price as the page prices a preset, a single state: new build at the midpoint vintage and the freed
   // connections by the page's rule (gridChargeR without the run's pool use). The preset engine checks run so, so that the page and its
   // check are on one basis (harness/validate_pathway_presets.js); a pathway's own engine check prices by vintage on its own pool use.
   if (!PAGE_BASIS){
     if (GRID_ON){ over.gridRpMW={...rpCum}; over.gridCapeMW=cwCum; }
     const V={}; for (const yy of Y) if (yy<=y) for (const [k,t] of [['wind','wind'],['pv','pv'],['rooftop','rooftop'],['batt','batt'],['vrfb','vrfb'],['ironair','ironair'],['ccgt','ccgt'],['ocgt','ocgt'],['ocgd','ocgd'],['off','offshore']]){
       const m=+P.sched[yy][k]||0; if (m>0) (V[t]=V[t]||{})[yy]=m; }
     over.bldVintageMW=V; }
   if (PEAK_ON){ if (P.sched[y].dslDecomMW===undefined) throw new Error('PEAK set but the schedule has no dslDecomMW'); over.dieselDecomMW=P.sched[y].dslDecomMW; }
   if (GY_RUN){ if (!(P.sched[y].gyMW>=0)) throw new Error('the run has geyser control on but no sched['+y+'].gyMW'); over.gyEnrolMW=P.sched[y].gyMW; }
   if (BTM_VPP){ if (!(P.sched[y].vppGWh>=0)) throw new Error('the run has the virtual power plant on but no sched['+y+'].vppGWh'); over.vppEnrolGWh=P.sched[y].vppGWh; }
   // STORAGE LOOK-AHEAD (user, 3 Nov 2026, message 666 (e)): LA_H sets the short stores' window (FIXED.storageLookaheadH, 48 h) and
   // LDES_LA_H the long stores' (ldesLookaheadH, 168 h when unset); both are perfect forecasts within the window. Measurement only.
   if (process.env.LA_H!==undefined){ if (!(+process.env.LA_H>=0)) throw new Error('LA_H must be 0 or more hours'); over.storageLookaheadH=+process.env.LA_H; }
   // Self-discharge as the run recorded it (storeSelfDischargePctDay; design note version 2, 3.2): the engine decays each store hourly.
   if (P.selfDischarge) over.storeSelfDischargePctDay = P.selfDischarge;
   // PS_LA_H (design note version 2, 3.5; message 673 (i); measurement only): pumped storage's charge target on a forecast this many hours
   // ahead (the engine's psLookaheadH) in place of the longest store's horizon.
   if (process.env.PS_LA_H!==undefined){ if (!(+process.env.PS_LA_H>=1)) throw new Error('PS_LA_H must be 1 hour or more'); over.psLookaheadH=+process.env.PS_LA_H; }
   if (process.env.LDES_LA_H!==undefined){ if (!(+process.env.LDES_LA_H>=1)) throw new Error('LDES_LA_H must be 1 hour or more'); over.ldesLookaheadH=+process.env.LDES_LA_H; }
   // FOSSIL_END (message 531 (c)): after the run's last fossil year no coal (its coalMW is 0 from its dates), no gas and no diesel stand.
   if (P.fossilEnd && y > P.fossilEnd){ if (over.coalDecomMW < +w.eval('FIXED.coalInstalledMW')) throw new Error('fossilEnd: coal standing in '+y);
     Object.assign(over, {newCcgtMW:0, newOcgtMW:0, newOcgdMW:0, dieselDecomMW:+w.eval('FIXED.ocgtDieselMW')}); }
   // FLEET_2026 (message 391 (a)): the run's 2026 existing-fleet adjustment, recorded by pathway_perfail.js, in 2026 only.
   if (y===2026 && P.fleet2026) for (const [k,d] of Object.entries(P.fleet2026)){ over[k]=+w.eval('FIXED.'+k)+d; console.log('FLEET_2026: '+k+' '+over[k]+' MW in 2026'); }
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
     const ann=h=>+w.eval(`bldAnnuity(bldPhesCapexKW('${B}',${h}),60,'phes')+FIXED.bldPhesFomRkW`), P1=cum.phes, P2=cum.phel;
     over.newPsMW=P1+P2; over.newPsHours=(H*P1+H2*P2)/(P1+P2); over.newPsMaxMW=1e7; over.acapPs=(ann(H)*P1+(P2>0?ann(H2)*P2:0))/(P1+P2); }
   // The vintage map against what stands this year (after FOSSIL_END and the rest): a technology the run stands down to 0 MW (gas and
   // diesel after its last fossil year) leaves the map, as the LP charges no capital on it then; any other mismatch stops the check.
   if (over.bldVintageMW){ const KEY={wind:'newWindMW',pv:'newPvMW',rooftop:'newRooftopMW',batt:'newBattMW',vrfb:'newVrfbMW',ironair:'newIronAirMW',ccgt:'newCcgtMW',ocgt:'newOcgtMW',ocgd:'newOcgdMW',offshore:'newOffshoreMW'};
     for (const t of Object.keys(over.bldVintageMW)){ const sum=Object.values(over.bldVintageMW[t]).reduce((a,b)=>a+b,0), mw=+over[KEY[t]]||0;
       if (mw===0) delete over.bldVintageMW[t]; else if (Math.abs(sum-mw)>0.5) throw new Error('vintage map: '+t+' '+sum+' MW built against '+mw+' MW standing in '+y); } }
   const batch=(k0,k1)=>JSON.parse(w.eval(`(function(){ const o=[]; for (const yy of __wxYears()){ const nat=__wxNat(yy);
      for(let k=${k0};k<${k1};k++){ const st={...state,...${JSON.stringify(over)},outageSeed:${SEED_BASE}+k*104729+__wxSeed(yy)*7919};
       const x=simulate(st,{demand:PROFILES.demand,solar:nat.solar,wind:nat.wind,...(nat.solarTrk?{solarTrk:nat.solarTrk}:{}),csp:PROFILES.csp,real:true});
       let dem=0, chg=0; for(let i=0;i<x.loadS.length;i++){ dem+=x.loadS[i]; chg+=(x.chargePsMW?x.chargePsMW[i]||0:0)+(x.chargeBattMW?x.chargeBattMW[i]||0:0); }
       o.push([x.E.unserved/1e3,x.systemCostR/1e9,x.E.curtailed/1e6,dem*0.00002/1e3,x.co2,x.E.coal/1e6,x.E.diesel/1e6,(x.systemCostR-x.btmCapexR)/1e9,(x.E.ccgt||0)/1e6,(()=>{let n=0;for(let i=0;i<x.stack.ccgt.length;i++) if(x.stack.ccgt[i]>1) n++; return n;})(),x.caps.ccgtCap,(()=>{const g=x.stack.ccgt,W=14*24;let s=0,m=0;for(let i=0;i<g.length;i++){s+=g[i];if(i>=W)s-=g[i-W];if(s>m)m=s;}return m/1e3;})(),x.avgCost,x.gridServed/1e6,(dem-chg)*0.00002/1e3,{cfm:(x.coalFuelMWh===undefined?null:x.coalFuelMWh),cg:x.E.coal||0,fl:x.ccgtFloorFleetMWh||0,tg:x.ccgtFloorTargetMWh||0,un:x.ccgtFloorUnmetMWh||0,gas:x.E.ccgt||0,ocE:(x.E.diesel||0)+(x.ocgtMWh||0),ocCap:dieselAvailMW(applyYearFleetOptions({...FIXED,...st}))+Math.max(0,st.newOcgtMW||0),...(()=>{ const c=x.coalCommittedMW; if (!c) return {}; let s=0,m=Infinity; for(let i=0;i<c.length;i++){ s+=c[i]; if(c[i]<m) m=c[i]; } return {cmMean:s/c.length, cmMin:m}; })(),...(x.ss?{ssReq:x.ss.reqGWs,ssMin:x.ss.minGWs,ssSyncMin:x.ss.syncMinGWs,ssP5:x.ss.p5GWs,ssShortH:x.ss.shortH,ssShortGWsH:x.ss.shortGWsH,ssLiftH:x.ss.liftH,ssLiftMWh:x.ss.liftMWh,ssLiftFloorMWh:x.ss.liftFloorMWh,ssResH:x.ss.resH||0,ssResMWh:x.ss.resMWh||0, ssCoalFirstH:x.ss.coalFirstH||0,ssLiftCappedH:x.ss.liftCappedH}:{}),...(x.btm?{btmStock:x.btm.stockGWh,btmDemChg:x.btm.demandChangeGWh,vppMW:x.btm.vppMW||0,vppDis:x.btm.vppDischargeMWh||0,vppInc:x.btm.vppIncrementalDischargeMWh||0,vppCost:x.btm.vppCostR||0,vppWear:x.btm.vppWearR||0}:{}),...(x.geyser?{gyMW:x.geyser.enrolledMW,gyRed:x.geyser.reducedGWh,gyCost:x.geyser.costR}:{}),...(${LCOE_ON}?{bd:x.E.batt||0,bE:(st.newBattMW||0)*(st.newBattHours||4)+FIXED.battPowerMW*FIXED.battHours,wd:x.E.wind||0,wn:(()=>{const N=st.newWindMW||0; if(!N) return 0; const on=((st.bldWindModern??FIXED.bldWindModern)|0)>0, T=on?windModOf(nat.wind):nat.wind, kc=on?windNewCorr(st.bldWindCorr??FIXED.bldWindCorr):1; let q=0; for(let h=0;h<T.length;h++) q+=Math.min(1,kc*T[h]); return N*q;})(),we:(()=>{let q=0; for(let h=0;h<nat.wind.length;h++) q+=nat.wind[h]; const rt=reipppRetiredMW(st.scenarioYear,{...FIXED,...st}); return ((st.windMW||FIXED.windMW)-(rt?rt.wind:0))*q;})(),ds:x.E.diesel||0,dc:(FIXED.ocgtDieselMW||0)-avonDedisaOffMW({...FIXED,...st},st.scenarioYear)+(st.newOcgdMW||0)}:{})},((x.E.wind||0)+(x.E.pv||0))/1e6,{wy:String(yy),ps:(x.E.ps||0)/1e6,li:x.battTierTWh?x.battTierTWh.li:null,vrfb:x.battTierTWh?x.battTierTWh.vrfb:null,fe:x.battTierTWh?x.battTierTWh.fe:null}]); } }
      return JSON.stringify(o); })()`));
   // LEVELS_OUT=<file> (design note version 2, test 4; message 673 (h); measurement only): each long store's level at the end of every day
   // (iron-air fe, vanadium vrfb, pumped storage ps, MWh), by weather year, from the first draw's seed, one JSON line per checked year.
   if (process.env.LEVELS_OUT){ const lev=JSON.parse(w.eval(`(function(){ const o={}; for (const yy of __wxYears()){ const nat=__wxNat(yy);
       const st={...state,...${JSON.stringify(over)},outageSeed:${SEED_BASE}+__wxSeed(yy)*7919};
       const x=simulate(st,{demand:PROFILES.demand,solar:nat.solar,wind:nat.wind,...(nat.solarTrk?{solarTrk:nat.solarTrk}:{}),csp:PROFILES.csp,real:true});
       const day=a=>a?Array.from({length:365},(_,d)=>Math.round(a[d*24+23])):null;
       o[yy]={fe:day(x.socByTier&&x.socByTier.fe),vrfb:day(x.socByTier&&x.socByTier.vrfb),ps:day(x.socPs)}; }
     return JSON.stringify(o); })()`));
     fs.appendFileSync(process.env.LEVELS_OUT, JSON.stringify({year:y, levels:lev})+'\n'); }
   // HOD_OUT=<file> (message 704 (i); measurement only): unserved energy by hour of day (SAST) and by month, summed over the runs, from
   // the check's own draws (K draws a weather year, 10 if K is unset; the same seeds), one JSON line per checked year. Unset: no change.
   if (process.env.HOD_OUT){ const KH=+(process.env.K||10); const hod=JSON.parse(w.eval(`(function(){ const H=new Array(24).fill(0), M=new Array(12).fill(0);
       const ms=[0,744,1416,2160,2880,3624,4344,5088,5832,6552,7296,8016,8760]; let n=0, tot=0;
       for (const yy of __wxYears()){ const nat=__wxNat(yy);
         for(let k=0;k<${KH};k++){ const st={...state,...${JSON.stringify(over)},outageSeed:${SEED_BASE}+k*104729+__wxSeed(yy)*7919};
           const x=simulate(st,{demand:PROFILES.demand,solar:nat.solar,wind:nat.wind,...(nat.solarTrk?{solarTrk:nat.solarTrk}:{}),csp:PROFILES.csp,real:true});
           const u=x.stack.unserved; let m=0; for(let i=0;i<u.length;i++){ while(i>=ms[m+1]) m++; const v=u[i]||0; if(v>0){ H[i%24]+=v; M[m]+=v; tot+=v; } } n++; } }
       return JSON.stringify({runs:n, totalGWh:tot/1e3, byHourGWh:H.map(v=>+(v/1e3).toFixed(4)), byMonthGWh:M.map(v=>+(v/1e3).toFixed(4))}); })()`));
     fs.appendFileSync(process.env.HOD_OUT, JSON.stringify({year:y, ...hod})+'\n'); }
   // REPORTED SHED, 8 Oct 2026 (user): K unset draws in batches of 10 (120 runs) until the 95% interval of the mean shed
   // is within +/-20% of the target (TF x the 0.002% standard), at most 40 draws (480 runs). K set: exactly K draws.
   // AVERAGE COST PER MWH SERVED (user, 11 Oct 2026): the engine's avgCost (grid cost, rooftop capex and the shed
   // penalty excluded, export revenue netted, as the app) over its gridServed, served-weighted across runs.
   // THE RUN'S OWN STANDARD (user decision, 25 Oct 2026, message 373): a run recorded with a standard (pathway_perfail.js STD) is judged
   // by it: NTCSA's 20 GWh a year as an absolute target, or targetFrac x the 0.002% standard; TF applies only to runs recorded
   // before it, and a TF that disagrees with the recorded standard is an error.
   const STDR=P.standard||null;
   if (STDR && process.env.TF!==undefined && STDR.targetFrac!=null && +process.env.TF!==STDR.targetFrac) throw new Error('TF '+process.env.TF+' disagrees with the run\'s standard '+JSON.stringify(STDR));
   const TFR=STDR&&STDR.targetFrac!=null?STDR.targetFrac:+(process.env.TF||0.5), TGWH=STDR&&STDR.targetGWh!=null?STDR.targetGWh:null, KMAX=+(process.env.KMAX||40), KSTEP=10;
   // The per-run object (gas floor, LCOE and open-cycle fields) is found by type, not as the last element: vreUsedTWh was appended after
   // it on 31 Oct 2026 (0dbfb06), so 'the last element' read a number and the gas floor output, the LCOE fields and the open-cycle
   // capacity factor came out zero or null in every check made since (fixed 1 Nov 2026, message 598; RESULTS 'pathcheck: the per-run object').
   // vreUsedTWh (user, 31 Oct 2026, message 559): wind and solar delivered (E.wind + E.pv), so curtailment as a share of available wind
   // and solar output is curt / (vreUsedTWh + curt), the page's own definition (renderCurtailRisk).
   const agg=(o)=>{      const n=o.length,m=i=>o.reduce((a,b)=>a+b[i],0)/n; return ({seMean:n>1?Math.sqrt(o.reduce((a,b)=>a+(b[0]-m(0))**2,0)/(n-1)/n):null,nRuns:n,mean:m(0),worst:Math.max(...o.map(a=>a[0])),cost:m(1),curt:m(2),std:m(3),co2:m(4),coal:m(5),diesel:m(6),gridCost:m(7),gasTWh:m(8),gasHours:m(9),gasCF:m(10)>0?m(8)*1e6/(m(10)*8760):0,gas14dMaxGWh:Math.max(...o.map(a=>a[11])),
     stdCust:m(14),servedTWh:m(13),vreUsedTWh:m(16),avgCostRMWh:o.reduce((a,b)=>a+b[12]*b[13],0)/o.reduce((a,b)=>a+b[13],0)}); };
   let o=[], kk=0, r=null;
   for(;;){ const k1=process.env.K?K:Math.min(KMAX,kk+KSTEP); o=o.concat(batch(kk,k1)); kk=k1; r=agg(o);
     // STANDARD ON CUSTOMER DEMAND (user, 12 Oct 2026): from these runs the target is TFR x 0.002% of demand without
     // storage charging (loadS less pumped-storage and battery charging); the old basis, which counted charging as
     // demand, is kept as targetOld. A year above 90% of its target is flagged marginal.
     r.targetOld=TFR*r.std; r.target=TGWH!=null?TGWH:TFR*r.stdCust; r.standard=STDR||{basis:'tf',targetFrac:TFR}; r.marginal=r.mean>0.9*r.target; r.ci95Half=1.96*(r.seMean||0); r.ciPctOfTarget=r.target>0?100*r.ci95Half/r.target:null; r.ciWithin20=r.ci95Half<=0.2*r.target; r.draws=kk;
     if (process.env.K || r.ciWithin20 || kk>=KMAX) break; }
   // Tail and storage (message 683 (c)): unserved by percentile over the runs (GWh), by weather year (mean, GWh), and storage discharge
   // by kind (TWh, mean over the runs: pumped storage ps, lithium li, vanadium vrfb, iron-air fe). The weather reference is recorded.
   { const S=o[0].length-1, sh=o.map(b=>b[0]).sort((a,b)=>a-b), q=f=>sh[Math.min(sh.length-1,Math.floor(f*sh.length))];
     const byW={}; for (const b of o){ const k=b[S].wy; (byW[k]=byW[k]||[]).push(b[0]); }
     const ms=k=>{ const v=o.map(b=>b[S][k]).filter(v=>v!=null); return v.length?v.reduce((a,c)=>a+c,0)/v.length:null; };
     r.recordedSettings=RECSET; r.pricingBasis=PAGE_BASIS?"page (midpoint vintage, the page's pool rule)":"run (vintage, the run's pool use)";
     r.weather=(WX||'modelled, twelve years')+(WXF?', '+WXF:'')+(WXC?', wind corrected'+(WXT?' ('+path.basename(WXT)+')':''):'')+(LUL?', lull '+LNAME:'')+(PVT?', new tracking solar at '+PVT:'')+(SSHIFT?', PVGIS solar '+SSHIFT+' min earlier':'')+(CMD?', coal practice floor to '+(CMD-1):'')+(C690.length?', '+C690.join(', '):''); r.cocCase=COC_USED; if (COC_USED!==P.cocCase) r.cocCaseRecorded=P.cocCase; r.shedPct={p50:q(0.5),p90:q(0.9),p95:q(0.95),p99:q(0.99),max:sh[sh.length-1]};
     r.shedByWeatherYear=Object.fromEntries(Object.entries(byW).map(([k,v])=>[k,v.reduce((a,c)=>a+c,0)/v.length]));
     r.storeTWh={ps:ms('ps'),li:ms('li'),vrfb:ms('vrfb'),fe:ms('fe')}; }
   // GAS FLOOR OUTPUT (user, 13 Oct 2026, s_irpgas): gas output counted toward the engine's annual floor (the first
   // min(CCGT standing, ccgtForceLoadMW) MW of each hour's gas output, which includes OCGT on LNG and gas burnt to charge
   // storage), the floor's target and shortfall, and all gas output, TWh, mean over the runs. Zero when no floor applies.
   { const L=o[0].findIndex(v=>v!==null&&typeof v==='object'), m=k=>o.reduce((a,b)=>a+(+b[L][k]||0),0)/o.length/1e6;
     r.gasFloorTWh={floored:m('fl'), target:m('tg'), unmet:m('un'), totalGas:m('gas'), unfloored:m('gas')-m('fl')}; }
   if (process.env.LCOE){ const L=o[0].findIndex(v=>v!==null&&typeof v==='object'), m=k=>o.reduce((a,b)=>a+(+b[L][k]||0),0)/o.length, wd=m('wd'), wn=m('wn'), we=m('we'), nw=over.newWindMW||0;
     r.lcoe={battDisTWh:m('bd')/1e6, battMWh:m('bE'), liCycles:m('bE')>0?m('bd')/m('bE'):null, dieselTWh:m('ds')/1e6, dieselCapMW:m('dc'), dslCF:m('dc')>0?m('ds')/(m('dc')*8760):null,
       windTWh:wd/1e6, windNewPotTWh:wn/1e6, windExistPotTWh:we/1e6, windNewMW:nw, windNewTWh:(wn+we)>0?wd*wn/(wn+we)/1e6:0, windNewCF:nw>0&&(wn+we)>0?wd*wn/(wn+we)/(nw*8760):null}; }
   // NTCSA'S SECOND ADEQUACY CRITERION (user, 25 Oct 2026, messages 373, 375; MTSAO 2026-2030 section 3, p.11): open-cycle gas
   // turbine capacity factor under 6% a year, reported, not planned to. All open-cycle plant: diesel turbines (Eskom's and the IPP
   // peakers, with Avon and Dedisa's contract output) and open-cycle on LNG; energy over capacity x 8,760, mean over the runs.
   // Capacity is read from the defaults and the run's state together (25 Oct 2026): the state alone carries no ocgtDieselMW, so the
   // first version counted only new open-cycle gas and read 17% for c6's strict 2034 where all open-cycle plant gives under 1%.
   // SYSTEM STRENGTH (build 2026-11-02a): committed coal (mean of the runs' means, lowest hour of any run), and under 'inertia' the year's
   // requirement, inertia's lowest hour (any run) and 5th percentile (mean of the runs'), the lowest hour from synchronous sources only
   // (any run; grid-forming out, message 631 (b)), hours and GW.s-hours short after the lift,
   // the lift (hours, MW-hours of commitment, MWh of output floor, hours with no coal left to lift), means per run; and the annual
   // charge of the grid-forming premium and condensers built to this year (ssAnnualRkW, as the optimiser charged it), outside cost.
   { const L=o[0].findIndex(v=>v!==null&&typeof v==='object'), n=o.length, m=k=>o.reduce((a,b)=>a+(+b[L][k]||0),0)/n;
     if (o[0][L].cmMean!==undefined) r.committedCoal={meanMW:m('cmMean'), minMW:Math.min(...o.map(b=>b[L].cmMin))};
     // Behind-the-meter batteries, the VPP and geyser control (messages 621-647; 649 (b)): the year's stock and demand change, GWh; enrolled
     // VPP MW, its discharge and incremental discharge (wear basis, 647), MWh; its cost and wear, R bn; geyser MW enrolled, GWh deferred,
     // cost, R bn; means over the runs. Reported only; the costs are already in r.cost (newCapexR).
     if (o[0][L].btmStock!==undefined) r.btm={stockGWh:o[0][L].btmStock, demandChangeGWh:o[0][L].btmDemChg, vppMW:o[0][L].vppMW, vppDischargeMWh:m('vppDis'), vppIncrementalMWh:m('vppInc'), vppCostBn:m('vppCost')/1e9, vppWearBn:m('vppWear')/1e9};
     if (o[0][L].gyMW!==undefined) r.geyser={enrolledMW:o[0][L].gyMW, reducedGWh:m('gyRed'), costBn:m('gyCost')/1e9};
     if (SS_ON){ if (o[0][L].ssReq===undefined) throw new Error('the run is inertia but the engine returned no ss');
       r.ss={reqGWs:o[0][L].ssReq, inertiaMinGWs:Math.min(...o.map(b=>b[L].ssMin)), syncMinGWs:o[0][L].ssSyncMin===undefined?null:Math.min(...o.map(b=>b[L].ssSyncMin)), inertiaP5GWs:m('ssP5'), shortH:m('ssShortH'), shortGWsH:m('ssShortGWsH'),
         liftH:m('ssLiftH'), liftCommitMWh:m('ssLiftMWh'), liftFloorMWh:m('ssLiftFloorMWh'), resH:m('ssResH'), resMWh:m('ssResMWh'), coalFirstH:m('ssCoalFirstH'), liftCappedH:m('ssLiftCappedH'), gfmMW:cum.gfm, condBuiltMVA:cum.scc+cum.scn, liftForecast:SS_FC_USED};
       let c=0; for (const yy of Object.keys(P.sched)) if (+yy<=y) for (const t of ['gfm','scc','scn']) c+=(+P.sched[yy][t]||0)*(+w.eval(`ssAnnualRkW('${t}', ${+yy})`))*1000;
       r.ss.costBn=c/1e9; r.costWithSs=r.cost+r.ss.costBn; }
     if ((SSR.fault||'off')!=='off'){ let f=0; const A=t=>+w.eval(`bldAnnuity(ssFaultRkW({...FIXED,...state}), BLD_LIFE['${t}'], '${t}')`);
       for (const yy of Object.keys(P.sched)) if (+yy<=y) for (const [k,t] of [['wind','wind'],['pv','pv'],['off','offshore'],['batt','batt'],['vrfb','vrfb'],['ironair','ironair']]) f+=(+P.sched[yy][k]||0)*A(t)*1000;
       r.faultBn=f/1e9; r.costWithFault=r.cost+r.faultBn+(r.ss?r.ss.costBn:0); } }
   { const L=o[0].findIndex(v=>v!==null&&typeof v==='object'), e=o.reduce((a,b)=>a+(+b[L].ocE||0),0)/o.length, cap=o.reduce((a,b)=>a+(+b[L].ocCap||0),0)/o.length;
     r.ocgtCF=cap>0?e/(cap*8760):null; r.ocgtTWh=e/1e6; r.ocgtCapMW=cap; r.ocgtCFUnder6=r.ocgtCF!=null?r.ocgtCF<0.06:null;
     // coalPartLoad (message 710 (b)): the engine's part-load factor on this year's coal, fuel-equivalent MWh over MWh, across the runs; null
     // if the engine does not report coalFuelMWh.
     const cg=o.reduce((a,b)=>a+(+b[L].cg||0),0), cf=o.every(b=>b[L].cfm!=null)?o.reduce((a,b)=>a+b[L].cfm,0):null; r.coalPartLoad=(cf!=null&&cg>0)?cf/cg:null; }
   // LNG STORAGE ADEQUACY (user, 6 Oct 2026; LNG=1). Gas burned in each of the loop's own stress windows
   // that bind this model year (fromYear <= y), re-dispatched on that window's weather year and outage seed,
   // and in the worst 14 days of the runs above, against the energy one floating storage unit holds.
   // Fuel = electricity x 3.6 / CCGT_EFF (0.52 HHV, the efficiency costCcgt is derived with).
   if (process.env.LNG==='1' && over.newCcgtMW>0){
     const wins=[].concat(...P.log.map(l=>Array.isArray(l.added)?l.added:[])).filter(a=>a.seed!==undefined && (a.fromYear??a.forModelYear)<=y);
     r.lng=JSON.parse(w.eval(`(function(){ const W=${JSON.stringify(wins)}, out=[];
       for (const a of W){ const nat=weatherYearNational(String(a.year)); const st={...state,...${JSON.stringify(over)},outageSeed:a.seed};
         const x=simulate(st,{demand:PROFILES.demand,solar:nat.solar,wind:nat.wind,...(nat.solarTrk?{solarTrk:nat.solarTrk}:{}),csp:PROFILES.csp,real:true});
         let g=0, sh=0; for(let h=a.start*24; h<(a.start+a.n)*24 && h<x.stack.ccgt.length; h++){ g+=x.stack.ccgt[h]; sh+=x.stack.unserved[h]; }
         out.push({wy:a.year, start:a.start, n:a.n, gasGWh:g/1e3, shedGWh:sh/1e3}); }
       return JSON.stringify(out); })()`));
     const fuelPerGWh=3.6/CCGT_EFF/1e3, cargoPJ=LNG_M3*LNG_GJ_M3*(1-LNG_HEEL)/1e6;   // PJ fuel per GWh(e); PJ per cargo
     for (const z of r.lng){ z.fuelPJ=z.gasGWh*fuelPerGWh; z.cargoes=z.fuelPJ/cargoPJ; }
     r.lngCargoPJ=cargoPJ; r.lng14dMaxCargoes=r.gas14dMaxGWh*fuelPerGWh/cargoPJ;
     r.lngWindowsOver=r.lng.filter(z=>z.cargoes>1).length; r.lngWorstCargoes=Math.max(0,...r.lng.map(z=>z.cargoes));
   }
   // OPTIMISER GRID COST (TODO 14ar): when GRID is set, what the optimiser charged every technology, less repurposed MW. Until 5 Nov
   // 2026 the engine's own charge was a tiered regional one on wind and solar (txChargeFor), replaced here by this figure.
   // costGrid is the system cost on that basis; cost stays the engine's own figure.
   if (GRID_ON){
     const ga=JSON.parse(w.eval(`JSON.stringify(Object.fromEntries(['wind','pv','batt','vrfb','ironair','ccgt','offshore','phes','phel','ocgt','ocgd'].map(t=>[t,bldGridAnn(t,{...FIXED,...state})])))`));
     const built={wind:cum.wind,pv:cum.pv,batt:cum.batt,vrfb:cum.vrfb,ironair:cum.ironair,ccgt:cum.ccgt,offshore:cum.off,phes:cum.phes,phel:cum.phel,ocgt:cum.ocgt,ocgd:cum.ocgd};
     let g=0; for (const t of Object.keys(built)) g+=Math.max(0,built[t]-(rpCum[t]||0))*ga[t]*1000;
     // Wind on the Cape curtailment allowance pays no integration charge (14 Oct 2026).
     g-=Math.min(cwCum, Math.max(0,cum.wind-(rpCum.wind||0)))*(+w.eval('state.txRPerKWyr ?? FIXED.txRPerKWyr'))*(+w.eval('state.bldGridIntVreShare ?? FIXED.bldGridIntVreShare'))*1000;
     // From message 710 (c) the engine charges this itself (gridChargeR, on the run's own pool use): engTx is the engine's own grid charge,
     // and it must equal the optimiser's basis here; a difference above R1m a year stops the check. costGrid then equals cost.
     const engTx=+w.eval(`gridChargeR({...state,...${JSON.stringify(over)}},{...FIXED,...state,...${JSON.stringify(over)}})`);
     if (!PAGE_BASIS && Math.abs(engTx-g)>1e6) throw new Error('grid charge: the engine '+(engTx/1e9).toFixed(4)+' bn against the optimiser basis '+(g/1e9).toFixed(4)+' bn in '+y);
     r.gridOptBn=g/1e9; r.engTxBn=engTx/1e9; r.costGrid=r.cost-r.engTxBn+r.gridOptBn; r.rpCumMW=Object.values(rpCum).reduce((a,b)=>a+b,0);
   }
   // Life-extension capex (TODO 14as): the engine charges fixed O&M on what is online; each extended plant's
   // annuity (extension capex over its end-of-life year to the IRP's date) is added here from that year on.
   if (PEAK_ON){
     const pk=JSON.parse(w.eval(`JSON.stringify(BLD_PEAKERS.map(p=>({id:p.id,eol:p.eol,irp:p.irp,on:bldPeakerExtOn(p,{...FIXED,...state},${y})})))`));
     const R=+w.eval('state.bldPeakerExtRkW??FIXED.bldPeakerExtRkW'); let e=0, kept=0;
     for (const p of pk) if (p.on){ const mw=(P.peakerExt||{})[p.id]||0; kept+=mw; e+=mw*1000*w.eval(`bldAnnuity(${R},${p.irp-p.eol},'eskom')`); }
     r.peakerKeptMW=kept; r.peakerExtBn=e/1e9; r.dieselOnMW=+w.eval(`dieselAvailMW(applyYearFleetOptions({...FIXED,...state,dieselDecomMW:${over.dieselDecomMW},scenarioYear:${y}}))`);
   }
   // COMPLY (15 Oct 2026): the coal emissions compliance charge the pathway run recorded for this year (on the in-scope coal it kept),
   // reported beside the engine's cost; cost itself is unchanged. Only when the run carries one.
   if (P.comply && P.comply.years && P.comply.years[y]){ r.complyBn=P.comply.years[y].keptChargeR/1e9; r.costComply=r.cost+r.complyBn; }
   rows.push({y,...over,...r, capexWind2026:CAPEX26.wind, capexPv2026:CAPEX26.pv}); console.log(y, JSON.stringify(r));
 }
 fs.writeFileSync(process.env.OUTC||'pathcheck.json', JSON.stringify(rows)); process.exit(0);
})();
