// Headless keyboard-only walk. Usage: BROWSER=chromium|firefox node walk.cjs
// Credentials are read from users.json at runtime; none are stored here.
const pw = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const ENGINE = process.env.BROWSER || 'chromium';
const BASE = 'http://localhost:5173';
const OUT = path.join(__dirname, ENGINE);
const users = require(path.resolve(__dirname, '../../../../users.json'));
const USER = users.find((u) => u.username === 'buggy');
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
  return `${role}${name ? ` [${name}]` : ''}${text ? ` "${text}"` : ''}${dn ? ` (in dialog "${dn}")` : ' (outside any dialog)'}`;
});
const step = async (page, label, action) => { if (action) await action(); await page.waitForTimeout(200); const f = await focusDesc(page); say(`${label} -> ${f}`); return f; };
const tabUntil = async (page, pred, max = 30, key = 'Tab') => {
  for (let i = 0; i < max; i++) { await page.keyboard.press(key); await page.waitForTimeout(60); const f = await focusDesc(page); say(`  ${key} -> ${f}`); if (pred(f)) return f; }
  throw new Error(`tabUntil: target not reached (${ENGINE})`);
};
const snap = async (page, name) => {
  fs.writeFileSync(path.join(OUT, 'aria', `${name}.yml`), await page.locator('body').ariaSnapshot());
  await page.screenshot({ path: path.join(OUT, 'screenshots', `${name}.png`), fullPage: true });
};
const liveRegions = (page) => page.evaluate(() => [...document.querySelectorAll('[aria-live],[role=status],[role=alert],[role=log]')].map((e) => `${e.tagName.toLowerCase()} role=${e.getAttribute('role')} aria-live=${e.getAttribute('aria-live')} text="${e.textContent.trim().slice(0, 60)}"`));
const search = (page) => page.locator('input[aria-label="Search bugs by title"]');

