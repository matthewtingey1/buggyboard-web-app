# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: seed.spec.ts >> seed
- Location: tests/seed.spec.ts:5:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('header').getByRole('button', { name: 'New Bug', exact: true })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('header').getByRole('button', { name: 'New Bug', exact: true }) with timeout 5000ms
  - waiting for locator('header').getByRole('button', { name: 'New Bug', exact: true })

```

```yaml
- banner:
  - img "BuggyBoard"
  - heading "BuggyBoard" [level=1]
  - search:
    - textbox "Search bugs by title":
      - /placeholder: Search bugs…
  - button "Report Bug"
  - button "Logout"
- main:
  - group "Filter by bug state":
    - button "Open" [pressed]
    - button "Closed"
  - status: 3 open bugs shown.
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
        - row "1 LOW Login page accepts username with trailing spaces matt":
          - cell "1"
          - cell "LOW"
          - cell "Login page accepts username with trailing spaces":
            - button "Login page accepts username with trailing spaces"
          - cell "matt"
```

# Test source

```ts
  1  | import { test, expect, seedUser } from './fixtures';
  2  | 
  3  | // Starting state for test planning and generation: logged in, on the loaded board.
  4  | 
  5  | test('seed', async ({ loginPage, boardPage }) => {
  6  |   await loginPage.login(seedUser.username, seedUser.password);
  7  |   await boardPage.waitLoaded();
  8  | 
  9  |   await expect(boardPage.bugTable).toBeVisible();
> 10 |   await expect(boardPage.newBugButton).toBeVisible();
     |                                        ^ Error: expect(locator).toBeVisible() failed
  11 | });
  12 | 
```