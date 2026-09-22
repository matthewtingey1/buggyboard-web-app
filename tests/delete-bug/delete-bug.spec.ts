import { test as base, expect, defaultUser, uid } from '../fixtures';
import type { Bug } from '../fixtures/bug-api';

// Every delete test starts with its own bug open in the edit modal.
const test = base.extend<{ bug: Bug }>({
  bug: async ({ bugApi, loginPage, boardPage, editBugModal }, use) => {
    const bug = await bugApi.create(`delete ${uid()}`);
    await loginPage.login(defaultUser.username, defaultUser.password);
    await boardPage.waitLoaded();
    await boardPage.openBug(bug.title);
    await expect(editBugModal.dialog).toBeVisible();
    await use(bug);
  },
});

test('the edit modal shows a Delete button', async ({ bug, editBugModal }) => {
  void bug;
  await expect(editBugModal.deleteButton).toBeVisible();
});

test('Delete asks for confirmation naming the bug\'s ID and title', async ({ bug, editBugModal, deleteConfirmModal, bugApi }) => {
  await editBugModal.delete();

  await expect(deleteConfirmModal.dialog).toBeVisible();
  await expect(deleteConfirmModal.message).toHaveText(`Are you sure you want to delete bug #${bug.id}: ${bug.title}?`);
  await expect(deleteConfirmModal.confirmButton).toBeVisible();
  await expect(deleteConfirmModal.cancelButton).toBeVisible();
  expect(await bugApi.get(bug.id)).not.toBeNull();
});

test('confirming removes the bug and closes both modals', async ({ bug, editBugModal, deleteConfirmModal, bugApi, boardPage }) => {
  await editBugModal.delete();

  await deleteConfirmModal.confirm();

  await expect(deleteConfirmModal.dialog).toBeHidden();
  await expect(editBugModal.dialog).toBeHidden();
  expect(await bugApi.get(bug.id)).toBeNull();
  await expect.poll(() => boardPage.rowCount(bug.title)).toBe(0);
});

test('cancelling the confirmation returns to the edit modal with the bug intact', async ({ bug, editBugModal, deleteConfirmModal, bugApi, boardPage }) => {
  await editBugModal.delete();

  await deleteConfirmModal.cancel();

  await expect(deleteConfirmModal.dialog).toBeHidden();
  await expect(editBugModal.dialog).toBeVisible();
  await expect(editBugModal.titleInput).toHaveValue(bug.title);
  expect(await bugApi.get(bug.id)).toEqual(bug);
  expect(await boardPage.rowCount(bug.title)).toBe(1);
});
