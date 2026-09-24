import { test, expect } from '../pages/fixtures';
import { PREFIX, uid } from '../pages/api';

test.describe('13 bug state', () => {
  test('13-S1 bug created via New Bug modal is Open and listed under Open', async ({ signedIn, createModal, api }) => {
    const title = `${PREFIX} state-new ${uid()}`;
    await signedIn.newBugButton.click();
    await expect(createModal.owner).toHaveValue('buggy');
    await expect(createModal.dialog.getByLabel('State')).toHaveCount(0);
    await createModal.fill({ title, severity: 'LOW', description: 'd' });
    await createModal.saveButton.click();
    await expect(createModal.dialog).toBeHidden();
    const [saved] = await api.findByTitle(title);
    if (saved) api.track(saved.id);
    expect(saved.state).toBe('OPEN');
    await expect(signedIn.rowFor(title)).toHaveCount(1);
  });

  test('13-S2 edit modal shows state and saving a change persists it', async ({ api, loginPage, board, editModal }) => {
    const bug = await api.create(`state-edit ${uid()}`, 'mid');
    await loginPage.login('buggy', '1970beetle');
    await board.waitLoaded();
    await board.openBug(bug.title);
    await expect(editModal.state).toHaveValue('open');
    await expect(editModal.state.locator('option')).toHaveText(['Open', 'Closed']);
    await editModal.state.selectOption({ label: 'Closed' });
    await editModal.saveButton.click();
    await expect(editModal.dialog).toBeHidden();
    expect((await api.get(bug.id))!.state).toBe('CLOSED');
    await expect(board.rowFor(bug.title)).toHaveCount(0);
  });

  test('13-S3 filter defaults to Open, visibly selected, and hides closed bugs', async ({ api, loginPage, board }) => {
    const t = uid();
    const open = await api.create(`st-open ${t}`, 'mid');
    const closed = await api.create(`st-closed ${t}`, 'mid', { state: 'closed' });
    await loginPage.login('buggy', '1970beetle');
    await board.waitLoaded();
    const bgOpen = await board.openFilter.evaluate((e) => getComputedStyle(e).backgroundColor);
    const bgClosed = await board.closedFilter.evaluate((e) => getComputedStyle(e).backgroundColor);
    expect(bgOpen).not.toBe(bgClosed);
    expect(bgClosed).toBe('rgba(0, 0, 0, 0)');
    await expect(board.rowFor(open.title)).toHaveCount(1);
    await expect(board.rowFor(closed.title)).toHaveCount(0);
  });

  test('13-S4 selecting Closed shows only closed bugs', async ({ api, loginPage, board, request }) => {
    const t = uid();
    const open = await api.create(`sc-open ${t}`, 'mid');
    const closed = await api.create(`sc-closed ${t}`, 'mid', { state: 'closed' });
    await loginPage.login('buggy', '1970beetle');
    await board.waitLoaded();
    await board.closedFilter.click();
    await expect(board.rowFor(closed.title)).toHaveCount(1);
    await expect(board.rowFor(open.title)).toHaveCount(0);
    const shown = (await board.rows()).map((r) => r.id);
    const all = (await (await request.get('/api/bugs')).json()) as Array<{ id: number; state: string }>;
    const openIds = new Set(all.filter((b) => b.state === 'OPEN').map((b) => b.id));
    expect(shown.filter((id) => openIds.has(id))).toEqual([]);
  });

  test('13-S5 sorting applies within the selected state', async ({ api, loginPage, board }) => {
    const t = uid();
    await api.create(`b ${t}`, 'mid', { state: 'closed' });
    await api.create(`a ${t}`, 'mid', { state: 'closed' });
    const openOne = await api.create(`c ${t}`, 'mid');
    await loginPage.login('buggy', '1970beetle');
    await board.waitLoaded();
    await board.closedFilter.click();
    await board.sortBy('Title');
    const mine = (await board.rowsContaining(t)).map((r) => r.title);
    expect(mine).toEqual([`${PREFIX} a ${t}`, `${PREFIX} b ${t}`]);
    await expect(board.rowFor(openOne.title)).toHaveCount(0);
    expect(await board.indicator('Title')).toBe('↑');
  });

  test('13-S6 search and state filter apply together', async ({ api, loginPage, board }) => {
    const t = uid();
    const o = await api.create(`combo ${t}`, 'mid');
    const c = await api.create(`combo ${t} closed`, 'mid', { state: 'closed' });
    await loginPage.login('buggy', '1970beetle');
    await board.waitLoaded();
    await board.closedFilter.click();
    await board.search(t);
    expect((await board.rows()).map((r) => r.id)).toEqual([c.id]);
    await board.openFilter.click();
    expect((await board.rows()).map((r) => r.id)).toEqual([o.id]);
  });

  test('13-S7 (proxy) selected state with no matching bugs shows "No bugs matched."', async ({ api, loginPage, board }) => {
    const t = uid();
    await api.create(`only-open ${t}`, 'mid');
    await loginPage.login('buggy', '1970beetle');
    await board.waitLoaded();
    await board.closedFilter.click();
    await board.search(t);
    await expect(board.noMatches).toBeVisible();
    await expect(board.bodyRows).toHaveCount(0);
  });
});
