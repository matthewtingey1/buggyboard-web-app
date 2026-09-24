import { test, expect, defaultUser, PREFIX, uid } from '../fixtures';

test('a bug created from the New Bug modal is Open', async ({ loginPage, boardPage, createBugModal, bugApi }) => {
  const title = `${PREFIX} new is open ${uid()}`;
  bugApi.expectTitle(title);
  await loginPage.login(defaultUser.username, defaultUser.password);
  await boardPage.waitLoaded();
  await boardPage.openNewBug();
  await expect(createBugModal.ownerInput).toHaveValue(defaultUser.username);
  await createBugModal.fill({ title, severity: 'LOW', description: 'd' });

  await createBugModal.save();

  await expect(createBugModal.dialog).toBeHidden();
  const [saved] = await bugApi.findByTitle(title);
  expect(saved.state).toBe('OPEN');
  await expect.poll(() => boardPage.rowCount(title)).toBe(1);
});

test('the create modal has no State field', async ({ loginPage, boardPage, createBugModal }) => {
  await loginPage.login(defaultUser.username, defaultUser.password);
  await boardPage.waitLoaded();

  await boardPage.openNewBug();

  await expect(createBugModal.dialog).toBeVisible();
  await expect(createBugModal.stateSelect).toHaveCount(0);
});

test('the edit modal shows the state with Open and Closed options', async ({ bugApi, loginPage, boardPage, editBugModal }) => {
  const bug = await bugApi.create(`state shown ${uid()}`);
  await loginPage.login(defaultUser.username, defaultUser.password);
  await boardPage.waitLoaded();

  await boardPage.openBug(bug.title);

  await expect(editBugModal.stateSelect).toHaveValue('open');
  await expect(editBugModal.stateSelect.locator('option')).toHaveText(['Open', 'Closed']);
});

test('closing a bug in the edit modal persists and hides it from the Open view', async ({ bugApi, loginPage, boardPage, editBugModal }) => {
  const bug = await bugApi.create(`state edit ${uid()}`);
  await loginPage.login(defaultUser.username, defaultUser.password);
  await boardPage.waitLoaded();
  await boardPage.openBug(bug.title);

  await editBugModal.fill({ state: 'Closed' });
  await editBugModal.save();

  await expect(editBugModal.dialog).toBeHidden();
  expect((await bugApi.get(bug.id))?.state).toBe('CLOSED');
  await expect.poll(() => boardPage.rowCount(bug.title)).toBe(0);
});

test('the filter defaults to Open, shown as selected, and hides closed bugs', async ({ bugApi, loginPage, boardPage }) => {
  const token = uid();
  const open = await bugApi.create(`default open ${token}`);
  const closed = await bugApi.create(`default closed ${token}`, { state: 'closed' });

  await loginPage.login(defaultUser.username, defaultUser.password);
  await boardPage.waitLoaded();

  expect(await boardPage.filterBackground('closed')).toBe('rgba(0, 0, 0, 0)');
  expect(await boardPage.filterBackground('open')).not.toBe('rgba(0, 0, 0, 0)');
  expect(await boardPage.rowCount(open.title)).toBe(1);
  expect(await boardPage.rowCount(closed.title)).toBe(0);
});

test('selecting Closed shows closed bugs and hides open ones', async ({ bugApi, loginPage, boardPage }) => {
  const token = uid();
  const open = await bugApi.create(`closed view open ${token}`);
  const closed = await bugApi.create(`closed view closed ${token}`, { state: 'closed' });
  await loginPage.login(defaultUser.username, defaultUser.password);
  await boardPage.waitLoaded();

  await boardPage.showClosed();

  await expect.poll(() => boardPage.rowCount(closed.title)).toBe(1);
  expect(await boardPage.rowCount(open.title)).toBe(0);
});

test('sorting applies within the selected state', async ({ bugApi, loginPage, boardPage }) => {
  const token = uid();
  await bugApi.create(`b ${token}`, { state: 'closed' });
  await bugApi.create(`a ${token}`, { state: 'closed' });
  const openBug = await bugApi.create(`c ${token}`);
  await loginPage.login(defaultUser.username, defaultUser.password);
  await boardPage.waitLoaded();
  await boardPage.showClosed();

  await boardPage.sortBy('Title');

  expect((await boardPage.rowsContaining(token)).map((r) => r.title)).toEqual([`${PREFIX} a ${token}`, `${PREFIX} b ${token}`]);
  expect(await boardPage.rowCount(openBug.title)).toBe(0);
});

test('search and the state filter apply together', async ({ bugApi, loginPage, boardPage }) => {
  const token = uid();
  const open = await bugApi.create(`combo ${token}`);
  const closed = await bugApi.create(`combo ${token} closed`, { state: 'closed' });
  await loginPage.login(defaultUser.username, defaultUser.password);
  await boardPage.waitLoaded();
  await boardPage.showClosed();

  await boardPage.search(token);

  await expect.poll(async () => (await boardPage.rows()).map((r) => r.id)).toEqual([closed.id]);
  await boardPage.showOpen();
  await expect.poll(async () => (await boardPage.rows()).map((r) => r.id)).toEqual([open.id]);
});

// Spec 13 phrases this with every bug open; a shared database can't guarantee that, so a search narrows the view instead.
test('a selected state with no matching bugs shows "No bugs matched."', async ({ bugApi, loginPage, boardPage }) => {
  const token = uid();
  await bugApi.create(`only open ${token}`);
  await loginPage.login(defaultUser.username, defaultUser.password);
  await boardPage.waitLoaded();
  await boardPage.showClosed();

  await boardPage.search(token);

  await expect(boardPage.noMatchesMessage).toBeVisible();
  await expect(boardPage.bugRows).toHaveCount(0);
});
