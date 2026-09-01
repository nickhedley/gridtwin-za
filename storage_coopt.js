#!/usr/bin/env node
/**
 * storage_coopt.js - does stacking energy and reserve revenue overstate what a battery earns?
 *
 * THE QUESTION. GridTwin computes arbitrage from the dispatch heuristic and ancillary
 * revenue separately, from a rate on capacity held. Nothing forces the two to be
 * consistent: a battery cannot discharge at full power AND hold that same power in
 * reserve. If the model lets it, the revenue stack is overstated.
 *
 * WHY AN LP AND NOT A HEURISTIC. This is the same class of problem that produced the
 * withdrawn 37% finding on 30 Aug: the needed logic is a value function on state of
 * charge, and no ordering heuristic can substitute for one. Proven twice by rewriting and
 * reverting. So this co-optimises properly - one LP, energy and reserve decided together.
 *
 * PRICE-TAKER. The battery is small enough not to move prices, so prices are an input.
 * That is the right frame for a merchant asset and the wrong one for a system study; the
 * result answers "what can this battery earn", not "what should the system build".
 *
 * Run: node storage_coopt.js [powerMW] [hours]
 */
const fs = require('fs'), path = require('path');

async function main(){
  const highsLoader = require('highs');
  const highs = await highsLoader({
    locateFile: (f) => path.join(__dirname, 'node_modules', 'highs', 'build', f),
  });

  const MW = +(process.argv[2] || 100);
  const HRS = +(process.argv[3] || 4);
  const E = MW * HRS;                  // MWh
  const EFF_C = 0.92, EFF_D = 0.92;    // one-way efficiencies
  const SELF = 0.00004;                // per hour self-discharge
  const CYCLE_R = 60;                  // R/MWh throughput, degradation proxy
  const N = 168;                       // one week, hourly

  // A representative price week: coal-set most hours with an evening peak, matching the
  // shape the model produces - median R748, peaks into the thousands.
  const price = [], resPrice = [];
  for (let h = 0; h < N; h++){
    const hr = h % 24, wd = Math.floor(h / 24) % 7 < 5;
    let p = 740 + 40 * Math.sin((hr - 4) * Math.PI / 12);
    if (wd && (hr >= 17 && hr <= 20)) p = 1400 + 900 * Math.sin((hr - 17) * Math.PI / 4);
    if (hr >= 10 && hr <= 14) p -= 90;          // midday solar
    price.push(p);
    // R/MW-h HELD. Not asReserveRMWh, which is R150 per MWh of reserve ENERGY and works
    // out at R1.31m/MW-yr - over six times the R197,100/MW-yr the model's own battery
    // saturation analysis reports. Using it made reserve so lucrative the LP held full
    // power all year and discharged nothing, which is how the units error surfaced.
    // Rule 11: compute the bound before believing the number.
    resPrice.push(197100 / 8760);                // R22.5/MW-h, from the saturation finding
  }

  // ── build the LP ────────────────────────────────────────────────────────────
  // Variables per hour: c[h] charge MW, d[h] discharge MW, s[h] SOC MWh, r[h] reserve MW.
  // The co-optimisation is one constraint: d[h] + r[h] <= MW. Discharging and holding
  // reserve compete for the SAME power. Stacking revenue post-hoc omits exactly this line.
  const build = (withReserve, Ein, rpIn) => {
    const E = (Ein != null) ? Ein : MW * HRS;
    const rp = (rpIn != null) ? rpIn : null;
    const L = [];
    const obj = [];
    for (let h = 0; h < N; h++){
      // ONE TERM PER VARIABLE. LP format does not SUM duplicate terms - it takes the last
      // one. Writing `740.8 d_0` and `-60 d_0` separately left the coefficient at -60, so
      // discharging looked like pure cost and the battery correctly did nothing. The LP
      // was right and the objective was wrong, which is the hardest kind to spot: a
      // plausible answer from a broken input.
      const dCoef = price[h] * EFF_D - CYCLE_R;
      obj.push(`${dCoef.toFixed(4)} d_${h}`);
      obj.push(`-${price[h].toFixed(4)} c_${h}`);
      if (withReserve) obj.push(`${(rp != null ? rp : resPrice[h]).toFixed(4)} r_${h}`);
    }
    L.push('Maximize');
    L.push('  ' + obj.join(' + ').replace(/\+ -/g, '- '));
    L.push('Subject To');
    for (let h = 0; h < N; h++){
      const prev = h === 0 ? null : `s_${h - 1}`;
      // SOC balance with self-discharge
      if (prev) L.push(` soc_${h}: s_${h} - ${(1 - SELF).toFixed(6)} ${prev} - ${EFF_C} c_${h} + d_${h} = 0`);
      else      L.push(` soc_${h}: s_${h} - ${EFF_C} c_${h} + d_${h} = ${(E * 0.5).toFixed(4)}`);
      // THE CO-OPTIMISATION CONSTRAINT
      if (withReserve) L.push(` pwr_${h}: d_${h} + r_${h} <= ${MW}`);
      // reserve must be BACKED by stored energy for an hour, else it is a promise not a service
      if (withReserve) L.push(` bak_${h}: r_${h} - s_${h} <= 0`);
    }
    // terminal value: end at least where we started, so the week does not simply drain
    L.push(` term: s_${N - 1} >= ${(E * 0.5).toFixed(4)}`);
    L.push('Bounds');
    for (let h = 0; h < N; h++){
      L.push(` 0 <= c_${h} <= ${MW}`);
      L.push(` 0 <= d_${h} <= ${MW}`);
      L.push(` 0 <= s_${h} <= ${E}`);
      if (withReserve) L.push(` 0 <= r_${h} <= ${MW}`);
    }
    L.push('End');
    return L.join('\n');
  };

  const solve = (lp) => {
    const r = highs.solve(lp, {});
    if (!r || r.Status !== 'Optimal') return null;
    let dis = 0, chg = 0, res = 0;
    // HiGHS keys Columns EITHER by index or by name depending on the build, exactly as it
    // does for Rows - the fault that cost four rounds on the pricing run this morning.
    // Take the name from whichever place has it and never assume the key is one or the
    // other.
    for (const k in r.Columns){
      const c = r.Columns[k];
      const n = (c && c.Name) ? c.Name : k;
      const v = (c && typeof c.Primal === 'number') ? c.Primal : 0;
      if (n.startsWith('d_')) dis += v;
      else if (n.startsWith('c_')) chg += v;
      else if (n.startsWith('r_')) res += v;
    }
    return { obj: r.ObjectiveValue, dis, chg, res };
  };

  const energyOnly = solve(build(false));
  const coopt      = solve(build(true));
  if (!energyOnly || !coopt){ console.log('solve failed'); process.exit(1); }

  // The STACKED estimate: take the energy-only dispatch and add reserve revenue on the
  // full rated power, which is what computing the two separately implies.
  const stackedReserve = MW * N * resPrice[0];
  const stacked = energyOnly.obj + stackedReserve;

  // SENSITIVITY. The stacking error depends on how often energy outbids reserve, so it
  // moves with duration and with the reserve price. Swept rather than asserted from one
  // configuration.
  if (process.env.SWEEP){
    console.log('\nstacking error across configurations');
    console.log(`${'duration'.padStart(10)}${'reserve R/MW-h'.padStart(16)}${'co-opt Rm/yr'.padStart(14)}${'overstated'.padStart(12)}`);
    for (const hrs of [1, 2, 4, 8]){
      for (const rp of [11.25, 22.5, 45]){
        const E2 = MW * hrs;
        const b = (wr) => build(wr, E2, rp);
        const eo = solve(b(false)), co = solve(b(true));
        if (!eo || !co) continue;
        const st = eo.obj + MW * N * rp;
        console.log(`${(hrs + 'h').padStart(10)}${rp.toFixed(2).padStart(16)}`
          + `${(co.obj * 52 / 1e6).toFixed(1).padStart(14)}`
          + `${(100 * (st - co.obj) / co.obj).toFixed(1).padStart(11)}%`);
      }
    }
  }

  const wk = 52;
  console.log(`\nSTORAGE CO-OPTIMISATION  ${MW} MW / ${HRS}h  (${E} MWh), one week x 52\n`);
  console.log(`${''.padEnd(30)}${'R m/yr'.padStart(10)}${'MWh discharged'.padStart(17)}${'MW-h reserve'.padStart(15)}`);
  const row = (lab, o, d, r) =>
    console.log(`  ${lab.padEnd(28)}${(o * wk / 1e6).toFixed(1).padStart(10)}`
      + `${(d * wk).toFixed(0).padStart(17)}${(r * wk).toFixed(0).padStart(15)}`);
  row('energy only', energyOnly.obj, energyOnly.dis, 0);
  row('energy + reserve, STACKED', stacked, energyOnly.dis, MW * N);
  row('energy + reserve, CO-OPTIMISED', coopt.obj, coopt.dis, coopt.res);
  const over = 100 * (stacked - coopt.obj) / coopt.obj;
  console.log(`\n  stacking overstates revenue by ${over.toFixed(1)}%`);
  console.log(`  and the co-optimised battery discharges `
    + `${(100 * (coopt.dis - energyOnly.dis) / Math.max(energyOnly.dis, 1)).toFixed(1)}% `
    + `${coopt.dis >= energyOnly.dis ? 'more' : 'less'} energy than energy-only`);
}
main().catch(e => { console.error(String(e).slice(0, 300)); process.exit(1); });
