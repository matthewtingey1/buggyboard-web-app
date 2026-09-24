// Headless keyboard-only walk of BuggyBoard. Run: node keyboard-walk.cjs
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:5173';
const OUT = __dirname;
const SNAP = path.join(OUT, 'aria');
const SHOT = path.join(OUT, 'screenshots');
fs.mkdirSync(SNAP, { recursive: true });
fs.mkdirSync(SHOT, { recursive: true });

const log = [];
const TITLE = `[a11y] keyboard walk ${Date.now()}`;

async function focusDesc(page) {
  return page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return 'BODY (focus lost)';
    const role = el.getAttribute('role') || el.tagName.toLowerCase();
    const name = el.getAttribute('aria-label') || (el.id ? el.id : '') || '';
    const text = (el.innerText || el.value || '').replace(/\s+/g, ' ').trim().slice(0, 50);
    const dlg = el.closest('[role=dialog]');
    const dlgName = dlg ? (document.getElementById(dlg.getAttribute('aria-labelledby'))?.textContent || '?') : null;
    const pressed = el.getAttribute('aria-pressed');
    return `${role}${name ? ` [${name}]` : ''}${text ? ` "${text}"` : ''}${pressed !== null ? ` aria-pressed=${pressed}` : ''}${dlgName ? ` (in dialog "${dlgName}")` : ' (outside any dialog)'}`;
  });
}

async function step(page, label, action) {
  if (action) await action();
  await page.waitForTimeout(150);
  const f = await focusDesc(page);
  log.push(`${label} -> ${f}`);
  return f;
}

async function tabUntil(page, predicate, max = 30, key = 'Tab') {
  for (let i = 0; i < max; i++) {
    await page.keyboard.press(key);
    await page.waitForTimeout(60);
    const f = await focusDesc(page);
    log.push(`  ${key} -> ${f}`);
    if (predicate(f)) return f;
  }
  throw new Error('tabUntil: target not reached');
}

