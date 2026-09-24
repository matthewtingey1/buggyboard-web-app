import { test, expect, buggy, uid, PREFIX } from '../fixtures';

test.beforeEach(async ({ loginPage, boardPage }) => {
  await loginPage.login(buggy.username, buggy.password);
  await boardPage.waitLoaded();
});

async function openSettled(boardPage: any, createBugModal: any) {
  await boardPage.openNewBug();
  await expect(createBugModal.ownerInput).toHaveValue(buggy.username);
}

test('C1.2 Title has focus when the create modal opens', async ({ boardPage, createBugModal }) => {
  await openSettled(boardPage, createBugModal);
  await expect(createBugModal.titleInput).toBeFocused();
});

test('C1.3 Severity defaults to MID', async ({ boardPage, createBugModal }) => {
  await openSettled(boardPage, createBugModal);
  await expect(createBugModal.severitySelect).toHaveValue('mid');
});

test('C1.5 / functional-04 reopened modal is clean from the first frame (no stale draft)', async ({ page, boardPage, createBugModal }) => {
  await openSettled(boardPage, createBugModal);
  await createBugModal.fill({ title: 'stale draft', owner: '' });
  await createBugModal.pressEscape();
  await expect(createBugModal.dialog).toBeHidden();

  await boardPage.openNewBug();
  const first = await page.evaluate(() => {
    const t = document.getElementById('bug-title') as HTMLInputElement | null;
    const o = document.getElementById('bug-owner') as HTMLInputElement | null;
    return { title: t?.value, owner: o?.value };
  });
  expect(first).toEqual({ title: '', owner: buggy.username });
});

test('functional-04 clearing Owner immediately after open is not overwritten', async ({ page, boardPage, createBugModal }) => {
  await boardPage.openNewBug();
  await createBugModal.ownerInput.fill('');
  await page.waitForTimeout(500);
  await expect(createBugModal.ownerInput).toHaveValue('');
});

test('C2.4 Enter in Title submits and saves', async ({ boardPage, createBugModal, bugApi }) => {
  const token = uid();
  await openSettled(boardPage, createBugModal);
  await createBugModal.fill({ description: 'd', title: `${PREFIX} enter ${token}` });
  await createBugModal.titleInput.press('Enter');
  await expect(createBugModal.dialog).toBeHidden();
  await expect.poll(async () => (await bugApi.findContaining(token)).length).toBe(1);
});

test('C2.5 padded title/owner/description are saved trimmed (UI path)', async ({ boardPage, createBugModal, bugApi }) => {
  const token = uid();
  await openSettled(boardPage, createBugModal);
  await createBugModal.fill({ title: `   ${PREFIX} trim ${token}   `, owner: '  vanny  ', description: '  body  ' });
  await createBugModal.save();
  await expect(createBugModal.dialog).toBeHidden();
  await expect.poll(async () => (await bugApi.findContaining(token)).length).toBe(1);
  const [bug] = await bugApi.findContaining(token);
  expect(bug).toMatchObject({ title: `${PREFIX} trim ${token}`, owner: 'vanny', description: 'body' });
  await expect.poll(() => boardPage.rowCount(`${PREFIX} trim ${token}`)).toBe(1);
});

test('C2.6 Save shows "Saving…" and disables the form while the POST is in flight', async ({ page, boardPage, createBugModal, bugApi }) => {
  const token = uid();
  await page.route('**/api/bugs', async (route) => {
    if (route.request().method() === 'POST') await new Promise((r) => setTimeout(r, 1500));
    await route.continue();
  });
  await openSettled(boardPage, createBugModal);
  await createBugModal.fill({ title: `${PREFIX} slow ${token}`, description: 'd' });
  await createBugModal.save();
  await expect(createBugModal.dialog.getByRole('button', { name: 'Saving…' })).toBeDisabled();
  await expect(createBugModal.titleInput).toBeDisabled();
  await expect(createBugModal.descriptionInput).toBeDisabled();
  await expect(createBugModal.dialog).toBeHidden({ timeout: 10000 });
  await expect.poll(async () => (await bugApi.findContaining(token)).length).toBe(1);
});

test('C4.4 validation errors are gone when the modal is reopened', async ({ boardPage, createBugModal }) => {
  await openSettled(boardPage, createBugModal);
  await createBugModal.save();
  await expect(createBugModal.errors).toBeVisible();
  await createBugModal.pressEscape();
  await openSettled(boardPage, createBugModal);
  await expect(createBugModal.errors).toHaveCount(0);
});

test('06-S8 blank Title alone names only "Title is required."', async ({ boardPage, createBugModal }) => {
  await openSettled(boardPage, createBugModal);
  await createBugModal.fill({ description: 'd' });
  await createBugModal.save();
  await expect(createBugModal.errors).toHaveText('Title is required.');
});

test('C5.1 server rejection (oversized description) keeps the modal open and the draft', async ({ boardPage, createBugModal, bugApi }) => {
  const token = uid();
  const big = 'x'.repeat(120_000);
  await openSettled(boardPage, createBugModal);
  await createBugModal.fill({ title: `${PREFIX} big ${token}`, description: big });
  await createBugModal.save();
  await expect(createBugModal.errors).toBeVisible();
  await expect(createBugModal.dialog).toBeVisible();
  await expect(createBugModal.titleInput).toHaveValue(`${PREFIX} big ${token}`);
  expect((await createBugModal.descriptionInput.inputValue()).length).toBe(120_000);
  expect(await bugApi.findContaining(token)).toHaveLength(0);
  test.info().annotations.push({ type: 'alert', description: (await createBugModal.errors.textContent()) ?? '' });
});

test('C5.2 network failure shows "Something went wrong" and keeps the draft', async ({ page, boardPage, createBugModal }) => {
  const token = uid();
  await page.route('**/api/bugs', (route) => (route.request().method() === 'POST' ? route.abort() : route.continue()));
  await openSettled(boardPage, createBugModal);
  await createBugModal.fill({ title: `${PREFIX} net ${token}`, description: 'd' });
  await createBugModal.save();
  await expect(createBugModal.errors).toHaveText('Something went wrong. Please try again.');
  await expect(createBugModal.titleInput).toHaveValue(`${PREFIX} net ${token}`);
});

test('C6.1 creating from the Closed view saves as Open and shows only under Open', async ({ boardPage, createBugModal, bugApi }) => {
  const token = uid();
  const title = `${PREFIX} from closed ${token}`;
  await boardPage.showClosed();
  await openSettled(boardPage, createBugModal);
  await createBugModal.fill({ title, description: 'd' });
  await createBugModal.save();
  await expect(createBugModal.dialog).toBeHidden();
  await expect.poll(async () => (await bugApi.findContaining(token))[0]?.state).toBe('OPEN');
  expect(await boardPage.filterBackground('closed')).not.toBe('rgba(0, 0, 0, 0)');
  expect(await boardPage.rowCount(title)).toBe(0);
  await boardPage.showOpen();
  await expect.poll(() => boardPage.rowCount(title)).toBe(1);
});

test('C6.2 active search text is kept after creating a bug', async ({ boardPage, createBugModal, bugApi }) => {
  const token = uid();
  await boardPage.search(token);
  await openSettled(boardPage, createBugModal);
  await createBugModal.fill({ title: `${PREFIX} searched ${token}`, description: 'd' });
  await createBugModal.save();
  await expect(createBugModal.dialog).toBeHidden();
  await expect(boardPage.searchInput).toHaveValue(token);
  await expect.poll(() => boardPage.rowCount(`${PREFIX} searched ${token}`)).toBe(1);
  await bugApi.findContaining(token);
});
