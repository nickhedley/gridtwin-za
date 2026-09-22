// For each weather year: what the engine asked of its storage and what was available to charge
// it, written for ldes_lp.js, so an optimal schedule of the SAME store can be compared against
// the engine's own dispatch. Usage: preset years out.json
//
// REBUILT 22 Sep 2026. It used to take the residual from a run with the new storage REMOVED,
// which is a different system - different unit commitment, different pumped storage - and it
// credited the battery with pumped storage's pumping. On Deep decarbonisation 2016 that made
// the optimum look like 0 GWh against the engine's 38; on the series below it is 30.8.
const {JSDOM}=require('jsdom');const fs=require('fs'),path=require('path');const R='testroot';
const PRE=process.argv[2], YEARS=JSON.parse(process.argv[3]), OUT=process.argv[4];
const html=fs.readFileSync(R+'/index.html','utf8');
const dom=new JSDOM(html,{runScripts:'dangerously',resources:'usable',pretendToBeVisual:true,url:'file://'+path.resolve(R)+'/index.html',beforeParse(w){
w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>({addColorStop(){},data:[],width:0,measureText:()=>({width:10})})});
const ch=()=>new Proxy(function(){return ch();},{get:()=>ch()});w.L=new Proxy({},{get(){return function(){return ch();};}});
w.onerror=()=>{};w.console.warn=()=>{};w.console.log=()=>{};Object.defineProperty(w.history,'replaceState',{value:()=>{},writable:true});w.URL.createObjectURL=()=>'blob:x';w.Worker=function(){this.postMessage=()=>{};};
w.fetch=async u=>{try{const c=String(u).split('?')[0].replace(/^file:.*?\/(?=nodal\/|profiles)/,'');const t=fs.readFileSync(path.join(path.resolve(R),c),'utf8');return{ok:true,json:async()=>JSON.parse(t),text:async()=>t};}catch(e){return{ok:false,json:async()=>{throw e},text:async()=>{throw e}};}};}});
setTimeout(()=>{const w=dom.window;w.__done=null;const s=w.document.createElement('script');s.textContent=`(async()=>{try{
await loadWeatherYears(); const out={};
const st={...state,...PRESETS['${PRE}']}; const P={...FIXED,...st};
for(const y of ${JSON.stringify(YEARS)}){const n=weatherYearNational(String(y));
 const prof={demand:PROFILES.demand,solar:n.solar,wind:n.wind,csp:PROFILES.csp,real:true};
 const q=simulate(st,prof);
 const need=[],sur=[];
 for(let h=0;h<8760;h++){ need.push((q.stack.batt[h]||0)+(q.stack.unserved[h]||0));
   sur.push((q.curtailMW[h]||0)+(q.chargeBattMW[h]||0)); }
 out[y]={engine:q.E.unserved/1000,surplus:sur,deficit:need};}
out.stores=[{n:'L',P:P.newBattMW+P.battPowerMW,H:P.newBattHours,eff:P.battEff},{n:'I',P:P.newIronAirMW||0,H:P.newIronAirHours??100,eff:P.newIronAirEff??0.45}].filter(s=>s.P>0);
window.__done=JSON.stringify(out);}catch(e){window.__done=JSON.stringify({err:String(e.stack).slice(0,300)})}})();`;
w.document.body.appendChild(s);const t=setInterval(()=>{if(w.__done){fs.writeFileSync(OUT,w.__done);clearInterval(t);process.exit(0);}},500);},6000);
