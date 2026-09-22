import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
const users = JSON.parse(readFileSync(new URL('../../../../users.json', import.meta.url), 'utf8'));
const buggy = users.find((u) => u.username === 'buggy');
const base = 'http://localhost:5173';
const title = `[functional] zw-save probe ${Date.now().toString(36)}`;
const created = await (await fetch(`${base}/api/bugs`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, severity: 'mid', owner: 'buggy', description: 'orig' }) })).json();
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
try {
  await page.goto(`${base}/login`);
  await page.getByLabel('Username').fill(buggy.username);
  await page.getByLabel('Password').fill(buggy.password);
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await page.getByRole('button', { name: title }).click();
  const dialog = page.getByRole('dialog', { name: `Edit bug #${created.id}` });
  await dialog.getByLabel('Description').fill('​');
  const save = dialog.getByRole('button', { name: 'Save' });
  console.log('save enabled:', await save.isEnabled());
  const [resp] = await Promise.all([page.waitForResponse((r) => r.request().method() === 'PUT'), save.click()]);
  console.log('PUT status:', resp.status(), await resp.text());
  console.log('modal alert:', await dialog.getByRole('alert').innerText());
  await page.screenshot({ path: new URL('./zw-save-probe.png', import.meta.url).pathname });
  const stored = await (await fetch(`${base}/api/bugs/${created.id}`)).json();
  console.log('stored description:', JSON.stringify(stored.description));
} finally {
  await browser.close();
  console.log('cleanup:', (await fetch(`${base}/api/bugs/${created.id}`, { method: 'DELETE' })).status);
}
