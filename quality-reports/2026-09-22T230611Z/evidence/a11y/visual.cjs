// Reflow (320/640), text spacing, forced colors, target size. Usage: BROWSER=chromium|firefox node visual.cjs
const pw = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const ENGINE = process.env.BROWSER || 'chromium';
const OUT = path.join(__dirname, ENGINE, 'screenshots');
fs.mkdirSync(OUT, { recursive: true });
const U = require(path.resolve(__dirname, '../../../../users.json')).find((u) => u.username === 'buggy');
const BASE = 'http://localhost:5173';
const lines = [];
const say = (s) => { lines.push(s); console.log(s); };

async function login(p) {
  await p.goto(`${BASE}/login`);
  await p.fill('#username', U.username); await p.fill('#password', U.password); await p.click('button[type=submit]');
  await p.waitForSelector('tbody tr button');
  await p.waitForTimeout(300);
}
const box = (p, sel) => p.evaluate((s) => [...document.querySelectorAll(s)].map((e) => { const r = e.getBoundingClientRect(); return `${(e.innerText || e.getAttribute('aria-label') || e.tagName).trim().slice(0, 20)}@${Math.round(r.left)}-${Math.round(r.right)}x${Math.round(r.top)}-${Math.round(r.bottom)}`; }), sel);
const overflow = (p) => p.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);

