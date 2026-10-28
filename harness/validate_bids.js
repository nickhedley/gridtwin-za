// validate_bids.js - does the model's cost of each technology with recent South African bids sit within the bids? (user, 28 Oct
// 2026, messages 468 (d) and 469 (c)). Two-sided, 10% tolerance:
//  - above: the model's levelised cost (2026 construction cost, interest during construction, cost of capital and life as the
//    page charges them, fixed O&M, the bids' capacity factor) more than 10% over the mean of the recent rounds' indexed averages;
//  - below: more than 10% under the lowest accepted bid, indexed.
// Each flag is fixed within the evidence or carries a stated reason (EXPLAINED below); an unexplained flag fails.
// The tolerance covers a price base date about a year either way (about 4-5% of CPI), the capacity-factor basis (about 3-5%) and
// bid inclusions (about 3-5%). Lithium is checked on capacity: BESIPPPP pays a capital cost recovery charge per MW of contracted
// capacity per hour of availability (energy-storage.news, BW3 award table, search snippet), so the model's annual capital charge
// per kW is compared with the charge times 8,760 hours. RMIPPPP is not checked: its projects are hybrids built to a firm profile,
// and the powerships bundle fuel and a 72.7% take-or-pay, so no model technology is comparable.
// Bid figures: SOURCES 'Cost of capital by technology' (most from search summaries; listed there for reading).
// Run: node validate_bids.js <root>
const fs=require('fs'),path=require('path');const {JSDOM}=require('jsdom');
const ROOT=process.argv[2]||'testroot', TOL=0.10;
let pass=0, fail=0; const failures=[];
function check(name, ok, detail){ if (ok){ pass++; console.log(`  PASS  ${name}`); } else { fail++; failures.push([name, detail]); console.log(`  FAIL  ${name}`); } }
// Recent awards, as published (R/MWh, or R/MW/h for BESIPPPP), with the price base each is indexed from.
//  REIPPPP BW5 (Oct 2021): solar R428.79 average, wind R495.22 (BLD_TARIFF.wind); base April 2021 (taken from the RFP date; not stated).
//  REIPPPP BW6 (Dec 2022): solar R490.48 average, lowest R469.50; base 1 April 2022 (BW6 PPA terms, search snippet).
//  REIPPPP BW7 (Dec 2024-Dec 2025): solar MW-weighted average of all 18 awards (BLD_TARIFF.pvtrk), lowest R420.72; base taken as
//  January 2024 (not stated).
//  BESIPPPP BW3 (May 2025): capital cost recovery charge about R204-235/MW/h; base taken as 2025 rands (not found), one year of CPI.
// CPI April 2022 to January 2026: CPI_APR21_TO_JAN26 / 1.059 (Stats SA, annual CPI 5.9% in April 2022).
const CPI_APR22_STEP = 1.059;
// Flags with their reasons (message 469 (c)).
const EXPLAINED = {
  'wind above': "BW5's wind prices do not hold: 784 MW of BW5 wind had signed by December 2022, no wind tariff has been awarded since, "
    + "and BW7's compliant wind bids were rejected as too high, so the model's wind cost on BW6's compliant bids stands above BW5's tariff",
  'lithium below': "equipment prices fell after BW3 was bid: the model ages BW3's capex to January 2026 on BNEF's turnkey survey "
    + "(USD 165/kWh in 2024, 117 in 2025), which BW3's charge, fixed at the bid, does not carry",
};
(async()=>{
 const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
 const dom=new JSDOM(html,{runScripts:'dangerously',resources:'usable',pretendToBeVisual:true,url:'file://'+path.resolve(ROOT)+'/index.html',
  beforeParse(w){ w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>({addColorStop(){},data:[],width:0,measureText:()=>({width:10})})});
   const ch=()=>new Proxy(function(){return ch();},{get:()=>ch()}); w.L=new Proxy({},{get(){return function(){return ch();};}});
   w.onerror=()=>{}; Object.defineProperty(w.history,'replaceState',{value:()=>{},writable:true}); w.URL.createObjectURL=()=>'blob:x'; w.Worker=function(){this.postMessage=()=>{};};
   w.fetch=async(u)=>{try{const cl=String(u).split('?')[0].replace(/^file:.*?\/(?=nodal\/|profiles|config)/,'');const t=fs.readFileSync(path.join(path.resolve(ROOT),cl),'utf8');return{ok:true,json:async()=>JSON.parse(t),text:async()=>t};}catch(e){return{ok:false,json:async()=>{throw e},text:async()=>{throw e}};}};}});
 await new Promise(r=>setTimeout(r,6000)); const w=dom.window;
 const ev=x=>w.eval(x);
 // REIPPPP solar is single-axis tracking, as the pathway runs build it (env_c6.sh); the page's own default is fixed tilt.
 ev('state.bldPvTracking = 1;');
 const T=JSON.parse(ev(`JSON.stringify({ stamp: BUILD_STAMP, apr21: CPI_APR21_TO_JAN26, jan24: CPI_JAN24_TO_JAN26, cfPv: BW6_PV_TRK_BID_CF, cfW: BW6_WIND_BID_CF,
   bw5W: BLD_TARIFF.wind.rPerMWh, bw7Pv: BLD_TARIFF.pvtrk.rPerMWh,
   pv: (bldAnnuity(bldCostEntry('pv').c2026, BLD_LIFE.pv, 'pv') + BLD_FOM.pv), wind: (bldAnnuity(bldCostEntry('wind').c2026, BLD_LIFE.wind, 'wind') + BLD_FOM.wind),
   batt: bldAnnuity(bldCostEntry('batt').c2026, BLD_LIFE.batt, 'batt') / (BATT_COST_HOURS / 4), rate: { pv: bldAnnuityRate('pv'), wind: bldAnnuityRate('wind'), batt: bldAnnuityRate('batt') },
   capex: { pv: bldCostEntry('pv').c2026, wind: bldCostEntry('wind').c2026, batt: bldCostEntry('batt').c2026 } })`));
 const apr22=T.apr21/CPI_APR22_STEP;
 console.log(`\nModel cost against South African bids, two-sided at ${TOL*100}% (build ${T.stamp}; 2026 rands)\n`);
 const rows=[
   { tech:'solar', unit:'R/MWh', model:T.pv/(T.cfPv*8.76), rounds:{ BW5:428.79*T.apr21, BW6:490.48*apr22, BW7:T.bw7Pv*T.jan24 }, lowest:Math.min(469.50*apr22, 420.72*T.jan24) },
   { tech:'wind', unit:'R/MWh', model:T.wind/(T.cfW*8.76), rounds:{ BW5:T.bw5W*T.apr21 }, lowest:null },
   { tech:'lithium', unit:'R/kW-yr', model:T.batt, rounds:{ BW3:(204+235)/2*8.76*1.035 }, lowest:204*8.76*1.035 },
 ];
 for (const r of rows){
   const ref=Object.values(r.rounds).reduce((a,b)=>a+b,0)/Object.keys(r.rounds).length;
   const over=r.model/ref-1, under=r.lowest!=null ? r.model/r.lowest-1 : null;
   console.log(`  ${r.tech}: model ${r.model.toFixed(0)} ${r.unit} (rate ${(T.rate[r.tech==='solar'?'pv':r.tech==='lithium'?'batt':'wind']*100).toFixed(1)}%); rounds `
     +Object.entries(r.rounds).map(([k,v])=>`${k} ${v.toFixed(0)}`).join(', ')+`; mean ${ref.toFixed(0)} (${over>=0?'+':''}${(over*100).toFixed(1)}%)`
     +(r.lowest!=null?`; lowest accepted ${r.lowest.toFixed(0)} (${under>=0?'+':''}${(under*100).toFixed(1)}%)`:'; lowest accepted: not found'));
   for (const [side, flagged] of [['above', over>TOL], ['below', under!=null && under<-TOL]]){
     const key=r.tech+' '+side, why=EXPLAINED[key];
     if (!flagged){ check(`${r.tech}: not more than ${TOL*100}% ${side} the bids`, true); continue; }
     if (why){ console.log(`        explained: ${why}`); check(`${r.tech}: ${side} the bids by more than ${TOL*100}%, explained`, true); }
     else check(`${r.tech}: not more than ${TOL*100}% ${side} the bids`, false, `${key}: no fix or stated reason`);
   }
 }
 // Every stated reason must still be needed: a reason for a gap that has closed is dropped, so none outlives its evidence.
 const live=new Set(); for (const r of rows){ const ref=Object.values(r.rounds).reduce((a,b)=>a+b,0)/Object.keys(r.rounds).length;
   if (r.model/ref-1>TOL) live.add(r.tech+' above'); if (r.lowest!=null && r.model/r.lowest-1<-TOL) live.add(r.tech+' below'); }
 const stale=Object.keys(EXPLAINED).filter(k=>!live.has(k));
 check('every stated reason explains a live gap', stale.length===0, 'stale: '+stale.join(', '));
 console.log(`\n${pass}/${pass+fail} bid checks passed`);
 if (failures.length){ console.log('\nFailures:'); for (const [n,d] of failures) console.log('  - '+n+': '+d); }
 process.exit(fail?1:0);
})();
