import { test, expect, defaultUser, uid } from '../fixtures';

// Unique per run: a fixed unknown username would hit the login rate limit after 20 runs.
const unknownUser = `no-such-user-${uid()}`;
const wrongSecret = `${defaultUser.password}-wrong`;

const cases = [
  { name: 'invalid username', username: unknownUser, secret: wrongSecret, error: 'Invalid username or password.' },
  { name: 'invalid password', username: defaultUser.username, secret: wrongSecret, error: 'Invalid username or password.' },
  { name: 'blank username', username: '', secret: wrongSecret, error: 'Username cannot be blank.' },
  { name: 'blank password', username: defaultUser.username, secret: '', error: 'Password cannot be blank.' },
  { name: 'blank username and password', username: '', secret: '', error: 'Please enter your username and password.' },
];

for (const c of cases) {
  test(`login with ${c.name} is rejected with "${c.error}"`, async ({ loginPage }) => {
    await loginPage.goto();

    await loginPage.submit(c.username, c.secret);

    await expect(loginPage.error).toHaveText(c.error);
    await expect(loginPage.page).toHaveURL(/\/login$/);
    expect(await loginPage.storedUser()).toBeNull();
  });
}
