# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: accessibility/accessibility.spec.ts >> the selected state filter is announced as pressed
- Location: tests/accessibility/accessibility.spec.ts:43:1

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator:  getByRole('group', { name: 'Filter by bug state' }).getByRole('button', { name: 'Open' })
Expected: "true"
Received: ""
Timeout:  2000ms

Call log:
  - Expect "toHaveAttribute" getByRole('group', { name: 'Filter by bug state' }).getByRole('button', { name: 'Open' }) with timeout 2000ms
  - waiting for getByRole('group', { name: 'Filter by bug state' }).getByRole('button', { name: 'Open' })
    21 × locator resolved to <button type="button" class="rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 bg-primary text-stone-800 shadow-sm ring-1 ring-stone-200/50">Open</button>
       - unexpected value "null"

```

```yaml
- button "Open"
```

# Test source

```ts
  1  | import { test, expect, defaultUser, uid } from '../fixtures';
  2  | 
  3  | // Keyboard focus order differs by engine (WebKit skips buttons on Tab by default), so these run in Chromium.
  4  | test.beforeEach(async ({ browserName, loginPage, boardPage }) => {
  5  |   test.skip(browserName !== 'chromium', 'Accessibility checks are calibrated for Chromium.');
  6  |   await loginPage.login(defaultUser.username, defaultUser.password);
  7  |   await boardPage.waitLoaded();
  8  | });
  9  | 
  10 | test('a bug row opens with the keyboard', async ({ bugApi, boardPage, editBugModal }) => {
  11 |   const bug = await bugApi.create(`keyboard ${uid()}`);
  12 |   await boardPage.reload();
  13 |   await boardPage.waitLoaded();
  14 | 
  15 |   await boardPage.openBugWithKeyboard(bug.title);
  16 | 
  17 |   await expect(editBugModal.dialog).toBeVisible();
  18 | });
  19 | 
  20 | test('Escape closes the create modal', async ({ boardPage, createBugModal }) => {
  21 |   await boardPage.openNewBug();
  22 | 
  23 |   await createBugModal.pressEscape();
  24 | 
  25 |   await expect(createBugModal.dialog).toBeHidden();
  26 | });
  27 | 
  28 | test('the search field is exposed as a text box', async ({ boardPage }) => {
  29 |   test.fail(true, 'Known defect (WCAG 4.1.2): role="search" on the input hides its textbox role.');
  30 | 
  31 |   await expect(boardPage.searchTextbox).toBeVisible({ timeout: 2000 });
  32 | });
  33 | 
  34 | test('bug rows are exposed as table rows', async ({ bugApi, boardPage }) => {
  35 |   test.fail(true, 'Known defect (WCAG 1.3.1): role="button" on each <tr> removes its row semantics.');
  36 |   await bugApi.create(`row role ${uid()}`);
  37 |   await boardPage.reload();
  38 |   await boardPage.waitLoaded();
  39 | 
  40 |   expect(await boardPage.tableRowsByRole.count()).toBeGreaterThan(1);
  41 | });
  42 | 
  43 | test('the selected state filter is announced as pressed', async ({ boardPage }) => {
  44 |   test.fail(true, 'Known defect (WCAG 4.1.2): the Open/Closed selection is shown by colour only.');
  45 | 
> 46 |   await expect(boardPage.openFilter).toHaveAttribute('aria-pressed', 'true', { timeout: 2000 });
     |                                      ^ Error: expect(locator).toHaveAttribute(expected) failed
  47 | });
  48 | 
  49 | test('Tab stays inside the create modal', async ({ boardPage, createBugModal }) => {
  50 |   test.fail(true, 'Known defect (WCAG 2.4.3): the modals do not trap focus.');
  51 |   await boardPage.openNewBug();
  52 | 
  53 |   await createBugModal.pressTab(15);
  54 | 
  55 |   expect(await createBugModal.focusIsInside()).toBe(true);
  56 | });
  57 | 
```