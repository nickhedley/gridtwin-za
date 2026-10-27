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
  's_std_strict','s_std_nem','s_coalsustain','s_nogas','s_std_strict_nogas_dsl','s_std_nem_nogas_dsl','s_std_strict_nogas','s_std_nem_nogas'];
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

// 3. The IRP 2025 build against the optimised plan in the same case (each IRP check beside its own run).
const IRP=[['central demand',C,`irp2025_${C}`],['IRP 2025 demand',`${C}_irpdem`,`irp2025_${C}_irpdem`],['wind, central cost case',`s_windlow_${C}`,`irp2025_${C}_windlow`],
  ['wind, high cost case',`s_windhigh_${C}`,`irp2025_${C}_windhigh`],['carbon, Treasury path',`s_carbontreasury_${C}`,`irp2025_${C}_carbontreasury`],
  ['carbon, 2030 rate held',`s_carbonhold_${C}`,`irp2025_${C}_carbonhold`],['coal sustaining capital R500/kW-yr',`s_coalsustain_${C}`,`irp2025_${C}_coalsustain`]];
console.log('\n### IRP 2025 build against the optimised plan\n');
console.log('| Case | IRP build engine PV, R bn | Optimised plan, R bn | Gap, R bn | IRP build CO2 2026–40, Mt | Optimised plan, Mt | IRP build mean unserved, highest year / worst run, GWh |');
console.log('|---|---|---|---|---|---|---|');
const irpMissing=[];
for (const [lab,opt,irp] of IRP){ const o=S[opt], i=sum(`${N}/irp`,irp);
  if (!o||!i){ irpMissing.push(`${lab} (${!i?irp:opt})`); continue; }
  console.log(`| ${lab} | ${f1(i.pv)} | ${f1(o.pv)} | ${sg(i.pv-o.pv)} | ${i.co2Cum.toFixed(0)} | ${o.co2Cum.toFixed(0)} | ${i.maxMean.toFixed(2)} / ${i.worstRun.toFixed(0)} |`); }
if (irpMissing.length) console.log(`\nIRP checks not available: ${irpMissing.join('; ')}.`);

// 4. Against the comparison set, run by run (c6c against c6b: the 24-hour down time against UC_FLEET's 4 hours).
if (B){ console.log(`\n### ${C} against ${B}, same run\n`);
  console.log(`| Run | Engine PV, ${C} / ${B}, R bn | Difference | CO2 2026–40, ${C} / ${B}, Mt | Curtailed wind and solar 2026–40, ${C} / ${B}, TWh | Mean unserved, highest year, ${C} / ${B}, GWh |`);
  console.log('|---|---|---|---|---|---|');
  for (const n of names){ const m=n===C?B:n.replace(new RegExp('_'+C+'$'),'_'+B), a=S[n], b=sum(O,m); if (!a||!b) continue;
    const cu=s=>s.rows.reduce((q,x)=>q+(x.curt||0),0);
    console.log(`| ${short(n)} | ${f1(a.pv)} / ${f1(b.pv)} | ${sg(a.pv-b.pv)} | ${a.co2Cum.toFixed(0)} / ${b.co2Cum.toFixed(0)} | ${f1(cu(a))} / ${f1(cu(b))} | ${f1(a.maxMean)} / ${f1(b.maxMean)} |`); } }

// 5. Runs not run, with the chain's reason.
console.log('\n### Not run\n');
console.log(missing.length?missing.map(n=>`- ${short(n)}: ${why(n)}`).join('\n'):'None.');
