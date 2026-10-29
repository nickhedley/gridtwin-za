// Fills the reviewer pack's figures from a run set's outputs (user, 28 Oct 2026, message 482 (a)): every figure in
// REVIEWER_PACK.md that comes from a run sits between fill markers, <!--fill:KEY-->text<!--/fill-->, and this script writes it;
// none is typed by hand. The markers stay, so the pack can be refilled as late results land. A result not yet available is written
// as '[not yet available: run]' and listed in the fill:missing block with the chain's reason.
// Usage, from harness/ of the run commit with the set's outputs in place:
//   BASE=c6e node pathway/tables/packfill.js out out/c6e ../REVIEWER_PACK.md            (fills in place)
//   BASE=c6e node pathway/tables/packfill.js out out/c6e ../REVIEWER_PACK.md --dry      (prints what would change)
//   node pathway/tables/packfill.js --strip ../REVIEWER_PACK.md <copy.md>               (a copy without markers, for the Google Doc)
// Keys (run names are relative to BASE: 'base' is the central, 'irpdem' the central at IRP 2025's demand, 's_x' is s_x_BASE,
// 'irp' the IRP 2025 build at the central's demand and 'irp_x' its check in case x, e.g. irp_irpdem, irp_cochigh, irp_nuc12000):
//   table:<title>        a section of settables.js's output, by the start of its heading with the set name taken out
//                        ('Runs', 'Build standing', 'Gas timing', 'Cost of capital cases', 'IRP 2025 build', 'Not run')
//   RUN.pv / .dpv        engine PV 2026-40, R bn, and its difference from the central
//   RUN.co2 / .dco2 / .co2_YYYY   CO2 2026-40, Mt, its difference from the central, and one year's CO2
//   RUN.maxmean / .worst / .ocmax / .verdict / .mean_YYYY / .overown / .nemover   adequacy (verdict against NTCSA's two criteria;
//                        overown: the years over the run's own standard, or 'none'; nemover: the years over the Australian
//                        standard, 0.002% of served energy, each with its figures, or 'none')
//   RUN.wind_YYYY .solar_YYYY .li_YYYY .gas_YYYY .dsl_YYYY .coal_YYYY   GW standing; .gasmw_YYYY new gas on LNG in MW
//   RUN.curt             curtailed wind and solar 2026-40, TWh
//   irp*.gap / .cut / .pertonne / .pertonnetax   the IRP build against the optimised plan in the same case: engine PV gap, CO2 cut,
//                        cost per tonne cut with the carbon tax taken out (a transfer) and with it
//   base.coal2026 / .rate2026 / .partload / .partloaddiff / .partloadrec / .eskomrate   the central's 2026 coal, its rate and part-load
//                        factor against COAL_PARTLOAD_2026 and Eskom's FY2026 rate (partload_check.js; the constants read from the page)
//   site.build           the page's BUILD_STAMP
//   page.ff2040ironairGW / page.ironairHours   the Fossil-free 2040 preset's iron-air (GW) and the page's iron-air duration (hours)
//   missing              the list of results not yet available, with the chain's reason
const fs=require('fs'), path=require('path'), cp=require('child_process'); const {summ}=require('./summ.js');
const args=process.argv.slice(2), dry=args.includes('--dry');
const re=/<!--fill:([^>]+?)-->([\s\S]*?)<!--\/fill-->/g;
if (args[0]==='--strip'){ const s=fs.readFileSync(args[1],'utf8').replace(re,(m,k,v)=>v); fs.writeFileSync(args[2],s); process.exit(0); }
const [O,N,PACK]=args.filter(a=>!a.startsWith('--')); const C=process.env.BASE||'c6e';
if (!PACK){ console.error('usage: BASE=c6e node pathway/tables/packfill.js <run folder> <set folder> <pack.md> [--dry]'); process.exit(1); }

const prog=fs.existsSync(`${N}/progress.txt`)?fs.readFileSync(`${N}/progress.txt`,'utf8'):'';
const done=/C6[A-Z] SET DONE|SET DONE/.test(prog.split('\n').filter(Boolean).pop()||'');
const why=n=>{ const m=prog.split('\n').filter(l=>l.includes(`NOT RUN ${n}:`)).pop(); if (m) return m.replace(/^.*NOT RUN [^:]*: /,'');
  const irp=n.startsWith('irp2025_'); return fs.existsSync(`${O}/pathway_${n}.json`)||fs.existsSync(`${N}/irp/pathway_${n}.json`)?(irp?'IRP build check incomplete':'engine check incomplete'):(done?'no run file':(irp?'IRP build check not yet run':'not yet run')); };
