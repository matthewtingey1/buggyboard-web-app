import { test, expect, seedUser } from './fixtures';

// Starting state for test planning and generation: logged in, on the loaded board.

test('seed', async ({ loginPage, boardPage }) => {
  await loginPage.login(seedUser.username, seedUser.password);
  await boardPage.waitLoaded();

  await expect(boardPage.bugTable).toBeVisible();
  await expect(boardPage.newBugButton).toBeVisible();
});
