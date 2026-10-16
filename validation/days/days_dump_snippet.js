  if (process.env.SN_DAYS){
    // Message 122 (1): read-only. The optimiser's calendar days (bldRepDays(12), non-tail): per day, new wind (modern x corr), tracking
    // solar, existing wind and fixed-tilt solar per unit, demand (default profile), and the same means over the default year and over
    // the twelve weather years (wind and solar) for the weights.
    const r=JSON.parse(w.eval(`(function(){ const k=windNewCorr(state.bldWindCorr ?? FIXED.bldWindCorr); const wm=windModOf(PROFILES.wind), tr=solarTrkOf(PROFILES.solar);
      const all=bldRepDays(12); const D=all.filter(r=>!r.tail && !r.solar); const day=r=>{ let a={nw:0,tr:0,cw:0,fp:0,dem:0}; for(let h=0;h<24;h++){ const i=r.d*24+h; a.nw+=Math.min(1,k*wm[i]); a.tr+=tr[i]; a.cw+=PROFILES.wind[i]; a.fp+=PROFILES.solar[i]; a.dem+=PROFILES.demand[i]; } for (const q in a) a[q]/=24; return a; };
      const yr={nw:0,tr:0,cw:0,fp:0,dem:0}; for(let i=0;i<wm.length;i++){ yr.nw+=Math.min(1,k*wm[i]); yr.tr+=tr[i]; yr.cw+=PROFILES.wind[i]; yr.fp+=PROFILES.solar[i]; yr.dem+=PROFILES.demand[i]; } for (const q in yr) yr[q]/=wm.length;
      const wy={nw:0,tr:0,cw:0,fp:0,n:0}; for (const yy of bldWeatherYears.meta.years){ const nat=weatherYearNational(String(yy)); const m=windModOf(nat.wind), t=solarTrkOf(nat.solar); for(let i=0;i<m.length;i++){ wy.nw+=Math.min(1,k*m[i]); wy.tr+=t[i]; wy.cw+=nat.wind[i]; wy.fp+=nat.solar[i]; } wy.n+=m.length; } for (const q of ['nw','tr','cw','fp']) wy[q]/=wy.n;
      return JSON.stringify({k, nAll:all.length, tails:all.filter(r=>r.tail||r.solar).map(r=>({d:r.d,w:r.weight,tail:!!r.tail})), days:D.map(r=>({d:r.d, weight:r.weight, prevD:r.prevD, ...day(r)})), allDays:Array.from({length:365},(_,d)=>({d, ...day({d})})), defaultYear:yr, twelveYears:wy}); })()`));
    fs.writeFileSync(process.env.SN_DAYS, JSON.stringify(r,null,1)); console.log('days', r.days.length);
  }
