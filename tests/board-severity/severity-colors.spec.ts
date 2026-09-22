import { test, expect, defaultUser, severityColors, uid } from '../fixtures';

test('severity colour tokens match the theme', async ({ loginPage, boardPage }) => {
  await loginPage.login(defaultUser.username, defaultUser.password);

  const tokens = await boardPage.severityTokens();

  expect(tokens).toEqual(['#b84a2e', '#a67c47', '#4a6b5e']);
});

test('the three severity colours are distinct', async ({ loginPage, boardPage }) => {
  await loginPage.login(defaultUser.username, defaultUser.password);

  const tokens = await boardPage.severityTokens();

  expect(new Set(tokens).size).toBe(3);
});

for (const severity of ['HIGH', 'MID', 'LOW'] as const) {
  test(`${severity} badge uses its colour on a tint with a bold label`, async ({ bugApi, loginPage, boardPage }) => {
    const bug = await bugApi.create(`badge ${uid()}`, { severity: severity.toLowerCase() as 'high' | 'mid' | 'low' });
    await loginPage.login(defaultUser.username, defaultUser.password);
    await boardPage.waitLoaded();

    const style = await boardPage.severityBadgeStyle(bug.title);

    expect(style.color).toBe(severityColors[severity]);
    expect(style.background).not.toBe('rgba(0, 0, 0, 0)');
    expect(style.fontWeight).toBeGreaterThanOrEqual(600);
  });
}
