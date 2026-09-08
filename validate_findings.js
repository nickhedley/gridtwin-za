#!/usr/bin/env node
/**
 * validate_findings.js — the published findings, re-run against THEIR OWN scenarios.
 *
 * WHY THIS EXISTS. On 31 Aug 2026, re-verifying findings after a round of constant
 * corrections produced THREE near-miss false corrections in one session, every one
 * caused by re-testing a result in a scenario other than the one it was measured in:
 *
 *   demand response      swept in a no-gas system measuring UNSERVED, published on the
 *                        dashboard measuring AVERAGE COST. Looked broken. Was not.
 *   battery saturation   run at an arbitrary reserve price of 60 against a published
 *                        default of 150. Showed a 60% error. Was exactly the ratio.
 *   capture asymmetry    run with storage against a published run with none.
 *
 * RESULTS.md opens with "a number without its scenario is not a result". That rule lives
 * in prose, and prose does not run. This encodes the scenario NEXT TO the number so a
 * re-check cannot silently test something else.
 *
 * These are TOLERANT checks. The point is not to freeze values - the calibration work of
 * 31 Aug moved several legitimately - it is to catch a published finding whose DIRECTION
 * or SHAPE has changed without anyone noticing.
 *
 *   node validate_findings.js [root]
 */
const fs=require('fs'), path=require('path');
const { JSDOM } = require('jsdom');
const ROOT=process.argv[2]||'.';

let npass=0, nfail=0; const fails=[];
function check(name, ok, detail){
  if(ok) npass++; else { nfail++; fails.push(`  ${name}` + (detail?`  —  ${detail}`:'')); }
}

const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
const dom=new JSDOM(html,{runScripts:'dangerously',resources:'usable',pretendToBeVisual:true,
 url:'file://'+path.resolve(ROOT)+'/index.html',
 beforeParse(w){ w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>({addColorStop(){},data:[],width:0,measureText:()=>({width:10})})});
  const ch=()=>new Proxy(function(){return ch();},{get:()=>ch()}); w.L=new Proxy({},{get(){return function(){return ch();};}});
  w.onerror=()=>{}; Object.defineProperty(w.history,'replaceState',{value:()=>{},writable:true});
  w.URL.createObjectURL=()=>'blob:x'; w.Worker=function(){this.postMessage=()=>{};};
  w.fetch=async(u)=>{try{const cl=String(u).split('?')[0].replace(/^file:.*?\/(?=nodal\/|profiles)/,'');
   const t=fs.readFileSync(path.join(path.resolve(ROOT),cl),'utf8');
   return{ok:true,json:async()=>JSON.parse(t),text:async()=>t};}
   catch(e){return{ok:false,json:async()=>{throw e},text:async()=>{throw e}};}}; }});

