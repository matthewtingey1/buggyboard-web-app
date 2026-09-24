import { test, expect, defaultUser, PREFIX, uid } from '../fixtures';

let token: string;
const title = (name: string) => `${PREFIX} ${name} ${token}`;

test.beforeEach(async ({ bugApi, loginPage, boardPage }) => {
  token = uid();
  await bugApi.create(`Login fails ${token}`, { severity: 'high' });
  await bugApi.create(`Issue with log-in ${token}`, { severity: 'low' });
  await bugApi.create(`Unrelated crash ${token}`, { severity: 'mid' });
  await loginPage.login(defaultUser.username, defaultUser.password);
  await boardPage.waitLoaded();
});

test('a blank search shows every bug and no clear button', async ({ boardPage }) => {
  await expect(boardPage.searchInput).toHaveValue('');
  expect(await boardPage.rowsContaining(token)).toHaveLength(3);
  await expect(boardPage.noMatchesMessage).toHaveCount(0);
  await expect(boardPage.clearSearchButton).toBeHidden();
});

test('typing a term hides titles that do not contain it', async ({ boardPage }) => {
  await boardPage.search('login');

  await expect.poll(() => boardPage.rowCount(title('Unrelated crash'))).toBe(0);
  expect(await boardPage.rowCount(title('Login fails'))).toBe(1);
});

test('"login" matches a title containing "log-in"', async ({ boardPage }) => {

  await boardPage.search('login');

  await expect.poll(() => boardPage.rowCount(title('Issue with log-in')), { timeout: 3000 }).toBe(1);
});

test('matching ignores case and collapses whitespace', async ({ boardPage }) => {
  await boardPage.search(`  LOGIN   FAILS ${token.toUpperCase()} `);

  await expect.poll(() => boardPage.rowCount(title('Login fails'))).toBe(1);
});

test('the X button clears the search and restores every bug', async ({ boardPage }) => {
  await boardPage.search(`crash ${token}`);
  await expect.poll(async () => (await boardPage.rowsContaining(token)).length).toBe(1);

  await boardPage.clearSearch();

  await expect(boardPage.searchInput).toHaveValue('');
  await expect(boardPage.clearSearchButton).toBeHidden();
  expect(await boardPage.rowsContaining(token)).toHaveLength(3);
});

test('the sort order and arrow are kept while searching', async ({ boardPage }) => {
  await boardPage.sortBy('Title');

  await boardPage.search(token);

  expect(await boardPage.sortIndicator('Title')).toBe('↑');
  const titles = (await boardPage.rowsContaining(token)).map((r) => r.title);
  expect(titles).toHaveLength(3);
  expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b)));
});

test('a search with no matches shows "No bugs matched." and no rows', async ({ boardPage }) => {
  await boardPage.search(`zzqx nomatch ${token}`);

  await expect(boardPage.noMatchesMessage).toBeVisible();
  await expect(boardPage.bugRows).toHaveCount(0);
});

test('"log in" still matches a title containing "log-in"', async ({ boardPage }) => {
  await boardPage.search(`log in ${token}`);

  await expect.poll(() => boardPage.rowCount(title('Issue with log-in'))).toBe(1);
});

test('a query with punctuation matches a title without it: "log-in" finds "Login fails"', async ({ boardPage }) => {
  await boardPage.search(`log-in fails ${token}`);

  await expect.poll(() => boardPage.rowCount(title('Login fails'))).toBe(1);
});
