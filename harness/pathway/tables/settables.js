// Every results table for one run set, as markdown, for RESULTS and the pack (user, 27 Oct 2026, message 449 (b), (c)).
// Usage, from harness/ of the run commit with the set's outputs in place:
//   node pathway/tables/settables.js out out/c6c c6c [c6b]      > tables_c6c.md
// Arguments: the run folder, the set's own folder (progress.txt and irp/), the set's name and, optionally, a second set to compare
// against (its runs in the same run folder, its IRP pair in out/<second>/irp). A run without all three check groups is listed as
// not run, with the reason the chain's progress.txt gives. The nuclear-charge IRP checks are left out (message 417 (b)).
const {summ}=require('./summ.js'), fs=require('fs'), path=require('path');
const [O,N,C,B]=process.argv.slice(2);
if (!C){ console.error('usage: node pathway/tables/settables.js <run folder> <set folder> <set> [compare set]'); process.exit(1); }
// The set's runs, in chain_c6c.sh's order (chain_c6b.sh's for c6b); the names carry the set's suffix.
const SENS=['null','s_irpgas','s_be6','s_be7','s_windlow','s_windhigh','s_carbontreasury','s_carbonhold','s_gascapex25','s_gas2030','s_imp',
  's_demlowflat','s_demlowm1','s_coalpractice','s_rate48','s_spotoil','s_wearp75','s_koeberg_winter','s_ntcsa_both','s_nogas_dsl',
  's_std_strict','s_std_nem','s_coalsustain','s_nogas','s_std_strict_nogas_dsl','s_std_nem_nogas_dsl','s_std_strict_nogas','s_std_nem_nogas',
  's_pvbw6','s_disc5','s_discirp','s_gas2032','s_gas2035_nodsl','s_cocplan','s_cochigh','s_coclow','s_cocprivate']
  // s_pvbw6, s_disc5 and s_discirp ran beside c6c's chain only (462, 465, 466); the gas-2035 and cost-of-capital runs are c6e's (469, 475).
  // s_windlow is not in c6e's set (469: its capex backed out of BW5's tariff at 8% would count wind's finance twice).
  .filter(s=>s==='s_windlow' ? C==='c6b'||C==='c6c' : ['s_pvbw6','s_disc5','s_discirp'].includes(s) ? C==='c6c' : ['s_gas2032','s_gas2035_nodsl','s_cocplan','s_cochigh','s_coclow','s_cocprivate'].includes(s) ? C!=='c6b' && C!=='c6c' : true);
const names=[C, `${C}_irpdem`, ...SENS.map(s=>`${s}_${C}`)];
const prog=fs.existsSync(`${N}/progress.txt`)?fs.readFileSync(`${N}/progress.txt`,'utf8'):'';
const why=n=>{ const m=prog.split('\n').filter(l=>l.includes(`NOT RUN ${n}:`)).pop(); if (m) return m.replace(/^.*NOT RUN [^:]*: /,'');
  if (!fs.existsSync(`${O}/pathway_${n}.json`)) return 'no run file';
  return 'run file but the engine check is incomplete'; };
// summ() reads the run file without checking it exists; a missing run is reported, not thrown.
const sum=(o,n)=>fs.existsSync(`${o}/pathway_${n}.json`)?summ(o,n):null;
const S={}, missing=[]; for (const n of names){ const s=sum(O,n); if (s) S[n]=s; else missing.push(n); }
const base=S[C]; const f1=v=>v.toFixed(1), sg=v=>(v>=0?'+':'−')+Math.abs(v).toFixed(1);
const short=n=>n===C?C:n.replace(new RegExp('_'+C+'$'),'');
console.log(`## Tables for ${C} (harness/pathway/tables/settables.js, ${new Date().toISOString().slice(0,16)}Z)\n`);
if (!base){ console.log(`${C} itself is incomplete (${why(C)}): no tables.`); process.exit(0); }

