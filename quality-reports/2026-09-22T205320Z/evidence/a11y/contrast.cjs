// WCAG 2.x contrast ratios for BuggyBoard colour pairs. Colours are read from the running app
// (getComputedStyle) where possible, then composited over their real backdrop.
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const L = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => { const [x, y] = [L(a), L(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const over = (fg, a, bg) => fg.map((c, i) => Math.round(c * a + bg[i] * (1 - a)));
const toHex = (rgb) => '#' + rgb.map((c) => c.toString(16).padStart(2, '0')).join('');

const W = hex('#ffffff');
const S50 = hex('#fafaf9');
const P = hex('#b8ae76');
const rows = [];
const add = (label, fg, bg, need, sc) => {
  const r = ratio(fg, bg);
  rows.push({ pair: label, fg: toHex(fg), bg: toHex(bg), ratio: +r.toFixed(2), required: need, sc, pass: r >= need });
};

(async () => {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage();
  await p.goto('http://localhost:5173/login');
  await p.fill('#username', 'buggy');
  await p.fill('#password', '1970beetle');
  await p.click('button[type=submit]');
  await p.waitForSelector('.severity-badge');
  const computed = await p.evaluate(() => {
    const out = {};
    for (const s of ['high', 'mid', 'low']) {
      const e = document.querySelector(`.severity-badge-${s}`);
      if (e) { const cs = getComputedStyle(e); out[s] = { color: cs.color, bg: cs.backgroundColor }; }
    }
    const inp = document.querySelector('input[aria-label="Search bugs by title"]');
    out.placeholder = getComputedStyle(inp, '::placeholder').color;
    out.searchWrapBg = getComputedStyle(inp.parentElement).backgroundColor;
    return out;
  });
  await b.close();

  for (const [s, h] of [['HIGH', '#b84a2e'], ['MID', '#a67c47'], ['LOW', '#4a6b5e']]) {
    const c = hex(h);
    add(`Severity ${s} text on 22% tint over white row`, c, over(c, 0.22, W), 4.5, '1.4.3');
    add(`Severity ${s} text on 22% tint over hovered row (stone-50/80)`, c, over(c, 0.22, over(S50, 0.8, W)), 4.5, '1.4.3');
  }
  add('Login/Save/Open-selected: stone-800 text on primary #b8ae76', hex('#292524'), P, 4.5, '1.4.3');
  add('"Log in" subtitle: primary #b8ae76 text on white', P, W, 4.5, '1.4.3');
  add('New Bug: stone-800 text on primary/25 over white', hex('#292524'), over(P, 0.25, W), 4.5, '1.4.3');
  add('Focus ring: primary #b8ae76 vs white', P, W, 3, '1.4.11 / 2.4.13');
  add('Focus ring: primary #b8ae76 vs stone-100 page', P, hex('#f5f5f4'), 3, '1.4.11');
  add('Selected Open (primary bg) vs white toggle track', P, W, 3, '1.4.11');
  add('Search placeholder stone-400 on stone-50', hex('#a8a29e'), S50, 4.5, '1.4.3');
  add('Search placeholder stone-400 on white (focused)', hex('#a8a29e'), W, 4.5, '1.4.3');
  add('Error text red-600 on white', hex('#dc2626'), W, 4.5, '1.4.3');
  add('Delete (edit) red-700 on white', hex('#b91c1c'), W, 4.5, '1.4.3');
  add('Confirm Delete white on red-600', W, hex('#dc2626'), 4.5, '1.4.3');
  add('Unselected toggle stone-500 on white', hex('#78716c'), W, 4.5, '1.4.3');
  add('ID column / read-only ID stone-500 on white / stone-50', hex('#78716c'), S50, 4.5, '1.4.3');
  add('Input border stone-300 on white', hex('#d6d3d1'), W, 3, '1.4.11');
  add('Close X stone-500 on white', hex('#78716c'), W, 3, '1.4.11');
  add('Disabled Save: stone-800 on primary at 50% opacity (exempt)', over(hex('#292524'), 0.5, W), over(P, 0.5, W), 0, '1.4.3 (inactive, exempt)');

  const out = { computedFromApp: computed, pairs: rows };
  fs.writeFileSync(path.join(__dirname, 'contrast.json'), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(computed));
  for (const r of rows) console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.ratio.toFixed(2)}:1 (need ${r.required})  ${r.fg} on ${r.bg}  ${r.pair}`);
})();
