import { test as base, expect, buggy, uid, PREFIX, type Bug } from '../fixtures';

const test = base.extend<{ bug: Bug }>({
  bug: async ({ bugApi, loginPage, boardPage, editBugModal }, use) => {
    const bug = await bugApi.create(`gap ${uid()}`, { description: 'original' });
    await loginPage.login(buggy.username, buggy.password);
    await boardPage.waitLoaded();
    await boardPage.openBug(bug.title);
    await expect(editBugModal.dialog).toBeVisible();
    await use(bug);
  },
});

test('E1.2 Title has focus when the edit modal opens', async ({ bug, editBugModal }) => {
  void bug;
  await expect(editBugModal.titleInput).toBeFocused();
});

test('E2.3 Enter in Title saves the change', async ({ bug, editBugModal, bugApi }) => {
  await editBugModal.fill({ description: 'changed via enter' });
  await editBugModal.titleInput.press('Enter');
  await expect(editBugModal.dialog).toBeHidden();
  expect((await bugApi.get(bug.id))?.description).toBe('changed via enter');
});

test('E2.4 Enter in Description adds a line and does not save', async ({ bug, editBugModal, bugApi }) => {
  await editBugModal.descriptionInput.press('End');
  await editBugModal.descriptionInput.press('Enter');
  await editBugModal.descriptionInput.pressSequentially('line2');
  await expect(editBugModal.dialog).toBeVisible();
  await expect(editBugModal.descriptionInput).toHaveValue('original\nline2');
  expect((await bugApi.get(bug.id))?.description).toBe('original');
});

test('E3.4 a trailing-space-only change does not enable Save', async ({ bug, editBugModal }) => {
  await editBugModal.fill({ title: `${bug.title} ` });
  await expect(editBugModal.saveButton).toBeDisabled();
});

test('E5.1 saving a bug deleted elsewhere shows "Bug not found." and does not recreate it', async ({ bug, editBugModal, bugApi }) => {
  await editBugModal.fill({ description: 'edit after delete' });
  await bugApi.remove(bug.id);
  await editBugModal.save();
  await expect(editBugModal.dialog.getByRole('alert')).toContainText('Bug not found.');
  expect(await bugApi.get(bug.id)).toBeNull();
});

test('D1.3 Escape closes only the confirmation; edit modal stays; bug exists', async ({ page, bug, editBugModal, deleteConfirmModal, bugApi }) => {
  await editBugModal.delete();
  await expect(deleteConfirmModal.dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(deleteConfirmModal.dialog).toBeHidden();
  await expect(editBugModal.dialog).toBeVisible();
  expect(await bugApi.get(bug.id)).toEqual(bug);
});

test('D1.4 backdrop click keeps the confirmation open', async ({ bug, editBugModal, deleteConfirmModal, bugApi }) => {
  await editBugModal.delete();
  await deleteConfirmModal.dialog.click({ position: { x: 5, y: 5 } });
  await expect(deleteConfirmModal.dialog).toBeVisible();
  expect(await bugApi.get(bug.id)).toEqual(bug);
});

test('12-S4 cancelling the confirmation leaves the bug on the board', async ({ bug, editBugModal, deleteConfirmModal, boardPage }) => {
  await editBugModal.delete();
  await deleteConfirmModal.cancel();
  await editBugModal.cancel();
  await expect.poll(() => boardPage.rowCount(bug.title)).toBe(1);
});

base('D2.3 deleting from the Closed view removes the bug and keeps Closed selected', async ({ bugApi, loginPage, boardPage, editBugModal, deleteConfirmModal }) => {
  const bug = await bugApi.create(`closed del ${uid()}`, { state: 'closed' });
  await loginPage.login(buggy.username, buggy.password);
  await boardPage.waitLoaded();
  await boardPage.showClosed();
  await boardPage.openBug(bug.title);
  await editBugModal.delete();
  await deleteConfirmModal.confirm();
  await expect(editBugModal.dialog).toBeHidden();
  expect(await bugApi.get(bug.id)).toBeNull();
  await expect.poll(() => boardPage.rowCount(bug.title)).toBe(0);
  expect(await boardPage.filterBackground('closed')).not.toBe('rgba(0, 0, 0, 0)');
  expect(await boardPage.filterBackground('open')).toBe('rgba(0, 0, 0, 0)');
});
