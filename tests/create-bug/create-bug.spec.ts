import { test, expect, defaultUser, severityColors, PREFIX, uid } from '../fixtures';

test.beforeEach(async ({ loginPage, boardPage }) => {
  await loginPage.login(defaultUser.username, defaultUser.password);
  await boardPage.waitLoaded();
});

test('New Bug opens the create modal with every field and button', async ({ boardPage, createBugModal }) => {
  await boardPage.openNewBug();

  await expect(createBugModal.dialog).toBeVisible();
  for (const control of [
    createBugModal.titleInput,
    createBugModal.severitySelect,
    createBugModal.ownerInput,
    createBugModal.descriptionInput,
    createBugModal.saveButton,
    createBugModal.cancelButton,
  ]) {
    await expect(control).toBeVisible();
  }
  await expect(createBugModal.severitySelect.locator('option')).toHaveText(['HIGH', 'MID', 'LOW']);
});

test('owner defaults to the current user', async ({ boardPage, createBugModal }) => {
  await boardPage.openNewBug();

  await expect(createBugModal.ownerInput).toHaveValue(defaultUser.username);
});

test('saving a complete bug persists it and closes the modal', async ({ boardPage, createBugModal, bugApi }) => {
  const title = `${PREFIX} saved ${uid()}`;
  bugApi.expectTitle(title);
  await boardPage.openNewBug();
  await expect(createBugModal.ownerInput).toHaveValue(defaultUser.username);
  await createBugModal.fill({ title, severity: 'HIGH', description: 'When I use < and > in my password, login fails.' });

  await createBugModal.save();

  await expect(createBugModal.dialog).toBeHidden();
  const [saved] = await bugApi.findByTitle(title);
  expect(saved).toMatchObject({
    title,
    severity: 'HIGH',
    owner: defaultUser.username,
    description: 'When I use < and > in my password, login fails.',
  });
});

test('a created bug appears on the board without a reload', async ({ boardPage, createBugModal, bugApi }) => {
  const title = `${PREFIX} appears ${uid()}`;
  bugApi.expectTitle(title);
  await boardPage.openNewBug();
  await createBugModal.fill({ title, severity: 'LOW', description: 'd' });

  await createBugModal.save();

  await expect.poll(() => boardPage.rowCount(title)).toBe(1);
});

for (const how of ['Cancel', 'the X button', 'Escape'] as const) {
  test(`closing with ${how} does not save the bug`, async ({ boardPage, createBugModal, bugApi }) => {
    const title = `${PREFIX} discarded ${uid()}`;
    bugApi.expectTitle(title);
    await boardPage.openNewBug();
    await createBugModal.fill({ title, severity: 'MID', description: 'd' });

    if (how === 'Cancel') await createBugModal.cancel();
    else if (how === 'the X button') await createBugModal.close();
    else await createBugModal.pressEscape();

    await expect(createBugModal.dialog).toBeHidden();
    expect(await bugApi.findByTitle(title)).toHaveLength(0);
  });
}

test('clicking the backdrop keeps the modal open and its data', async ({ boardPage, createBugModal, bugApi }) => {
  const title = `${PREFIX} backdrop ${uid()}`;
  bugApi.expectTitle(title);
  await boardPage.openNewBug();
  await createBugModal.fill({ title, severity: 'LOW', description: 'kept' });

  await createBugModal.clickBackdrop();

  await expect(createBugModal.dialog).toBeVisible();
  await expect(createBugModal.titleInput).toHaveValue(title);
  await expect(createBugModal.severitySelect).toHaveValue('low');
  await expect(createBugModal.descriptionInput).toHaveValue('kept');
  expect(await bugApi.findByTitle(title)).toHaveLength(0);
});

test('saving with every field blank names each required field', async ({ boardPage, createBugModal }) => {
  await boardPage.openNewBug();
  await expect(createBugModal.ownerInput).toHaveValue(defaultUser.username);
  await createBugModal.fill({ owner: '' });

  await createBugModal.save();

  await expect(createBugModal.dialog).toBeVisible();
  await expect(createBugModal.errors).toContainText('Title is required.');
  await expect(createBugModal.errors).toContainText('Owner is required.');
  await expect(createBugModal.errors).toContainText('Description is required.');
});

for (const field of ['title', 'owner', 'description'] as const) {
  test(`a whitespace-only ${field} blocks saving`, async ({ boardPage, createBugModal, bugApi }) => {
    const token = uid();
    bugApi.expectTitle(`${PREFIX} blank ${token}`);
    await boardPage.openNewBug();
    await expect(createBugModal.ownerInput).toHaveValue(defaultUser.username);
    await createBugModal.fill({
      title: `${PREFIX} blank ${token}`,
      severity: 'MID',
      owner: defaultUser.username,
      description: `blank ${token}`,
      [field]: '   ',
    });

    await createBugModal.save();

    await expect(createBugModal.dialog).toBeVisible();
    await expect(createBugModal.errors).toBeVisible();
    expect(await bugApi.findContaining(token)).toHaveLength(0);
  });
}

test('severity has no blank option in the create modal', async ({ boardPage, createBugModal }) => {
  await boardPage.openNewBug();

  expect(await createBugModal.severityOptionValues()).toEqual(['high', 'mid', 'low']);
});

test('the API rejects a bug with a blank severity', async ({ bugApi }) => {
  const res = await bugApi.createRaw({ title: `${PREFIX} no severity ${uid()}`, severity: '', owner: 'buggy', description: 'd' });

  expect(res.status()).toBe(400);
});

for (const severity of ['HIGH', 'MID', 'LOW'] as const) {
  test(`selected ${severity} severity is shown in its severity colour`, async ({ boardPage, createBugModal }) => {
    await boardPage.openNewBug();

    await createBugModal.fill({ severity });

    await expect(createBugModal.severitySelect).toHaveCSS('color', severityColors[severity]);
  });
}
