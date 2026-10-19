// Message 229 (3): the gas LCOE readout on a fresh page load; node render_gas.js <output folder> with the page served as for render_presets.js
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }); const p = await b.newPage({ viewport: { width: 1400, height: 1000 } });
 await p.goto('http://127.0.0.1:8137/index.html', { waitUntil: 'load' });
 await p.waitForFunction(() => window.GTZA_READY === true && /GWh|^0$/.test((document.getElementById('bdShed')?.textContent || '').trim()), null, { timeout: 600000, polling: 2000 });
 const info = await p.evaluate(() => { const el = document.getElementById('in_lcoeCcgt'); let row = el; for (let i = 0; i < 4 && row && !row.querySelector('#cv_lcoeCcgt'); i++) row = row.parentElement;
   // open any collapsed details or group that holds the slider
   let a = el; while (a){ if (a.tagName === 'DETAILS') a.open = true; if (a.hidden) a.hidden = false; a = a.parentElement; }
   row.id = row.id || '__gasrow'; return { id: row.id, readout: document.getElementById('cv_lcoeCcgt').textContent, note: (row.textContent || '').slice(0, 300) }; });
 console.log(JSON.stringify(info));
 const loc = p.locator('#' + info.id); await loc.scrollIntoViewIfNeeded(); await loc.screenshot({ path: process.argv[2] + '/gas_lcoe_readout.png' });
 await b.close(); })();
