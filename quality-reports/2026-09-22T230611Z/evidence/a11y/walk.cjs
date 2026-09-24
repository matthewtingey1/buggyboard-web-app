// Headless keyboard-only walk. Usage: BROWSER=chromium|firefox node walk.cjs
// buggy's password is a public spec default; it is read from users.json at runtime, never logged.
const pw = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const ENGINE = process.env.BROWSER || 'chromium';
const BASE = 'http://localhost:5173';
const OUT = path.join(__dirname, ENGINE);
const USER = require(path.resolve(__dirname, '../../../../users.json')).find((u) => u.username === 'buggy');
fs.mkdirSync(path.join(OUT, 'aria'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'screenshots'), { recursive: true });

const log = [];
const TITLE = `[a11y] walk ${ENGINE} ${Date.now()}`;
const say = (s) => log.push(s);

const focusDesc = (page) => page.evaluate(() => {
  const el = document.activeElement;
  if (!el || el === document.body) return 'BODY (focus lost)';
  const role = el.getAttribute('role') || el.tagName.toLowerCase();
  const name = el.getAttribute('aria-label') || el.id || '';
  const text = (el.innerText || el.value || '').replace(/\s+/g, ' ').trim().slice(0, 50);
  const dlg = el.closest('[role=dialog]');
  const dn = dlg ? document.getElementById(dlg.getAttribute('aria-labelledby'))?.textContent : null;
  const cs = getComputedStyle(el);
  const visible = cs.outlineStyle !== 'none' || cs.boxShadow !== 'none';
  return `${role}${name ? ` [${name}]` : ''}${text ? ` "${text}"` : ''}${dn ? ` (in dialog "${dn}")` : ' (outside any dialog)'}${visible ? '' : ' {no visible focus indicator}'}`;
});
const step = async (page, label, action, wait = 250) => { if (action) await action(); await page.waitForTimeout(wait); const f = await focusDesc(page); say(`${label} -> ${f}`); return f; };
const tabUntil = async (page, pred, max = 30, key = 'Tab') => {
  for (let i = 0; i < max; i++) { await page.keyboard.press(key); await page.waitForTimeout(50); const f = await focusDesc(page); say(`  ${key} -> ${f}`); if (pred(f)) return f; }
  throw new Error(`tabUntil: target not reached (${ENGINE})`);
};
const snap = async (page, name) => {
  fs.writeFileSync(path.join(OUT, 'aria', `${name}.yml`), await page.locator('body').ariaSnapshot());
  await page.screenshot({ path: path.join(OUT, 'screenshots', `${name}.png`), fullPage: true });
};
const statusLog = async (page, label) => {
  const s = await page.evaluate(() => { const r = window.__status || []; window.__status = []; return r; });
  say(`  [status changes ${label}] ${JSON.stringify(s)}`);
};
const cycle = async (page, key, n, label) => {
  const seen = [];
  for (let i = 0; i < n; i++) { await page.keyboard.press(key); await page.waitForTimeout(40); seen.push(await focusDesc(page)); }
  const out = seen.filter((f) => !f.includes('in dialog'));
  say(`  ${label}: ${n} x ${key}; left the dialog ${out.length} times${out.length ? ': ' + JSON.stringify(out) : ''}`);
  seen.forEach((f, i) => say(`    ${i + 1}. ${f}`));
};
const search = (page) => page.getByRole('textbox', { name: 'Search bugs by title' });