(async () => {
  const browser = await pw[ENGINE].launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  say(`== ${ENGINE} LOGIN ==`);
  await page.goto(`${BASE}/login`);
  await snap(page, '01-login');
  await step(page, 'Initial focus on /login');
  await tabUntil(page, (f) => f.includes('username'));
  await page.keyboard.type(USER.username);
  await tabUntil(page, (f) => f.includes('password'));
  await page.keyboard.type('wrong-on-purpose');
  await step(page, 'Enter with wrong password', () => page.keyboard.press('Enter'));
  await page.waitForSelector('[role=alert]');
  await step(page, 'After login error shown');
  await snap(page, '02-login-error');
  say(`  password aria-invalid=${await page.locator('#password').getAttribute('aria-invalid')} aria-describedby=${await page.locator('#password').getAttribute('aria-describedby')}`);
  await page.locator('#password').focus();
  await page.locator('#password').fill('');
  await page.keyboard.type(USER.password);
  await step(page, 'Enter with correct password', () => page.keyboard.press('Enter'));
  await page.waitForURL('**/board');
  await page.waitForSelector('tbody tr[tabindex]');
  say(`  document.title on /board = "${await page.title()}"`);

  say('== BOARD ==');
  await step(page, 'Initial focus on /board');
  await snap(page, '03-board');
  say(`  live regions on board: ${JSON.stringify(await liveRegions(page))}`);
  await page.evaluate(() => document.activeElement.blur());
  const order = [];
  for (let i = 0; i < 12; i++) { await page.keyboard.press('Tab'); order.push(await focusDesc(page)); }
  say('  First 12 Tab stops:'); order.forEach((t, i) => say(`    ${i + 1}. ${t}`));

  say('== CREATE (a11y-05/06) ==');
  const newBug = page.getByRole('button', { name: 'New Bug', exact: true });
  await newBug.focus();
  await step(page, 'Enter on New Bug', () => page.keyboard.press('Enter'));
  await page.waitForSelector('[role=dialog]');
  await snap(page, '04-create-modal');
  let escaped = false;
  for (let i = 0; i < 10; i++) { await page.keyboard.press('Tab'); const f = await focusDesc(page); say(`    Tab ${i + 1}: ${f}`); if (!f.includes('in dialog')) escaped = true; }
  say(`  Focus escaped Create dialog: ${escaped}; document.hasFocus()=${await page.evaluate(() => document.hasFocus())}`);
  await page.locator('#bug-title').focus();
  for (let i = 0; i < 3; i++) { await page.keyboard.press('Shift+Tab'); say(`    Shift+Tab ${i + 1} from title: ${await focusDesc(page)}`); }
  await page.locator('#bug-title').focus();
  await step(page, 'Escape from Create (focus in title)', () => page.keyboard.press('Escape'));
  await newBug.focus();
  await page.keyboard.press('Enter');
  await page.waitForSelector('[role=dialog]');
  await page.waitForTimeout(150);
  await step(page, 'Close X via keyboard', async () => { await page.locator('[role=dialog] button[aria-label=Close]').focus(); await page.keyboard.press('Enter'); });
  await newBug.focus();
  await page.keyboard.press('Enter');
  await page.waitForSelector('[role=dialog]');
  await page.waitForTimeout(150);
  await page.keyboard.press('Enter');
  await page.waitForSelector('[role=dialog] [role=alert]');
  say(`  empty submit: focus -> ${await focusDesc(page)}; #bug-title aria-invalid=${await page.locator('#bug-title').getAttribute('aria-invalid')} aria-describedby=${await page.locator('#bug-title').getAttribute('aria-describedby')}`);
  await snap(page, '05-create-validation');
  await page.locator('#bug-title').focus();
  await page.keyboard.type(TITLE);
  await page.keyboard.press('Tab');
  const sevBefore = await page.evaluate(() => document.activeElement.value);
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(150);
  const sevAfter = await page.evaluate(() => document.activeElement.value);
  say(`  Severity select keyboard ArrowDown: ${sevBefore} -> ${sevAfter}`);
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(200);
  if (!(await page.locator('[role=dialog]').count())) {
    say(`  Escape pressed on focused <select> after ArrowDown CLOSED the Create dialog; typed title discarded. focus -> ${await focusDesc(page)}`);
    await newBug.focus();
    await page.keyboard.press('Enter');
    await page.waitForSelector('[role=dialog]');
    await page.waitForTimeout(150);
    say(`  reopened: title value="${await page.locator('#bug-title').inputValue()}"`);
    await page.keyboard.type(TITLE);
  }
  await page.locator('#bug-description').focus().catch(() => {});
  if (!(await focusDesc(page)).includes('description')) { await page.locator('[role=dialog] textarea').focus(); }
  await page.keyboard.type('Created by a11y keyboard walk');
  await tabUntil(page, (f) => f.includes('"Save"'), 6);
  const before = await liveRegions(page);
  await step(page, 'Enter on Save (create)', () => page.keyboard.press('Enter'));
  await page.waitForSelector('[role=dialog]', { state: 'detached' });
  await step(page, 'After create modal closed');
  say(`  live regions after save: ${JSON.stringify(await liveRegions(page))} (before: ${before.length})`);

  say('== SEARCH ==');
  await search(page).focus();
  await page.keyboard.type(TITLE);
  await page.waitForTimeout(300);
  say(`  live regions after typing search: ${JSON.stringify(await liveRegions(page))}; rows=${await page.locator('tbody tr[tabindex]').count()}`);
  await step(page, 'Tab to Clear search', () => page.keyboard.press('Tab'));
  await step(page, 'Enter on Clear search', () => page.keyboard.press('Enter'));

  say('== OPEN ROW / EDIT ==');
  await search(page).fill(TITLE);
  await page.waitForTimeout(300);
  await search(page).focus();
  await tabUntil(page, (f) => f.includes(TITLE.slice(0, 18)), 20);
  await step(page, 'Enter on row', () => page.keyboard.press('Enter'));
  await page.waitForSelector('[role=dialog]');
  await step(page, 'Focus after Edit opened');
  await snap(page, '06-edit-modal');
  await step(page, 'Escape from Edit', () => page.keyboard.press('Escape'));
  await search(page).focus();
  await tabUntil(page, (f) => f.includes(TITLE.slice(0, 18)), 20);
  await page.keyboard.press('Space');
  await page.waitForSelector('[role=dialog]');
  await page.waitForTimeout(200);
  say(`  Space on row opened Edit: ${await page.locator('[role=dialog]').count() > 0}`);
  await page.locator('#edit-bug-title').focus();
  await page.keyboard.press('End');
  await page.keyboard.type(' edited');
  await tabUntil(page, (f) => f.includes('"Save"'), 12);
  await step(page, 'Enter on Save (edit)', () => page.keyboard.press('Enter'));
  await page.waitForSelector('[role=dialog]', { state: 'detached' });
  await step(page, 'After edit saved');

  say('== DELETE (a11y-07) ==');
  await search(page).focus();
  await tabUntil(page, (f) => f.includes(TITLE.slice(0, 18)), 20);
  await page.keyboard.press('Enter');
  await page.waitForSelector('[role=dialog]');
  await page.waitForTimeout(200);
  await tabUntil(page, (f) => f.includes('"Delete"'), 15);
  await step(page, 'Enter on Delete', () => page.keyboard.press('Enter'));
  await page.waitForSelector('[aria-labelledby=confirm-delete-title]');
  await snap(page, '07-confirm-delete');
  say(`  dialogs with aria-modal=true now: ${await page.locator('[aria-modal=true]').count()}`);
  for (let i = 0; i < 4; i++) { await page.keyboard.press('Tab'); say(`    Tab ${i + 1}: ${await focusDesc(page)}`); }
  await step(page, 'Escape on confirm', () => page.keyboard.press('Escape'));
  await page.getByRole('dialog', { name: /Edit bug/ }).getByRole('button', { name: 'Delete' }).focus();
  await page.keyboard.press('Enter');
  await page.waitForSelector('[aria-labelledby=confirm-delete-title]');
  await tabUntil(page, (f) => f.includes('"Delete"') && f.includes('Delete bug'), 20);
  await step(page, 'Enter on confirm Delete', () => page.keyboard.press('Enter'));
  await page.waitForSelector('[role=dialog]', { state: 'detached' });
  await step(page, 'After delete');
  say(`  live regions after delete: ${JSON.stringify(await liveRegions(page))}`);
  say(`  own rows remaining: ${await page.locator('tbody tr', { hasText: TITLE }).count()}`);

  say('== TOGGLE / SORT ==');
  await search(page).fill('');
  const grp = page.getByRole('group', { name: 'Filter by bug state' });
  await grp.getByRole('button', { name: 'Open' }).focus();
  await step(page, 'Tab to Closed', () => page.keyboard.press('Tab'));
  await step(page, 'Space on Closed', () => page.keyboard.press('Space'));
  say(`  aria-pressed Open=${await grp.getByRole('button', { name: 'Open' }).getAttribute('aria-pressed')} Closed=${await grp.getByRole('button', { name: 'Closed' }).getAttribute('aria-pressed')}`);
  say(`  live regions after filter: ${JSON.stringify(await liveRegions(page))}`);
  await snap(page, '08-board-closed');
  await grp.getByRole('button', { name: 'Open' }).focus();
  await page.keyboard.press('Enter');
  const th = page.getByRole('columnheader', { name: /Title/ }).getByRole('button');
  await th.focus();
  await step(page, 'Enter on Title header', () => page.keyboard.press('Enter'));
  say(`  ${(await page.$$eval('thead th', (t) => t.map((x) => `${x.innerText.trim()}:aria-sort=${x.getAttribute('aria-sort')}`))).join(' | ')}`);
  await step(page, 'Enter on Title header again', () => page.keyboard.press('Enter'));
  say(`  ${(await page.$$eval('thead th', (t) => t.map((x) => `${x.innerText.trim()}:aria-sort=${x.getAttribute('aria-sort')}`))).join(' | ')}`);
  fs.writeFileSync(path.join(OUT, 'aria', '09-table-thead.yml'), await page.locator('thead').ariaSnapshot());

  say('== LOGOUT ==');
  await page.getByRole('button', { name: 'Logout', exact: true }).focus();
  await step(page, 'Enter on Logout', () => page.keyboard.press('Enter'));
  await page.waitForURL('**/login');
  await step(page, 'Focus on /login after logout');

  if (ENGINE === 'chromium') {
    say('== REFLOW / ZOOM / SPACING / FORCED COLORS ==');
    for (const w of [320, 640]) {
      const p = await browser.newPage({ viewport: { width: w, height: w === 320 ? 640 : 900 } });
      await p.goto(`${BASE}/login`);
      say(`  /login @${w}: ${JSON.stringify(await p.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]))}`);
      await p.fill('#username', USER.username); await p.fill('#password', USER.password); await p.click('button[type=submit]');
      await p.waitForSelector('tbody tr[tabindex]');
      const m = await p.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth, buttons: [...document.querySelectorAll('header button')].map((b) => { const r = b.getBoundingClientRect(); return `${b.innerText.trim() || b.getAttribute('aria-label')}@${Math.round(r.left)}-${Math.round(r.right)}`; }), h1w: Math.round(document.querySelector('header h1').getBoundingClientRect().width) }));
      say(`  /board @${w}: ${JSON.stringify(m)}`);
      await p.screenshot({ path: path.join(OUT, 'screenshots', `10-board-${w}.png`), fullPage: true });
      if (w === 320) {
        await p.getByRole('button', { name: 'New Bug', exact: true }).click();
        await p.waitForSelector('[role=dialog]');
        say(`  create modal @320: ${JSON.stringify(await p.evaluate(() => { const r = document.querySelector('.bug-modal-panel').getBoundingClientRect(); return { left: Math.round(r.left), right: Math.round(r.right), scroll: document.documentElement.scrollWidth }; }))}`);
        await p.screenshot({ path: path.join(OUT, 'screenshots', '11-create-320.png') });
        await p.keyboard.press('Escape');
        await p.addStyleTag({ content: '*{line-height:1.5!important;letter-spacing:0.12em!important;word-spacing:0.16em!important}p,li{margin-bottom:2em!important}' });
        await p.waitForTimeout(200);
      }
      await p.close();
    }
    const ts = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await ts.goto(`${BASE}/login`);
    await ts.fill('#username', USER.username); await ts.fill('#password', USER.password); await ts.click('button[type=submit]');
    await ts.waitForSelector('tbody tr[tabindex]');
    await ts.addStyleTag({ content: '*{line-height:1.5!important;letter-spacing:0.12em!important;word-spacing:0.16em!important}p{margin-bottom:2em!important}' });
    await ts.waitForTimeout(200);
    const clipped = await ts.evaluate(() => [...document.querySelectorAll('button, .severity-badge, th, td, h1, label')].filter((e) => e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflow !== 'visible').map((e) => e.innerText.trim().slice(0, 30)));
    say(`  1.4.12 text-spacing @1280: clipped elements=${JSON.stringify(clipped)}`);
    await ts.screenshot({ path: path.join(OUT, 'screenshots', '12-text-spacing.png') });
    await ts.emulateMedia({ forcedColors: 'active' });
    await ts.getByRole('group', { name: 'Filter by bug state' }).getByRole('button', { name: 'Open' }).focus();
    await ts.keyboard.press('Tab'); await ts.keyboard.press('Shift+Tab');
    const fc = await ts.evaluate(() => { const g = [...document.querySelectorAll('[role=group] button')].map((b) => { const c = getComputedStyle(b); return `${b.innerText}: bg=${c.backgroundColor} border=${c.borderStyle}/${c.borderWidth} outline=${c.outlineStyle}/${c.outlineWidth} shadow=${c.boxShadow.slice(0, 40)}`; }); return g; });
    say(`  forced-colors toggle styles: ${JSON.stringify(fc)}`);
    await ts.screenshot({ path: path.join(OUT, 'screenshots', '13-forced-colors-toggle.png'), clip: { x: 440, y: 60, width: 400, height: 80 } });
    await ts.screenshot({ path: path.join(OUT, 'screenshots', '13b-forced-colors-full.png') });
    await ts.close();
  }

  fs.writeFileSync(path.join(OUT, 'keyboard-path.log'), log.join('\n') + '\n');
  console.log(log.join('\n'));
  await browser.close();
})().catch((e) => {
  fs.writeFileSync(path.join(OUT, 'keyboard-path.log'), log.join('\n') + '\nERROR: ' + e.stack + '\n');
  console.error(log.join('\n')); console.error(e); process.exit(1);
});
