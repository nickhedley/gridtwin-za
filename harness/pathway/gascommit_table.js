// s_gascommit against c6 (user, 26 Oct 2026, message 386 (a)): engine PV 2026-40 at 8% real, CO2, both criteria of NTCSA's
// medium-term adequacy test (mean unserved energy at most 20 GWh a year; open-cycle capacity factor under 6%: all open-cycle
// output over the installed capacity of the same plant, pathcheck's ocgtCF), new gas standing and gas output by year, and the
// rest of the build. Usage, from harness/: node pathway/gascommit_table.js <outdir> c6 <run>
const fs = require('fs');
const [O, ...names] = process.argv.slice(2);
function load(n){
  const P = JSON.parse(fs.readFileSync(`${O}/pathway_${n}.json`)); const rows = [];
  for (const g of ['a', 'b', 'c']) rows.push(...Object.values(JSON.parse(fs.readFileSync(`${O}/pathcheck_${n}_${g}.json`))).filter(r => r && r.y));
  rows.sort((a, b) => a.y - b.y); const d = y => Math.pow(1.08, -(y - 2026));
  const cum = {}, c = {}; for (const y of Object.keys(P.sched).sort()){ for (const k of ['wind', 'pv', 'batt', 'ccgt', 'ocgt', 'ocgd', 'ironair', 'vrfb'])
    c[k] = (c[k] || 0) + (P.sched[y][k] || 0); cum[y] = { ...c }; }
  const by = Object.fromEntries(rows.map(r => [r.y, r]));
  return { n, rows, by, cum, pv: rows.reduce((s, r) => s + r.cost * d(r.y), 0), co2: rows.reduce((s, r) => s + r.co2, 0),
    maxMean: Math.max(...rows.map(r => r.mean)), worst: Math.max(...rows.map(r => r.worst)),
    over20: rows.filter(r => r.mean > 20 + 1e-9).map(r => r.y), oc6: rows.filter(r => r.ocgtCF >= 0.06).map(r => r.y),
    ocMax: Math.max(...rows.map(r => r.ocgtCF).filter(v => v != null && isFinite(v))) };
}
const R = names.map(load), base = R.find(r => r.n === 'c6'), gw = v => ((v || 0) / 1e3).toFixed(1), f1 = v => v.toFixed(1);
const both = r => (r.over20.length || r.oc6.length) ? 'no' + (r.over20.length ? ': unserved over 20 GWh in ' + r.over20.join(', ') : '') + (r.oc6.length ? '; open-cycle 6% or more in ' + r.oc6.join(', ') : '') : 'met';
console.log('| Run | Both NTCSA criteria | Mean unserved, highest year / worst run, GWh | Open-cycle CF, highest year | Engine PV, R bn | Against c6 | CO2 2026-40, Mt |');
console.log('|---|---|---|---|---|---|---|');
for (const r of R) console.log(`| ${r.n} | ${both(r)} | ${r.maxMean.toFixed(1)} / ${r.worst.toFixed(0)} | ${(100 * r.ocMax).toFixed(2)}% | ${f1(r.pv)} | ${r === base ? '–' : (r.pv - base.pv >= 0 ? '+' : '') + f1(r.pv - base.pv)} | ${r.co2.toFixed(0)} |`);
console.log('\n| Run | Year | New CCGT / open-cycle LNG / open-cycle diesel, GW | Gas output TWh (CF) | New wind / solar / lithium, GW | CO2, Mt | Curtailed, TWh |');
console.log('|---|---|---|---|---|---|---|');
for (const r of R) for (const y of [2030, 2035, 2040]){ const b = r.cum[y] || {}, x = r.by[y] || {};
  console.log(`| ${r.n} | ${y} | ${gw(b.ccgt)} / ${gw(b.ocgt)} / ${gw(b.ocgd)} | ${(+x.gasTWh || 0).toFixed(1)} (${x.gasCF != null ? (100 * x.gasCF).toFixed(0) + '%' : '–'}) | ${gw(b.wind)} / ${gw(b.pv)} / ${gw(b.batt)} | ${(+x.co2).toFixed(1)} | ${(+x.curt).toFixed(1)} |`); }
