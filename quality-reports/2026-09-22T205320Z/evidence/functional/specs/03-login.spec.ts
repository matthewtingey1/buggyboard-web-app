import { test, expect } from '../pages/fixtures';
import { USER } from '../pages/api';

test.describe('03 login', () => {
  test('03-S1 login page displays username, masked password, login button', async ({ loginPage }) => {
    await loginPage.goto();
    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
    await expect(loginPage.loginButton).toBeVisible();
    await expect(loginPage.logo).toBeVisible();
  });

  for (const path of ['/board', '/', '/nope/xyz']) {
    test(`03-S2 unauthenticated visit to ${path} redirects to /login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login$/);
    });
  }

  test('03-S3 valid login lands on /board', async ({ loginPage, board, page }) => {
    await loginPage.goto();
    await loginPage.submit(USER.username, USER.password);
    await expect(page).toHaveURL(/\/board$/);
    await expect(board.table).toBeVisible();
  });

  test('03-S3b valid login as second user vanny', async ({ loginPage, page }) => {
    await loginPage.goto();
    await loginPage.submit('vanny', '1979bus');
    await expect(page).toHaveURL(/\/board$/);
  });

  test('03-S3c valid login as new user matt (diff slice)', async ({ loginPage, page }) => {
    await loginPage.goto();
    await loginPage.submit('matt', '<redacted>');
    await expect(page).toHaveURL(/\/board$/);
  });

  for (const field of ['username', 'password'] as const) {
    test(`03-S4 Enter on ${field} field submits login`, async ({ loginPage, page }) => {
      await loginPage.goto();
      await loginPage.fill(USER.username, USER.password);
      await (field === 'username' ? loginPage.usernameInput : loginPage.passwordInput).press('Enter');
      await expect(page).toHaveURL(/\/board$/);
    });
  }

  test('03-S5 invalid username shows generic error', async ({ loginPage, page }) => {
    await loginPage.goto();
    await loginPage.submit('nosuchuser', 'whatever');
    await expect(loginPage.error).toHaveText('Invalid username or password.');
    await expect(page).toHaveURL(/\/login$/);
    expect(await loginPage.storedUser()).toBeNull();
  });

  test('03-S6 invalid password shows same generic error', async ({ loginPage, page }) => {
    await loginPage.goto();
    await loginPage.submit(USER.username, 'wrong');
    await expect(loginPage.error).toHaveText('Invalid username or password.');
    await expect(page).toHaveURL(/\/login$/);
    expect(await loginPage.storedUser()).toBeNull();
  });

  test('03-S7 blank username shows blank-username error', async ({ loginPage, page }) => {
    await loginPage.goto();
    await loginPage.submit('', 'something');
    await expect(loginPage.error).toHaveText('Username cannot be blank.');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('03-S8 blank password shows blank-password error', async ({ loginPage, page }) => {
    await loginPage.goto();
    await loginPage.submit(USER.username, '');
    await expect(loginPage.error).toHaveText('Password cannot be blank.');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('03-S9 blank username and password shows missing-credentials error', async ({ loginPage, page }) => {
    await loginPage.goto();
    await loginPage.submit('', '');
    await expect(loginPage.error).toHaveText('Please enter your username and password.');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('03-S10 username whitespace is trimmed and login succeeds', async ({ loginPage, page }) => {
    await loginPage.goto();
    await loginPage.submit(`   ${USER.username}  `, USER.password);
    await expect(page).toHaveURL(/\/board$/);
    expect(JSON.parse((await loginPage.storedUser())!).username).toBe(USER.username);
  });

  test('03-S11 authenticated user visiting /login is redirected to /board', async ({ signedIn, page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/\/board$/);
  });

  test('03-S12 session persists across reload', async ({ signedIn, page }) => {
    await page.reload();
    await expect(page).toHaveURL(/\/board$/);
    await expect(signedIn.logoutButton).toBeVisible();
  });
});
