// validate_rooftop_map.js: the rooftop map and address search (user, 19 Oct 2026, message 253 D4), in Chromium (Playwright).
// Three cases: Google's map (the Maps JavaScript API replaced by ext/gmaps_stub.js), no key, and a key Google rejects after
// loading. Photon and the Solar API are answered with fixed responses; other external files come through curl. Not in the
// suite list: it needs Chromium and the network for Leaflet. About 3 minutes.   node validate_rooftop_map.js testroot
const fs=require('fs'),path=require('path'),http=require('http');
const ROOT=path.resolve(process.argv[2]);
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const STUB = fs.readFileSync(path.join(__dirname,'ext','gmaps_stub.js'),'utf8');
const PHOTON = { features: [
  { geometry:{coordinates:[28.0473,-26.2041]}, properties:{countrycode:'ZA', housenumber:'12', street:'Jan Smuts Avenue', district:'Parktown', city:'Johannesburg', state:'Gauteng'} },
  { geometry:{coordinates:[28.05,-26.20]}, properties:{countrycode:'ZA', name:'<b>Rosebank</b>', city:'Johannesburg', state:'Gauteng'} },
  { geometry:{coordinates:[25.9,-24.6]}, properties:{countrycode:'BW', name:'Gaborone'} } ] };
const SOLAR = { center:{latitude:-26.2041,longitude:28.0473}, boundingBox:{sw:{latitude:-26.2043,longitude:28.0471},ne:{latitude:-26.2039,longitude:28.0475}},
  imageryQuality:'HIGH', solarPotential:{ maxArrayPanelsCount:40, panelCapacityWatts:400, wholeRoofStats:{areaMeters2:210},
  roofSegmentStats:[{pitchDegrees:20,azimuthDegrees:5,stats:{areaMeters2:120},boundingBox:{sw:{latitude:-26.2043,longitude:28.0471},ne:{latitude:-26.2041,longitude:28.0475}}},
                    {pitchDegrees:20,azimuthDegrees:185,stats:{areaMeters2:90},boundingBox:{sw:{latitude:-26.2041,longitude:28.0471},ne:{latitude:-26.2039,longitude:28.0475}}}] } };
