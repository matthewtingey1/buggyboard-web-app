import { test, expect, defaultUser } from '../fixtures';

test.beforeEach(async ({ loginPage, boardPage }) => {
  await loginPage.login(defaultUser.username, defaultUser.password);
  await boardPage.waitLoaded();
});

test('title bar shows the logo, the BuggyBoard title and a logout button', async ({ boardPage }) => {
  await expect(boardPage.titleBarLogo).toBeVisible();
  await expect(boardPage.titleBarHeading).toHaveText('BuggyBoard');
  await expect(boardPage.logoutButton).toBeVisible();
});

test('logo sits in a rounded box', async ({ boardPage }) => {
  expect(await boardPage.logoBoxRadius()).not.toBe('0px');
});

test('title sits immediately to the right of the logo', async ({ boardPage }) => {
  const gap = await boardPage.logoToTitleGap();

  expect(gap).toBeGreaterThanOrEqual(0);
  expect(gap).toBeLessThan(40);
});

test('logout button is right-justified', async ({ boardPage }) => {
  expect(await boardPage.logoutRightInset()).toBeLessThan(40);
});
