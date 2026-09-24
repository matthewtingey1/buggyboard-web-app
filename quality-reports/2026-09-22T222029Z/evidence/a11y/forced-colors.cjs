const { chromium } = require('@playwright/test');
const path = require('path');
const U = require(path.resolve(__dirname, '../../../../users.json')).find((u) => u.username === 'buggy');
(async () => {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage({ viewport: { width: 1280, height: 400 } });
  await p.emulateMedia({ forcedColors: 'active' });
  await p.goto('http://localhost:5173/login');
  await p.fill('#username', U.username); await p.fill('#password', U.password); await p.click('button[type=submit]');
  await p.waitForSelector('tbody tr[tabindex]');
  for (const state of ['Open', 'Closed']) {
    await p.getByRole('group', { name: 'Filter by bug state' }).getByRole('button', { name: state }).click();
    await p.mouse.move(0, 399);
    await p.evaluate(() => document.activeElement.blur());
    await p.waitForTimeout(200);
    const s = await p.$$eval('[role=group] button', (bs) => bs.map((x) => { const c = getComputedStyle(x); return `${x.innerText}: bg=${c.backgroundColor} color=${c.color} border=${c.borderWidth} outline=${c.outlineStyle}`; }));
    console.log(`selected=${state}`, JSON.stringify(s));
    await p.screenshot({ path: path.join(__dirname, 'chromium/screenshots', `14-forced-colors-selected-${state}.png`), clip: { x: 500, y: 85, width: 280, height: 70 } });
  }
  await b.close();
})();
