// render_groups.js - render check for the slider groups (user, 14 Oct 2026), on a fresh page load with no manual run()
// call: every group starts closed with its "n settings" badge; opening each shows its controls; a setting changed in a
// group shows on that group's badge once it is closed again. Prints JSON and writes two screenshots of the panel.
//   python3 -m http.server 8765 --bind 127.0.0.1   (from the repository root, in another shell)
//   node render_groups.js http://127.0.0.1:8765/index.html <out-prefix>
// Playwright from node_modules or the cloud image's /opt/node-tools; Chromium from PW_CHROMIUM or /opt/pw-browsers.
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); }
const CHROME = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
(async () => {
  const [url, out] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: CHROME });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1800 } });
  const errors = []; page.on('pageerror', e => errors.push(String(e)));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(6000);   // the page's own start-up, including its own first run()
  const groups = () => page.$$eval('#controls details.grp', gs => gs.map(g => ({
    name: g.querySelector('summary h3').textContent, open: g.open,
    badge: g.querySelector('.grpcount').textContent, changed: g.querySelector('.grpcount').classList.contains('changed'),
    ctrls: g.querySelectorAll('.ctrl').length })));
  const atLoad = await groups();
  await page.locator('#controls').screenshot({ path: out + '_load.png' });
  const opened = [];
  for (let i = 0; i < atLoad.length; i++){
    const g = page.locator('#controls details.grp').nth(i);
    if (!(await g.evaluate(e => e.open))) await g.locator(':scope > summary').click();
    const vis = await g.evaluate(e => [...e.querySelectorAll(':scope > .ctrl input, :scope > .ctrl select')].filter(x => x.offsetParent !== null).length);
    const total = await g.evaluate(e => e.querySelectorAll(':scope > .ctrl input, :scope > .ctrl select').length);
    opened.push({ name: atLoad[i].name, visibleControls: vis, directControls: total });
    await g.locator(':scope > summary').click();   // close again
  }
  // Change one setting in the first group through the page's own input path, then close the group.
  const g0 = page.locator('#controls details.grp').nth(0);
  await g0.locator(':scope > summary').click();
  const r = g0.locator(':scope > .ctrl input[type=range]').first();
  const rid = await r.getAttribute('id');
  const before = await r.inputValue();
  await r.evaluate(e => { const step = parseFloat(e.step) || 1; e.value = String(Math.min(parseFloat(e.max), parseFloat(e.value) + 5 * step)); e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); });
  const after = await r.inputValue();
  await g0.locator(':scope > summary').click();
  await page.waitForTimeout(500);
  const afterChange = await groups();
  await page.locator('#controls').screenshot({ path: out + '_changed.png' });
  const ok = atLoad.length === 6 && atLoad.every(g => !g.open && /^\d+ settings?$/.test(g.badge) && +g.badge.split(' ')[0] === g.ctrls)
    && opened.every(o => o.directControls > 0 && o.visibleControls === o.directControls)
    && afterChange[0] && !afterChange[0].open && / 1 changed$/.test(afterChange[0].badge) && afterChange[0].changed
    && afterChange.slice(1).every(g => !g.changed) && !errors.length;
  console.log(JSON.stringify({ ok, atLoad, opened, changedSlider: { id: rid, before, after }, afterChange: afterChange.map(g => ({ name: g.name, open: g.open, badge: g.badge, changed: g.changed })), pageErrors: errors.slice(0, 5) }, null, 1));
  await browser.close();
  process.exit(ok ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
