// ADEQUACY TOP-UP (user, 13 Oct 2026; branch claude/topup, engine only, no LP). For each year in order whose engine-checked
// mean shed is above target, add new diesel open-cycle capacity in STEP_MW steps (default 250) until mean shed is at or
// below target; capacity added in a year stays in every later year. Each step re-runs pathcheck.js for that one year
// (YEARS=<y>, EXTRA_OCGD_MW=<cumulative top-up>), so draws, seeds and target are the engine check's own.
// Cost: the engine-checked system cost with the top-up in place, against the run's own engine check (CHECK). The change is
// split into capex (the engine's open-cycle capex, R/kW, annualised at the run's BLD_DISC over BLD_LIFE.ocgd), fixed O&M,
// diesel fuel for the extra hours run (change in diesel TWh x costDiesel) and the rest (VOM and carbon tax on that diesel,
// the shed penalty saved, and sampling differences). Present values at 8% real, 2026 base (the one cost basis, 12 Oct).
// Flags a year whose top-up exceeds the run's own build caps: new diesel open-cycle off, its yearly cap (bldOcgdRateMW
// from bldOcgdFromYear), or the shared turbine cap (bldTurbineCapMW).
// Run from harness/: IN=out/pathway_<n>.json CHECK=out/pathcheck_<n>.json OUT=out/topup_<n>.json COMMIT=1 PSE=1 TF=0.5 node topup.js
const fs = require('fs'), path = require('path'), cp = require('child_process'); const { JSDOM } = require('jsdom');
const ROOT = 'testroot', IN = process.env.IN, CHECK = process.env.CHECK, OUT = process.env.OUT || 'topup.json';
const STEP = +(process.env.STEP_MW || 250), MAXX = +(process.env.MAX_EXTRA_MW || 20000), PVR = 0.08;
if (!IN || !CHECK) throw new Error('set IN (pathway json) and CHECK (its pathcheck json)');
const P = JSON.parse(fs.readFileSync(IN, 'utf8')), C = JSON.parse(fs.readFileSync(CHECK, 'utf8'));
for (const k of ['y', 'mean', 'target', 'cost', 'diesel']) if (!C.length || !(k in C[0])) throw new Error('CHECK rows have no ' + k);
const runYear = (y, extra) => {
  const tmp = path.join(require('os').tmpdir(), 'topup_' + process.pid + '_' + y + '_' + extra + '.json');
  const r = cp.spawnSync('node', ['--max-old-space-size=8192', 'pathcheck.js'], { encoding: 'utf8', maxBuffer: 1 << 26,
    env: { ...process.env, IN, OUTC: tmp, YEARS: String(y), EXTRA_OCGD_MW: String(extra) } });
  if (r.status !== 0) throw new Error('pathcheck.js failed for ' + y + ' +' + extra + ' MW: ' + (r.stderr || '').slice(-800));
  const rows = JSON.parse(fs.readFileSync(tmp, 'utf8')); fs.unlinkSync(tmp);
  if (rows.length !== 1 || rows[0].y !== y) throw new Error('pathcheck.js returned no row for ' + y);
  if (rows[0].newOcgdMW !== C.find(q => q.y === y).newOcgdMW + extra) throw new Error('extra MW not applied in ' + y);
  return rows[0];
};
(async () => {
  // The engine's own figures, read once: open-cycle capex, life, fixed O&M, diesel fuel price, at the run's discount rate.
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, url: 'file://' + path.resolve(ROOT) + '/index.html',
    beforeParse(w) { w.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: () => () => ({ addColorStop() {}, data: [], width: 0, measureText: () => ({ width: 10 }) }) });
      const ch = () => new Proxy(function () { return ch(); }, { get: () => ch() }); w.L = new Proxy({}, { get() { return function () { return ch(); }; } });
      w.onerror = () => {}; Object.defineProperty(w.history, 'replaceState', { value: () => {}, writable: true }); w.URL.createObjectURL = () => 'blob:x'; w.Worker = function () { this.postMessage = () => {}; };
      w.fetch = async (u) => { try { const cl = String(u).split('?')[0].replace(/^file:.*?\/(?=nodal\/|profiles|config)/, ''); const t = fs.readFileSync(path.join(path.resolve(ROOT), cl), 'utf8'); return { ok: true, json: async () => JSON.parse(t), text: async () => t }; } catch (e) { return { ok: false, json: async () => { throw e; }, text: async () => { throw e; } }; } }; } });
  await new Promise(r => setTimeout(r, 6000)); const w = dom.window;
  if (P.disc != null) w.eval(`BLD_DISC=${+P.disc};`);
  if (P.ocgt && P.ocgt.costCase) w.eval(`state.bldOcgtCostCase=${JSON.stringify(P.ocgt.costCase)};`);
  const K = JSON.parse(w.eval(`JSON.stringify((()=>{ const S={...FIXED,...state}; return { disc: BLD_DISC, life: BLD_LIFE.ocgd, capexRkW: bldCapex('ocgd', 2026),
    annRkW: bldAnnuity(bldCapex('ocgd', 2026), BLD_LIFE.ocgd, 'ocgd'), fomRkW: bldFom('ocgd', 2026), costDiesel: S.costDiesel,
    ocgdOn: S.bldOcgdOn, rateMW: S.bldOcgdRateMW, fromYear: S.bldOcgdFromYear, turbineCapMW: S.bldTurbineCapMW }; })())`));
  // The run's own caps where it recorded them (P.ocgt), else the engine defaults.
  const O = P.ocgt || {}, cap = { on: O.diesel ?? K.ocgdOn, rate: O.dieselRateMW ?? K.rateMW, from: O.dieselFrom ?? K.fromYear, turb: O.turbineCapMW ?? K.turbineCapMW, lng: O.lng ?? 0 };
  console.log('engine figures', JSON.stringify(K), 'run caps', JSON.stringify(cap));
  let extra = 0; const rows = [];
  for (const s of C.slice().sort((a, b) => a.y - b.y)) {
    const y = s.y; let t = s, add = 0, steps = 0;
    if (extra > 0 || s.mean > s.target) {
      if (extra > 0) { t = runYear(y, extra); steps++; }   // at no extra capacity the run's own check stands
      while (t.mean > t.target) { if (extra + STEP > MAXX) throw new Error('top-up above MAX_EXTRA_MW in ' + y); extra += STEP; add += STEP; t = runYear(y, extra); steps++; }
    }
    const b = P.sched[y] || {}, allowed = cap.on ? (y >= cap.from ? cap.rate : 0) : 0;
    const flags = [];
    if (add > 0 && !cap.on) flags.push('new diesel open-cycle not allowed in this run');
    else if (add > 0 && (b.ocgd || 0) + add > allowed) flags.push(`diesel open-cycle ${(b.ocgd || 0) + add} MW > cap ${allowed}`);
    if (add > 0 && cap.turb > 0 && (b.ccgt || 0) + (b.ocgt || 0) + (b.ocgd || 0) + add > cap.turb) flags.push(`turbines ${(b.ccgt || 0) + (b.ocgt || 0) + (b.ocgd || 0) + add} MW > cap ${cap.turb}`);
    const capexBn = extra * 1000 * K.annRkW / 1e9, fomBn = extra * 1000 * K.fomRkW / 1e9, fuelBn = (t.diesel - s.diesel) * 1e6 * K.costDiesel / 1e9;
    const dBn = t.cost - s.cost;
    const row = { y, addedMW: add, extraMW: extra, steps, solved: { mean: s.mean, target: s.target, cost: s.cost, diesel: s.diesel, co2: s.co2 },
      topped: { mean: t.mean, target: t.target, cost: t.cost, diesel: t.diesel, co2: t.co2, draws: t.draws }, dCostBn: dBn, capexBn, fomBn, fuelBn, otherBn: dBn - capexBn - fomBn - fuelBn, flags };
    rows.push(row);
    console.log(y, JSON.stringify(row));
  }
  const pv = f => rows.reduce((a, r) => a + f(r) / Math.pow(1 + PVR, r.y - 2026), 0);
  const tot = { addedMW: extra, pvSolvedBn: pv(r => r.solved.cost), pvToppedBn: pv(r => r.topped.cost), pvCapexBn: pv(r => r.capexBn), pvFomBn: pv(r => r.fomBn),
    pvFuelBn: pv(r => r.fuelBn), pvOtherBn: pv(r => r.otherBn), co2SolvedMt: rows.reduce((a, r) => a + r.solved.co2, 0), co2ToppedMt: rows.reduce((a, r) => a + r.topped.co2, 0),
    flagged: rows.filter(r => r.flags.length).map(r => r.y) };
  console.log('== adequacy top-up: new diesel open-cycle, ' + STEP + ' MW steps; shed and target GWh on customer demand; R bn a year');
  console.log('year  solved shed/target   added MW (total)   topped shed/target   d cost   capex    FOM   fuel  other   flags');
  for (const r of rows) console.log(`${r.y}  ${r.solved.mean.toFixed(2).padStart(6)} / ${r.solved.target.toFixed(2)}   ${String(r.addedMW).padStart(6)} (${String(r.extraMW).padStart(5)})      ${r.topped.mean.toFixed(2).padStart(6)} / ${r.topped.target.toFixed(2)}   ${r.dCostBn.toFixed(2).padStart(6)} ${r.capexBn.toFixed(2).padStart(6)} ${r.fomBn.toFixed(2).padStart(6)} ${r.fuelBn.toFixed(2).padStart(6)} ${r.otherBn.toFixed(2).padStart(6)}   ${r.flags.join('; ')}`);
  console.log(`cost 2026-40, PV at 8% real: as solved R${tot.pvSolvedBn.toFixed(0)}bn; with the top-up R${tot.pvToppedBn.toFixed(0)}bn (capex ${tot.pvCapexBn.toFixed(1)}, FOM ${tot.pvFomBn.toFixed(1)}, fuel ${tot.pvFuelBn.toFixed(1)}, other ${tot.pvOtherBn.toFixed(1)}); top-up ${tot.addedMW} MW; CO2 ${tot.co2SolvedMt.toFixed(0)} -> ${tot.co2ToppedMt.toFixed(0)} Mt; over the build caps: ${tot.flagged.length ? tot.flagged.join(', ') : 'none'}`);
  fs.writeFileSync(OUT, JSON.stringify({ engine: K, caps: cap, step: STEP, rows, total: tot }, null, 1));
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
