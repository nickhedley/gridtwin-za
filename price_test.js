#!/usr/bin/env node
/**
 * price_test.js — does the pricing run actually produce duals?
 *
 * The MIP day solve happens inside a Web Worker, which the harnesses stub out, so the
 * pricing run added 31 Aug 2026 had never been executed. This extracts buildDayLP from
 * index.html, builds one day both ways, and checks that the fixed-commitment LP returns
 * duals on the regional balance rows.
 */
const fs=require('fs'), path=require('path');
const highsLoader=require('highs');
const ROOT=process.argv[2]||'testroot';
const src=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');

// pull the worker block that defines buildDayLP
const i=src.indexOf('function buildDayLP');
const a=src.lastIndexOf('<script',i), b=src.indexOf('</script>',i);
let blk=src.slice(src.indexOf('>',a)+1,b);
// the block is a worker body; take just the builder
const s2=blk.indexOf('function buildDayLP');
let e2=blk.indexOf('\nself.onmessage', s2);
if(e2<0) e2=blk.length;
// The block is a WORKER TEMPLATE LITERAL, so escapes are still doubled in the raw text.
// Unescape them or every LP comes out with literal backslash-n and HiGHS returns Empty.
const builderSrc=blk.slice(s2,e2).replace(/\\\\n/g,'\\n');
const buildDayLP=new Function(builderSrc+'\nreturn buildDayLP;')();

