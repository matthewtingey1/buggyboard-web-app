# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: create-gaps.spec.ts >> functional-04 clearing Owner immediately after open is not overwritten
- Location: specs/create-gaps.spec.ts:38:1

# Error details

```
Error: expect(locator).toHaveValue(expected) failed

Locator:  getByRole('dialog', { name: 'Create bug' }).getByLabel('Owner')
Expected: ""
Received: "buggy"
Timeout:  5000ms

Call log:
  - Expect "toHaveValue" getByRole('dialog', { name: 'Create bug' }).getByLabel('Owner') with timeout 5000ms
  - waiting for getByRole('dialog', { name: 'Create bug' }).getByLabel('Owner')
    14 × locator resolved to <input type="text" value="buggy" id="bug-owner" autocomplete="off" class="w-full rounded border border-stone-300 px-3 py-2 text-stone-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"/>
       - unexpected value "buggy"

```

```yaml
- textbox "Owner": buggy
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
  35  |   expect(first).toEqual({ title: '', owner: buggy.username });
  36  | });
  37  | 
  38  | test('functional-04 clearing Owner immediately after open is not overwritten', async ({ page, boardPage, createBugModal }) => {
  39  |   await boardPage.openNewBug();
  40  |   await createBugModal.ownerInput.fill('');
  41  |   await page.waitForTimeout(500);
> 42  |   await expect(createBugModal.ownerInput).toHaveValue('');
      |                                           ^ Error: expect(locator).toHaveValue(expected) failed
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
  136 | 
  137 | test('C6.2 active search text is kept after creating a bug', async ({ boardPage, createBugModal, bugApi }) => {
  138 |   const token = uid();
  139 |   await boardPage.search(token);
  140 |   await openSettled(boardPage, createBugModal);
  141 |   await createBugModal.fill({ title: `${PREFIX} searched ${token}`, description: 'd' });
  142 |   await createBugModal.save();
```