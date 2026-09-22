# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: title-bar/layout.spec.ts >> title bar shows the logo, the BuggyBoard title and a logout button
- Location: tests/title-bar/layout.spec.ts:8:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: 'Logout' })
Expected: visible
Error: strict mode violation: getByRole('button', { name: 'Logout' }) resolved to 2 elements:
    1) <button type="button" class="rounded-lg px-4 py-2 text-base font-medium text-stone-600 border border-stone-200 bg-white hover:bg-stone-50 hover:border-stone-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">Logout</button> aka getByRole('button', { name: 'Logout', exact: true })
    2) <tr tabindex="0" role="button" class="border-b border-stone-100 hover:bg-stone-50/80 transition-colors cursor-pointer">…</tr> aka getByRole('button', { name: '3249 MID [exploratory] R03' })

Call log:
  - Expect "toBeVisible" getByRole('button', { name: 'Logout' }) with timeout 5000ms
  - waiting for getByRole('button', { name: 'Logout' })

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
            - cell "3" [ref=e71]
            - cell "MID" [ref=e72]
            - cell "Search does not match on bug description" [ref=e74]
            - cell "matt" [ref=e75]
          - button [ref=e76] [cursor=pointer]:
            - cell "3249" [ref=e77]
            - cell "MID" [ref=e78]
            - cell "[exploratory] R03 after-logout mud8sdm7" [ref=e80]
            - cell "buggy" [ref=e81]
          - button [ref=e82] [cursor=pointer]:
            - cell "3254" [ref=e83]
            - cell "MID" [ref=e84]
            - cell "[exploratory] R06 dup mud8sdm7" [ref=e86]
            - cell "buggy" [ref=e87]
          - button [ref=e88] [cursor=pointer]:
            - cell "3255" [ref=e89]
            - cell "MID" [ref=e90]
            - cell "[exploratory] R06 dup mud8sdm7" [ref=e92]
            - cell "buggy" [ref=e93]
          - button [ref=e94] [cursor=pointer]:
            - cell "1" [ref=e95]
            - cell "LOW" [ref=e96]
            - cell "Login page accepts username with trailing spaces" [ref=e98]
            - cell "matt" [ref=e99]
          - button [ref=e100] [cursor=pointer]:
            - cell "1965" [ref=e101]
            - cell "LOW" [ref=e102]
            - cell [ref=e104]
            - cell "buggy" [ref=e105]
          - button [ref=e106] [cursor=pointer]:
            - cell "2009" [ref=e107]
            - cell "LOW" [ref=e108]
            - cell [ref=e110]
            - cell "buggy" [ref=e111]
          - button [ref=e112] [cursor=pointer]:
            - cell "2099" [ref=e113]
            - cell "LOW" [ref=e114]
            - cell [ref=e116]
            - cell "buggy" [ref=e117]
          - button [ref=e118] [cursor=pointer]:
            - cell "2437" [ref=e119]
            - cell "LOW" [ref=e120]
            - cell [ref=e122]
            - cell "buggy" [ref=e123]
          - button [ref=e124] [cursor=pointer]:
            - cell "2786" [ref=e125]
            - cell "LOW" [ref=e126]
            - cell [ref=e128]
            - cell "buggy" [ref=e129]
          - button [ref=e130] [cursor=pointer]:
            - cell "3150" [ref=e131]
            - cell "LOW" [ref=e132]
            - cell [ref=e134]
            - cell "buggy" [ref=e135]
          - button [ref=e136] [cursor=pointer]:
            - cell "3287" [ref=e137]
            - cell "LOW" [ref=e138]
            - cell [ref=e140]
            - cell "buggy" [ref=e141]
```

# Test source

```ts
  1  | import { test, expect, defaultUser } from '../fixtures';
  2  | 
  3  | test.beforeEach(async ({ loginPage, boardPage }) => {
  4  |   await loginPage.login(defaultUser.username, defaultUser.password);
  5  |   await boardPage.waitLoaded();
  6  | });
  7  | 
  8  | test('title bar shows the logo, the BuggyBoard title and a logout button', async ({ boardPage }) => {
  9  |   await expect(boardPage.titleBarLogo).toBeVisible();
  10 |   await expect(boardPage.titleBarHeading).toHaveText('BuggyBoard');
> 11 |   await expect(boardPage.logoutButton).toBeVisible();
     |                                        ^ Error: expect(locator).toBeVisible() failed
  12 | });
  13 | 
  14 | test('logo sits in a rounded box', async ({ boardPage }) => {
  15 |   expect(await boardPage.logoBoxRadius()).not.toBe('0px');
  16 | });
  17 | 
  18 | test('title sits immediately to the right of the logo', async ({ boardPage }) => {
  19 |   const gap = await boardPage.logoToTitleGap();
  20 | 
  21 |   expect(gap).toBeGreaterThanOrEqual(0);
  22 |   expect(gap).toBeLessThan(40);
  23 | });
  24 | 
  25 | test('logout button is right-justified', async ({ boardPage }) => {
  26 |   expect(await boardPage.logoutRightInset()).toBeLessThan(40);
  27 | });
  28 | 
```