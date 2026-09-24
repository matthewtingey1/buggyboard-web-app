import { test, expect, defaultUser } from '../fixtures';

test('logout clears the session and redirects to /login', async ({ loginPage, boardPage }) => {
  await loginPage.login(defaultUser.username, defaultUser.password);

  await boardPage.logout();

  await expect(loginPage.page).toHaveURL(/\/login$/);
  expect(await loginPage.storedUser()).toBeNull();
});

test('visiting /board after logout redirects to /login', async ({ loginPage, boardPage }) => {
  await loginPage.login(defaultUser.username, defaultUser.password);
  await boardPage.logout();

  await boardPage.visit('/board');

  await expect(boardPage.page).toHaveURL(/\/login$/);
});

test('browser Back after logout does not restore the session', async ({ loginPage, boardPage }) => {
  await loginPage.login(defaultUser.username, defaultUser.password);
  await boardPage.logout();
  await expect(loginPage.page).toHaveURL(/\/login$/);

  await boardPage.goBack();

  await expect(boardPage.page).not.toHaveURL(/\/board$/);
  await expect(boardPage.logoutButton).toHaveCount(0);
  expect(await loginPage.storedUser()).toBeNull();
});

test('landing on the board via Back after logout redirects to login', async ({ loginPage, boardPage }) => {
  await loginPage.login(defaultUser.username, defaultUser.password);
  await boardPage.visit('/');
  await boardPage.waitLoaded();
  await boardPage.logout();

  await boardPage.goBack();

  await expect(boardPage.page).toHaveURL(/\/login$/);
  await expect(loginPage.loginButton).toBeVisible();
});
