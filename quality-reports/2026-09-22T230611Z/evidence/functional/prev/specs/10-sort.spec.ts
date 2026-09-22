import { test, expect } from '../pages/fixtures';
import { uid } from '../pages/api';
import type { Column } from '../pages/board-page';

const RANK: Record<string, number> = { LOW: 0, MID: 1, HIGH: 2 };
type Row = { id: number; severity: string; title: string; owner: string };
const key: Record<Column, (a: Row, b: Row) => number> = {
  ID: (a, b) => a.id - b.id,
  Severity: (a, b) => RANK[a.severity] - RANK[b.severity],
  Title: (a, b) => a.title.localeCompare(b.title),
  Owner: (a, b) => a.owner.localeCompare(b.owner),
};
function isSorted(rows: Row[], col: Column, dir: 'asc' | 'desc') {
  return rows.every((r, i) => i === 0 || (dir === 'asc' ? key[col](rows[i - 1], r) <= 0 : key[col](rows[i - 1], r) >= 0));
}

test.describe('10 sort', () => {
  let t: string;
  test.beforeEach(async ({ api, loginPage, board }) => {
    t = uid();
    await api.create(`b-mid ${t}`, 'mid', { owner: 'vanny' });
    await api.create(`a-low ${t}`, 'low', { owner: 'buggy' });
    await api.create(`c-high ${t}`, 'high', { owner: 'matt' });
    await loginPage.login('buggy', '1970beetle');
    await board.waitLoaded();
  });

  test('10-S1 default sort is Severity descending with only a down arrow on Severity', async ({ board }) => {
    expect(await board.indicator('Severity')).toBe('↓');
    for (const c of ['ID', 'Title', 'Owner'] as const) expect(await board.indicator(c)).toBe('');
    expect((await board.rowsContaining(t)).map((r) => r.severity)).toEqual(['HIGH', 'MID', 'LOW']);
    expect(isSorted(await board.rows(), 'Severity', 'desc')).toBe(true);
  });

  test('10-S2 clicking Title sorts ascending with only Title showing up arrow', async ({ board }) => {
    await board.sortBy('Title');
    expect(await board.indicator('Title')).toBe('↑');
    for (const c of ['ID', 'Severity', 'Owner'] as const) expect(await board.indicator(c)).toBe('');
    expect(isSorted(await board.rows(), 'Title', 'asc')).toBe(true);
    expect((await board.rowsContaining(t)).map((r) => r.title.split(' ')[1])).toEqual(['a-low', 'b-mid', 'c-high']);
  });

  test('10-S3 clicking Title again toggles to descending', async ({ board }) => {
    await board.sortBy('Title');
    await board.sortBy('Title');
    expect(await board.indicator('Title')).toBe('↓');
    expect(isSorted(await board.rows(), 'Title', 'desc')).toBe(true);
    expect((await board.rowsContaining(t)).map((r) => r.title.split(' ')[1])).toEqual(['c-high', 'b-mid', 'a-low']);
  });

  test('10-S4 switching from Owner to Severity moves the indicator', async ({ board }) => {
    await board.sortBy('Owner');
    expect(await board.indicator('Owner')).toBe('↑');
    await board.sortBy('Severity');
    expect(await board.indicator('Severity')).not.toBe('');
    expect(await board.indicator('Owner')).toBe('');
    expect(isSorted(await board.rows(), 'Severity', 'asc')).toBe(true);
  });

  test('10-S5 Severity ascending is LOW, MID, HIGH', async ({ board }) => {
    await board.sortBy('ID');
    await board.sortBy('Severity');
    expect(await board.indicator('Severity')).toBe('↑');
    expect((await board.rowsContaining(t)).map((r) => r.severity)).toEqual(['LOW', 'MID', 'HIGH']);
    expect(isSorted(await board.rows(), 'Severity', 'asc')).toBe(true);
  });

  test('10-S6 Severity descending after ascending is HIGH, MID, LOW', async ({ board }) => {
    await board.sortBy('ID');
    await board.sortBy('Severity');
    await board.sortBy('Severity');
    expect(await board.indicator('Severity')).toBe('↓');
    expect((await board.rowsContaining(t)).map((r) => r.severity)).toEqual(['HIGH', 'MID', 'LOW']);
  });

  for (const col of ['ID', 'Severity', 'Title', 'Owner'] as const) {
    test(`10-S7 ${col} column is clickable and sorts both directions`, async ({ board }) => {
      if (col === 'Severity') await board.sortBy('ID');
      await board.sortBy(col);
      expect(await board.indicator(col)).toBe('↑');
      expect(isSorted(await board.rows(), col, 'asc')).toBe(true);
      await board.sortBy(col);
      expect(await board.indicator(col)).toBe('↓');
      expect(isSorted(await board.rows(), col, 'desc')).toBe(true);
    });
  }
});
