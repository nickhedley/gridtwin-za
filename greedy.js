const { JSDOM } = require('jsdom'); const fs=require('fs'), path=require('path');
const highsLoader=require('highs');
const ROOT='/home/claude/testroot'; const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
const dom=new JSDOM(html,{runScripts:'dangerously',resources:'usable',pretendToBeVisual:true,
 url:'file://'+path.resolve(ROOT)+'/index.html',
 beforeParse(w){ w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>({addColorStop(){},data:[],width:0,measureText:()=>({width:10})})});
  const ch=()=>new Proxy(function(){return ch();},{get:()=>ch()}); w.L=new Proxy({},{get(){return function(){return ch();};}});
  w.onerror=()=>{}; Object.defineProperty(w.history,'replaceState',{value:()=>{},writable:true});
  w.URL.createObjectURL=()=>'blob:x'; w.Worker=function(){this.postMessage=()=>{};};
  w.fetch=async(u)=>{try{const cl=String(u).split('?')[0].replace(/^file:.*?\/(?=nodal\/|profiles)/,'');
   const t=fs.readFileSync(path.join(path.resolve(ROOT),cl),'utf8');return{ok:true,json:async()=>JSON.parse(t),text:async()=>t};}
   catch(e){return{ok:false,json:async()=>{throw e},text:async()=>{throw e}};}}; }});

// GREEDY DAILY ARBITRAGE — the candidate for the browser panel.
// Each day independently: rank hours by price, charge in the cheapest hours where the
// plant is generating, discharge in the dearest. No foresight beyond the day, which is
// also more realistic than the LP's perfect-year foresight.
function greedy(gen, price, P, E, eff){
  const N=gen.length; const c=new Float64Array(N), d=new Float64Array(N);
  for(let day=0; day<Math.floor(N/24); day++){
    const h0=day*24, idx=[...Array(24).keys()].map(i=>h0+i);
    const byPrice=[...idx].sort((a,b)=>price[a]-price[b]);
    let soc=0;
    // charge cheapest-first from own output
    for(const h of byPrice){
      const room=Math.min(P, gen[h], (E-soc)/eff);
      if(room>0){ c[h]=room; soc+=room*eff; }
      if(soc>=E-1e-9) break;
    }
    // discharge dearest-first
    for(const h of [...byPrice].reverse()){
      if(soc<=1e-9) break;
      if(c[h]>0) continue;                       // do not charge and discharge same hour
      const give=Math.min(P, soc);
      if(give>0){ d[h]=give; soc-=give; }
    }
  }
  let rev=0,g=0;
  for(let h=0;h<N;h++){ rev+=price[h]*(gen[h]-c[h]+d[h]); g+=gen[h]; }
  return rev/Math.max(1,g);
}

(async()=>{
 await new Promise(r=>setTimeout(r,7000));
 const w=dom.window;
 const probe=(src)=>{const s=w.document.createElement('script'); w.__p=null;
   s.textContent=`try{window.__p=JSON.stringify((function(){${src}})());}catch(e){window.__p=JSON.stringify({error:String(e)});}`;
   w.document.body.appendChild(s); return JSON.parse(w.__p);};
 const highs=await highsLoader({locateFile:f=>path.join(__dirname,'node_modules/highs/build',f)});
 const EFF=0.88;
 const lp=(gen,price,P,E)=>{
   const N=gen.length; if(P<=0){let r=0,g=0;for(let h=0;h<N;h++){r+=gen[h]*price[h];g+=gen[h];}return r/g;}
   const L=['Maximize',' obj:']; const o=[];
   for(let h=0;h<N;h++){o.push(`+ ${price[h].toFixed(4)} d_${h}`.replace('+ -','- '));
                        o.push(`- ${price[h].toFixed(4)} c_${h}`.replace('- -','+ '));}
   L.push('  '+o.join(' ')); L.push('Subject To');
   for(let h=0;h<N;h++){const pv=h===0?`s_${N-1}`:`s_${h-1}`;
     L.push(` b_${h}: s_${h} - ${pv} - ${EFF} c_${h} + d_${h} = 0`);}
   L.push('Bounds');
   for(let h=0;h<N;h++){L.push(` 0 <= c_${h} <= ${Math.min(gen[h],P).toFixed(3)}`);
     L.push(` 0 <= d_${h} <= ${P.toFixed(3)}`); L.push(` 0 <= s_${h} <= ${E.toFixed(3)}`);}
   L.push('End');
   const r=highs.solve(L.join('\n'),{time_limit:120});
   if(r.Status!=='Optimal') return null;
   const c=new Float64Array(N), d=new Float64Array(N);
   for(const [k,v] of Object.entries(r.Columns)){const m=k.match(/^([cd])_(\d+)$/); if(m)(m[1]==='c'?c:d)[+m[2]]=v.Primal||0;}
   let rev=0,g=0; for(let h=0;h<N;h++){rev+=price[h]*(gen[h]-c[h]+d[h]);g+=gen[h];}
   return rev/g;
 };
 console.log('\nGREEDY vs LP — can a browser-speed heuristic stand in?\n');
 console.log('year  plant  batt     LP R/MWh   greedy      gap  greedy ms');
 for(const year of [2026,2030,2035]){
   const n=year-2026;
   const d=probe(`const r=simulate({...state,newWindMW:${4300*n},newPvMW:${4000*n},
     newBattMW:${4000*n},newBattHours:4},PROFILES);
     return {price:Array.from(r.marginalP),wind:Array.from(r.stack.wind),pv:Array.from(r.stack.pv),
             windCap:FIXED.windMW+${4300*n},pvCap:FIXED.pvUtilityMW+${4000*n}};`);
   if(d.error){console.log(year,'probe failed');continue;}
   for(const [pl,gen,cap] of [['solar',d.pv,d.pvCap],['wind',d.wind,d.windCap]]){
     for(const frac of [0.25,0.50]){
       const P=cap*frac, E=P*4;
       const a=lp(gen,d.price,P,E);
       const t0=Date.now(); const b=greedy(gen,d.price,P,E,EFF); const ms=Date.now()-t0;
       console.log(String(year).padEnd(6)+pl.padEnd(7)+(frac*100+'%').padEnd(8)
         +a.toFixed(0).padStart(10)+b.toFixed(0).padStart(9)
         +((100*(b/a-1)).toFixed(1)+'%').padStart(9)+String(ms).padStart(10));
     }
   }
 }
 process.exit(0);
})();
