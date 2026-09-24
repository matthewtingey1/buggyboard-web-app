import { test, expect } from '../pages/fixtures';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

test('01-AC1 app references /favicon.ico and it is served', async ({ page, request }) => {
  await page.goto('/login');
  const href = await page.locator('link[rel="icon"]').getAttribute('href');
  const res = await request.get('/favicon.ico');
  expect(href).toBe('/favicon.ico');
  expect(res.status()).toBe(200);
  expect((await res.body()).length).toBeGreaterThan(0);
});

test('02-AC1..4 users.json at root, unique usernames, default buggy user present', async () => {
  const users = JSON.parse(readFileSync(resolve(new URL('.', import.meta.url).pathname, '../../../../../users.json'), 'utf8')) as Array<{ username: string; password: string }>;
  const names = users.map((u) => u.username);
  expect(users.every((u) => typeof u.username === 'string' && typeof u.password === 'string')).toBe(true);
  expect(new Set(names).size).toBe(names.length);
  expect(users.find((u) => u.username === 'buggy')?.password).toBe('1970beetle');
});
