# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api/auth.spec.ts >> GET /api/bugs without a session returns 401
- Location: tests/api/auth.spec.ts:4:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 401
Received: 200
```

# Test source

```ts
  1  | import { test, expect, PREFIX, uid } from '../fixtures';
  2  | 
  3  | // The request fixture carries no session, so every call here is anonymous.
  4  | test('GET /api/bugs without a session returns 401', async ({ bugApi }) => {
  5  |   test.fail(true, 'Known security defect: /api/bugs has no server-side authentication.');
  6  | 
  7  |   const res = await bugApi.send('GET', '/api/bugs');
  8  | 
> 9  |   expect(res.status()).toBe(401);
     |                        ^ Error: expect(received).toBe(expected) // Object.is equality
  10 | });
  11 | 
  12 | test('POST /api/bugs without a session returns 401', async ({ bugApi }) => {
  13 |   test.fail(true, 'Known security defect: /api/bugs has no server-side authentication.');
  14 | 
  15 |   const res = await bugApi.createRaw({ title: `${PREFIX} anon ${uid()}`, severity: 'low', owner: 'buggy', description: 'd' });
  16 | 
  17 |   expect(res.status()).toBe(401);
  18 | });
  19 | 
  20 | test('DELETE /api/bugs/:id without a session leaves the bug in place', async ({ bugApi }) => {
  21 |   test.fail(true, 'Known security defect: /api/bugs has no server-side authentication.');
  22 |   const bug = await bugApi.create(`anon delete ${uid()}`);
  23 | 
  24 |   await bugApi.send('DELETE', `/api/bugs/${bug.id}`);
  25 | 
  26 |   expect(await bugApi.get(bug.id)).not.toBeNull();
  27 | });
  28 | 
  29 | test('responses do not advertise the server framework', async ({ bugApi }) => {
  30 |   const res = await bugApi.send('GET', '/api/health');
  31 | 
  32 |   expect(res.headers()['x-powered-by']).toBeUndefined();
  33 | });
  34 | 
  35 | test('responses carry basic security headers', async ({ bugApi }) => {
  36 |   const res = await bugApi.send('GET', '/api/health');
  37 | 
  38 |   expect(res.headers()['x-content-type-options']).toBe('nosniff');
  39 |   expect(res.headers()['x-frame-options']).toBe('DENY');
  40 | });
  41 | 
  42 | test('repeated failed logins for one username are refused with 429', async ({ bugApi }) => {
  43 |   // A throwaway username, so no real account is locked out.
  44 |   const username = `ratelimit-${uid()}`;
  45 |   for (let i = 0; i < 20; i++) {
  46 |     expect((await bugApi.send('POST', '/api/login', { data: { username, password: 'wrong' } })).status()).toBe(401);
  47 |   }
  48 | 
  49 |   const res = await bugApi.send('POST', '/api/login', { data: { username, password: 'wrong' } });
  50 | 
  51 |   expect(res.status()).toBe(429);
  52 |   expect(await res.json()).toMatchObject({ error: 'too_many_attempts' });
  53 | });
  54 | 
```