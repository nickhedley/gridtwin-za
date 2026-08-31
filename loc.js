#!/usr/bin/env node
/**
 * loc.js — re-run the locational transmission finding AS PUBLISHED.
 * Scenario: default state, MASTERPLAN build pace, regional build LP, duals on the
 * hw_/hp_ connection-headroom rows in the final year.
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
   const t=fs.readFileSync(path.join(path.resolve(ROOT),cl),'utf8');
   return{ok:true,json:async()=>JSON.parse(t),text:async()=>t};}
   catch(e){return{ok:false,json:async()=>{throw e},text:async()=>{throw e}};}}; }});
setTimeout(async ()=>{
  const w=dom.window;
  const probe=(src)=>{const s=w.document.createElement('script'); w.__p=null;
    s.textContent=`try{window.__p=JSON.stringify((function(){${src}})());}catch(e){window.__p=JSON.stringify({error:String(e)+' '+(e.stack||'').slice(0,200)});}`;
    w.document.body.appendChild(s); return JSON.parse(w.__p);};
  // the builder is synchronous but its inputs are not - load them first
  const sc=w.document.createElement('script');
  sc.textContent='window.__ready=false; bldLoadRegionalData().then(ok=>{window.__ready=ok;});';
  w.document.body.appendChild(sc);
  const tw=Date.now();
  while(w.__ready===false && Date.now()-tw<60000) await new Promise(r=>setTimeout(r,500));
  console.log('regional data loaded:', w.__ready);
  const built=probe(`
    const el=document.getElementById('bldPace'); if(el){el.value='masterplan'; bldPaceChanged();}
    const rg=document.getElementById('bldRegional'); if(rg) rg.value='1';
    // opts exactly as runBuildOpt assembles them
    const totalGrowth = 1 + (state.demandGrowthPct || 0)/100;
    const o=bldBuildRegionalLP({
      growth: Math.pow(totalGrowth, 1/5) - 1,
      eaf: (state.coalEAFPct ?? FIXED.coalEAFPct) / 100,
      rate: bldRates(), state: state });
    return { lp:o.lp, keys:Object.keys(o),
             regions:(o.rows||[]).map(x=>x.name||x.region||x.r),
             years:(typeof BLD_YEARS!=='undefined'?BLD_YEARS:null) };`);
  if(built.error){ console.log('build failed:', built.error); process.exit(1); }
  console.log('LP built:', (built.lp.length/1e6).toFixed(1),'MB · regions', built.regions.length,'· years', built.years);
  const highs=await highsLoader({locateFile:f=>path.join(__dirname,'node_modules/highs/build',f)});
  const t0=Date.now();
  const res=highs.solve(built.lp,{time_limit:900});
  console.log('solved in', ((Date.now()-t0)/1000).toFixed(0),'s · status', res.Status);
  if(res.Status!=='Optimal'){ process.exit(1); }
  // recover row names in emission order
  const lines=built.lp.split('\n');
  const ci=lines.findIndex(l=>/^Subject To$/.test(l.trim()));
  const bi=lines.findIndex((l,i)=>i>ci&&/^Bounds$/.test(l.trim()));
  const names=[];
  for(let i=ci+1;i<(bi<0?lines.length:bi);i++){
    const m=lines[i].match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*:/); if(m) names.push(m[1]);
  }
  const nRows=Object.keys(res.Rows||{}).length;
  console.log('rows parsed', names.length.toLocaleString(), '· returned', nRows.toLocaleString(),
              '·', names.length===nRows?'MATCH':'MISMATCH — duals unreliable');
  if(names.length!==nRows) process.exit(1);
  const last=built.years[built.years.length-1];
  const out=[];
  Object.entries(res.Rows).forEach(([k,v])=>{
    const n=names[+k]; if(!n) return;
    const m=n.match(/^h([wp])_(\d+)_(\d+)$/); if(!m) return;
    if(+m[3]!==last) return;
    out.push({tech:m[1]==='w'?'wind':'pv', ri:+m[2], dual:Math.abs(v.Dual||0)});
  });
  const byR={};
  out.forEach(x=>{ byR[x.ri]=byR[x.ri]||{}; byR[x.ri][x.tech]=x.dual; });
  const rows=Object.entries(byR).map(([ri,v])=>({r:built.regions[ri]||('region '+ri),
    wind:v.wind||0, pv:v.pv||0})).sort((a,b)=>b.wind-a.wind);
  console.log(`\n${'region'.padEnd(16)}${'wind headroom dual'.padStart(20)}${'PV headroom dual'.padStart(19)}`);
  rows.forEach(x=>console.log(`${String(x.r).padEnd(16)}${Math.round(x.wind).toLocaleString().padStart(20)}${Math.round(x.pv).toLocaleString().padStart(19)}`));
  const nz=rows.filter(x=>x.wind>0).map(x=>x.wind);
  if(nz.length>1) console.log(`\nwind spread across regions with a non-zero dual: ${(Math.max(...nz)/Math.min(...nz)).toFixed(0)}x`);
  process.exit(0);
},8000);
