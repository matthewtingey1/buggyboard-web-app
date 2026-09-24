# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api/login.spec.ts >> POST /api/login with a number username returns a 400 JSON error
- Location: tests/api/login.spec.ts:43:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 400
Received: 500
```

# Test source

```ts
  1  | import { test, expect, users, defaultUser } from '../fixtures';
  2  | 
  3  | const wrong = `${defaultUser.password}-wrong`;
  4  | 
  5  | for (const user of users) {
  6  |   test(`POST /api/login returns 200 and the username for ${user.username}`, async ({ bugApi }) => {
  7  |     const res = await bugApi.send('POST', '/api/login', { data: { username: user.username, password: user.password } });
  8  | 
  9  |     expect(res.status()).toBe(200);
  10 |     expect(await res.json()).toEqual({ username: user.username });
  11 |   });
  12 | }
  13 | 
  14 | test('POST /api/login trims the username', async ({ bugApi }) => {
  15 |   const res = await bugApi.send('POST', '/api/login', { data: { username: `  ${defaultUser.username} `, password: defaultUser.password } });
  16 | 
  17 |   expect(res.status()).toBe(200);
  18 |   expect(await res.json()).toEqual({ username: defaultUser.username });
  19 | });
  20 | 
  21 | const rejections = [
  22 |   { name: 'wrong password', body: { username: defaultUser.username, password: wrong }, status: 401, error: 'invalid_credentials' },
  23 |   { name: 'unknown user', body: { username: 'no-such-user', password: wrong }, status: 401, error: 'invalid_credentials' },
  24 |   { name: 'username in the wrong case', body: { username: defaultUser.username.toUpperCase(), password: defaultUser.password }, status: 401, error: 'invalid_credentials' },
  25 |   { name: 'blank username', body: { username: '', password: wrong }, status: 400, error: 'blank_username' },
  26 |   { name: 'whitespace-only username', body: { username: '   ', password: wrong }, status: 400, error: 'blank_username' },
  27 |   { name: 'missing password', body: { username: defaultUser.username }, status: 400, error: 'blank_password' },
  28 |   { name: 'blank password', body: { username: defaultUser.username, password: '' }, status: 400, error: 'blank_password' },
  29 |   { name: 'both blank', body: { username: '', password: '' }, status: 400, error: 'missing_credentials' },
  30 |   { name: 'empty body', body: {}, status: 400, error: 'missing_credentials' },
  31 | ];
  32 | 
  33 | for (const r of rejections) {
  34 |   test(`POST /api/login with ${r.name} returns ${r.status} ${r.error}`, async ({ bugApi }) => {
  35 |     const res = await bugApi.send('POST', '/api/login', { data: r.body });
  36 | 
  37 |     expect(res.status()).toBe(r.status);
  38 |     expect(await res.json()).toMatchObject({ error: r.error });
  39 |   });
  40 | }
  41 | 
  42 | for (const [kind, username] of [['number', 123], ['array', ['buggy']], ['object', { name: 'buggy' }]] as const) {
  43 |   test(`POST /api/login with a ${kind} username returns a 400 JSON error`, async ({ bugApi }) => {
  44 |     test.fail(true, 'Known contract break: a non-string username crashes to a 500 HTML stack trace.');
  45 | 
  46 |     const res = await bugApi.send('POST', '/api/login', { data: { username, password: wrong } });
  47 | 
> 48 |     expect(res.status()).toBe(400);
     |                          ^ Error: expect(received).toBe(expected) // Object.is equality
  49 |     expect(res.headers()['content-type']).toContain('application/json');
  50 |   });
  51 | }
  52 | 
```