// Run names: optimised runs in O; IRP builds in N/irp (a nuclear check reads its build file under the case's own name).
const opt=r=>r==='base'?C:r==='irpdem'?`${C}_irpdem`:`${r}_${C}`;
const irpName=r=>r==='irp'?`irp2025_${C}`:`irp2025_${C}_${r.slice(4)}`;
const irpMatch=r=>{ const x=r.slice(4).replace(/_?(nuc\d+|nuclife\d+)$/,''); return !x?'base':x==='irpdem'?'irpdem':`s_${x}`; };
const cache={}, missing=new Set();
function S(r){ if (r in cache) return cache[r];
  let s=null;
  if (r==='irp'||r.startsWith('irp_')){ const n=irpName(r), d=`${N}/irp`, nuc=n.match(/^(.*?)_(nuc\d+|nuclife\d+)$/);
    if (nuc&&!fs.existsSync(`${d}/pathway_${n}.json`)&&fs.existsSync(`${d}/pathway_${nuc[1]}.json`)){
      const t=fs.mkdtempSync('/tmp/packfill_'); fs.symlinkSync(path.resolve(`${d}/pathway_${nuc[1]}.json`),`${t}/pathway_${n}.json`);
      for (const g of 'abc') if (fs.existsSync(`${d}/pathcheck_${n}_${g}.json`)) fs.symlinkSync(path.resolve(`${d}/pathcheck_${n}_${g}.json`),`${t}/pathcheck_${n}_${g}.json`);
      s=summ(t,n); s&&(s.dir=d); }
    else if (fs.existsSync(`${d}/pathway_${n}.json`)) { s=summ(d,n); s&&(s.dir=d); }
    if (!s) missing.add(n); }
  else { const n=opt(r); if (fs.existsSync(`${O}/pathway_${n}.json`)) { s=summ(O,n); s&&(s.dir=O); } if (!s) missing.add(n); }
  return cache[r]=s; }
