// COAL_PARTLOAD_2026 against a central run's 2026 (user, 27 Oct 2026, message 450; TODO 14kc). On 27f the constant was re-recorded
// from the Today 2026 preset so the c6c runs use a calibrated value; this checks it against the central run's own 2026, the
// documented method. The run's 2026 coal rate is its engine-check CO2 less open-cycle diesel (and gas, at the CCGT factor) over
// its coal output; the part-load mean is that rate over the page's emisCoal. Constants are read from the page, not typed here.
// Usage, from harness/ of the run commit: node pathway/partload_check.js out/pathcheck_c6c_a.json
const fs=require('fs'),path=require('path');const {JSDOM}=require('jsdom');
const ROOT='testroot';
(async()=>{
 const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
 const dom=new JSDOM(html,{runScripts:'dangerously',resources:'usable',pretendToBeVisual:true,url:'file://'+path.resolve(ROOT)+'/index.html',
  beforeParse(w){ w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>({addColorStop(){},data:[],width:0,measureText:()=>({width:10})})});
   const ch=()=>new Proxy(function(){return ch();},{get:()=>ch()}); w.L=new Proxy({},{get(){return function(){return ch();};}});
   w.onerror=()=>{}; Object.defineProperty(w.history,'replaceState',{value:()=>{},writable:true}); w.URL.createObjectURL=()=>'blob:x'; w.Worker=function(){this.postMessage=()=>{};};
   w.fetch=async(u)=>{try{const cl=String(u).split('?')[0].replace(/^file:.*?\/(?=nodal\/|profiles|config)/,'');const t=fs.readFileSync(path.join(path.resolve(ROOT),cl),'utf8');return{ok:true,json:async()=>JSON.parse(t),text:async()=>t};}catch(e){return{ok:false,json:async()=>{throw e},text:async()=>{throw e}};}};}});
 await new Promise(r=>setTimeout(r,6000)); const w=dom.window;

 const rows = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')), r = rows.find(x => x.y === 2026);
 if (!r) { console.error('no 2026 row in ' + process.argv[2]); process.exit(1); }
 const P = JSON.parse(w.eval('JSON.stringify({ BUILD_STAMP, rec: COAL_PARTLOAD_2026, emisCoal: FIXED.emisCoal, emisCcgt: FIXED.emisCcgt, emisDiesel: FIXED.emisDiesel, fy26: COAL_CO2_PER_MWH_FY26 })'));
 const rate = (r.co2 * 1e6 - (r.gasTWh || 0) * 1e6 * P.emisCcgt - (r.diesel || 0) * 1e6 * P.emisDiesel) / (r.coal * 1e6);
 const mult = rate / P.emisCoal, diffPp = 100 * (mult - P.rec);
 console.log(JSON.stringify({ file: process.argv[2], build: P.BUILD_STAMP, nRuns: r.nRuns, coalTWh: +r.coal.toFixed(2), co2Mt: +r.co2.toFixed(2),
   rate: +rate.toFixed(4), eskomFY26: +P.fy26.toFixed(4), partloadRun: +mult.toFixed(4), recorded: P.rec, diffPp: +diffPp.toFixed(2),
   over01pp: Math.abs(diffPp) > 0.1 }));
 process.exit(0);
})();
