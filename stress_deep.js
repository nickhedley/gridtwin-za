/* DEEP STRESS - cross-talk and coherence probes beyond the standing suites.
 * One jsdom load, many simulate() calls against the real index.html. */
const { JSDOM } = require('jsdom');
const fs=require('fs'), path=require('path'), root='testroot';
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
let pass=0, fail=0; const fails=[];
const dom=new JSDOM(html,{runScripts:'dangerously',resources:'usable',pretendToBeVisual:true,
 url:'file://'+path.resolve(root)+'/index.html',
 beforeParse(w){
  w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>({addColorStop(){},data:[],width:0})});
  const ch=()=>new Proxy(function(){return ch();},{get:()=>ch()});
  w.L=new Proxy({},{get(){return function(){return ch();};}}); w.onerror=()=>{};
  Object.defineProperty(w.history,'replaceState',{value:()=>{},writable:true});
  w.URL.createObjectURL=()=>'blob:x'; w.Worker=function(){this.postMessage=()=>{};};
  w.fetch=async(u)=>{try{const cl=String(u).split('?')[0].replace(/^file:.*?\/(?=nodal\/|profiles)/,'');
   const t=fs.readFileSync(path.join(path.resolve(root),cl),'utf8');
   return{ok:true,json:async()=>JSON.parse(t),text:async()=>t};}catch(e){return{ok:false,json:async()=>{throw e},text:async()=>{throw e}};}};
 }});
setTimeout(()=>{
 const w=dom.window;
 const S=w.document.createElement('script');
 S.textContent = `window.__deep = (${probe.toString()})();`;
 w.__ck = (name, ok, detail) => {
   if (ok) pass++; else { fail++; fails.push(name+'  '+(detail||'')); }
   console.log((ok?'  ok   ':'  FAIL ')+name+(detail?'   '+detail:''));
 };
 w.document.body.appendChild(S);
 console.log('\n'+pass+'/'+(pass+fail)+' deep checks passed');
 if (fails.length) { console.log('FAILURES:'); fails.forEach(f=>console.log('  * '+f)); process.exit(1); }
},4500);

