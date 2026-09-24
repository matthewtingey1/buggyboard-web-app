import { test, expect } from '../pages/fixtures';
import { uid } from '../pages/api';

const COLOR = { HIGH: 'rgb(184, 74, 46)', MID: 'rgb(166, 124, 71)', LOW: 'rgb(74, 107, 94)' } as const;

test('07-S1 table columns ordered ID, Severity, Title, Owner', async ({ signedIn }) => {
  await expect(signedIn.table).toBeVisible();
  expect(await signedIn.headerNames()).toEqual(['ID', 'Severity', 'Title', 'Owner']);
});

test('07-S2 each own bug is shown once with ID, severity, title, owner', async ({ api, loginPage, board }) => {
  const t = uid();
  const bugs = [await api.create(`row-a ${t}`, 'high', { owner: 'vanny' }), await api.create(`row-b ${t}`, 'low')];
  await loginPage.login('buggy', '1970beetle');
  await board.waitLoaded();
  for (const b of bugs) {
    const rows = (await board.rows()).filter((r) => r.id === b.id);
    expect(rows).toEqual([{ id: b.id, severity: b.severity, title: b.title, owner: b.owner }]);
  }
});

test('07-S4 lower-case "high" severity is stored and displayed as HIGH', async ({ api, loginPage, board }) => {
  const bug = await api.create(`caps ${uid()}`, 'high');
  await loginPage.login('buggy', '1970beetle');
  await board.waitLoaded();
  await expect(board.rowFor(bug.title).locator('td').nth(1)).toHaveText('HIGH');
});

test('08-S1/S2/S4 severity badges use the token colours with a tint and bold label', async ({ api, loginPage, board, page }) => {
  const t = uid();
  const bugs = { HIGH: await api.create(`c-h ${t}`, 'high'), MID: await api.create(`c-m ${t}`, 'mid'), LOW: await api.create(`c-l ${t}`, 'low') };
  await loginPage.login('buggy', '1970beetle');
  await board.waitLoaded();
  const tokens = await page.evaluate(() => {
    const cs = getComputedStyle(document.documentElement);
    return ['high', 'mid', 'low'].map((s) => cs.getPropertyValue(`--color-severity-${s}`).trim());
  });
  expect(tokens).toEqual(['#b84a2e', '#a67c47', '#4a6b5e']);
  for (const sev of ['HIGH', 'MID', 'LOW'] as const) {
    const badge = board.rowFor(bugs[sev].title).locator('.severity-badge');
    await expect(badge).toHaveCSS('color', COLOR[sev]);
    const bg = await badge.evaluate((e) => getComputedStyle(e).backgroundColor);
    expect(bg).not.toBe('rgba(0, 0, 0, 0)');
    const weight = Number(await badge.evaluate((e) => getComputedStyle(e).fontWeight));
    expect(weight).toBeGreaterThanOrEqual(600);
  }
});

test('08-S3 severity colours are distinct', async ({ page, signedIn }) => {
  void signedIn;
  const colors = await page.evaluate(() => ['high', 'mid', 'low'].map((s) => getComputedStyle(document.documentElement).getPropertyValue(`--color-severity-${s}`).trim()));
  expect(new Set(colors).size).toBe(3);
});
