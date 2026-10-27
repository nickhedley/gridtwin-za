// Pack results table (message 381): per run, NTCSA's two criteria (mean unserved at most 20 GWh in every year; open-cycle capacity
// factor under 6% in every year), mean and worst-run unserved side by side, engine PV against the central (BASE, default c6b) and CO2.
// Usage, from harness/: node pathway/tables/packtable.js out c6b null_c6b s_nogas_c6b ... (RT: restart counts JSON; C2: criterion (ii) JSON)
const {summ}=require('./summ.js'), fs=require('fs'); const [O,...names]=process.argv.slice(2);
const C2=process.env.C2?JSON.parse(fs.readFileSync(process.env.C2)):null;   // criterion (ii) computed apart, for runs checked before it was reported
const BASE=process.env.BASE||'c6b', rows=names.map(n=>summ(O,n)).filter(Boolean), base=rows.find(r=>r.n===BASE);
const RT=process.env.RT?JSON.parse(fs.readFileSync(process.env.RT)):null;
console.log('| Run | Both NTCSA criteria | Mean unserved, highest year, GWh | Worst run, GWh | Open-cycle capacity factor, highest year | Engine PV, R bn | Against '+BASE+', R bn | CO2 2026–40, Mt |'+(RT?' Restart line, PV R bn |':''));
console.log('|---|---|---|---|---|---|---|---|'+(RT?'---|':''));
for (const r of rows){ if (C2) for (const x of r.rows) x.ocgtCF=C2[r.n].find(c=>c.y===x.y).cf;
  const iOk=r.rows.every(x=>x.mean<=20), oc=Math.max(...r.rows.map(x=>x.ocgtCF)), iiOk=oc<0.06;
  const v=iOk&&iiOk?'met':(!iOk?'not met: unserved over 20 GWh in '+r.rows.filter(x=>x.mean>20).map(x=>x.y).join(', '):'')+(!iiOk?(iOk?'not met: ':'; ')+'open-cycle over 6% in '+r.rows.filter(x=>x.ocgtCF>=0.06).map(x=>x.y).join(', '):'');
  console.log(`| ${r.n.replace(new RegExp('_'+BASE+'$'),'')} | ${v} | ${r.maxMean.toFixed(1)} | ${r.worstRun.toFixed(0)} | ${(100*oc).toFixed(1)}% | ${r.pv.toFixed(1)} | ${r.n===BASE?'–':(r.pv-base.pv>=0?'+':'−')+Math.abs(r.pv-base.pv).toFixed(1)} | ${r.co2Cum.toFixed(0)} |`+(RT?` ${RT[r.n]?RT[r.n].pv360.toFixed(1):'–'} |`:'')); }
