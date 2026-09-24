# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 01-02-static.spec.ts >> 02-AC1..4 users.json at root, unique usernames, default buggy user present
- Location: specs/01-02-static.spec.ts:14:1

# Error details

```
Error: ENOENT: no such file or directory, open '~/DEV/IdeaProjects/buggyboard-web-app/quality-reports/users.json'
```

# Test source

```ts
  1  | import { test, expect } from '../pages/fixtures';
  2  | import { readFileSync } from 'node:fs';
  3  | import { resolve } from 'node:path';
  4  | 
  5  | test('01-AC1 app references /favicon.ico and it is served', async ({ page, request }) => {
  6  |   await page.goto('/login');
  7  |   const href = await page.locator('link[rel="icon"]').getAttribute('href');
  8  |   const res = await request.get('/favicon.ico');
  9  |   expect(href).toBe('/favicon.ico');
  10 |   expect(res.status()).toBe(200);
  11 |   expect((await res.body()).length).toBeGreaterThan(0);
  12 | });
  13 | 
  14 | test('02-AC1..4 users.json at root, unique usernames, default buggy user present', async () => {
> 15 |   const users = JSON.parse(readFileSync(resolve(new URL('.', import.meta.url).pathname, '../../../../../users.json'), 'utf8')) as Array<{ username: string; password: string }>;
     |                            ^ Error: ENOENT: no such file or directory, open '~/DEV/IdeaProjects/buggyboard-web-app/quality-reports/users.json'
  16 |   const names = users.map((u) => u.username);
  17 |   expect(users.every((u) => typeof u.username === 'string' && typeof u.password === 'string')).toBe(true);
  18 |   expect(new Set(names).size).toBe(names.length);
  19 |   expect(users.find((u) => u.username === 'buggy')?.password).toBe('1970beetle');
  20 | });
  21 | 
```