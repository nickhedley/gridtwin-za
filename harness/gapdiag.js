const fs=require('fs'),path=require('path');const {JSDOM}=require('jsdom');const highsLoader=require('highs');
const ROOT='testroot', P=JSON.parse(fs.readFileSync('pathway7.json')), Y=+(process.env.Y||2040);
(async()=>{
 const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
 const dom=new JSDOM(html,{runScripts:'dangerously',resources:'usable',pretendToBeVisual:true,url:'file://'+path.resolve(ROOT)+'/index.html',
  beforeParse(w){ w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>({addColorStop(){},data:[],width:0,measureText:()=>({width:10})})});
   const ch=()=>new Proxy(function(){return ch();},{get:()=>ch()}); w.L=new Proxy({},{get(){return function(){return ch();};}});
   w.onerror=()=>{}; Object.defineProperty(w.history,'replaceState',{value:()=>{},writable:true}); w.URL.createObjectURL=()=>'blob:x'; w.Worker=function(){this.postMessage=()=>{};};
   w.fetch=async(u)=>{try{const cl=String(u).split('?')[0].replace(/^file:.*?\/(?=nodal\/|profiles|config)/,'');const t=fs.readFileSync(path.join(path.resolve(ROOT),cl),'utf8');return{ok:true,json:async()=>JSON.parse(t),text:async()=>t};}catch(e){return{ok:false,json:async()=>{throw e},text:async()=>{throw e}};}};}});
 await new Promise(r=>setTimeout(r,6000)); const w=dom.window;
 const highs=await highsLoader({locateFile:f=>path.join(process.cwd(),'node_modules/highs/build',f)});
 const fix=lp=>lp.replace(/^ 0 <= b_ccgt_(\d{4}) <= [0-9.]+$/gm,(m,y)=> +y<2030 ? ` 0 <= b_ccgt_${y} <= 0` : m).replace(/^ 0 <= b_rooftop_(\d{4}) <= [0-9.]+$/gm,(m,y)=>{const v=+y>=2027?1200:0; return ` ${v} <= b_rooftop_${y} <= ${v}`;});
 w.eval(`applyState(PRESETS['Today 2026']); state.demandGrowthPct=5; bldSetHorizon(2040);`); await w.eval('loadWeatherYears()');
 const periods=P.log.map(l=>l.added).filter(a=>a&&a.year).map(a=>({year:a.year,start:a.start,n:7}));
 w.__periods=periods; const margin=+(process.env.M||0);
 const lp=w.eval(`(function(){ bldStressPeriods = window.__periods; const tg=1.05; window.__opts={growth:Math.pow(tg,1/(BLD_YEARS.length-1))-1, eaf:(state.coalEAFPct??FIXED.coalEAFPct)/100, rate:bldRates(), state:state, stressMarginMW:${margin}}; return bldBuildLP(window.__opts).lp; })()`);
 const res=highs.solve(fix(lp),{time_limit:900}); console.log('LP', res.Status, 'periods', JSON.stringify(periods));
 w.__res=res; const cols=res.Columns;
 // LP tail days for the last period
 const p=periods.length-1, sp=periods[p]; const fam={};
 for (const [c,v] of Object.entries(cols)){ const m=c.match(new RegExp('^([a-z_]+?)_'+Y+'_(11'+p+'\\d)_(\\d+)$')); if(!m) continue; const d=+m[2]-1100-10*p; fam[m[1]]=fam[m[1]]||Array(7).fill(0); fam[m[1]][d]+=(v.Primal||0)/1000; }
 console.log('LP stress week', sp.year, 'day', sp.start, 'model year', Y, '(GWh per day)');
 for (const [k,a] of Object.entries(fam)) if (a.some(x=>Math.abs(x)>0.5)) console.log('  LP', k.padEnd(8), a.map(x=>x.toFixed(0).padStart(6)).join(''));
 const out=w.eval(`(function(){ const st=bldStateForYear(window.__res, ${Y}, window.__opts); const nat=weatherYearNational('${sp.year}');
   const r=simulate(st,{demand:PROFILES.demand,solar:nat.solar,wind:nat.wind,csp:PROFILES.csp,real:true}); const o={}; const h0=${sp.start}*24;
   for (const k of Object.keys(r.stack)){ const a=r.stack[k]; if(!a||!a.length) continue; o[k]=[]; for(let d=0;d<7;d++){ let s=0; for(let h=0;h<24;h++) s+=a[h0+d*24+h]||0; o[k].push(s/1000);} }
   o._coalAvail=[]; for(let d=0;d<7;d++){ let s=0; for(let h=0;h<24;h++) s+=(r.coalAvail?r.coalAvail[h0+d*24+h]:0)||0; o._coalAvail.push(s/1000);} 
   o._build={wind:st.newWindMW,pv:st.newPvMW,batt:st.newBattMW,hrs:st.newBattHours,decom:st.coalDecomMW,ccgt:st.newCcgtMW,fe:st.newIronAirMW,vrfb:st.newVrfbMW};
   o._shedYear=r.E.unserved/1e3; return JSON.stringify(o); })()`);
 const o=JSON.parse(out); console.log('ENGINE same week (GWh per day); build', JSON.stringify(o._build), 'year shed GWh', o._shedYear.toFixed(1));
 for (const [k,a] of Object.entries(o)) if (Array.isArray(a) && a.some(x=>Math.abs(x)>0.5)) console.log('  EN', k.padEnd(10), a.map(x=>x.toFixed(0).padStart(6)).join(''));
 const sh=w.eval(`(function(){ const st=bldStateForYear(window.__res, ${Y}, window.__opts); let tot=0,n=0;
   for (const yy of bldWeatherYears.meta.years){ const nat=weatherYearNational(String(yy)); for(let k=0;k<2;k++){
     const r=simulate({...st,outageSeed:20260816+k*104729+yy*7919},{demand:PROFILES.demand,solar:nat.solar,wind:nat.wind,csp:PROFILES.csp,real:true}); tot+=r.E.unserved/1e3; n++; } }
   return JSON.stringify({meanShedGWh:tot/n, build:{wind:st.newWindMW,pv:st.newPvMW,batt:st.newBattMW,hrs:+st.newBattHours.toFixed(1),vrfb:st.newVrfbMW,fe:st.newIronAirMW,gas:st.newCcgtMW}}); })()`);
 console.log('MARGIN0', sh);
 process.exit(0);
})();
