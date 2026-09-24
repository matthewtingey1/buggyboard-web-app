import { test, expect, defaultUser, uid } from '../fixtures';
import type { BoardRow, Column } from '../pages/board-page';

const RANK: Record<string, number> = { LOW: 0, MID: 1, HIGH: 2 };
const compare: Record<Column, (a: BoardRow, b: BoardRow) => number> = {
  ID: (a, b) => a.id - b.id,
  Severity: (a, b) => RANK[a.severity] - RANK[b.severity],
  Title: (a, b) => a.title.localeCompare(b.title),
  Owner: (a, b) => a.owner.localeCompare(b.owner),
};
const isSorted = (rows: BoardRow[], column: Column, dir: 'asc' | 'desc') =>
  rows.every((r, i) => i === 0 || (dir === 'asc' ? compare[column](rows[i - 1], r) <= 0 : compare[column](rows[i - 1], r) >= 0));

let token: string;

test.beforeEach(async ({ bugApi, loginPage, boardPage }) => {
  token = uid();
  await bugApi.create(`b-mid ${token}`, { severity: 'mid', owner: 'vanny' });
  await bugApi.create(`a-low ${token}`, { severity: 'low', owner: 'buggy' });
  await bugApi.create(`c-high ${token}`, { severity: 'high', owner: 'matt' });
  await loginPage.login(defaultUser.username, defaultUser.password);
  await boardPage.waitLoaded();
});

const labels = (rows: BoardRow[]) => rows.map((r) => r.title.split(' ')[1]);

test('default sort is Severity descending, with the only arrow on Severity', async ({ boardPage }) => {
  expect(await boardPage.sortIndicator('Severity')).toBe('↓');
  for (const column of ['ID', 'Title', 'Owner'] as const) expect(await boardPage.sortIndicator(column)).toBe('');
  expect((await boardPage.rowsContaining(token)).map((r) => r.severity)).toEqual(['HIGH', 'MID', 'LOW']);
});

test('clicking a new column sorts it ascending and moves the arrow there', async ({ boardPage }) => {
  await boardPage.sortBy('Title');

  expect(await boardPage.sortIndicator('Title')).toBe('↑');
  for (const column of ['ID', 'Severity', 'Owner'] as const) expect(await boardPage.sortIndicator(column)).toBe('');
  expect(labels(await boardPage.rowsContaining(token))).toEqual(['a-low', 'b-mid', 'c-high']);
});

test('clicking the sorted column again toggles to descending', async ({ boardPage }) => {
  await boardPage.sortBy('Title');

  await boardPage.sortBy('Title');

  expect(await boardPage.sortIndicator('Title')).toBe('↓');
  expect(labels(await boardPage.rowsContaining(token))).toEqual(['c-high', 'b-mid', 'a-low']);
});

test('switching columns clears the previous column\'s arrow', async ({ boardPage }) => {
  await boardPage.sortBy('Owner');

  await boardPage.sortBy('Severity');

  expect(await boardPage.sortIndicator('Owner')).toBe('');
  expect(await boardPage.sortIndicator('Severity')).toBe('↑');
});

test('Severity ascending orders LOW, MID, HIGH', async ({ boardPage }) => {
  await boardPage.sortBy('ID');

  await boardPage.sortBy('Severity');

  expect((await boardPage.rowsContaining(token)).map((r) => r.severity)).toEqual(['LOW', 'MID', 'HIGH']);
});

test('Severity descending after ascending orders HIGH, MID, LOW', async ({ boardPage }) => {
  await boardPage.sortBy('ID');
  await boardPage.sortBy('Severity');

  await boardPage.sortBy('Severity');

  expect((await boardPage.rowsContaining(token)).map((r) => r.severity)).toEqual(['HIGH', 'MID', 'LOW']);
});

for (const column of ['ID', 'Severity', 'Title', 'Owner'] as const) {
  test(`${column} sorts the whole board ascending then descending`, async ({ boardPage }) => {
    if (column === 'Severity') await boardPage.sortBy('ID');

    await boardPage.sortBy(column);
    expect(isSorted(await boardPage.rows(), column, 'asc')).toBe(true);

    await boardPage.sortBy(column);
    expect(isSorted(await boardPage.rows(), column, 'desc')).toBe(true);
  });
}