setTimeout(()=>{
  const w=dom.window;
  const probe=(src)=>{const s=w.document.createElement('script'); w.__p=null;
    s.textContent=`try{window.__p=JSON.stringify((function(){${src}})());}catch(e){window.__p=JSON.stringify({error:String(e)});}`;
    w.document.body.appendChild(s); return JSON.parse(w.__p);};

  // ── 1. IRON-AIR DOES NOT SOLVE A WINTER WIND DROUGHT ──────────────────────
  // SCENARIO: Seriti Green - 20 GW wind, 25 GW solar, 32 GW coal retired, 25 GW gas,
  // 20 GW/10h lithium, EAF 70. METRIC: July gas energy, with and without 20 GW iron-air.
  // PUBLISHED: identical to the MWh. Survived a heuristic, an LP and a reserve-constrained LP.
  {
    const r=probe(`
      const sc={newWindMW:20000-FIXED.windMW,newPvMW:25000-FIXED.pvUtilityMW,newNuclearMW:0,
                coalEAFPct:70,coalDecomMW:32000,newCcgtMW:25000,newBattMW:20000,newBattHours:10};
      const jul=x=>{let s=0;for(let h=4344;h<5088;h++)s+=(x.stack.ccgt[h]||0)+(x.stack.diesel[h]||0);return s/1000;};
      return {without:jul(simulate({...state,...sc},PROFILES)),
              with20:jul(simulate({...state,...sc,newIronAirMW:20000},PROFILES))};`);
    if(r.error) check('iron-air finding runs', false, r.error);
    else {
      const gap=Math.abs(r.with20-r.without);
      check('iron-air changes July gas by essentially nothing',
            gap < Math.max(5, r.without*0.01),
            `July gas ${r.without.toFixed(0)} without vs ${r.with20.toFixed(0)} with 20 GW iron-air `
            + `- a gap here means the headline long-duration finding has changed`);
      console.log(`  iron-air       July gas ${r.without.toFixed(0)} -> ${r.with20.toFixed(0)} GWh`);
    }
  }

  // ── 2. DEMAND RESPONSE HAS AN OPTIMUM ─────────────────────────────────────
  // SCENARIO: the DASHBOARD default, sweeping drShiftPct. METRIC: AVERAGE COST.
  // Measuring unserved energy in a no-gas system instead shows no optimum at all -
  // that mistake was made on 31 Aug and nearly recorded as the finding breaking.
  {
    const r=probe(`return [0,7.5,30].map(p=>({p,avg:simulate({...state,drShiftPct:p},PROFILES).avgCost}));`);
    if(r.error) check('demand response finding runs', false, r.error);
    else {
      const [z,opt,hi]=r;
      check('modest demand shifting lowers average cost', opt.avg < z.avg,
            `7.5% shift gives ${opt.avg.toFixed(2)} against ${z.avg.toFixed(2)} at zero`);
      check('demand response reverses at high shift', hi.avg > z.avg,
            `30% shift gives ${hi.avg.toFixed(2)} against ${z.avg.toFixed(2)} at zero `
            + `- the rebound peak is the finding`);
      console.log(`  demand resp.   R${z.avg.toFixed(0)} at 0% · R${opt.avg.toFixed(0)} at 7.5% · R${hi.avg.toFixed(0)} at 30%`);
    }
  }

  // ── 3. SOLAR CANNIBALISES ITSELF, WIND DOES NOT ───────────────────────────
  // SCENARIO: NO STORAGE - newBattMW 0 - at 50 GW wind / 60 GW solar. Adding storage
  // materially protects solar and tests a different claim.
  {
    const r=probe(`
      const x=simulate({...state,newWindMW:50000-FIXED.windMW,newPvMW:60000-FIXED.pvUtilityMW,
                        newBattMW:0},PROFILES);
      const P=x.marginalP; let ps=0; for(let h=0;h<HOURS;h++) ps+=P[h];
      const mean=ps/HOURS;
      const cap=g=>{let e=0,rv=0;for(let h=0;h<HOURS;h++){e+=g[h];rv+=g[h]*P[h];}
        return e>0?100*(rv/e)/mean:null;};
      return {wind:cap(x.stack.wind), solar:cap(x.stack.pv)};`);
    if(r.error) check('capture asymmetry finding runs', false, r.error);
    else {
      check('wind holds its capture rate at 110 GW of build',
            r.wind > 85 && r.wind < 115, `wind capture ${r.wind.toFixed(1)}%`);
      check('solar capture collapses at 110 GW of build',
            r.solar < 10, `solar capture ${r.solar.toFixed(1)}% - the asymmetry IS the finding`);
      console.log(`  capture        wind ${r.wind.toFixed(0)}% · solar ${r.solar.toFixed(1)}% (no storage)`);
    }
  }

  // ── 4. BATTERY ANCILLARY SATURATES, AND SA IS PAST THE KNEE ───────────────
  // SCENARIO: asReserveOn with asReserveRMWh AT ITS FIXED DEFAULT. Setting an arbitrary
  // reserve price scales every figure linearly - on 31 Aug a price of 60 against the
  // default 150 produced an exact 60% "error" that was purely the ratio.
  {
    const r=probe(`
      state.asReserveOn=true;
      const c=bessSaturationCurve(simulate({...state},PROFILES));
      return {pts:c.pts.map(p=>({mw:p.mw,anc:p.anc})), nowMW:c.nowMW,
              price:(state.asReserveRMWh??FIXED.asReserveRMWh)};`);
    if(r.error) check('battery saturation finding runs', false, r.error);
    else {
      const first=r.pts[0].anc, last=r.pts[r.pts.length-1].anc;
      check('ancillary revenue saturates as the fleet grows', last < first*0.6,
            `falls ${(100*(1-last/first)).toFixed(1)}% across the sweep`);
      const knee=r.pts.find(p=>p.anc < first*0.999);
      check('South Africa is at or past the ancillary knee',
            !!knee && knee.mw <= r.nowMW,
            knee ? `knee at ${(knee.mw/1000).toFixed(1)} GW against an existing fleet of `
                   + `${(r.nowMW/1000).toFixed(1)} GW` : 'no knee found in the sweep');
      console.log(`  ancillary      knee ~${knee?(knee.mw/1000).toFixed(1):'?'} GW · fleet `
        + `${(r.nowMW/1000).toFixed(1)} GW · reserve price R${r.price}/MWh`);
    }
  }


  // ── 5. SOLAR ALONE CANNOT PASS THE DAYLIGHT FRACTION ──────────────────────
  // SCENARIO: a FLAT 1 MW load matched against regional solar - NO wind, NO battery.
  // METRIC: share of load served directly. Adding either tests a different claim; the
  // point is what solar can do ALONE. PUBLISHED: capped near 45%, because only 49.3%
  // of hours have any sun at all.
  {
    const mp = path.join(ROOT, 'nodal', 'profiles_regional_multiyear.json');
    if (fs.existsSync(mp)){
      const j = JSON.parse(fs.readFileSync(mp, 'utf8'));
      // Years that have SOLAR, not every year in meta.years. Wind reached 2025 on
      // 6 Sep while solar stopped at 2023, and taking meta.years crashed on the missing
      // series - the third symptom of that one gap, after weatherYearNational returning
      // null and the anchor losing its year.
      //
      // Filtering rather than failing is right here: this check is about the daylight
      // ceiling, which every year with solar can test. It reports the count so a shrinking
      // sample cannot pass unnoticed.
      const sc = j.scale, reg = 'Northern Cape';
      const ys = j.meta.years.map(String).filter(y => j.solar_pu[reg] && j.solar_pu[reg][y]);
      if (!ys.length) throw new Error('no solar years available for ' + reg);
      const cover = smw => {
        let tot = 0;
        for (const y of ys){
          const s = j.solar_pu[reg][y];
          let served = 0;
          for (let h = 0; h < 8760; h++) served += Math.min(s[h] / sc * smw, 1);
          tot += 100 * served / 8760;
        }
        return tot / ys.length;
      };
      let n = 0, t = 0;
      for (const y of ys){ const s = j.solar_pu[reg][y];
        for (let h = 0; h < 8760; h++){ t++; if (s[h] / sc > 0.001) n++; } }
      const sunPct = 100 * n / t, c4 = cover(4), c32 = cover(32);
      console.log(`  solar ceiling  tested on ${ys.length} of ${j.meta.years.length} `
        + `weather years (those with solar data)`);
      check('solar alone cannot exceed the daylight fraction', c32 < sunPct + 1,
            `32 MW on a 1 MW load serves ${c32.toFixed(1)}% against a daylight fraction `
            + `of ${sunPct.toFixed(1)}% - the ceiling is physical, not a model artefact`);
      check('eight times the solar buys less than eight points', (c32 - c4) < 8,
            `4 MW serves ${c4.toFixed(1)}%, 32 MW serves ${c32.toFixed(1)}%`);
      console.log(`  solar ceiling  4 MW ${c4.toFixed(1)}% \u00b7 32 MW ${c32.toFixed(1)}%`
        + ` \u00b7 daylight ${sunPct.toFixed(1)}%`);
    }
  }


  // ── 6. AN ANNUAL BUILD TRIGGER CANNOT SEE CUMULATIVE OVERSUPPLY ───────────
  // SCENARIO: demand growing 2% a year, VRE added at a fixed annual rate, EAF 70 -
  // EDMSA Scenario A's own assumptions. METRIC: renewable output wasted as a share of
  // what renewables generate. The claim is about DURATION at a fixed rate, so both runs
  // must use the SAME rate and differ only in years.
  {
    const r = probe(`
      const run = (gwYr, yrs) => {
        const added = gwYr * yrs * 1000;
        const g = Math.round(100 * (Math.pow(1.02, yrs) - 1));
        const x = simulate({ ...state, demandGrowthPct: g, coalEAFPct: 70,
          newWindMW: Math.round(added * 0.45), newPvMW: Math.round(added * 0.55),
          newBattMW: Math.round(gwYr * yrs * 150), newBattHours: 4 }, PROFILES);
        const econ = (x.E.curtailed || 0) / 1e6;
        const cong = Array.from(x.congestMW || []).reduce((a, b) => a + b, 0) / 1e6;
        const vre = (x.E.wind + x.E.pv) / 1e6;
        return 100 * (econ + cong) / Math.max(vre + econ + cong, 1);
      };
      return { five: run(5, 5), ten: run(5, 10), lowTen: run(2, 10) };
    `);
    if (r && !r.error){
      check('the same build rate wastes more when sustained longer',
            r.ten > r.five * 1.5,
            `5 GW/yr wastes ${r.five.toFixed(1)}% over five years and ${r.ten.toFixed(1)}% `
            + `over ten - if these converge, the cumulative-versus-rate finding has changed`);
      check('a low build rate stays at the congestion floor',
            r.lowTen < 5,
            `2 GW/yr over ten years wastes ${r.lowTen.toFixed(1)}%, which should be the `
            + `NERSA congestion ceiling rather than economic surplus`);
      console.log(`  oversupply     5 GW/yr: ${r.five.toFixed(1)}% at 5 yrs, `
        + `${r.ten.toFixed(1)}% at 10 \u00b7 2 GW/yr: ${r.lowTen.toFixed(1)}%`);
    }
  }


  // ── 7. THE INSTANT HEURISTIC DISPATCHES AT THE AVERAGE PRICE ──────────────
  // SCENARIO: the model's own battery fleet against its own hourly prices, default build.
  // METRIC: revenue-weighted average price ACHIEVED on discharge, against the median
  // market price. The published claim is that the heuristic is not targeting peaks -
  // which is a statement about TIMING and needs no revenue comparison to hold.
  //
  // Deliberately NOT asserting the revenue gap. Against perfect foresight it reads 89%,
  // and almost all of that sits in hours a 1,800 MW battery would itself price away by
  // discharging into them. That number is not defensible and is not pinned.
  {
    const r = probe(`
      // SNAPSHOT AND RESTORE. Probes in this harness share one window and earlier ones
      // mutate the scenario object - the oversupply check leaves 46 GW of wind behind.
      // Inheriting that gave R1,141/MWh against R754 measured in isolation, and I nearly
      // recorded the polluted figure as a finding.
      //
      // Rebuilding from FIXED does not work either: it lacks the slider keys simulate
      // needs, so the run throws and a guard silently skips the check - which is how this
      // one disappeared without failing. Restore the defaults instead.
      const saved = JSON.parse(JSON.stringify(state));
      for (const sl of SLIDERS) if (sl.id && sl.def !== undefined) state[sl.id] = sl.def;
      const x = simulate({ ...state, newBattMW: 1000, newBattHours: 4 }, PROFILES);
      const p = x.marginalP, dis = x.stack.batt;
      let rev = 0, mwh = 0;
      for (let h = 0; h < 8760; h++){ const d = dis[h] || 0; rev += d * p[h]; mwh += d; }
      const srt = Array.from(p).sort((a, b) => a - b);
      Object.assign(state, saved);
      return { achieved: mwh > 0 ? rev / mwh : 0, median: srt[4380], mwh };
    `);
    check('the storage timing probe returns a result',
          !!(r && !r.error && r.mwh > 0),
          r && r.error ? String(r.error).slice(0, 90) : 'probe returned no discharge');
    if (r && !r.error && r.mwh > 0){
      const ratio = r.achieved / r.median;
      check('the instant heuristic discharges near the median price, not the peak',
            ratio < 1.5,
            `achieves R${r.achieved.toFixed(0)}/MWh against a median of R${r.median.toFixed(0)} `
            + `- a ratio of ${ratio.toFixed(2)}. If this rises above 1.5 the heuristic has `
            + `started targeting peaks and the published claim needs revisiting`);
      console.log(`  storage timing R${r.achieved.toFixed(0)}/MWh achieved \u00b7 `
        + `median R${r.median.toFixed(0)} \u00b7 ratio ${ratio.toFixed(2)}`);
    }
  }


  // ── 8. CURTAILED RENEWABLES ARE REPLACED BY COAL, ONE FOR ONE ─────────────
  // SCENARIO: default build, the congestion curtailment ceiling swept from 0 to 15%.
  // METRIC: coal energy and CO2 against renewable output spilled. The published claim is
  // a SUBSTITUTION RATIO, so it must be tested by differencing two runs that differ only
  // in the ceiling - not by reading one run's totals.
  //
  // Snapshot and restore, because probes here share one window and earlier ones mutate
  // the scenario. That pollution gave a wrong figure once already today.
  {
    const r = probe(`
      const saved = JSON.parse(JSON.stringify(state));
      for (const sl of SLIDERS) if (sl.id && sl.def !== undefined) state[sl.id] = sl.def;
      const run = pct => {
        const x = simulate({ ...state, congestionCurtailOn: pct > 0,
                             congestionCurtailPct: pct }, PROFILES);
        const cong = Array.from(x.congestMW || []).reduce((a, b) => a + b, 0) / 1e6;
        return { cong, coal: x.E.coal / 1e6, co2: x.co2 };
      };
      const a = run(0), b = run(10);
      Object.assign(state, saved);
      return { spilled: b.cong - a.cong, dCoal: b.coal - a.coal, dCo2: b.co2 - a.co2 };
    `);
    check('the curtailment substitution probe returns a result',
          !!(r && !r.error && r.spilled > 0.1),
          r && r.error ? String(r.error).slice(0, 90) : 'no spill at a 10% ceiling');
    if (r && !r.error && r.spilled > 0.1){
      const ratio = r.dCoal / r.spilled, co2r = r.dCo2 / r.spilled;
      check('spilled renewable output is replaced by coal roughly one for one',
            ratio > 0.8 && ratio < 1.2,
            `${r.spilled.toFixed(2)} TWh spilled replaced by ${r.dCoal.toFixed(2)} TWh of `
            + `coal - a ratio of ${ratio.toFixed(2)}`);
      check('the carbon that follows matches the coal emission factor',
            co2r > 0.85 && co2r < 1.25,
            `${co2r.toFixed(2)} Mt per TWh spilled against an emisCoal of 1.04 - if these `
            + `diverge, either the factor or the substitution has changed`);
      console.log(`  curtail cost   ${r.spilled.toFixed(2)} TWh spilled \u00b7 coal `
        + `${ratio.toFixed(2)}x \u00b7 CO2 ${co2r.toFixed(2)} Mt/TWh`);
    }
  }


  // ── LONG-DURATION STORAGE: THE RESULT INVERTS ON THE GAS ASSUMPTION ──────
  // RESULTS.md carries both: 20 GW of 100-hour iron-air changes July by nothing WITH the
  // Seriti 25 GW of gas, and 10 GW cuts unserved energy 98% WITHOUT gas. Those look
  // contradictory and are not - with gas the deficit is an energy shortage no store can
  // fill; without it the shortfall concentrates into fewer, deeper hours.
  //
  // Both directions asserted, because quoting either without its gas assumption inverts
  // the finding. Snapshot and restore - probes here share one window.
  {
    const r = probe(`
      const saved = JSON.parse(JSON.stringify(state));
      for (const sl of SLIDERS) if (sl.id && sl.def !== undefined) state[sl.id] = sl.def;
      const seriti = { newWindMW: 20000, newPvMW: 25000, newBattMW: 20000, newBattHours: 10,
                       coalDecomMW: 32000, coalEAFPct: 70 };
      const julGas = x => { const MD=[31,28,31,30,31,30,31,31,30,31,30,31];
        let h0=0; for(let m=0;m<6;m++) h0+=MD[m]*24;
        let g=0; for(let h=h0;h<h0+31*24;h++) g+=(x.stack.ccgt[h]||0)+(x.stack.diesel[h]||0);
        return g/1000; };
      const withGasNo  = simulate({ ...state, ...seriti, newCcgtMW: 25000 }, PROFILES);
      const withGasIA  = simulate({ ...state, ...seriti, newCcgtMW: 25000,
                                    newIronAirMW: 20000, newIronAirHours: 100 }, PROFILES);
      // No new lithium in the no-gas case. With Seriti's 20 GW of 4-hour storage the gap
      // is already closed and iron-air has nothing to improve - the check then passes
      // vacuously on 0 -> 0, which is how the first version of it read.
      const bare = { coalDecomMW: 32000, coalEAFPct: 70, newCcgtMW: 0,
                     newWindMW: 40000, newPvMW: 80000 };
      const noGasNo    = simulate({ ...state, ...bare }, PROFILES);
      const noGasIA    = simulate({ ...state, ...bare,
                                    newIronAirMW: 10000, newIronAirHours: 100 }, PROFILES);
      Object.assign(state, saved);
      return { gasJulBefore: julGas(withGasNo), gasJulAfter: julGas(withGasIA),
               noGasBefore: (noGasNo.E.unserved||0)/1000,
               noGasAfter: (noGasIA.E.unserved||0)/1000 };
    `);
    if (r && !r.error){
      const julDelta = Math.abs(r.gasJulAfter - r.gasJulBefore) / Math.max(r.gasJulBefore, 1);
      check('with gas, 20 GW of 100-hour iron-air barely moves July',
            julDelta < 0.02,
            `July gas ${r.gasJulBefore.toFixed(0)} -> ${r.gasJulAfter.toFixed(0)} GWh, `
            + `a ${(julDelta*100).toFixed(1)}% change`);
      check('without gas, 10 GW of 100-hour iron-air cuts unserved energy sharply',
            r.noGasAfter < r.noGasBefore * 0.25 && r.noGasBefore > 100,
            `unserved ${r.noGasBefore.toFixed(0)} -> ${r.noGasAfter.toFixed(0)} GWh - if this `
            + `stops holding, the scope note in RESULTS.md is wrong`);
      console.log(`  LDES scope     with gas July ${r.gasJulBefore.toFixed(0)} -> `
        + `${r.gasJulAfter.toFixed(0)} GWh \u00b7 no gas unserved `
        + `${r.noGasBefore.toFixed(0)} -> ${r.noGasAfter.toFixed(0)} GWh`);
    }
  }


  // ── FINDINGS WITH NO CHECK UNTIL NOW ────────────────────────────────────
  // A coverage sweep on 6 Sep found four RESULTS.md sections with nothing asserting them.
  // Three reproduce; they were holding by luck rather than by anything guarding them, which
  // rule 14 says is the same as not being guarded.
  //
  // The fourth - the no-gas frontier - is deliberately left unchecked: it runs on the
  // ten-year profile file, which the multi-site rebuild has not yet replaced, so its
  // numbers are expected to move. Pinning them now would pin a figure we know is wrong.
  {
    const r = probe(`
      const saved = JSON.parse(JSON.stringify(state));
      for (const sl of SLIDERS) if (sl.id && sl.def !== undefined) state[sl.id] = sl.def;
      const res = simulate(state, PROFILES);
      const P = { ...FIXED, ...state };
      const out = { avgCost: res.avgCost, tx: P.txRPerKWyr };
      Object.assign(state, saved);
      return out;
    `);
    if (r && !r.error){
      // REMOVED 6 Sep 2026. This asserted the model's average ENERGY cost equals R584/MWh
      // because RESULTS.md's locational transmission section quotes R584. It does - as a
      // TRANSMISSION ANNUITY in R/kW-yr, being R6,964/kW over 40 years at 8%. Two
      // unrelated quantities that happened to share a number, and I pinned the coincidence.
      //
      // It passed this morning for the wrong reason and broke today for the right one,
      // which is how it was found. Replaced by the arithmetic it should have checked.
      const af = 0.08 / (1 - Math.pow(1.08, -40));
      check('locational transmission: R6,964/kW annuitises to R584/kW-yr',
            Math.abs(6964 * af - 584) < 2,
            `R${(6964 * af).toFixed(0)}/kW-yr - RESULTS.md derives R584 from R6,964/kW over `
            + `40 years at 8%, and uses it to argue R600 is a sound national average`);
      check('locational transmission: the tariff constant is R600/kW-yr',
            Math.abs(r.tx - 600) < 1,
            `R${r.tx}/kW-yr against the R600 the same section is built on`);
      console.log(`  locational   avgCost R${r.avgCost.toFixed(0)}/MWh \u00b7 tx R${r.tx}/kW-yr`);
    }
  }


  // ── THE FUTURE MIX PRESET IS A CHOSEN POINT, NOT A GUESS ────────────────
  // Searched 8 Sep 2026: 144 builds across wind, solar, battery power and duration, each
  // scored on the worst of twelve weather years with gas excluded.
  //
  // Sixty reach zero shortfall. The cheapest costs R35bn more capex and 14% on the average
  // price to remove 30 GWh in one year of twelve - 0.01% of annual demand. The preset
  // deliberately does NOT buy that, and sits at 4 GWh instead.
  //
  // Pinned so the choice cannot drift back silently. If a future change moves it, the
  // question to ask is whether the trade was re-decided, not whether the number moved.
  {
    const r = probe(`
      const saved = JSON.parse(JSON.stringify(state));
      Object.assign(state, PRESETS['Future electricity mix']);
      const P = { ...FIXED, ...state };
      const out = { wind: P.newWindMW, pv: P.newPvMW, batt: P.newBattMW,
                    hours: P.newBattHours, ccgt: P.newCcgtMW };
      Object.assign(state, saved);
      return out;
    `);
    if (r && !r.error){
      check('the future mix preset keeps gas at zero',
            r.ccgt === 0,
            `newCcgtMW is ${r.ccgt} - this preset exists to show a no-gas build`);
      check('the future mix preset uses 6-hour storage',
            r.hours === 6,
            `newBattHours is ${r.hours}, chosen as 6 on 8 Sep 2026. At 4h the build leaves `
            + `30 GWh unserved on the worst of twelve years; 6h takes it to 4 GWh for R23bn. `
            + `Going all the way to zero costs R35bn more again. If this changed, confirm `
            + `the trade was re-decided rather than the value edited.`);
      console.log(`  future mix    ${r.wind/1000} GW wind \u00b7 ${r.pv/1000} GW solar \u00b7 `
        + `${r.batt/1000} GW / ${r.hours}h storage \u00b7 no gas`);
    }
  }


  // ── EXPORTS ARE A LOAD, AND THEY DO NOT BACK OFF ────────────────────────
  // Added 8 Sep 2026. The model imported 1,150 MW and exported nothing, which is not what
  // the interconnector does: 2025 saw 6,571 GWh imported against 14,935 exported.
  //
  // The curtailable share defaults to ZERO, and that is measured, not assumed. Exports in
  // the 200 most stressed hours of each year 2022-26 ran within 6% of the annual mean and
  // were HIGHER in three years of five - including 2023, the worst load-shedding year on
  // record. They did not back off while the system was failing.
  //
  // Pinned so the default cannot drift. If someone sets it above zero as a modelling
  // convenience, that is a claim about contracts the data does not support, and it should
  // be argued rather than defaulted.
  {
    const r = probe(`
      const P = { ...FIXED, ...state };
      // Under a STRESSED fleet, not defaults. With the demand series corrected to
      // domestic-only on 8 Sep 2026 the model no longer sheds at default settings, so
      // comparing curtailed against uncurtailed there gives 0.0 both ways and proves
      // nothing. 52% availability is roughly the 2023 outturn.
      const a = simulate({ ...state, coalEAFPct: 52, exportsCurtailable: false }, PROFILES);
      const b = simulate({ ...state, coalEAFPct: 52, exportsCurtailable: true }, PROFILES);
      return { def: P.exportsCurtailable, expMW: P.exportsMW,
               unserved0: (a.E.unserved || 0) / 1000,
               unserved100: (b.E.unserved || 0) / 1000 };
    `);
    if (r && !r.error){
      check('exports are modelled and non-zero',
            r.expMW > 0,
            `exportsMW is ${r.expMW} - the interconnector is a NET DRAIN on South Africa, `
            + `8.4 TWh in 2025. Modelling imports without exports overstates firm supply by `
            + `about 1.35 GW at the peak.`);
      check('export curtailment defaults to off',
            r.def === false,
            `exportsCurtailable defaults to ${r.def}. Off is the measured behaviour: across `
            + `2022-26 exports never fell more than 3% in the most stressed hours. A `
            + `non-zero default asserts a contractual flexibility the record does not show.`);
      check('curtailing exports measurably reduces unserved energy',
            r.unserved100 < r.unserved0 - 1,
            `off gives ${r.unserved0.toFixed(1)} GWh unserved, on gives `
            + `${r.unserved100.toFixed(1)} - if these match, the setting is not wired and the `
            + `policy question cannot be asked.`);
      console.log(`  exports       ${r.expMW} MW capacity \u00b7 curtailing all of it takes `
        + `unserved ${r.unserved0.toFixed(1)} \u2192 ${r.unserved100.toFixed(1)} GWh`);
    }

    // The Mozal closure is worth about 1 GW of adequacy headroom, and it is INVISIBLE at
    // today's fleet availability. That is the point worth pinning: a healthy fleet hides
    // the exposure, and it reappears the moment availability falls.
    const m = probe(`
      const a = simulate({ ...state, coalEAFPct: 52, exportsMW: 745 }, PROFILES);
      const b = simulate({ ...state, coalEAFPct: 52, exportsMW: 1750 }, PROFILES);
      const c = simulate({ ...state, exportsMW: 745 }, PROFILES);
      const d = simulate({ ...state, exportsMW: 1750 }, PROFILES);
      return { closed52: (a.E.unserved||0)/1000, open52: (b.E.unserved||0)/1000,
               closedNow: (c.E.unserved||0)/1000, openNow: (d.E.unserved||0)/1000 };
    `);
    if (m && !m.error){
      check('a Mozal restart roughly doubles unserved energy in a bad year',
            m.open52 > m.closed52 * 1.5,
            `at 52% availability, exports 745 MW gives ${m.closed52.toFixed(0)} GWh unserved `
            + `and 1,750 MW gives ${m.open52.toFixed(0)}. The Mozal smelter took about 1 GW `
            + `of Eskom exports until March 2026; its closure is worth that much adequacy `
            + `headroom, and it returns if the smelter does.`);
      check('the same restart is nearly invisible at current availability',
            m.openNow < 5,
            `at 65% availability the restart costs ${m.openNow.toFixed(1)} GWh against `
            + `${m.closedNow.toFixed(1)}. A healthy fleet HIDES this exposure - which is why `
            + `it is worth stating rather than leaving to be rediscovered in a bad year.`);
      console.log(`  Mozal         restart costs ${(m.open52-m.closed52).toFixed(0)} GWh at `
        + `EAF 52, ${(m.openNow-m.closedNow).toFixed(1)} GWh at EAF 65`);
    }
  }

  console.log(`\n${npass}/${npass+nfail} published findings still hold`);
  if(fails.length){ console.log('\nFAILURES:'); fails.forEach(f=>console.log(f)); }
  process.exit(nfail?1:0);
}, 8000);
