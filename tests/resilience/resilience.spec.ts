import { test, expect, defaultUser, PREFIX, uid } from '../fixtures';

test.beforeEach(async ({ loginPage, boardPage }) => {
  await loginPage.login(defaultUser.username, defaultUser.password);
  await boardPage.waitLoaded();
});

test('Escape during a pending save does not close the modal', async ({ boardPage, createBugModal, bugApi }) => {
  const title = `${PREFIX} escape while saving ${uid()}`;
  bugApi.expectTitle(title);
  await boardPage.delayBugWrites(1500);
  await boardPage.openNewBug();
  await expect(createBugModal.ownerInput).toHaveValue(defaultUser.username);
  await createBugModal.fill({ title, description: 'd' });
  await createBugModal.save();
  await expect(createBugModal.savingButton).toBeVisible();

  await createBugModal.pressEscape();

  await expect(createBugModal.dialog).toBeVisible();
  await expect(createBugModal.dialog).toBeHidden({ timeout: 10_000 });
  expect(await bugApi.findByTitle(title)).toHaveLength(1);
});

test('a slow response for an earlier row click does not replace the newer one', async ({ bugApi, boardPage, editBugModal }) => {
  const token = uid();
  const slow = await bugApi.create(`slow ${token}`);
  const fast = await bugApi.create(`fast ${token}`);
  await boardPage.reload();
  await boardPage.waitLoaded();
  await boardPage.delayBugRead(slow.id, 1500);

  await boardPage.openBug(slow.title);
  const slowArrives = boardPage.bugReadFinished(slow.id);
  await boardPage.openBug(fast.title);
  await expect(editBugModal.heading).toHaveText(`Edit bug #${fast.id}`);

  await slowArrives;

  await expect(editBugModal.heading).toHaveText(`Edit bug #${fast.id}`);
  await expect(editBugModal.titleInput).toHaveValue(fast.title);
});

test('a failed board load says so instead of "No bugs."', async ({ boardPage }) => {
  await boardPage.failBugList();

  await boardPage.reload();

  await expect(boardPage.loadError).toBeVisible();
  await expect(boardPage.noBugsMessage).toHaveCount(0);
});

test('logging out in one tab logs out the other', async ({ boardPage }) => {
  const otherTab = await boardPage.openInNewTab();

  await boardPage.logout();

  await expect(otherTab.page).toHaveURL(/\/login$/);
});

test('the header Close button is disabled while a save is pending', async ({ boardPage, createBugModal, bugApi }) => {
  const title = `${PREFIX} close while saving ${uid()}`;
  bugApi.expectTitle(title);
  await boardPage.delayBugWrites(1500);
  await boardPage.openNewBug();
  await expect(createBugModal.ownerInput).toHaveValue(defaultUser.username);
  await createBugModal.fill({ title, description: 'd' });

  await createBugModal.save();

  await expect(createBugModal.closeButton).toBeDisabled();
  await expect(createBugModal.dialog).toBeHidden({ timeout: 10_000 });
});

test('opening a bug deleted elsewhere says so on screen and drops the row', async ({ bugApi, boardPage }) => {
  const bug = await bugApi.create(`gone ${uid()}`);
  await boardPage.reload();
  await boardPage.waitLoaded();
  await bugApi.send('DELETE', `/api/bugs/${bug.id}`);

  await boardPage.openBug(bug.title);

  await expect(boardPage.noticeMessage).toHaveText('That bug no longer exists.');
  await expect.poll(() => boardPage.rowCount(bug.title)).toBe(0);
});

test('New Bug cancels a row open that is still loading', async ({ bugApi, boardPage, createBugModal, editBugModal }) => {
  const bug = await bugApi.create(`pending open ${uid()}`);
  await boardPage.reload();
  await boardPage.waitLoaded();
  await boardPage.delayBugRead(bug.id, 1500);
  await boardPage.openBug(bug.title);
  const slowArrives = boardPage.bugReadFinished(bug.id);

  await boardPage.openNewBug();
  await slowArrives;

  await expect(createBugModal.dialog).toBeVisible();
  await expect(editBugModal.dialog).toHaveCount(0);
});

test('holding Enter on New Bug opens a clean form', async ({ boardPage, createBugModal }) => {
  await boardPage.holdEnterOnNewBug();

  await expect(createBugModal.dialog).toBeVisible();
  await expect(createBugModal.errors).toHaveCount(0);
});