(async()=>{
  const highs=await highsLoader({locateFile:f=>path.join(__dirname,'node_modules/highs/build',f)});
  // a small two-region day: one cheap unit, one dear unit, one storage, one corridor
  // field names taken from the builder itself: cap, msl, marginal_cost, startup_cost,
  // min_up, region for units; power, energy, eff, region for storage; a, b, km, limit
  // for corridors.
  // REALISTIC dimensions: 31 coal unit groups across 10 regions, 21 corridors -
  // matching what the full-year run actually builds.
  const nR=10;
  const units=[];
  for(let i=0;i<31;i++) units.push({region:i%nR, cap:600+((i*37)%900),
    msl:0.5, marginal_cost:520+((i*23)%180), startup_cost:100000+((i*7919)%400000),
    min_up:4});
  const sto=[]; for(let i=0;i<6;i++) sto.push({region:i, power:400, energy:1600, eff:0.88});
  const corridors=[];
  for(let i=0;i<21;i++) corridors.push({a:i%nR, b:(i*3+1)%nR, km:200+((i*57)%600), limit:1500});
  const load=[];
  for(let r=0;r<nR;r++){ const a=new Array(24).fill(0);
    for(let h=0;h<24;h++) a[h]= 900+((r*211)%800) + (h>=17&&h<=20?500:0);
    load.push(a); }                 // an evening peak
  const onState=units.map(()=>0), soc=sto.map(()=>800);

  const lpMip=buildDayLP(units,sto,corridors,nR,load,onState,soc,50000);
  // RESERVE CO-OPTIMISATION: same day, reserve required at 7% of load
  const lpRes=buildDayLP(units,sto,corridors,nR,load,onState,soc,50000,null,0.07);
  const rRes=highs.solve(lpRes,{});
  const grab=(r,pre)=>{let t=0;for(const k in r.Columns){const c=r.Columns[k];
    const n=(c&&c.Name)?c.Name:k; if(n.startsWith(pre)) t+=(c.Primal||0);} return t;};
  const rBase=highs.solve(lpMip,{});
  console.log('\nRESERVE CO-OPTIMISATION');
  console.log('  reserve off  status', rBase&&rBase.Status, '| cost', rBase?Math.round(rBase.ObjectiveValue):'-');
  console.log('  reserve on   status', rRes&&rRes.Status, '| cost', rRes?Math.round(rRes.ObjectiveValue):'-');
  if(rBase&&rRes){
    console.log('  storage discharge  ', grab(rBase,'di_').toFixed(0), '->', grab(rRes,'di_').toFixed(0), 'MWh');
    console.log('  reserve held       ', grab(rRes,'rs_').toFixed(0), 'MW-h');
    console.log('  reserve shortfall  ', grab(rRes,'rsl_').toFixed(0), 'MW-h');
    console.log('  unserved           ', grab(rBase,'q_').toFixed(0), '->', grab(rRes,'q_').toFixed(0), 'MWh');
  // ── ASSERTIONS, not just a printout ───────────────────────────────────────
  // The load-bearing property is that this is INERT AT DEFAULTS. South Africa prices no
  // ancillary services, so resFrac is zero and the LP must be byte-identical to before -
  // otherwise every published MIP result moves.
  let pass = 0, fail = 0;
  const chk = (lab, ok, why) => { if (ok) { pass++; } else { fail++;
    console.log('  FAIL: ' + lab + (why ? '  -  ' + why : '')); } };
  const zeroLP = buildDayLP(units,sto,corridors,nR,load,onState,soc,50000,null,0);
  chk('day LP unchanged when reserve is unpriced', lpMip === zeroLP,
      'resFrac 0 must emit no reserve variables at all');
  chk('reserve variables appear only when priced',
      /rs_0_0/.test(lpRes) && /rq_0:/.test(lpRes) && !/rs_0_0/.test(lpMip));
  chk('LP still solves with reserve co-optimised',
      rBase && rRes && rBase.Status === 'Optimal' && rRes.Status === 'Optimal');
  const hardLP = highs.solve(buildDayLP(units,sto,corridors,nR,load,onState,soc,50000,null,0.20), {});
  chk('a high reserve requirement displaces discharge',
      hardLP && grab(hardLP,'di_') < grab(rRes,'di_'),
      'the power-sharing constraint is not binding');
  chk('reserve shortfall is priced below unserved energy',
      hardLP && grab(hardLP,'q_') === 0,
      'the LP shed load rather than reserve, which is the wrong order');
  console.log(`\n  co-optimisation checks: ${pass}/${pass+fail} passed`);

  console.log('\n  does it BIND as the requirement rises?');
  for(const f of [0.02,0.07,0.20,0.50,0.90]){
    const lpX=buildDayLP(units,sto,corridors,nR,load,onState,soc,50000,null,f);
    const rX=highs.solve(lpX,{});
    if(!rX){ console.log('    '+f+' failed'); continue; }
    console.log(`    resFrac ${String(f).padEnd(5)} cost ${Math.round(rX.ObjectiveValue).toString().padStart(11)}`
      + ` reserve ${grab(rX,'rs_').toFixed(0).padStart(7)}`
      + ` shortfall ${grab(rX,'rsl_').toFixed(0).padStart(8)}`
      + ` discharge ${grab(rX,'di_').toFixed(0).padStart(6)}`);
  }
  }
  console.log('LP size:', (lpMip.length/1024).toFixed(0), 'KB');
  const rMip=highs.solve(lpMip,{time_limit:30,mip_rel_gap:0.01});
  console.log('\nMIP   status', rMip.Status);
  if(rMip.Status!=='Optimal'){
    console.log('  rows in LP:', (lpMip.match(/\n/g)||[]).length);
    process.exit(1); }

  const fixedOn=units.map((u,ix)=>{
    const row=[];
    for(let h=0;h<24;h++){ const c=rMip.Columns['c_'+ix+'_'+h]; row.push(c&&c.Primal>0.5?1:0); }
    return row;
  });
  console.log('  commitment recovered:', fixedOn.map(r=>r.reduce((x,y)=>x+y,0)+'/24 hours on').join(' · '));

  const lpFix=buildDayLP(units,sto,corridors,nR,load,onState,soc,50000,fixedOn);
  console.log('  Binary block present in fixed LP:', /(^|\n)Binary/.test(lpFix));
  const rFix=highs.solve(lpFix,{time_limit:20});
  console.log('\nPRICING RUN  status', rFix.Status, '| Rows returned', rFix.Rows?Object.keys(rFix.Rows).length:0);

  // recover row names in emission order, same technique the worker uses
  const lines=lpFix.split('\n');
  const ci=lines.findIndex(l=>/^Subject To$/.test(l.trim()));
  const bi=lines.findIndex((l,ix)=>ix>ci&&/^Bounds$/.test(l.trim()));
  const names=[];
  for(let ix=ci+1;ix<(bi<0?lines.length:bi);ix++){
    const m=lines[ix].match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*:/); if(m) names.push(m[1]);
  }
  console.log('  names parsed', names.length, '| match:', names.length===Object.keys(rFix.Rows||{}).length);

  // Test BOTH key formats: numeric (Node) and name-keyed (browser WASM).
  const asNamed={}; Object.entries(rFix.Rows||{}).forEach(([k,v])=>{
    const nm=names[+k]; if(nm) asNamed[nm]=v; });
  for(const [label,rows] of [['numeric keys', rFix.Rows], ['NAME keys', asNamed]]){
  const price=new Array(24).fill(0), cnt=new Array(24).fill(0);
  Object.entries(rows||{}).forEach(([k,v])=>{
    // EXACTLY the worker's logic, as evaluated - split, not regex.
    const n=(k!=='' && !isNaN(Number(k))) ? names[Number(k)] : k; if(!n) return;
    const parts=n.split('_');
    if(parts.length!==3 || parts[0]!=='bal') return;
    const h=Number(parts[2]); if(h<24){ price[h]+=Math.abs(v.Dual||0); cnt[h]++; }
  });
  for(let h=0;h<24;h++) if(cnt[h]>1) price[h]/=cnt[h];
  const priced=price.filter(x=>x>0).length;
  console.log('  ['+label+'] hours with a dual:', priced, 'of 24',
    '| peak', price[18].toFixed(0), 'R/MWh');
  }
  process.exit(0);
})();
