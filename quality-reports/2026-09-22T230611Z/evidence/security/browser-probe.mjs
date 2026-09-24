// Headless probe: XSS payloads (script/svg/SQL), logout replay, cross-tab logout, forged session.
import { chromium } from '@playwright/test';
const OUT = new URL('.', import.meta.url).pathname;
const BASE = 'http://localhost:5173';
const out = {};
const tag = Math.random().toString(36).slice(2, 8);
const payloads = {
  title: `[security] <script>window.__xss='title'</script><svg onload="window.__xss='svg-title'"> ' OR 1=1;-- ${tag}`,
  owner: `<svg/onload="window.__xss='owner'"><script>window.__xss='owner-s'</script>'); DROP TABLE bugs;--`,
  description: `<img src=x onerror="window.__xss='desc'"><iframe src="javascript:window.top.__xss='iframe'"></iframe>" OR ""="`,
};
const created = await (await fetch(`${BASE}/api/bugs`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ...payloads, severity: 'low' }) })).json();
out.created = created;
out.storedVerbatim = created.title === payloads.title && created.owner === payloads.owner && created.description === payloads.description;

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext();
const page = await ctx.newPage();
const dialogs = []; page.on('dialog', (d) => { dialogs.push(d.message()); d.dismiss(); });
await page.goto(`${BASE}/login`);
await page.getByLabel('Username').fill('buggy');
await page.getByLabel('Password').fill('1970beetle');
await page.getByRole('button', { name: 'Login' }).click();
await page.waitForURL(/\/board$/);
const row = page.getByRole('table', { name: 'Bugs' }).getByRole('row').filter({ hasText: tag });
await row.waitFor();
await page.waitForTimeout(1500);
out.boardRowText = await row.innerText();
out.boardScriptOrSvgElementsInRow = await row.evaluate((r) => r.querySelectorAll('script,svg,img,iframe').length);
out.xssAfterBoard = await page.evaluate(() => window.__xss ?? null);
await page.screenshot({ path: `${OUT}xss-board.png`, fullPage: false });
await row.click();
await page.waitForTimeout(1500);
const dlg = page.getByRole('dialog');
out.modalValues = await dlg.locator('input, textarea').evaluateAll((els) => els.map((e) => e.value));
out.xssAfterModal = await page.evaluate(() => window.__xss ?? null);
await page.screenshot({ path: `${OUT}xss-edit-modal.png` });
await page.keyboard.press('Escape');

// security-03: logout replay
const cookies = await ctx.cookies();
out.cookiesAfterLogin = cookies.length;
const saved = await page.evaluate(() => localStorage.getItem('buggyboard_user'));
out.savedSession = saved;
const reqs = []; page.on('request', (r) => { if (r.url().includes('/api/')) reqs.push(`${r.method()} ${new URL(r.url()).pathname}`); });
await page.goto(`${BASE}/board`);
await page.getByRole('button', { name: 'Logout', exact: true }).click();
await page.waitForURL(/\/login$/);
out.apiCallsDuringLogout = reqs.filter((r) => !r.startsWith('GET /api/bugs'));
out.fetchBugsAfterLogout = await page.evaluate(async () => (await fetch('/api/bugs')).status);
await page.evaluate((v) => localStorage.setItem('buggyboard_user', v), saved);
await page.goto(`${BASE}/board`);
await page.waitForTimeout(1000);
out.replayUrl = new URL(page.url()).pathname;
out.replayRows = await page.getByRole('table', { name: 'Bugs' }).getByRole('row').count();
await page.screenshot({ path: `${OUT}logout-replay-board.png` });

// Cross-tab logout (claimed fix): tab B follows tab A's logout via the storage event.
const tabB = await ctx.newPage();
await tabB.goto(`${BASE}/board`);
await tabB.getByRole('table', { name: 'Bugs' }).waitFor();
await page.getByRole('button', { name: 'Logout', exact: true }).click();
await tabB.waitForTimeout(1500);
out.tabBUrlAfterLogoutInA = new URL(tabB.url()).pathname;
// And the reverse: a forged value written in one tab logs the other tab in as that name.
await tabB.evaluate(() => localStorage.setItem('buggyboard_user', JSON.stringify({ username: 'no-such-user' })));
await page.goto(`${BASE}/board`);
await page.waitForTimeout(1000);
out.forgedUrl = new URL(page.url()).pathname;
out.forgedHeaderText = (await page.locator('header').innerText()).replace(/\s+/g, ' ');
await page.screenshot({ path: `${OUT}forged-session-board.png` });
out.dialogs = dialogs;
await browser.close();
const del = await fetch(`${BASE}/api/bugs/${created.id}`, { method: 'DELETE' });
out.cleanupDelete = del.status;
console.log(JSON.stringify(out, null, 2));
