import { test, expect, defaultUser, uid } from '../fixtures';

test.beforeEach(async ({ browserName }) => {
  test.skip(browserName !== 'chromium', 'Accessibility checks are calibrated for Chromium.');
});

test('a failed login puts focus back in Username and marks it invalid', async ({ loginPage }) => {
  await loginPage.goto();

  await loginPage.submit(`no-such-user-${uid()}`, `${defaultUser.password}-wrong`);

  await expect(loginPage.error).toBeVisible();
  await expect(loginPage.usernameInput).toBeFocused();
  await expect(loginPage.usernameInput).toHaveAttribute('aria-invalid', 'true');
});

test('each route has its own page title', async ({ loginPage }) => {
  await loginPage.goto();
  await expect(loginPage.page).toHaveTitle('Log in – BuggyBoard');

  await loginPage.login(defaultUser.username, defaultUser.password);

  await expect(loginPage.page).toHaveTitle('Board – BuggyBoard');
});
