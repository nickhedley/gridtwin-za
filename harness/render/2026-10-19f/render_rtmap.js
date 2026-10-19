// Message 248: the rooftop tab's satellite map on a fresh page load in Chromium, four cases, each in its own fresh page: the tab
// opened with no site, after a site query at an inland rural point and at an offshore point, and after a Johannesburg address.
// Serve the repository over HTTP, then  node render_rtmap.js <output folder> <url> <label>
// The site query (Open-Meteo) and the address search (Nominatim) cannot be reached from the test container, so the cases set
// what each sets when it succeeds: window._resourceData = {lat, lng} for a site query, and rtGoTo(lat, lng, true) for an address.
// Every imagery tile requested is logged with its zoom, and Esri's tilemap service says whether that tile has imagery.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const OUT = process.argv[2], URL = process.argv[3], LABEL = process.argv[4] || 'after';
const CASES = [
  { name: 'fresh', note: 'tab opened, no site' },
  { name: 'rural', note: 'site query near De Aar, Northern Cape', site: [-30.65, 24.0] },
  { name: 'offshore', note: 'site query 20 km off the Eastern Cape coast', site: [-34.2, 25.8] },
  { name: 'address', note: 'Johannesburg address (Sandton City)', addr: [-26.1076, 28.0567] },
];
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }).catch(async () => chromium.launch());
  const res = {};
  for (const C of CASES){
    const p = await b.newPage({ viewport: { width: 1400, height: 1000 } });
    const errs = [], tiles = []; p.on('pageerror', e => errs.push(String(e)));
    p.on('response', r => { const m = r.url().match(/World_Imagery\/MapServer\/tile\/(\d+)\/(\d+)\/(\d+)/); if (m) tiles.push({ z: +m[1], y: +m[2], x: +m[3], bytes: +(r.headers()['content-length'] || 0) }); });
    await p.goto(URL, { waitUntil: 'load' });
    await p.waitForFunction(() => window.GTZA_READY === true && window.lastRes, null, { timeout: 180000 });
    await p.waitForFunction(() => /GWh|^0$/.test((document.getElementById('bdShed')?.textContent || '').trim()), null, { timeout: 900000, polling: 2000 });
    if (C.site) await p.evaluate(s => { window._resourceData = { lat: s[0], lng: s[1] }; }, C.site);
    await p.evaluate(() => switchTab('rooftop'));
    if (C.addr) { await p.waitForTimeout(1500); await p.evaluate(a => rtGoTo(a[0], a[1], true), C.addr); }
    await p.waitForTimeout(9000);
    const st = await p.evaluate(() => ({ zoom: rtMap && rtMap.getZoom(), centre: rtMap && rtMap.getCenter(),
      nativeMax: (typeof rtImagery !== 'undefined' && rtImagery) ? rtImagery.options.maxNativeZoom : null }));
    // Which imagery tiles shown at the final zoom have imagery, by Esri's tilemap service
    const shownZ = Math.min(st.zoom, st.nativeMax || 19), shown = tiles.filter(t => t.z === shownZ);
    const uniq = [...new Map(shown.map(t => [t.z + '/' + t.y + '/' + t.x, t])).values()].slice(0, 12);
    const avail = await p.evaluate(async ts => Promise.all(ts.map(t => fetch(`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tilemap/${t.z}/${t.y}/${t.x}/1/1?f=json`)
      .then(r => r.json()).then(d => d.data && d.data[0]).catch(() => null))), uniq);
    await p.locator('#rtMap').scrollIntoViewIfNeeded();
    await p.locator('#rtMap').screenshot({ path: `${OUT}/${LABEL}_${C.name}.png` });
    res[C.name] = { note: C.note, ...st, imageryTileZooms: [...new Set(tiles.map(t => t.z))].sort(), shownZoom: shownZ, shownTilesChecked: uniq.length,
      shownTilesWithImagery: avail.filter(v => v === 1).length, shownTilesWithout: avail.filter(v => v === 0).length, errors: errs };
    console.log(LABEL, C.name, JSON.stringify(res[C.name]));
    await p.close();
  }
  require('fs').writeFileSync(`${OUT}/render_${LABEL}.json`, JSON.stringify(res, null, 1));
  await b.close();
})();
