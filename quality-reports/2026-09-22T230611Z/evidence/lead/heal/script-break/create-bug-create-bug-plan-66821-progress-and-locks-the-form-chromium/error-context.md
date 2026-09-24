# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: create-bug/create-bug-plan.spec.ts >> 2.6 Save shows progress and locks the form
- Location: tests/create-bug/create-bug-plan.spec.ts:65:1

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
  - status: Bug created. 4 open bugs shown.
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
        - row "1 LOW Login page accepts username with trailing spaces matt":
          - cell "1"
          - cell "LOW"
          - cell "Login page accepts username with trailing spaces":
            - button "Login page accepts username with trailing spaces"
          - cell "matt"
```

# Test source

```ts
  1   | // spec: specs/testing/create-bug-test-plan.md
  2   | // seed: tests/seed.spec.ts
  3   | import { test, expect, seedUser, PREFIX, uid } from '../fixtures';
  4   | 
  5   | test.beforeEach(async ({ loginPage, boardPage }) => {
  6   |   await loginPage.login(seedUser.username, seedUser.password);
  7   |   await boardPage.waitLoaded();
  8   | });
  9   | 
  10  | // Waits for the owner default, so a test never types before the modal is ready.
  11  | async function openSettled(boardPage: import('../pages/board-page').BoardPage, modal: import('../pages/create-bug-modal').CreateBugModal) {
  12  |   await boardPage.openNewBug();
  13  |   await expect(modal.ownerInput).toHaveValue(seedUser.username);
  14  |   await expect(modal.titleInput).toHaveValue('');
  15  | }
  16  | 
  17  | test('1.2 Title has focus when the modal opens', async ({ boardPage, createBugModal }) => {
  18  |   await boardPage.openNewBug();
  19  | 
  20  |   await expect(createBugModal.titleInput).toBeFocused();
  21  | });
  22  | 
  23  | test('1.3 Severity defaults to MID', async ({ boardPage, createBugModal }) => {
  24  |   await boardPage.openNewBug();
  25  | 
  26  |   await expect(createBugModal.severitySelect).toHaveValue('mid');
  27  | });
  28  | 
  29  | test('1.5 Reopening starts clean from the first frame', async ({ boardPage, createBugModal }) => {
  30  |   await openSettled(boardPage, createBugModal);
  31  |   await createBugModal.fill({ title: 'left over' });
  32  |   await createBugModal.pressEscape();
  33  | 
  34  |   await boardPage.openNewBug();
  35  | 
  36  |   expect(await createBugModal.titleInput.inputValue()).toBe('');
  37  | });
  38  | 
  39  | test('2.4 Enter in Title submits the bug', async ({ boardPage, createBugModal, bugApi }) => {
  40  |   const title = `${PREFIX} enter submits ${uid()}`;
  41  |   bugApi.expectTitle(title);
  42  |   await openSettled(boardPage, createBugModal);
  43  |   await createBugModal.fill({ title, description: 'submitted with Enter' });
  44  | 
  45  |   await createBugModal.pressEnterIn('title');
  46  | 
  47  |   await expect(createBugModal.dialog).toBeHidden();
  48  |   expect(await bugApi.findByTitle(title)).toHaveLength(1);
  49  | });
  50  | 
  51  | test('2.5 Leading and trailing whitespace is trimmed', async ({ boardPage, createBugModal, bugApi }) => {
  52  |   const title = `${PREFIX} trimmed ${uid()}`;
  53  |   bugApi.expectTitle(title);
  54  |   await openSettled(boardPage, createBugModal);
  55  |   await createBugModal.fill({ title: `   ${title}  `, owner: '  vanny ', description: '  padded  ' });
  56  | 
  57  |   await createBugModal.save();
  58  | 
  59  |   await expect(createBugModal.dialog).toBeHidden();
  60  |   const [saved] = await bugApi.findByTitle(title);
  61  |   expect(saved).toMatchObject({ title, owner: 'vanny', description: 'padded' });
  62  |   await expect.poll(() => boardPage.rowCount(title)).toBe(1);
  63  | });
  64  | 
  65  | test('2.6 Save shows progress and locks the form', async ({ boardPage, createBugModal, bugApi }) => {
  66  |   const title = `${PREFIX} slow save ${uid()}`;
  67  |   bugApi.expectTitle(title);
  68  |   await boardPage.delayBugWrites(1500);
  69  |   await openSettled(boardPage, createBugModal);
  70  |   await createBugModal.fill({ title, description: 'slow' });
  71  | 
  72  |   await createBugModal.save();
  73  | 
> 74  |   await expect(createBugModal.savingButton).toBeVisible();
      |                                             ^ Error: expect(locator).toBeVisible() failed
  75  |   await expect(createBugModal.titleInput).toBeDisabled();
  76  |   await expect(createBugModal.dialog).toBeHidden({ timeout: 10_000 });
  77  | });
  78  | 
  79  | test('4.4 Errors clear when the modal is reopened', async ({ boardPage, createBugModal }) => {
  80  |   await openSettled(boardPage, createBugModal);
  81  |   await createBugModal.save();
  82  |   await expect(createBugModal.errors).toBeVisible();
  83  |   await createBugModal.pressEscape();
  84  | 
  85  |   await openSettled(boardPage, createBugModal);
  86  | 
  87  |   await expect(createBugModal.errors).toHaveCount(0);
  88  | });
  89  | 
  90  | test('5.1 A server rejection keeps the draft', async ({ boardPage, createBugModal, bugApi }) => {
  91  |   const title = `${PREFIX} oversize ${uid()}`;
  92  |   bugApi.expectTitle(title);
  93  |   const description = 'x'.repeat(120_000);
  94  |   await openSettled(boardPage, createBugModal);
  95  |   await createBugModal.fill({ title, description });
  96  | 
  97  |   await createBugModal.save();
  98  | 
  99  |   await expect(createBugModal.errors).toHaveText('The request body is too large.');
  100 |   await expect(createBugModal.dialog).toBeVisible();
  101 |   expect((await createBugModal.descriptionInput.inputValue()).length).toBe(description.length);
  102 | });
  103 | 
  104 | test('5.2 A network failure keeps the draft', async ({ boardPage, createBugModal, bugApi }) => {
  105 |   const title = `${PREFIX} offline ${uid()}`;
  106 |   bugApi.expectTitle(title);
  107 |   await boardPage.abortBugWrites();
  108 |   await openSettled(boardPage, createBugModal);
  109 |   await createBugModal.fill({ title, description: 'kept' });
  110 | 
  111 |   await createBugModal.save();
  112 | 
  113 |   await expect(createBugModal.errors).toHaveText('Something went wrong. Please try again.');
  114 |   await expect(createBugModal.descriptionInput).toHaveValue('kept');
  115 | });
  116 | 
  117 | test('5.3 A double submit creates one bug', async ({ boardPage, createBugModal, bugApi }) => {
  118 |   const title = `${PREFIX} double submit ${uid()}`;
  119 |   bugApi.expectTitle(title);
  120 |   await openSettled(boardPage, createBugModal);
  121 |   await createBugModal.fill({ title, description: 'twice' });
  122 | 
  123 |   await createBugModal.submitTwiceSynchronously();
  124 | 
  125 |   await expect(createBugModal.dialog).toBeHidden();
  126 |   await expect.poll(async () => (await bugApi.findByTitle(title)).length).toBeGreaterThan(0);
  127 |   expect(await bugApi.findByTitle(title)).toHaveLength(1);
  128 | });
  129 | 
  130 | test('6.1 A bug created from the Closed view is Open and appears under Open', async ({ boardPage, createBugModal, bugApi }) => {
  131 |   const title = `${PREFIX} from closed view ${uid()}`;
  132 |   bugApi.expectTitle(title);
  133 |   await boardPage.showClosed();
  134 |   await openSettled(boardPage, createBugModal);
  135 |   await createBugModal.fill({ title, description: 'd' });
  136 | 
  137 |   await createBugModal.save();
  138 | 
  139 |   await expect(createBugModal.dialog).toBeHidden();
  140 |   expect((await bugApi.findByTitle(title))[0]?.state).toBe('OPEN');
  141 |   expect(await boardPage.rowCount(title)).toBe(0);
  142 |   await boardPage.showOpen();
  143 |   await expect.poll(() => boardPage.rowCount(title)).toBe(1);
  144 | });
  145 | 
  146 | test('6.2 An active search is kept after creating a bug', async ({ boardPage, createBugModal, bugApi }) => {
  147 |   const title = `${PREFIX} during search ${uid()}`;
  148 |   bugApi.expectTitle(title);
  149 |   const query = `zzq-${uid()}`;
  150 |   await boardPage.search(query);
  151 |   await openSettled(boardPage, createBugModal);
  152 |   await createBugModal.fill({ title, description: 'd' });
  153 | 
  154 |   await createBugModal.save();
  155 | 
  156 |   await expect(createBugModal.dialog).toBeHidden();
  157 |   await expect(boardPage.searchInput).toHaveValue(query);
  158 | });
  159 | 
```