(async () => {
  const b = await pw[ENGINE].launch({ headless: true });
  for (const [w, h] of [[320, 256], [320, 640], [640, 900]]) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.goto(`${BASE}/login`);
    say(`[${w}x${h}] /login scroll/client=${JSON.stringify(await overflow(p))}`);
    await p.screenshot({ path: path.join(OUT, `10-login-${w}x${h}.png`), fullPage: true });
    await login(p);
    say(`[${w}x${h}] /board scroll/client=${JSON.stringify(await overflow(p))}; header controls ${JSON.stringify(await box(p, 'header h1, header input, header button'))}`);
    const tbl = await p.evaluate(() => { const r = document.querySelector('[role=region][aria-label="Bug table"]'); return { scrollW: r.scrollWidth, clientW: r.clientWidth, tabIndex: r.tabIndex, table: Math.round(document.querySelector('table').getBoundingClientRect().width) }; });
    say(`[${w}x${h}] Bug table region ${JSON.stringify(tbl)}`);
    await p.screenshot({ path: path.join(OUT, `10-board-${w}x${h}.png`), fullPage: ENGINE === "chromium" && h > 300 });
    if (w === 320) {
      // can a keyboard user reach and scroll the table region?
      await p.locator('thead button').last().focus();
      const before = await p.evaluate(() => document.querySelector('[role=region]').scrollLeft);
      await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight');
      const after = await p.evaluate(() => document.querySelector('[role=region]').scrollLeft);
      say(`[${w}x${h}] focus on Owner header after focus(): scrollLeft ${before} -> ${after} after 2 x ArrowRight`);
      await p.getByRole('button', { name: 'New Bug', exact: true }).click();
      await p.waitForSelector('[role=dialog]');
      const m = await p.evaluate(() => { const r = document.querySelector('.bug-modal-panel').getBoundingClientRect(); const bd = document.querySelector('.bug-modal-body'); return { left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top), bottom: Math.round(r.bottom), bodyScrollH: bd.scrollHeight, bodyClientH: bd.clientHeight, docScroll: document.documentElement.scrollWidth }; });
      say(`[${w}x${h}] create modal ${JSON.stringify(m)}`);
      await p.locator('[role=dialog] button[type=submit]').focus();
      const saveVisible = await p.evaluate(() => { const r = document.activeElement.getBoundingClientRect(); return r.bottom <= innerHeight && r.top >= 0; });
      say(`[${w}x${h}] create modal Save in viewport after focus: ${saveVisible}`);
      await p.screenshot({ path: path.join(OUT, `11-create-${w}x${h}.png`) });
      await p.keyboard.press('Escape');
    }
    await p.close();
  }
  if (ENGINE === 'chromium') {
    const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
    await login(p);
    await p.addStyleTag({ content: '*{line-height:1.5!important;letter-spacing:0.12em!important;word-spacing:0.16em!important}p,li{margin-bottom:2em!important}' });
    await p.waitForTimeout(200);
    const clipped = await p.evaluate(() => [...document.querySelectorAll('button, .severity-badge, th, td, h1, label, input')].filter((e) => e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflow !== 'visible').map((e) => (e.innerText || e.placeholder || '').trim().slice(0, 30)));
    say(`[1280] 1.4.12 text spacing: clipped=${JSON.stringify(clipped)}`);
    await p.screenshot({ path: path.join(OUT, '12-text-spacing.png') });
    await p.close();

    const f = await b.newPage({ viewport: { width: 1280, height: 500 } });
    await f.emulateMedia({ forcedColors: 'active' });
    await login(f);
    for (const state of ['Open', 'Closed']) {
      await f.getByRole('group', { name: 'Filter by bug state' }).getByRole('button', { name: state }).click();
      await f.mouse.move(0, 499);
      await f.evaluate(() => document.activeElement.blur());
      await f.waitForTimeout(200);
      const s = await f.$$eval('[role=group] button', (bs) => bs.map((x) => { const c = getComputedStyle(x); return `${x.innerText}: pressed=${x.getAttribute('aria-pressed')} bg=${c.backgroundColor} text-decoration=${c.textDecorationLine} ${c.textDecorationColor}`; }));
      say(`[forced-colors] selected=${state} ${JSON.stringify(s)}`);
      await f.screenshot({ path: path.join(OUT, `14-forced-colors-selected-${state}.png`), clip: { x: 480, y: 80, width: 320, height: 80 } });
    }
    await f.getByRole('group', { name: 'Filter by bug state' }).getByRole('button', { name: 'Open' }).click();
    await f.screenshot({ path: path.join(OUT, '14b-forced-colors-board.png') });
    const badges = await f.$$eval('.severity-badge', (bs) => [...new Set(bs.map((x) => { const c = getComputedStyle(x); return `${x.innerText}: color=${c.color} bg=${c.backgroundColor}`; }))]);
    say(`[forced-colors] severity badges ${JSON.stringify(badges)}`);
    await f.locator('tbody tr button').first().focus();
    say(`[forced-colors] focused row button outline=${await f.evaluate(() => { const c = getComputedStyle(document.activeElement); return `${c.outlineStyle} ${c.outlineWidth} ${c.outlineColor} shadow=${c.boxShadow.slice(0, 60)}`; })}`);
    await f.screenshot({ path: path.join(OUT, '14c-forced-colors-focus-row.png'), clip: { x: 0, y: 150, width: 1280, height: 200 } });
    await f.close();

    const t = await b.newPage({ viewport: { width: 1280, height: 900 } });
    await login(t);
    await t.fill('input[aria-label="Search bugs by title"]', 'x');
    const targets = await t.evaluate(() => [...document.querySelectorAll('button')].filter((e) => e.offsetParent).map((e) => { const r = e.getBoundingClientRect(); return { n: (e.getAttribute('aria-label') || e.innerText).trim().slice(0, 25), w: Math.round(r.width), h: Math.round(r.height) }; }).filter((x) => x.w < 24 || x.h < 24));
    say(`[target-size] board buttons under 24px: ${JSON.stringify(targets.slice(0, 8))} (total ${targets.length})`);
    const clear = await t.locator('button[aria-label="Clear search"]').boundingBox();
    say(`[target-size] Clear search ${Math.round(clear.width)}x${Math.round(clear.height)}`);
    await t.fill('input[aria-label="Search bugs by title"]', '');
    await t.getByRole('button', { name: 'New Bug', exact: true }).click();
    const x = await t.locator('[role=dialog] button[aria-label=Close]').boundingBox();
    say(`[target-size] modal Close ${Math.round(x.width)}x${Math.round(x.height)}`);
    await t.close();
  }
  fs.writeFileSync(path.join(__dirname, ENGINE, 'visual.log'), lines.join('\n') + '\n');
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