(async () => {
  const browser = await pw[ENGINE].launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript(() => {
    window.__status = [];
    const hook = () => {
      const el = document.querySelector('[role=status]');
      if (!el || el.__hooked) return;
      el.__hooked = true;
      window.__status.push(`(initial) ${el.textContent}`);
      new MutationObserver(() => window.__status.push(el.textContent)).observe(el, { childList: true, characterData: true, subtree: true });
    };
    new MutationObserver(hook).observe(document, { childList: true, subtree: true });
  });
  const page = await ctx.newPage();

  say(`== ${ENGINE} LOGIN ==`);
  await page.goto(`${BASE}/login`);
  await page.waitForTimeout(300);
  say(`  document.title on /login = "${await page.title()}"`);
  await snap(page, '01-login');
  await step(page, 'Initial focus on /login');
  await page.keyboard.type(`a11y-nouser-${Date.now()}`);
  await tabUntil(page, (f) => f.includes('password'));
  await page.keyboard.type('wrong-on-purpose');
  await step(page, 'Enter with wrong password (throwaway username)', () => page.keyboard.press('Enter'));
  await page.waitForSelector('[role=alert]');
  await step(page, 'After login error shown');
  for (const id of ['username', 'password']) say(`  #${id} aria-invalid=${await page.locator('#' + id).getAttribute('aria-invalid')} aria-describedby=${await page.locator('#' + id).getAttribute('aria-describedby')}`);
  await snap(page, '02-login-error');
  await page.locator('#username').fill('');
  await page.keyboard.type(USER.username);
  await page.keyboard.press('Tab');
  await page.locator('#password').fill('');
  await page.keyboard.type(USER.password);
  await step(page, 'Enter with correct password', () => page.keyboard.press('Enter'));
  await page.waitForURL('**/board');
  await page.waitForSelector('tbody tr button');
  await page.waitForTimeout(400);
  say(`  document.title on /board = "${await page.title()}"`);

  say('== BOARD ==');
  await step(page, 'Initial focus on /board');
  await statusLog(page, 'board load');
  await snap(page, '03-board');
  const order = [];
  for (let i = 0; i < 14; i++) { await page.keyboard.press('Tab'); order.push(await focusDesc(page)); }
  say('  First 14 Tab stops from the focused heading:'); order.forEach((t, i) => say(`    ${i + 1}. ${t}`));

  say('== CREATE ==');
  const newBug = page.getByRole('button', { name: 'New Bug', exact: true });
  await newBug.focus();
  await step(page, 'Enter on New Bug', () => page.keyboard.press('Enter'));
  await snap(page, '04-create-modal');
  await cycle(page, 'Tab', 12, 'Create trap');
  await cycle(page, 'Shift+Tab', 12, 'Create trap reverse');
  await step(page, 'Escape from Create', () => page.keyboard.press('Escape'));
  await page.keyboard.press('Enter');
  await page.waitForSelector('[role=dialog]');
  await page.waitForTimeout(150);
  await step(page, 'Close X via keyboard', async () => { await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Enter'); });
  await page.keyboard.press('Enter');
  await page.waitForSelector('[role=dialog]');
  await page.waitForTimeout(150);
  await page.keyboard.press('Enter');
  await page.waitForSelector('[role=dialog] [role=alert]');
  const inv = await page.evaluate(() => ['bug-title', 'bug-owner', 'bug-description'].map((id) => { const e = document.getElementById(id); return `${id}: invalid=${e.getAttribute('aria-invalid')} describedby=${e.getAttribute('aria-describedby')}`; }));
  say(`  empty submit: focus -> ${await focusDesc(page)}; ${inv.join('; ')}`);
  await snap(page, '05-create-validation');
  await page.locator('#bug-title').focus();
  await page.keyboard.type(TITLE);
  await page.keyboard.press('Tab');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  say(`  ArrowDown+Escape on Severity: dialog still open=${(await page.locator('[role=dialog]').count()) > 0}; title kept=${(await page.locator('#bug-title').inputValue().catch(() => '')) === TITLE}`);
  await page.locator('#bug-description').focus();
  await page.keyboard.type('Created by a11y keyboard walk');
  await tabUntil(page, (f) => f.includes('"Save"'), 6);
  await statusLog(page, 'before create save');
  await step(page, 'Enter on Save (create)', () => page.keyboard.press('Enter'), 800);
  await statusLog(page, 'after create save');

  say('== SEARCH ==');
  await search(page).focus();
  await page.keyboard.type(TITLE);
  await page.waitForTimeout(300);
  await statusLog(page, 'while typing search (one per keystroke)');
  await step(page, 'Tab to Clear search', () => page.keyboard.press('Tab'));
  await step(page, 'Enter on Clear search', () => page.keyboard.press('Enter'));
  await statusLog(page, 'after clear');

  say('== OPEN ROW / EDIT ==');
  await search(page).fill(TITLE);
  await page.waitForTimeout(300);
  await search(page).focus();
  await tabUntil(page, (f) => f.includes(TITLE.slice(0, 18)), 20);
  await step(page, 'Enter on row title button', () => page.keyboard.press('Enter'), 500);
  await snap(page, '06-edit-modal');
  await cycle(page, 'Tab', 12, 'Edit trap');
  await cycle(page, 'Shift+Tab', 12, 'Edit trap reverse');
  await step(page, 'Escape from Edit', () => page.keyboard.press('Escape'));
  await step(page, 'Space on focused row button', () => page.keyboard.press('Space'), 500);
  await page.locator('#edit-bug-title').focus();
  await page.keyboard.press('End');
  await page.keyboard.type(' edited');
  await tabUntil(page, (f) => f.includes('"Save"'), 12);
  await statusLog(page, 'before edit save');
  await step(page, 'Enter on Save (edit)', () => page.keyboard.press('Enter'), 800);
  await statusLog(page, 'after edit save 1');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  await page.locator('#edit-bug-title').focus();
  await page.keyboard.type('!');
  await tabUntil(page, (f) => f.includes('"Save"'), 12);
  await step(page, 'Enter on Save (edit, second time)', () => page.keyboard.press('Enter'), 800);
  await statusLog(page, 'after edit save 2 (same text?)');

  say('== DELETE ==');
  await step(page, 'Enter on row again', () => page.keyboard.press('Enter'), 500);
  await tabUntil(page, (f) => f.includes('"Delete"'), 15);
  await step(page, 'Enter on Delete', () => page.keyboard.press('Enter'));
  await snap(page, '07-confirm-delete');
  say(`  aria-modal=true count: ${await page.locator('[aria-modal=true]').count()}; Edit dialog aria-hidden=${await page.locator('[aria-labelledby=edit-bug-modal-title]').getAttribute('aria-hidden')}`);
  await cycle(page, 'Tab', 6, 'Confirm trap');
  await cycle(page, 'Shift+Tab', 6, 'Confirm trap reverse');
  await step(page, 'Escape on confirm', () => page.keyboard.press('Escape'));
  await step(page, 'Enter on Delete again', () => page.keyboard.press('Enter'));
  await step(page, 'Tab to confirm Delete', () => page.keyboard.press('Tab'));
  await step(page, 'Enter on confirm Delete', () => page.keyboard.press('Enter'), 1000);
  await statusLog(page, 'after delete');
  await page.screenshot({ path: path.join(OUT, 'screenshots', '07b-after-delete.png') });
  say(`  own row remaining: ${await page.locator('tbody tr', { hasText: TITLE }).count()}`);

  say('== CLOSE A BUG FROM EDIT (row leaves the Open view) ==');
  const T2 = `${TITLE} close`;
  await page.evaluate(async (t) => fetch('/api/bugs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: t, severity: 'low', owner: 'buggy', description: 'a11y' }) }), T2);
  await search(page).fill(T2);
  await page.reload();
  await page.waitForSelector('tbody tr button');
  await search(page).fill(T2);
  await page.waitForTimeout(300);
  await page.locator('tbody tr button', { hasText: T2 }).focus();
  await page.keyboard.press('Enter');
  await page.waitForSelector('#edit-bug-state');
  await page.locator('#edit-bug-state').selectOption('closed');
  await page.locator('#edit-bug-state').focus();
  await tabUntil(page, (f) => f.includes('"Save"'), 8);
  await page.evaluate(() => { window.__status = []; });
  await step(page, 'Enter on Save (state -> closed)', () => page.keyboard.press('Enter'), 1000);
  await statusLog(page, 'after closing the bug');

  say('== FAILED SAVE (POST /api/bugs forced to 500) ==');
  await search(page).fill('');
  await page.route('**/api/bugs', (r) => (r.request().method() === 'POST' ? r.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"Injected failure"}' }) : r.continue()));
  await newBug.focus();
  await page.keyboard.press('Enter');
  await page.waitForSelector('#bug-title');
  await page.keyboard.type(`${TITLE} never saved`);
  await page.locator('#bug-description').focus();
  await page.keyboard.type('x');
  await step(page, 'Enter in title with a failing server', async () => { await page.locator('#bug-title').focus(); await page.keyboard.press('Enter'); }, 800);
  await page.keyboard.press('Tab');
  await step(page, '  then Tab once');
  await page.keyboard.press('Escape');
  await page.unroute('**/api/bugs');
  await page.waitForTimeout(300);

  say('== TOGGLE / SORT ==');
  const grp = page.getByRole('group', { name: 'Filter by bug state' });
  await grp.getByRole('button', { name: 'Open' }).focus();
  await page.evaluate(() => { window.__status = []; });
  await step(page, 'Tab to Closed', () => page.keyboard.press('Tab'));
  await step(page, 'Space on Closed', () => page.keyboard.press('Space'));
  say(`  aria-pressed Open=${await grp.getByRole('button', { name: 'Open' }).getAttribute('aria-pressed')} Closed=${await grp.getByRole('button', { name: 'Closed' }).getAttribute('aria-pressed')}`);
  await statusLog(page, 'after Closed filter');
  await snap(page, '08-board-closed');
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(200);
  await statusLog(page, 'after Open filter');
  const th = page.getByRole('columnheader', { name: /Title/ }).getByRole('button');
  await th.focus();
  await step(page, 'Enter on Title header', () => page.keyboard.press('Enter'));
  say(`  ${(await page.$$eval('thead th', (t) => t.map((x) => `${x.innerText.trim()}:aria-sort=${x.getAttribute('aria-sort')}`))).join(' | ')}`);
  await step(page, 'Enter on Title header again', () => page.keyboard.press('Enter'));
  say(`  ${(await page.$$eval('thead th', (t) => t.map((x) => `${x.innerText.trim()}:aria-sort=${x.getAttribute('aria-sort')}`))).join(' | ')}`);
  await statusLog(page, 'after sorting');
  fs.writeFileSync(path.join(OUT, 'aria', '09-table-thead.yml'), await page.locator('thead').ariaSnapshot());

  say('== LOGOUT ==');
  await page.getByRole('button', { name: 'Logout', exact: true }).focus();
  await step(page, 'Enter on Logout', () => page.keyboard.press('Enter'), 500);
  say(`  document.title after logout = "${await page.title()}"`);

  // clean up the closed bug by API (own prefix only)
  const r = await ctx.request.get(`${BASE}/api/bugs`);
  for (const b of await r.json()) if (b.title.startsWith(TITLE)) { await ctx.request.delete(`${BASE}/api/bugs/${b.id}`); say(`  cleanup: deleted own bug #${b.id}`); }

  fs.writeFileSync(path.join(OUT, 'keyboard-path.log'), log.join('\n') + '\n');
  console.log(log.join('\n'));
  await browser.close();
})().catch((e) => {
  fs.writeFileSync(path.join(OUT, 'keyboard-path.log'), log.join('\n') + '\nERROR: ' + e.stack + '\n');
  console.error(log.join('\n')); console.error(e); process.exit(1);
});
