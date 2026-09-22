import { test, expect } from '../pages/fixtures';
import { uid } from '../pages/api';
import type { BugApi } from '../pages/api';
import type { LoginPage } from '../pages/login-page';
import type { BoardPage } from '../pages/board-page';
import type { EditBugModal } from '../pages/edit-bug-modal';

async function openOwnBug(api: BugApi, loginPage: LoginPage, board: BoardPage, modal: EditBugModal, severity = 'mid') {
  const bug = await api.create(`edit ${uid()}`, severity, { description: 'original description' });
  await loginPage.login('buggy', '1970beetle');
  await board.waitLoaded();
  await board.openBug(bug.title);
  await expect(modal.dialog).toBeVisible();
  return bug;
}

test.describe('09 edit bug', () => {
  test('09-S1 row click opens "Edit bug #<id>" with all data and buttons', async ({ api, loginPage, board, editModal }) => {
    const bug = await openOwnBug(api, loginPage, board, editModal);
    await expect(editModal.heading).toHaveText(`Edit bug #${bug.id}`);
    await expect(editModal.id).toHaveValue(String(bug.id));
    await expect(editModal.title).toHaveValue(bug.title);
    await expect(editModal.severity).toHaveValue('mid');
    await expect(editModal.owner).toHaveValue(bug.owner);
    await expect(editModal.description).toHaveValue('original description');
    await expect(editModal.saveButton).toBeVisible();
    await expect(editModal.cancelButton).toBeVisible();
  });

  test('09-S2 ID is read-only, other fields editable', async ({ api, loginPage, board, editModal }) => {
    const bug = await openOwnBug(api, loginPage, board, editModal);
    await expect(editModal.id).not.toBeEditable();
    await editModal.id.pressSequentially('999', { timeout: 2000 }).catch(() => undefined);
    await expect(editModal.id).toHaveValue(String(bug.id));
    for (const l of [editModal.title, editModal.severity, editModal.owner, editModal.description]) await expect(l).toBeEditable();
  });

  test('09-S3 severity dropdown has HIGH/MID/LOW and colours match the board', async ({ api, loginPage, board, editModal }) => {
    await openOwnBug(api, loginPage, board, editModal, 'high');
    await expect(editModal.severity.locator('option')).toHaveText(['HIGH', 'MID', 'LOW']);
    const expected: Record<string, string> = { HIGH: 'rgb(184, 74, 46)', MID: 'rgb(166, 124, 71)', LOW: 'rgb(74, 107, 94)' };
    for (const label of ['HIGH', 'MID', 'LOW']) {
      await editModal.severity.selectOption({ label });
      await expect(editModal.severity).toHaveCSS('color', expected[label]);
    }
  });

  test('09-S4 backdrop click keeps modal open and preserves edits', async ({ api, loginPage, board, editModal }) => {
    await openOwnBug(api, loginPage, board, editModal);
    await editModal.description.fill('edited but unsaved');
    await editModal.clickBackdrop();
    await expect(editModal.dialog).toBeVisible();
    await expect(editModal.description).toHaveValue('edited but unsaved');
  });

  test('09-S5 save persists edits and closes modal', async ({ api, loginPage, board, editModal }) => {
    const bug = await openOwnBug(api, loginPage, board, editModal);
    const newTitle = `${bug.title} (edited)`;
    await editModal.title.fill(newTitle);
    await editModal.severity.selectOption({ label: 'LOW' });
    await editModal.owner.fill('vanny');
    await editModal.description.fill('new description');
    await editModal.saveButton.click();
    await expect(editModal.dialog).toBeHidden();
    expect(await api.get(bug.id)).toMatchObject({ title: newTitle, severity: 'LOW', owner: 'vanny', description: 'new description' });
    await expect(board.rowFor(newTitle)).toBeVisible();
  });

  for (const how of ['cancel', 'X', 'Escape'] as const) {
    test(`09-S${how === 'cancel' ? 6 : how === 'X' ? 7 : 8} closing via ${how} discards edits`, async ({ api, loginPage, board, editModal, page }) => {
      const bug = await openOwnBug(api, loginPage, board, editModal);
      await editModal.title.fill('should not persist');
      await editModal.severity.selectOption({ label: 'HIGH' });
      if (how === 'cancel') await editModal.cancelButton.click();
      else if (how === 'X') await editModal.closeX.click();
      else await page.keyboard.press('Escape');
      await expect(editModal.dialog).toBeHidden();
      expect(await api.get(bug.id)).toEqual(bug);
      await board.openBug(bug.title);
      await expect(editModal.title).toHaveValue(bug.title);
    });
  }

  test('09-S9 save disabled with no changes', async ({ api, loginPage, board, editModal }) => {
    await openOwnBug(api, loginPage, board, editModal);
    await expect(editModal.saveButton).toBeDisabled();
  });

  test('09-S9b save disabled again after reverting an edit', async ({ api, loginPage, board, editModal }) => {
    const bug = await openOwnBug(api, loginPage, board, editModal);
    await editModal.title.fill(`${bug.title}!`);
    await expect(editModal.saveButton).toBeEnabled();
    await editModal.title.fill(bug.title);
    await expect(editModal.saveButton).toBeDisabled();
  });

  for (const field of ['title', 'owner', 'description'] as const) {
    test(`09-S10 save disabled when ${field} is blanked`, async ({ api, loginPage, board, editModal }) => {
      const bug = await openOwnBug(api, loginPage, board, editModal);
      await editModal.severity.selectOption({ label: 'HIGH' });
      await expect(editModal.saveButton).toBeEnabled();
      await editModal[field].fill('  ');
      await expect(editModal.saveButton).toBeDisabled();
      await editModal[field].press('Enter').catch(() => undefined);
      await expect(editModal.dialog).toBeVisible();
      expect(await api.get(bug.id)).toEqual(bug);
    });
  }

  test('09-S10 severity cannot be blanked in the edit dropdown', async ({ api, loginPage, board, editModal }) => {
    await openOwnBug(api, loginPage, board, editModal);
    const values = await editModal.severity.locator('option').evaluateAll((o) => o.map((x) => (x as HTMLOptionElement).value));
    expect(values).toEqual(['high', 'mid', 'low']);
  });
});
