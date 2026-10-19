// Message 229 (3): run with the repository served over HTTP (python3 -m http.server 8137 from the repository root), then
//   node render_presets.js <output folder> http://127.0.0.1:8137/index.html   (Playwright, Chromium at /opt/pw-browsers)
// Message 229 (3): render check on a fresh page load in Chromium, no manual run(): each 2035 preset clicked as a user would;
// the board's expected shed, the KPIs (system cost, carbon intensity), the caption and the gas readout read from the DOM,
// beside the page's own result objects (lastRes, adequacyEnsemble); screenshots of the board, preset caption and KPIs.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const OUT = process.argv[2], URL = process.argv[3] || 'http://localhost:8137/index.html';
const NAMES = ['Least-cost path 2035', 'IRP path 2035', 'Deep decarbonisation 2035'];
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }).catch(async () => chromium.launch());
  const p = await b.newPage({ viewport: { width: 1400, height: 1000 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto(URL, { waitUntil: 'load' });
  await p.waitForFunction(() => window.GTZA_READY === true && window.lastRes, null, { timeout: 180000 });
  // the start-up risk panels hold the main thread; wait for the board's expected shed to settle before clicking
  const settled = () => /GWh|^0$/.test((document.getElementById('bdShed')?.textContent || '').trim());
  await p.waitForFunction(settled, null, { timeout: 600000, polling: 2000 });
  const res = { stamp: await p.evaluate(() => BUILD_STAMP), gas: await p.evaluate(() => ({ readout: document.getElementById('cv_lcoeCcgt')?.textContent, lcoeCcgt: FIXED.lcoeCcgt, costCcgt: FIXED.costCcgt })), presets: {} };
  for (const n of NAMES){
    // adequacyEnsemble is a top-level let in the page: read by name, not from window
    await p.evaluate(() => { window.__prevRes = window.lastRes; window.__prevEns = adequacyEnsemble; });
    await p.click(`button[data-preset="${n}"]`, { timeout: 600000 });
    await p.waitForFunction(() => window.lastRes && window.lastRes !== window.__prevRes, null, { timeout: 600000, polling: 2000 });
    // the board's expected shed comes from the adequacy ensemble, which runs after the dispatch: wait for a fresh one
    await p.waitForFunction(() => adequacyEnsemble && adequacyEnsemble !== window.__prevEns && /GWh|^0$/.test((document.getElementById('bdShed')?.textContent || '').trim()), null, { timeout: 900000, polling: 2000 });
    await p.waitForTimeout(1500);
    const r = await p.evaluate(() => {
      const kp = Object.fromEntries([...document.querySelectorAll('#kpis .kpi')].map(d => [d.querySelector('.k')?.textContent.trim(), d.querySelector('.v')?.textContent.trim()]));
      const R = window.lastRes, e = adequacyEnsemble || {};
      return { active: document.querySelector('#presets button.active')?.dataset.preset, caption: document.getElementById('presetCaption')?.textContent,
        board: { status: document.getElementById('statusWord')?.textContent, shed: document.getElementById('bdShed')?.textContent, peak: document.getElementById('bdPeak')?.textContent },
        kpis: { systemCost: kp['System cost'], carbonIntensity: kp['Carbon intensity'], replacement: kp['Replacement cost'], avg: kp['Avg energy cost*'] },
        model: { totalCostBn: R.totalCost / 1e9, systemCostBn: R.systemCostR / 1e9, co2Mt: R.co2, unservedGWh: R.E.unserved / 1e3, replAvg: R.replAvg, eueGWh: e.eueGWh, scenarioYear: state.scenarioYear, demandGrowthPct: state.demandGrowthPct },
        gasReadout: document.getElementById('cv_lcoeCcgt')?.textContent };
    });
    res.presets[n] = r;
    const slug = n.replace(/[^A-Za-z0-9]+/g, '_');
    await p.locator('.board').screenshot({ path: `${OUT}/${slug}_board.png` });
    await p.locator('#presetCaption').scrollIntoViewIfNeeded();
    const box1 = await p.locator('#presets').boundingBox(), box2 = await p.locator('#kpis').boundingBox();
    const y0 = Math.min(box1.y, box2.y), y1 = Math.max(box1.y + box1.height, box2.y + box2.height);
    await p.screenshot({ path: `${OUT}/${slug}_presets_kpis.png`, fullPage: true, clip: { x: 0, y: y0 - 10, width: 1400, height: Math.min(1400, y1 - y0 + 20) } });
    console.log(n, JSON.stringify(r));
  }
  res.errors = errs;
  require('fs').writeFileSync(`${OUT}/render.json`, JSON.stringify(res, null, 1));
  console.log('errors', errs.length, errs.slice(0, 3)); await b.close();
})();
