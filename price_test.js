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
  const units=[
    {region:0,cap:800,msl:0.25,marginal_cost:600,startup_cost:50000,min_up:4},
    {region:1,cap:400,msl:0.25,marginal_cost:1900,startup_cost:20000,min_up:1},
  ];
  const sto=[{region:0,power:100,energy:400,eff:0.88}];
  const corridors=[{a:0,b:1,km:300,limit:600}];
  const nR=2;
  const load=[ new Array(24).fill(500), new Array(24).fill(150) ];
  load[0][18]=750; load[1][18]=200;                 // an evening peak
  const onState=units.map(()=>0), soc=[200];

  const lpMip=buildDayLP(units,sto,corridors,nR,load,onState,soc,50000);
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

  const price=new Array(24).fill(0), cnt=new Array(24).fill(0);
  Object.entries(rFix.Rows||{}).forEach(([k,v])=>{
    const n=names[+k]; if(!n) return;
    const m=n.match(/^bal_(\d+)_(\d+)$/); if(!m) return;
    const h=+m[2]; if(h<24){ price[h]+=Math.abs(v.Dual||0); cnt[h]++; }
  });
  for(let h=0;h<24;h++) if(cnt[h]>1) price[h]/=cnt[h];
  const priced=price.filter(x=>x>0).length;
  console.log('\n  hours with a dual:', priced, 'of 24');
  const shed = Object.entries(rFix.Columns||{}).filter(([k,v])=>/^q_/.test(k)&&v.Primal>0.01).length;
  console.log('  hours with unserved energy:', shed, '(a shed hour prices at the slack cost, correctly)');
  console.log('  price at the off-peak hour 03:', price[3].toFixed(0), 'R/MWh  (cheap unit marginal 600)');
  console.log('  price at the peak hour 18   :', price[18].toFixed(0), 'R/MWh  (dear unit marginal 1900)');
  console.log('\n  peak dearer than off-peak:', price[18] > price[3]);
  process.exit(0);
})();
