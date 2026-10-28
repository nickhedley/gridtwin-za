// IRP 2025's build against the optimised plan at the same demand (messages 379 (c), 401). Usage, from harness/:
// CENTRAL=c6b node pathway/tables/irptable.js out out/c6b/irp [restart counts JSON]
const {summ}=require('./summ.js'), fs=require('fs'); const [ON,OI,RT]=process.argv.slice(2); const ret=RT&&fs.existsSync(RT)?JSON.parse(fs.readFileSync(RT)):{};
const C=process.env.CENTRAL||'c6b';
const rows=[[`IRP 2025 build, ${C} demand`,summ(OI,`irp2025_${C}`),summ(ON,C),C,`irp2025_${C}`],['IRP 2025 build, IRP 2025 demand',summ(OI,`irp2025_${C}_irpdem`),summ(ON,`${C}_irpdem`),`${C}_irpdem`,`irp2025_${C}_irpdem`]];
console.log('| Run | 20 GWh | Strict (half NEM) | Mean unserved, highest year / worst run, GWh | Open-cycle CF, highest year | Engine PV, R bn | Against the optimised plan at the same demand | CO2 2030 / 2035 / 2040, Mt | CO2 2026-40, Mt | Curtailed wind and solar 2026-40, TWh | Restart line PV, R bn |');
console.log('|---|---|---|---|---|---|---|---|---|---|---|');
for (const [lab,s,b,bn,rn] of rows){ const ok20=s.rows.every(r=>r.mean<=20), okS=s.rows.every(r=>r.mean<=0.5*r.stdCust);
  console.log(`| ${lab} | ${ok20?'met':'not met'} | ${okS?'met':'not met'} | ${s.maxMean.toFixed(2)} / ${s.worstRun.toFixed(0)} | ${(100*Math.max(...s.rows.map(r=>r.ocgtCF))).toFixed(2)}% | ${s.pv.toFixed(1)} | +${(s.pv-b.pv).toFixed(1)} against ${bn} (${b.pv.toFixed(1)}) | ${[2030,2035,2040].map(y=>s.co2[y].toFixed(1)).join(' / ')} | ${s.co2Cum.toFixed(0)} (${bn} ${b.co2Cum.toFixed(0)}) | ${s.rows.reduce((q,x)=>q+x.curt,0).toFixed(1)} (${bn} ${b.rows.reduce((q,x)=>q+x.curt,0).toFixed(1)}) | ${ret[rn]?ret[rn].pv360.toFixed(1):'–'} |`); }
