// One summary per run (379 (c)): engine PV 2026-40 at 8% real (cost; with grid: costGrid), CO2, adequacy (mean and worst-run unserved
// against the run's own target), criterion (ii) (ocgtCF, all open-cycle plant) and the build standing in 2030, 2035 and 2040.
const fs=require('fs');
function summ(O, n){ const P=JSON.parse(fs.readFileSync(`${O}/pathway_${n}.json`)); let rows=[];
  for (const g of ['a','b','c']){ const f=`${O}/pathcheck_${n}_${g}.json`; if (!fs.existsSync(f)) return null; rows.push(...Object.values(JSON.parse(fs.readFileSync(f)))); }
  rows.sort((a,b)=>a.y-b.y); const d=y=>Math.pow(1.08,-(y-2026));
  const pv=rows.reduce((s,r)=>s+r.cost*d(r.y),0), pvG=rows.reduce((s,r)=>s+r.costGrid*d(r.y),0);
  const cum={}, c={}; for (const y of Object.keys(P.sched).sort()){ for (const k of ['wind','pv','rooftop','batt','battMWh','ccgt','ocgt','ocgd','ironair','vrfb','phes','off']) c[k]=(c[k]||0)+(P.sched[y][k]||0); cum[y]={...c, coalMW:P.sched[y].coalMW}; }
  const at=y=>{ const b=cum[y]; return {wind:b.wind,pv:b.pv,roof:b.rooftop,li:b.batt,liH:b.batt?b.battMWh/b.batt:0,ccgt:b.ccgt,ocgtGas:b.ocgt,ocgtDsl:b.ocgd,ironair:b.ironair,vrfb:b.vrfb,phes:b.phes,off:b.off,coal:b.coalMW}; };
  const over=rows.filter(r=>r.mean>r.target+1e-9).map(r=>r.y);
  return { n, verdict:P.verdict, std:P.standard||null, pv, pvG, co2:Object.fromEntries(rows.map(r=>[r.y,r.co2])), co2Cum:rows.reduce((s,r)=>s+r.co2,0),
    maxMean:Math.max(...rows.map(r=>r.mean)), worstRun:Math.max(...rows.map(r=>r.worst)), target:rows.map(r=>r.target), over,
    ocgtCF:Object.fromEntries(rows.map(r=>[r.y,r.ocgtCF])), ocgtOver:rows.filter(r=>r.ocgtCF>=0.06).map(r=>r.y),
    build:{2030:at(2030),2035:at(2035),2040:at(2040)}, rows };
}
module.exports={summ};
if (require.main===module){ const O=process.argv[2]; for (const n of process.argv.slice(3)){ const s=summ(O,n); if(!s){console.log(n,'incomplete');continue;}
  console.log(`${n}: ${s.verdict} PV R${s.pv.toFixed(1)}bn (grid R${s.pvG.toFixed(1)}bn) CO2 2030/35/40 ${[2030,2035,2040].map(y=>s.co2[y].toFixed(1)).join('/')} cum ${s.co2Cum.toFixed(0)} Mt | unserved max mean ${s.maxMean.toFixed(2)} worst run ${s.worstRun.toFixed(1)} GWh, target ${Math.min(...s.target).toFixed(1)}-${Math.max(...s.target).toFixed(1)}, over: ${s.over.join(',')||'none'} | ocgtCF max ${(100*Math.max(...Object.values(s.ocgtCF).filter(v=>v!=null))).toFixed(1)}% over6: ${s.ocgtOver.join(',')||'none'}`);
  for (const y of [2030,2035,2040]){ const b=s.build[y]; console.log(`   ${y} GW: wind ${(b.wind/1e3).toFixed(1)} pv ${(b.pv/1e3).toFixed(1)} roof ${(b.roof/1e3).toFixed(1)} li ${(b.li/1e3).toFixed(1)} (${b.liH.toFixed(1)}h) ccgt ${(b.ccgt/1e3).toFixed(2)} ocgt-gas ${(b.ocgtGas/1e3).toFixed(2)} ocgt-dsl ${(b.ocgtDsl/1e3).toFixed(2)} fe ${(b.ironair/1e3).toFixed(1)} vrfb ${(b.vrfb/1e3).toFixed(1)} phes ${(b.phes/1e3).toFixed(1)} off ${(b.off/1e3).toFixed(1)} coal ${(b.coal/1e3).toFixed(1)}`); } } }
