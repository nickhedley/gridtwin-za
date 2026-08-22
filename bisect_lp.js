const fs=require('fs'), path=require('path');
const {JSDOM}=require('jsdom');
const highsLoader=require('highs');
const ROOT='testroot';
(async()=>{
 const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
 const dom=new JSDOM(html,{runScripts:'dangerously',resources:'usable',pretendToBeVisual:true,
  url:'file://'+path.resolve(ROOT)+'/index.html',
  beforeParse(w){w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>({addColorStop(){},data:[],width:0,measureText:()=>({width:10})})});
   const ch=()=>new Proxy(function(){return ch();},{get:()=>ch()});w.L=new Proxy({},{get(){return function(){return ch();};}});w.onerror=()=>{};
   Object.defineProperty(w.history,'replaceState',{value:()=>{},writable:true});w.URL.createObjectURL=()=>'blob:x';w.Worker=function(){this.postMessage=()=>{};};
   w.fetch=async(u)=>{try{const cl=String(u).split('?')[0].replace(/^file:.*?\/(?=nodal\/|profiles|config)/,'');
    const t=fs.readFileSync(path.join(path.resolve(ROOT),cl),'utf8');
    return{ok:true,json:async()=>JSON.parse(t),text:async()=>t};}catch(e){return{ok:false,json:async()=>{throw e},text:async()=>{throw e}};}};}});
 await new Promise(r=>setTimeout(r,5000));
 const w=dom.window;
 const run=(src)=>{const s=w.document.createElement('script');s.textContent=src;w.document.body.appendChild(s);};
 run('bldLoadRegionalData().then(ok=>{window.__loaded=ok;});');
 await new Promise(r=>setTimeout(r,2500));
 run(`try{ applyState(PRESETS['Future electricity mix']);
   const built=bldBuildRegionalLP({growth:0.05,eaf:65,rate:BLD_PACE.none,carbonCap:null,state:state});
   window.__lp=built.lp; }catch(e){ window.__err=String(e).slice(0,200); }`);
 await new Promise(r=>setTimeout(r,600));
 if(w.__err){console.log('build error:',w.__err);return;}
 const NL=String.fromCharCode(10);
 const lines=w.__lp.split(NL);
 const highs=await highsLoader({locateFile:f=>path.join(__dirname,'node_modules/highs/build',f)});
 const strip=(preds)=>lines.filter(l=>{const t=l.trim();return !preds.some(p=>t.startsWith(p));}).join(NL);
 // Which families exist at all, and how many rows each has.
 const fams = {};
 for (const l of lines){
   const m = l.trim().match(/^([a-z]+[a-z0-9]*)_/i);
   if (m) fams[m[1]] = (fams[m[1]]||0)+1;
 }
 console.log('CONSTRAINT FAMILIES IN THE LP:');
 Object.entries(fams).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>console.log('   '+k.padEnd(12)+v));
 console.log();
 // Decisive test: shrink BLD_STORE to lithium only, rebuild, re-solve. If that
 // solves, the port of the two new technologies is the cause. If it still does
 // not, the fault predates today's storage work entirely.
 const trial = async (label, js) => {
   run('try{' + js + `
     const b2 = bldBuildRegionalLP({growth:0.05,eaf:65,rate:BLD_PACE.none,carbonCap:null,state:state});
     window.__t = b2.lp; window.__terr=null; }catch(e){ window.__terr=String(e).slice(0,150); }`);
   await new Promise(r=>setTimeout(r,700));
   if (w.__terr) { console.log('   ' + label.padEnd(34) + 'BUILD ERROR ' + w.__terr); return; }
   let st; try { st = highs.solve(w.__t,{time_limit:120}).Status; } catch(e){ st='THREW'; }
   console.log('   ' + label.padEnd(34) + st);
 };
 // Does ANY scenario solve? If none does, the infeasibility is structural and
 // predates today rather than being scenario-specific.
 const scen = async (label, opts) => {
   run(`try{ const b2 = bldBuildRegionalLP(Object.assign(
       {growth:0.05,eaf:65,rate:BLD_PACE.none,carbonCap:null,state:state}, ${JSON.stringify(opts)}));
     window.__t=b2.lp; window.__terr=null; }catch(e){ window.__terr=String(e).slice(0,150); }`);
   await new Promise(r=>setTimeout(r,700));
   if (w.__terr) { console.log('   '+label.padEnd(34)+'BUILD ERROR '+w.__terr); return; }
   let st; try { st = highs.solve(w.__t,{time_limit:90}).Status; } catch(e){ st='THREW'; }
   console.log('   '+label.padEnd(34)+st);
 };
 // Build ONE infeasible LP and dissect it. The hypothesis to test: unserved
 // energy should make any demand servable, so if it does not, either u_ is
 // absent/zeroed somewhere or the binding rows are about EXCESS, not shortage.
 run(`try{ const b2 = bldBuildRegionalLP({growth:0.05,eaf:65,rate:BLD_PACE.none,carbonCap:null,state:state});
   window.__bad=b2.lp; }catch(e){ window.__terr=String(e).slice(0,150); }`);
 await new Promise(r=>setTimeout(r,700));
 const bad = w.__bad.split(NL);
 const bals = bad.filter(l => l.trim().startsWith('bal_'));
 console.log('BALANCE ROWS:', bals.length);
 console.log('   missing u_ :', bals.filter(l => !/\bu_/.test(l)).length);
 console.log('   missing crt_:', bals.filter(l => !/\bcrt_/.test(l)).length);
 console.log();
 // Bounds on the two slack variables
 const bnd = bad.filter(l => /0 <= (u_|crt_)/.test(l.trim()));
 console.log('SLACK BOUNDS, first two of each:');
 bnd.filter(l=>/u_/.test(l)).slice(0,2).forEach(l=>console.log('   '+l.trim()));
 bnd.filter(l=>/crt_/.test(l)).slice(0,2).forEach(l=>console.log('   '+l.trim()));
 console.log();
 // Relax each candidate family and re-solve, to find which one actually binds.
 const strip2 = (preds) => bad.filter(l=>{const t=l.trim();return !preds.some(p=>t.startsWith(p));}).join(NL);
 const t2 = (label, preds) => {
   let st; try { st = highs.solve(strip2(preds),{time_limit:90}).Status; } catch(e){ st='THREW'; }
   console.log('   '+label.padEnd(32)+st);
 };
 // Keep ONLY the balance rows plus bounds. If that is still infeasible, the
 // balance equality itself cannot be satisfied - which given u_ and crt_ are
 // both present and generously bounded would point at a coefficient problem
 // rather than a constraint interaction.
 const FAMS = ['txa_','txb_','cmax_','bdismax_','bchgmax_','vdismax_','vchgmax_',
               'idismax_','ichgmax_','soc_','ecap_','dur_','rrate_','hw_','hp_','hb_','rate_'];
 const onlyBal = bad.filter(l => { const t = l.trim(); return !FAMS.some(f => t.startsWith(f)); }).join(NL);
 let st0; try { st0 = highs.solve(onlyBal,{time_limit:90}).Status; } catch(e){ st0='THREW'; }
 console.log('ONLY bal_ rows kept:', st0);
 console.log();
 if (st0 === 'Optimal'){
   console.log('ADDING FAMILIES BACK ONE AT A TIME:');
   for (const f of FAMS){
     const keep = FAMS.filter(x => x !== f);
     const lp2 = bad.filter(l => { const t = l.trim(); return !keep.some(k => t.startsWith(k)); }).join(NL);
     let st; try { st = highs.solve(lp2,{time_limit:90}).Status; } catch(e){ st='THREW'; }
     console.log('   bal_ + ' + f.padEnd(12) + st);
   }
 }
 console.log();
})();
