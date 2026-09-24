import { test, expect } from '../pages/fixtures';

test('04-AC1 title bar has left logo in rounded box, title right of logo, right-justified logout', async ({ signedIn }) => {
  const logo = await signedIn.titleBarLogo.boundingBox();
  const title = await signedIn.titleBarHeading.boundingBox();
  const logout = await signedIn.logoutButton.boundingBox();
  const header = await signedIn.header.boundingBox();
  const radius = await signedIn.titleBarLogo.locator('..').evaluate((e) => getComputedStyle(e).borderRadius);
  expect(logo!.x).toBeLessThan(title!.x);
  expect(title!.x - (logo!.x + logo!.width)).toBeLessThan(40);
  expect(header!.x + header!.width - (logout!.x + logout!.width)).toBeLessThan(40);
  expect(radius).not.toBe('0px');
});

test('05-S1 logout clears auth and redirects to /login', async ({ signedIn, loginPage, page }) => {
  await signedIn.logout();
  await expect(page).toHaveURL(/\/login$/);
  expect(await loginPage.storedUser()).toBeNull();
});

test('05-S2 after logout navigating to /board redirects to /login', async ({ signedIn, page }) => {
  await signedIn.logout();
  await page.goto('/board');
  await expect(page).toHaveURL(/\/login$/);
});

test('05-S3 browser Back after logout does not restore session', async ({ signedIn, loginPage, page }) => {
  await signedIn.logout();
  await expect(page).toHaveURL(/\/login$/);
  await page.goBack();
  await page.waitForLoadState();
  await expect(page).not.toHaveURL(/\/board$/);
  await expect(signedIn.logoutButton).toHaveCount(0);
  const state = await page.context().storageState();
  const stored = state.origins.flatMap((o) => o.localStorage).find((e) => e.name === 'buggyboard_user');
  expect(stored).toBeUndefined();
  await page.goForward().catch(() => undefined);
  await expect(signedIn.logoutButton).toHaveCount(0);
});

test('05-S4 logged-out user landing on /board via Back is redirected to login', async ({ signedIn, loginPage, page }) => {
  await page.goto('/'); // new history entry that redirects to /board
  await signedIn.waitLoaded();
  await signedIn.logout();
  await page.goBack();
  await expect(page).toHaveURL(/\/login$/);
  await expect(loginPage.loginButton).toBeVisible();
});
