# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: diff-regressions.spec.ts >> 09 Save is disabled when title is changed to only a zero-width space
- Location: specs/diff-regressions.spec.ts:49:3

# Error details

```
Error: expect(locator).toBeDisabled() failed

Locator:  getByRole('dialog', { name: /^Edit bug #\d+$/ }).getByRole('button', { name: 'Save' })
Expected: disabled
Received: enabled
Timeout:  5000ms

Call log:
  - Expect "toBeDisabled" getByRole('dialog', { name: /^Edit bug #\d+$/ }).getByRole('button', { name: 'Save' }) with timeout 5000ms
  - waiting for getByRole('dialog', { name: /^Edit bug #\d+$/ }).getByRole('button', { name: 'Save' })
    14 × locator resolved to <button type="submit" class="rounded px-4 py-2 text-sm font-medium text-stone-800 bg-primary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-stone-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed">Save</button>
       - unexpected value "enabled"

```

```yaml
- button "Save"
```

# Test source

```ts
  1   | import { test, expect, buggy, uid } from '../fixtures';
  2   | 
  3   | // Scenarios the 2026-09-22T230611Z diff could have broken, and that nothing in tests/ guards.
  4   | 
  5   | test.beforeEach(async ({ loginPage, boardPage }) => {
  6   |   await loginPage.login(buggy.username, buggy.password);
  7   |   await boardPage.waitLoaded();
  8   | });
  9   | 
  10  | test('06 Escape after choosing a severity closes the create modal without saving', async ({ boardPage, createBugModal, bugApi }) => {
  11  |   const title = `[functional] esc-sev ${uid()}`;
  12  |   await boardPage.openNewBug();
  13  |   await createBugModal.fill({ title, description: 'd' });
  14  |   await createBugModal.severitySelect.selectOption({ label: 'HIGH' });
  15  | 
  16  |   await createBugModal.severitySelect.press('Escape');
  17  | 
  18  |   await expect(createBugModal.dialog).toBeHidden();
  19  |   expect(await bugApi.findContaining(title)).toHaveLength(0);
  20  | });
  21  | 
  22  | test('09 Escape after choosing a severity closes the edit modal and discards', async ({ bugApi, boardPage, editBugModal }) => {
  23  |   const bug = await bugApi.create(`esc-sev-edit ${uid()}`, { severity: 'low' });
  24  |   await boardPage.reload();
  25  |   await boardPage.waitLoaded();
  26  |   await boardPage.openBug(bug.title);
  27  |   await editBugModal.severitySelect.selectOption({ label: 'HIGH' });
  28  | 
  29  |   await editBugModal.severitySelect.press('Escape');
  30  | 
  31  |   await expect(editBugModal.dialog).toBeHidden();
  32  |   expect((await bugApi.get(bug.id))?.severity).toBe('LOW');
  33  | });
  34  | 
  35  | test('09/13 Escape after choosing a state closes the edit modal and discards', async ({ bugApi, boardPage, editBugModal }) => {
  36  |   const bug = await bugApi.create(`esc-state-edit ${uid()}`);
  37  |   await boardPage.reload();
  38  |   await boardPage.waitLoaded();
  39  |   await boardPage.openBug(bug.title);
  40  |   await editBugModal.stateSelect.selectOption({ label: 'Closed' });
  41  | 
  42  |   await editBugModal.stateSelect.press('Escape');
  43  | 
  44  |   await expect(editBugModal.dialog).toBeHidden();
  45  |   expect((await bugApi.get(bug.id))?.state).toBe('OPEN');
  46  | });
  47  | 
  48  | for (const field of ['title', 'owner', 'description'] as const) {
  49  |   test(`09 Save is disabled when ${field} is changed to only a zero-width space`, async ({ bugApi, boardPage, editBugModal }) => {
  50  |     const bug = await bugApi.create(`zw-${field} ${uid()}`);
  51  |     await boardPage.reload();
  52  |     await boardPage.waitLoaded();
  53  |     await boardPage.openBug(bug.title);
  54  | 
  55  |     await editBugModal.fill({ [field]: '​' });
  56  | 
> 57  |     await expect(editBugModal.saveButton).toBeDisabled();
      |                                           ^ Error: expect(locator).toBeDisabled() failed
  58  |   });
  59  | }
  60  | 
  61  | test('06 a zero-width-only title is blocked in the create modal', async ({ boardPage, createBugModal, bugApi }) => {
  62  |   const token = uid();
  63  |   await boardPage.openNewBug();
  64  |   await createBugModal.fill({ title: '​', description: `[functional] zw ${token}` });
  65  | 
  66  |   await createBugModal.save();
  67  | 
  68  |   await expect(createBugModal.dialog).toBeVisible();
  69  |   await expect(createBugModal.errors).toContainText('Title is required.');
  70  | });
  71  | 
  72  | for (const cell of [1, 2, 4]) {
  73  |   test(`09 clicking the row's cell ${cell} (not the title) opens the edit modal`, async ({ bugApi, boardPage, editBugModal, page }) => {
  74  |     const bug = await bugApi.create(`cell-click ${uid()}`);
  75  |     await boardPage.reload();
  76  |     await boardPage.waitLoaded();
  77  | 
  78  |     await page.getByRole('table', { name: 'Bugs' }).locator('tbody tr', { hasText: bug.title }).locator(`td:nth-child(${cell})`).click();
  79  | 
  80  |     await expect(editBugModal.dialog).toBeVisible();
  81  |     await expect(editBugModal.heading).toHaveText(`Edit bug #${bug.id}`);
  82  |   });
  83  | }
  84  | 
  85  | test('11 search "log in" (space) still finds "Issue with log-in"', async ({ bugApi, boardPage }) => {
  86  |   const token = uid();
  87  |   const bug = await bugApi.create(`Issue with log-in ${token}`);
  88  |   await boardPage.reload();
  89  |   await boardPage.waitLoaded();
  90  | 
  91  |   await boardPage.search(`log in ${token}`);
  92  | 
  93  |   await expect.poll(() => boardPage.rowCount(bug.title)).toBe(1);
  94  | });
  95  | 
  96  | test('11 search "save load" finds "save/load broken"', async ({ bugApi, boardPage }) => {
  97  |   const token = uid();
  98  |   const bug = await bugApi.create(`save/load broken ${token}`);
  99  |   await boardPage.reload();
  100 |   await boardPage.waitLoaded();
  101 | 
  102 |   await boardPage.search(`save load broken ${token}`);
  103 | 
  104 |   await expect.poll(() => boardPage.rowCount(bug.title)).toBe(1);
  105 | });
  106 | 
  107 | test('11 query "log-in" matches "Login fails" and the clear X resets', async ({ bugApi, boardPage }) => {
  108 |   const token = uid();
  109 |   const bug = await bugApi.create(`Login fails ${token}`);
  110 |   await boardPage.reload();
  111 |   await boardPage.waitLoaded();
  112 | 
  113 |   await boardPage.search(`log-in fails ${token}`);
  114 |   await expect.poll(() => boardPage.rowCount(bug.title)).toBe(1);
  115 |   await boardPage.clearSearch();
  116 | 
  117 |   await expect(boardPage.searchInput).toHaveValue('');
  118 |   await expect(boardPage.clearSearchButton).toBeHidden();
  119 | });
  120 | 
  121 | test('13 sort is kept across a state switch and after clearing search', async ({ bugApi, boardPage }) => {
  122 |   const token = uid();
  123 |   await bugApi.create(`b ${token}`, { severity: 'low' });
  124 |   await bugApi.create(`a ${token}`, { severity: 'high' });
  125 |   await boardPage.reload();
  126 |   await boardPage.waitLoaded();
  127 |   await boardPage.sortBy('Title');
  128 |   await boardPage.search(token);
  129 |   await boardPage.showClosed();
  130 |   await boardPage.showOpen();
  131 |   await boardPage.clearSearch();
  132 | 
  133 |   expect(await boardPage.sortIndicator('Title')).toBe('↑');
  134 |   expect((await boardPage.rowsContaining(token)).map((r) => r.title.startsWith('[functional] a'))).toEqual([true, false]);
  135 | });
  136 | 
```