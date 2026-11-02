// Reduces ext/vpp_coordination.sh's one-year tests to the VPP's coordination gain against its coordination cost (user, 2 Nov 2026,
// messages 645-647; RESULTS 'VPP coordination gain against coordination cost'). Per year Y, rands a year per kW of enrolled power
// (E / 2.5 h), January 2026 money: net gain at the cap = (LP objective without enrolment - objective at zero programme cost), taken
// from present value (8%, 2026) to year Y, over the kW enrolled; wear = the solved vpx_ columns at their objective coefficients, the
// same way; gain = net gain + wear; cost = the page's resource cost (VPP_COST_USD_KW_YR.resource x USD_RATE_R, read from index.html)
// + wear; enrolled MW under the central and at each fixed programme cost run. Writes derived figures only (OUT, default
// ext/vpp_coordination.json), which the reviewer pack's vppcoord.* keys read.
//   cd harness && node ext/vpp_coordination.js   (DIR: the runs' folder, default out/vppcoord)
const fs = require('fs'), path = require('path');
const DIR = process.env.DIR || 'out/vppcoord', OUT = process.env.OUT || path.join(__dirname, 'vpp_coordination.json');
const html = fs.readFileSync(path.join('testroot', 'index.html'), 'utf8');
const num = re => { const m = html.match(re); if (!m) throw new Error('vpp_coordination.js: not found in index.html: ' + re); return +m[1]; };
const rate = num(/const USD_RATE_R = ([\d.]+);/), disc = num(/const BLD_DISC_CENTRAL = ([\d.]+);/), stamp = html.match(/BUILD_STAMP = '([^']+)'/)[1];
const P = { incentiveUsd: num(/incentiveUsd: ([\d.]+)/), otherUsd: num(/otherUsd: ([\d.]+)/), kw: num(/kw: ([\d.]+) \}/) };
const cpi = num(/US_CPI_JAN26 = ([\d.]+)/) / num(/US_CPI_2022_TO_JAN26 = US_CPI_JAN26 \/ ([\d.]+);/);
const resourceR = P.otherUsd / P.kw * cpi * rate;
const last = f => { const J = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')); const L = J.passLog[J.passLog.length - 1]; if (!L.vpp) throw new Error(f + ': no vpp record (pathway_perfail.js before VPP_YEAR)'); return L; };
const years = [...new Set(fs.readdirSync(DIR).map(f => (f.match(/^p_y(\d{4})_off\.json$/) || [])[1]).filter(Boolean))].sort();
const out = { note: 'Derived figures only. RESULTS: VPP coordination gain against coordination cost (messages 645-647).', build: stamp,
  resourceCostR: resourceR, usdRate: rate, years: {} };
for (const y of years){
  const df = Math.pow(1 + disc, -(y - 2026)), off = last(`p_y${y}_off.json`), zero = last(`p_y${y}_zero.json`);
  const mw = zero.vpp.vpppMW[y], kw = mw * 1000; if (!(mw > 0)) throw new Error(y + ': nothing enrolled at zero programme cost');
  const net = (off.objective - zero.objective) / df / kw, wear = (zero.vpp.wearPV[y] || 0) / df / kw;
  const runs = fs.readdirSync(DIR).filter(f => new RegExp(`^p_y${y}_(central|usd[\\d.]+)\\.json$`).test(f)).map(f => {
    const L = last(f), c = f.match(/_(central|usd([\d.]+))\.json$/); return { programmeCostR: c[2] ? +c[2] * rate : resourceR, enrolledMW: L.vpp.vpppMW[y] }; })
    .sort((a, b) => a.programmeCostR - b.programmeCostR);
  out.years[y] = { capMW: mw, gainR: net + wear, wearR: wear, netGainR: net, costR: resourceR + wear, incrementalMWh: (zero.vpp.wearPV[y] || 0) / df / num(/battCycleCostR:(\d+)/), runs };
}
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
for (const [y, v] of Object.entries(out.years)) console.log(y, 'cap', v.capMW.toFixed(0), 'MW | gain R' + v.gainR.toFixed(1), 'wear R' + v.wearR.toFixed(1), 'net R' + v.netGainR.toFixed(1), 'cost R' + v.costR.toFixed(1), '| runs', v.runs.map(r => 'R' + r.programmeCostR.toFixed(0) + ':' + r.enrolledMW.toFixed(0)).join(' '));
