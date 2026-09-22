// spec: specs/testing/delete-bug-test-plan.md
// seed: tests/seed.spec.ts
import { test as base, expect, seedUser, uid } from '../fixtures';
import type { Bug } from '../fixtures/bug-api';

// Every test starts with its own bug open in the edit modal and the delete confirmation showing.
const test = base.extend<{ bug: Bug }>({
  bug: async ({ bugApi, loginPage, boardPage, editBugModal, deleteConfirmModal }, use) => {
    const bug = await bugApi.create(`delete plan ${uid()}`);
    await loginPage.login(seedUser.username, seedUser.password);
    await boardPage.waitLoaded();
    await boardPage.openBug(bug.title);
    await editBugModal.delete();
    await expect(deleteConfirmModal.dialog).toBeVisible();
    await use(bug);
  },
});

test('1.3 Escape closes only the confirmation', async ({ bug, deleteConfirmModal, editBugModal, bugApi }) => {
  await deleteConfirmModal.pressEscape();

  await expect(deleteConfirmModal.dialog).toBeHidden();
  await expect(editBugModal.dialog).toBeVisible();
  expect(await bugApi.get(bug.id)).not.toBeNull();
});

test('1.4 A backdrop click keeps the confirmation open', async ({ bug, deleteConfirmModal, bugApi }) => {
  await deleteConfirmModal.clickBackdrop();

  await expect(deleteConfirmModal.dialog).toBeVisible();
  expect(await bugApi.get(bug.id)).not.toBeNull();
});

test('1.5 The confirmation takes focus', async ({ bug, deleteConfirmModal }) => {
  void bug;

  expect(await deleteConfirmModal.focusIsInside()).toBe(true);
});

test('2.3 Deleting from the Closed view keeps that view', async ({ bugApi, loginPage, boardPage, editBugModal, deleteConfirmModal }) => {
  const bug = await bugApi.create(`closed view delete ${uid()}`, { state: 'closed' });
  await loginPage.login(seedUser.username, seedUser.password);
  await boardPage.waitLoaded();
  await boardPage.showClosed();
  await boardPage.openBug(bug.title);
  await editBugModal.delete();

  await deleteConfirmModal.confirm();

  await expect(editBugModal.dialog).toBeHidden();
  expect(await bugApi.get(bug.id)).toBeNull();
  expect(await boardPage.filterBackground('closed')).not.toBe('rgba(0, 0, 0, 0)');
});

test('3.1 Clicking the row of a bug deleted elsewhere removes it or explains', async ({ bugApi, loginPage, boardPage, editBugModal }) => {
  const bug = await bugApi.create(`gone elsewhere ${uid()}`);
  await loginPage.login(seedUser.username, seedUser.password);
  await boardPage.waitLoaded();
  await bugApi.send('DELETE', `/api/bugs/${bug.id}`);

  await boardPage.openBug(bug.title);

  await expect
    .poll(async () => (await boardPage.rowCount(bug.title)) === 0 || (await editBugModal.errors.count()) > 0, { timeout: 3000 })
    .toBe(true);
});
