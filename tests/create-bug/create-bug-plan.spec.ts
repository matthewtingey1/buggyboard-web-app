// spec: specs/testing/create-bug-test-plan.md
// seed: tests/seed.spec.ts
import { test, expect, seedUser, PREFIX, uid } from '../fixtures';

test.beforeEach(async ({ loginPage, boardPage }) => {
  await loginPage.login(seedUser.username, seedUser.password);
  await boardPage.waitLoaded();
});

// Waits for the owner default, so a test never types before the modal is ready.
async function openSettled(boardPage: import('../pages/board-page').BoardPage, modal: import('../pages/create-bug-modal').CreateBugModal) {
  await boardPage.openNewBug();
  await expect(modal.ownerInput).toHaveValue(seedUser.username);
  await expect(modal.titleInput).toHaveValue('');
}

test('1.2 Title has focus when the modal opens', async ({ boardPage, createBugModal }) => {
  await boardPage.openNewBug();

  await expect(createBugModal.titleInput).toBeFocused();
});

test('1.3 Severity defaults to MID', async ({ boardPage, createBugModal }) => {
  await boardPage.openNewBug();

  await expect(createBugModal.severitySelect).toHaveValue('mid');
});

test('1.5 Reopening starts clean from the first frame', async ({ boardPage, createBugModal }) => {
  await openSettled(boardPage, createBugModal);
  await createBugModal.fill({ title: 'left over' });
  await createBugModal.pressEscape();

  await boardPage.openNewBug();

  expect(await createBugModal.titleInput.inputValue()).toBe('');
});

test('2.4 Enter in Title submits the bug', async ({ boardPage, createBugModal, bugApi }) => {
  const title = `${PREFIX} enter submits ${uid()}`;
  bugApi.expectTitle(title);
  await openSettled(boardPage, createBugModal);
  await createBugModal.fill({ title, description: 'submitted with Enter' });

  await createBugModal.pressEnterIn('title');

  await expect(createBugModal.dialog).toBeHidden();
  expect(await bugApi.findByTitle(title)).toHaveLength(1);
});

test('2.5 Leading and trailing whitespace is trimmed', async ({ boardPage, createBugModal, bugApi }) => {
  const title = `${PREFIX} trimmed ${uid()}`;
  bugApi.expectTitle(title);
  await openSettled(boardPage, createBugModal);
  await createBugModal.fill({ title: `   ${title}  `, owner: '  vanny ', description: '  padded  ' });

  await createBugModal.save();

  await expect(createBugModal.dialog).toBeHidden();
  const [saved] = await bugApi.findByTitle(title);
  expect(saved).toMatchObject({ title, owner: 'vanny', description: 'padded' });
  await expect.poll(() => boardPage.rowCount(title)).toBe(1);
});

test('2.6 Save shows progress and locks the form', async ({ boardPage, createBugModal, bugApi }) => {
  const title = `${PREFIX} slow save ${uid()}`;
  bugApi.expectTitle(title);
  await boardPage.delayBugWrites(1500);
  await openSettled(boardPage, createBugModal);
  await createBugModal.fill({ title, description: 'slow' });

  await createBugModal.save();

  await expect(createBugModal.savingButton).toBeVisible();
  await expect(createBugModal.titleInput).toBeDisabled();
  await expect(createBugModal.dialog).toBeHidden({ timeout: 10_000 });
});

test('4.4 Errors clear when the modal is reopened', async ({ boardPage, createBugModal }) => {
  await openSettled(boardPage, createBugModal);
  await createBugModal.save();
  await expect(createBugModal.errors).toBeVisible();
  await createBugModal.pressEscape();

  await openSettled(boardPage, createBugModal);

  await expect(createBugModal.errors).toHaveCount(0);
});

test('5.1 A server rejection keeps the draft', async ({ boardPage, createBugModal, bugApi }) => {
  const title = `${PREFIX} oversize ${uid()}`;
  bugApi.expectTitle(title);
  const description = 'x'.repeat(120_000);
  await openSettled(boardPage, createBugModal);
  await createBugModal.fill({ title, description });

  await createBugModal.save();

  await expect(createBugModal.errors).toHaveText('The request body is too large.');
  await expect(createBugModal.dialog).toBeVisible();
  expect((await createBugModal.descriptionInput.inputValue()).length).toBe(description.length);
});

test('5.2 A network failure keeps the draft', async ({ boardPage, createBugModal, bugApi }) => {
  const title = `${PREFIX} offline ${uid()}`;
  bugApi.expectTitle(title);
  await boardPage.abortBugWrites();
  await openSettled(boardPage, createBugModal);
  await createBugModal.fill({ title, description: 'kept' });

  await createBugModal.save();

  await expect(createBugModal.errors).toHaveText('Something went wrong. Please try again.');
  await expect(createBugModal.descriptionInput).toHaveValue('kept');
});

test('5.3 A double submit creates one bug', async ({ boardPage, createBugModal, bugApi }) => {
  const title = `${PREFIX} double submit ${uid()}`;
  bugApi.expectTitle(title);
  await openSettled(boardPage, createBugModal);
  await createBugModal.fill({ title, description: 'twice' });

  await createBugModal.submitTwiceSynchronously();

  await expect(createBugModal.dialog).toBeHidden();
  await expect.poll(async () => (await bugApi.findByTitle(title)).length).toBeGreaterThan(0);
  expect(await bugApi.findByTitle(title)).toHaveLength(1);
});

test('6.1 A bug created from the Closed view is Open and appears under Open', async ({ boardPage, createBugModal, bugApi }) => {
  const title = `${PREFIX} from closed view ${uid()}`;
  bugApi.expectTitle(title);
  await boardPage.showClosed();
  await openSettled(boardPage, createBugModal);
  await createBugModal.fill({ title, description: 'd' });

  await createBugModal.save();

  await expect(createBugModal.dialog).toBeHidden();
  expect((await bugApi.findByTitle(title))[0]?.state).toBe('OPEN');
  expect(await boardPage.rowCount(title)).toBe(0);
  await boardPage.showOpen();
  await expect.poll(() => boardPage.rowCount(title)).toBe(1);
});

test('6.2 An active search is kept after creating a bug', async ({ boardPage, createBugModal, bugApi }) => {
  const title = `${PREFIX} during search ${uid()}`;
  bugApi.expectTitle(title);
  const query = `zzq-${uid()}`;
  await boardPage.search(query);
  await openSettled(boardPage, createBugModal);
  await createBugModal.fill({ title, description: 'd' });

  await createBugModal.save();

  await expect(createBugModal.dialog).toBeHidden();
  await expect(boardPage.searchInput).toHaveValue(query);
});
