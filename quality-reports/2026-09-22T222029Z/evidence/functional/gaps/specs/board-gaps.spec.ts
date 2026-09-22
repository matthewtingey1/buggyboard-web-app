import { test, expect, buggy, uid, PREFIX } from '../fixtures';

let token: string;
test.beforeEach(async ({ bugApi, loginPage, boardPage }) => {
  token = uid();
  await bugApi.create(`b ${token}`, { severity: 'low' });
  await bugApi.create(`a ${token}`, { severity: 'high' });
  await bugApi.create(`d ${token}`, { severity: 'mid', state: 'closed' });
  await bugApi.create(`c ${token}`, { severity: 'low', state: 'closed' });
  await loginPage.login(buggy.username, buggy.password);
  await boardPage.waitLoaded();
});

const titles = async (boardPage: any) => (await boardPage.rowsContaining(token)).map((r: any) => r.title.split(' ')[1]);

test('13 sort chosen in Open is kept after switching to Closed', async ({ boardPage }) => {
  await boardPage.sortBy('Title');
  await boardPage.sortBy('Title');
  await boardPage.showClosed();
  expect(await boardPage.sortIndicator('Title')).toBe('↓');
  await expect.poll(() => titles(boardPage)).toEqual(['d', 'c']);
});

test('13 search text is kept and applied after switching state', async ({ boardPage }) => {
  await boardPage.search(`d ${token}`);
  await boardPage.showClosed();
  await expect(boardPage.searchInput).toHaveValue(`d ${token}`);
  await expect.poll(() => titles(boardPage)).toEqual(['d']);
});

test('11/10 sort order is kept after clearing the search', async ({ boardPage }) => {
  await boardPage.sortBy('Title');
  await boardPage.search(token);
  await boardPage.clearSearch();
  expect(await boardPage.sortIndicator('Title')).toBe('↑');
  await expect.poll(() => titles(boardPage)).toEqual(['a', 'b']);
});

test('11 a query containing brackets matches the bracketed title', async ({ boardPage }) => {
  await boardPage.search(`[functional] b ${token}`);
  await expect.poll(() => titles(boardPage)).toEqual(['b']);
});
