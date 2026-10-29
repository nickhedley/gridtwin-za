#!/usr/bin/env node
// page_costs.js: the page's cost basis, read from index.html itself (user, 29 Oct 2026, message 501 (d)): each technology's real
// pre-tax cost of capital in every case, its interest-during-construction factor and build years, its life, its 2026 capex and the
// derived capital charges. One JSON object on the last line, for packfill.js's page.* keys, so the reviewer pack never types a rate.
//   node pathway/tables/page_costs.js [root]      (from harness/; root defaults to testroot)
const fs=require('fs'),path=require('path');const {JSDOM}=require('jsdom');
const ROOT=process.argv[2]||'testroot';
(async()=>{
 const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
 const dom=new JSDOM(html,{runScripts:'dangerously',resources:'usable',pretendToBeVisual:true,url:'file://'+path.resolve(ROOT)+'/index.html',
  beforeParse(w){ w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>({addColorStop(){},data:[],width:0,measureText:()=>({width:10})})});
   const ch=()=>new Proxy(function(){return ch();},{get:()=>ch()}); w.L=new Proxy({},{get(){return function(){return ch();};}});
   w.onerror=()=>{}; Object.defineProperty(w.history,'replaceState',{value:()=>{},writable:true}); w.URL.createObjectURL=()=>'blob:x'; w.Worker=function(){this.postMessage=()=>{};};
   w.fetch=async(u)=>{try{const cl=String(u).split('?')[0].replace(/^file:.*?\/(?=nodal\/|profiles|config)/,'');const t=fs.readFileSync(path.join(path.resolve(ROOT),cl),'utf8');return{ok:true,json:async()=>JSON.parse(t),text:async()=>t};}catch(e){return{ok:false,json:async()=>{throw e},text:async()=>{throw e}};}};}});
 await new Promise(r=>setTimeout(r,6000)); const w=dom.window; const ev=x=>w.eval(x);
 const out=ev(`(function(){
   const techs=['pv','wind','offshore','batt','ironair','vrfb','phes','ccgt','ocgt','ocgd','nuclear','coal','tx','grid','rooftop'];
   const cases=['central','private','high','low','planning']; const coc={}, idc={};
   const saved=state.bldCocCase;
   for (const c of cases){ state.bldCocCase=c; coc[c]={}; idc[c]={}; for (const t of techs){ coc[c][t]=bldCoc(t); idc[c][t]=bldIdcFactor(t); } }
   state.bldCocCase=saved;
   // 2026 capex as the pathway runs cost it: tracking solar on the page's bldPvCase, the other entries as bldCostEntry resolves them.
   const savedTrk=state.bldPvTracking; state.bldPvTracking=1;
   const capex={ pv:bldCostEntry('pv').c2026, wind:bldCostEntry('wind').c2026, batt:bldCostEntry('batt').c2026*1, offshore:BLD_COST.offshore.c2026, ironair:BLD_COST.ironair.c2026,
     ccgt:BLD_COST.ccgt.c2026, ocgt:bldCostEntry('ocgt').c2026, nuclear:NUC_CAPEX_USD*NUC_COAL_FX, coal:COAL_NEW_CAPEX_USD*NUC_COAL_FX, phes:PS_TUBATSE_RKW };
   state.bldPvTracking=savedTrk;
   const d=bldDerivedAcaps();
   return { build:BUILD_STAMP, cocCase:FIXED.bldCocCase, pvCase:FIXED.bldPvCase, disc:BLD_DISC, level:BLD_COC_LEVEL, gap:BLD_COC_GAP, network:BLD_COC_NETWORK,
     privatePrem:BLD_COC_PRIVATE_PREM, buildYears:BLD_BUILD_Y, life:Object.assign({},BLD_LIFE,{nuclear:NUC_LIFE,coal:COAL_NEW_LIFE,phes:PS_LIFE}),
     nucUsd:NUC_CAPEX_USD, coalUsd:COAL_NEW_CAPEX_USD, fx:NUC_COAL_FX, coc, idc, capex, acap:{nuclear:d.acapNuclear,coal:d.acapCoal,phes:d.acapPs},
     battHoursCost:BATT_COST_HOURS };
 })()`);
 console.log(JSON.stringify(out)); w.close(); process.exit(0);
})().catch(e=>{console.error(e.message);process.exit(1);});
