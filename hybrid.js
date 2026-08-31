#!/usr/bin/env node
/**
 * hybrid.js — does co-locating a battery rescue a project's merchant revenue?
 *
 * A price-taker LP per plant. The battery is BEHIND THE METER: it can only charge from
 * its own plant's output, which is what a hybrid actually is and what distinguishes it
 * from a merchant battery. It may discharge at any hour.
 *
 *   sold[h] = gen[h] - c[h] + d[h]
 *   soc[h]  = soc[h-1] + eff*c[h] - d[h]      cyclic
 *   0 <= c[h] <= min(gen[h], P)   0 <= d[h] <= P   0 <= soc <= E
 *   maximise  sum_h price[h] * sold[h]
 *
 * Prices come from a full system dispatch at the year in question, so the plant is a
 * price taker in a market already shaped by everyone else's build. PERFECT FORESIGHT,
 * so results are an UPPER BOUND on what co-location can recover.
 */
const fs=require('fs'), path=require('path');
const { JSDOM } = require('jsdom');
const highsLoader=require('highs');
const ROOT='/home/claude/testroot';
const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
const dom=new JSDOM(html,{runScripts:'dangerously',resources:'usable',pretendToBeVisual:true,
 url:'file://'+path.resolve(ROOT)+'/index.html',
 beforeParse(w){ w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>({addColorStop(){},data:[],width:0,measureText:()=>({width:10})})});
  const ch=()=>new Proxy(function(){return ch();},{get:()=>ch()}); w.L=new Proxy({},{get(){return function(){return ch();};}});
  w.onerror=()=>{}; Object.defineProperty(w.history,'replaceState',{value:()=>{},writable:true});
  w.URL.createObjectURL=()=>'blob:x'; w.Worker=function(){this.postMessage=()=>{};};
  w.fetch=async(u)=>{try{const cl=String(u).split('?')[0].replace(/^file:.*?\/(?=nodal\/|profiles)/,'');
   const t=fs.readFileSync(path.join(path.resolve(ROOT),cl),'utf8');return{ok:true,json:async()=>JSON.parse(t),text:async()=>t};}
   catch(e){return{ok:false,json:async()=>{throw e},text:async()=>{throw e}};}}; }});

(async()=>{
 await new Promise(r=>setTimeout(r,7000));
 const w=dom.window;
 const probe=(src)=>{const s=w.document.createElement('script'); w.__p=null;
   s.textContent=`try{window.__p=JSON.stringify((function(){${src}})());}catch(e){window.__p=JSON.stringify({error:String(e)});}`;
   w.document.body.appendChild(s); return JSON.parse(w.__p);};

 const highs=await highsLoader({locateFile:f=>path.join(__dirname,'node_modules/highs/build',f)});
 const EFF=0.88;

 const solve=(gen, price, Pfrac, hours, plantMW)=>{
   const N=gen.length, P=plantMW*Pfrac, E=P*hours;
   if(P<=0){ let r=0,g=0; for(let h=0;h<N;h++){r+=gen[h]*price[h]; g+=gen[h];} return {rev:r, mwh:g}; }
   const L=['Maximize',' obj:'];
   const o=[];
   for(let h=0;h<N;h++){ o.push(`+ ${price[h].toFixed(4)} d_${h}`.replace('+ -','- '));
                         o.push(`- ${price[h].toFixed(4)} c_${h}`.replace('- -','+ ')); }
   L.push('  '+o.join(' '));
   L.push('Subject To');
   for(let h=0;h<N;h++){
     const prev = h===0 ? `s_${N-1}` : `s_${h-1}`;
     L.push(` bal_${h}: s_${h} - ${prev} - ${EFF.toFixed(4)} c_${h} + d_${h} = 0`);
   }
   L.push('Bounds');
   for(let h=0;h<N;h++){
     L.push(` 0 <= c_${h} <= ${Math.min(gen[h],P).toFixed(3)}`);
     L.push(` 0 <= d_${h} <= ${P.toFixed(3)}`);
     L.push(` 0 <= s_${h} <= ${E.toFixed(3)}`);
   }
   L.push('End');
   const res=highs.solve(L.join('\n'),{time_limit:120});
   if(res.Status!=='Optimal') return null;
   let rev=0,g=0;
   const c=new Float64Array(N), d=new Float64Array(N);
   for(const [k,v] of Object.entries(res.Columns)){
     const m=k.match(/^([cd])_(\d+)$/); if(!m) continue;
     (m[1]==='c'?c:d)[+m[2]] = v.Primal||0;
   }
   for(let h=0;h<N;h++){ rev += price[h]*(gen[h]-c[h]+d[h]); g += gen[h]; }
   return {rev, mwh:g};
 };

 const PACE={wind:4300, pv:4000, batt:4000};
 console.log('\nCO-LOCATED BATTERY, project-level price-taker LP');
 console.log('Grid pace. Battery sized as a share of plant capacity, 4-hour duration.\n');
 for(const year of [2026,2030,2035]){
   const n=year-2026;
   const d=probe(`
     const r=simulate({...state,
       newWindMW:${PACE.wind*n}, newPvMW:${PACE.pv*n}, newBattMW:${PACE.batt*n}, newBattHours:4}, PROFILES);
     return { price:Array.from(r.marginalP),
              wind:Array.from(r.stack.wind), pv:Array.from(r.stack.pv),
              windCap:FIXED.windMW+${PACE.wind*n}, pvCap:FIXED.pvUtilityMW+${PACE.pv*n} };`);
   if(d.error){ console.log(year,'probe failed'); continue; }
   console.log(`${year}   ${( (d.windCap+d.pvCap)/1000 ).toFixed(1)} GW wind+solar installed`);
   console.log(`        ${'battery'.padEnd(14)}${'solar R/MWh'.padStart(13)}${'uplift'.padStart(9)}`
     + `${'wind R/MWh'.padStart(13)}${'uplift'.padStart(9)}`);
   const base={};
   for(const [lab,frac] of [['none',0],['25% of plant',0.25],['50% of plant',0.50],['100% of plant',1.0]]){
     const sv=solve(d.pv, d.price, frac, 4, d.pvCap);
     const wv=solve(d.wind, d.price, frac, 4, d.windCap);
     if(!sv||!wv){ console.log('        solve failed at',lab); continue; }
     const s=sv.rev/sv.mwh, wr=wv.rev/wv.mwh;
     if(frac===0){ base.s=s; base.w=wr; }
     console.log(`        ${lab.padEnd(14)}${s.toFixed(0).padStart(13)}`
       + `${(frac?((100*(s/base.s-1)).toFixed(0)+'%'):'-').padStart(9)}`
       + `${wr.toFixed(0).padStart(13)}`
       + `${(frac?((100*(wr/base.w-1)).toFixed(0)+'%'):'-').padStart(9)}`);
   }
   console.log();
 }
 process.exit(0);
})();
