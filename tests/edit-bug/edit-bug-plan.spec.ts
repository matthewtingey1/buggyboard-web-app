// spec: specs/testing/edit-bug-test-plan.md
// seed: tests/seed.spec.ts
import { test, expect, seedUser, uid } from '../fixtures';

async function openBoard(loginPage: import('../pages/login-page').LoginPage, boardPage: import('../pages/board-page').BoardPage) {
  await loginPage.login(seedUser.username, seedUser.password);
  await boardPage.waitLoaded();
}

test('1.2 Title has focus when the modal opens', async ({ bugApi, loginPage, boardPage, editBugModal }) => {
  const bug = await bugApi.create(`focus ${uid()}`);
  await openBoard(loginPage, boardPage);

  await boardPage.openBug(bug.title);

  await expect(editBugModal.titleInput).toBeFocused();
});

test('1.5 Opening a second bug shows its data from the first frame', async ({ bugApi, loginPage, boardPage, editBugModal }) => {
  const token = uid();
  const first = await bugApi.create(`first ${token}`);
  const second = await bugApi.create(`second ${token}`);
  await openBoard(loginPage, boardPage);
  await boardPage.openBug(first.title);
  await expect(editBugModal.titleInput).toHaveValue(first.title);
  await editBugModal.pressEscape();

  await boardPage.openBug(second.title);

  expect(await editBugModal.titleInput.inputValue()).toBe(second.title);
});

test('2.3 Enter in Title saves the edit', async ({ bugApi, loginPage, boardPage, editBugModal }) => {
  const bug = await bugApi.create(`enter saves ${uid()}`);
  await openBoard(loginPage, boardPage);
  await boardPage.openBug(bug.title);
  await editBugModal.fill({ description: 'saved with Enter' });

  await editBugModal.pressEnterIn('title');

  await expect(editBugModal.dialog).toBeHidden();
  expect((await bugApi.get(bug.id))?.description).toBe('saved with Enter');
});

test('2.4 Enter in Description adds a line instead of saving', async ({ bugApi, loginPage, boardPage, editBugModal }) => {
  const bug = await bugApi.create(`enter newline ${uid()}`);
  await openBoard(loginPage, boardPage);
  await boardPage.openBug(bug.title);
  await editBugModal.fill({ description: 'first line' });

  await editBugModal.pressEnterIn('description');

  await expect(editBugModal.dialog).toBeVisible();
  await expect(editBugModal.descriptionInput).toHaveValue('first line\n');
});

test('3.4 A trailing-space-only change does not enable Save', async ({ bugApi, loginPage, boardPage, editBugModal }) => {
  const bug = await bugApi.create(`trailing space ${uid()}`);
  await openBoard(loginPage, boardPage);
  await boardPage.openBug(bug.title);

  await editBugModal.fill({ title: `${bug.title} ` });

  await expect(editBugModal.saveButton).toBeDisabled();
});

test('5.1 Saving a bug deleted elsewhere shows "Bug not found."', async ({ bugApi, loginPage, boardPage, editBugModal }) => {
  const bug = await bugApi.create(`deleted elsewhere ${uid()}`);
  await openBoard(loginPage, boardPage);
  await boardPage.openBug(bug.title);
  await bugApi.send('DELETE', `/api/bugs/${bug.id}`);
  await editBugModal.fill({ description: 'too late' });

  await editBugModal.save();

  await expect(editBugModal.errors).toContainText('Bug not found.');
  expect(await bugApi.get(bug.id)).toBeNull();
});

test('3.5 A title of only a zero-width space keeps Save disabled and says why', async ({ bugApi, loginPage, boardPage, editBugModal }) => {
  const bug = await bugApi.create(`zero width edit ${uid()}`);
  await openBoard(loginPage, boardPage);
  await boardPage.openBug(bug.title);

  await editBugModal.fill({ title: '\u200B' });

  await expect(editBugModal.saveButton).toBeDisabled();
  await expect(editBugModal.blankHint).toHaveText('Title is required to save.');
});
