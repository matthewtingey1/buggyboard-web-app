// 320 px: what part of the table is outside the scroll region, and does keyboard focus bring it into view?
const pw = require('@playwright/test');
const path = require('path');
const ENGINE = process.env.BROWSER || 'chromium';
const U = require(path.resolve(__dirname, '../../../../users.json')).find((u) => u.username === 'buggy');
(async () => {
  const b = await pw[ENGINE].launch({ headless: true });
  const p = await b.newPage({ viewport: { width: 320, height: 640 } });
  await p.goto('http://localhost:5173/login');
  await p.fill('#username', U.username); await p.fill('#password', U.password); await p.click('button[type=submit]');
  await p.waitForSelector('tbody tr button');
  await p.screenshot({ path: path.join(__dirname, ENGINE, 'screenshots', '10a-board-320-viewport.png') });
  const info = await p.evaluate(() => {
    const reg = document.querySelector('[role=region]'); const rr = reg.getBoundingClientRect();
    const cols = [...document.querySelectorAll('thead th')].map((th) => { const r = th.getBoundingClientRect(); return `${th.innerText.trim()}@${Math.round(r.left)}-${Math.round(r.right)}`; });
    return { region: `${Math.round(rr.left)}-${Math.round(rr.right)}`, cols, regionFocusable: reg.tabIndex, name: reg.getAttribute('aria-label') };
  });
  console.log(ENGINE, JSON.stringify(info));
  // Tab order from Owner header: does the region itself take a Tab stop?
  await p.locator('thead button').last().focus();
  await p.keyboard.press('Shift+Tab'); await p.keyboard.press('Tab');
  console.log(ENGINE, 'scrollLeft after focusing Owner header via Tab:', await p.evaluate(() => document.querySelector('[role=region]').scrollLeft));
  await p.keyboard.press('Tab');
  console.log(ENGINE, 'next Tab stop:', await p.evaluate(() => `${document.activeElement.tagName} ${document.activeElement.getAttribute('role') || ''} ${(document.activeElement.innerText || '').slice(0, 30)}`), 'scrollLeft', await p.evaluate(() => document.querySelector('[role=region]').scrollLeft));
  await p.locator('thead').scrollIntoViewIfNeeded();
  await p.screenshot({ path: path.join(__dirname, ENGINE, 'screenshots', '10b-table-320-after-tab.png') });
  await b.close();
})();
