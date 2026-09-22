const { chromium } = require('@playwright/test');
const path = require('path');
const U = require(path.resolve(__dirname, '../../../../users.json')).find((u) => u.username === 'buggy');
(async () => {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto('http://localhost:5173/login');
  await p.fill('#username', U.username); await p.fill('#password', U.password); await p.click('button[type=submit]');
  await p.waitForSelector('tbody tr[tabindex]');
  await p.fill('input[aria-label="Search bugs by title"]', 'x');
  const c = await p.locator('button[aria-label="Clear search"]').boundingBox();
  await p.fill('input[aria-label="Search bugs by title"]', '');
  await p.getByRole('button', { name: 'New Bug', exact: true }).click();
  const x = await p.locator('[role=dialog] button[aria-label=Close]').boundingBox();
  console.log(`clear search ${Math.round(c.width)}x${Math.round(c.height)}; modal Close ${Math.round(x.width)}x${Math.round(x.height)}`);
  await b.close();
})();