async function snap(page, name) {
  const s = await page.locator('body').ariaSnapshot();
  fs.writeFileSync(path.join(SNAP, `${name}.yml`), s);
  await page.screenshot({ path: path.join(SHOT, `${name}.png`), fullPage: true });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  log.push('== LOGIN ==');
  await page.goto(`${BASE}/login`);
  await snap(page, '01-login');
  await step(page, 'Initial focus on /login');
  await tabUntil(page, (f) => f.includes('username'));
  await page.keyboard.type('buggy');
  await tabUntil(page, (f) => f.includes('password'));
  await page.keyboard.type('wrong');
  await step(page, 'Enter with wrong password', () => page.keyboard.press('Enter'));
  await page.waitForSelector('[role=alert]');
  await snap(page, '02-login-error');
  log.push(`  password aria-invalid=${await page.locator('#password').getAttribute('aria-invalid')} aria-describedby=${await page.locator('#password').getAttribute('aria-describedby')}`);
  await page.locator('#password').fill('');
  await page.keyboard.type('1970beetle');
  await step(page, 'Enter with correct password', () => page.keyboard.press('Enter'));
  await page.waitForURL('**/board');
  await page.waitForSelector('tbody tr[role=button]');
  log.push(`  document.title on /board = "${await page.title()}"`);

  log.push('== BOARD ==');
  await step(page, 'Initial focus on /board');
  await snap(page, '03-board');
  const tabOrder = [];
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    tabOrder.push(await focusDesc(page));
  }
  log.push('  First 12 Tab stops on board:');
  tabOrder.forEach((t, i) => log.push(`    ${i + 1}. ${t}`));
  await page.screenshot({ path: path.join(SHOT, '04-board-row-focused.png') });
  const rowOutline = await page.evaluate(() => {
    const el = document.activeElement;
    const cs = getComputedStyle(el);
    return { tag: el.tagName, outlineStyle: cs.outlineStyle, outlineWidth: cs.outlineWidth, outlineColor: cs.outlineColor, boxShadow: cs.boxShadow, matchesFocusVisible: el.matches(':focus-visible') };
  });
  log.push(`  Focused element computed focus style: ${JSON.stringify(rowOutline)}`);

  log.push('== CREATE BUG ==');
  await page.locator('body').focus();
  await page.evaluate(() => document.activeElement.blur());
  await page.keyboard.press('Tab');
  await tabUntil(page, (f) => f.includes('"New Bug"'), 10);
  await step(page, 'Enter on New Bug', () => page.keyboard.press('Enter'));
  await page.waitForSelector('[role=dialog]');
  await snap(page, '05-create-modal');
  log.push('  Trap test: 10 x Tab inside Create bug');
  let escaped = false;
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Tab');
    const f = await focusDesc(page);
    log.push(`    Tab ${i + 1}: ${f}`);
    if (f.includes('outside any dialog') || f.startsWith('BODY')) escaped = true;
  }
  log.push(`  Focus escaped Create dialog: ${escaped}`);
  await page.screenshot({ path: path.join(SHOT, '06-create-modal-focus-escaped.png') });
  await step(page, 'Escape closes Create bug (focus had escaped)', () => page.keyboard.press('Escape'));
  await page.getByRole('button', { name: 'New Bug' }).focus();
  await page.keyboard.press('Enter');
  await page.waitForSelector('[role=dialog]');
  await step(page, 'Escape immediately after opening Create bug from New Bug', () => page.keyboard.press('Escape'));
  // Re-open from New Bug by keyboard and save
  await page.getByRole('button', { name: 'New Bug' }).focus();
  await step(page, 'Enter on New Bug (2nd)', () => page.keyboard.press('Enter'));
  await page.keyboard.press('Enter');
  await page.waitForSelector('[role=alert]');
  await snap(page, '07-create-validation');
  log.push(`  After empty submit: title aria-invalid=${await page.locator('#bug-title').getAttribute('aria-invalid')}; focus -> ${await focusDesc(page)}`);
  await page.keyboard.type(TITLE);
  await page.keyboard.press('Tab');
  await page.keyboard.press('ArrowDown'); // severity mid -> low
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.type('Created by a11y keyboard walk');
  await tabUntil(page, (f) => f.includes('"Save"'), 5);
  await step(page, 'Enter on Save (create)', () => page.keyboard.press('Enter'));
  await page.waitForSelector('[role=dialog]', { state: 'detached' });
  await step(page, 'After create modal closed');

  log.push('== SEARCH ==');
  await page.getByRole('search').focus().catch(() => {});
  await page.locator('input[aria-label="Search bugs by title"]').focus();
  await step(page, 'Focus search field');
  await page.keyboard.type(TITLE);
  await page.waitForTimeout(200);
  await snap(page, '08-board-search');
  await step(page, 'Tab to Clear search', () => page.keyboard.press('Tab'));
  await step(page, 'Enter on Clear search', () => page.keyboard.press('Enter'));
  await step(page, 'Tab after clear', () => page.keyboard.press('Tab'));

  log.push('== OPEN ROW ==');
  await page.locator('input[aria-label="Search bugs by title"]').fill(TITLE);
  await page.waitForTimeout(200);
  await page.locator('input[aria-label="Search bugs by title"]').focus();
  await tabUntil(page, (f) => f.startsWith('button') && f.includes(TITLE.slice(0, 20)), 20);
  await step(page, 'Enter on row', () => page.keyboard.press('Enter'));
  await page.waitForSelector('[role=dialog]');
  await page.waitForTimeout(200);
  await step(page, 'Focus after edit opened');
  await snap(page, '09-edit-modal');
  escaped = false;
  log.push('  Trap test: 12 x Tab inside Edit bug');
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    const f = await focusDesc(page);
    log.push(`    Tab ${i + 1}: ${f}`);
    if (f.includes('outside any dialog') || f.startsWith('BODY')) escaped = true;
  }
  log.push(`  Focus escaped Edit dialog: ${escaped}`);
  await page.locator('#edit-bug-title').focus();
  await page.keyboard.press('End');
  await page.keyboard.type(' edited');
  await tabUntil(page, (f) => f.includes('"Save"'), 10);
  await step(page, 'Enter on Save (edit)', () => page.keyboard.press('Enter'));
  await page.waitForSelector('[role=dialog]', { state: 'detached' });
  await step(page, 'After edit modal closed (should return to row)');

  log.push('== DELETE ==');
  await page.locator('input[aria-label="Search bugs by title"]').focus();
  await tabUntil(page, (f) => f.startsWith('button') && f.includes(TITLE.slice(0, 20)), 20);
  await page.keyboard.press('Enter');
  await page.waitForSelector('[role=dialog]');
  await page.waitForTimeout(200);
  await page.getByRole('button', { name: 'Delete' }).focus();
  await step(page, 'Enter on Delete', () => page.keyboard.press('Enter'));
  await page.waitForSelector('[aria-labelledby=confirm-delete-title]');
  await snap(page, '10-confirm-delete');
  log.push('  Tab from Delete trigger while confirm dialog is open:');
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press('Tab');
    log.push(`    Tab ${i + 1}: ${await focusDesc(page)}`);
  }
  await step(page, 'Escape on confirm', () => page.keyboard.press('Escape'));
  await page.getByRole('button', { name: 'Delete' }).focus();
  await page.keyboard.press('Enter');
  await page.waitForSelector('[aria-labelledby=confirm-delete-title]');
  await tabUntil(page, (f) => f.includes('"Delete"') && f.includes('Delete bug'), 20);
  await step(page, 'Enter on confirm Delete', () => page.keyboard.press('Enter'));
  await page.waitForSelector('[role=dialog]', { state: 'detached' });
  await step(page, 'After delete');
  const stillThere = await page.locator('tbody tr', { hasText: TITLE }).count();
  log.push(`  Created bug rows remaining: ${stillThere}`);

  log.push('== OPEN/CLOSED TOGGLE ==');
  await page.locator('input[aria-label="Search bugs by title"]').fill('');
  const openBtn = page.getByRole('group', { name: 'Filter by bug state' }).getByRole('button', { name: 'Open' });
  const closedBtn = page.getByRole('group', { name: 'Filter by bug state' }).getByRole('button', { name: 'Closed' });
  await openBtn.focus();
  await step(page, 'Tab to Closed', () => page.keyboard.press('Tab'));
  await step(page, 'Space on Closed', () => page.keyboard.press('Space'));
  log.push(`  Open aria-pressed=${await openBtn.getAttribute('aria-pressed')} aria-current=${await openBtn.getAttribute('aria-current')}; Closed aria-pressed=${await closedBtn.getAttribute('aria-pressed')}`);
  await snap(page, '11-board-closed');
  await openBtn.focus();
  await page.keyboard.press('Enter');

  log.push('== SORT HEADERS ==');
  const titleHdrBtn = page.getByRole('columnheader', { name: /Title/ }).getByRole('button');
  await titleHdrBtn.focus();
  await step(page, 'Enter on Title header', () => page.keyboard.press('Enter'));
  const sorts = await page.$$eval('thead th', (ths) => ths.map((t) => `${t.innerText.trim()}: aria-sort=${t.getAttribute('aria-sort')}`));
  log.push(`  ${sorts.join(' | ')}`);
  const hdrName = await titleHdrBtn.evaluate((b) => b.textContent);
  log.push(`  Title header button text content: ${JSON.stringify(hdrName)} (arrow span is aria-hidden)`);
  await page.getByRole('table').ariaSnapshot().then((s) => fs.writeFileSync(path.join(SNAP, '12-table-after-sort.yml'), s));

  log.push('== TARGET SIZES (2.5.8, min 24x24) ==');
  const sizes = await page.evaluate(() => {
    const q = (sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return `${Math.round(r.width)}x${Math.round(r.height)}`; };
    return { clearSearch: q('button[aria-label="Clear search"]') };
  });
  await page.getByRole('button', { name: 'New Bug' }).click();
  const closeSize = await page.locator('[role=dialog] button[aria-label=Close]').boundingBox();
  log.push(`  Clear search: ${sizes.clearSearch}; modal Close X: ${Math.round(closeSize.width)}x${Math.round(closeSize.height)}`);
  await page.keyboard.press('Escape');

  log.push('== LOGOUT ==');
  await page.getByRole('button', { name: 'Logout' }).focus();
  await step(page, 'Enter on Logout', () => page.keyboard.press('Enter'));
  await page.waitForURL('**/login');
  log.push(`  URL after logout: ${page.url()}`);

  log.push('== REFLOW 320 CSS px ==');
  const small = await browser.newPage({ viewport: { width: 320, height: 640 } });
  await small.goto(`${BASE}/login`);
  const loginOverflow = await small.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
  await small.screenshot({ path: path.join(SHOT, '13-login-320.png'), fullPage: true });
  log.push(`  /login @320: ${JSON.stringify(loginOverflow)}`);
  await small.fill('#username', 'buggy');
  await small.fill('#password', '1970beetle');
  await small.click('button[type=submit]');
  await small.waitForSelector('tbody tr[role=button]');
  const boardOverflow = await small.evaluate(() => {
    const r = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { left: Math.round(b.left), right: Math.round(b.right) }; };
    return { scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth, newBug: r('header button:nth-of-type(1)'), logout: [...document.querySelectorAll('header button')].map((b) => ({ t: b.innerText.trim() || b.getAttribute('aria-label'), ...(() => { const x = b.getBoundingClientRect(); return { left: Math.round(x.left), right: Math.round(x.right) }; })() })), h1: r('header h1'), table: r('table') };
  });
  await small.screenshot({ path: path.join(SHOT, '14-board-320.png'), fullPage: true });
  log.push(`  /board @320: ${JSON.stringify(boardOverflow)}`);
  await small.getByRole('button', { name: 'New Bug' }).click().catch((e) => log.push(`  New Bug click at 320 failed: ${e.message.split('\n')[0]}`));
  await small.waitForTimeout(200);
  await small.screenshot({ path: path.join(SHOT, '15-create-modal-320.png'), fullPage: true });

  fs.writeFileSync(path.join(OUT, 'keyboard-path.log'), log.join('\n') + '\n');
  console.log(log.join('\n'));
  await browser.close();
})().catch(async (e) => {
  fs.writeFileSync(path.join(OUT, 'keyboard-path.log'), log.join('\n') + '\nERROR: ' + e.stack + '\n');
  console.error(log.join('\n'));
  console.error(e);
  process.exit(1);
});
