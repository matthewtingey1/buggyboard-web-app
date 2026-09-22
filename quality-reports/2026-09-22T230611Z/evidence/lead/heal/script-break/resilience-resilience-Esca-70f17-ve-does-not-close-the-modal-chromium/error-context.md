# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: resilience/resilience.spec.ts >> Escape during a pending save does not close the modal
- Location: tests/resilience/resilience.spec.ts:8:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('dialog', { name: 'Create bug' }).getByRole('button', { name: 'Saving...' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('dialog', { name: 'Create bug' }).getByRole('button', { name: 'Saving...' }) with timeout 5000ms
  - waiting for getByRole('dialog', { name: 'Create bug' }).getByRole('button', { name: 'Saving...' })

```

```yaml
- banner:
  - img "BuggyBoard"
  - heading "BuggyBoard" [level=1]
  - search:
    - textbox "Search bugs by title":
      - /placeholder: Search bugs…
  - button "New Bug"
  - button "Logout"
- main:
  - group "Filter by bug state":
    - button "Open" [pressed]
    - button "Closed"
  - status: Bug created. 6 open bugs shown.
  - region "Bug table":
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
        - row "2 HIGH Bug API endpoints work without logging in matt":
          - cell "2"
          - cell "HIGH"
          - cell "Bug API endpoints work without logging in":
            - button "Bug API endpoints work without logging in"
          - cell "matt"
        - row "3 MID Search does not match on bug description matt":
          - cell "3"
          - cell "MID"
          - cell "Search does not match on bug description":
            - button "Search does not match on bug description"
          - cell "matt"
        - row "8282 MID [e2e] slow save mudb6n2i8elv matt":
          - cell "8282"
          - cell "MID"
          - cell "[e2e] slow save mudb6n2i8elv":
            - button "[e2e] slow save mudb6n2i8elv"
          - cell "matt"
        - row "8283 MID [e2e] close while saving mudb6nitpine buggy":
          - cell "8283"
          - cell "MID"
          - cell "[e2e] close while saving mudb6nitpine":
            - button "[e2e] close while saving mudb6nitpine"
          - cell "buggy"
        - row "8284 MID [e2e] escape while saving mudb6nnht6h7 buggy":
          - cell "8284"
          - cell "MID"
          - cell "[e2e] escape while saving mudb6nnht6h7":
            - button "[e2e] escape while saving mudb6nnht6h7"
          - cell "buggy"
        - row "1 LOW Login page accepts username with trailing spaces matt":
          - cell "1"
          - cell "LOW"
          - cell "Login page accepts username with trailing spaces":
            - button "Login page accepts username with trailing spaces"
          - cell "matt"
```

# Test source

```ts
  1   | import { test, expect, defaultUser, PREFIX, uid } from '../fixtures';
  2   | 
  3   | test.beforeEach(async ({ loginPage, boardPage }) => {
  4   |   await loginPage.login(defaultUser.username, defaultUser.password);
  5   |   await boardPage.waitLoaded();
  6   | });
  7   | 
  8   | test('Escape during a pending save does not close the modal', async ({ boardPage, createBugModal, bugApi }) => {
  9   |   const title = `${PREFIX} escape while saving ${uid()}`;
  10  |   bugApi.expectTitle(title);
  11  |   await boardPage.delayBugWrites(1500);
  12  |   await boardPage.openNewBug();
  13  |   await expect(createBugModal.ownerInput).toHaveValue(defaultUser.username);
  14  |   await createBugModal.fill({ title, description: 'd' });
  15  |   await createBugModal.save();
> 16  |   await expect(createBugModal.savingButton).toBeVisible();
      |                                             ^ Error: expect(locator).toBeVisible() failed
  17  | 
  18  |   await createBugModal.pressEscape();
  19  | 
  20  |   await expect(createBugModal.dialog).toBeVisible();
  21  |   await expect(createBugModal.dialog).toBeHidden({ timeout: 10_000 });
  22  |   expect(await bugApi.findByTitle(title)).toHaveLength(1);
  23  | });
  24  | 
  25  | test('a slow response for an earlier row click does not replace the newer one', async ({ bugApi, boardPage, editBugModal }) => {
  26  |   const token = uid();
  27  |   const slow = await bugApi.create(`slow ${token}`);
  28  |   const fast = await bugApi.create(`fast ${token}`);
  29  |   await boardPage.reload();
  30  |   await boardPage.waitLoaded();
  31  |   await boardPage.delayBugRead(slow.id, 1500);
  32  | 
  33  |   await boardPage.openBug(slow.title);
  34  |   const slowArrives = boardPage.bugReadFinished(slow.id);
  35  |   await boardPage.openBug(fast.title);
  36  |   await expect(editBugModal.heading).toHaveText(`Edit bug #${fast.id}`);
  37  | 
  38  |   await slowArrives;
  39  | 
  40  |   await expect(editBugModal.heading).toHaveText(`Edit bug #${fast.id}`);
  41  |   await expect(editBugModal.titleInput).toHaveValue(fast.title);
  42  | });
  43  | 
  44  | test('a failed board load says so instead of "No bugs."', async ({ boardPage }) => {
  45  |   await boardPage.failBugList();
  46  | 
  47  |   await boardPage.reload();
  48  | 
  49  |   await expect(boardPage.loadError).toBeVisible();
  50  |   await expect(boardPage.noBugsMessage).toHaveCount(0);
  51  | });
  52  | 
  53  | test('logging out in one tab logs out the other', async ({ boardPage }) => {
  54  |   const otherTab = await boardPage.openInNewTab();
  55  | 
  56  |   await boardPage.logout();
  57  | 
  58  |   await expect(otherTab.page).toHaveURL(/\/login$/);
  59  | });
  60  | 
  61  | test('the header Close button is disabled while a save is pending', async ({ boardPage, createBugModal, bugApi }) => {
  62  |   const title = `${PREFIX} close while saving ${uid()}`;
  63  |   bugApi.expectTitle(title);
  64  |   await boardPage.delayBugWrites(1500);
  65  |   await boardPage.openNewBug();
  66  |   await expect(createBugModal.ownerInput).toHaveValue(defaultUser.username);
  67  |   await createBugModal.fill({ title, description: 'd' });
  68  | 
  69  |   await createBugModal.save();
  70  | 
  71  |   await expect(createBugModal.closeButton).toBeDisabled();
  72  |   await expect(createBugModal.dialog).toBeHidden({ timeout: 10_000 });
  73  | });
  74  | 
  75  | test('opening a bug deleted elsewhere says so on screen and drops the row', async ({ bugApi, boardPage }) => {
  76  |   const bug = await bugApi.create(`gone ${uid()}`);
  77  |   await boardPage.reload();
  78  |   await boardPage.waitLoaded();
  79  |   await bugApi.send('DELETE', `/api/bugs/${bug.id}`);
  80  | 
  81  |   await boardPage.openBug(bug.title);
  82  | 
  83  |   await expect(boardPage.noticeMessage).toHaveText('That bug no longer exists.');
  84  |   await expect.poll(() => boardPage.rowCount(bug.title)).toBe(0);
  85  | });
  86  | 
  87  | test('New Bug cancels a row open that is still loading', async ({ bugApi, boardPage, createBugModal, editBugModal }) => {
  88  |   const bug = await bugApi.create(`pending open ${uid()}`);
  89  |   await boardPage.reload();
  90  |   await boardPage.waitLoaded();
  91  |   await boardPage.delayBugRead(bug.id, 1500);
  92  |   await boardPage.openBug(bug.title);
  93  |   const slowArrives = boardPage.bugReadFinished(bug.id);
  94  | 
  95  |   await boardPage.openNewBug();
  96  |   await slowArrives;
  97  | 
  98  |   await expect(createBugModal.dialog).toBeVisible();
  99  |   await expect(editBugModal.dialog).toHaveCount(0);
  100 | });
  101 | 
  102 | test('holding Enter on New Bug opens a clean form', async ({ boardPage, createBugModal }) => {
  103 |   await boardPage.holdEnterOnNewBug();
  104 | 
  105 |   await expect(createBugModal.dialog).toBeVisible();
  106 |   await expect(createBugModal.errors).toHaveCount(0);
  107 | });
  108 | 
```