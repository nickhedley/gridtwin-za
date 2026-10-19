// Message 235 (1): the two 2035 captions on a fresh page load in Chromium. Serve the repository over HTTP (python3 -m
// http.server 8138 from the repository root), then
//   node render_captions.js <output folder> http://127.0.0.1:8138/index.html   (Playwright, Chromium at /opt/pw-browsers)
// Each preset is clicked as a user would; the caption shown under the buttons is read from the DOM and screenshotted.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const OUT = process.argv[2], URL = process.argv[3] || 'http://127.0.0.1:8138/index.html';
const NAMES = ['Least-cost path 2035', 'IRP path 2035'];
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }).catch(async () => chromium.launch());
  const p = await b.newPage({ viewport: { width: 1400, height: 1000 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto(URL, { waitUntil: 'load' });
  await p.waitForFunction(() => window.GTZA_READY === true && window.lastRes, null, { timeout: 180000 });
  // the start-up risk panels hold the main thread; wait for the board's expected shed to settle before clicking
  await p.waitForFunction(() => /GWh|^0$/.test((document.getElementById('bdShed')?.textContent || '').trim()), null, { timeout: 600000, polling: 2000 });
  const res = { stamp: await p.evaluate(() => BUILD_STAMP), presets: {} };
  for (const n of NAMES){
    await p.click(`button[data-preset="${n}"]`, { timeout: 600000 });
    await p.waitForFunction(x => document.querySelector('#presets button.active')?.dataset.preset === x, n, { timeout: 600000, polling: 1000 });
    // the caption shows while the pointer is on the button (mouseenter), as a reader sees it
    await p.hover(`button[data-preset="${n}"]`, { timeout: 600000 });
    await p.waitForTimeout(1500);
    res.presets[n] = await p.evaluate(() => ({ caption: document.getElementById('presetCaption')?.textContent, desc: PRESET_DESC[document.querySelector('#presets button.active').dataset.preset] }));
    await p.locator('#presetCaption').scrollIntoViewIfNeeded({ timeout: 600000 });
    const box = await p.locator('#presets').boundingBox(), cap = await p.locator('#presetCaption').boundingBox();
    const y0 = Math.min(box.y, cap.y), y1 = Math.max(box.y + box.height, cap.y + cap.height);
    await p.screenshot({ path: `${OUT}/${n.replace(/[^A-Za-z0-9]+/g, '_')}_caption.png`, fullPage: true, clip: { x: 0, y: y0 - 10, width: 1400, height: y1 - y0 + 20 } });
    console.log(n, '|', res.presets[n].caption);
  }
  res.errors = errs;
  require('fs').writeFileSync(`${OUT}/render.json`, JSON.stringify(res, null, 1));
  console.log('errors', errs.length, errs.slice(0, 3)); await b.close();
})();
