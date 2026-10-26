// ROOFTOP ADD-BACK ON THE TWELVE-YEAR MEAN, pathway runs only (user, 26 Oct 2026, messages 391 (b) and 392 (c)). The demand series
// (profiles.json, build_demand_2026.py) adds rooftop back on calendar 2025's solar profile, which the page removes on the same
// profile, so a page run is matched. The pathway's build LP and engine check run twelve weather years, whose mean solar (FIXED_PV_CF_12Y)
// is below 2025's, so the same add-back left their grid load about 1.7 TWh a year above the measured base. This scales the add-back to
// the twelve-year mean, hour by hour on 2025's shape: demand less rooftopMW x derate x S x (1 - K), K = FIXED_PV_CF_12Y over S's mean.
// A proxy; the exact fix, adding back each run's own solar, is after the note. Returns K. Used by pathway_perfail.js (ROOF12=1, recorded
// in the output as roofAddback12) and pathcheck.js (applied when the run recorded it).
module.exports = function roof12(w){
  return +w.eval(`(function(){ const S = PROFILES.solar, n = S.length; let m = 0; for (let h = 0; h < n; h++) m += S[h]; m /= n;
    const K = FIXED_PV_CF_12Y / m, R = FIXED.rooftopMW * FIXED.rooftopDerate * (1 - K), D = PROFILES.demand, out = new Array(D.length);
    for (let h = 0; h < D.length; h++) out[h] = D[h] - R * S[h % n];
    PROFILES.demand = out; return K; })()`);
};
