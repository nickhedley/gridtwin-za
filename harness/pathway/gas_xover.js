// Gas crossover on the build LP's own inputs (message 714 (b)). Run through pathway_perfail.js with GAS_XOVER=<out.json> and the
// run's own settings: the script sets the page up exactly as for that run, evaluates this instead of solving, writes the table and
// exits. For each model year, new combined-cycle gas (ccgt), open-cycle gas on LNG (ocgt) and open-cycle on diesel (ocgd):
//   fixed, R/kW-yr: the LP's capital charge (bldNetAnnuityAt: capex x interest during construction over the technology's build
//     years, annuitised at its cost of capital over its life, plus fixed O&M with the LNG terminal charge on ccgt and ocgt, less any
//     capacity payment on its derated MW) plus its grid charge (bldGridAnn when bldGridCost is on);
//   variable, R/MWh: fuel x heat-rate factor + variable O&M + carbon tax x emissions, as the LP's gg_, go_ and gd_ terms;
//   crossover capacity factor: the share of the year at which two technologies cost the same per kW,
//     (fixed_a - fixed_b) / (8.76 x (variable_b - variable_a)), with a the one dearer to build.
// LP_CHECK=<file.lp> (optional) checks the table against an LP the same settings dumped (DUMP_LP): each b_ccgt_<y>, b_ocgt_<y> and
// b_ocgd_<y> objective coefficient against 1000 x the discounted sum of the fixed charge over the years the LP charges it, and, hour
// by hour, the ratios go_/gg_ and gd_/gg_ against the variable costs' ratios. It stops on any mismatch.
const fs = require('fs');
const PAGE_FN = `(opts) => {
  const S = { ...FIXED, ...(opts.state || {}) }, Y = BLD_YEARS;
  const GRID_ON = (S.bldGridCost | 0) > 0;
  const OC_K = S.heatRateOcgtKJ / 3600 * S.effCcgtHHV;
  const FOSSIL_END = +(S.bldFossilEndYear || 0), AT = +(S.bldAnnuityToYear || 0), YE = Y[Y.length - 1];
  const YA = AT > YE ? Y.concat(Array.from({ length: AT - YE }, (_, i) => YE + 1 + i)) : Y;
  const TECH = ['ccgt', 'ocgt', 'ocgd'];
  const inputs = { OC_K, gridOn: GRID_ON, disc: BLD_DISC, chargedTo: YA[YA.length - 1], fossilEndYear: FOSSIL_END,
    ocgtCostCase: S.bldOcgtCostCase ?? FIXED.bldOcgtCostCase, terminalRkWyr: bldGasTerminalRkW(S),
    vom: { ccgt: S.vomCcgt, ocgt: S.vomOcgt, ocgd: S.vomDiesel }, emisTPerMWh: { ccgt: S.emisCcgt, ocgt: S.emisCcgt * OC_K, ocgd: S.emisDiesel },
    dieselFuelR: S.costDiesel, heatRateOcgtKJ: S.heatRateOcgtKJ, effCcgtHHV: S.effCcgtHHV };
  for (const t of TECH) inputs[t] = { buildYears: BLD_BUILD_Y[t] || 0, idc: bldIdcFactor(t), rate: bldAnnuityRate(t), life: BLD_LIFE[t],
    fomExTerminal: BLD_FOM[t] || 0, capPayRkWyr: capPayRate(t), derate: BLD_DERATE[t] ?? 0, gridRkWyr: GRID_ON ? bldGridAnn(t, S) : 0 };
  if (FOSSIL_END > 0) throw new Error('gas_xover: bldFossilEndYear is set; the per-year crossover assumes the full-life annuity');
  const years = {};
  for (const y of Y){
    const fuel = bldGasFuelR(opts, y, S), carbon = carbonTaxAt(y, S), df = yy => 1 / Math.pow(1 + BLD_DISC, yy - 2026);
    const v = { ccgt: fuel + S.vomCcgt + carbon * S.emisCcgt,
                ocgt: fuel * OC_K + S.vomOcgt + carbon * S.emisCcgt * OC_K,
                ocgd: S.costDiesel + S.vomDiesel + carbon * S.emisDiesel };
    const row = { gasFuelR: fuel, carbonRPerT: carbon };
    for (const t of TECH){
      const capex = bldCapex(t, y), ann = bldAnnuity(capex, BLD_LIFE[t], t), fom = bldFom(t, y, S), net = bldNetAnnuityAt(t, y);
      const fixed = net + inputs[t].gridRkWyr;
      let pv = 0; for (const yy of YA) if (yy >= y) pv += fixed * df(yy);
      row[t] = { capexRkW: capex, annuityRkWyr: ann, fomRkWyr: fom, netCapitalRkWyr: net, fixedRkWyr: fixed, variableRMWh: v[t], lpCoef: pv * 1000 };
    }
    const x = (a, b) => { const df_ = row[a].fixedRkWyr - row[b].fixedRkWyr, dv = row[b].variableRMWh - row[a].variableRMWh;
      return dv > 0 ? df_ / (8.76 * dv) : null; };
    row.crossoverCF = { ccgt_ocgt: x('ccgt', 'ocgt'), ccgt_ocgd: x('ccgt', 'ocgd'), ocgt_ocgd: row.ocgt.fixedRkWyr >= row.ocgd.fixedRkWyr ? x('ocgt', 'ocgd') : x('ocgd', 'ocgt') };
    years[y] = row;
  }
  return { inputs, years };
}`;
// The objective's coefficients for the named variables, from an LP file in CPLEX LP format (objective first, up to 'Subject To').
function lpObjective(file, want){
  const txt = fs.readFileSync(file, 'utf8'), end = txt.search(/^\s*subject to/im);
  if (end < 0) throw new Error('gas_xover: no Subject To in ' + file);
  const obj = txt.slice(0, end), out = {};
  const re = /([+-])?\s*([0-9.eE+-]+)\s+([A-Za-z_][A-Za-z0-9_]*)/g; let m;
  while ((m = re.exec(obj))) { const n = m[3]; if (want(n)) out[n] = (m[1] === '-' ? -1 : 1) * +m[2]; }
  return out;
}
function lpCheck(tab, file){
  const c = lpObjective(file, n => /^b_(ccgt|ocgt|ocgd)_20\d\d$/.test(n) || /^g[gdo]_20\d\d_\d+_\d+$/.test(n));
  const bad = [], seen = { b: 0, h: 0 };
  for (const [y, r] of Object.entries(tab.years)) for (const t of ['ccgt', 'ocgt', 'ocgd']){
    const n = 'b_' + t + '_' + y; if (!(n in c)) continue; seen.b++;
    if (Math.abs(c[n] - r[t].lpCoef) > 0.01 + 1e-9 * Math.abs(c[n])) bad.push(n + ' ' + c[n] + ' vs ' + r[t].lpCoef.toFixed(3)); }
  for (const n of Object.keys(c)){ const m = n.match(/^gg_(20\d\d)_(\d+_\d+)$/); if (!m) continue; const r = tab.years[m[1]], g = c[n];
    if (!(g > 0)) continue;
    for (const [p, t] of [['go', 'ocgt'], ['gd', 'ocgd']]){ const k = p + '_' + m[1] + '_' + m[2]; if (!(k in c)) continue; seen.h++;
      const want = r[t].variableRMWh / r.ccgt.variableRMWh, got = c[k] / g;
      // coefficients are written to 3 decimals: allow that rounding on both
      const tol = 0.0005 / g + 0.0005 / c[k] + 1e-9;
      if (Math.abs(got / want - 1) > 2 * tol) bad.push(k + '/gg ratio ' + got.toFixed(6) + ' vs ' + want.toFixed(6)); } }
  if (!seen.b || !seen.h) throw new Error('gas_xover: LP_CHECK found no gas terms in ' + file);
  if (bad.length) throw new Error('gas_xover: LP_CHECK mismatch (' + bad.length + '): ' + bad.slice(0, 8).join('; '));
  return { buildCoefs: seen.b, hourRatios: seen.h };
}
module.exports = { PAGE_FN, lpCheck };
