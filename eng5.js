const { JSDOM } = require('jsdom');
const fs=require('fs'), path=require('path');
const html=fs.readFileSync('testroot/index.html','utf8');
const dom=new JSDOM(html,{runScripts:'dangerously',resources:'usable',
 url:'file://'+path.resolve('testroot')+'/index.html',pretendToBeVisual:true,
 beforeParse(w){
  w.HTMLCanvasElement.prototype.getContext=()=>({clearRect(){},fillRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},fill(){},closePath(){},arc(){},save(){},restore(){},measureText(){return{width:0}},fillText(){},createLinearGradient(){return{addColorStop(){}}},setTransform(){},createPattern(){return null;},strokeRect(){},translate(){},scale(){},rotate(){},setLineDash(){},strokeText(){},getImageData(){return{data:[]}},transform(){},drawImage(){},putImageData(){},clip(){},quadraticCurveTo(){},bezierCurveTo(){},rect(){}});
  const chain=()=>new Proxy(function(){return chain();},{get:()=>chain()});
  w.L=new Proxy({},{get(){return function(){return chain();};}}); w.onerror=()=>{};
  Object.defineProperty(w.history,'replaceState',{value:()=>{},writable:true});
  w.URL.createObjectURL=()=>'blob:x'; w.Worker=function(){this.postMessage=()=>{};};
 }});
dom.window.fetch=async(u)=>{try{const cl=String(u).split('?')[0];const t=fs.readFileSync(path.join(path.resolve('testroot'),cl),'utf8');return{ok:true,json:async()=>JSON.parse(t),text:async()=>t};}catch(e){return{ok:false,json:async()=>{throw e}};}};
setTimeout(()=>{
 const w=dom.window, doc=w.document;
 const set=(id,v)=>{const el=doc.getElementById('in_'+id); if(el){el.value=String(v); el.dispatchEvent(new w.Event('input',{bubbles:true}));}};
 const preset=n=>{const b=[...doc.querySelectorAll('#presets button')].find(x=>x.textContent===n); if(b)b.click();};
 const M=1e6, fails=[];
 const sweep=(id,vals,fn)=>vals.map(v=>{preset('Today 2026'); set(id,v); w.run(); return fn(w.lastRes);});

 // 1. more VRE must monotonically reduce coal generation
 const coal=sweep('newPvMW',[0,10000,20000,30000,40000],r=>r.E.coal/M);
 const mono1=coal.every((v,i)=>i===0||v<=coal[i-1]+0.5);
 console.log('1. coal falls as solar rises  :', coal.map(x=>x.toFixed(0)).join(' -> '), mono1?'ok':'*** NOT MONOTONIC ***');
 if(!mono1) fails.push('coal vs solar');

 // 2. more VRE must monotonically raise curtailment
 const curt=sweep('newPvMW',[0,10000,20000,30000,40000],r=>r.E.curtailed/M);
 const mono2=curt.every((v,i)=>i===0||v>=curt[i-1]-0.5);
 console.log('2. curtailment rises w/ solar :', curt.map(x=>x.toFixed(0)).join(' -> '), mono2?'ok':'*** NOT MONOTONIC ***');
 if(!mono2) fails.push('curtailment');

 // 3. higher EAF must reduce unserved energy
 const uns=sweep('coalEAFPct',[45,50,55,60,65,70],r=>r.E.unserved/M);
 const mono3=uns.every((v,i)=>i===0||v<=uns[i-1]+0.02);
 console.log('3. unserved falls as EAF rises:', uns.map(x=>x.toFixed(2)).join(' -> '), mono3?'ok':'*** NOT MONOTONIC ***');
 if(!mono3) fails.push('unserved vs EAF');

 // 4. higher demand must raise system cost
 const cost=sweep('demandGrowthPct',[-10,0,20,50,80],r=>r.totalCost/1e9);
 const mono4=cost.every((v,i)=>i===0||v>=cost[i-1]-1);
 console.log('4. cost rises with demand     :', cost.map(x=>x.toFixed(0)).join(' -> '), mono4?'ok':'*** NOT MONOTONIC ***');
 if(!mono4) fails.push('cost vs demand');

 // 5. more storage must not increase curtailment
 const cs=sweep('newBattMW',[0,10000,20000,30000],r=>{return r.E.curtailed/M;});
 // note: run with solar fixed high so there IS something to absorb
 const cs2=[0,10000,20000,30000].map(v=>{preset('Today 2026'); set('newPvMW',30000); set('newBattMW',v); w.run(); return w.lastRes.E.curtailed/M;});
 const mono5=cs2.every((v,i)=>i===0||v<=cs2[i-1]+0.5);
 console.log('5. storage cuts curtailment   :', cs2.map(x=>x.toFixed(0)).join(' -> '), mono5?'ok':'*** NOT MONOTONIC ***');
 if(!mono5) fails.push('storage vs curtailment');

 // 6. more storage must not increase unserved energy
 const us=[0,10000,20000,30000].map(v=>{preset('Today 2026'); set('coalEAFPct',48); set('newBattMW',v); w.run(); return w.lastRes.E.unserved/M;});
 const mono6=us.every((v,i)=>i===0||v<=us[i-1]+0.02);
 console.log('6. storage cuts unserved      :', us.map(x=>x.toFixed(2)).join(' -> '), mono6?'ok':'*** NOT MONOTONIC ***');
 if(!mono6) fails.push('storage vs unserved');

 console.log('\n'+(fails.length?'FAILURES: '+fails.join(', '):'all 6 monotonicity checks pass'));
 process.exit(0);
},7000);
