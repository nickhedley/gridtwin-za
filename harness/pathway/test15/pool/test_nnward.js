// Message 767 (c): pool_days.js's nnWard (nearest-neighbour chain) against the page's bldWardClusters (cubic greedy), same partition.
// Features as bldRepDaysClustered's (demand, new wind, tracking solar, each 0-1), from a pool dump (REP_POOL=dump:). From harness/:
//   node pathway/test15/pool/test_nnward.js <index.html> <pool_series.json>
const fs = require('fs'), path = require('path');
const html = fs.readFileSync(process.argv[2], 'utf8'), D = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
const src = html.slice(html.indexOf('function bldWardClusters('), html.indexOf('// k-medoids, PAM'));
const bldWardClusters = new Function(src + '; return bldWardClusters;')();
const nnWard = new Function(fs.readFileSync(path.join(__dirname, 'pool_days.js'), 'utf8').match(/\nfunction nnWard[\s\S]*?\n}\n/)[0] + '; return nnWard;')();
const feats = (yrs) => { const P = [], nz = a => { let lo = Infinity, hi = -Infinity; for (const v of a){ lo = Math.min(lo, v); hi = Math.max(hi, v); } return a.map(v => hi > lo ? (v - lo) / (hi - lo) : 0); };
  const dem = nz(D.demand), wn = nz(yrs.flatMap(y => D.wy[y].windN)), st = nz(yrs.flatMap(y => D.wy[y].solarT));
  for (let p = 0; p < yrs.length * 365; p++){ const x = new Float64Array(72), d = p % 365; for (let h = 0; h < 24; h++){ x[h] = dem[d * 24 + h]; x[24 + h] = wn[p * 24 + h]; x[48 + h] = st[p * 24 + h]; } P.push(x); }
  return P; };
const key = cl => JSON.stringify(cl.map(c => c.slice().sort((a, b) => a - b)).sort((a, b) => a[0] - b[0]));
let pass = 0, fail = 0;
for (const [name, yrs, k, drop] of [['2025, 365 days, k 12', ['2025'], 12, []], ['2014, 365 days, k 10', ['2014'], 10, [3, 7]], ['2015-2017, 1,095 days, k 10', ['2015', '2016', '2017'], 10, [5]]]){
  const X = feats(yrs), ids = []; for (let p = 0; p < X.length; p++) if (!drop.includes(p)) ids.push(p);
  const t0 = Date.now(), a = bldWardClusters(X, ids, k), t1 = Date.now(), b = nnWard(X, ids, k), t2 = Date.now();
  const ok = key(a) === key(b); ok ? pass++ : fail++;
  console.log((ok ? '  ok   ' : '  FAIL ') + name + ': same partition (greedy ' + (t1 - t0) + ' ms, chain ' + (t2 - t1) + ' ms; sizes ' + a.map(c => c.length).sort((x, y) => y - x).join(',') + ')');
}
console.log(pass + '/' + (pass + fail) + ' passed'); process.exit(fail ? 1 : 0);
