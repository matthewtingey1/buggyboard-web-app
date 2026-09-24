# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: accessibility/accessibility.spec.ts >> the search field is exposed as a text box
- Location: tests/accessibility/accessibility.spec.ts:28:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('textbox', { name: 'Search bugs by title' })
Expected: visible
Timeout: 2000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('textbox', { name: 'Search bugs by title' }) with timeout 2000ms
  - waiting for getByRole('textbox', { name: 'Search bugs by title' })

```

```yaml
- banner:
  - img "BuggyBoard"
  - heading "BuggyBoard" [level=1]
  - search "Search bugs by title"
  - button "New Bug"
  - button "Logout"
- main:
  - group "Filter by bug state":
    - button "Open"
    - button "Closed"
  - table "Bugs":
    - rowgroup:
      - row "ID Severity Title Owner":
        - columnheader "ID":
          - button "ID"
        - columnheader "Severity":
          - button "Severity"
        - columnheader "Title":
          - button "Title"
        - columnheader "Owner":
          - button "Owner"
    - rowgroup:
      - button "2 HIGH Bug API endpoints work without logging in matt":
        - cell "2"
        - cell "HIGH"
        - cell "Bug API endpoints work without logging in"
        - cell "matt"
      - button "3146 HIGH [exploratory] R01 lost-update mud8rj8t buggy":
        - cell "3146"
        - cell "HIGH"
        - cell "[exploratory] R01 lost-update mud8rj8t"
        - cell "buggy"
      - button "3149 HIGH [exploratory] R05 mud8rj8t XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX buggy":
        - cell "3149"
        - cell "HIGH"
        - cell "[exploratory] R05 mud8rj8t XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
        - cell "buggy"
      - button "3151 HIGH [exploratory] R07 mud8rj8t nobody-such-user":
        - cell "3151"
        - cell "HIGH"
        - cell "[exploratory] R07 mud8rj8t"
        - cell "nobody-such-user"
      - button "3152 HIGH [exploratory] R07b mud8rj8t Buggy":
        - cell "3152"
        - cell "HIGH"
        - cell "[exploratory] R07b mud8rj8t"
        - cell "Buggy"
      - button "3 MID Search does not match on bug description matt":
        - cell "3"
        - cell "MID"
        - cell "Search does not match on bug description"
        - cell "matt"
      - button "3249 MID [exploratory] R03 after-logout mud8sdm7 buggy":
        - cell "3249"
        - cell "MID"
        - cell "[exploratory] R03 after-logout mud8sdm7"
        - cell "buggy"
      - button "3254 MID [exploratory] R06 dup mud8sdm7 buggy":
        - cell "3254"
        - cell "MID"
        - cell "[exploratory] R06 dup mud8sdm7"
        - cell "buggy"
      - button "3255 MID [exploratory] R06 dup mud8sdm7 buggy":
        - cell "3255"
        - cell "MID"
        - cell "[exploratory] R06 dup mud8sdm7"
        - cell "buggy"
      - button "3309 MID [functional] New Bug Logout collision probe buggy":
        - cell "3309"
        - cell "MID"
        - cell "[functional] New Bug Logout collision probe"
        - cell "buggy"
      - button "1 LOW Login page accepts username with trailing spaces matt":
        - cell "1"
        - cell "LOW"
        - cell "Login page accepts username with trailing spaces"
        - cell "matt"
      - button "1965 LOW buggy":
        - cell "1965"
        - cell "LOW"
        - cell
        - cell "buggy"
      - button "2009 LOW buggy":
        - cell "2009"
        - cell "LOW"
        - cell
        - cell "buggy"
      - button "2099 LOW buggy":
        - cell "2099"
        - cell "LOW"
        - cell
        - cell "buggy"
      - button "2437 LOW buggy":
        - cell "2437"
        - cell "LOW"
        - cell
        - cell "buggy"
      - button "2786 LOW buggy":
        - cell "2786"
        - cell "LOW"
        - cell
        - cell "buggy"
      - button:
        - cell "3150"
        - cell "LOW"
        - cell
        - cell "buggy"
      - button "3287 LOW buggy":
        - cell "3287"
        - cell "LOW"
        - cell
        - cell "buggy"
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
> 31 |   await expect(boardPage.searchTextbox).toBeVisible({ timeout: 2000 });
     |                                         ^ Error: expect(locator).toBeVisible() failed
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
  46 |   await expect(boardPage.openFilter).toHaveAttribute('aria-pressed', 'true', { timeout: 2000 });
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