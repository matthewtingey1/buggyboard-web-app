# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 11-search.spec.ts >> 11 search >> 11-S3 "login" matches both "Login fails" and "Issue with log-in"
- Location: specs/11-search.spec.ts:32:3

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  getByRole('table', { name: 'Bugs' }).locator('tbody tr[role="button"]').filter({ has: locator('td:nth-child(3)').filter({ hasText: /^\[functional\] Issue with log-in mud5tg2m0qil$/ }) })
Expected: 1
Received: 0
Timeout:  5000ms

Call log:
  - Expect "toHaveCount" getByRole('table', { name: 'Bugs' }).locator('tbody tr[role="button"]').filter({ has: locator('td:nth-child(3)').filter({ hasText: /^\[functional\] Issue with log-in mud5tg2m0qil$/ }) }) with timeout 5000ms
  - waiting for getByRole('table', { name: 'Bugs' }).locator('tbody tr[role="button"]').filter({ has: locator('td:nth-child(3)').filter({ hasText: /^\[functional\] Issue with log-in mud5tg2m0qil$/ }) })
    14 × locator resolved to 0 elements
       - unexpected value "0"

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e5]:
      - img "BuggyBoard" [ref=e7]
      - heading "BuggyBoard" [level=1] [ref=e8]
    - generic [ref=e9]:
      - generic [ref=e10]:
        - search "Search bugs by title" [active] [ref=e11]: login
        - button "Clear search" [ref=e12] [cursor=pointer]: ×
      - button "New Bug" [ref=e14] [cursor=pointer]
      - button "Logout" [ref=e16] [cursor=pointer]
  - main [ref=e17]:
    - generic [ref=e18]:
      - group "Filter by bug state" [ref=e20]:
        - button "Open" [ref=e21] [cursor=pointer]
        - button "Closed" [ref=e22] [cursor=pointer]
      - table "Bugs" [ref=e25]:
        - rowgroup [ref=e26]:
          - row [ref=e27]:
            - columnheader [ref=e28]:
              - button "ID" [ref=e29] [cursor=pointer]
            - columnheader [ref=e31]:
              - button "Severity" [ref=e32] [cursor=pointer]:
                - text: Severity
                - generic [aria-hidden] [ref=e33]: ↓
            - columnheader [ref=e34]:
              - button "Title" [ref=e35] [cursor=pointer]
            - columnheader [ref=e37]:
              - button "Owner" [ref=e38] [cursor=pointer]
        - rowgroup [ref=e40]:
          - button [ref=e41] [cursor=pointer]:
            - cell "493" [ref=e42]
            - cell "HIGH" [ref=e43]
            - cell "[functional] Login fails mud5tg2m0qil" [ref=e45]
            - cell "buggy" [ref=e46]
          - button [ref=e47] [cursor=pointer]:
            - cell "1" [ref=e48]
            - cell "LOW" [ref=e49]
            - cell "Login page accepts username with trailing spaces" [ref=e51]
            - cell "matt" [ref=e52]
```

# Test source

```ts
  1  | import { test, expect } from '../pages/fixtures';
  2  | import { uid } from '../pages/api';
  3  | 
  4  | const norm = (s: string) => s.toLowerCase().replace(/\p{P}/gu, '').replace(/\s+/g, ' ').trim();
  5  | 
  6  | test.describe('11 search', () => {
  7  |   let t: string;
  8  |   test.beforeEach(async ({ api, loginPage, board }) => {
  9  |     t = uid();
  10 |     await api.create(`Login fails ${t}`, 'high');
  11 |     await api.create(`Issue with log-in ${t}`, 'low');
  12 |     await api.create(`Unrelated crash ${t}`, 'mid');
  13 |     await loginPage.login('buggy', '1970beetle');
  14 |     await board.waitLoaded();
  15 |   });
  16 | 
  17 |   test('11-S1 blank search shows all bugs and no "no bugs matched" message', async ({ board }) => {
  18 |     await expect(board.searchInput).toHaveValue('');
  19 |     expect(await board.rowsContaining(t)).toHaveLength(3);
  20 |     await expect(board.noMatches).toHaveCount(0);
  21 |     await expect(board.clearSearch).toBeHidden();
  22 |   });
  23 | 
  24 |   test('11-S2 typing "login" hides titles without login', async ({ board }) => {
  25 |     await board.search('login');
  26 |     await expect(board.rowFor(`[functional] Unrelated crash ${t}`)).toHaveCount(0);
  27 |     await expect(board.rowFor(`[functional] Login fails ${t}`)).toHaveCount(1);
  28 |     const titles = (await board.rows()).map((r) => r.title);
  29 |     expect(titles.every((x) => norm(x).includes('login'))).toBe(true);
  30 |   });
  31 | 
  32 |   test('11-S3 "login" matches both "Login fails" and "Issue with log-in"', async ({ board }) => {
  33 |     await board.search('login');
  34 |     await expect(board.rowFor(`[functional] Login fails ${t}`)).toHaveCount(1);
> 35 |     await expect(board.rowFor(`[functional] Issue with log-in ${t}`)).toHaveCount(1);
     |                                                                       ^ Error: expect(locator).toHaveCount(expected) failed
  36 |   });
  37 | 
  38 |   test('11-S3b case and whitespace are normalised ("  LOGIN   FAILS ")', async ({ board }) => {
  39 |     await board.search(`  LOGIN   FAILS ${t.toUpperCase()} `);
  40 |     await expect(board.rowFor(`[functional] Login fails ${t}`)).toHaveCount(1);
  41 |   });
  42 | 
  43 |   test('11-S4 X clears the search and restores all bugs', async ({ board }) => {
  44 |     await board.search(`crash ${t}`);
  45 |     expect(await board.rowsContaining(t)).toHaveLength(1);
  46 |     await expect(board.clearSearch).toBeVisible();
  47 |     await board.clearSearch.click();
  48 |     await expect(board.searchInput).toHaveValue('');
  49 |     await expect(board.clearSearch).toBeHidden();
  50 |     expect(await board.rowsContaining(t)).toHaveLength(3);
  51 |   });
  52 | 
  53 |   test('11-S5 sort order and indicator are preserved while searching', async ({ board }) => {
  54 |     await board.sortBy('Title');
  55 |     await board.search(t);
  56 |     expect(await board.indicator('Title')).toBe('↑');
  57 |     const titles = (await board.rowsContaining(t)).map((r) => r.title);
  58 |     expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b)));
  59 |     expect(titles).toHaveLength(3);
  60 |   });
  61 | 
  62 |   test('11-S6 no-match search shows "No bugs matched." and no rows', async ({ board }) => {
  63 |     await board.search(`zzqx nomatch ${t}`);
  64 |     await expect(board.noMatches).toBeVisible();
  65 |     await expect(board.bodyRows).toHaveCount(0);
  66 |   });
  67 | });
  68 | 
  69 | test.describe('11 search punctuation probe', () => {
  70 |   test('11-S3c query "log-in" matches title "Login fails" (both sides normalised)', async ({ api, loginPage, board }) => {
  71 |     const t = uid();
  72 |     const bug = await api.create(`Login fails ${t}`, 'high');
  73 |     await loginPage.login('buggy', '1970beetle');
  74 |     await board.waitLoaded();
  75 |     await board.search('log-in');
  76 |     await expect(board.rowFor(bug.title)).toHaveCount(1);
  77 |   });
  78 | });
  79 | 
```