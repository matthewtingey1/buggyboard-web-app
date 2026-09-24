import { test, expect } from '../fixtures';

test('the app references /favicon.ico as its favicon', async ({ loginPage }) => {
  await loginPage.goto();

  const href = await loginPage.faviconHref();

  expect(href).toBe('/favicon.ico');
});

test('/favicon.ico is served', async ({ request }) => {
  const res = await request.get('/favicon.ico');

  expect(res.status()).toBe(200);
  expect((await res.body()).length).toBeGreaterThan(0);
});
