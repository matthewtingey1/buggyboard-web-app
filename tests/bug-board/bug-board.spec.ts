import { test, expect, defaultUser, uid } from '../fixtures';

test('board columns are ordered ID, Severity, Title, Owner', async ({ loginPage, boardPage }) => {
  await loginPage.login(defaultUser.username, defaultUser.password);

  await boardPage.waitLoaded();

  expect(await boardPage.headerNames()).toEqual(['ID', 'Severity', 'Title', 'Owner']);
});

test('each bug is listed once with its ID, severity, title and owner', async ({ bugApi, loginPage, boardPage }) => {
  const token = uid();
  const bugs = [
    await bugApi.create(`row a ${token}`, { severity: 'high', owner: 'vanny' }),
    await bugApi.create(`row b ${token}`, { severity: 'low' }),
  ];

  await loginPage.login(defaultUser.username, defaultUser.password);
  await boardPage.waitLoaded();

  const rows = await boardPage.rowsContaining(token);
  for (const bug of bugs) {
    expect(rows.filter((r) => r.id === bug.id)).toEqual([
      { id: bug.id, severity: bug.severity, title: bug.title, owner: bug.owner },
    ]);
  }
});

test('a bug saved with lower-case severity is displayed in upper case', async ({ bugApi, loginPage, boardPage }) => {
  const bug = await bugApi.create(`caps ${uid()}`, { severity: 'high' });

  await loginPage.login(defaultUser.username, defaultUser.password);
  await boardPage.waitLoaded();

  const [row] = await boardPage.rowsContaining(bug.title);
  expect(row.severity).toBe('HIGH');
});

// The empty-board scenario in spec 07 needs an empty database, which a shared test database can't give.
