// WCAG 2.x contrast for BuggyBoard. Foregrounds are read from the running app with getComputedStyle,
// then composited over their real backdrop. Usage: node contrast.cjs
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const U = require(path.resolve(__dirname, '../../../../users.json')).find((u) => u.username === 'buggy');

const parse = (s) => { const c = s.match(/color\(srgb ([^)]+)\)/); if (c) { const [r, g, b, a = 1] = c[1].split(/[ \/]+/).filter(Boolean).map(Number); return { rgb: [r, g, b].map((v) => Math.round(v * 255)), a }; } const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const [r, g, b, a = 1] = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { rgb: [r, g, b], a }; };
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const L = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => { const [x, y] = [L(a), L(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const over = (fg, a, bg) => fg.map((c, i) => Math.round(c * a + bg[i] * (1 - a)));
const toHex = (rgb) => '#' + rgb.map((c) => c.toString(16).padStart(2, '0')).join('');
const W = hex('#ffffff'), S50 = hex('#fafaf9'), S100 = hex('#f5f5f4');
// Tailwind ring = offset shadow (white) then ring shadow; the ring is the segment with the largest spread.
const ringColor = (shadow) => { const m = [...shadow.matchAll(/(rgba?\([^)]+\))\s+0px 0px 0px (\d+(?:\.\d+)?)px/g)].sort((a, b) => +b[2] - +a[2]); return m.length ? parse(m[0][1]).rgb : null; };

(async () => {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const cs = (sel, pseudo) => p.evaluate(([s, ps]) => { const e = document.querySelector(s); if (!e) return null; const c = getComputedStyle(e, ps || null); return { color: c.color, bg: c.backgroundColor, border: c.borderTopColor, shadow: c.boxShadow, decoration: c.textDecorationColor }; }, [sel, pseudo]);
  const focusRing = async (sel) => { await p.locator(sel).first().focus(); await p.waitForTimeout(80); return ringColor((await cs(':focus')).shadow); };
  await p.goto('http://localhost:5173/login');
  const got = {};
  got.subtitle = await cs('main h2');
  got.loginRing = await focusRing('button[type=submit]');
  got.loginInputRing = await focusRing('#username');
  await p.evaluate(() => document.activeElement.blur());
  got.loginInputBorder = await cs('#username');
  await p.fill('#username', U.username); await p.fill('#password', U.password); await p.click('button[type=submit]');
  await p.waitForSelector('.severity-badge');
  for (const s of ['high', 'mid', 'low']) got[s] = await cs(`.severity-badge-${s}`);
  got.placeholder = await cs('header input', '::placeholder');
  got.searchWrap = await cs('[role=search]');
  got.rowRing = await focusRing('tbody tr button');
  got.newBugRing = await focusRing('header button:not([aria-label])');
  got.toggleSel = await cs('[aria-pressed=true]');
  got.toggleUnsel = await cs('[aria-pressed=false]');
  await p.getByRole('button', { name: 'New Bug', exact: true }).click();
  await p.waitForSelector('#bug-title');
  await p.evaluate(() => document.activeElement.blur());
  got.modalInputBorder = await cs('#bug-title');
  got.cancelRing = await focusRing('[role=dialog] button:has-text("Cancel")');
  got.saveRing = await focusRing('[role=dialog] button[type=submit]');
  got.closeX = await cs('[role=dialog] button[aria-label=Close]');
  await p.keyboard.press('Escape');
  await b.close();

  const rows = [];
  const add = (pair, fg, bg, need, sc) => { const r = ratio(fg, bg); rows.push({ pair, fg: toHex(fg), bg: toHex(bg), ratio: +r.toFixed(2), required: need, sc, pass: r >= need }); };
  for (const s of ['high', 'mid', 'low']) {
    const fg = parse(got[s].color).rgb, t = parse(got[s].bg);
    add(`Severity ${s.toUpperCase()} badge text on its tint (white row)`, fg, over(t.rgb, t.a, W), 4.5, '1.4.3');
    add(`Severity ${s.toUpperCase()} badge text on its tint (hovered row stone-50/80)`, fg, over(t.rgb, t.a, over(S50, 0.8, W)), 4.5, '1.4.3');
  }
  const P = hex('#b8ae76');
  add('Primary #b8ae76 bg with stone-800 text (Login, Save, selected toggle)', parse(got.toggleSel.color).rgb, P, 4.5, '1.4.3');
  add('"Log in" subtitle (now h2) on white', parse(got.subtitle.color).rgb, W, 4.5, '1.4.3');
  add('Search placeholder on stone-50 wrapper', parse(got.placeholder.color).rgb, S50, 4.5, '1.4.3');
  add('Search placeholder on white (focused)', parse(got.placeholder.color).rgb, W, 4.5, '1.4.3');
  add('Error text red-600 on white (login, modal errors)', hex('#dc2626'), W, 4.5, '1.4.3');
  add('Unselected toggle text on white', parse(got.toggleUnsel.color).rgb, W, 4.5, '1.4.3');
  add('Selected toggle underline (stone-800) on primary fill', parse(got.toggleSel.decoration).rgb, P, 3, '1.4.11');
  add('Selected toggle fill (primary) vs white track', P, W, 3, '1.4.11');
  add('Focus ring on Login button vs white offset', got.loginRing, W, 3, '1.4.11 / 2.4.7');
  add('Focus ring on inputs vs white', got.loginInputRing, W, 3, '1.4.11');
  add('Focus ring on row title button vs white row', got.rowRing, W, 3, '1.4.11');
  add('Focus ring on New Bug vs white header', got.newBugRing, W, 3, '1.4.11');
  add('Focus ring on modal Save vs white', got.saveRing, W, 3, '1.4.11');
  add('Focus ring on modal Cancel (ring-stone-400) vs white', got.cancelRing, W, 3, '1.4.11');
  add('Focus ring on toggle vs white track', got.newBugRing, W, 3, '1.4.11');
  add('Login input border vs white', parse(got.loginInputBorder.border).rgb, W, 3, '1.4.11');
  add('Modal input border vs white', parse(got.modalInputBorder.border).rgb, W, 3, '1.4.11');
  add('Search wrapper border vs white header', parse(got.searchWrap.border).rgb, W, 3, '1.4.11');
  add('Modal Close X glyph vs white', parse(got.closeX.color).rgb, W, 3, '1.4.11');
  add('Focus ring on Delete buttons (ring-red-500) vs white', hex('#ef4444'), W, 3, '1.4.11');
  fs.writeFileSync(path.join(__dirname, 'contrast.json'), JSON.stringify({ computedFromApp: got, pairs: rows }, null, 2));
  for (const r of rows) console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.ratio.toFixed(2)}:1 (need ${r.required})  ${r.fg} on ${r.bg}  ${r.pair}`);
})();