const nf=(v,d)=>v.toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
const sg=(v,d)=>(v>=0?'+':'−')+nf(Math.abs(v),d);
const span=ys=>{ const a=[]; for (const y of ys){ const l=a[a.length-1]; if (l&&y===l[1]+1) l[1]=y; else a.push([y,y]); } return a.map(([p,q])=>p===q?`${p}`:`${p}–${q}`).join(', '); };
const taxPV=s=>{ let t=0; for (const r of s.rows) t+=r.co2*(r.carbonTaxRPerT||0)*Math.pow(1.08,-(r.y-2026))/1000; return t; };
let PL=null; const partload=()=>{ if (PL) return PL; const f=`${O}/pathcheck_${C}_a.json`; if (!fs.existsSync(f)) return null;
  try { PL=JSON.parse(cp.execFileSync('node',[path.join(__dirname,'..','partload_check.js'),f],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim().split('\n').pop()); } catch(e){ console.error('partload_check.js failed (run from harness/ with testroot): '+e.message.split('\n')[0]); PL=null; }
  return PL; };

function value(k){
  if (k==='site.build'){ if (!fs.existsSync('testroot/index.html')) return null; const m=fs.readFileSync('testroot/index.html','utf8').match(/const BUILD_STAMP = '([^']+)'/); return m?m[1]:null; }
  // Page inputs read from index.html (message 491): the Fossil-free 2040 preset's iron-air, GW, and the page's iron-air duration, hours.
  if (k==='page.ff2040ironairGW'||k==='page.ironairHours'){ if (!fs.existsSync('testroot/index.html')) return null; const h=fs.readFileSync('testroot/index.html','utf8');
    if (k==='page.ironairHours'){ const m=h.match(/^\s*newIronAirHours:(\d+),/m); return m?m[1]:null; }
    const m=h.match(/'Fossil-free 2040':\{[^\n]*?newIronAirMW:(\d+)/); return m?nf(+m[1]/1e3,0):null; }
  const [r,m]=[k.slice(0,k.lastIndexOf('.')),k.slice(k.lastIndexOf('.')+1)];
  if (r==='base'&&['coal2026','rate2026','partload','partloaddiff','partloadrec','eskomrate'].includes(m)){ const p=partload(); if (!p){ missing.add(`${C} (2026 check)`); return null; }
    return m==='coal2026'?nf(p.coalTWh,1):m==='rate2026'?nf(p.rate,3):m==='partload'?nf(p.partloadRun,4):m==='partloadrec'?nf(p.recorded,4):m==='eskomrate'?nf(p.eskomFY26,3):sg(p.diffPp,2); }
  const s=S(r); if (!s) return null; const b=S('base'); const y=+m.split('_')[1];
  const at=(f)=>f(s.build[y]);
  switch (m.split('_')[0]){
    case 'pv': return nf(s.pv,1);
    case 'dpv': return b&&sg(s.pv-b.pv,1);
    case 'co2': return y?nf(s.co2[y],1):nf(s.co2Cum,0);
    case 'dco2': return b&&sg(s.co2Cum-b.co2Cum,0);
    case 'maxmean': return nf(s.maxMean,1);
    case 'worst': return nf(s.worstRun,0);
    case 'ocmax': return nf(100*Math.max(...s.rows.map(x=>x.ocgtCF)),1)+'%';
    case 'mean': { const x=s.rows.find(q=>q.y===y); return x?nf(x.mean,1):null; }
    case 'overown': return s.over.length?span(s.over):'none';
    // Against the Australian grid's standard (AEMO 2026 ESOO: expected unserved energy at most 0.002% of demand; message 489 (a)):
    // the years whose mean unserved energy exceeds 0.002% of the run's served energy, each with its figures, GWh.
    case 'nemover': { const o=s.rows.filter(x=>x.mean>0.00002*x.servedTWh*1e3); return o.length?o.map(x=>`${x.y} (${nf(x.mean,2)} against ${nf(0.00002*x.servedTWh*1e3,2)})`).join(', '):'none'; }
    case 'verdict': { const u=s.rows.filter(x=>x.mean>20).map(x=>x.y), o=s.rows.filter(x=>x.ocgtCF>=0.06).map(x=>x.y);
      return !u.length&&!o.length?'met':[u.length?`unserved over 20 GWh in ${span(u)}`:'',o.length?`open-cycle over 6% in ${span(o)}`:''].filter(Boolean).join('; '); }
    case 'wind': return nf(at(q=>q.wind)/1e3,1);
    case 'solar': return nf(at(q=>q.pv)/1e3,1);
    case 'li': return nf(at(q=>q.li)/1e3,1);
    case 'gas': return nf(at(q=>q.ccgt+q.ocgtGas)/1e3,1);
    case 'gasmw': return nf(at(q=>q.ccgt+q.ocgtGas),0);
    case 'dsl': return nf(at(q=>q.ocgtDsl)/1e3,1);
    case 'coal': return nf(at(q=>q.coal)/1e3,1);
    case 'curt': return nf(s.rows.reduce((q,x)=>q+(x.curt||0),0),1);
    case 'gap': case 'cut': case 'pertonne': case 'pertonnetax': { const o=S(irpMatch(r)); if (!o) return null;
      const gap=s.pv-o.pv, cut=o.co2Cum-s.co2Cum;
      if (m==='gap') return sg(gap,1); if (m==='cut') return nf(cut,0);
      if (cut<=0) return 'none (the IRP build emits more)';
      return 'R'+nf(1000*(m==='pertonnetax'?gap:gap-(taxPV(s)-taxPV(o)))/cut,0); }
  }
  throw new Error(`unknown key ${k}`);
}

let tables=null; const table=t=>{ if (!tables){ const out=cp.execFileSync('node',[path.join(__dirname,'settables.js'),O,N,C],{encoding:'utf8'}); tables={};
    for (const b of out.split('\n### ').slice(1)){ const i=b.indexOf('\n'); tables[b.slice(0,i).replace(new RegExp('\\b'+C+'\\b','g'),'').replace(/\s+/g,' ').trim()]=b.slice(i).trim(); } }
  const k=Object.keys(tables).find(h=>h.startsWith(t)); return k?'\n\n'+tables[k]+'\n\n':null; };

const src=fs.readFileSync(PACK,'utf8'); let changed=0; const unknown=[];
// Every key but 'missing' first, so the missing list is complete when it is written.
const fill=s=>s.replace(re,(all,k,old)=>{ if (k==='missing') return all; let v;
  try { v=k.startsWith('table:')?table(k.slice(6)):value(k); } catch(e){ unknown.push(k); return all; }
  if (v==null) v=k.startsWith('table:')?`\n\n[not yet available: table ${k.slice(6)}]\n\n`:`[not yet available: ${k.split('.')[0]}]`;
  if (v!==old) changed++; return `<!--fill:${k}-->${v}<!--/fill-->`; });
let out=fill(src);
out=out.replace(/<!--fill:missing-->([\s\S]*?)<!--\/fill-->/g,()=>{ const l=[...missing].sort().map(n=>`- ${n.replace(new RegExp('_'+C+'$'),'')}: ${why(n)}`);
  return `<!--fill:missing-->\n${l.length?l.join('\n'):'- None: every result in this pack is in.'}\n<!--/fill-->`; });
if (unknown.length){ console.error('unknown keys: '+unknown.join(', ')); process.exit(1); }
if (dry) console.log(`${changed} placeholders would change; missing: ${[...missing].join(', ')||'none'}`);
else { fs.writeFileSync(PACK,out); console.log(`${changed} placeholders filled from ${C} (${O}, ${N}); missing: ${[...missing].join(', ')||'none'}`); }