// 1. Each run against NTCSA's two criteria, engine PV against the central and CO2 (the pack's results table, as packtable.js).
console.log('### Runs\n');
console.log(`| Run | Both NTCSA criteria | Mean unserved, highest year, GWh | Worst run, GWh | Open-cycle capacity factor, highest year | Engine PV 2026–40, R bn | Against ${C}, R bn | CO2 2026–40, Mt | CO2 2030 / 2035 / 2040, Mt |`);
console.log('|---|---|---|---|---|---|---|---|---|');
for (const n of names){ const r=S[n]; if (!r) continue;
  const iOk=r.rows.every(x=>x.mean<=20), oc=Math.max(...r.rows.map(x=>x.ocgtCF)), iiOk=oc<0.06;
  const v=iOk&&iiOk?'met':[!iOk?'unserved over 20 GWh in '+r.rows.filter(x=>x.mean>20).map(x=>x.y).join(', '):'',
    !iiOk?'open-cycle over 6% in '+r.rows.filter(x=>x.ocgtCF>=0.06).map(x=>x.y).join(', '):''].filter(Boolean).join('; ');
  console.log(`| ${short(n)} | ${v} | ${f1(r.maxMean)} | ${r.worstRun.toFixed(0)} | ${(100*oc).toFixed(1)}% | ${f1(r.pv)} | ${n===C?'–':sg(r.pv-base.pv)} | ${r.co2Cum.toFixed(0)} | ${[2030,2035,2040].map(y=>f1(r.co2[y])).join(' / ')} |`); }

