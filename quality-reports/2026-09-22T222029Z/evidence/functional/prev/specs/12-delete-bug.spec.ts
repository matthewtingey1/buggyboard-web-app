import { test, expect } from '../pages/fixtures';
import { uid } from '../pages/api';

test.describe('12 delete bug', () => {
  test.beforeEach(async ({ api, loginPage, board, editModal }, info) => {
    const bug = await api.create(`delete ${uid()}`, 'mid');
    info.annotations.push({ type: 'bugId', description: String(bug.id) });
    await loginPage.login('buggy', '1970beetle');
    await board.waitLoaded();
    await board.openBug(bug.title);
    await expect(editModal.dialog).toBeVisible();
  });

  const bugId = (info: { annotations: Array<{ type: string; description?: string }> }) => Number(info.annotations.find((a) => a.type === 'bugId')!.description);

  test('12-S1 edit modal shows a Delete button', async ({ editModal }) => {
    await expect(editModal.deleteButton).toBeVisible();
  });

  test('12-S2 Delete opens confirmation naming bug id and title', async ({ editModal, confirmDelete, api }, info) => {
    const bug = (await api.get(bugId(info)))!;
    await editModal.deleteButton.click();
    await expect(confirmDelete.dialog).toBeVisible();
    await expect(confirmDelete.message).toHaveText(`Are you sure you want to delete bug #${bug.id}: ${bug.title}?`);
    await expect(confirmDelete.deleteButton).toBeVisible();
    await expect(confirmDelete.cancelButton).toBeVisible();
    expect(await api.get(bug.id)).not.toBeNull();
  });

  test('12-S3 confirming removes bug and closes both modals', async ({ editModal, confirmDelete, api, board }, info) => {
    const bug = (await api.get(bugId(info)))!;
    await editModal.deleteButton.click();
    await confirmDelete.deleteButton.click();
    await expect(confirmDelete.dialog).toBeHidden();
    await expect(editModal.dialog).toBeHidden();
    expect(await api.get(bug.id)).toBeNull();
    await expect(board.rowFor(bug.title)).toHaveCount(0);
  });

  test('12-S4 cancelling confirmation returns to edit modal with bug intact', async ({ editModal, confirmDelete, api, board }, info) => {
    const bug = (await api.get(bugId(info)))!;
    await editModal.deleteButton.click();
    await confirmDelete.cancelButton.click();
    await expect(confirmDelete.dialog).toBeHidden();
    await expect(editModal.dialog).toBeVisible();
    await expect(editModal.title).toHaveValue(bug.title);
    expect(await api.get(bug.id)).toEqual(bug);
    await expect(board.rowFor(bug.title)).toHaveCount(1);
  });
});
