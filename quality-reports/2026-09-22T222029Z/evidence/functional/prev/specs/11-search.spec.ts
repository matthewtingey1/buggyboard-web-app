import { test, expect } from '../pages/fixtures';
import { uid } from '../pages/api';

const norm = (s: string) => s.toLowerCase().replace(/\p{P}/gu, '').replace(/\s+/g, ' ').trim();

test.describe('11 search', () => {
  let t: string;
  test.beforeEach(async ({ api, loginPage, board }) => {
    t = uid();
    await api.create(`Login fails ${t}`, 'high');
    await api.create(`Issue with log-in ${t}`, 'low');
    await api.create(`Unrelated crash ${t}`, 'mid');
    await loginPage.login('buggy', '1970beetle');
    await board.waitLoaded();
  });

  test('11-S1 blank search shows all bugs and no "no bugs matched" message', async ({ board }) => {
    await expect(board.searchInput).toHaveValue('');
    expect(await board.rowsContaining(t)).toHaveLength(3);
    await expect(board.noMatches).toHaveCount(0);
    await expect(board.clearSearch).toBeHidden();
  });

  test('11-S2 typing "login" hides titles without login', async ({ board }) => {
    await board.search('login');
    await expect(board.rowFor(`[functional] Unrelated crash ${t}`)).toHaveCount(0);
    await expect(board.rowFor(`[functional] Login fails ${t}`)).toHaveCount(1);
    const titles = (await board.rows()).map((r) => r.title);
    expect(titles.every((x) => norm(x).includes('login'))).toBe(true);
  });

  test('11-S3 "login" matches both "Login fails" and "Issue with log-in"', async ({ board }) => {
    await board.search('login');
    await expect(board.rowFor(`[functional] Login fails ${t}`)).toHaveCount(1);
    await expect(board.rowFor(`[functional] Issue with log-in ${t}`)).toHaveCount(1);
  });

  test('11-S3b case and whitespace are normalised ("  LOGIN   FAILS ")', async ({ board }) => {
    await board.search(`  LOGIN   FAILS ${t.toUpperCase()} `);
    await expect(board.rowFor(`[functional] Login fails ${t}`)).toHaveCount(1);
  });

  test('11-S4 X clears the search and restores all bugs', async ({ board }) => {
    await board.search(`crash ${t}`);
    expect(await board.rowsContaining(t)).toHaveLength(1);
    await expect(board.clearSearch).toBeVisible();
    await board.clearSearch.click();
    await expect(board.searchInput).toHaveValue('');
    await expect(board.clearSearch).toBeHidden();
    expect(await board.rowsContaining(t)).toHaveLength(3);
  });

  test('11-S5 sort order and indicator are preserved while searching', async ({ board }) => {
    await board.sortBy('Title');
    await board.search(t);
    expect(await board.indicator('Title')).toBe('↑');
    const titles = (await board.rowsContaining(t)).map((r) => r.title);
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b)));
    expect(titles).toHaveLength(3);
  });

  test('11-S6 no-match search shows "No bugs matched." and no rows', async ({ board }) => {
    await board.search(`zzqx nomatch ${t}`);
    await expect(board.noMatches).toBeVisible();
    await expect(board.bodyRows).toHaveCount(0);
  });
});

test.describe('11 search punctuation probe', () => {
  test('11-S3c query "log-in" matches title "Login fails" (both sides normalised)', async ({ api, loginPage, board }) => {
    const t = uid();
    const bug = await api.create(`Login fails ${t}`, 'high');
    await loginPage.login('buggy', '1970beetle');
    await board.waitLoaded();
    await board.search('log-in');
    await expect(board.rowFor(bug.title)).toHaveCount(1);
  });
});
