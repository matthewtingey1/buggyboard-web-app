import { test, expect, defaultUser, uid } from '../fixtures';

// Keyboard focus order differs by engine (WebKit skips buttons on Tab by default), so these run in Chromium.
test.beforeEach(async ({ browserName, loginPage, boardPage }) => {
  test.skip(browserName !== 'chromium', 'Accessibility checks are calibrated for Chromium.');
  await loginPage.login(defaultUser.username, defaultUser.password);
  await boardPage.waitLoaded();
});

test('a bug row opens with the keyboard', async ({ bugApi, boardPage, editBugModal }) => {
  const bug = await bugApi.create(`keyboard ${uid()}`);
  await boardPage.reload();
  await boardPage.waitLoaded();

  await boardPage.openBugWithKeyboard(bug.title);

  await expect(editBugModal.dialog).toBeVisible();
});

test('Escape closes the create modal', async ({ boardPage, createBugModal }) => {
  await boardPage.openNewBug();

  await createBugModal.pressEscape();

  await expect(createBugModal.dialog).toBeHidden();
});

test('the search field is exposed as a text box', async ({ boardPage }) => {

  await expect(boardPage.searchTextbox).toBeVisible({ timeout: 2000 });
});

test('a bug is exposed as a table row named by its cells', async ({ bugApi, boardPage }) => {
  const bug = await bugApi.create(`row role ${uid()}`);
  await boardPage.reload();
  await boardPage.waitLoaded();

  expect(await boardPage.rowRoleCount(bug.title)).toBe(1);
});

test('the selected state filter is announced as pressed, and follows a switch', async ({ boardPage }) => {
  await expect(boardPage.openFilter).toHaveAttribute('aria-pressed', 'true');
  await expect(boardPage.closedFilter).toHaveAttribute('aria-pressed', 'false');

  await boardPage.showClosed();

  await expect(boardPage.closedFilter).toHaveAttribute('aria-pressed', 'true');
  await expect(boardPage.openFilter).toHaveAttribute('aria-pressed', 'false');
});

test('Tab stays inside the create modal', async ({ boardPage, createBugModal }) => {
  await boardPage.openNewBug();

  await createBugModal.pressTab(15);

  expect(await createBugModal.focusIsInside()).toBe(true);
});

test('closing the create modal returns focus to New Bug', async ({ boardPage, createBugModal }) => {
  await boardPage.openNewBugWithKeyboard();

  await createBugModal.pressEscape();

  await expect(boardPage.newBugButton).toBeFocused();
});

// Spec 06: Escape cancels the modal wherever focus is, including on a dropdown.
test('Escape with focus on the Severity dropdown closes the modal', async ({ boardPage, createBugModal }) => {
  await boardPage.openNewBug();

  await createBugModal.pressEscapeInSeverity();

  await expect(createBugModal.dialog).toBeHidden();
});

test('the delete confirmation puts first focus on Cancel', async ({ bugApi, boardPage, editBugModal, deleteConfirmModal }) => {
  const bug = await bugApi.create(`confirm focus ${uid()}`);
  await boardPage.reload();
  await boardPage.waitLoaded();
  await boardPage.openBug(bug.title);

  await editBugModal.delete();

  await expect(deleteConfirmModal.cancelButton).toBeFocused();
});

test('a failed save puts focus back in the form', async ({ boardPage, createBugModal }) => {
  await boardPage.abortBugWrites();
  await boardPage.openNewBug();
  await createBugModal.fill({ title: `offline ${uid()}`, description: 'd' });

  await createBugModal.save();

  await expect(createBugModal.errors).toBeVisible();
  expect(await createBugModal.focusIsInside()).toBe(true);
});

test('the delete confirmation returns focus to Delete when cancelled', async ({ bugApi, boardPage, editBugModal, deleteConfirmModal }) => {
  const bug = await bugApi.create(`focus return ${uid()}`);
  await boardPage.reload();
  await boardPage.waitLoaded();
  await boardPage.openBug(bug.title);
  await editBugModal.delete();

  await deleteConfirmModal.cancel();

  await expect(editBugModal.deleteButton).toBeFocused();
});

test('search results are announced in a status message', async ({ boardPage }) => {
  await boardPage.search(`zzq-no-match-${uid()}`);

  await expect(boardPage.statusMessage).toHaveText('No bugs matched.');
});
