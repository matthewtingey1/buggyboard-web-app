import { test, expect } from '../fixtures';

test('login page displays the logo, username, masked password and login button', async ({ loginPage }) => {
  await loginPage.goto();

  await expect(loginPage.logo).toBeVisible();
  await expect(loginPage.usernameInput).toBeVisible();
  await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
  await expect(loginPage.loginButton).toBeVisible();
});
