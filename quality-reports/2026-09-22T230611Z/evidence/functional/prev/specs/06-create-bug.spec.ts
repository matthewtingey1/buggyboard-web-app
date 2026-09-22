import { test, expect } from '../pages/fixtures';
import { PREFIX, uid } from '../pages/api';

const valid = (t: string) => ({ title: `${PREFIX} ${t}`, severity: 'HIGH', owner: 'buggy', description: `desc ${t}` });

test.describe('06 create bug', () => {
  test('06-S1 New Bug opens modal with all fields and buttons', async ({ signedIn, createModal }) => {
    await signedIn.newBugButton.click();
    await expect(createModal.dialog).toBeVisible();
    for (const l of [createModal.title, createModal.severity, createModal.owner, createModal.description, createModal.saveButton, createModal.cancelButton]) {
      await expect(l).toBeVisible();
    }
    await expect(createModal.severity.locator('option')).toHaveText(['HIGH', 'MID', 'LOW']);
  });

  test('06-S2 owner defaults to the current user', async ({ signedIn, createModal }) => {
    await signedIn.newBugButton.click();
    await expect(createModal.owner).toHaveValue('buggy');
  });

  test('06-S3 save with all fields persists the bug and closes the modal', async ({ signedIn, createModal, api }) => {
    const title = `${PREFIX} Login fails with special characters ${uid()}`;
    await signedIn.newBugButton.click();
    await createModal.fill({ title, severity: 'HIGH', description: 'When I use < and > in my password, login fails.' });
    await createModal.saveButton.click();
    await expect(createModal.dialog).toBeHidden();
    const [saved] = await api.findByTitle(title);
    if (saved) api.track(saved.id);
    expect(saved).toMatchObject({ title, severity: 'HIGH', owner: 'buggy', description: 'When I use < and > in my password, login fails.' });
  });

  test('06-S3b created bug appears on the board without reload', async ({ signedIn, createModal, api }) => {
    const title = `${PREFIX} appears ${uid()}`;
    await signedIn.newBugButton.click();
    await createModal.fill({ ...valid('x'), title });
    await createModal.saveButton.click();
    await expect(signedIn.rowFor(title)).toBeVisible();
    const [saved] = await api.findByTitle(title);
    if (saved) api.track(saved.id);
  });

  for (const how of ['cancel', 'X', 'Escape'] as const) {
    test(`06-S${how === 'cancel' ? 4 : how === 'X' ? 5 : 6} closing via ${how} does not save`, async ({ signedIn, createModal, api, page }) => {
      const title = `${PREFIX} discard-${how} ${uid()}`;
      await signedIn.newBugButton.click();
      await createModal.fill({ ...valid('x'), title });
      if (how === 'cancel') await createModal.cancelButton.click();
      else if (how === 'X') await createModal.closeX.click();
      else await page.keyboard.press('Escape');
      await expect(createModal.dialog).toBeHidden();
      expect(await api.findByTitle(title)).toHaveLength(0);
    });
  }

  test('06-S7 backdrop click keeps modal open and preserves data', async ({ signedIn, createModal, api }) => {
    const title = `${PREFIX} backdrop ${uid()}`;
    await signedIn.newBugButton.click();
    await createModal.fill({ title, severity: 'LOW', description: 'kept' });
    await createModal.clickBackdrop();
    await expect(createModal.dialog).toBeVisible();
    await expect(createModal.title).toHaveValue(title);
    await expect(createModal.severity).toHaveValue('low');
    await expect(createModal.description).toHaveValue('kept');
    expect(await api.findByTitle(title)).toHaveLength(0);
  });

  test('06-S8 save with blank fields is blocked and required fields are named', async ({ signedIn, createModal }) => {
    await signedIn.newBugButton.click();
    await expect(createModal.owner).toHaveValue('buggy');
    await createModal.owner.fill('');
    await createModal.saveButton.click();
    await expect(createModal.dialog).toBeVisible();
    await expect(createModal.errors).toContainText('Title is required.');
    await expect(createModal.errors).toContainText('Owner is required.');
    await expect(createModal.errors).toContainText('Description is required.');
  });

  for (const field of ['title', 'owner', 'description'] as const) {
    test(`06-S9 blank ${field} blocks save`, async ({ signedIn, createModal, api }) => {
      const token = uid();
      const data = { ...valid(token), [field]: '   ' };
      await signedIn.newBugButton.click();
      await expect(createModal.owner).toHaveValue('buggy');
      await createModal.fill(data);
      await createModal.saveButton.click();
      await expect(createModal.dialog).toBeVisible();
      await expect(createModal.errors).toBeVisible();
      const res = await api['request'].get('/api/bugs');
      const all = (await res.json()) as Array<{ title: string; description: string }>;
      expect(all.filter((b) => b.title.includes(token) || b.description.includes(token))).toHaveLength(0);
    });
  }

  test('06-S9 blank severity cannot be chosen in UI; API rejects it', async ({ signedIn, createModal, request }) => {
    await signedIn.newBugButton.click();
    const values = await createModal.severity.locator('option').evaluateAll((o) => o.map((x) => (x as HTMLOptionElement).value));
    expect(values).not.toContain('');
    const res = await request.post('/api/bugs', { data: { title: `${PREFIX} sev ${uid()}`, severity: '', owner: 'buggy', description: 'd' } });
    expect(res.status()).toBe(400);
  });

  test('06-design selected severity in create dropdown uses severity colour token', async ({ signedIn, createModal, page }) => {
    await signedIn.newBugButton.click();
    const expected: Record<string, string> = { HIGH: 'rgb(184, 74, 46)', MID: 'rgb(166, 124, 71)', LOW: 'rgb(74, 107, 94)' };
    for (const label of ['HIGH', 'MID', 'LOW']) {
      await createModal.severity.selectOption({ label });
      await expect(createModal.severity).toHaveCSS('color', expected[label]);
    }
    void page;
  });
});
