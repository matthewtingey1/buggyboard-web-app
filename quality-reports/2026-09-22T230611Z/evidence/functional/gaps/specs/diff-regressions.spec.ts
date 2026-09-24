import { test, expect, buggy, uid } from '../fixtures';

// Scenarios the 2026-09-22T230611Z diff could have broken, and that nothing in tests/ guards.

test.beforeEach(async ({ loginPage, boardPage }) => {
  await loginPage.login(buggy.username, buggy.password);
  await boardPage.waitLoaded();
});

test('06 Escape after choosing a severity closes the create modal without saving', async ({ boardPage, createBugModal, bugApi }) => {
  const title = `[functional] esc-sev ${uid()}`;
  await boardPage.openNewBug();
  await createBugModal.fill({ title, description: 'd' });
  await createBugModal.severitySelect.selectOption({ label: 'HIGH' });

  await createBugModal.severitySelect.press('Escape');

  await expect(createBugModal.dialog).toBeHidden();
  expect(await bugApi.findContaining(title)).toHaveLength(0);
});

test('09 Escape after choosing a severity closes the edit modal and discards', async ({ bugApi, boardPage, editBugModal }) => {
  const bug = await bugApi.create(`esc-sev-edit ${uid()}`, { severity: 'low' });
  await boardPage.reload();
  await boardPage.waitLoaded();
  await boardPage.openBug(bug.title);
  await editBugModal.severitySelect.selectOption({ label: 'HIGH' });

  await editBugModal.severitySelect.press('Escape');

  await expect(editBugModal.dialog).toBeHidden();
  expect((await bugApi.get(bug.id))?.severity).toBe('LOW');
});

test('09/13 Escape after choosing a state closes the edit modal and discards', async ({ bugApi, boardPage, editBugModal }) => {
  const bug = await bugApi.create(`esc-state-edit ${uid()}`);
  await boardPage.reload();
  await boardPage.waitLoaded();
  await boardPage.openBug(bug.title);
  await editBugModal.stateSelect.selectOption({ label: 'Closed' });

  await editBugModal.stateSelect.press('Escape');

  await expect(editBugModal.dialog).toBeHidden();
  expect((await bugApi.get(bug.id))?.state).toBe('OPEN');
});

for (const field of ['title', 'owner', 'description'] as const) {
  test(`09 Save is disabled when ${field} is changed to only a zero-width space`, async ({ bugApi, boardPage, editBugModal }) => {
    const bug = await bugApi.create(`zw-${field} ${uid()}`);
    await boardPage.reload();
    await boardPage.waitLoaded();
    await boardPage.openBug(bug.title);

    await editBugModal.fill({ [field]: '​' });

    await expect(editBugModal.saveButton).toBeDisabled();
  });
}

test('06 a zero-width-only title is blocked in the create modal', async ({ boardPage, createBugModal, bugApi }) => {
  const token = uid();
  await boardPage.openNewBug();
  await createBugModal.fill({ title: '​', description: `[functional] zw ${token}` });

  await createBugModal.save();

  await expect(createBugModal.dialog).toBeVisible();
  await expect(createBugModal.errors).toContainText('Title is required.');
});

for (const cell of [1, 2, 4]) {
  test(`09 clicking the row's cell ${cell} (not the title) opens the edit modal`, async ({ bugApi, boardPage, editBugModal, page }) => {
    const bug = await bugApi.create(`cell-click ${uid()}`);
    await boardPage.reload();
    await boardPage.waitLoaded();

    await page.getByRole('table', { name: 'Bugs' }).locator('tbody tr', { hasText: bug.title }).locator(`td:nth-child(${cell})`).click();

    await expect(editBugModal.dialog).toBeVisible();
    await expect(editBugModal.heading).toHaveText(`Edit bug #${bug.id}`);
  });
}

test('11 search "log in" (space) still finds "Issue with log-in"', async ({ bugApi, boardPage }) => {
  const token = uid();
  const bug = await bugApi.create(`Issue with log-in ${token}`);
  await boardPage.reload();
  await boardPage.waitLoaded();

  await boardPage.search(`log in ${token}`);

  await expect.poll(() => boardPage.rowCount(bug.title)).toBe(1);
});

test('11 search "save load" finds "save/load broken"', async ({ bugApi, boardPage }) => {
  const token = uid();
  const bug = await bugApi.create(`save/load broken ${token}`);
  await boardPage.reload();
  await boardPage.waitLoaded();

  await boardPage.search(`save load broken ${token}`);

  await expect.poll(() => boardPage.rowCount(bug.title)).toBe(1);
});

test('11 query "log-in" matches "Login fails" and the clear X resets', async ({ bugApi, boardPage }) => {
  const token = uid();
  const bug = await bugApi.create(`Login fails ${token}`);
  await boardPage.reload();
  await boardPage.waitLoaded();

  await boardPage.search(`log-in fails ${token}`);
  await expect.poll(() => boardPage.rowCount(bug.title)).toBe(1);
  await boardPage.clearSearch();

  await expect(boardPage.searchInput).toHaveValue('');
  await expect(boardPage.clearSearchButton).toBeHidden();
});

test('13 sort is kept across a state switch and after clearing search', async ({ bugApi, boardPage }) => {
  const token = uid();
  await bugApi.create(`b ${token}`, { severity: 'low' });
  await bugApi.create(`a ${token}`, { severity: 'high' });
  await boardPage.reload();
  await boardPage.waitLoaded();
  await boardPage.sortBy('Title');
  await boardPage.search(token);
  await boardPage.showClosed();
  await boardPage.showOpen();
  await boardPage.clearSearch();

  expect(await boardPage.sortIndicator('Title')).toBe('↑');
  expect((await boardPage.rowsContaining(token)).map((r) => r.title.startsWith('[functional] a'))).toEqual([true, false]);
});
