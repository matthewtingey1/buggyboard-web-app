# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: create-gaps.spec.ts >> C1.5 / functional-04 reopened modal is clean from the first frame (no stale draft)
- Location: specs/create-gaps.spec.ts:23:1

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 2
+ Received  + 2

  Object {
-   "owner": "buggy",
-   "title": "",
+   "owner": "",
+   "title": "stale draft",
  }
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e5]:
      - img "BuggyBoard" [ref=e7]
      - heading "BuggyBoard" [level=1] [ref=e8]
    - generic [ref=e9]:
      - search "Search bugs by title" [ref=e11]
      - button "New Bug" [ref=e13] [cursor=pointer]
      - button "Logout" [ref=e15] [cursor=pointer]
  - main [ref=e16]:
    - generic [ref=e17]:
      - group "Filter by bug state" [ref=e19]:
        - button "Open" [ref=e20] [cursor=pointer]
        - button "Closed" [ref=e21] [cursor=pointer]
      - table "Bugs" [ref=e24]:
        - rowgroup [ref=e25]:
          - row [ref=e26]:
            - columnheader [ref=e27]:
              - button "ID" [ref=e28] [cursor=pointer]
            - columnheader [ref=e30]:
              - button "Severity" [ref=e31] [cursor=pointer]:
                - text: Severity
                - generic [aria-hidden] [ref=e32]: ↓
            - columnheader [ref=e33]:
              - button "Title" [ref=e34] [cursor=pointer]
            - columnheader [ref=e36]:
              - button "Owner" [ref=e37] [cursor=pointer]
        - rowgroup [ref=e39]:
          - button [ref=e40] [cursor=pointer]:
            - cell "2" [ref=e41]
            - cell "HIGH" [ref=e42]
            - cell "Bug API endpoints work without logging in" [ref=e44]
            - cell "matt" [ref=e45]
          - button [ref=e46] [cursor=pointer]:
            - cell "3146" [ref=e47]
            - cell "HIGH" [ref=e48]
            - cell "[exploratory] R01 lost-update mud8rj8t" [ref=e50]
            - cell "buggy" [ref=e51]
          - button [ref=e52] [cursor=pointer]:
            - cell "3149" [ref=e53]
            - cell "HIGH" [ref=e54]
            - cell "[exploratory] R05 mud8rj8t XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" [ref=e56]
            - cell "buggy" [ref=e57]
          - button [ref=e58] [cursor=pointer]:
            - cell "3151" [ref=e59]
            - cell "HIGH" [ref=e60]
            - cell "[exploratory] R07 mud8rj8t" [ref=e62]
            - cell "nobody-such-user" [ref=e63]
          - button [ref=e64] [cursor=pointer]:
            - cell "3152" [ref=e65]
            - cell "HIGH" [ref=e66]
            - cell "[exploratory] R07b mud8rj8t" [ref=e68]
            - cell "Buggy" [ref=e69]
          - button [ref=e70] [cursor=pointer]:
            - cell "3312" [ref=e71]
            - cell "HIGH" [ref=e72]
            - cell "[exploratory] N2 slowA mud8utv2" [ref=e74]
            - cell "buggy" [ref=e75]
          - button [ref=e76] [cursor=pointer]:
            - cell "3313" [ref=e77]
            - cell "HIGH" [ref=e78]
            - cell "[exploratory] N2 fastB mud8utv2" [ref=e80]
            - cell "buggy" [ref=e81]
          - button [ref=e82] [cursor=pointer]:
            - cell "3314" [ref=e83]
            - cell "HIGH" [ref=e84]
            - cell "[exploratory] N7 open-fails mud8utv2" [ref=e86]
            - cell "buggy" [ref=e87]
          - button [ref=e88] [cursor=pointer]:
            - cell "3317" [ref=e89]
            - cell "HIGH" [ref=e90]
            - cell "[exploratory] N1c bugA mud8v72y" [ref=e92]
            - cell "buggy" [ref=e93]
          - button [ref=e94] [cursor=pointer]:
            - cell "3318" [ref=e95]
            - cell "HIGH" [ref=e96]
            - cell "[exploratory] N1c bugB mud8v72y" [ref=e98]
            - cell "buggy" [ref=e99]
          - button [ref=e100] [cursor=pointer]:
            - cell "3321" [ref=e101]
            - cell "HIGH" [ref=e102]
            - cell "[exploratory] N4 narrow viewport bug with a normal length title mud8vpli" [ref=e104]
            - cell "buggy" [ref=e105]
          - button [ref=e106] [cursor=pointer]:
            - cell "3322" [ref=e107]
            - cell "HIGH" [ref=e108]
            - cell "[exploratory] N5 rapid mud8vpli" [ref=e110]
            - cell "buggy" [ref=e111]
          - button [ref=e112] [cursor=pointer]:
            - cell "3327" [ref=e113]
            - cell "HIGH" [ref=e114]
            - cell "[exploratory] N3b unchanged mud8x7x7" [ref=e116]
            - cell "buggy" [ref=e117]
          - button [ref=e118] [cursor=pointer]:
            - cell "3" [ref=e119]
            - cell "MID" [ref=e120]
            - cell "Search does not match on bug description" [ref=e122]
            - cell "matt" [ref=e123]
          - button [ref=e124] [cursor=pointer]:
            - cell "3249" [ref=e125]
            - cell "MID" [ref=e126]
            - cell "[exploratory] R03 after-logout mud8sdm7" [ref=e128]
            - cell "buggy" [ref=e129]
          - button [ref=e130] [cursor=pointer]:
            - cell "3254" [ref=e131]
            - cell "MID" [ref=e132]
            - cell "[exploratory] R06 dup mud8sdm7" [ref=e134]
            - cell "buggy" [ref=e135]
          - button [ref=e136] [cursor=pointer]:
            - cell "3255" [ref=e137]
            - cell "MID" [ref=e138]
            - cell "[exploratory] R06 dup mud8sdm7" [ref=e140]
            - cell "buggy" [ref=e141]
          - button [ref=e142] [cursor=pointer]:
            - cell "3315" [ref=e143]
            - cell "MID" [ref=e144]
            - cell "[exploratory] N7 saved-but-hidden mud8utv2" [ref=e146]
            - cell "buggy" [ref=e147]
          - button [ref=e148] [cursor=pointer]:
            - cell "3316" [ref=e149]
            - cell "MID" [ref=e150]
            - cell "[exploratory] N1a first mud8v72y" [ref=e152]
            - cell "buggy" [ref=e153]
          - button [ref=e154] [cursor=pointer]:
            - cell "3320" [ref=e155]
            - cell "MID" [ref=e156]
            - cell "[exploratory] N3 keyboard mud8vpli" [ref=e158]
            - cell "buggy" [ref=e159]
          - button [ref=e160] [cursor=pointer]:
            - cell "1" [ref=e161]
            - cell "LOW" [ref=e162]
            - cell "Login page accepts username with trailing spaces" [ref=e164]
            - cell "matt" [ref=e165]
          - button [ref=e166] [cursor=pointer]:
            - cell "1965" [ref=e167]
            - cell "LOW" [ref=e168]
            - cell [ref=e170]
            - cell "buggy" [ref=e171]
          - button [ref=e172] [cursor=pointer]:
            - cell "2009" [ref=e173]
            - cell "LOW" [ref=e174]
            - cell [ref=e176]
            - cell "buggy" [ref=e177]
          - button [ref=e178] [cursor=pointer]:
            - cell "2099" [ref=e179]
            - cell "LOW" [ref=e180]
            - cell [ref=e182]
            - cell "buggy" [ref=e183]
          - button [ref=e184] [cursor=pointer]:
            - cell "2437" [ref=e185]
            - cell "LOW" [ref=e186]
            - cell [ref=e188]
            - cell "buggy" [ref=e189]
          - button [ref=e190] [cursor=pointer]:
            - cell "2786" [ref=e191]
            - cell "LOW" [ref=e192]
            - cell [ref=e194]
            - cell "buggy" [ref=e195]
          - button [ref=e196] [cursor=pointer]:
            - cell "3150" [ref=e197]
            - cell "LOW" [ref=e198]
            - cell [ref=e200]
            - cell "buggy" [ref=e201]
          - button [ref=e202] [cursor=pointer]:
            - cell "3287" [ref=e203]
            - cell "LOW" [ref=e204]
            - cell [ref=e206]
            - cell "buggy" [ref=e207]
  - dialog [ref=e208]:
    - generic [ref=e209]:
      - generic [ref=e210]:
        - heading "Create bug" [level=2] [ref=e211]
        - button "Close" [ref=e212] [cursor=pointer]: ×
      - generic [ref=e214]:
        - generic [ref=e215]:
          - generic [ref=e216]: Title
          - textbox "Title" [active] [ref=e217]
        - generic [ref=e218]:
          - generic [ref=e219]: Severity
          - combobox "Severity" [ref=e220]:
            - option "HIGH"
            - option "MID" [selected]
            - option "LOW"
        - generic [ref=e221]:
          - generic [ref=e222]: Owner
          - textbox "Owner" [ref=e223]: buggy
        - generic [ref=e224]:
          - generic [ref=e225]: Description
          - textbox "Description" [ref=e226]
        - generic [ref=e227]:
          - button "Cancel" [ref=e228] [cursor=pointer]
          - button "Save" [ref=e229] [cursor=pointer]
