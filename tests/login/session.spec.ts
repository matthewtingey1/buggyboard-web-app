import { test, expect, defaultUser } from '../fixtures';

test('authenticated session persists across a page refresh', async ({ loginPage, boardPage }) => {
  await loginPage.login(defaultUser.username, defaultUser.password);

  await boardPage.reload();

  await expect(boardPage.page).toHaveURL(/\/board$/);
  await expect(boardPage.logoutButton).toBeVisible();
});
