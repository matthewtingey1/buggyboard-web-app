import { test, expect, defaultUser, uid } from '../fixtures';

const payload = '<img src=x onerror="window.__xss=true">';

test('script in a bug title renders as text on the board', async ({ bugApi, loginPage, boardPage }) => {
  const bug = await bugApi.create(`${payload} ${uid()}`, { owner: payload, description: payload });

  await loginPage.login(defaultUser.username, defaultUser.password);
  await boardPage.waitLoaded();

  expect(await boardPage.rowCount(bug.title)).toBe(1);
  expect(await boardPage.scriptInjectionFired()).toBe(false);
});

test('script in bug fields renders as text in the edit modal', async ({ bugApi, loginPage, boardPage, editBugModal }) => {
  const bug = await bugApi.create(`${payload} ${uid()}`, { owner: payload, description: payload });
  await loginPage.login(defaultUser.username, defaultUser.password);
  await boardPage.waitLoaded();

  await boardPage.openBug(bug.title);

  await expect(editBugModal.descriptionInput).toHaveValue(payload);
  expect(await boardPage.scriptInjectionFired()).toBe(false);
});

test('script in a bug title renders as text in the delete confirmation', async ({ bugApi, loginPage, boardPage, editBugModal, deleteConfirmModal }) => {
  const bug = await bugApi.create(`${payload} ${uid()}`);
  await loginPage.login(defaultUser.username, defaultUser.password);
  await boardPage.waitLoaded();
  await boardPage.openBug(bug.title);

  await editBugModal.delete();

  await expect(deleteConfirmModal.message).toContainText(payload);
  expect(await boardPage.scriptInjectionFired()).toBe(false);
});

test('a forged session for a user that does not exist is refused', async ({ loginPage, boardPage }) => {
  test.fail(true, 'Known security defect: the session is an unsigned localStorage value, so any name opens the board.');
  await loginPage.forgeSession('no-such-user');

  await boardPage.visit('/board');

  await expect(boardPage.page).toHaveURL(/\/login$/);
});
