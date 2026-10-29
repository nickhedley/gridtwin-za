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
//   RUN.pv / .dpv / .dpvabs   engine PV 2026-40, R bn, its difference from the central, and that difference unsigned
//   RUN.co2 / .dco2 / .co2_YYYY   CO2 2026-40, Mt, its difference from the central, and one year's CO2
//   RUN.maxmean / .worst / .ocmax / .verdict / .mean_YYYY / .overown / .nemover   adequacy (verdict against NTCSA's two criteria;
//                        overown: the years over the run's own standard, or 'none'; nemover: the phrase against the Australian
//                        standard, 0.002% of served energy, each with its figures, or 'none'); .gascf_YYYY new gas's capacity
//                        factor in a year, %; .nemratio the range of 20 GWh over 0.002% of each year's served energy;
//                        .overownfig the years over the run's own standard with mean against target; .passlimit how the optimiser ended;
//                        .avgcostpct the range of the yearly percentage differences in cost per MWh served against the central, 2030-40;
//                        .status how the optimiser ended and the engine check's years over the run's own standard, in one phrase
//   RUN.wind_YYYY .solar_YYYY .li_YYYY .gas_YYYY .dsl_YYYY .coal_YYYY   GW standing; .gasmw_YYYY new gas on LNG in MW
//   RUN.curt             curtailed wind and solar 2026-40, TWh
//   irp*.gap / .cut / .pertonne / .pertonnetax   the IRP build against the optimised plan in the same case: engine PV gap, CO2 cut,
//                        cost per tonne cut with the carbon tax taken out (a transfer) and with it
//   base.coal2026 / .rate2026 / .partload / .partloaddiff / .partloadrec / .eskomrate   the central's 2026 coal, its rate and part-load
//                        factor against COAL_PARTLOAD_2026 and Eskom's FY2026 rate (partload_check.js; the constants read from the page)
//   site.build           the page's BUILD_STAMP
//   page.ff2040ironairGW / page.ironairHours   the Fossil-free 2040 preset's iron-air (GW) and the page's iron-air duration (hours)
//   page.coc.TECH / page.coc.CASE.TECH   a technology's real pre-tax cost of capital on the page, central or the named case
//                        (private, high, low, planning), as '5.5%'; page.idc.TECH its interest-during-construction factor; page.years.TECH
//                        its build years; page.life.TECH its life; page.capex.TECH its 2026 capex, R/kW; page.acap.TECH its derived
//                        capital charge, R/kW-yr; page.capexvs.TECH.LO[.HI] the capex against a typed Figure 9 range, as '−48% to −34%',
//                        'within' or 'equal'; page.privprem.re|store the private-finance premium in points; page.disc the discount
//                        rate; page.pvCase, page.cocCase, page.fx, page.nucUsd, page.coalUsd (page_costs.js, message 501 (d))
//   Plain forms for the parts the reviewer reads (message 503 (a), (b)): RUN.pvbn 'R2,315bn'; .co2r_YYYY the year's CO2 rounded; .dpvplain 'adds R83bn' / 'saves R12bn' /
//                        'changes the cost by less than R1bn'; .dpvabsbn 'R198bn'; .dco2plain '8 Mt less'; .verdictplain the adequacy
//                        verdict as a clause; .nemplain the Australian-standard clause; .gasgw_YYYY new gas on LNG in GW; .gascfplain the
//                        range of new gas's capacity factor 2035-40 as '5-8%'; .avgcostpctplain '12-16%'; irp*.gapbn 'R368bn', .gapplain
//                        'R368bn more', .cutmt '8 Mt', .cutplain '8 Mt less'; irp.cocgapmax the larger move of the IRP gap across the
//                        one-rate and private-rate cases, 'R4bn'; glossary the plain-name table for section 7 (plain.js)
//   table:What gets built, least-cost plan / table:What gets built, IRP 2025   new capacity added each year by technology, MW, with the
//                        total and coal standing, from the run's build schedule; all-zero columns dropped (message 505 (a))
//   RUN.lumpy            the years with no new wind or utility solar and those with almost none (under a tenth of the mean addition)
//   Draft 2 keys (message 506): RUN.nemlimits the Australian limit in GWh across the years, '4-5.5 GWh'; RUN.gascfr_YYYY new gas's capacity
//                        factor rounded, '5%'; RUN.coalgw_YYYY coal standing in GW; RUN.addgw_T new capacity added 2026-40 in GW, T one of
//                        wind solar rooftop batt gas ccgt ocgt dsl ps offshore ironair nuclear (one decimal under 10 GW)
//   prev.*               the previous central (PREV, default c6c) as a run; RUN.dco2absmt CO2 against the plan, unsigned, Mt;
//                        RUN.dco2prevabs CO2 against the previous central, unsigned (message 507 (b)); table:against c6c the
//                        run-by-run comparison with the previous set (settables section 4)
//   nogasbest.*          the no-gas rerun that meets the standard (s_nogas_maxp6, else s_nogas_maxp10): every run key, plus .which,
//                        .added and .finding (message 508); while neither is in, .finding says the rerun follows
//   missing              the list of results not yet available, with the chain's reason
const fs=require('fs'), path=require('path'), cp=require('child_process'); const {summ}=require('./summ.js'); const {PLAIN,VERSIONS,plainName}=require('./plain.js');
const args=process.argv.slice(2), dry=args.includes('--dry');
const re=/<!--fill:([^>]+?)-->([\s\S]*?)<!--\/fill-->/g;
if (args[0]==='--strip'){ const s=fs.readFileSync(args[1],'utf8').replace(re,(m,k,v)=>v); fs.writeFileSync(args[2],s); process.exit(0); }
const [O,N,PACK]=args.filter(a=>!a.startsWith('--')); const C=process.env.BASE||'c6e'; const PV=process.env.PREV||'c6c';   // PREV: the previous central's set (message 507 (b))
if (!PACK){ console.error('usage: BASE=c6e node pathway/tables/packfill.js <run folder> <set folder> <pack.md> [--dry]'); process.exit(1); }

