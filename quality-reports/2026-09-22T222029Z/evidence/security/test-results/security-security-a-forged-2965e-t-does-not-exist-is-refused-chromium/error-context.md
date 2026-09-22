# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: security/security.spec.ts >> a forged session for a user that does not exist is refused
- Location: tests/security/security.spec.ts:38:1

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/login$/
Received string:  "http://localhost:5173/board"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    14 × locator resolved to <html lang="en">…</html>
       - unexpected value "http://localhost:5173/board"

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
      - button "3 MID Search does not match on bug description matt":
        - cell "3"
        - cell "MID"
        - cell "Search does not match on bug description"
        - cell "matt"
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
```

# Test source

```ts
  1  | import { test, expect, defaultUser, uid } from '../fixtures';
  2  | 
  3  | const payload = '<img src=x onerror="window.__xss=true">';
  4  | 
  5  | test('script in a bug title renders as text on the board', async ({ bugApi, loginPage, boardPage }) => {
  6  |   const bug = await bugApi.create(`${payload} ${uid()}`, { owner: payload, description: payload });
  7  | 
  8  |   await loginPage.login(defaultUser.username, defaultUser.password);
  9  |   await boardPage.waitLoaded();
  10 | 
  11 |   expect(await boardPage.rowCount(bug.title)).toBe(1);
  12 |   expect(await boardPage.scriptInjectionFired()).toBe(false);
  13 | });
  14 | 
  15 | test('script in bug fields renders as text in the edit modal', async ({ bugApi, loginPage, boardPage, editBugModal }) => {
  16 |   const bug = await bugApi.create(`${payload} ${uid()}`, { owner: payload, description: payload });
  17 |   await loginPage.login(defaultUser.username, defaultUser.password);
  18 |   await boardPage.waitLoaded();
  19 | 
  20 |   await boardPage.openBug(bug.title);
  21 | 
  22 |   await expect(editBugModal.descriptionInput).toHaveValue(payload);
  23 |   expect(await boardPage.scriptInjectionFired()).toBe(false);
  24 | });
  25 | 
  26 | test('script in a bug title renders as text in the delete confirmation', async ({ bugApi, loginPage, boardPage, editBugModal, deleteConfirmModal }) => {
  27 |   const bug = await bugApi.create(`${payload} ${uid()}`);
  28 |   await loginPage.login(defaultUser.username, defaultUser.password);
  29 |   await boardPage.waitLoaded();
  30 |   await boardPage.openBug(bug.title);
  31 | 
  32 |   await editBugModal.delete();
  33 | 
  34 |   await expect(deleteConfirmModal.message).toContainText(payload);
  35 |   expect(await boardPage.scriptInjectionFired()).toBe(false);
  36 | });
  37 | 
  38 | test('a forged session for a user that does not exist is refused', async ({ loginPage, boardPage }) => {
  39 |   test.fail(true, 'Known security defect: the session is an unsigned localStorage value, so any name opens the board.');
  40 |   await loginPage.forgeSession('no-such-user');
  41 | 
  42 |   await boardPage.visit('/board');
  43 | 
> 44 |   await expect(boardPage.page).toHaveURL(/\/login$/);
     |                                ^ Error: expect(page).toHaveURL(expected) failed
  45 | });
  46 | 
```