// Regional pumped hydro (ANU shortlist tiers) in the regional build LP: siting and curtailment only, not adequacy
// (that LP has no tail days). Solves the regional LP without and with pumped hydro on one preset and reports,
// per region, pumped hydro built by class, wind and solar built, and curtailment in the final year (weighted
// over the representative days). 7 Oct 2026. Run from harness/:
//   PRESET='Deep decarbonisation 2035' PHES_FIRST=2035 OUT=ext/regional_phes.json node ext/regional_phes.js
const fs=require('fs'),path=require('path'),cp=require('child_process'),os=require('os');const {JSDOM}=require(process.cwd()+'/node_modules/jsdom');
const ROOT='testroot', PRESET=process.env.PRESET||'Deep decarbonisation 2035', OUT=process.env.OUT||'ext/regional_phes.json';
(async()=>{
 const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
 const dom=new JSDOM(html,{runScripts:'dangerously',resources:'usable',pretendToBeVisual:true,url:'file://'+path.resolve(ROOT)+'/index.html',
  beforeParse(w){ w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>({addColorStop(){},data:[],width:0,measureText:()=>({width:10})})});
   const ch=()=>new Proxy(function(){return ch();},{get:()=>ch()}); w.L=new Proxy({},{get(){return function(){return ch();};}});
   w.onerror=()=>{}; Object.defineProperty(w.history,'replaceState',{value:()=>{},writable:true}); w.URL.createObjectURL=()=>'blob:x'; w.Worker=function(){this.postMessage=()=>{};};
   w.fetch=async(u)=>{try{const cl=String(u).split('?')[0].replace(/^file:.*?\/(?=nodal\/|profiles|config)/,'');const t=fs.readFileSync(path.join(path.resolve(ROOT),cl),'utf8');return{ok:true,json:async()=>JSON.parse(t),text:async()=>t};}catch(e){return{ok:false,json:async()=>{throw e},text:async()=>{throw e}};}};}});
 for(let i=0;i<60;i++){ if(dom.window.GTZA_READY) break; await new Promise(r=>setTimeout(r,250)); }
 const w=dom.window;
 if(!(await w.eval('bldLoadRegionalData()'))) throw new Error('regional data did not load');
 if(!w.eval('!!(bldPhesSites && bldPhesSites.regions)')) throw new Error('phes_sites_region.json did not load');
 w.eval(`applyState(PRESETS[${JSON.stringify(PRESET)}]); bldSetHorizon(${+(process.env.HORIZON||2040)});`);   // the default horizon is 2030, before pumped hydro's first year
 // WINDMOD (7 Oct 2026): 1 (default) new wind on the modern-turbine profile at modern capex (regional map, build 07u);
 // 0 old capex on the old profile together. Recorded in the output.
 if (process.env.WINDMOD!==undefined) w.eval(`state.bldWindModern=${+process.env.WINDMOD};`);
 const WIND_BASIS = { windModern: +w.eval('(state.bldWindModern ?? FIXED.bldWindModern)'), windCapexRkW: Math.round(+w.eval('bldCostEntry("wind").c2026')) };
 console.log('wind basis', JSON.stringify(WIND_BASIS));
 const solve=(lp)=>{ const tmp=path.join(os.tmpdir(),'gtza_reg_'+process.pid); fs.writeFileSync(tmp+'.lp',lp);
   cp.execFileSync('python3',['highs_native.py',tmp+'.lp',tmp+'.json',String(process.env.TL||3600)],{stdio:'inherit'});
   const r=JSON.parse(fs.readFileSync(tmp+'.json','utf8')); fs.unlinkSync(tmp+'.lp'); fs.unlinkSync(tmp+'.json'); return r; };
 const out={preset:PRESET, stamp:w.eval('BUILD_STAMP')+' + regional pumped-hydro patch (uncommitted)', windBasis:WIND_BASIS, label:WIND_BASIS.windModern ? 'new wind on the modern-turbine profile at modern capex (regional map, build 07u)' : 'new wind on the current-turbine profile at the old capex (modern switch off)', runs:{}};
 for (const on of [0,1]){
   const lp=w.eval(`(function(){ const tg=1+(state.demandGrowthPct||0)/100;
     const st={...state, bldPhesOn:${on}, bldPhesFirstYear:${+(process.env.PHES_FIRST||2035)}};
     return bldBuildRegionalLP({growth:Math.pow(tg,1/Math.max(1,BLD_YEARS.length-1))-1, eaf:(state.coalEAFPct??FIXED.coalEAFPct)/100, rate:bldRates(), state:st}).lp; })()`);
   const t0=Date.now(), res=solve(lp); if(res.Status!=='Optimal') throw new Error('not optimal: '+res.Status);
   const C=res.Columns, v=n=>(C[n]||{Primal:0}).Primal;
   const R=JSON.parse(w.eval('JSON.stringify(BLD_REGIONS)')), Y=JSON.parse(w.eval('JSON.stringify(BLD_YEARS)')), yN=Y[Y.length-1];
   const rd=JSON.parse(w.eval('JSON.stringify(bldRepDays(8).filter(r=>!r.tail).map(r=>({d:r.d,weight:r.weight})))'));
   const reg={};
   R.forEach((name,ri)=>{ const ph={}; for(const c of ['AAA','AA','A','B']){ let s=0; for(const y of Y) s+=v('b_ph'+c+'_'+ri+'_'+y); if(s>0.5) ph[c]=Math.round(s); }
     let wind=0,pv=0; for(const y of Y){ wind+=v('b_wind_'+ri+'_'+y); pv+=v('b_pv_'+ri+'_'+y); }
     let crt=0; for(const r of rd) for(let h=0;h<24;h++) crt+=v('crt_'+ri+'_'+yN+'_'+r.d+'_'+h)*r.weight;
     reg[name]={ph, windMW:Math.round(wind), pvMW:Math.round(pv), curtailGWh:+(crt/1e3).toFixed(1)}; });
   out.runs[on?'with_phes':'without']={objectiveRbn:+(res.ObjectiveValue/1e9).toFixed(1), secs:(Date.now()-t0)/1000, year:yN, regions:reg};
   console.log(on?'WITH pumped hydro':'WITHOUT', 'objective R'+(res.ObjectiveValue/1e9).toFixed(1)+'bn', JSON.stringify(reg));
 }
 fs.writeFileSync(OUT, JSON.stringify(out,null,1)); process.exit(0);
})();
