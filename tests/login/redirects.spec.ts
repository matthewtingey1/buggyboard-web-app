import { test, expect, defaultUser } from '../fixtures';

for (const path of ['/board', '/', '/no-such-page']) {
  test(`unauthenticated visit to ${path} redirects to /login`, async ({ loginPage }) => {
    await loginPage.visit(path);

    await expect(loginPage.page).toHaveURL(/\/login$/);
  });
}

test('authenticated user visiting /login is redirected to /board', async ({ loginPage }) => {
  await loginPage.login(defaultUser.username, defaultUser.password);

  await loginPage.goto();

  await expect(loginPage.page).toHaveURL(/\/board$/);
});
