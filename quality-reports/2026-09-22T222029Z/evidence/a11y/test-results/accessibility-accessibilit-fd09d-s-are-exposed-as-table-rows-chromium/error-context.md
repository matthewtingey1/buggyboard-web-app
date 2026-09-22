# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: accessibility/accessibility.spec.ts >> bug rows are exposed as table rows
- Location: tests/accessibility/accessibility.spec.ts:34:1

# Error details

```
Error: expect(received).toBeGreaterThan(expected)

Expected: > 1
Received:   1
```

# Page snapshot

```yaml
- generic [ref=f1e3]:
  - banner [ref=f1e4]:
    - generic [ref=f1e5]:
      - img "BuggyBoard" [ref=f1e7]
      - heading "BuggyBoard" [level=1] [ref=f1e8]
    - generic [ref=f1e9]:
      - search "Search bugs by title" [ref=f1e11]
      - button "New Bug" [ref=f1e13] [cursor=pointer]
      - button "Logout" [ref=f1e15] [cursor=pointer]
  - main [ref=f1e16]:
    - generic [ref=f1e17]:
      - group "Filter by bug state" [ref=f1e19]:
        - button "Open" [ref=f1e20] [cursor=pointer]
        - button "Closed" [ref=f1e21] [cursor=pointer]
      - table "Bugs" [ref=f1e24]:
        - rowgroup [ref=f1e25]:
          - row [ref=f1e26]:
            - columnheader [ref=f1e27]:
              - button "ID" [ref=f1e28] [cursor=pointer]
            - columnheader [ref=f1e30]:
              - button "Severity" [ref=f1e31] [cursor=pointer]:
                - text: Severity
                - generic [aria-hidden] [ref=f1e32]: ↓
            - columnheader [ref=f1e33]:
              - button "Title" [ref=f1e34] [cursor=pointer]
            - columnheader [ref=f1e36]:
              - button "Owner" [ref=f1e37] [cursor=pointer]
        - rowgroup [ref=f1e39]:
          - button [ref=f1e40] [cursor=pointer]:
            - cell "2" [ref=f1e41]
            - cell "HIGH" [ref=f1e42]
            - cell "Bug API endpoints work without logging in" [ref=f1e44]
            - cell "matt" [ref=f1e45]
          - button [ref=f1e46] [cursor=pointer]:
            - cell "3146" [ref=f1e47]
            - cell "HIGH" [ref=f1e48]
            - cell "[exploratory] R01 lost-update mud8rj8t" [ref=f1e50]
            - cell "buggy" [ref=f1e51]
          - button [ref=f1e52] [cursor=pointer]:
            - cell "3149" [ref=f1e53]
            - cell "HIGH" [ref=f1e54]
            - cell "[exploratory] R05 mud8rj8t XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" [ref=f1e56]
            - cell "buggy" [ref=f1e57]
          - button [ref=f1e58] [cursor=pointer]:
            - cell "3151" [ref=f1e59]
            - cell "HIGH" [ref=f1e60]
            - cell "[exploratory] R07 mud8rj8t" [ref=f1e62]
            - cell "nobody-such-user" [ref=f1e63]
          - button [ref=f1e64] [cursor=pointer]:
            - cell "3152" [ref=f1e65]
            - cell "HIGH" [ref=f1e66]
            - cell "[exploratory] R07b mud8rj8t" [ref=f1e68]
            - cell "Buggy" [ref=f1e69]
          - button [ref=f1e70] [cursor=pointer]:
            - cell "3" [ref=f1e71]
            - cell "MID" [ref=f1e72]
            - cell "Search does not match on bug description" [ref=f1e74]
            - cell "matt" [ref=f1e75]
          - button [ref=f1e76] [cursor=pointer]:
            - cell "3249" [ref=f1e77]
            - cell "MID" [ref=f1e78]
            - cell "[exploratory] R03 after-logout mud8sdm7" [ref=f1e80]
            - cell "buggy" [ref=f1e81]
          - button [ref=f1e82] [cursor=pointer]:
            - cell "3254" [ref=f1e83]
            - cell "MID" [ref=f1e84]
            - cell "[exploratory] R06 dup mud8sdm7" [ref=f1e86]
            - cell "buggy" [ref=f1e87]
          - button [ref=f1e88] [cursor=pointer]:
            - cell "3255" [ref=f1e89]
            - cell "MID" [ref=f1e90]
            - cell "[exploratory] R06 dup mud8sdm7" [ref=f1e92]
            - cell "buggy" [ref=f1e93]
          - button [ref=f1e94] [cursor=pointer]:
            - cell "3309" [ref=f1e95]
            - cell "MID" [ref=f1e96]
            - cell "[functional] New Bug Logout collision probe" [ref=f1e98]
            - cell "buggy" [ref=f1e99]
          - button [ref=f1e100] [cursor=pointer]:
            - cell "3311" [ref=f1e101]
            - cell "MID" [ref=f1e102]
            - cell "[e2e] row role mud8u8bqdckk" [ref=f1e104]
            - cell "buggy" [ref=f1e105]
          - button [ref=f1e106] [cursor=pointer]:
            - cell "1" [ref=f1e107]
            - cell "LOW" [ref=f1e108]
            - cell "Login page accepts username with trailing spaces" [ref=f1e110]
            - cell "matt" [ref=f1e111]
          - button [ref=f1e112] [cursor=pointer]:
            - cell "1965" [ref=f1e113]
            - cell "LOW" [ref=f1e114]
            - cell [ref=f1e116]
            - cell "buggy" [ref=f1e117]
          - button [ref=f1e118] [cursor=pointer]:
            - cell "2009" [ref=f1e119]
            - cell "LOW" [ref=f1e120]
            - cell [ref=f1e122]
            - cell "buggy" [ref=f1e123]
          - button [ref=f1e124] [cursor=pointer]:
            - cell "2099" [ref=f1e125]
            - cell "LOW" [ref=f1e126]
            - cell [ref=f1e128]
            - cell "buggy" [ref=f1e129]
          - button [ref=f1e130] [cursor=pointer]:
            - cell "2437" [ref=f1e131]
            - cell "LOW" [ref=f1e132]
            - cell [ref=f1e134]
            - cell "buggy" [ref=f1e135]
          - button [ref=f1e136] [cursor=pointer]:
            - cell "2786" [ref=f1e137]
            - cell "LOW" [ref=f1e138]
            - cell [ref=f1e140]
            - cell "buggy" [ref=f1e141]
          - button [ref=f1e142] [cursor=pointer]:
            - cell "3150" [ref=f1e143]
            - cell "LOW" [ref=f1e144]
            - cell [ref=f1e146]
            - cell "buggy" [ref=f1e147]
          - button [ref=f1e148] [cursor=pointer]:
            - cell "3287" [ref=f1e149]
            - cell "LOW" [ref=f1e150]
            - cell [ref=f1e152]
            - cell "buggy" [ref=f1e153]
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
> 40 |   expect(await boardPage.tableRowsByRole.count()).toBeGreaterThan(1);
     |                                                   ^ Error: expect(received).toBeGreaterThan(expected)
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