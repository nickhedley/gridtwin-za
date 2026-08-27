const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync('testroot/index.html', 'utf8');
const errors = [];

function stubLeaflet() {
  const chain = () => new Proxy(function(){ return chain(); }, { get: () => chain() });
  const L = new Proxy({}, {
    get(target, prop) {
      if (prop === 'map') return () => ({ setView: chain, on: chain, invalidateSize: chain, addLayer: chain, removeLayer: chain, getContainer: () => ({ style: {} }) });
      if (prop === 'tileLayer') return () => ({ addTo: chain });
      if (prop === 'circleMarker' || prop === 'marker' || prop === 'polyline' || prop === 'polygon' || prop === 'layerGroup' || prop === 'geoJSON')
        return () => ({ addTo: chain, bindPopup: chain, bindTooltip: chain, on: chain, setLatLng: chain, remove: chain });
      if (prop === 'latLng') return (a,b) => ({ lat:a, lng:b });
      return chain();
    }
  });
  return L;
}

const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  resources: 'usable',
  url: 'file://' + path.resolve('testroot') + '/index.html',
  pretendToBeVisual: true,
  beforeParse(window) {
    window.HTMLCanvasElement.prototype.getContext = () => ({
      clearRect(){}, fillRect(){}, strokeRect(){}, beginPath(){}, moveTo(){}, lineTo(){},
      stroke(){}, fill(){}, closePath(){}, arc(){}, save(){}, restore(){}, translate(){},
      scale(){}, rotate(){}, setLineDash(){}, measureText(){ return {width:0}; },
      fillText(){}, strokeText(){}, createLinearGradient(){ return { addColorStop(){} }; },
      getImageData(){ return {data:[]}; }, setTransform(){}, transform(){}, drawImage(){}, putImageData(){}, clip(){}, quadraticCurveTo(){}, bezierCurveTo(){}, rect(){},
    });
    window.L = stubLeaflet();
    window.fetch = (...args) => require('node:https'), // placeholder, replaced below
    window.onerror = (msg, src, line, col, err) => errors.push({ msg, line, col, stack: err && err.stack });
    window.addEventListener('error', (e) => errors.push({ msg: e.message, lineno: e.lineno, error: e.error && e.error.stack }));
  }
});

// Wire real Node fetch (18+) into the jsdom window, resolving relative URLs against testroot/
const rootDir = path.resolve('testroot');
dom.window.fetch = async (url, opts) => {
  try {
    let u = String(url);
    if (u.startsWith('http')) {
      return await fetch(u, opts); // let real network calls (CDNs) go through if available
    }
    // Local relative file
    const clean = u.split('?')[0];
    const filePath = path.join(rootDir, clean);
    const text = fs.readFileSync(filePath, 'utf8');
    return {
      ok: true,
      json: async () => JSON.parse(text),
      text: async () => text,
    };
  } catch (e) {
    return { ok: false, json: async () => { throw e; }, text: async () => { throw e; } };
  }
};

setTimeout(() => {
  console.log('=== Errors ===');
  errors.length ? errors.forEach(e => console.log(e.msg, '| line', e.lineno||e.line)) : console.log('none');
  const doc = dom.window.document;
  console.log('\n=== Box contents ===');
  ['kpis','mix','shed','lcoe'].forEach(id => {
    const el = doc.getElementById(id);
    console.log(id + ':', el ? el.innerHTML.length + ' chars' : 'NOT FOUND');
  });
  console.log('\nstate defined:', typeof dom.window.state);
  console.log('lastRes defined:', typeof dom.window.lastRes, dom.window.lastRes ? 'has E:'+(!!dom.window.lastRes.E) : '');
  process.exit(0);
}, 6000);