```

# Test source

```ts
  1   | import { test, expect, buggy, uid, PREFIX } from '../fixtures';
  2   | 
  3   | test.beforeEach(async ({ loginPage, boardPage }) => {
  4   |   await loginPage.login(buggy.username, buggy.password);
  5   |   await boardPage.waitLoaded();
  6   | });
  7   | 
  8   | async function openSettled(boardPage: any, createBugModal: any) {
  9   |   await boardPage.openNewBug();
  10  |   await expect(createBugModal.ownerInput).toHaveValue(buggy.username);
  11  | }
  12  | 
  13  | test('C1.2 Title has focus when the create modal opens', async ({ boardPage, createBugModal }) => {
  14  |   await openSettled(boardPage, createBugModal);
  15  |   await expect(createBugModal.titleInput).toBeFocused();
  16  | });
  17  | 
  18  | test('C1.3 Severity defaults to MID', async ({ boardPage, createBugModal }) => {
  19  |   await openSettled(boardPage, createBugModal);
  20  |   await expect(createBugModal.severitySelect).toHaveValue('mid');
  21  | });
  22  | 
  23  | test('C1.5 / functional-04 reopened modal is clean from the first frame (no stale draft)', async ({ page, boardPage, createBugModal }) => {
  24  |   await openSettled(boardPage, createBugModal);
  25  |   await createBugModal.fill({ title: 'stale draft', owner: '' });
  26  |   await createBugModal.pressEscape();
  27  |   await expect(createBugModal.dialog).toBeHidden();
  28  | 
  29  |   await boardPage.openNewBug();
  30  |   const first = await page.evaluate(() => {
  31  |     const t = document.getElementById('bug-title') as HTMLInputElement | null;
  32  |     const o = document.getElementById('bug-owner') as HTMLInputElement | null;
  33  |     return { title: t?.value, owner: o?.value };
  34  |   });
> 35  |   expect(first).toEqual({ title: '', owner: buggy.username });
      |                 ^ Error: expect(received).toEqual(expected) // deep equality
  36  | });
  37  | 
  38  | test('functional-04 clearing Owner immediately after open is not overwritten', async ({ page, boardPage, createBugModal }) => {
  39  |   await boardPage.openNewBug();
  40  |   await createBugModal.ownerInput.fill('');
  41  |   await page.waitForTimeout(500);
  42  |   await expect(createBugModal.ownerInput).toHaveValue('');
  43  | });
  44  | 
  45  | test('C2.4 Enter in Title submits and saves', async ({ boardPage, createBugModal, bugApi }) => {
  46  |   const token = uid();
  47  |   await openSettled(boardPage, createBugModal);
  48  |   await createBugModal.fill({ description: 'd', title: `${PREFIX} enter ${token}` });
  49  |   await createBugModal.titleInput.press('Enter');
  50  |   await expect(createBugModal.dialog).toBeHidden();
  51  |   await expect.poll(async () => (await bugApi.findContaining(token)).length).toBe(1);
  52  | });
  53  | 
  54  | test('C2.5 padded title/owner/description are saved trimmed (UI path)', async ({ boardPage, createBugModal, bugApi }) => {
  55  |   const token = uid();
  56  |   await openSettled(boardPage, createBugModal);
  57  |   await createBugModal.fill({ title: `   ${PREFIX} trim ${token}   `, owner: '  vanny  ', description: '  body  ' });
  58  |   await createBugModal.save();
  59  |   await expect(createBugModal.dialog).toBeHidden();
  60  |   await expect.poll(async () => (await bugApi.findContaining(token)).length).toBe(1);
  61  |   const [bug] = await bugApi.findContaining(token);
  62  |   expect(bug).toMatchObject({ title: `${PREFIX} trim ${token}`, owner: 'vanny', description: 'body' });
  63  |   await expect.poll(() => boardPage.rowCount(`${PREFIX} trim ${token}`)).toBe(1);
  64  | });
  65  | 
  66  | test('C2.6 Save shows "Saving…" and disables the form while the POST is in flight', async ({ page, boardPage, createBugModal, bugApi }) => {
  67  |   const token = uid();
  68  |   await page.route('**/api/bugs', async (route) => {
  69  |     if (route.request().method() === 'POST') await new Promise((r) => setTimeout(r, 1500));
  70  |     await route.continue();
  71  |   });
  72  |   await openSettled(boardPage, createBugModal);
  73  |   await createBugModal.fill({ title: `${PREFIX} slow ${token}`, description: 'd' });
  74  |   await createBugModal.save();
  75  |   await expect(createBugModal.dialog.getByRole('button', { name: 'Saving…' })).toBeDisabled();
  76  |   await expect(createBugModal.titleInput).toBeDisabled();
  77  |   await expect(createBugModal.descriptionInput).toBeDisabled();
  78  |   await expect(createBugModal.dialog).toBeHidden({ timeout: 10000 });
  79  |   await expect.poll(async () => (await bugApi.findContaining(token)).length).toBe(1);
  80  | });
  81  | 
  82  | test('C4.4 validation errors are gone when the modal is reopened', async ({ boardPage, createBugModal }) => {
  83  |   await openSettled(boardPage, createBugModal);
  84  |   await createBugModal.save();
  85  |   await expect(createBugModal.errors).toBeVisible();
  86  |   await createBugModal.pressEscape();
  87  |   await openSettled(boardPage, createBugModal);
  88  |   await expect(createBugModal.errors).toHaveCount(0);
  89  | });
  90  | 
  91  | test('06-S8 blank Title alone names only "Title is required."', async ({ boardPage, createBugModal }) => {
  92  |   await openSettled(boardPage, createBugModal);
  93  |   await createBugModal.fill({ description: 'd' });
  94  |   await createBugModal.save();
  95  |   await expect(createBugModal.errors).toHaveText('Title is required.');
  96  | });
  97  | 
  98  | test('C5.1 server rejection (oversized description) keeps the modal open and the draft', async ({ boardPage, createBugModal, bugApi }) => {
  99  |   const token = uid();
  100 |   const big = 'x'.repeat(120_000);
  101 |   await openSettled(boardPage, createBugModal);
  102 |   await createBugModal.fill({ title: `${PREFIX} big ${token}`, description: big });
  103 |   await createBugModal.save();
  104 |   await expect(createBugModal.errors).toBeVisible();
  105 |   await expect(createBugModal.dialog).toBeVisible();
  106 |   await expect(createBugModal.titleInput).toHaveValue(`${PREFIX} big ${token}`);
  107 |   expect((await createBugModal.descriptionInput.inputValue()).length).toBe(120_000);
  108 |   expect(await bugApi.findContaining(token)).toHaveLength(0);
  109 |   test.info().annotations.push({ type: 'alert', description: (await createBugModal.errors.textContent()) ?? '' });
  110 | });
  111 | 
  112 | test('C5.2 network failure shows "Something went wrong" and keeps the draft', async ({ page, boardPage, createBugModal }) => {
  113 |   const token = uid();
  114 |   await page.route('**/api/bugs', (route) => (route.request().method() === 'POST' ? route.abort() : route.continue()));
  115 |   await openSettled(boardPage, createBugModal);
  116 |   await createBugModal.fill({ title: `${PREFIX} net ${token}`, description: 'd' });
  117 |   await createBugModal.save();
  118 |   await expect(createBugModal.errors).toHaveText('Something went wrong. Please try again.');
  119 |   await expect(createBugModal.titleInput).toHaveValue(`${PREFIX} net ${token}`);
  120 | });
  121 | 
  122 | test('C6.1 creating from the Closed view saves as Open and shows only under Open', async ({ boardPage, createBugModal, bugApi }) => {
  123 |   const token = uid();
  124 |   const title = `${PREFIX} from closed ${token}`;
  125 |   await boardPage.showClosed();
  126 |   await openSettled(boardPage, createBugModal);
  127 |   await createBugModal.fill({ title, description: 'd' });
  128 |   await createBugModal.save();
  129 |   await expect(createBugModal.dialog).toBeHidden();
  130 |   await expect.poll(async () => (await bugApi.findContaining(token))[0]?.state).toBe('OPEN');
  131 |   expect(await boardPage.filterBackground('closed')).not.toBe('rgba(0, 0, 0, 0)');
  132 |   expect(await boardPage.rowCount(title)).toBe(0);
  133 |   await boardPage.showOpen();
  134 |   await expect.poll(() => boardPage.rowCount(title)).toBe(1);
  135 | });
```