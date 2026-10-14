// COST SPLIT constants (TODO 14cv, branch claude/costsplit): the engine's own carbon, emission, VoLL and variable-cost
// figures after the 'Today 2026' preset, as JSON on stdout, for costsplit_lp.py. Run from harness/.
const fs=require('fs'),path=require('path');const {JSDOM}=require('jsdom'); const ROOT='testroot';
(async()=>{ const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
 const dom=new JSDOM(html,{runScripts:'dangerously',resources:'usable',pretendToBeVisual:true,url:'file://'+path.resolve(ROOT)+'/index.html',
  beforeParse(w){ w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>({addColorStop(){},data:[],width:0,measureText:()=>({width:10})})});
   const ch=()=>new Proxy(function(){return ch();},{get:()=>ch()}); w.L=new Proxy({},{get(){return function(){return ch();};}});
   w.onerror=()=>{}; Object.defineProperty(w.history,'replaceState',{value:()=>{},writable:true}); w.URL.createObjectURL=()=>'blob:x'; w.Worker=function(){this.postMessage=()=>{};};
   w.fetch=async(u)=>{try{const cl=String(u).split('?')[0].replace(/^file:.*?\/(?=nodal\/|profiles|config)/,'');const t=fs.readFileSync(path.join(path.resolve(ROOT),cl),'utf8');return{ok:true,json:async()=>JSON.parse(t),text:async()=>t};}catch(e){return{ok:false,json:async()=>{throw e},text:async()=>{throw e}};}};}});
 await new Promise(r=>setTimeout(r,6000)); const w=dom.window; w.eval(`applyState(PRESETS['Today 2026']);`);
 const k=['carbonTaxRPerT','carbonTaxPathOn','emisCoal','emisCcgt','emisDiesel','heatRateOcgtKJ','effCcgtHHV','voll','costCoal','vomCoal','vomCcgt','vomOcgt','costDiesel','vomDiesel','lpCurtailCostR','lpBattDischargeCostR','fomCoal','costUnservedR'];
 const o=JSON.parse(w.eval(`JSON.stringify((()=>{const S={...FIXED,...state}; return Object.fromEntries(${JSON.stringify(k)}.map(x=>[x,S[x]]));})())`));
 o.BLD_DISC=+w.eval('BLD_DISC'); o.BATT_POWER_SHARE=+w.eval('BATT_POWER_SHARE');
 console.log(JSON.stringify(o)); process.exit(0); })();