const prog=fs.existsSync(`${N}/progress.txt`)?fs.readFileSync(`${N}/progress.txt`,'utf8'):'';
const done=/C6[A-Z] SET DONE|SET DONE/.test(prog.split('\n').filter(Boolean).pop()||'');
const why=n=>{ const m=prog.split('\n').filter(l=>l.includes(`NOT RUN ${n}:`)).pop(); if (m) return m.replace(/^.*NOT RUN [^:]*: /,'');
  const irp=n.startsWith('irp2025_'); return fs.existsSync(`${O}/pathway_${n}.json`)||fs.existsSync(`${N}/irp/pathway_${n}.json`)?(irp?'IRP build check incomplete':'engine check incomplete'):(done?'no run file':(irp?'IRP build check not yet run':'not yet run')); };
// Run names: optimised runs in O; IRP builds in N/irp (a nuclear check reads its build file under the case's own name).
const opt=r=>r==='base'?C:r==='prev'?PV:r==='irpdem'?`${C}_irpdem`:`${r}_${C}`;
const Sraw=r=>r==='nogasbest_run'?cache['nogasbest']:undefined;
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
// Reviewer-facing style (message 506): 'R368 billion', ranges with a hyphen (2026-40, 12-16%), year spans as '2031-32'.
const Rb=v=>'R'+nf(Math.abs(v),0)+' billion';
const spanH=ys=>span(ys).replace(/(\d{4})\u2013(\d{4})/g,(m,a,b)=>a.slice(0,2)===b.slice(0,2)?`${a}-${b.slice(2)}`:`${a}-${b}`);
const span=ys=>{ const a=[]; for (const y of ys){ const l=a[a.length-1]; if (l&&y===l[1]+1) l[1]=y; else a.push([y,y]); } return a.map(([p,q])=>p===q?`${p}`:`${p}–${q}`).join(', '); };
const taxPV=s=>{ let t=0; for (const r of s.rows) t+=r.co2*(r.carbonTaxRPerT||0)*Math.pow(1.08,-(r.y-2026))/1000; return t; };
let PL=null; const partload=()=>{ if (PL) return PL; const f=`${O}/pathcheck_${C}_a.json`; if (!fs.existsSync(f)) return null;
  try { PL=JSON.parse(cp.execFileSync('node',[path.join(__dirname,'..','partload_check.js'),f],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim().split('\n').pop()); } catch(e){ console.error('partload_check.js failed (run from harness/ with testroot): '+e.message.split('\n')[0]); PL=null; }
  return PL; };

let PG=null; const pagecosts=()=>{ if (PG) return PG; if (!fs.existsSync('testroot/index.html')) return null;
  try { PG=JSON.parse(cp.execFileSync('node',[path.join(__dirname,'page_costs.js'),'testroot'],{encoding:'utf8',stdio:['ignore','pipe','ignore'],timeout:300000}).trim().split('\n').pop()); }
  catch(e){ console.error('page_costs.js failed (run from harness/ with testroot): '+e.message.split('\n')[0]); PG=null; }
  return PG; };
const pc1=v=>nf(v*100,1)+'%';
function pageCost(k){
  const g=pagecosts(); if (!g){ missing.add('the page (page_costs.js)'); return null; }
  const q=k.split('.').slice(1); const w=q[0];
  const T=t=>{ if (!(t in g.coc.central)&&!(t in g.capex)&&!(t in g.acap)) throw new Error(`packfill: no page cost for technology '${t}' in ${k}`); return t; };
  if (w==='coc') return q.length===2?pc1(g.coc.central[T(q[1])]):pc1(g.coc[q[1]][T(q[2])]);
  if (w==='idc') return nf(g.idc.central[T(q[1])],3);
  if (w==='years') return String(g.buildYears[T(q[1])]??'');
  if (w==='life') return String(g.life[T(q[1])]??'');
  if (w==='capex') return nf(g.capex[T(q[1])],0);
  if (w==='acap') return nf(g.acap[T(q[1])],0);
  if (w==='capexvs'){ const v=Math.round(g.capex[T(q[1])]), lo=+q[2], hi=q[3]!=null?+q[3]:+q[2]; const pct=x=>v/x-1;
    if (v>=lo&&v<=hi) return lo===hi?'equal':'within';
    const a=pct(hi), b=pct(lo); const f=x=>(x>=0?'+':'−')+nf(Math.abs(x)*100,0)+'%'; return a===b?f(a):`${f(Math.min(a,b))} to ${f(Math.max(a,b))}`; }
  if (w==='privprem') return nf(g.privatePrem[q[1]]*100,1)+' points';
  if (w==='disc') return pc1(g.disc);
  if (w==='pvCase') return g.pvCase; if (w==='cocCase') return g.cocCase; if (w==='fx') return nf(g.fx,2); if (w==='nucUsd') return nf(g.nucUsd,0); if (w==='coalUsd') return nf(g.coalUsd,0);
  throw new Error('packfill: unknown page key '+k);
}
// The no-gas rerun (messages 508, 510): 'nogasbest' is the first of the pass-limit-6 and pass-limit-10 runs whose check meets NTCSA's
// two criteria; its keys are the ordinary run keys plus .which (its plain name), .added (what stands in 2040 beyond the pass-limit
// run, GW, iron-air flagged) and .finding (one sentence; while neither run is in, the sentence says the rerun follows).
const NOGAS_RERUNS=['s_nogas_maxp6','s_nogas_maxp10'];   // message 510: pass limit 6, then 10 if 6 still falls short; no top-up tonight
const meets=s=>!!s&&!s.rows.some(x=>x.mean>20)&&!s.rows.some(x=>x.ocgtCF>=0.06);
const peek=r=>{ const n=opt(r); if (!fs.existsSync(`${O}/pathway_${n}.json`)) return null; if (cache[r]!==undefined) return cache[r]; const q=summ(O,n); if (q) q.dir=O; return q; };
let NB; const nogasBest=()=>{ if (NB!==undefined) return NB; NB=null; for (const r of NOGAS_RERUNS){ const q=peek(r); if (q&&meets(q)){ NB={r,s:q}; break; } } return NB; };
const nogasAdded=q=>{ const z=S('s_nogas'); if (!z) return null; const a=q.build[2040], b=z.build[2040];
  const parts=[['wind','wind'],['pv','utility solar'],['li','batteries'],['phes','pumped storage'],['off','offshore wind'],['ironair','iron-air'],['vrfb','vanadium'],['ocgtDsl','diesel peakers']]
    .map(([k,n])=>[n,((a[k]||0)-(b[k]||0))/1e3]).filter(([,d])=>Math.abs(d)>=0.05);
  if (!parts.length) return 'nothing beyond the pass-limit run';
  return parts.map(([n,d])=>`${d>0?'':'−'}${nf(Math.abs(d),1)} GW ${n}`).join(', ')+(parts.some(([n,d])=>n==='iron-air'&&d>0)?' (it adds iron-air, whose finding is a known failure: section 5)':''); };
function value(k){
  if (k.startsWith('nogasbest.')){ const m=k.slice(10); const best=nogasBest();
    if (!best){ missing.add(opt('s_nogas_maxp6')); return m==='finding'?'A rerun with a higher pass limit follows.':null; }
    if (m==='which') return plainName(opt(best.r));
    if (m==='added') return nogasAdded(best.s);
    if (m==='finding'){ const b=S('base'); const d=best.s.pv-b.pv; const cost=Math.abs(d)<1?'costs within R1 billion of the least-cost plan':(d>0?'costs ':'saves ')+Rb(d)+(d>0?' more than the least-cost plan':' against the least-cost plan');
      return `Rerun as ${plainName(opt(best.r))}, the plan meets the system operator's adequacy test in every year to 2040: it ${cost}, emits ${nf(best.s.co2Cum,0)} Mt and stands ${nogasAdded(best.s)} by 2040.`; }
    cache['nogasbest']=best.s; return value('nogasbest_run.'+m); }
  if (k==='glossary'){ const rows=Object.entries(PLAIN).map(([c,[n,d]])=>`| ${n} | ${c==='base'?C:c==='irpdem'?C+'_irpdem':c.startsWith('irp')?('irp2025_'+C+(c==='irp'?'':c.slice(3))):c+'_'+C} | ${d} |`);
    const vers=Object.entries(VERSIONS).map(([c,n])=>`| ${n} | ${c} | the central run set of that date |`);
    return '\n\n| Plain name | Run code | What it changes |\n|---|---|---|\n'+rows.join('\n')+'\n'+vers.join('\n')+'\n\n'; }
  if (k.startsWith('page.')&&!['page.ff2040ironairGW','page.ironairHours'].includes(k)) return pageCost(k);
  if (k==='site.build'){ if (!fs.existsSync('testroot/index.html')) return null; const m=fs.readFileSync('testroot/index.html','utf8').match(/const BUILD_STAMP = '([^']+)'/); return m?m[1]:null; }
  // Page inputs read from index.html (message 491): the Fossil-free 2040 preset's iron-air, GW, and the page's iron-air duration, hours.
  if (k==='page.ff2040ironairGW'||k==='page.ironairHours'){ if (!fs.existsSync('testroot/index.html')) return null; const h=fs.readFileSync('testroot/index.html','utf8');
    if (k==='page.ironairHours'){ const m=h.match(/\bnewIronAirHours:(\d+)/); return m?m[1]:null; }   // FIXED's, the first occurrence
    const m=h.match(/'Fossil-free 2040':\{[^\n]*?newIronAirMW:(\d+)/); return m?nf(+m[1]/1e3,0):null; }
  const [r,m]=[k.slice(0,k.lastIndexOf('.')),k.slice(k.lastIndexOf('.')+1)];
  if (r==='base'&&['coal2026','rate2026','partload','partloaddiff','partloadrec','eskomrate'].includes(m)){ const p=partload(); if (!p){ missing.add(`${C} (2026 check)`); return null; }
    return m==='coal2026'?nf(p.coalTWh,1):m==='rate2026'?nf(p.rate,3):m==='partload'?nf(p.partloadRun,4):m==='partloadrec'?nf(p.recorded,4):m==='eskomrate'?nf(p.eskomFY26,3):sg(p.diffPp,2); }
  const s=Sraw(r)||S(r); if (!s) return null; const b=S('base'); const y=+m.split('_')[1];
  const at=(f)=>f(s.build[y]);
  switch (m.split('_')[0]){
    case 'pv': return nf(s.pv,1);
    case 'lumpy': { const out=[]; for (const [k,name] of [['wind','wind'],['pv','utility solar']]){ const ys=Object.keys(s.sched).map(Number).sort().filter(y=>y>=2027);   // 2026 is the year in progress
        const add=y=>s.sched[y][k]||0; const nz=ys.filter(y=>add(y)>=1); const mean=nz.length?nz.reduce((a,y)=>a+add(y),0)/nz.length:0;
        const zero=ys.filter(y=>add(y)<1), small=ys.filter(y=>add(y)>=1&&add(y)<0.1*mean);
        if (zero.length||small.length) out.push((zero.length?`no new ${name} in ${spanH(zero)}`:`little new ${name}`)+(small.length?` and almost none in ${spanH(small)}`:'')); }
      return out.length?out.join('; '):'additions are steady from year to year'; }
    case 'pvbn': return Rb(s.pv);
    case 'dpvplain': { if (!b) return null; const d=s.pv-b.pv; return Math.abs(d)<1?'changes the cost by less than R1 billion':(d>0?'adds ':'saves ')+Rb(d); }
    case 'dpvabsbn': return b&&Rb(s.pv-b.pv);
    case 'dco2absmt': return b&&nf(Math.abs(s.co2Cum-b.co2Cum),0);   // against the plan, unsigned (message 507 (b))
    case 'dco2prevabs': { const q=S('prev'); return q&&nf(Math.abs(s.co2Cum-q.co2Cum),0); }   // against the previous central, unsigned
    case 'dco2plain': { if (!b) return null; const d=s.co2Cum-b.co2Cum; return Math.abs(d)<0.5?'less than 1 Mt':nf(Math.abs(d),0)+' Mt '+(d>0?'more':'less'); }
    case 'verdictplain': { const u=s.rows.filter(x=>x.mean>20).map(x=>x.y), o=s.rows.filter(x=>x.ocgtCF>=0.06).map(x=>x.y);
      if (!u.length&&!o.length) return "meets the system operator's adequacy test in every year to 2040";
      return [u.length?`exceeds the system operator's 20 GWh limit on expected unserved energy in ${spanH(u)}`:'',o.length?`runs open-cycle plant more than 6% of the time in ${spanH(o)}`:''].filter(Boolean).join(' and '); }
    case 'nemplain': { const lim=x=>0.00002*x.servedTWh*1e3; const over=s.rows.filter(x=>x.mean-(x.seMean||0)>lim(x)), near=s.rows.filter(x=>x.mean>lim(x)&&!(x.mean-(x.seMean||0)>lim(x)));
      const a=[]; if (over.length) a.push(`is over the limit in ${spanH(over.map(x=>x.y))}`); if (near.length) a.push(`sits at about the limit in ${spanH(near.map(x=>x.y))}, within the model\u2019s sampling error`);
      return a.length?a.join(', and '):'stays under the limit in every year'; }
    case 'gasgw': return nf(at(q=>q.ccgt+q.ocgtGas)/1e3,1);
    case 'gascfplain': { const v=s.rows.filter(x=>x.y>=2035&&x.gasCF!=null).map(x=>100*x.gasCF); if (!v.length) return null; const lo=Math.round(Math.min(...v)), hi=Math.round(Math.max(...v)); return lo===hi?`${lo}%`:`${lo}-${hi}%`; }
    case 'avgcostpctplain': { if (!b) return null; const d=s.rows.filter(x=>x.y>=2030&&x.y<=2040).map(x=>{ const c=b.rows.find(q=>q.y===x.y); return c?100*(x.avgCostRMWh/c.avgCostRMWh-1):null; }).filter(v=>v!=null);
      if (!d.length) return null; const lo=Math.round(Math.min(...d)), hi=Math.round(Math.max(...d)); return lo===hi?`${lo}%`:`${lo}-${hi}%`; }
    case 'dpv': return b&&sg(s.pv-b.pv,1);
    case 'dpvabs': return b&&nf(Math.abs(s.pv-b.pv),1);   // the same, unsigned, for prose such as 'R…bn in present value'
    case 'co2': return y?nf(s.co2[y],1):nf(s.co2Cum,0);
    case 'co2r': return y?nf(s.co2[y],0):nf(s.co2Cum,0);   // the yearly figure rounded, for the cover note (message 504 (a))
    case 'dco2': return b&&sg(s.co2Cum-b.co2Cum,0);
    case 'maxmean': return nf(s.maxMean,1);
    case 'worst': return nf(s.worstRun,0);
    case 'ocmax': return nf(100*Math.max(...s.rows.map(x=>x.ocgtCF)),1)+'%';
    case 'mean': { const x=s.rows.find(q=>q.y===y); return x?nf(x.mean,1):null; }
    case 'overown': return s.over.length?span(s.over):'none';
    // The years over the run's own standard with their figures (mean against that year's target, GWh), and how the optimiser ended
    // (its run file's verdict; message 495: 'pass limit reached' is reported as such, never as infeasible).
    // Cost per MWh served against the central, 2030-40, as a range of the yearly percentage differences (message 497; the engine
    // check's avgCostRMWh, served-weighted over its runs).
    case 'avgcostpct': { if (!b) return null; const d=s.rows.filter(x=>x.y>=2030&&x.y<=2040).map(x=>{ const c=b.rows.find(q=>q.y===x.y); return c?100*(x.avgCostRMWh/c.avgCostRMWh-1):null; }).filter(v=>v!=null);
      return d.length?`${nf(Math.min(...d),1)}\u2013${nf(Math.max(...d),1)}`:null; }
    case 'overownfig': { const o=s.rows.filter(x=>x.mean>x.target+1e-9); return o.length?o.map(x=>`${x.y} (${nf(x.mean,2)} against ${nf(x.target,2)})`).join(', '):'none'; }
    // How the optimiser ended and what the engine check gives against the run's own standard, in one phrase (message 499: the form for
    // every run that stopped at the pass limit; never 'infeasible' or 'cannot be met', a higher pass limit being untested).
    case 'status': { const pl=/pass limit/i.test(s.verdict||'')?'the optimiser reached its pass limit':/adequate/i.test(s.verdict||'')?'the optimiser converged':`the optimiser ended '${s.verdict}'`;
      const o=s.rows.filter(x=>x.mean>x.target+1e-9); return `${pl}; the engine check gives mean unserved energy ${o.length?'over the run\u2019s standard in '+o.map(x=>`${x.y} (${nf(x.mean,2)} against ${nf(x.target,2)})`).join(', '):'within the run\u2019s standard in every year'}`; }
    case 'passlimit': return /pass limit/i.test(s.verdict||'')?'the optimiser reached its pass limit':/adequate/i.test(s.verdict||'')?'the optimiser converged':`the optimiser ended '${s.verdict}'`;
    // Against the Australian grid's standard (AEMO 2026 ESOO: expected unserved energy at most 0.002% of demand; message 489 (a)):
    // the years whose mean unserved energy exceeds 0.002% of the run's served energy, each with its figures, GWh.
    // New gas's capacity factor in a year (the engine check's gasCF: gas output over the CCGT standing x 8,760), %; message 493 (b).
    case 'gascf': { const x=s.rows.find(q=>q.y===y); return x&&x.gasCF!=null?nf(100*x.gasCF,1)+'%':null; }
    // NTCSA's 20 GWh over 0.002% of each year's served energy, the range across the run's years (message 493 (d)).
    case 'nemratio': { const r=s.rows.map(x=>20/(0.00002*x.servedTWh*1e3)); return `${nf(Math.min(...r),1)}-${nf(Math.max(...r),1)}`; }
    case 'nemlimits': { const r=s.rows.map(x=>0.00002*x.servedTWh*1e3); const f=v=>nf(Math.round(v*2)/2,Number.isInteger(Math.round(v*2)/2)?0:1); return `${f(Math.min(...r))}-${f(Math.max(...r))} GWh`; }
    case 'gascfr': { const x=s.rows.find(q=>q.y===y); return x&&x.gasCF!=null?nf(100*x.gasCF,0)+'%':null; }
    case 'coalgw': { const v=s.sched&&s.sched[y]&&s.sched[y].coalMW; return v==null?null:nf(v/1e3,1); }
    case 'addgw': { if (!s.sched) return null; const t=m.split('_')[1]; const ys=Object.keys(s.sched); const g=k=>ys.reduce((a,yy)=>a+((s.sched[yy][k])||0),0);
      const v={wind:g('wind'),solar:g('pv'),rooftop:g('rooftop'),batt:g('batt'),gas:g('ccgt')+g('ocgt'),ccgt:g('ccgt'),ocgt:g('ocgt'),dsl:g('ocgd'),ps:g('phes')+g('phel'),offshore:g('off'),ironair:g('ironair'),
        nuclear:s.nuclearAdd?Object.values(s.nuclearAdd).reduce((a,b)=>a+b,0):0}[t]; if (v==null) throw new Error('packfill: no addgw technology '+t);
      return v<9.95e3?nf(v/1e3,1):nf(v/1e3,0); }
    // Against the Australian standard with the engine check's sampling error (message 502 (a)): a year is over only when the mean less
    // one standard error is still above 0.002% of served energy; a year whose mean is above but within one standard error is 'at the
    // limit within sampling error'. nemover is the phrase after 'the central is'; nemfig_YYYY one year's figure; nemshort the span form.
    case 'nemover': case 'nemshort': { const lim=x=>0.00002*x.servedTWh*1e3, fig=x=>`${x.y} (${nf(x.mean,2)} ± ${nf(x.seMean||0,2)} against ${nf(lim(x),2)})`;
      const over=s.rows.filter(x=>x.mean-(x.seMean||0)>lim(x)), near=s.rows.filter(x=>x.mean>lim(x)&&!(x.mean-(x.seMean||0)>lim(x)));
      if (m==='nemshort'){ const a=[]; if (over.length) a.push(`over the Australian standard in ${spanH(over.map(x=>x.y))}`); if (near.length) a.push(`at about the Australian standard in ${spanH(near.map(x=>x.y))}, within sampling error`);
        return a.length?a.join(' and '):'under the Australian standard in every year'; }
      const a=[]; if (over.length) a.push(`over it in ${over.map(fig).join(', ')}`); if (near.length) a.push(`at the limit within sampling error in ${near.map(fig).join(', ')}`);
      return a.length?a.join('; '):'under it in every year'; }
    case 'nemfig': { const x=s.rows.find(r=>r.y===y); if (!x) return null; const l=0.00002*x.servedTWh*1e3, se=x.seMean||0;
      return `${nf(x.mean,2)} ± ${nf(se,2)} GWh against ${nf(l,2)}, ${x.mean-se>l?'over it':x.mean>l?'at the limit within sampling error':'under it'}`; }
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
    case 'cocgapmax': { if (r!=='irp') return null; const g0=S('irp'); if (!g0) return null; const gap=(ir,run)=>{ const a=S(ir), c=S(run); return a&&c?a.pv-c.pv:null; };
      const g=gap('irp','base'); const ds=[['irp_cocplan','s_cocplan'],['irp_cocprivate','s_cocprivate']].map(([i,x])=>{ const v=gap(i,x); return v==null||g==null?null:Math.abs(v-g); });
      if (ds.some(v=>v==null)) return null; return Rb(Math.max(...ds)); }
    case 'gap': case 'cut': case 'gapbn': case 'gapplain': case 'cutmt': case 'cutplain': case 'pertonne': case 'pertonnetax': { const o=S(irpMatch(r)); if (!o) return null;
      const gap=s.pv-o.pv, cut=o.co2Cum-s.co2Cum;
      if (m==='gap') return sg(gap,1); if (m==='cut') return nf(cut,0);
      if (m==='gapbn') return Rb(gap); if (m==='gapplain') return Math.abs(gap)<1?'about the same':Rb(gap)+' '+(gap>0?'more':'less');
      if (m==='cutmt') return nf(Math.abs(cut),0)+' Mt'; if (m==='cutplain') return Math.abs(cut)<0.5?'about the same':nf(Math.abs(cut),0)+' Mt '+(cut>0?'less':'more');
      if (cut<=0) return 'none (the IRP build emits more)';
      return 'R'+nf(1000*(m==='pertonnetax'?gap:gap-(taxPV(s)-taxPV(o)))/cut,0); }
  }
  throw new Error(`unknown key ${k}`);
}

// What gets built, year by year (message 505 (a)): additions in MW from the run's build schedule, plain column names, all-zero columns dropped.
const built=run=>{ const s=S(run); if (!s||!s.sched) return null; const ys=Object.keys(s.sched).map(Number).sort(); const g=(y,k)=>(s.sched[y]&&s.sched[y][k])||0;
  const cols=[['Wind',y=>g(y,'wind')],['Utility-scale solar',y=>g(y,'pv')],['Rooftop solar',y=>g(y,'rooftop')],['Batteries',y=>g(y,'batt')],['Pumped storage',y=>g(y,'phes')+g(y,'phel')],
    ['Gas (CCGT)',y=>g(y,'ccgt')],['Gas (open-cycle)',y=>g(y,'ocgt')],['Diesel peakers',y=>g(y,'ocgd')],['Offshore wind',y=>g(y,'off')],['Iron-air',y=>g(y,'ironair')],
    ['Vanadium',y=>g(y,'vrfb')],['Nuclear',y=>(s.nuclearAdd&&s.nuclearAdd[y])||0]].filter(([,f])=>ys.some(y=>f(y)>=0.5));
  const tot=y=>cols.reduce((a,[,f])=>a+f(y),0);
  const head=`| Year | ${cols.map(c=>c[0]).join(' | ')} | Total new | Remaining coal |`, sep='|'+'---|'.repeat(cols.length+3);
  const rows=ys.map(y=>`| ${y} | ${cols.map(([,f])=>nf(f(y),0)).join(' | ')} | ${nf(tot(y),0)} | ${nf(g(y,'coalMW'),0)} |`);
  rows.push(`| Total | ${cols.map(([,f])=>nf(ys.reduce((a,y)=>a+f(y),0),0)).join(' | ')} | ${nf(ys.reduce((a,y)=>a+tot(y),0),0)} | – |`);
  return '\n\n'+[head,sep,...rows].join('\n')+'\n\n'; };
let tables=null; const table=t=>{ if (/^What gets built/.test(t)) return built(/IRP/.test(t)?'irp':'base'); if (!tables){ const out=cp.execFileSync('node',[path.join(__dirname,'settables.js'),O,N,C,PV],{encoding:'utf8'}); tables={};   // PV: the comparison set, for 'against <set>' (message 507 (b))
    for (const b of out.split('\n### ').slice(1)){ const i=b.indexOf('\n'); tables[b.slice(0,i).replace(new RegExp('\\b'+C+'\\b','g'),'').replace(/\s+/g,' ').trim()]=b.slice(i).trim(); } }
  const k=Object.keys(tables).find(h=>h.startsWith(t)); return k?'\n\n'+tables[k].replace(/\u2013/g,'-')+'\n\n':null; };   // hyphens in ranges (message 506)

const src=fs.readFileSync(PACK,'utf8'); let changed=0; const unknown=[];
// Every key but 'missing' first, so the missing list is complete when it is written.
const fill=s=>s.replace(re,(all,k,old)=>{ if (k==='missing') return all; let v;
  try { v=k.startsWith('table:')?table(k.slice(6)):value(k); } catch(e){ unknown.push(k); return all; }
  if (v==null) v=k.startsWith('table:')?`\n\n[not yet available: table ${k.slice(6)}]\n\n`:`[not yet available: ${plainName(k.split('.')[0])}]`;
  if (v!==old) changed++; return `<!--fill:${k}-->${v}<!--/fill-->`; });
let out=fill(src);
out=out.replace(/<!--fill:missing-->([\s\S]*?)<!--\/fill-->/g,()=>{ const l=[...missing].sort().map(n=>`- ${plainName(n)}: ${why(n)}`);
  return `<!--fill:missing-->\n${l.length?l.join('\n'):'- None: every result in this pack is in.'}\n<!--/fill-->`; });
if (unknown.length){ console.error('unknown keys: '+unknown.join(', ')); process.exit(1); }
// Plain-language check (message 503 (f)): the cover note, the introduction and section 6, as filled, carry no run code, no script or
// data filename and no TODO reference. Markers are stripped first, so a key name never counts; table rows do.
const plainFail=(()=>{ const txt=out.replace(/<!--\/?fill[^>]*-->/g,''); const secs=[...txt.matchAll(/^## (.+)$/gm)]; const bad=[];
  secs.forEach((h,i)=>{ if (!/^(Cover note|What this is|6\.)/.test(h[1])) return; const body=txt.slice(h.index,secs[i+1]?secs[i+1].index:txt.length);
    for (const [what,re] of [['run code',/\b(?:c[56][a-z]?(?:_[a-z0-9_]+)?|s_[a-z0-9_]+|irp2025_[a-z0-9_]+|irp_[a-z0-9_]+|null_c\d[a-z]?)\b/g],['filename',/\b[\w/.-]+\.(?:md|js|json|py|sh|csv)\b/g],['TODO',/\bTODO\b/g]]){
      for (const m of body.matchAll(re)) bad.push(`${h[1].slice(0,12)}: ${what} '${m[0]}'`); } });
  return [...new Set(bad)]; })();
if (plainFail.length) console.error(`plain-language check failed (${plainFail.length}): `+plainFail.slice(0,20).join('; '));
if (dry) console.log(`${changed} placeholders would change; missing: ${[...missing].join(', ')||'none'}`);
else { fs.writeFileSync(PACK,out); console.log(`${changed} placeholders filled from ${C} (${O}, ${N}); missing: ${[...missing].join(', ')||'none'}`); }
if (plainFail.length) process.exit(1);
