// COSTSET (7 Oct 2026): apply a whole cost set to the page before the build loop or the engine check, so
// optimiser and engine read the same numbers. COSTSET=irp2025 loads costset_irp2025.json, built from the
// IRP 2025 assumptions workbook by costset_irp2025.py (never edited by hand). Used by pathway_perfail.js
// and pathcheck.js. Every key is checked before it is written: a missing key throws rather than reading 0.
const fs = require('fs'), path = require('path');
module.exports = function applyCostSet(w, name) {
  if (!name) return null;
  const file = path.join(__dirname, 'costset_' + name + '.json');
  const cs = JSON.parse(fs.readFileSync(file, 'utf8'));
  w.__COSTSET = cs;
  w.eval(`(function(){
    const cs = window.__COSTSET;
    for (const t of Object.keys(cs.capex)) if (!BLD_COST[t]) throw new Error('COSTSET: BLD_COST.' + t + ' missing');
    for (const t of Object.keys(cs.fom)) if (!(t in BLD_FOM)) throw new Error('COSTSET: BLD_FOM.' + t + ' missing');
    for (const k of Object.keys(cs.state)) if (!(k in FIXED)) throw new Error('COSTSET: FIXED.' + k + ' missing');
    // Capex by build year from the table; fractional years (the engine's midpoint vintage) interpolate
    // linearly, and years outside 2026-2040 hold the end value. Technologies not in the set keep bldCapex.
    const base = bldCapex;
    bldCapex = function(tech, year){
      const tab = cs.capex[tech]; if (!tab) return base(tech, year);
      const y = Math.max(2026, Math.min(2040, year)), y0 = Math.floor(y), y1 = Math.min(2040, y0 + 1);
      return tab[y0] + (tab[y1] - tab[y0]) * (y - y0);
    };
    for (const t of Object.keys(cs.fom)) BLD_FOM[t] = cs.fom[t];
    for (const k of Object.keys(cs.state)) state[k] = cs.state[k];
  })()`);
  // Read back through the page's own functions, so a log shows what the optimiser actually sees.
  const seen = JSON.parse(w.eval(`JSON.stringify({wind:bldCapex('wind',2030), pv:bldCapex('pv',2030), batt:bldCapex('batt',2030),
    ccgt:bldCapex('ccgt',2030), fomCcgt:bldFom('ccgt',2030), costCcgt:state.costCcgt, vomCcgt:state.vomCcgt})`));
  console.log('COSTSET', name, '2030 as read by the page:', JSON.stringify(seen));
  return cs;
};
