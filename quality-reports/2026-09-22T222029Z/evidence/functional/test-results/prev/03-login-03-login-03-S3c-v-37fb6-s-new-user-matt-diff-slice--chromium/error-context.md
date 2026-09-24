# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 03-login.spec.ts >> 03 login >> 03-S3c valid login as new user matt (diff slice)
- Location: specs/03-login.spec.ts:33:3

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/board$/
Received string:  "http://localhost:5173/login"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    14 × locator resolved to <html lang="en">…</html>
       - unexpected value "http://localhost:5173/login"

```

```yaml
- heading "BuggyBoard" [level=1]
- paragraph: Log in
- text: Username
- textbox "Username": matt
- text: Password
- textbox "Password": <redacted>
- alert: Invalid username or password.
- button "Login"
```

# Test source

```ts
  1   | import { test, expect } from '../pages/fixtures';
  2   | import { USER } from '../pages/api';
  3   | 
  4   | test.describe('03 login', () => {
  5   |   test('03-S1 login page displays username, masked password, login button', async ({ loginPage }) => {
  6   |     await loginPage.goto();
  7   |     await expect(loginPage.usernameInput).toBeVisible();
  8   |     await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
  9   |     await expect(loginPage.loginButton).toBeVisible();
  10  |     await expect(loginPage.logo).toBeVisible();
  11  |   });
  12  | 
  13  |   for (const path of ['/board', '/', '/nope/xyz']) {
  14  |     test(`03-S2 unauthenticated visit to ${path} redirects to /login`, async ({ page }) => {
  15  |       await page.goto(path);
  16  |       await expect(page).toHaveURL(/\/login$/);
  17  |     });
  18  |   }
  19  | 
  20  |   test('03-S3 valid login lands on /board', async ({ loginPage, board, page }) => {
  21  |     await loginPage.goto();
  22  |     await loginPage.submit(USER.username, USER.password);
  23  |     await expect(page).toHaveURL(/\/board$/);
  24  |     await expect(board.table).toBeVisible();
  25  |   });
  26  | 
  27  |   test('03-S3b valid login as second user vanny', async ({ loginPage, page }) => {
  28  |     await loginPage.goto();
  29  |     await loginPage.submit('vanny', '1979bus');
  30  |     await expect(page).toHaveURL(/\/board$/);
  31  |   });
  32  | 
  33  |   test('03-S3c valid login as new user matt (diff slice)', async ({ loginPage, page }) => {
  34  |     await loginPage.goto();
  35  |     await loginPage.submit('matt', '<redacted>');
> 36  |     await expect(page).toHaveURL(/\/board$/);
      |                        ^ Error: expect(page).toHaveURL(expected) failed
  37  |   });
  38  | 
  39  |   for (const field of ['username', 'password'] as const) {
  40  |     test(`03-S4 Enter on ${field} field submits login`, async ({ loginPage, page }) => {
  41  |       await loginPage.goto();
  42  |       await loginPage.fill(USER.username, USER.password);
  43  |       await (field === 'username' ? loginPage.usernameInput : loginPage.passwordInput).press('Enter');
  44  |       await expect(page).toHaveURL(/\/board$/);
  45  |     });
  46  |   }
  47  | 
  48  |   test('03-S5 invalid username shows generic error', async ({ loginPage, page }) => {
  49  |     await loginPage.goto();
  50  |     await loginPage.submit('nosuchuser', 'whatever');
  51  |     await expect(loginPage.error).toHaveText('Invalid username or password.');
  52  |     await expect(page).toHaveURL(/\/login$/);
  53  |     expect(await loginPage.storedUser()).toBeNull();
  54  |   });
  55  | 
  56  |   test('03-S6 invalid password shows same generic error', async ({ loginPage, page }) => {
  57  |     await loginPage.goto();
  58  |     await loginPage.submit(USER.username, 'wrong');
  59  |     await expect(loginPage.error).toHaveText('Invalid username or password.');
  60  |     await expect(page).toHaveURL(/\/login$/);
  61  |     expect(await loginPage.storedUser()).toBeNull();
  62  |   });
  63  | 
  64  |   test('03-S7 blank username shows blank-username error', async ({ loginPage, page }) => {
  65  |     await loginPage.goto();
  66  |     await loginPage.submit('', 'something');
  67  |     await expect(loginPage.error).toHaveText('Username cannot be blank.');
  68  |     await expect(page).toHaveURL(/\/login$/);
  69  |   });
  70  | 
  71  |   test('03-S8 blank password shows blank-password error', async ({ loginPage, page }) => {
  72  |     await loginPage.goto();
  73  |     await loginPage.submit(USER.username, '');
  74  |     await expect(loginPage.error).toHaveText('Password cannot be blank.');
  75  |     await expect(page).toHaveURL(/\/login$/);
  76  |   });
  77  | 
  78  |   test('03-S9 blank username and password shows missing-credentials error', async ({ loginPage, page }) => {
  79  |     await loginPage.goto();
  80  |     await loginPage.submit('', '');
  81  |     await expect(loginPage.error).toHaveText('Please enter your username and password.');
  82  |     await expect(page).toHaveURL(/\/login$/);
  83  |   });
  84  | 
  85  |   test('03-S10 username whitespace is trimmed and login succeeds', async ({ loginPage, page }) => {
  86  |     await loginPage.goto();
  87  |     await loginPage.submit(`   ${USER.username}  `, USER.password);
  88  |     await expect(page).toHaveURL(/\/board$/);
  89  |     expect(JSON.parse((await loginPage.storedUser())!).username).toBe(USER.username);
  90  |   });
  91  | 
  92  |   test('03-S11 authenticated user visiting /login is redirected to /board', async ({ signedIn, page }) => {
  93  |     await page.goto('/login');
  94  |     await expect(page).toHaveURL(/\/board$/);
  95  |   });
  96  | 
  97  |   test('03-S12 session persists across reload', async ({ signedIn, page }) => {
  98  |     await page.reload();
  99  |     await expect(page).toHaveURL(/\/board$/);
  100 |     await expect(signedIn.logoutButton).toBeVisible();
  101 |   });
  102 | });
  103 | 
```