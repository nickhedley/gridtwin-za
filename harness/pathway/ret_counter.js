// Restart counter for the engine check (message 374 (a)), inserted into a copy of pathcheck.js by make_ret.py; run by chain_c6b.sh.
// Not loaded on its own: the text is spliced in before pathcheck.js's year loop.
 // MESSAGE 374 (a), scratch copy of pathcheck.js: count forced-outage returns. genUnitOutagePath is redefined from its own source with a
 // counter at each return to service (a unit's repair ends while its station is up, or its station's common-mode outage ends while
 // the unit is up); the random stream is unchanged, so the runs are the engine check's own. Each return costed as a cold start at
 // the 360 rates (wear, other and start fuel; no forced-outage term) and, beside it, with the 369 (a) forced-outage term.
 w.eval(`(function(){
   const o360 = coalUcOpts({ ...FIXED, ...state, coalStartEfor: 0 }), oEf = coalUcOpts({ ...FIXED, ...state, coalStartEfor: 1 });
   window.__rate = { sub: [o360.startOf(1, 1000, 'sub'), oEf.startOf(1, 1000, 'sub')], super: [o360.startOf(1, 1000, 'super'), oEf.startOf(1, 1000, 'super')] };
   window.__agg = {};
   window.__ret = (mw, cls) => { const a = window.__agg[window.__curY] || (window.__agg[window.__curY] = { n: 0, mw: 0, r360: 0, rEf: 0, runs: 0, unitYears: 0 });
     a.n++; a.mw += mw; a.r360 += mw * window.__rate[cls][0]; a.rEf += mw * window.__rate[cls][1]; };
   let src = genUnitOutagePath.toString();
   const R = [["const fleetMW = units.reduce((a,b) => a+b, 0) || 1;", "const fleetMW = units.reduce((a,b) => a+b, 0) || 1; const __cls = Array.isArray(unitList) ? unitList.map(u => u.cls) : units.map(() => 'sub'); { const a = window.__agg[window.__curY] || (window.__agg[window.__curY] = { n: 0, mw: 0, r360: 0, rEf: 0, runs: 0, unitYears: 0 }); a.runs++; a.unitYears += units.length; }"],
     ["else      { if (rnd() < mu)     up[i] = 1; }", "else      { if (rnd() < mu){ up[i] = 1; if (stUp[stationOf[i]] || !cmHit[i]) window.__ret(units[i], __cls[i]); } }"],
     ["else        { if (rnd() < muC)  stUp[k] = 1; }", "else        { if (rnd() < muC){ stUp[k] = 1; for (let i = 0; i < units.length; i++) if (stationOf[i] === k && cmHit[i] && up[i]) window.__ret(units[i], __cls[i]); } }"]];
   for (const [a, b] of R){ if (src.split(a).length !== 2) throw new Error('instrument: ' + a.slice(0, 40)); src = src.replace(a, b); }
   genUnitOutagePath = eval('(' + src + ')');
 })()`);
