#!/usr/bin/env node
/**
 * gaplp.js - how much value does the instant heuristic leave on the table?
 *
 * THE HAZARD. A version of this question produced the "37% of July gas" claim, withdrawn
 * on 30 Aug after three rounds failed to reproduce the predicted saving. The error then
 * was predicting a number and then looking for it. This measures first.
 *
 * THE COMPARISON IS LIKE FOR LIKE. Same battery, same hourly prices from the model's own
 * run, same efficiency and cycle cost. The ONLY difference is who decides the dispatch:
 * the instant heuristic, or an LP with perfect foresight over the whole week.
 *
 * PERFECT FORESIGHT IS AN UPPER BOUND, NOT A TARGET. No real operator has it. The gap it
 * measures is the maximum a better heuristic could ever recover, so a small gap is a
 * strong result and a large one is only an invitation to look closer.
 */
const path = require('path'), fs = require('fs');

(async () => {
  const highs = await require('highs')({
    locateFile: f => path.join(__dirname, 'node_modules', 'highs', 'build', f) });
  const d = JSON.parse(fs.readFileSync('/tmp/gapdata.json', 'utf8'));
  const MW = d.battPowerMW, E = d.battMWh;
  const EFF = 0.92, CYCLE = 60;
  // PRICE CAP. A 1,800 MW battery is NOT a price taker in a scarcity hour: discharging
  // into a shortage removes the shortage, so the R87,000 value of lost load would not
  // survive its own arrival. An LP with perfect foresight and an uncapped price captures
  // value that the act of capturing it destroys - which is precisely the error that made
  // the "37% of July gas" claim collapse on 30 Aug. Capping at the diesel price tests how
  // much of the gap is real and how much is that artefact.
  const CAP = +(process.env.PCAP || 0) || Infinity;

  // Weekly blocks: perfect foresight within a week, SOC reset each week. A full-year LP
  // would be a stronger upper bound but the weekly figure is defensible and solves.
  const WEEK = 168, nW = Math.floor(8760 / WEEK);
  let lpRev = 0, heurRev = 0, lpDis = 0, heurDis = 0;

  for (let wk = 0; wk < nW; wk++){
    const o = wk * WEEK;
    const p = d.price.slice(o, o + WEEK).map(v => Math.min(v, CAP));
    // heuristic revenue over the same block, from the model's own dispatch
    for (let h = 0; h < WEEK; h++){
      heurRev += (d.dis[o + h] || 0) * p[h] - (d.dis[o + h] || 0) * CYCLE;
      heurDis += (d.dis[o + h] || 0);
    }
    const L = ['Maximize'], obj = [];
    for (let h = 0; h < WEEK; h++){
      obj.push(`${(p[h] * EFF - CYCLE).toFixed(4)} d_${h}`);   // ONE term per variable
      obj.push(`-${p[h].toFixed(4)} c_${h}`);
    }
    L.push('  ' + obj.join(' + ').replace(/\+ -/g, '- '));
    L.push('Subject To');
    for (let h = 0; h < WEEK; h++){
      if (h) L.push(` s${h}: e_${h} - e_${h - 1} - ${EFF} c_${h} + d_${h} = 0`);
      else   L.push(` s${h}: e_${h} - ${EFF} c_${h} + d_${h} = ${(E * 0.5).toFixed(2)}`);
    }
    L.push(` t: e_${WEEK - 1} >= ${(E * 0.5).toFixed(2)}`);
    L.push('Bounds');
    for (let h = 0; h < WEEK; h++){
      L.push(` 0 <= c_${h} <= ${MW}`); L.push(` 0 <= d_${h} <= ${MW}`);
      L.push(` 0 <= e_${h} <= ${E}`);
    }
    L.push('End');
    const r = highs.solve(L.join('\n'), {});
    if (!r || r.Status !== 'Optimal') continue;
    lpRev += r.ObjectiveValue;
    for (const k in r.Columns){
      const c = r.Columns[k], n = (c && c.Name) ? c.Name : k;
      if (n.startsWith('d_')) lpDis += (c.Primal || 0);
    }
  }
  const gap = 100 * (lpRev - heurRev) / Math.max(Math.abs(lpRev), 1);
  console.log(`\nBATTERY DISPATCH: heuristic against perfect foresight`);
  console.log(`  ${MW} MW / ${E} MWh, ${nW} weeks, the model's own hourly prices\n`);
  console.log(`  ${'heuristic'.padEnd(22)}R${(heurRev / 1e6).toFixed(0).padStart(7)}m   ${(heurDis / 1e3).toFixed(0).padStart(6)} GWh discharged`);
  console.log(`  ${'perfect foresight'.padEnd(22)}R${(lpRev / 1e6).toFixed(0).padStart(7)}m   ${(lpDis / 1e3).toFixed(0).padStart(6)} GWh discharged`);
  console.log(`\n  the heuristic captures ${(100 * heurRev / Math.max(lpRev, 1)).toFixed(1)}% of the perfect-foresight value`);
  console.log(`  gap: ${gap.toFixed(1)}%  - an UPPER BOUND, since no operator has perfect foresight`);
})().catch(e => { console.error(String(e).slice(0, 300)); process.exit(1); });
