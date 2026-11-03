// The two plain errors in the modelled weather years found on 3 Nov 2026, and the wind correction (message 683 (b), (c); measurement
// only). Installs window.__wxFixNat(year) in the page: the year's national series with the fixes applied. Used by pathcheck.js
// (WX_FIX) and pathway/wx/eskom2025.js. mode 'fixed': leap years (2016, 2020, 2024: the fetch scripts kept the first 8,760 hours, so
// 29 February is in and 31 December out; here 29 February is removed and 30 December repeated as 31 December, for wind, the
// modern-turbine twin, solar and the tracking twin) and the clock (Renewables.ninja wind rows are UTC and were read as SAST; wind
// and its twin move 2 hours later, the first two hours from the previous year's last two; 2014 repeats its first hour). mode
// 'corrected': 'fixed' plus the wind correction tb (corrected per-unit output by calendar month on a 0-1 grid), with new wind on the
// page's national modern-turbine map of the corrected series. A test variant, not a series.
module.exports = function install(w, mode, tb){
  if (!['fixed', 'corrected'].includes(mode)) throw new Error('WX_FIX must be fixed or corrected');
  if (mode === 'corrected' && !(tb && tb.table.length === 12 && tb.table.every(r => r.length === tb.grid.n))) throw new Error('WX_TABLE: 12 rows of grid.n values');
  w.eval(`(function(){ const MODE=${JSON.stringify(mode)}, TB=${tb?JSON.stringify({t:tb.table,n:tb.grid.n}):'null'}, LEAP=new Set(['2016','2020','2024']), cache={};
     const leap=a=>{ const o=new Float64Array(8760); let j=0; for (let i=0;i<8760;i++){ if (i>=59*24 && i<60*24) continue; o[j++]=a[i]; } for (let h=0;h<24;h++) o[8736+h]=o[8712+h]; return o; };
     const lf=(y,a)=>LEAP.has(y)?leap(a):Float64Array.from(a);
     const base=y=>{ if (cache['b'+y]) return cache['b'+y]; const n=weatherYearNational(y); if (!n) return null;
       return (cache['b'+y]={wind:lf(y,n.wind),mod:n.wind.mod?lf(y,n.wind.mod):null,solar:lf(y,n.solar),trk:n.solar.trk?lf(y,n.solar.trk):null}); };
     const shift=(y,key)=>{ const b=base(y), a=b[key], pv=bldWeatherYears.meta.years.map(String).includes(String(+y-1))?base(String(+y-1)):null, pa=pv?pv[key]:null;
       const o=new Float64Array(8760); o[0]=pa?pa[8758]:a[0]; o[1]=pa?pa[8759]:a[0]; for (let h=2;h<8760;h++) o[h]=a[h-2]; return o; };
     const corr=a=>{ const o=new Float64Array(a.length); for (let h=0;h<a.length;h++){ const r=TB.t[hourMonth(h)], x=Math.max(0,Math.min(1,a[h]))*(TB.n-1), i=Math.min(TB.n-2,Math.floor(x)), f=x-i; o[h]=r[i]+(r[i+1]-r[i])*f; } return o; };
     window.__wxFixNat=yy=>{ const y=String(yy); if (cache['n'+y]) return cache['n'+y]; const b=base(y);
       let wd=shift(y,'wind'); if (MODE==='fixed' && b.mod) wd.mod=shift(y,'mod'); if (MODE==='corrected') wd=corr(wd);
       const s=b.solar; if (b.trk) s.trk=b.trk; return (cache['n'+y]={wind:wd,solar:s,...(b.trk?{solarTrk:b.trk}:{})}); }; })();`);
};
