// Summary of an engine check for the cut test (message 666 (d)): total cost on the pack's basis (engine PV + system strength + compliance,
// 8%), CO2, unserved (highest yearly mean, its year, worst draw), hours short of the inertia floor (sum of yearly means), the highest
// open-cycle share, curtailment 2026-40, CO2 by year 2035-40, and pass: every year's mean unserved <= its target, open-cycle < 6%, no
// hour short of the floor (shortH = 0), and for Deep (CO2MAX) every year 2035-40's CO2 <= CO2MAX.  node pathway/cutsumm.js <prefix>
const fs = require('fs'); const pre = process.argv[2], CO2MAX = process.env.CO2MAX ? +process.env.CO2MAX : null;
const R = []; for (const g of 'abc'){ const f = `${pre}_${g}.json`; if (!fs.existsSync(f)) { console.log(JSON.stringify({ pre, missing: g })); process.exit(0); } R.push(...Object.values(JSON.parse(fs.readFileSync(f)))); }
R.sort((a, b) => a.y - b.y); const d = y => Math.pow(1.08, -(y - 2026));
const pv = R.reduce((s, r) => s + (r.cost + ((r.ss && r.ss.costBn) || 0) + (r.complyBn || 0)) * d(r.y), 0);
const mx = R.reduce((a, r) => r.mean > a.mean ? { mean: r.mean, y: r.y } : a, { mean: 0, y: 0 });
const out = { pre, pv: +pv.toFixed(1), co2: +R.reduce((s, r) => s + r.co2, 0).toFixed(1), maxMean: +mx.mean.toFixed(2), maxMeanYear: mx.y,
  worstDraw: +Math.max(...R.map(r => r.worst)).toFixed(1), shortH: +R.reduce((s, r) => s + ((r.ss && r.ss.shortH) || 0), 0).toFixed(2),
  ocMax: +(100 * Math.max(...R.map(r => r.ocgtCF || 0))).toFixed(2), curtTWh: +R.reduce((s, r) => s + (r.curt || 0), 0).toFixed(1),
  co2By: Object.fromEntries(R.filter(r => r.y >= 2035).map(r => [r.y, +r.co2.toFixed(2)])) };
out.pass = R.every(r => r.mean <= r.target + 1e-9) && out.ocMax < 6 && out.shortH === 0 && (CO2MAX == null || R.filter(r => r.y >= 2035).every(r => r.co2 <= CO2MAX));
console.log(JSON.stringify(out));
