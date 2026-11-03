// Measurement script, message 673 (b) (design note version 2, 3 Nov 2026): dump the reference-year and twelve-year hourly series the build LP reads, with c7's
// wind and solar settings, and check bldRepDays(12) against c7's recorded days. Run from harness/ (NODE_PATH=node_modules node pathway/repdays/extract.js <out.json>).
const fs=require('fs'), path=require('path'), {JSDOM}=require('jsdom');
const ROOT='testroot', OUT=process.argv[2];
(async()=>{
 const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
 const dom=new JSDOM(html,{runScripts:'dangerously',resources:'usable',pretendToBeVisual:true,url:'file://'+path.resolve(ROOT)+'/index.html',
  beforeParse(w){ w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>({addColorStop(){},data:[],width:0,measureText:()=>({width:10})})});
   const ch=()=>new Proxy(function(){return ch();},{get:()=>ch()}); w.L=new Proxy({},{get(){return function(){return ch();};}});
   w.onerror=()=>{}; Object.defineProperty(w.history,'replaceState',{value:()=>{},writable:true}); w.URL.createObjectURL=()=>'blob:x'; w.Worker=function(){this.postMessage=()=>{};};
   w.fetch=async(u)=>{try{const cl=String(u).split('?')[0].replace(/^file:.*?\/(?=nodal\/|profiles|config)/,'');const t=fs.readFileSync(path.join(path.resolve(ROOT),cl),'utf8');return{ok:true,json:async()=>JSON.parse(t),text:async()=>t};}catch(e){return{ok:false,json:async()=>{throw e},text:async()=>{throw e}};}};}});
 await new Promise(r=>setTimeout(r,6000)); const w=dom.window;
 const K12=require(path.resolve('pathway/roof12.js'))(w); console.log('roof12 K',K12); w.eval(`applyState(PRESETS['Today 2026']); bldSetHorizon(2040); state.bldPvTracking=1;`);
 // WX_WINDCORR=1 (message 684 (d)): the modelled years through the wind correction (the corrected reference); recorded in the output.
 if (process.env.WX_WINDCORR === '1') { w.eval('state.wxWindCorr=1;'); console.log('WX_WINDCORR: on'); }
 const r=w.eval(`(()=>{ const S={...FIXED,...state}; const k=windNewCorr(S.bldWindCorr ?? FIXED.bldWindCorr); const R=a=>Array.from(a,v=>+v.toFixed(5));
   const rd=bldRepDays(12).map(q=>({d:q.d,weight:q.weight,tail:!!q.tail,year:q.year}));
   const wy={}; for (const y of bldWeatherYears.meta.years){ const n=weatherYearNational(String(y)); wy[y]={wind:R(n.wind),windN:R(Array.from(windModOf(n.wind),v=>Math.min(1,k*v))),solar:R(n.solar),solarT:R(solarTrkOf(n.solar))}; }
   return JSON.stringify({k, windModern:bldWindModernOn(), trk:bldPvTrackingOn(), rule:S.bldRepDaysRule, T:bldTwelveYearMeans(k,true),
     fleet:{windMW:S.windMW,pvUtilityMW:S.pvUtilityMW,rooftopMW:S.rooftopMW,congPct:S.congestionCurtailOn??FIXED.congestionCurtailOn?S.congestionCurtailPct:0,roofDerate:S.rooftopDerate??0.78},
     rd, demand:R(PROFILES.demand), wind:R(PROFILES.wind), windN:R(Array.from(windModOf(PROFILES.wind),v=>Math.min(1,k*v))), solar:R(PROFILES.solar), solarT:R(solarTrkOf(PROFILES.solar)), wy}); })()`);
 fs.writeFileSync(OUT, r); const o=JSON.parse(r); console.log('k',o.k,'mod',o.windModern,'trk',o.trk,'rule',o.rule,'T',JSON.stringify(o.T),'fleet',JSON.stringify(o.fleet));
 console.log('days', o.rd.filter(q=>!q.tail).map(q=>q.d).join(','), 'tail', o.rd.filter(q=>q.tail).map(q=>q.year+':'+q.d).join(','));
 process.exit(0);
})();
