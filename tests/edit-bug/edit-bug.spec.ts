import { test as base, expect, defaultUser, severityColors, uid } from '../fixtures';
import type { Bug } from '../fixtures/bug-api';

// Every edit test starts with its own bug open in the edit modal.
const test = base.extend<{ bug: Bug }>({
  bug: async ({ bugApi, loginPage, boardPage, editBugModal }, use) => {
    const bug = await bugApi.create(`edit ${uid()}`, { description: 'original description' });
    await loginPage.login(defaultUser.username, defaultUser.password);
    await boardPage.waitLoaded();
    await boardPage.openBug(bug.title);
    await expect(editBugModal.dialog).toBeVisible();
    await use(bug);
  },
});

test('clicking a row opens "Edit bug #<id>" with the bug\'s data', async ({ bug, editBugModal }) => {
  await expect(editBugModal.heading).toHaveText(`Edit bug #${bug.id}`);
  await expect(editBugModal.idInput).toHaveValue(String(bug.id));
  await expect(editBugModal.titleInput).toHaveValue(bug.title);
  await expect(editBugModal.severitySelect).toHaveValue('mid');
  await expect(editBugModal.ownerInput).toHaveValue(bug.owner);
  await expect(editBugModal.descriptionInput).toHaveValue('original description');
  await expect(editBugModal.saveButton).toBeVisible();
  await expect(editBugModal.cancelButton).toBeVisible();
});

test('the ID field is read-only', async ({ bug, editBugModal }) => {
  await editBugModal.typeIntoId('999');

  await expect(editBugModal.idInput).not.toBeEditable();
  await expect(editBugModal.idInput).toHaveValue(String(bug.id));
});

test('title, severity, owner and description are editable', async ({ bug, editBugModal }) => {
  void bug;
  for (const field of [editBugModal.titleInput, editBugModal.severitySelect, editBugModal.ownerInput, editBugModal.descriptionInput]) {
    await expect(field).toBeEditable();
  }
});

test('severity offers HIGH, MID and LOW and no blank option', async ({ bug, editBugModal }) => {
  void bug;
  await expect(editBugModal.severitySelect.locator('option')).toHaveText(['HIGH', 'MID', 'LOW']);
  expect(await editBugModal.severityOptionValues()).toEqual(['high', 'mid', 'low']);
});

for (const severity of ['HIGH', 'MID', 'LOW'] as const) {
  test(`selected ${severity} severity is shown in its board colour`, async ({ bug, editBugModal }) => {
    void bug;
    await editBugModal.fill({ severity });

    await expect(editBugModal.severitySelect).toHaveCSS('color', severityColors[severity]);
  });
}

test('clicking the backdrop keeps the modal open and its edits', async ({ bug, editBugModal }) => {
  void bug;
  await editBugModal.fill({ description: 'edited but unsaved' });

  await editBugModal.clickBackdrop();

  await expect(editBugModal.dialog).toBeVisible();
  await expect(editBugModal.descriptionInput).toHaveValue('edited but unsaved');
});

test('saving persists every edited field and closes the modal', async ({ bug, editBugModal, bugApi, boardPage }) => {
  const newTitle = `${bug.title} (edited)`;
  await editBugModal.fill({ title: newTitle, severity: 'LOW', owner: 'vanny', description: 'new description' });

  await editBugModal.save();

  await expect(editBugModal.dialog).toBeHidden();
  expect(await bugApi.get(bug.id)).toMatchObject({ title: newTitle, severity: 'LOW', owner: 'vanny', description: 'new description' });
  await expect.poll(() => boardPage.rowCount(newTitle)).toBe(1);
});

for (const how of ['Cancel', 'the X button', 'Escape'] as const) {
  test(`closing with ${how} discards the edits`, async ({ bug, editBugModal, bugApi }) => {
    await editBugModal.fill({ title: 'should not persist', severity: 'HIGH' });

    if (how === 'Cancel') await editBugModal.cancel();
    else if (how === 'the X button') await editBugModal.close();
    else await editBugModal.pressEscape();

    await expect(editBugModal.dialog).toBeHidden();
    expect(await bugApi.get(bug.id)).toEqual(bug);
  });
}

test('Save is disabled when nothing has changed', async ({ bug, editBugModal }) => {
  void bug;
  await expect(editBugModal.saveButton).toBeDisabled();
});

test('Save is disabled again after an edit is reverted', async ({ bug, editBugModal }) => {
  await editBugModal.fill({ title: `${bug.title}!` });
  await expect(editBugModal.saveButton).toBeEnabled();

  await editBugModal.fill({ title: bug.title });

  await expect(editBugModal.saveButton).toBeDisabled();
});

for (const field of ['title', 'owner', 'description'] as const) {
  test(`Save is disabled when ${field} is blanked`, async ({ bug, editBugModal, bugApi }) => {
    await editBugModal.fill({ severity: 'HIGH' });
    await expect(editBugModal.saveButton).toBeEnabled();

    await editBugModal.fill({ [field]: '  ' });

    await expect(editBugModal.saveButton).toBeDisabled();
    expect(await bugApi.get(bug.id)).toEqual(bug);
  });
}