// 2. The central's build standing in 2030, 2035 and 2040, GW.
console.log('\n### Build standing, GW\n');
console.log('| Run | Year | Wind | Utility PV | Rooftop | Lithium (hours) | CCGT | Open-cycle gas | Open-cycle diesel | Iron-air | Vanadium | Pumped storage | Offshore | Coal |');
console.log('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
const g=v=>(v/1e3).toFixed(1);
for (const n of [C, B&&S[B]?B:null].filter(Boolean)) for (const y of [2030,2035,2040]){ const b=S[n].build[y];
  console.log(`| ${n} | ${y} | ${g(b.wind)} | ${g(b.pv)} | ${g(b.roof)} | ${g(b.li)} (${b.liH.toFixed(1)}) | ${g(b.ccgt)} | ${g(b.ocgtGas)} | ${g(b.ocgtDsl)} | ${g(b.ironair)} | ${g(b.vrfb)} | ${g(b.phes)} | ${g(b.off)} | ${g(b.coal)} |`); }

// 2b. Cheaper finance (messages 461, 462): s_disc5 beside the central, new build by type, system cost, CO2 and the IRP gap at each rate.
if (S[`s_disc5_${C}`]||S[`s_pvbw6_${C}`]||S[`s_discirp_${C}`]){
  const gap=(o,irp)=>{ const i=sum(`${N}/irp`,irp); return i?sg(i.pv-o.pv):'not available'; };
  const yrs=(r,f)=>[2030,2035,2040].map(y=>g(f(r.build[y]))).join(' / ');
  console.log(`\n### Cost of capital: every technology on construction cost at 11.3%, 8% and 5% real, beside ${C} (solar at its bid finance, the rest at 8%)\n`);
  console.log('| Run | Utility PV, GW 2030 / 2035 / 2040 | Wind | Lithium | Gas (CCGT and open-cycle on LNG) | Engine PV 2026–40, R bn | CO2 2026–40, Mt | IRP gap in the same case, R bn |');
  console.log('|---|---|---|---|---|---|---|---|');
  for (const [n,irp] of [[`s_discirp_${C}`,`irp2025_${C}_discirp`],[`s_pvbw6_${C}`,`irp2025_${C}_pvbw6`],[C,`irp2025_${C}`],[`s_disc5_${C}`,`irp2025_${C}_disc5`]]){ const r=S[n]; if (!r) continue;
    console.log(`| ${short(n)} | ${yrs(r,b=>b.pv)} | ${yrs(r,b=>b.wind)} | ${yrs(r,b=>b.li)} | ${yrs(r,b=>b.ccgt+b.ocgtGas)} | ${f1(r.pv)} | ${r.co2Cum.toFixed(0)} | ${gap(r,irp)} |`); }
  console.log('\nEngine PV weights each year\'s cost at 8% in every row; the capital charges inside those costs are annuities at each run\'s own rate.'); }

// 2d. Cost of capital cases (message 469): one rate for all (planning), high, low and private finance, beside the central
// (each technology at its own state-backed rate), with the IRP build checked at the same rates.
if (SENS.includes('s_cocplan')&&(S[`s_cocplan_${C}`]||S[`s_cochigh_${C}`]||S[`s_coclow_${C}`]||S[`s_cocprivate_${C}`])){
  const gap=(o,irp)=>{ const i=sum(`${N}/irp`,irp); return i?sg(i.pv-o.pv):'not available'; };
  const yrs=(r,f)=>[2030,2035,2040].map(y=>g(f(r.build[y]))).join(' / ');
  console.log(`\n### Cost of capital cases, beside ${C} (each technology at its own state-backed rate)\n`);
  console.log('| Run | Utility PV, GW 2030 / 2035 / 2040 | Wind | Lithium | Gas (CCGT and open-cycle on LNG) | Engine PV 2026–40, R bn | Against '+C+', R bn | CO2 2026–40, Mt | IRP gap in the same case, R bn |');
  console.log('|---|---|---|---|---|---|---|---|---|');
  for (const [n,irp,lab] of [[C,`irp2025_${C}`,`${C}, each technology at its own rate`],[`s_cocplan_${C}`,`irp2025_${C}_cocplan`,'s_cocplan, one rate for all, 8% real'],
      [`s_cochigh_${C}`,`irp2025_${C}_cochigh`,'s_cochigh, high'],[`s_coclow_${C}`,`irp2025_${C}_coclow`,'s_coclow, low'],[`s_cocprivate_${C}`,`irp2025_${C}_cocprivate`,'s_cocprivate, private finance for wind, solar and lithium']]){
    const r=S[n]; if (!r){ console.log(`| ${lab} | not yet available | | | | | | | |`); continue; }
    console.log(`| ${lab} | ${yrs(r,b=>b.pv)} | ${yrs(r,b=>b.wind)} | ${yrs(r,b=>b.li)} | ${yrs(r,b=>b.ccgt+b.ocgtGas)} | ${f1(r.pv)} | ${n===C?'–':sg(r.pv-base.pv)} | ${r.co2Cum.toFixed(0)} | ${gap(r,irp)} |`); }
  console.log('\nEngine PV weights each year\'s cost at 8% in every row; the capital charges inside those costs are annuities at each run\'s own rates.'); }

// 2c. Gas timing (messages 475 and 477): reliability by year 2032-2036 and new diesel open-cycle, against the central.
if (S[`s_gas2032_${C}`]||S[`s_gas2035_nodsl_${C}`]){
  console.log(`\n### Gas timing: mean unserved by year, 2032-2036, and new diesel open-cycle\n`);
  console.log('| Run | Mean unserved 2032 / 2033 / 2034 / 2035 / 2036, GWh | Open-cycle diesel standing 2030 / 2035 / 2040, GW | Engine PV 2026–40, R bn | Against '+C+', R bn | CO2 2026–40, Mt |');
  console.log('|---|---|---|---|---|---|');
  for (const n of [C, `s_gas2032_${C}`, `s_gas2035_nodsl_${C}`, `s_gas2030_${C}`]){ const r=S[n]; if (!r) continue;
    const m=y=>{ const x=r.rows.find(q=>q.y===y); return x?x.mean.toFixed(1):'–'; };
    console.log(`| ${short(n)} | ${[2032,2033,2034,2035,2036].map(m).join(' / ')} | ${[2030,2035,2040].map(y=>g(r.build[y].ocgtDsl)).join(' / ')} | ${f1(r.pv)} | ${n===C?'–':sg(r.pv-base.pv)} | ${r.co2Cum.toFixed(0)} |`); } }

// 3. The IRP 2025 build against the optimised plan in the same case (each IRP check beside its own run).
const IRP=[['central demand',C,`irp2025_${C}`],['IRP 2025 demand',`${C}_irpdem`,`irp2025_${C}_irpdem`],...(SENS.includes('s_windlow')?[['wind, central cost case',`s_windlow_${C}`,`irp2025_${C}_windlow`]]:[]),
  ['wind, high cost case',`s_windhigh_${C}`,`irp2025_${C}_windhigh`],['carbon, Treasury path',`s_carbontreasury_${C}`,`irp2025_${C}_carbontreasury`],
  ['carbon, 2030 rate held',`s_carbonhold_${C}`,`irp2025_${C}_carbonhold`],['coal sustaining capital R500/kW-yr',`s_coalsustain_${C}`,`irp2025_${C}_coalsustain`],
  ...(SENS.includes('s_disc5')?[['all on construction cost, 8% real',`s_pvbw6_${C}`,`irp2025_${C}_pvbw6`],
    ['all on construction cost, 5% real',`s_disc5_${C}`,`irp2025_${C}_disc5`],['all on construction cost, 11.3% real',`s_discirp_${C}`,`irp2025_${C}_discirp`]]:[]),
  ...(SENS.includes('s_cocplan')?[['cost of capital: one rate, 8% (planning)',`s_cocplan_${C}`,`irp2025_${C}_cocplan`],['cost of capital: high',`s_cochigh_${C}`,`irp2025_${C}_cochigh`],
    ['cost of capital: low',`s_coclow_${C}`,`irp2025_${C}_coclow`],['cost of capital: private finance',`s_cocprivate_${C}`,`irp2025_${C}_cocprivate`]]:[])];
console.log('\n### IRP 2025 build against the optimised plan\n');
console.log('| Case | IRP build engine PV, R bn | Optimised plan, R bn | Gap, R bn | IRP build CO2 2026–40, Mt | Optimised plan, Mt | IRP build mean unserved, highest year / worst run, GWh |');
console.log('|---|---|---|---|---|---|---|');
const irpMissing=[];
for (const [lab,opt,irp] of IRP){ const o=S[opt], i=sum(`${N}/irp`,irp);
  if (!o||!i){ irpMissing.push(`${lab} (${!i?irp:opt})`); continue; }
  console.log(`| ${lab} | ${f1(i.pv)} | ${f1(o.pv)} | ${sg(i.pv-o.pv)} | ${i.co2Cum.toFixed(0)} | ${o.co2Cum.toFixed(0)} | ${i.maxMean.toFixed(2)} / ${i.worstRun.toFixed(0)} |`); }
if (irpMissing.length) console.log(`\nIRP checks not available: ${irpMissing.join('; ')}.`);

// 4. Against the comparison set, run by run (c6c against c6b: the 24-hour down time against UC_FLEET's 4 hours).
// The IRP-demand run carries the set's name first (c6c_irpdem), so it maps to the other set's by name, not by suffix; before
// 28 Oct 2026 it was compared with itself.
if (B){ console.log(`\n### ${C} against ${B}, same run\n`);
  console.log(`| Run | Engine PV, ${C} / ${B}, R bn | Difference | CO2 2026–40, ${C} / ${B}, Mt | Curtailed wind and solar 2026–40, ${C} / ${B}, TWh | Mean unserved, highest year, ${C} / ${B}, GWh |`);
  console.log('|---|---|---|---|---|---|');
  for (const n of names){ const m=n===C?B:n===`${C}_irpdem`?`${B}_irpdem`:n.replace(new RegExp('_'+C+'$'),'_'+B), a=S[n], b=sum(O,m); if (!a||!b) continue;
    const cu=s=>s.rows.reduce((q,x)=>q+(x.curt||0),0);
    console.log(`| ${short(n)} | ${f1(a.pv)} / ${f1(b.pv)} | ${sg(a.pv-b.pv)} | ${a.co2Cum.toFixed(0)} / ${b.co2Cum.toFixed(0)} | ${f1(cu(a))} / ${f1(cu(b))} | ${f1(a.maxMean)} / ${f1(b.maxMean)} |`); } }

// 5. Runs not run, with the chain's reason.
console.log('\n### Not run\n');
console.log(missing.length?missing.map(n=>`- ${short(n)}: ${why(n)}`).join('\n'):'None.');
