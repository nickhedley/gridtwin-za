// Gas start costs the model leaves out, sized on a run's engine check (message 716 (d); report only, no change to the LP or engine).
//   node pathway/gas_starts.js <pathcheck OUTC.json> [more ...]
// Reads each year's gas record (pathcheck r.gasDetail: MW started a year by technology, and by time offline in four bands) and prices
// it at NREL/Intertek APTECH, Power Plant Cycling Costs (Kumar et al., NREL/SR-5500-55433, 2012): lower-bound start costs per MW of
// capacity, CY2011 US dollars, medians, excluding fuel, [hot, warm, cold], as read by the user's advisor (message 716 (d)); the table is
// to be confirmed against the report when it can be reached (the coal rows the page uses are its table 1-1, p.12). To January 2026
// rands with the page's own US_CPI_2011_TO_JAN26 and USD_RATE_R, read from index.html so no constant appears twice.
// Hot, warm and cold for gas turbines by time offline are not in the advisor's reading. Four prices: every start hot; every start cold;
// every start at the highest of the three (warm, for a large frame); and the bands at the large subcritical coal thresholds (hot below
// 12 h, warm 12-40 h, cold beyond; table 1-1), a stand-in, stated as such. Open-cycle gas and diesel open cycle at the large frame
// rates (the IRP's GE 9F.05 and the existing Siemens frame peakers), the aero-derivative rates as a lower case; combined cycle at its
// own.
const fs = require('fs'), path = require('path');
const KUMAR_2011_USD = { frame: [32, 126, 103], aero: [19, 24, 32], cc: [35, 55, 79] };
const page = fs.readFileSync(path.join(__dirname, '..', 'testroot', 'index.html'), 'utf8');
const num = re => { const m = page.match(re); if (!m) throw new Error('gas_starts: not found in index.html: ' + re); return +m[1]; };
const CPI_NOW = num(/const US_CPI_JAN26 = ([0-9.]+)/), CPI_2011 = num(/US_CPI_2011_TO_JAN26 = US_CPI_JAN26 \/ ([0-9.]+)/), FX = num(/const USD_RATE_R = ([0-9.]+)/);
const K = CPI_NOW / CPI_2011 * FX;   // rands (January 2026) per 2011 dollar
const rand = c => KUMAR_2011_USD[c].map(v => v * K);
const files = process.argv.slice(2); if (!files.length) throw new Error('usage: node pathway/gas_starts.js <pathcheck OUTC.json> ...');
console.log(`R per 2011 USD ${K.toFixed(4)} (US CPI-U ${CPI_NOW} / ${CPI_2011} x R${FX}/USD)`);
for (const c of Object.keys(KUMAR_2011_USD)) console.log(`  ${c}: hot / warm / cold R${rand(c).map(v => v.toFixed(0)).join(' / ')} per MW started`);
const out = [];
for (const f of files){
  const rows = JSON.parse(fs.readFileSync(f, 'utf8'));
  for (const r of rows){
    const g = r.gasDetail; if (!g) throw new Error('gas_starts: no gasDetail in ' + f + ' (pathcheck before ee57fc0?)');
    const tech = { ccgt: ['cc', g.ccgt], ocgtGas: ['frame', g.ocgtGas], dieselOC: ['frame', g.dieselOC] };
    const price = (rate, pick) => Object.values(tech).reduce((a, [c, t]) => a + pick(c, t, rate(c)), 0) / 1e9;
    const all = i => (c, t, R) => (t.mwStarted || 0) * R[i];
    const max = (c, t, R) => (t.mwStarted || 0) * Math.max(...R);
    const band = (c, t, R) => { const b = t.mwStartedByOff; if (!b) throw new Error('gas_starts: no mwStartedByOff (pathcheck before this change)');
      return b.lt12h * R[0] + b.h12to40 * R[1] + (b.h40to72 + b.ge72h) * R[2]; };
    const aero = c => c === 'frame' ? rand('aero') : rand(c);
    const row = { file: path.basename(f), year: r.y, mwStartedGW: Object.fromEntries(Object.entries(tech).map(([k, [, t]]) => [k, +((t.mwStarted || 0) / 1e3).toFixed(1)])),
      allHotBn: price(rand, all(0)), bandsBn: price(rand, band), allColdBn: price(rand, all(2)), allHighestBn: price(rand, max),
      aeroBandsBn: price(aero, band), costBn: r.cost };
    out.push(row);
    console.log(`${row.file} ${row.year}: MW started, GW: ${JSON.stringify(row.mwStartedGW)} | R bn a year: all hot ${row.allHotBn.toFixed(2)}, `
      + `by time offline (coal thresholds) ${row.bandsBn.toFixed(2)}, all cold ${row.allColdBn.toFixed(2)}, all at the highest ${row.allHighestBn.toFixed(2)}; `
      + `aero-derivative rates by time offline ${row.aeroBandsBn.toFixed(2)}${row.costBn ? `; ${(100 * row.bandsBn / row.costBn).toFixed(2)}% of the engine's R${row.costBn.toFixed(1)}bn` : ''}`);
  }
}
if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify(out, null, 1));