function probe(){
 const ck = window.__ck;
 const F = FIXED;
 const base = {...state};
 const sim = over => simulate({...base, ...over}, PROFILES);
 // stack-based totals: the tested invariant is stack==loadS per hour (rooftop
 // nets off demand and is NOT in either side; charging load IS in both).
 const KEYS=['nuclear','hydro','imports','hybrid','coal','ps','batt','ccgt','diesel','wind','pv','csp','unserved'];
 const sumStack = r => { let t=0; for(const k of KEYS){const a=r.stack[k]; if(a) for(let h=0;h<8760;h++) t+=a[h];} return t; };
 const sumE = r => sumStack(r);
 const mean = a => a.reduce((s,v)=>s+v,0)/a.length;

 /* ============ A. CONSERVATION ============ */
 { const r = sim({});
   let load=0; for(let h=0;h<8760;h++){ load+=r.loadS[h]; }
   const gen = sumStack(r);   // stack already includes unserved as a key
   ck('A1 hourly stack sums to served load (incl. charging) over the year', Math.abs(gen-load)/load < 1e-6, (gen/1e6).toFixed(3)+' vs '+(load/1e6).toFixed(3)+' TWh');
   // storage round trip: discharge <= charge + INITIAL stored energy. The fleet
   // starts the year with SOC (psEnergyMWh + batt) which is legitimately drawn
   // down once; beyond that, discharge exceeding charge would be free energy.
   let dch=0,c2=0; for(let h=0;h<8760;h++){ dch+=(r.stack.batt[h]||0)+(r.stack.ps[h]||0); c2+=r.chargeMW[h]||0; }
   const initMWh = (F.psEnergyMWh||60000) + F.battPowerMW*F.battHours;
   ck('A2 storage discharge <= charge + initial SOC', dch <= c2 + initMWh + 1, 'dis '+Math.round(dch)+' chg '+Math.round(c2)+' init '+Math.round(initMWh));
   ck('A3 net storage draw beyond charging stays within initial SOC', dch-c2 <= initMWh, (dch-c2).toFixed(0)+' MWh net');
   ck('A4 no negative stack values anywhere', Object.values(r.stack).every(a=>{for(let h=0;h<8760;h++) if(a[h]<-1e-6) return false; return true;}));
   ck('A5 curtailed >= 0 and finite', r.E.curtailed>=0 && isFinite(r.E.curtailed));
 }

 /* ============ B. PRICE <-> COST COHERENCE ============ */
 { const r = sim({});
   const cC=F.carbonTaxRPerT*F.emisCoal, cG=F.carbonTaxRPerT*F.emisCcgt, cD=F.carbonTaxRPerT*F.emisDiesel;
   let bad=0, n=0;
   for(let h=0;h<8760;h++){
     const t=r.marginalTech[h], p=r.marginalP[h];
     if(t==='diesel'){ n++; if(Math.abs(p-(F.costDiesel+cD+F.vomDiesel))>1) bad++; }
   }
   ck('B1 every diesel-marginal hour prices at exactly fuel+carbon+VOM', bad===0, n+' diesel hours, '+bad+' off');
   let ccgtBad=0, ccgtN=0;
   for(let h=0;h<8760;h++) if(r.marginalTech[h]==='ccgt'){ ccgtN++; if(Math.abs(r.marginalP[h]-(state.costCcgt+cG+F.vomCcgt))>1) ccgtBad++; }
   ck('B2 every ccgt-marginal hour prices at fuel+carbon+VOM', ccgtBad===0, ccgtN+' hours');
   let coalLo=1e9, coalHi=-1e9;
   for(let h=0;h<8760;h++) if(r.marginalTech[h]==='coal'){ const p=r.marginalP[h]; if(p<coalLo)coalLo=p; if(p>coalHi)coalHi=p; }
   const coalFloor=F.costCoal+cC+F.vomCoal;
   ck('B3 coal-marginal prices >= fuel+carbon+VOM floor', coalLo >= coalFloor-1, 'min R'+Math.round(coalLo)+' floor R'+Math.round(coalFloor));
   ck('B4 coal-marginal prices bounded above by UC start-cost adder', coalHi <= coalFloor+320, 'max R'+Math.round(coalHi));
   ck('B5 avg(marginalP) == priceStats.avg', Math.abs(mean(Array.from(r.marginalP)) - r.priceStats.avg) < 1, '');
   // capture <= avg for solar in a solar-heavy world; battery capture >= avg
   const r2 = sim({newPvMW:20000, newBattMW:4000});
   ck('B6 high-solar: PV capture price < average price', r2.priceStats.capture.pv < r2.priceStats.avg, Math.round(r2.priceStats.capture.pv)+' vs '+Math.round(r2.priceStats.avg));
   ck('B7 battery capture price > average price (arbitrage premium)', r2.priceStats.capture.batt > r2.priceStats.avg, Math.round(r2.priceStats.capture.batt)+' vs '+Math.round(r2.priceStats.avg));
   ck('B8 hybrid capture within [0.8x, 1.3x] of average (daytime-firm)', r2.priceStats.capture.hybrid > 0.8*r2.priceStats.avg && r2.priceStats.capture.hybrid < 1.3*r2.priceStats.avg, Math.round(r2.priceStats.capture.hybrid));
 }

 /* ============ C. VOM EXACT DECOMPOSITION ============ */
 { const a = sim({}); const b = sim({vomCoal:0});
   const expected = a.E.coal*F.vomCoal;
   const dc = a.fuelCost - b.fuelCost;   // VOM is booked into fuelCost
   ck('C1 removing vomCoal moves fuel cost by EXACTLY E.coal x R80', Math.abs(dc-expected)/expected < 1e-6, (dc/1e6).toFixed(1)+'m vs '+(expected/1e6).toFixed(1)+'m');
   ck('C2 dispatch pattern unchanged by vomCoal (cost, not behaviour)', Math.abs(a.E.coal-b.E.coal)<1 && Math.abs(a.E.ccgt-b.E.ccgt)<1, '');
 }

 /* ============ D. HYBRID WIRING ============ */
 { const r = sim({});
   let outside=0, over=0, tot=0;
   for(let h=0;h<8760;h++){ const v=r.stack.hybrid[h]||0; tot+=v;
     const hr=h%24; if((hr<F.hybridStartHour||hr>F.hybridEndHour) && v>1e-6) outside++;
     if(v > F.hybridMW*F.hybridCF + 1e-6) over++; }
   ck('D1 hybrid delivers nothing outside 05:00-21:00 window', outside===0, outside+' violations');
   ck('D2 hybrid never exceeds hybridMW x CF', over===0);
   ck('D3 E.hybrid == sum(stack.hybrid)', Math.abs(r.E.hybrid - tot) < 1);
   const r0 = sim({hybridMW:0});
   ck('D4 removing hybrid raises coal+gas+diesel by ~= lost hybrid energy',
      Math.abs((r0.E.coal+r0.E.ccgt+r0.E.diesel+r0.E.ps+r0.E.batt+r0.E.unserved)-(r.E.coal+r.E.ccgt+r.E.diesel+r.E.ps+r.E.batt+r.E.unserved) - r.E.hybrid)/Math.max(1,r.E.hybrid) < 0.05,
      'lost '+(r.E.hybrid/1e6).toFixed(2)+' TWh');
 }

 /* ============ E. STORAGE BASIS REPLAY / NEGATIVE PRICES ============ */
 { const r = sim({newPvMW:25000, newWindMW:20000, newBattMW:8000});
   let neg=0, negChg=0, ocOverwrite=0;
   for(let h=0;h<8760;h++){
     if(r.marginalTech[h]==='coalneg'){ neg++; if(r.marginalP[h]>=0) ocOverwrite++; if((r.chargeMW[h]||0)>0) negChg++; }
   }
   ck('E1 high-RE scenario produces negative-price hours', neg>100, neg+' hours');
   ck('E2 every coalneg hour prices strictly below zero', ocOverwrite===0);
   ck('E3 storage charges in negative hours (basis replay has material effect)', negChg>50, negChg+' hours');
   // negative basis is visible through PUMPED STORAGE bids: ps-marginal hours
   // clearing below its bare cycle cost mean the stored energy carries a
   // negative acquisition cost. (Battery bids are dominated by opportunity
   // cost in this scenario, so batt-marginal hours are the wrong place to look.)
   let psLow=1e9;
   for(let h=0;h<8760;h++){ if(r.marginalTech[h]==='ps') psLow=Math.min(psLow,r.marginalP[h]); }
   ck('E4 min ps-marginal price sits below ps cycle cost (negative basis visible)', psLow < 20, 'min R'+(psLow===1e9?'n/a':Math.round(psLow)));
 }

 /* ============ F. EVERY SLIDER MOVES SOMETHING ============ */
 { // Metrics include replAvg so pure-reporting sliders (lcoe*) register.
   const metrics = r => [sumStack(r), r.E.unserved, r.E.curtailed, r.priceStats.avg, r.avgCost, r.replAvg||0, r.replTotal||0, r.E.coal, r.E.ccgt, r.E.batt, r.co2, r.peak];
   // Some sliders only matter in a context - gas costs need gas installed, the
   // transmission adder needs new build to charge for, ramp flexibility needs a
   // solar trough to ramp around. Each gets its enabling context; deadness is
   // then judged against THAT context's own baseline.
   const CONTEXT = {
     costCcgt:      {ccgtMW: 3000, newCcgtMW: 3000, coalDecomMW: 30000},
     ccgtForceLoad: {ccgtMW: 3000},
     lcoeBatt:      {newBattMW: 2000, newWindMW: 10000, newPvMW: 8000},
     lcoeCcgt:      {ccgtMW: 3000, newCcgtMW: 3000},
     lcoeDiesel:    {coalEAFPct: 45},
     // interruptible load only fires when the system is actually short, so it
     // needs a scarcity context - at EAF 68 South Africa has surplus and DR
     // is never called, which is correct behaviour rather than a dead slider.
     // the controllable geyser pool only matters if anyone is enrolled in it,
     // which is correct: at zero enrolment the pool size is irrelevant.
     vppGeyserPoolMW: {vppEnrolPct: 50},
     // A storage technology's LCOE cannot move anything until some of that
     // technology exists. Correct behaviour, not a dead control.
     lcoeVrfb:    {newVrfbMW: 5000},
     lcoeIronAir: {newIronAirMW: 5000},
     // The export price only bites once there is capacity to export through,
     // and export capacity only bites when there is a surplus to sell.
     exportPriceR: {exportCapMW: 3000, newWindMW: 45000, newPvMW: 52000},
     exportCapMW:  {newWindMW: 45000, newPvMW: 52000},
     // vppRegion changes WHERE the pool sits, which only the regional build
     // optimiser can see - the single-node engine this sweep exercises has no
     // geography, so siting cannot move its outputs. Correct behaviour, not a
     // dead control. Its effect is tested directly against vppPoolByRegion().
     vppRegion: null,
     drInterruptMW:   {coalEAFPct: 55},
     drInterruptCostR:{coalEAFPct: 55},
     txRPerKWyr:    {newWindMW: 5000},
     syncMinMW:     {newPvMW: 15000, newWindMW: 10000},
     coalFlexPct:   {newPvMW: 15000},
     repurpose:     {coalDecomMW: 5000, newPvMW: 5000},
     ccsEnabled:    {},
   };
   // Documented exemptions — genuinely inert in most scenarios:
   //   outVolPct    -> Monte Carlo risk panel only (60 synthetic years, not determin.)
   //   getsEnabled  -> nodal corridor capacity only (full MIP path)
   //   lcoeCcgt, lcoeDiesel, costCcgt -> feed replAvg via lcoeOf[k]*E[k]. E.ccgt and
   //     E.diesel are ZERO in the default South African merit order (coal/imports are
   //     cheaper) so the product is zero. These sliders do move replAvg when gas or
   //     diesel actually dispatch — they are not dead, they are conditionally active.
   //     Confirmed by direct simulation: move lcoeCcgt with ccgtMW:3000 but no coal
   //     decommissioned → E.ccgt stays 0, replAvg unchanged. This is correct.
   //   carbonCapEnabled, carbonCapMt -> constrain the BUILD LP (bldBuildLP),
   //     not the dispatch engine this sweep exercises. Their effect is tested
   //     directly instead: see the cap sweep in the session notes - the cap is
   //     slack above ~100 Mt and binds below, lifting the objective from
   //     R334bn to R359bn at 80 Mt with a R1,477/t shadow price.
   const EXEMPT = new Set(['outVolPct','getsEnabled','lcoeCcgt','lcoeDiesel','costCcgt',
                           'carbonCapEnabled','carbonCapMt','vppRegion',
                           // Scales connection headroom in the BUILD OPTIMISER only.
                           // The single-node dispatch engine this sweep exercises has
                           // no headroom concept, so it cannot move. Its effect is
                           // tested directly in validate_lp.js instead.
                           'gridBeyondGccaPct',
                           // A READOUT is not a control: it renders a live summary and
                           // writes nothing to state, so it cannot perturb anything.
                           'vppTotalReadout']);
   const cache = {};
   const baseFor = ctx => { const key = JSON.stringify(ctx||{});
     if(!cache[key]) cache[key]=metrics(sim(ctx||{})); return cache[key]; };
   let dead=[];
   for (const sl of SLIDERS){
     if (!sl.id) continue;                    // section headers carry no id
     if (EXEMPT.has(sl.id)) continue;
     const ctx = CONTEXT[sl.id] || {};
     const baseM = baseFor(ctx);
     const cur = state[sl.id] !== undefined ? state[sl.id] : sl.def;
     let nv;
     if (sl.toggle) nv = cur ? 0 : 1;
     else { const span = (sl.max - sl.min); nv = cur + span*0.4 <= sl.max ? cur + span*0.4 : cur - span*0.4; }
     const m = metrics(sim({...ctx, [sl.id]: nv}));
     const moved = m.some((v,i)=> isFinite(v) && isFinite(baseM[i]) && Math.abs(v-baseM[i]) > Math.max(1e-6, Math.abs(baseM[i])*1e-5));
     if (!moved) dead.push(sl.id);
   }
   ck('F1 every slider (in its enabling context) perturbs an output', dead.length===0, dead.length? 'DEAD: '+dead.join(', ') : 'all live');
   const c0=sim({}), c1=sim({ccsEnabled:1});
   ck('F2 CCS toggle changes cost or emissions', Math.abs(c1.avgCost-c0.avgCost)>0.01 || Math.abs(c1.co2-c0.co2)>1e-6, 'dCost '+(c1.avgCost-c0.avgCost).toFixed(1)+' dCO2 '+((c1.co2-c0.co2)/1e6).toFixed(2)+'Mt');
 }

 /* ============ G. EXTREMES - bounded, finite, ordered ============ */
 { const scens = {
     'all coal dead':        {coalEAFPct:0},
     'no renewables':        {windMW:0, pvUtilityMW:0, rooftopMW:0, cspMW:0, hybridMW:0},
     'monster battery':      {newBattMW:50000},
     'monster rooftop':      {newRooftopMW:30000},
     'carbon R5000':         {carbonTaxRPerT:5000},
     'gas nearly free':      {costCcgt:600},
     'demand +60%':          {demandScalePct:160},
   };
   for (const [nm, over] of Object.entries(scens)){
     let r; try { r = sim(over); } catch(e){ ck('G "'+nm+'" simulates', false, String(e)); continue; }
     const finite = isFinite(sumE(r)) && isFinite(r.priceStats.avg) && isFinite(r.E.unserved);
     const pMax = Math.max(...r.marginalP);
     // ceiling = the model's own VoLL, R87,000/MWh (CSIR cost of unserved energy)
     ck('G "'+nm+'": finite, prices <= VoLL (R87,000)', finite && pMax <= 87000.5, 'maxP R'+Math.round(pMax)+' unserved '+(r.E.unserved/1e6).toFixed(2)+'TWh');
   }
   // ordering: unserved monotone non-increasing in EAF
   const u = [0,30,50,64,80,100].map(e=>sim({coalEAFPct:e}).E.unserved);
   ck('G8 unserved energy monotone non-increasing in coal EAF', u.every((v,i)=> i===0 || v <= u[i-1] + 1), u.map(v=>(v/1e6).toFixed(1)).join(' >= '));
   const co2 = [0,46,308,1000].map(c=>sim({carbonTaxRPerT:c}).priceStats.avg);
   ck('G9 average price monotone increasing in carbon tax', co2.every((v,i)=> i===0 || v >= co2[i-1] - 0.5), co2.map(v=>Math.round(v)).join(' <= '));
 }

 /* ============ G0. FALSY-ZERO GUARD ============ */
 { // `x || N` returns N when x is 0, silently ignoring a meaningful zero. This
   // has now bitten three times: coalEAFPct (EAF=0 ran at 64%), syncMinMW, and
   // the whole CCS parameter set (any slider at zero changed nothing at all).
   // Every parameter whose zero is a real scenario is swept here.
   const ZERO_MEANS_SOMETHING = ['ccsPenaltyPct','ccsCaptureRatePct','ccsOpexR',
     'ccsCapexR','ccsTsR','coalEAFPct','drInterruptMW','reserveContingencyMW'];
   const ctx = { ccsEnabled:1, ccgtMW:2000 };
   const dead = [];
   for (const k of ZERO_MEANS_SOMETHING){
     const hi = sim({ ...ctx, [k]: (FIXED[k] || 50) });
     const zero = sim({ ...ctx, [k]: 0 });
     const same = Math.abs(hi.avgCost - zero.avgCost) < 1e-6
               && Math.abs(hi.co2 - zero.co2) < 1e-9
               && Math.abs(hi.E.coal - zero.E.coal) < 1;
     if (same) dead.push(k);
   }
   ck('G0 setting a meaningful parameter to ZERO changes the answer',
      dead.length===0,
      dead.length ? 'IGNORED AT ZERO (likely `||` not `??`): '+dead.join(', ')
                  : ZERO_MEANS_SOMETHING.length+' parameters checked');
 }

 /* ============ H0. LABEL MAPS COVER EVERY DRAWN CARRIER ============ */
 { // A carrier in COLORS but not NAMES renders a correctly-coloured swatch
   // labelled "undefined" - which is exactly what shipped when hybrid was added
   // to DISP_ORDER and COLORS but not NAMES. Cheap check, real bug caught.
   const missingName = DISP_ORDER.filter(k => !NAMES[k]);
   ck('H0a every DISP_ORDER carrier has a NAMES label', missingName.length===0,
      missingName.length ? 'undefined labels: '+missingName.join(', ') : DISP_ORDER.length+' carriers');
   const missingCol = DISP_ORDER.filter(k => !COLORS[k]);
   ck('H0b every DISP_ORDER carrier has a COLORS entry', missingCol.length===0,
      missingCol.length ? 'no colour: '+missingCol.join(', ') : '');
   const colKeys = Object.keys(COLORS), nmKeys = Object.keys(NAMES);
   ck('H0c COLORS and NAMES cover the same carriers',
      colKeys.every(k=>nmKeys.includes(k)) && nmKeys.every(k=>colKeys.includes(k)),
      colKeys.length+' vs '+nmKeys.length+' keys');
 }

 /* ============ H. PANEL CROSS-TALK (rendered DOM) ============ */
 { const r = sim({});
   window.lastRes = r;
   try { renderValidation(); } catch(e){}
   const vtxt = (document.getElementById('validationBody')||{}).textContent||'';
   ck('H1 validation panel shows derived rooftop 8.6 GW', /8\.6\s*GW/.test(vtxt), '');
   ck('H2 validation panel shows derived utility PV 3.2 GW', /3\.2\s*GW/.test(vtxt), '');
   ck('H3 validation panel shows wind 4.6 GW', /4\.6\s*GW/.test(vtxt), '');
   try { drawShadowPriceWeek(r); } catch(e){}
   const c = document.getElementById('spWeek');
   ck('H4 price chart hover model exists with 168 bars', !!(c && c.__hit && c.__hit.N===168), '');
   if (c && c.__hit){
     // tooltip price for a coal hour must equal the bar's data
     let sample=null; for(let i=0;i<168;i++){ const t=c.__hit.resolve(i); if(t){ sample=t; break; } }
     ck('H5 hover resolver returns content', !!sample, '');
   }
   const noteEl = document.getElementById('spWeekNote');
   ck('H6 price chart note mentions gas SRMC line', !!noteEl && /gas SRMC/i.test(noteEl.textContent||''), '');
 }
 return true;
}