const CACHE=new Map(); let pass=0, fail=0; const check=(n,ok,d)=>{ ok?pass++:fail++; console.log((ok?'  ok   ':'  FAIL ')+n+(ok||!d?'':'  -  '+d)); };
(async()=>{
  const server=http.createServer((req,res)=>{ let f=path.join(ROOT,decodeURIComponent(req.url.split('?')[0])); if(f.endsWith('/')) f+='index.html';
    if(!fs.existsSync(f)||!fs.statSync(f).isFile()){res.writeHead(404);return res.end();} res.writeHead(200,{'content-type':f.endsWith('.html')?'text/html':f.endsWith('.js')?'text/javascript':'application/json'}); res.end(fs.readFileSync(f)); }).listen(0);
  const port=server.address().port;
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
  for (const mode of ['google','nokey','authfail']){
    console.log('-- '+mode);
    const ctx=await b.newContext({viewport:{width:1400,height:900}}); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
    const hits={photon:0,nominatim:0,gmaps:0,solar:0,esri:0};
    await p.route('**/*', r=>{ const u=r.request().url();
      if (u.startsWith(`http://localhost:${port}/config.js`)) return r.fulfill({contentType:'text/javascript', body: mode==='nokey' ? "window.GOOGLE_SOLAR_KEY='';" : "window.GOOGLE_SOLAR_KEY='TESTKEY';"});
      if (u.startsWith(`http://localhost:${port}`)) return r.continue();
      if (u.includes('photon.komoot.io')){ hits.photon++; return r.fulfill({contentType:'application/json', body:JSON.stringify(PHOTON)}); }
      if (u.includes('nominatim')){ hits.nominatim++; return r.fulfill({status:500, body:''}); }
      if (u.includes('maps.googleapis.com/maps/api/js')){ hits.gmaps++; const cb=new URL(u).searchParams.get('callback');
        return r.fulfill({contentType:'text/javascript', body: STUB + `\nsetTimeout(()=>{ ${mode==='authfail' ? 'window['+JSON.stringify(cb)+'](); setTimeout(()=>window.gm_authFailure&&window.gm_authFailure(),300);' : 'window['+JSON.stringify(cb)+']();'} },50);`}); }
      if (u.includes('solar.googleapis.com')){ hits.solar++; return r.fulfill({contentType:'application/json', body:JSON.stringify(SOLAR)}); }
      if (u.includes('arcgisonline')){ hits.esri++; return r.fulfill({status:404, body:''}); }
      // Other external files (Leaflet and the like from their CDNs) fetched by curl through the session's proxy.
      if (!CACHE.has(u)){ try { CACHE.set(u, require('child_process').execFileSync('curl',['-sSL','--max-time','30',u],{maxBuffer:64<<20})); } catch(e){ CACHE.set(u, null); } }
      const body=CACHE.get(u); if (!body) return r.fulfill({status:404, body:''});
      return r.fulfill({ body, contentType: /\.css(\?|$)/.test(u) ? 'text/css' : /\.js(\?|$)/.test(u) ? 'text/javascript' : /\.png/.test(u) ? 'image/png' : 'application/octet-stream' }); });
    await p.goto(`http://localhost:${port}/index.html`,{waitUntil:'load'});
    await p.waitForFunction(()=>typeof window.switchTab==='function' && typeof window.rtInitMap==='function',null,{timeout:300000}).catch(e=>{ console.log('page errors:', errs.slice(0,5).join(' | ')); throw e; });
    await p.evaluate(()=>switchTab('rooftop'));
    await p.waitForFunction(()=>typeof rtBackend!=='undefined' && rtBackend!==null,null,{timeout:20000});
    await p.waitForTimeout(800);
    const want = mode==='google' ? 'google' : 'leaflet';
    check(`[${mode}] the map is ${want}`, await p.evaluate(()=>rtBackend)===want, await p.evaluate(()=>rtBackend));
    if (mode==='google') check('[google] satellite with labels, straight down', await p.evaluate(()=>rtMap._opts.mapTypeId==='hybrid' && rtMap._opts.tilt===0));
    // Rooftop search, typed
    await p.fill('#rtSearch','12 Jan Smuts'); await p.waitForTimeout(1500);
    const box=await p.evaluate(()=>document.getElementById('rtSearchResults').innerHTML);
    if (want==='google'){ check('[google] type-ahead from Places, not Photon', /Places street/.test(box) && hits.photon===0, box.slice(0,200)); }
    else { check(`[${mode}] type-ahead from Photon with its credit, ZA only`, /Jan Smuts Avenue/.test(box) && /OpenStreetMap/.test(box) && !/Gaborone/.test(box) && hits.photon>0, box.slice(0,300));
           check(`[${mode}] OSM names are escaped`, /&lt;b&gt;Rosebank/.test(box)); }
    check(`[${mode}] no Nominatim request`, hits.nominatim===0, String(hits.nominatim));
    // Pick the first suggestion
    await p.evaluate(()=>document.querySelector('#rtSearchResults > div').click()); await p.waitForTimeout(1500);
    const st=await p.evaluate(()=>({area:document.getElementById('rt_area').value, sheet:!!rtSolarApi, drawn: rtSolarLayer ? rtSolarLayer.length : 0, status: document.getElementById('rt_status').textContent}));
    check(`[${mode}] a pick measures the roof (Solar API)`, (mode==='nokey') ? !st.sheet : (st.sheet && st.area==='210'), JSON.stringify(st).slice(0,200));
    if (mode!=='nokey') check(`[${mode}] roof faces drawn only on Google's map`, want==='google' ? st.drawn===3 : st.drawn===0, String(st.drawn));
    if (mode!=='nokey') check(`[${mode}] the legend only where faces are drawn`, want==='google' ? /Outlined below/.test(st.status) : !/Outlined below/.test(st.status), st.status.slice(0,120));
    // Trace a 20 m x 10 m rectangle through the map click handler of the live map
    const tr=await p.evaluate(async (want)=>{ rtStartTrace(); const la=-26.2041, ln=28.0473, dLa=10/111195, dLn=20/(111195*Math.cos(la*Math.PI/180));
      const pts=[[la,ln],[la,ln+dLn],[la+dLa,ln+dLn],[la+dLa,ln],[la,ln]];
      for (const q of pts){ if (want==='google') rtMap._fire('click',{latLng:{lat:()=>q[0],lng:()=>q[1]}}); else rtMap.fire('click',{latlng:L.latLng(q[0],q[1])}); }
      return { area:+document.getElementById('rt_area').value, tracing:rtTracing, poly:!!rtPolygon, markers:rtMarkers.length }; }, want);
    check(`[${mode}] trace by clicks: 200 m2 roof, polygon closed`, Math.abs(tr.area-200)<=1 && !tr.tracing && tr.poly && tr.markers===4, JSON.stringify(tr));
    const un=await p.evaluate(()=>{ rtClearTrace(); return { m:rtMarkers.length, poly:rtPolygon }; });
    check(`[${mode}] clear removes the trace`, un.m===0 && un.poly===null);
    // Main site search (Leaflet map, always Photon)
    await p.evaluate(()=>switchTab('solar')); const before=hits.photon; await p.fill('#mainSearch','Rosebank'); await p.waitForTimeout(1500);
    const mb=await p.evaluate(()=>document.getElementById('mainSearchResults').innerHTML);
    check(`[${mode}] main search: Photon with credit`, hits.photon>before && /Jan Smuts Avenue/.test(mb) && /Photon/.test(mb), mb.slice(0,200));
    check(`[${mode}] no page errors`, errs.length===0, errs.slice(0,3).join(' | '));
    await p.screenshot({path:path.join(require('os').tmpdir(),`rooftop_${mode}.png`)});
    await ctx.close();
  }
  await b.close(); server.close(); console.log(`\n${pass}/${pass+fail} D4 render checks passed`); process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
