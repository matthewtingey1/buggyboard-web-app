import { test, expect, users, defaultUser } from '../fixtures';

for (const user of users) {
  test(`valid login as ${user.username} lands on the board`, async ({ loginPage, boardPage }) => {
    await loginPage.goto();

    await loginPage.submit(user.username, user.password);

    await expect(loginPage.page).toHaveURL(/\/board$/);
    await expect(boardPage.bugTable).toBeVisible();
  });
}

for (const field of ['username', 'password'] as const) {
  test(`Enter on the ${field} field submits login`, async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.fill(defaultUser.username, defaultUser.password);

    await loginPage.pressEnterIn(field);

    await expect(loginPage.page).toHaveURL(/\/board$/);
  });
}

test('leading and trailing whitespace is trimmed from the username', async ({ loginPage }) => {
  await loginPage.goto();

  await loginPage.submit(`   ${defaultUser.username}  `, defaultUser.password);

  await expect(loginPage.page).toHaveURL(/\/board$/);
  expect(JSON.parse((await loginPage.storedUser()) ?? '{}').username).toBe(defaultUser.username);
});
